# Test sonuçları (31 Ekim 2026)

| Paket | Komut | Sonuç |
|---|---|---|
| Ortak çekirdek (simülasyon, içerik, AI doğrulama, rehber modları, 4 seviyeli kampüs) | `npm test -w @yarinlab/shared` | 72/72 geçti |
| Sunucu (gerçek PostgreSQL: auth, yetki/IDOR, kayıt, AI + mod alanı, öğretmen, hesap ayarları, rapor, PDF/CSV) | `npm test -w @yarinlab/server` | 47/47 geçti |
| Web (store, harita v2, kayıt göçü, profil, uyarılar, ayarlar, ses, asset manifesti) | `npm test -w @yarinlab/web` | 116/116 geçti |
| Uçtan uca (Playwright, üretim derlemesi + gerçek API; masaüstü 1366×768, tablet 1024×768 dokunmatik, geniş 1920×1080) | `npm -w @yarinlab/web run e2e` | 25 testin 24'ü tek koşuda geçti* |
| Tip denetimi | `npm run typecheck` | hatasız |
| Üretim derlemesi | `npm run build` | başarılı |

\* Tek seferde tam koşu (3 görünüm, 25 test, 14,8 dk): 24 geçti, 1 zaman aşımı (masaüstü kanvas tıklama testinde ikinci kamera ortalaması sırasında tarayıcı kare üretmedi). Test tek kamera ortalamasıyla sadeleştirildi; ardından her görünümde ikişer kez çalıştırıldı: 6/6 geçti. Sadeleştirilmiş paketin tamamı yeniden tek seferde çalıştırılmadı.
Headless Chromium'da yazılımsal WebGL ile harita ≈22 FPS çalışır; gerçek cihaz FPS ölçümü yapılmadı.

## Uçtan uca senaryolar
1. Misafir: görev zinciri, yıldızlı puan, sonraki görev, gün döngüsü, inşa, yeniden yükleme ile kalıcılık
2. Klavye: “Bölge listesine geç”, pencere açma, Esc ile kapatma
3. Erişilebilirlik: axe (WCAG 2 A/AA) ana ekran ve karar penceresinde ciddi/kritik ihlal yok
4. Yedi modülün ilk görevi oynanır; Meclis kanıt kartları
7. Harita: bölge bilgi kartı (klavye listesiyle), kampüs seviye 2'ye geliştirilir, sel katmanı, kıyıya geçiş, su altı katmanı, şehre dönüş
8. Karakter ve rehber: Yarı ipucu verir; karakter oluşturucuda takma ad kaydedilir
10. Harita tıklaması: fare ve dokunmayla kampüs bilgi kartı; sürükleme kart açmaz
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
