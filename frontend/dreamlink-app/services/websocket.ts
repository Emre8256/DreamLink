import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://172.20.10.3:8081/api';
const WS_URL = API_BASE.replace(/\/api$/, '').replace(/^http/, 'http') + '/ws';
const RECONNECT_DELAY = 5000;
/** onConnect tetiklendikten sonra STOMP iç state'inin oturması için bekleme süresi (ms). */
const CONNECT_SETTLE_DELAY = 150;

export type WebSocketEventHandler = (payload: any) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: { [key: string]: StompSubscription } = {};
  /** subscribe() çağrısında kayıt edilen handler'lar (bağlantı olmadan da tutulur). */
  private handlers: { [destination: string]: WebSocketEventHandler[] } = {};
  /** Bağlantı kurulmadan gelen subscribe isteklerinin kuyruğu. */
  private pendingSubscriptions: string[] = [];
  /** Kendi izlediğimiz bağlantı durumu — onConnect sonrası true, kopunca false. */
  private isConnected = false;
  private reconnectTimeout: any = null;

  // ─── Bağlantı ─────────────────────────────────────────────────────────────

  /** AsyncStorage'dan token okuyarak STOMP bağlantısı başlatır. */
  async connect() {
    if (this.client && this.isConnected) return;

    let token = '';
    try {
      token = (await AsyncStorage.getItem('auth_token')) || '';
    } catch (e) {
      console.warn('[WS] Token okunamadı:', e);
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 0, // manuel yönetim
      connectHeaders: token ? { Authorization: 'Bearer ' + token } : {},

      onConnect: () => {
        this.isConnected = true;
        console.log('[WS] STOMP Connected ✅');

        /**
         * KRİTİK: @stomp/stompjs, onConnect callback'ini tetiklediği anda
         * kütüphanenin iç state'i (client.connected) henüz true olmayabilir.
         * Kısa bir setTimeout ile race condition önlenir.
         */
        setTimeout(() => {
          // Kuyrukta bekleyen abonelikleri gerçekleştir
          const pending = [...this.pendingSubscriptions];
          this.pendingSubscriptions = [];
          pending.forEach(dest => this._doSubscribe(dest));

          // Handler'ı kayıtlı ama henüz abone olunamamış hedefler
          Object.keys(this.handlers).forEach(dest => {
            if (!this.subscriptions[dest]) this._doSubscribe(dest);
          });
        }, CONNECT_SETTLE_DELAY);
      },

      onStompError: (frame) => {
        const msg = frame.headers['message'] || 'bilinmeyen hata';
        console.error(
          `[WS] STOMP Error: "${msg}" | connected=${this.client?.connected} | active=${this.client?.active}`,
        );
        this.handleDisconnect();
      },

      onWebSocketClose: () => {
        console.warn(
          `[WS] STOMP Disconnected ⚠️ | connected=${this.client?.connected} | active=${this.client?.active}`,
        );
        this.handleDisconnect();
      },

      onDisconnect: () => {
        console.warn('[WS] onDisconnect tetiklendi.');
        this.handleDisconnect();
      },
    });

    this.client.activate();
  }

  private handleDisconnect() {
    this.isConnected = false;
    // Abonelik referanslarını temizle — yeniden bağlantıda tekrar oluşturulacak
    this.subscriptions = {};
    if (this.client) this.client.deactivate();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => this.connect(), RECONNECT_DELAY);
  }

  // ─── Subscribe ─────────────────────────────────────────────────────────────

  /**
   * Gerçek STOMP subscribe işlemi — sadece bağlıyken çağrılır.
   * Hata olursa 1 saniye aralıklarla en fazla 3 kez retry yapar.
   */
  private _doSubscribe(destination: string, attempt = 1) {
    // Çift guard: hem kendi flag'imiz hem de kütüphanenin .connected property'si
    if (!this.client || !this.isConnected || !this.client.connected) {
      console.warn(`[WS] _doSubscribe ertelendi (henüz hazır değil): ${destination}`);
      if (!this.pendingSubscriptions.includes(destination)) {
        this.pendingSubscriptions.push(destination);
      }
      return;
    }
    if (this.subscriptions[destination]) return; // Zaten abone

    try {
      this.subscriptions[destination] = this.client.subscribe(
        destination,
        (msg: IMessage) => {
          try {
            const payload = JSON.parse(msg.body);
            (this.handlers[destination] || []).forEach(h => h(payload));
          } catch (parseErr) {
            console.error('[WS] Mesaj parse edilemedi:', parseErr);
          }
        },
      );
      console.log(`[WS] Abone olundu: ${destination}`);
    } catch (err) {
      console.error(`[WS] subscribe hatası (deneme ${attempt}): ${destination}`, err);
      if (attempt < 3) {
        setTimeout(() => this._doSubscribe(destination, attempt + 1), 1000);
      } else {
        console.error(`[WS] ${destination} için maksimum deneme sayısına ulaşıldı.`);
      }
    }
  }

  /**
   * Belirtilen destination'a abone ol ve handler kaydet.
   * Bağlantı henüz yoksa veya race window'undaysa kuyruğa alınır,
   * onConnect → 150ms delay sonrası otomatik işlenir.
   */
  subscribe(destination: string, handler?: WebSocketEventHandler) {
    if (!this.handlers[destination]) this.handlers[destination] = [];
    if (handler) this.handlers[destination].push(handler);

    if (this.isConnected && this.client && this.client.connected) {
      // Tam bağlı — hemen abone ol
      this._doSubscribe(destination);
    } else {
      // Bağlantı henüz yok ya da settle delay içindeyiz — kuyruğa ekle
      if (!this.pendingSubscriptions.includes(destination)) {
        this.pendingSubscriptions.push(destination);
        console.log(`[WS] Kuyruğa alındı (bağlantı bekleniyor): ${destination}`);
      }
    }
  }

  unsubscribe(destination: string) {
    try {
      if (this.subscriptions[destination]) {
        this.subscriptions[destination].unsubscribe();
        delete this.subscriptions[destination];
      }
    } catch (e) {
      console.warn(`[WS] unsubscribe hatası: ${destination}`, e);
    }
    delete this.handlers[destination];
    this.pendingSubscriptions = this.pendingSubscriptions.filter(d => d !== destination);
  }
}

const wsService = new WebSocketService();
export default wsService;
