import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import wsService from '../../services/websocket';
import { useAppStore } from '../../store/useAppStore';
// chat.tsx
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyConversations, deleteConversation, ConversationResponse, formatRelativeTime } from '../../services/api';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};
const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
    else onCancel?.();
  } else {
    Alert.alert(title, message, [
      { text: 'İptal', style: 'cancel', onPress: onCancel },
      { text: 'Evet', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const Avatar = ({ url, name, size = 52 }: { url: string | null; name: string; size?: number }) => {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: '#F1F3FF' }}
      />
    );
  }
  return (
    <LinearGradient
      colors={['#A78BFA', '#7E6BFF']}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#fff' }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
};

// ─── Chat Card ────────────────────────────────────────────────────────────────
const ChatCard = ({
  item,
  isSelected,
  onSelect,
  onPress
}: {
  item: ConversationResponse;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.card, isSelected && styles.cardSelected]}
    activeOpacity={0.82}
    onLongPress={() => onSelect(item.id)}
    onPress={() => {
      if (isSelected) {
        onSelect(item.id); // Toggle selection
      } else {
        onPress();
      }
    }}
  >
    {/* Avatar */}
    <View style={styles.avatarWrap}>
      <Avatar url={item.otherUser.avatarUrl} name={item.otherUser.nickname} size={54} />
    </View>

    {/* Text */}
    <View style={styles.cardText}>
      <View style={styles.nameRow}>
        <Text style={styles.cardName}>{item.otherUser.nickname}</Text>
        <Text style={styles.cardTime}>
          {item.lastMessageAt ? formatRelativeTime(item.lastMessageAt) : 'Yeni'}
        </Text>
      </View>
      <Text style={styles.cardSub} numberOfLines={1}>
        {item.lastMessage ? item.lastMessage : '✨ Sohbet başlatıldı'}
      </Text>
    </View>

    {/* Chevron or Check */}
    <View style={styles.chevronWrap}>
      {isSelected ? (
        <Ionicons name="checkmark-circle" size={22} color="#7E6BFF" />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#C1C8FF" />
      )}
    </View>
  </TouchableOpacity>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.empty}>
    <LinearGradient
      colors={['rgba(126,107,255,0.08)', 'rgba(126,107,255,0.02)']}
      style={styles.emptyIcon}
    >
      <Ionicons name="chatbubbles-outline" size={40} color="#C1C8FF" />
    </LinearGradient>
    <Text style={styles.emptyTitle}>Henüz sohbet yok</Text>
    <Text style={styles.emptySub}>
      Discover'da rüyaları beğen, karşılıklı eşleşince sohbet başlar.
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMyConversations();
      setConversations(data);
    } catch (e) {
      console.error('Chat list error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const setUnreadMessages = useAppStore(state => state.setUnreadMessages);

  // WebSocket ile yeni mesaj geldiğinde listeyi yenile
  useEffect(() => {
    wsService.connect();
    const handler = (msg: any) => {
      // msg.chatId ve msg içeriği backend ile uyumlu olmalı
      if (msg && msg.chatId) {
        useAppStore.getState().addMessage(msg.chatId, msg);
        // Listeyi anlık yenile (son mesajın güncellenmesi için)
        load();
        // Bildirim noktasını göster
        setUnreadMessages(true);
      }
    };
    wsService.subscribe('/user/queue/messages', handler);
    return () => wsService.unsubscribe('/user/queue/messages');
  }, [load, setUnreadMessages]);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
      // Mesajlar sayfasına girildiğinde bildirimi temizle
      setUnreadMessages(false);
    }, [load, setUnreadMessages])
  );

  const handleDelete = () => {
    if (!selectedId) return;

    showConfirm(
      'Sohbeti Sil',
      'Bu sohbeti ve tüm mesajları silmek istediğine emin misin? Bu işlem geri alınamaz.',
      async () => {
        try {
          setLoading(true);
          await deleteConversation(selectedId);
          setConversations(prev => prev.filter(c => c.id !== selectedId));
          setSelectedId(null);
        } catch (error) {
          showAlert('Hata', 'Sohbet silinemedi.');
        } finally {
          setLoading(false);
        }
      },
      () => setSelectedId(null)
    );
  };

  const handleSelect = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null); // Deselect
    } else {
      setSelectedId(id); // Select new
    }
  };

  const handlePressCard = (item: ConversationResponse) => {
    if (selectedId) {
      handleSelect(item.id);
    } else {
      router.push({
        pathname: '/chatbox',
        params: {
          conversationId: item.id,
          name: item.otherUser.nickname,
          avatar: item.otherUser.avatarUrl || ''
        }
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7E6BFF" />
      </View>
    );
  }

  return (
    <View style={[styles.root]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>Mesajlar</Text>
          <Text style={styles.headerSub}>Rüya sohbetleri</Text>
        </View>

        {selectedId ? (
          <TouchableOpacity
            style={[styles.headerIcon, { backgroundColor: 'rgba(255,107,107,0.1)' }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#7E6BFF" />
          </View>
        )}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <ChatCard
            item={item}
            isSelected={selectedId === item.id}
            onSelect={handleSelect}
            onPress={() => handlePressCard(item)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#7E6BFF"
          />
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFF' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1FF',
    backgroundColor: '#F9FAFF',
  },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#7E6BFF', fontWeight: '600', marginTop: 2 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(126,107,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#7E6BFF',
    backgroundColor: '#F5F3FF',
  },

  avatarWrap: { position: 'relative', marginRight: 14 },


  cardText: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  cardTime: { fontSize: 12, color: '#C1C8FF', fontWeight: '600' },
  cardSub: { fontSize: 13, color: '#8A8CA8', lineHeight: 18 },

  chevronWrap: { marginLeft: 8 },

  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(126,107,255,0.1)',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#2D2D3A', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#8A8CA8', textAlign: 'center', lineHeight: 21 },
});
