# Test sonuçları (31 Ekim 2026)

| Paket | Komut | Sonuç |
|---|---|---|
| Ortak çekirdek (simülasyon, içerik, AI doğrulama, rehber modları, 4 seviyeli kampüs) | `npm test -w @yarinlab/shared` | 72/72 geçti |
| Sunucu (gerçek PostgreSQL: auth, yetki/IDOR, kayıt, AI + mod alanı, öğretmen, hesap ayarları, rapor, PDF/CSV) | `npm test -w @yarinlab/server` | 47/47 geçti |
| Web (store, harita v2, kayıt göçü, profil, uyarılar, ayarlar, ses, asset manifesti) | `npm test -w @yarinlab/web` | 116/116 geçti |
| Uçtan uca (Playwright, üretim derlemesi + API; masaüstü 1366×768 ve tablet 1024×768 dokunmatik) | `npm -w @yarinlab/web run e2e` | 16/16 geçti* |
| Tip denetimi | `npm run typecheck` | hatasız |

\* Görsel yeniden tasarımdan sonraki çalıştırmalar: tam paket 13/16; tablet üst çubuğu ve zaman aşımları düzeltildikten sonra misafir paketi 11/12; erişilebilirlik testi (taramadan önce açılış animasyonlarının bitmesi beklenir) her iki görünümde 2/2. Sınıf senaryoları (4 test) son tam çalıştırmada geçti. Tüm paket bu son düzeltmelerden sonra tek seferde yeniden çalıştırılmadı.
Headless Chromium'da yazılımsal WebGL ile harita ≈22 FPS çalışır; gerçek cihaz FPS ölçümü yapılmadı.

## Uçtan uca senaryolar
1. Misafir: görev zinciri, yıldızlı puan, sonraki görev, gün döngüsü, inşa, yeniden yükleme ile kalıcılık
2. Klavye: “Bölge listesine geç”, pencere açma, Esc ile kapatma
3. Erişilebilirlik: axe (WCAG 2 A/AA) ana ekran ve karar penceresinde ciddi/kritik ihlal yok
4. Yedi modülün ilk görevi oynanır; Meclis kanıt kartları
7. Harita: bölge bilgi kartı (klavye listesiyle), kampüs seviye 2'ye geliştirilir, sel katmanı, kıyıya geçiş, su altı katmanı, şehre dönüş
8. Karakter ve rehber: Yarı ipucu verir; karakter oluşturucuda takma ad kaydedilir
9. Öğretmen 9 ekran: Öğrencilerim + karar analizi, Değerlendirme sonuçları grafiği, Raporlar
5. Öğretmen sınıf açar → izin akışı tamamlanmadan öğrenci katılamaz → öğrenci kodla katılır ve oynar → öğretmen ilerlemeyi görür, PDF ve CSV indirir, AI önerisi alır
6. Ağ kesintisi: kayıt ve deneme kuyrukta bekler, bağlantı gelince sunucuya gider

## E2E'nin bulduğu ve düzeltilen hatalar
- Pencere tıklamaları alttaki haritaya geçip görevi sıfırlıyordu.
- Karar sonrası klavye odağı kayboluyordu.
- Yeşil düğmeler ve modül renkleri WCAG AA kontrastının altındaydı.
- Bildirim kutusu “İnşa” düğmesini örtüyordu.

## Test edilmeyenler
Gerçek cihazlar, ekran okuyucu ile insan testi, canlı LLM çağrısı, canlı HTTPS yayını, gerçek kullanıcı testi (bkz. KNOWN_ISSUES.md).
