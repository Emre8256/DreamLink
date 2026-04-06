```markdown


## Sprint 1 - Hotfix & Survival

### [SEC-01-BE] SecurityConfig permitAll Kapatılması
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/config/SecurityConfig.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/config/JwtAuthenticationFilter.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/config/AuthenticationEntryPointImpl.java
- Mevcut Durum: anyRequest().permitAll nedeniyle korumalı API yüzeyi fiilen açık.
- Hedef: Deny-by-default, whitelist bazlı erişim ve tutarlı 401/403 davranışı.
</context>
<task>
1. SecurityConfig içinde public whitelist tanımı yap (auth register/login, health, swagger) ve diğer tüm /api/** için authenticated kuralı uygula.
2. JwtAuthenticationFilter içinde token parse doğrulamasını sertleştir, invalid token durumunda AuthenticationEntryPoint’e düş.
3. Contract-First: Java Record kullanarak SecurityErrorRecord ve AuthPrincipalRecord tiplerini önce oluştur, sonra filter ve entrypoint dönüşlerini bu sözleşmelere bağla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- permitAll global kullanımını tamamen kaldır.
</constraints>

### [SEC-01-QA] Güvenlik Erişim Matris Testleri
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/test/java/com/example/dreamlink/Dreamlink/security/SecurityAccessMatrixTest.java
- Mevcut Durum: Public/protected endpoint ayrımı otomatik testlenmiyor.
- Hedef: Kimlik doğrulama kurallarını regresyona kapalı hale getirmek.
</context>
<task>
1. MockMvc ile en az 15 endpoint için auth/no-auth test matrisi yaz.
2. Expired token, invalid signature, missing token senaryolarını ayrı test et.
3. Contract-First: Test assertionları için SecurityErrorRecord alanlarını referans alarak response contract doğrulaması yap.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml test -Dtest=SecurityAccessMatrixTest
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Dış ağ bağımlılığı olan test yazma.
</constraints>

### [SEC-02-BE] Hardcoded Secret Temizliği (Java)
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/JwtService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/config/JwtProperties.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/application.properties; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/application-docker.properties; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/application-staging.properties
- Mevcut Durum: Secret yönetimi kod içine gömülü risk taşıyor.
- Hedef: Environment tabanlı güvenli secret yönetimi ve fail-fast.
</context>
<task>
1. JwtService içindeki sabit secret kullanımını kaldır ve JwtProperties üzerinden inject et.
2. Secret yoksa veya minimum entropy koşulunu sağlamıyorsa startup fail-fast hatası üret.
3. Contract-First: Java Record veya Lombok destekli config modeli ile jwt.secret, jwt.accessTtlMs, jwt.refreshTtlMs alanlarını önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Kod içinde hiçbir secret literal bırakma.
</constraints>

### [SEC-02-PY] Hardcoded Secret Temizliği (Matcher) (tamamlandı)
<role>Kıdemli Python Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/matcher/app/main.py; C:/octolabs/Dream-Link-main/matcher/app/settings.py; C:/octolabs/Dream-Link-main/matcher/.env.example
- Mevcut Durum: API anahtarı kod içine düşebiliyor.
- Hedef: Secret sadece env üzerinden okunmalı.
</context>
<task>
1. settings.py içinde environment tabanlı ayar katmanı kur.
2. main.py içinde API key erişimini settings nesnesi üzerinden yap.
3. Contract-First: Pydantic Settings modelini önce oluştur (OPENROUTER_API_KEY, TIMEOUT, RETRY_POLICY).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: pytest C:/octolabs/Dream-Link-main/matcher/tests -q
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Gerçek API key dosyalarda bulunmayacak.
</constraints>

### [SEC-02-DEVOPS] Secret Scan Pipeline (tamamlandı)
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/scripts/secret_scan.ps1; C:/octolabs/Dream-Link-main/.github/workflows/ci.yml
- Mevcut Durum: Secret leak taraması zorunlu CI adımı değil.
- Hedef: Build aşamasında secret sızıntısını bloklamak.
</context>
<task>
1. secret_scan.ps1 içinde regex pattern listesi ile dosya tarama motoru yaz.
2. CI workflow içinde secret scan adımı ekle ve failure durumunda pipeline’ı kır.
3. Contract-First: PowerShell PSCustomObject tabanlı SecretScanFinding şemasını önce tanımla (Pattern, FilePath, LineNo, Snippet).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: powershell -ExecutionPolicy Bypass -File C:/octolabs/Dream-Link-main/scripts/secret_scan.ps1
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Script output’u makinece parse edilebilir olacak.
</constraints>

### [SEC-03-BE] Refresh Token Altyapısı
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V7__refresh_tokens.sql; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/controller/AuthController.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/AuthService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/repository/RefreshTokenRepository.java
- Mevcut Durum: Sessiz yenileme için refresh token katmanı yok.
- Hedef: Rotate/revoke destekli güvenli oturum yaşam döngüsü.
</context>
<task>
1. refresh_tokens tablosunu migration ile oluştur (hash, expires_at, revoked_at, rotated_from).
2. AuthController’da refresh/logout endpointlerini ekle.
3. Contract-First: Java Record şeklinde RefreshTokenRequest, RefreshTokenResponse, LogoutRequest DTO’larını önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Refresh token plaintext saklama yasak.
</constraints>

### [SEC-03-FE] SecureStore + Silent Refresh
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/context/AuthContext.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/auth.ts
- Mevcut Durum: AsyncStorage plaintext token ve tek adım logout akışı var.
- Hedef: SecureStore tabanlı token saklama ve 401 sonrası tekil refresh retry.
</context>
<task>
1. AuthContext ve api.ts içinde AsyncStorage token erişimini SecureStore ile değiştir.
2. 401 durumunda in-flight lock ile refresh endpointine tek istek atıp orijinal isteği retry et.
3. Contract-First: Interface tanımlarını frontend/dreamlink-app/types/auth.ts altında merkezi oluştur (AuthSession, TokenPair, RefreshResponse).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Tokenları AsyncStorage’da tutma.
</constraints>

### [COM-01-FE] Hesabımı Sil UI Akışı
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/profile.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/account.ts
- Mevcut Durum: UI’da delete account akışı yok.
- Hedef: Apple 5.1.1 uyumlu geri döndürülemez kullanıcı aksiyonu.
</context>
<task>
1. profile.tsx içine Hesabımı Sil aksiyonunu ve çift onay modallerini ekle.
2. api.ts içinde deleteMyAccount çağrısını entegre et ve başarılı durumda oturum temizle.
3. Contract-First: Interface tanımlarını frontend/dreamlink-app/types/account.ts altında merkezi oluştur (DeleteAccountPayload, DeleteAccountState, DeleteAccountResult).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Soft-delete söylemi kullanma.
</constraints>

### [COM-01-BE] Hesap Silme Endpointi
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/controller/UserController.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/UserService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/DeleteAccountResponse.java
- Mevcut Durum: /api/users/me için DELETE endpoint bulunmuyor.
- Hedef: Authenticated kullanıcı için hesap silme API’si.
</context>
<task>
1. UserController’a DELETE /api/users/me endpointini ekle.
2. UserService’de transaction içinde fiziksel silme akışını uygula.
3. Contract-First: Java Record şeklinde DeleteAccountResponse veya Void sözleşmesini önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Fiziksel silme veya geri döndürülemez anonimleştirme dışında yol bırakma.
</constraints>

### [COM-01-DB] Hesap Silme Fiziksel Migration ve Deletion Order
<role>Kıdemli DB Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V8__account_delete_cascade.sql; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V1__init.sql
- Mevcut Durum: Kullanıcı silme zinciri circular dependency riski taşıyor.
- Hedef: Döngüsel bağımlılık oluşturmadan sıralı fiziksel silme migrationı.
</context>
<task>
1. Conversations ve messages ilişkisi dahil tüm bağlı tablolar için deletion order analizi yap ve migration içinde sıralı operasyonları kurgula.
2. Önce bağımlı kayıtları güvenli sırayla silen adımları yaz, sonra ana kullanıcı kaydını sil.
3. Contract-First: SQL seviyesinde AccountDeletionContract şemasını oluştur (target_table, delete_order, strategy) ve migration akışını bu tablo/sözleşmeye göre uygula.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml flyway:info
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Soft-delete kesinlikle kullanma.
</constraints>

### [SAFE-01-DB] Block Model Şeması
<role>Kıdemli DB Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V9__user_blocks.sql
- Mevcut Durum: Block ilişkisini tutan tablo yok.
- Hedef: Block/unblock için normalize ve indeksli tablo.
</context>
<task>
1. user_blocks tablosunu unique ve self-block check ile oluştur.
2. blocker_user_id ve blocked_user_id indekslerini ekle.
3. Contract-First: SQL user_blocks contract yorum bloğunda değil tablo metadata/sözleşme satırlarıyla önce sabitle.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml flyway:info
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Aynı kullanıcının kendini bloklaması engellenecek.
</constraints>

### [SAFE-01-BE] Block API ve Sorgu Entegrasyonu
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/entity/UserBlock.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/repository/UserBlockRepository.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/BlockService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/controller/BlockController.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/MatchService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/ChatService.java
- Mevcut Durum: Block uçları ve görünürlük filtreleri eksik.
- Hedef: Block/unblock/list + match/chat dışlama.
</context>
<task>
1. BlockController ve BlockService ile block/unblock/list endpointlerini ekle.
2. Match ve chat sorgularına block filtresini çift yönlü uygula.
3. Contract-First: Java Record tabanlı BlockActionRequest, BlockActionResponse, BlockedUserRecord tiplerini önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- N+1 sorgu oluşturma.
</constraints>

### [SAFE-01-FE] Block UI
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/dream/[id].tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/chat.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/moderation.ts
- Mevcut Durum: UI tarafında block aksiyonu yok.
- Hedef: Kullanıcı bazlı engelleme deneyimi.
</context>
<task>
1. API katmanına blockUser, unblockUser, getBlockedUsers çağrılarını ekle.
2. Dream/chat ekranlarına block menü aksiyonları yerleştir.
3. Contract-First: Interface tanımlarını frontend/dreamlink-app/types/moderation.ts altında merkezi tanımla (BlockedUser, BlockActionPayload, BlockActionResult).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Prop-drilling yerine merkezi state/hook kullan.
</constraints>

### [SAFE-02-DB] Report Şeması
<role>Kıdemli DB Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V10__content_reports.sql
- Mevcut Durum: Report tablosu yok.
- Hedef: Moderasyon pipeline’ını destekleyen şema.
</context>
<task>
1. content_reports tablosunu reason/status/target alanlarıyla oluştur.
2. Sık filtrelenen alanlara indeks ekle.
3. Contract-First: SQL check constraint ile reason/status sözleşmesini ilk adımda tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml flyway:info
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Serbest metin status/reason kullanımını engelle.
</constraints>

### [SAFE-02-BE] Report API ve Moderation Queue
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/entity/ContentReport.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/repository/ContentReportRepository.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/ReportService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/controller/ReportController.java
- Mevcut Durum: Report uçları ve moderation queue yok.
- Hedef: UGC report oluşturma ve inceleme akışı.
</context>
<task>
1. POST /api/reports, GET/PATCH moderation endpointlerini ekle.
2. Role-based erişim kontrolü uygula.
3. Contract-First: Java Record DTO’ları önce tanımla (CreateReportRequest, ReportListItem, ModerationUpdateRequest).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Moderation endpointlerini admin dışında açma.
</constraints>

### [SAFE-02-FE] Report UI Akışı
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/dream/[id].tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/chatbox.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/moderation.ts
- Mevcut Durum: Kullanıcılar report gönderemiyor.
- Hedef: Report modalı ve API entegrasyonu.
</context>
<task>
1. submitReport API çağrısını ekle.
2. Dream/chat ekranlarında reason seçimi ile report modalı oluştur.
3. Contract-First: Interface tanımlarını frontend/dreamlink-app/types/moderation.ts altında merkezi tanımla (ReportReason, SubmitReportPayload, SubmitReportResult).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- reason seçimi zorunlu olacak.
</constraints>

### [SAFE-03-FE] Register EULA Checkbox
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/register.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/auth.ts
- Mevcut Durum: Register ekranında EULA onayı zorunlu değil.
- Hedef: Apple 1.2 uyumlu zorunlu kullanıcı sözleşmesi onayı.
</context>
<task>
1. Register formuna EULA checkbox ve sözleşme linkini ekle.
2. EULA kabul edilmedikçe submit engelle.
3. Contract-First: RegisterRequest interface’ini types/auth.ts içinde eulaAccepted ve eulaAcceptedAt alanlarıyla merkezi güncelle.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- EULA onaysız API çağrısı gönderme.
</constraints>

### [SAFE-03-BE] Register EULA Backend Doğrulaması
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V11__eula_acceptance.sql; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/AuthRequest.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/AuthService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/entity/User.java
- Mevcut Durum: EULA kabulü backendde zorunlu doğrulanmıyor.
- Hedef: Kayıt sırasında yasal onayı server tarafında enforce etmek.
</context>
<task>
1. Migration ile users tablosuna eula_accepted_at alanını ekle.
2. AuthRequest DTO ve AuthService register akışında EULA kontrolünü zorunlu kıl.
3. Contract-First: Java Record şeklinde RegisterContractRecord oluştur ve validation kurallarını burada merkezi tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Implicit EULA kabulü yasak.
</constraints>

### [UI-01-FE] Coming Soon Temizliği
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/premium-upsell.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/profile.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/discover.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/navigation.ts
- Mevcut Durum: Yakında/dead-end butonlar App Review 2.2 riski yaratıyor.
- Hedef: Eylemsiz öğeleri tamamen kaldırmak.
</context>
<task>
1. Yakında etiketli tüm CTA ve route’suz menü öğelerini sil veya gizle.
2. Dead-end route push çağrılarını kaldır.
3. Contract-First: FeatureAvailabilityMap interface’ini types/navigation.ts altında merkezi tanımla ve ekran koşullarını bu map ile yönet.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- UI’da Coming Soon metni bırakma.
</constraints>

### [STORE-01-FE] Store Build Metadata ve Permission Deklarasyonu
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app.json; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/eas.json; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/config.ts
- Mevcut Durum: bundleIdentifier/package/build metadata eksikleri var.
- Hedef: TestFlight ve Play Internal için geçerli metadata ve izin tanımı.
</context>
<task>
1. app.json içine ios/android kimlik ve build alanlarını ekle.
2. Mikrofon/speech izin açıklamalarını düzenle ve android permissions listesinde net tanımla.
3. Contract-First: AppReleaseConfig interface’ini types/config.ts altında merkezi tanımla ve config doğrulamasını bu sözleşme ile yap.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Minimum izin prensibini bozma.
</constraints>

## Sprint 2 - Database & Resilience

### [DB-01-DB] FK/Filtre İndeks Migrationları
<role>Kıdemli DB Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V12__performance_indexes.sql
- Mevcut Durum: Kritik tablolarda full-scan riski yaratan indeks eksikleri var.
- Hedef: Sorgu yolunu performans açısından güvenceye almak.
</context>
<task>
1. dreams/comments/messages/notifications/follows/conversations için hedef indeksleri ekle.
2. İndeks adlarını standartlaştır ve IF NOT EXISTS kullan.
3. Contract-First: SQL IndexContract tablosu veya migration başında sözleşme satırları ile indeks listesini önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml flyway:info
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Rastgele indeks isimlendirmesi yapma.
</constraints>

### [DB-01-BE] Repository Query Refactor
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/repository/DreamRepository.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/repository/ConversationRepository.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/repository/NotificationRepository.java
- Mevcut Durum: Bazı sorgular indeks kullanımını zayıflatıyor.
- Hedef: Yeni indekslerle uyumlu ve düşük maliyetli sorgular.
</context>
<task>
1. Query imzalarını indeks dostu filter/order kombinasyonlarına göre düzenle.
2. Conversation OR desenini optimize et.
3. Contract-First: Java Record projection tiplerini önce tanımla ve repository dönüşlerini bunlara sabitle.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- String birleştirme ile SQL üretme.
</constraints>

### [DB-02-BE] N+1 Kaldırma
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/MatchService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/ChatService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/DreamService.java
- Mevcut Durum: Döngü içi veri erişimleri N+1 oluşturuyor.
- Hedef: Batch/fetch join ile roundtrip azaltımı.
</context>
<task>
1. Döngü içi repository çağrılarını preload map ve toplu sorgulara taşı.
2. Feed/chat/match akışında projection kullan.
3. Contract-First: Java Record response modellerini önce belirle (DiscoverCardRecord, ConversationCardRecord vb.).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- N+1 kalan kod bırakma.
</constraints>

### [DB-03-BE] Fiziksel Silme Servis Akışı
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/UserService.java
- Mevcut Durum: Hesap silme işleminde sıra ve rollback güvencesi net değil.
- Hedef: Geri döndürülemez fiziksel silme.
</context>
<task>
1. Transaction sınırı içinde bağımlı verileri silme sırasına uygun servis akışını yaz.
2. Token/session kayıtlarını temizle.
3. Contract-First: Java Record AccountDeletionPlan tipini önce oluştur ve servis adımlarını bu plana göre işlet.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Soft-delete yasak.
</constraints>

### [DB-03-PS1] Hesap Silme Doğrulama Scripti (tamamlandı)
<role>Kıdemli DB Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/scripts/verify_account_delete.ps1
- Mevcut Durum: Silme sonrası tablo kalıntılarını doğrulayan otomasyon yok.
- Hedef: Fiziksel silmeyi script ile kanıtlamak.
</context>
<task>
1. Test kullanıcı üret, sil, tablo bazlı kalıntı sayımlarını topla.
2. Beklenen 0 sonuçları assert et ve non-zero çıkışta hata ver.
3. Contract-First: PowerShell VerifyRowCountResult şemasını önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: powershell -ExecutionPolicy Bypass -File C:/octolabs/Dream-Link-main/scripts/verify_account_delete.ps1
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Script başarısızlığında exit code 1 döndür.
</constraints>

### [RES-01-BE] Java Timeout/Retry
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/PremiumBillingService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/AiMatcherClientService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/config/HttpClientConfig.java
- Mevcut Durum: Dış çağrılar timeout/retry açısından tutarsız.
- Hedef: 429/5xx için kontrollü retry ve süre sınırı.
</context>
<task>
1. Ortak HttpClient konfigürasyonu ile connect/read timeout tanımla.
2. Retry/backoff politikasını idempotent çağrılar için uygula.
3. Contract-First: Java Record ExternalCallPolicyRecord’u önce oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Timeoutsuz dış çağrı bırakma.
</constraints>

### [RES-01-PY] Python Timeout/Retry
<role>Kıdemli Python Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/matcher/app/main.py; C:/octolabs/Dream-Link-main/matcher/app/settings.py
- Mevcut Durum: LLM çağrılarında retry standardı zayıf.
- Hedef: Deterministik retry policy.
</context>
<task>
1. OpenRouter çağrısını timeout ve retry policy ile sarmala.
2. 429/5xx için jitterlı exponential backoff uygula.
3. Contract-First: Pydantic LlmRetryPolicy modelini önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: pytest C:/octolabs/Dream-Link-main/matcher/tests -q
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Retry üst sınırı 3 deneme olacak.
</constraints>

### [RES-02-DB] PGVector HNSW İndeks Optimizasyonu
<role>Kıdemli DB Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V13__pgvector_hnsw_index.sql
- Mevcut Durum: Vector(384) için optimize HNSW parametreli ANN indeks yok.
- Hedef: Full scan riskini kaldıran parametre optimize edilmiş indeks.
</context>
<task>
1. pgvector extension kontrolü yap ve dreams.embedding için HNSW indeks oluştur.
2. WITH parametreleri olarak m=16 ve ef_construction=64 kullan.
3. Contract-First: SQL VectorIndexContract satırlarını migration başında tanımla (operator_class, m, ef_construction, dimension=384).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml flyway:info
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- HNSW parametreleri m=16 ve ef_construction=64 zorunlu.
</constraints>

### [RES-02-PY] DB Taraflı Vektör Sıralama
<role>Kıdemli Python Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/matcher/app/main.py; C:/octolabs/Dream-Link-main/matcher/app/database.py
- Mevcut Durum: Sıralama işlemi Python belleğinde kalıyor.
- Hedef: ANN indeks kullanan DB ORDER BY ile top-N.
</context>
<task>
1. Match querylerini DB tarafında cosine distance ORDER BY ile çalıştır.
2. candidate_limit ve pagination’ı SQL tarafında uygula.
3. Contract-First: Pydantic MatchQueryRequest/MatchQueryResponse modelini önce oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: pytest C:/octolabs/Dream-Link-main/matcher/tests -q
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- In-memory full sort bırakma.
</constraints>

### [RES-03-BE] Global Exception Envelope
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/config/GlobalExceptionHandler.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/ApiErrorResponse.java
- Mevcut Durum: Hata formatları dağınık.
- Hedef: Tek tip error contract.
</context>
<task>
1. @RestControllerAdvice ile global exception mapping yaz.
2. Validation/auth/runtime hatalarını ortak formata dönüştür.
3. Contract-First: Java Record ApiErrorResponse tipini önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Controller bazlı ad-hoc error body bırakma.
</constraints>

### [RES-03-PY] FastAPI Error Contract
<role>Kıdemli Python Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/matcher/app/main.py
- Mevcut Durum: Exception yanıtları farklı formatta.
- Hedef: Standart error envelope.
</context>
<task>
1. HTTPException ve generic exception handlerlarını tek biçime bağla.
2. traceId üretip response header’a yaz.
3. Contract-First: PyApiErrorResponse modelini önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: pytest C:/octolabs/Dream-Link-main/matcher/tests -q
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Stack trace response body’de dönme.
</constraints>

## Sprint 3 - Frontend State & Real Payments

### [PAY-01-ARCH] RevenueCat Baz Altyapı
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/package.json; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/iap.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/billing.ts
- Mevcut Durum: Gerçek IAP SDK katmanı yok.
- Hedef: RevenueCat ile tek ödeme yolu.
</context>
<task>
1. react-native-purchases bağımlılığını ekle ve iap servis modülünü oluştur.
2. configure/getOfferings/purchase/restore fonksiyonlarını yaz.
3. Contract-First: Interface tanımlarını frontend/dreamlink-app/types/billing.ts altında merkezi oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- İkinci bir IAP SDK entegre etme.
</constraints>

### [PAY-02-FE] Gerçek Premium Satın Alma UI
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/premium-upsell.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/iap.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/billing.ts
- Mevcut Durum: Placeholder butonlar var, gerçek satın alma yok.
- Hedef: Offerings tabanlı purchase akışı.
</context>
<task>
1. Premium ekranında dinamik paket listesi ve seçim state’i oluştur.
2. Purchase sonrası verify endpoint çağrısını tetikle.
3. Contract-First: PremiumScreenState ve PurchaseFlowResult interface’lerini types/billing.ts altında önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Demo akış veya sahte başarı bırakma.
</constraints>

### [PAY-03-FE] Entitlement Senkronu
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/store/useAppStore.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/billing.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/discover.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/matches.tsx
- Mevcut Durum: Premium gate akışı parçalı.
- Hedef: Tek kaynaklı entitlement state.
</context>
<task>
1. Zustand store’da premiumStatus ve entitlements slice ekle.
2. App init ve purchase sonrası status refresh mekanizması kur.
3. Contract-First: Interface tanımlarını types/billing.ts altında merkezi güncelle (PremiumStatus, EntitlementFlags).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Prop-drilling ile entitlement taşıma.
</constraints>

### [PAY-03-BE] Verify/Restore Güvenlik Sertleştirme
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/controller/PremiumController.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/PremiumBillingService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/PurchaseVerifyRequest.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/RestorePurchaseRequest.java
- Mevcut Durum: Doğrulama akışında idempotency ve contract sertliği yetersiz.
- Hedef: Güvenli receipt/subscription doğrulama.
</context>
<task>
1. DTO validasyonlarını platform bazlı zorunluluklara göre sıkılaştır.
2. Transaction ID idempotency koruması ekle.
3. Contract-First: Java Record VerifyPurchaseResponseRecord’u önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Frontend success sinyaline güvenerek premium açma.
</constraints>

### [PAY-04-BE] Store-Native Webhook
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V16__webhook_events.sql; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/controller/PremiumController.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/PremiumBillingService.java
- Mevcut Durum: Webhook doğrulaması custom HMAC ile sınırlı.
- Hedef: Apple JWS + Google RTDN ile store-native doğrulama.
</context>
<task>
1. Apple signed payload ve Google RTDN doğrulama akışlarını ekle.
2. webhook_events tablosu ile event dedup/idempotency uygula.
3. Contract-First: Java Record WebhookEventRecord ve WebhookProcessResultRecord tiplerini önce oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Yalnızca custom secret ile webhook kabul etme.
</constraints>

### [FE-STATE-01-FE] Zustand Normalize ve TTL Cache
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/store/useAppStore.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/store.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/index.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/discover.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/matches.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/chat.tsx
- Mevcut Durum: Local state yoğunluğu ve duplicate fetch var.
- Hedef: Normalize store + TTL tabanlı veri tüketimi.
</context>
<task>
1. Store’u entities/ids yapısına geçir ve fetchedAt/ttl alanları ekle.
2. Ekranları local büyük listelerden store selectorlarına taşı.
3. Contract-First: Interface tanımlarını frontend/dreamlink-app/types/store.ts altında merkezi oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Aynı kaynağı farklı ekranlarda kopya state tutma.
</constraints>

### [FE-STATE-02-FE] Fetch Orkestrasyonu ve Cleanup
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/matches.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/chat.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/dream/[id].tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/websocket.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/store.ts
- Mevcut Durum: mount/focus/ws tetiklemeleri duplicate fetch ve leak riski doğuruyor.
- Hedef: Tek source-of-truth fetch akışı.
</context>
<task>
1. Fetch tetiklerini dedupe eden orkestrasyon helperı yaz.
2. Timer/listener/subscription cleanup eksiklerini kapat.
3. Contract-First: FetchOrchestrationState interface’ini types/store.ts içinde merkezi tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Cleanup’sız useEffect bırakma.
</constraints>

## Sprint 4 - AI Context & Product Core

### [AI-01-BE] Context Retrieval Backend
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/DreamService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/AiMatcherClientService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/repository/DreamRepository.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/DreamInterpretContextRequest.java
- Mevcut Durum: Interpret çağrısı geçmiş rüya bağlamı içermiyor.
- Hedef: RAG için geçmiş rüya context’i matcher’a taşımak.
</context>
<task>
1. Son N rüyayı çeken repository sorgusunu ekle.
2. DreamService’de context toplayıp AiMatcherClientService’e geçir.
3. Contract-First: Java Record DreamInterpretContextRequest/DreamContextItemRecord tiplerini önce oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- PII alanlarını context’e koyma.
</constraints>

### [AI-01-PY] Context-Aware Interpret
<role>Kıdemli Python Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/matcher/app/main.py; C:/octolabs/Dream-Link-main/matcher/app/models.py
- Mevcut Durum: Prompt tek rüya metni ile çalışıyor.
- Hedef: contextDreams ile zengin yorum üretimi.
</context>
<task>
1. Interpret request modeline contextDreams alanını ekle.
2. Prompt builder’da context uzunluk/adet limitini uygula.
3. Contract-First: Pydantic InterpretDreamRequest modelini önce güncelle.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: pytest C:/octolabs/Dream-Link-main/matcher/tests -q
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- context için token bütçesi sınırını zorunlu uygula.
</constraints>

### [AI-02-PY] Hibrit Match Scoring
<role>Kıdemli Python Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/matcher/app/matcher.py; C:/octolabs/Dream-Link-main/matcher/app/main.py; C:/octolabs/Dream-Link-main/matcher/app/settings.py
- Mevcut Durum: Skor modeli tek boyutlu.
- Hedef: Embedding + freshness + behavior hibrit skoru.
</context>
<task>
1. Hibrit skor fonksiyonunu yaz ve mevcut pipeline’a entegre et.
2. Ağırlıkları settings üzerinden yönetilebilir yap.
3. Contract-First: Pydantic MatchScoreBreakdown modelini önce oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: pytest C:/octolabs/Dream-Link-main/matcher/tests -q
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Magic number kullanma.
</constraints>

### [AI-02-BE] Match Fallback Guardrail
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/MatchService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/MatchGenerationResult.java
- Mevcut Durum: Düşük kalite cevapta fallback akışı sınırlı.
- Hedef: Kalite eşiklerinde otomatik güvenli fallback.
</context>
<task>
1. Matcher skor dağılımı için kalite eşiği belirle ve kontrol et.
2. Eşik altında fallback discover üretimini devreye al.
3. Contract-First: Java Record MatchGenerationResult tipini önce tanımla (source, scoreSummary, usedFallback).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Fallbackte N+1 sorgu oluşturma.
</constraints>

### [AI-03-PY] Structured Output ve Prompt Guardrails
<role>Kıdemli Python Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/matcher/app/main.py; C:/octolabs/Dream-Link-main/matcher/app/models.py
- Mevcut Durum: Serbest metin cevap parse kırılganlığı yaratıyor.
- Hedef: Şema zorunlu, güvenli ve parse edilebilir output.
</context>
<task>
1. Interpretation response şemasını tanımla ve endpoint dönüşünü bu şemaya bağla.
2. Parse başarısızlığında deterministic fallback üret.
3. Contract-First: Pydantic InterpretationSchema modelini ilk adımda oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: pytest C:/octolabs/Dream-Link-main/matcher/tests -q
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Şema dışı alan döndürme.
</constraints>

### [RET-01-BE] Retention API Çekirdeği
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V14__retention_tables.sql; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/controller/RetentionController.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/RetentionService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/RetentionDtos.java
- Mevcut Durum: Streak/badge API altyapısı yok.
- Hedef: Retention çekirdeğini API seviyesinde açmak.
</context>
<task>
1. retention tablolarını migrationla oluştur.
2. checkin/streak/badge endpointlerini ekle.
3. Contract-First: Java Record DTO setini önce tanımla (StreakRecord, BadgeRecord, CheckinResultRecord).
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Daily checkin duplicate artışına izin verme.
</constraints>

### [RET-01-FE] Retention UI Yüzeyleri
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/(tabs)/index.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/notifications.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/retention.ts
- Mevcut Durum: Streak ve badge ekran yüzeyleri yok.
- Hedef: Retention datalarını kullanıcıya görünür kılmak.
</context>
<task>
1. Home ekranına streak kartı ve checkin butonu ekle.
2. Bildirim/profil alanında badge listesi göster.
3. Contract-First: Interface tanımlarını frontend/dreamlink-app/types/retention.ts altında merkezi oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Hardcoded retention değeri kullanma.
</constraints>

### [RET-02-BE] Feature Flag ve Experiment Assignment
<role>Kıdemli Backend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/resources/db/migration/V15__feature_flags.sql; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/controller/ExperimentController.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/service/ExperimentService.java; C:/octolabs/Dream-Link-main/backend/Dreamlink/src/main/java/com/example/dreamlink/Dreamlink/dto/ExperimentDtos.java
- Mevcut Durum: Deterministik assignment ve flag API yok.
- Hedef: Server-side experiment altyapısı.
</context>
<task>
1. feature_flags ve experiment_assignments şemasını migrationla oluştur.
2. Deterministik hash tabanlı assignment endpointi yaz.
3. Contract-First: Java Record AssignmentResponseRecord ve FeatureFlagRecord tiplerini önce tanımla.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: mvn -f C:/octolabs/Dream-Link-main/backend/Dreamlink/pom.xml clean compile
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Kullanıcıya her istekte farklı varyant verme.
</constraints>

### [RET-02-FE] Experiment Client Entegrasyonu
<role>Kıdemli Frontend Mühendisisin. Temiz kod ve Contract-First prensiplerine sıkı sıkıya bağlısın.</role>
<context>
- İlgili Dosyalar: C:/octolabs/Dream-Link-main/frontend/dreamlink-app/services/api.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/store/useAppStore.ts; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/app/_layout.tsx; C:/octolabs/Dream-Link-main/frontend/dreamlink-app/types/experiments.ts
- Mevcut Durum: Client tarafında assignment tüketimi yok.
- Hedef: App initte assignment alıp feature gate uygulamak.
</context>
<task>
1. getExperimentAssignments çağrısını api katmanına ekle.
2. useAppStore’da experiments slice oluştur.
3. Contract-First: Interface tanımlarını frontend/dreamlink-app/types/experiments.ts altında merkezi oluştur.
</task>
<dead_code_policy>
- Bu task'ı tamamlarken gereksiz hale gelen, referansı kopan eski fonksiyon ve dosyaları (dead code) ASLA yorum satırına alma. Kodu şişirmemek için doğrudan SİL.
</dead_code_policy>
<verification>
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npm --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app run lint
- Kodu yazdıktan sonra doğrulamak için terminalde şu komutu çalıştır: npx --prefix C:/octolabs/Dream-Link-main/frontend/dreamlink-app tsc --noEmit
- Hata alırsan, kendi hatanı analiz et ve kodu düzelterek komutu tekrar çalıştır.
</verification>
<constraints>
- Asla açıklama, özet veya tavsiye yazma. Doğrudan eyleme geç.
- Yalnızca güncellenmiş kod bloklarını ver.
- Assignment yüklenmeden deney özelliklerini aktif etme.
</constraints>
```