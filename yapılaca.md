### Token Verimliliği İçin Yapılması Gerekenler

* **`.claudeignore` Dosyası Oluştur:** Proje kök dizinine bu dosyayı ekle; `node_modules`, `.git`, `dist`, `build`, `venv` ve büyük log dosyalarını buraya yaz. Claude'un bu devasa dosyaları her mesajda tarayıp token tüketmesini engellemiş olursun.
* **`CLAUDE.md` Dosyasını Doldur:** Proje yapısını, kodlama stilini ve test komutlarını buraya bir kez yaz. Her seferinde "React kullanıyorum, Tailwind olsun" gibi talimatlar vererek token harcama.
* **`/model haiku` Komutunu Kullan:** Yazım hataları, basit isimlendirme değişiklikleri veya sadece dosya içeriğini okuma gibi "düşünme" gerektirmeyen işler için Haiku modeline geç. En az tokeni bu model yakar.
* **`/clear` ve `/compact` Rutini:** Bir görev (örneğin bir fonksiyonun yazımı) bittiğinde hemen `/clear` yazarak hafızayı (context) sıfırla. Eğer geçmişe ihtiyacın varsa `/compact` yazarak Claude'un konuşmayı özetleyip gereksiz kısımları atmasını sağla.
* **Doğrudan Dosya Hedefle:** "Tüm projeye bak" yerine `claude "src/components/Header.tsx dosyasını incele"` diyerek hedefi daralt. Gereksiz dosya okumaları kotanı hızla bitirir.
* **`opus-plan` Modu:** Mimari kararlar veya karmaşık hata ayıklama süreçlerinde `/model opus-plan` kullan. Bu mod, planlamayı pahalı (Opus), uygulamayı ise orta maliyetli (Sonnet) modelle yaparak verim sağlar.

### Gereksiz ve Token Tüketen Hatalar

* **Büyük Veri Setleri:** İçinde binlerce satır olan JSON veya CSV dosyalarını Claude'a okutma. Verinin sadece yapısını (ilk 5 satırını) ver.
* **Nezaket ve Sohbet:** "Teşekkürler", "Harika oldu", "Nasılsın?" gibi ifadelerden kaçın. Claude Code bir terminal aracıdır; her karakter token, her token sınıra yaklaşmak demektir.
* **Görsel Paylaşımı:** Mecbur kalmadıkça kod ekran görüntüsü paylaşma. Kod metinlerini kopyala-yapıştır yap. Görsel analizi, metin analizine göre kat kat daha fazla token harcar.
* **Döngüye Giren Otonom Görevler:** "Sabaha kadar çalışsın" mantığıyla `claude -y` (otomatik onay) verip ucu açık görevler bırakma. Claude bir hatada döngüye girerse, sen uyandığında 2 saatlik değil, haftalık limitin bile bitmiş olabilir.
* **Opus'u Her Şeyde Kullanmak:** Basit bir CSS değişikliği veya HTML etiketi düzeltmek için en üst modeli (Opus) kullanmak en büyük kaynak israfıdır. Modeli işin zorluğuna göre manuel değiştir.