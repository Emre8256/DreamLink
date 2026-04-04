```markdown
# sprints.md (v2)

## Program Hedefi
Dream-Link’i **NO-GO** durumundan çıkarıp:
1. App Store / Google Play reddi riskini kapatmak,
2. İlk 1.000 kullanıcıda çökme ve kritik performans kilitlenmelerini önlemek,
3. Premium gelir akışını gerçek mağaza ödeme altyapısına geçirmek,
4. AI çekirdeğini ölçülebilir ürün değerine taşımak.

## Aciliyet Haritası (Kırmızıdan Yeşile)
- **Sprint 1 (KIRMIZI) - Hotfix & Survival**
- **Sprint 2 (TURUNCU) - Database & Resilience**
- **Sprint 3 (SARI) - Frontend State & Real Payments**
- **Sprint 4 (YEŞİL) - AI Context & Product Core**

## Task Şablonu
Her task aşağıdaki formatla tanımlanır:
- **[Ticket-ID] Başlık**
- **Etki Alanı:** (Backend-Java / Frontend-React / Matcher-Python / DB / DevOps / QA / Product)
- **Sorun (Neden yapıyoruz?):** Rapor bulgusuna dayalı net gerekçe.
- **Kabul Kriteri (Acceptance Criteria):** Test edilebilir, ölçülebilir teslim şartları.
- **Tahmini Zorluk:** Fibonacci (1, 2, 3, 5, 8, 13)

---

## Sprint 1 - Hotfix & Survival (KIRMIZI)
**Sprint Amacı:** Mağaza reddi ve kritik güvenlik açıklarını kapatmak.  
**Çıkış Kriteri (Sprint Exit):** Security baseline + Apple kritik guideline uyumu + Trust & Safety minimum set + Beta-uygun UI.

### [SEC-01] SecurityConfig permitAll Kapatılması
**Etki Alanı:** Backend-Java  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: global `permitAll` nedeniyle korumalı endpointlerde gerçek yetkilendirme garantisi yok.  
**Kabul Kriteri (Acceptance Criteria):**
- Varsayılan güvenlik politikası deny-by-default olacak.
- Public endpoint whitelist’i net tanımlanacak (ör. login/register/health).
- User, chat, matches, premium, notifications endpointleri JWT olmadan 401/403 dönecek.
- Endpoint auth matrix otomasyon testi eklenecek (en az 15 kritik endpoint).  
**Tahmini Zorluk:** 5

### [SEC-02] Hardcoded Secret ve API Key Temizliği
**Etki Alanı:** Backend-Java / Matcher-Python / DevOps  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: kod tabanında hardcoded JWT secret ve AI provider key bulundu.  
**Kabul Kriteri (Acceptance Criteria):**
- Kod tabanında hardcoded secret kalmayacak.
- Secret’lar sadece environment/secret manager üzerinden yüklenecek.
- Secret eksikse uygulama fail-fast ile açılmayacak.
- CI secret scan kuralı build kıracak şekilde zorunlu olacak.  
**Tahmini Zorluk:** 5

### [SEC-03] JWT Storage ve Session Lifecycle Hardening
**Etki Alanı:** Frontend-React / Backend-Java  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: token plaintext tutuluyor, refresh token mimarisi eksik.  
**Kabul Kriteri (Acceptance Criteria):**
- Mobil token saklama SecureStore/Keychain/Keystore ile şifreli yapılacak.
- Access + Refresh token akışı uygulanacak.
- 401 sonrası sessiz refresh denenecek; başarısızsa kontrollü logout yapılacak.
- Token rotation + revoke senaryoları testlerle doğrulanacak.  
**Tahmini Zorluk:** 8

### [COM-01] Apple 5.1.1 Hesap Silme Uçtan Uca
**Etki Alanı:** Frontend-React / Backend-Java / DB / Compliance  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: UI’da “Hesabımı Sil” yok, backend’de account delete endpoint yok.  
**Kabul Kriteri (Acceptance Criteria):**
- Profil/Ayarlar’dan erişilebilir açık “Hesabımı Sil” akışı olacak.
- Backend authenticated delete endpoint sağlanacak.
- Sonuç modeli iki yoldan biri olacak:
  - **Cascade Delete (fiziksel tamamen silme)** veya
  - **Geri döndürülemez anonimleştirme**.
- Seçilen model hukuki metinlerle ve ürün copy’siyle kullanıcıya açık bildirilecek.
- App Review için ekran görüntüsü + test adımları hazırlanacak.  
**Tahmini Zorluk:** 8

### [SAFE-01] Block User Mekanizması
**Etki Alanı:** Backend-Java / Frontend-React / DB  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: kullanıcı engelleme akışı yok, social safety gereksinimi eksik.  
**Kabul Kriteri (Acceptance Criteria):**
- Block/unblock endpointleri ve UI aksiyonları eklenecek.
- Bloklu kullanıcı discover/match/chat sonuçlarından dışlanacak.
- Kullanıcı blok listesini görebilecek ve yönetebilecek.
- Block event’leri audit log’a yazılacak.  
**Tahmini Zorluk:** 5

### [SAFE-02] Report/Abuse Mekanizması
**Etki Alanı:** Backend-Java / Frontend-React / Moderation Ops  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: report/şikayet işlevi yok.  
**Kabul Kriteri (Acceptance Criteria):**
- Dream, yorum, profil, mesaj için report oluşturulabilecek.
- Sabit reason taxonomy uygulanacak (spam, taciz, şiddet vb.).
- Moderation queue API’si ve internal review akışı olacak.
- Kritik reportlar için öncelik bayrağı/iş akışı tanımlanacak.  
**Tahmini Zorluk:** 8

### [SAFE-03] Register Ekranına UGC EULA Onay Kutusu
**Etki Alanı:** Frontend-React / Backend-Java / Product-Legal  
**Sorun (Neden yapıyoruz?):** Apple Guideline 1.2 gereği UGC uygulamalarında açık kullanıcı sözleşmesi (EULA/ToS) kabulü zorunlu; mevcut akışta görünür onay yok.  
**Kabul Kriteri (Acceptance Criteria):**
- Register ekranına zorunlu “EULA/Kullanıcı Sözleşmesi’ni kabul ediyorum” checkbox eklenecek.
- EULA linki erişilebilir ve okunabilir olacak.
- Checkbox işaretlenmeden kayıt submit edilemeyecek.
- Backend kayıt isteğinde EULA kabul flag/timestamp doğrulanacak ve saklanacak.  
**Tahmini Zorluk:** 5

### [UI-01] “Yakında” Placeholder Temizliği (Beta App Kuralı)
**Etki Alanı:** Frontend-React / Product  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: profil/ayar/discover/premium akışlarında “Yakında” ve ölü butonlar var; Apple Guideline 2.2 (Beta App) reddi riski doğurur.  
**Kabul Kriteri (Acceptance Criteria):**
- Tüm “Yakında/Coming Soon” metinli, eylemsiz veya dead-end butonlar kaldırılacak ya da tamamen gizlenecek.
- Ekranda görünen her CTA’nın gerçek ve test edilebilir bir akışı olacak.
- QA checklist’te “dead button = 0” koşulu zorunlu olacak.  
**Tahmini Zorluk:** 3

### [STORE-01] Release Konfigürasyonu (Bundle/Package/Build/Permission)
**Etki Alanı:** Frontend-React / Release Engineering  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: bundleIdentifier, package, buildNumber/versionCode ve izin beyanları eksik/riski yüksek.  
**Kabul Kriteri (Acceptance Criteria):**
- iOS bundleIdentifier ve Android package tanımlı olacak.
- buildNumber/versionCode sürümleme politikası belirlenecek ve otomasyona bağlanacak.
- Mikrofon/speech izin açıklamaları mağaza uyumlu ve kullanıcıya açık olacak.
- Android permission set minimum gerekli izin prensibine göre sabitlenecek.  
**Tahmini Zorluk:** 3

---

## Sprint 2 - Database & Resilience (TURUNCU)
**Sprint Amacı:** Veritabanı kilitlenme risklerini ve dış servis kırılganlığını kapatmak.  
**Çıkış Kriteri (Sprint Exit):** Kritik query path’lerde indeks + N+1 azaltımı + timeout/retry + vector indexing tamam.

### [DB-01] FK ve Kritik Sorgu İndekslerinin Tamamlanması
**Etki Alanı:** DB / Backend-Java  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: comments/messages/notifications/dreams/follows/conversations tarafında indeks eksikleri full scan riski doğuruyor.  
**Kabul Kriteri (Acceptance Criteria):**
- Eksik FK ve sık filtrelenen kolonlar için migration indeksleri eklenecek.
- Önce/sonra `EXPLAIN ANALYZE` karşılaştırması raporlanacak.
- Kritik endpointlerde p95 query latency en az %40 iyileşecek.  
**Tahmini Zorluk:** 5

### [DB-02] N+1 Sorgu Desenlerinin Kaldırılması
**Etki Alanı:** Backend-Java  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: match/feed/chat akışlarında tekrarlı sorgu desenleri var.  
**Kabul Kriteri (Acceptance Criteria):**
- En az 3 kritik endpointte N+1 pattern kaldırılacak (projection/fetch strategy/batch query).
- DB roundtrip sayısı metrik bazında düşürülecek.
- Performans regresyon testleri pipeline’a eklenecek.  
**Tahmini Zorluk:** 8

### [DB-03] Hesap Silme Veri Politikası (COM-01 ile Entegre)
**Etki Alanı:** Backend-Java / DB / Compliance  
**Sorun (Neden yapıyoruz?):** Hesap silmede uyumluluk ve veri bütünlüğü için tek, kesin ve geri döndürülemez model zorunlu.  
**Kabul Kriteri (Acceptance Criteria):**
- COM-01 ile aynı model uygulanacak:
  - **Cascade Delete (fiziksel tamamen silme)** veya
  - **Geri döndürülemez anonimleştirme**.
- Seçilen model için tüm ilişkisel tabloların veri yaşam döngüsü sözleşmesi çıkarılacak.
- “Silme sonrası tekrar erişim” teknik olarak imkansız olacak.
- Hukuki/audit doğrulama dokümanı üretilecek.  
**Tahmini Zorluk:** 8

### [RES-01] Java Dış Çağrılarında Timeout/Retry/Backoff
**Etki Alanı:** Backend-Java  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: store doğrulama ve dış HTTP çağrılarında timeout/retry standardı eksik.  
**Kabul Kriteri (Acceptance Criteria):**
- Tüm dış HTTP çağrılarında connect/read timeout zorunlu olacak.
- 429/5xx için exponential backoff retry politikası uygulanacak.
- Circuit-breaker ve idempotent güvenli fallback kuralları tanımlanacak.
- Timeout/retry metrikleri dashboard’da izlenecek.  
**Tahmini Zorluk:** 8

### [RES-02] Matcher Sıralama Optimizasyonu + PGVector ANN İndeksi
**Etki Alanı:** Matcher-Python / DB  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: in-memory sıralama ölçekte CPU/latency patlatıyor; vector sütunu indekssiz kalırsa full scan riski oluşur.  
**Kabul Kriteri (Acceptance Criteria):**
- Sıralama ve aday seçimi Python belleğinden DB/vector query tarafına taşınacak.
- `Vector(384)` sütunu için migration ile ANN indeks zorunlu:
  - `CREATE INDEX ... USING hnsw` **veya**
  - `CREATE INDEX ... USING ivfflat`.
- İndeks parametreleri (lists/ef_search vb.) benchmark ile ayarlanacak.
- p95 matcher latency hedefi sağlanacak ve yük test raporu sunulacak.  
**Tahmini Zorluk:** 13

### [RES-03] Standard Error Contract ve Global Exception Katmanı
**Etki Alanı:** Backend-Java / Matcher-Python  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: hata yönetimi dağınık, merkezi standart zayıf.  
**Kabul Kriteri (Acceptance Criteria):**
- Ortak error envelope (code, message, traceId, retriable) uygulanacak.
- Backend global exception handler + matcher exception middleware devrede olacak.
- Incident triage için correlation-id ile log izlenebilirliği sağlanacak.  
**Tahmini Zorluk:** 5

---

## Sprint 3 - Frontend State & Real Payments (SARI)
**Sprint Amacı:** Mock premium akışını gerçek IAP gelir akışına çevirmek, istemci fetch israfını düşürmek.  
**Çıkış Kriteri (Sprint Exit):** Gerçek satın alma + restore + entitlement + stabilize state.

### [PAY-01] IAP Teknik Yolunun Kesinleştirilmesi (Native IAP vs RevenueCat)
**Etki Alanı:** Product / Frontend-React / Backend-Java  
**Sorun (Neden yapıyoruz?):** Mevcut premium akış placeholder; gerçek store purchase akışı yok.  
**Kabul Kriteri (Acceptance Criteria):**
- Tek ödeme mimarisi seçilecek ve dokümante edilecek.
- SKU/product mapping iOS-Android parity ile tamamlanacak.
- Sandbox/TestFlight/Internal test planı finalize edilecek.  
**Tahmini Zorluk:** 3

### [PAY-02] Gerçek Satın Alma Akışının Client Uygulaması
**Etki Alanı:** Frontend-React  
**Sorun (Neden yapıyoruz?):** Premium CTA şu an gerçek store satın alma tetiklemiyor.  
**Kabul Kriteri (Acceptance Criteria):**
- Premium ekranı gerçek package listesi ve satın alma başlatma akışını çalıştıracak.
- Başarı/iptal/hata durumları kullanıcıya doğru yansıtılacak.
- Restore purchase akışı mağaza gereksinimlerine uygun çalışacak.  
**Tahmini Zorluk:** 8

### [PAY-03] Receipt Verify ve Entitlement Senkronu
**Etki Alanı:** Backend-Java / Frontend-React  
**Sorun (Neden yapıyoruz?):** Satın alma güvenliği ve premium yetkilerinin tutarlılığı için backend verify şart.  
**Kabul Kriteri (Acceptance Criteria):**
- Purchase sonrası verify endpoint zorunlu tetiklenecek.
- Entitlement state UI’da anlık güncellenecek.
- Expired/canceled/active geçişleri webhook + polling kombinasyonu ile tutarlı kalacak.
- Negatif testler: fake receipt/replay payload senaryoları.  
**Tahmini Zorluk:** 8

### [PAY-04] Store-Grade Webhook Doğrulama
**Etki Alanı:** Backend-Java  
**Sorun (Neden yapıyoruz?):** Sadece custom HMAC yaklaşımı mağaza-native imza doğrulama seviyesi için yetersiz.  
**Kabul Kriteri (Acceptance Criteria):**
- Apple signed payload/JWS doğrulaması uygulanacak.
- Google RTDN doğrulama zinciri uygulanacak.
- Idempotency + dedup mekanizması ile aynı event tekrar işlenmeyecek.  
**Tahmini Zorluk:** 13

### [FE-STATE-01] Zustand Refactor ve Normalized Store
**Etki Alanı:** Frontend-React  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: mount/focus/ws kaynaklı tekrar fetch ve state dağınıklığı var.  
**Kabul Kriteri (Acceptance Criteria):**
- Feed/discover/matches/chat için normalized state slice’ları oluşturulacak.
- TTL/stale-while-revalidate stratejisi uygulanacak.
- Duplicate network request oranı telemetri ile anlamlı biçimde düşürülecek.  
**Tahmini Zorluk:** 8

### [FE-STATE-02] Fetch Orkestrasyonu ve Lifecycle Cleanup
**Etki Alanı:** Frontend-React  
**Sorun (Neden yapıyoruz?):** Çoklu tetikleyiciler ve eksik cleanup render/ağ maliyetini artırıyor.  
**Kabul Kriteri (Acceptance Criteria):**
- Ekran bazında tek source-of-truth fetch orkestrasyonu uygulanacak.
- Timer/listener/subscription cleanup eksikleri kapatılacak.
- p95 interaction latency ve battery/network kullanımı iyileştirilecek.  
**Tahmini Zorluk:** 5

---

## Sprint 4 - AI Context & Product Core (YEŞİL)
**Sprint Amacı:** AI kalitesini context-aware seviyeye taşıyıp retention çekirdeğini aktive etmek.  
**Çıkış Kriteri (Sprint Exit):** Geçmiş bağlam kullanan AI + ölçülebilir ürün metrik iyileşmesi.

### [AI-01] RAG/Memory Tabanlı Dream Interpretation
**Etki Alanı:** Matcher-Python / Backend-Java / DB  
**Sorun (Neden yapıyoruz?):** Rapor bulgusu: yorum akışı tek rüya metni ile sınırlı, kullanıcı geçmişi bağlama katılmıyor.  
**Kabul Kriteri (Acceptance Criteria):**
- Kullanıcı geçmiş rüyalarından retrieval context eklenecek.
- Prompt context budget ve güvenlik (PII minimization) kuralları uygulanacak.
- A/B testte yorum kalitesi memnuniyet metriği iyileşecek.  
**Tahmini Zorluk:** 13

### [AI-02] Match Scoring Model Zenginleştirme
**Etki Alanı:** Matcher-Python / Backend-Java  
**Sorun (Neden yapıyoruz?):** Basit skor yaklaşımı kalite ve cold-start performansını sınırlıyor.  
**Kabul Kriteri (Acceptance Criteria):**
- Embedding + davranış + freshness ağırlıklı hibrit skor modeli uygulanacak.
- Offline evaluation set ile precision/recall metrikleri raporlanacak.
- Kalite düşüşünde fallback scoring devreye girecek.  
**Tahmini Zorluk:** 8

### [AI-03] Structured Output ve Prompt Guardrails
**Etki Alanı:** Matcher-Python  
**Sorun (Neden yapıyoruz?):** Serbest metin çıktılar parse kırılganlığı ve kalite sapması üretiyor.  
**Kabul Kriteri (Acceptance Criteria):**
- Structured output schema zorunlu hale getirilecek.
- Prompt injection ve güvenlik guardrail testleri eklenecek.
- Parse error oranı hedef eşik altına indirilecek.  
**Tahmini Zorluk:** 5

### [RET-01] Retention/Gamification API Çekirdeği
**Etki Alanı:** Backend-Java / Frontend-React / Product Analytics  
**Sorun (Neden yapıyoruz?):** Ürün çekirdeğinde sürdürülebilir retention mekanikleri sınırlı.  
**Kabul Kriteri (Acceptance Criteria):**
- Daily streak/milestone/re-engagement API kontratı çıkarılacak.
- Frontend’de en az 2 retention yüzeyi canlıya alınacak.
- Event taxonomy analytics pipeline ile uyumlu olacak.  
**Tahmini Zorluk:** 8

### [RET-02] Experimentation ve Telemetry Framework
**Etki Alanı:** Backend-Java / Frontend-React / Data  
**Sorun (Neden yapıyoruz?):** Ürün değişikliklerinin etkisi ölçülmeden ölçeklenme riski var.  
**Kabul Kriteri (Acceptance Criteria):**
- Feature flag + experiment assignment altyapısı kurulacak.
- Core KPI’lar (D1 retention, paywall conversion, crash-free sessions) canlı izlenecek.
- Sprint sonunda metrik bazlı release recommendation üretilecek.  
**Tahmini Zorluk:** 5

---

## Sprintler Arası Bağımlılıklar
- Sprint 1 güvenlik ve mağaza uyumu kapanmadan Sprint 3 ödeme canlıya alınmaz.
- COM-01 çıktısı Sprint 2 DB-03 veri politikasıyla birebir aynı modelde çalışır.
- Sprint 2 performans/resilience baseline tamamlanmadan Sprint 4 context-heavy AI genişletilmez.
- Sprint 3 telemetry çıktıları Sprint 4 deney tasarımının zorunlu girdisidir.

## Release Go/No-Go Kriterleri (v2)
- permitAll yok, hardcoded secret yok, secure token lifecycle aktif.
- Apple 5.1.1 hesap silme uçtan uca canlı ve doğrulanmış.
- Block/Report + Register EULA onayı canlı.
- UI’da “Yakında”/dead-button sayısı = 0.
- Gerçek IAP akışı sandbox/internal testte doğrulanmış.
- PGVector için ANN indeks migration’ı (hnsw/ivfflat) production’da uygulanmış.
- p95 API ve matcher latency hedefleri sağlanmış.
- Crash-free ve kritik incident oranları kabul eşiği altında.
```
