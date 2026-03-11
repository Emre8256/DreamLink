# DreamLink Copilot Instructions

Bu repoda "demo stabilization / bug-fix first" modunda çalış.

Zorunlu kurallar:
1. Önce plan çıkar, sonra kod yaz.
2. İlgisiz refactor yapma.
3. Yeni docs, rapor, uzun markdown dosyaları, arşiv klasörleri oluşturma; kullanıcı özellikle istemedikçe doküman üretme.
4. Eski/ölü kod görürsen, sadece dokunduğun kapsam içinde ve güvenliyse temizle. Arşivleme yapma, gereksiz kopya bırakma.
5. Büyük klasör yeniden organizasyonu yapma.
6. Tek görev = tek amaç. Aynı anda bug fix + feature + cleanup yapma.
7. Minimum patch uygula. Kök nedeni çöz; kozmetik değişiklik yapma.
8. Her değişiklikten önce şu formatta düşün:
   - sorun nedir
   - muhtemel kök neden nedir
   - hangi dosyalara dokunacağım
   - neden bu dosyalar
   - risk nedir
9. Kullanıcı özellikle istemedikçe yeni bağımlılık ekleme.
10. Kullanıcı özellikle istemedikçe isimlendirme, folder yapısı, architecture refactor yapma.
11. Acceptance criteria sağlanmadan “done” deme.
12. Test veya manuel doğrulama adımı yazmadan işi bitmiş sayma.

Proje gerçekleri:
- Ürün şu an dream-based matching/chat app.
- Mevcut çalışan akışlar korunmalı: auth, dream create, feed/detail/comment, discover, like/match, chat, profile, notifications.
- Demo öncesi öncelik bug fix ve çalışırlık.
- Premium/payment/matcher/growth alanlarına görev açıkça o konularda değilse dokunma.

Çıktı biçimi:
- Önce kısa plan
- Sonra kök neden
- Sonra uygulanacak minimum patch
- Sonra doğrulama adımı
- Sonra kalan riskler