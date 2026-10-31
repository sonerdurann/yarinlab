# Test sonuçları (31 Ekim 2026)

| Paket | Komut | Sonuç |
|---|---|---|
| Ortak çekirdek (simülasyon, içerik, AI doğrulama) | `npm test -w @yarinlab/shared` | 67/67 geçti |
| Sunucu (gerçek PostgreSQL: auth, yetki/IDOR, kayıt, AI, öğretmen, rapor, PDF/CSV) | `npm test -w @yarinlab/server` | 44/44 geçti |
| Web (store, akışlar, ayarlar, ses, asset manifesti) | `npm test -w @yarinlab/web` | 109/109 geçti |
| Uçtan uca (Playwright, üretim derlemesi + API; masaüstü 1366×768 ve tablet 1024×768 dokunmatik) | `npm -w @yarinlab/web run e2e` | 12/12 geçti* |
| Tip denetimi | `npm run typecheck` | hatasız |
| Üretim derlemesi | `npm run build` | başarılı |

\* Son tam çalıştırmada 10/12 geçti. Kalan iki test (aynı senaryo, iki görünüm) bütçe sayacının animasyon sırasındaki ara değerini okuyordu. Test, ekran okuyucunun okuduğu gerçek değeri karşılaştıracak şekilde düzeltildi ve yeniden çalıştırıldığında 2/2 geçti. Tam paket bu düzeltmeden sonra yeniden çalıştırılmadı.

## Uçtan uca senaryolar
1. Misafir: görev zinciri, yıldızlı puan, sonraki görev, gün döngüsü, inşa, yeniden yükleme ile kalıcılık
2. Klavye: “Bölge listesine geç”, pencere açma, Esc ile kapatma
3. Erişilebilirlik: axe (WCAG 2 A/AA) ana ekran ve karar penceresinde ciddi/kritik ihlal yok
4. Yedi modülün ilk görevi oynanır; Meclis kanıt kartları
5. Öğretmen sınıf açar → izin akışı tamamlanmadan öğrenci katılamaz → öğrenci kodla katılır ve oynar → öğretmen ilerlemeyi görür, PDF ve CSV indirir, AI önerisi alır
6. Ağ kesintisi: kayıt ve deneme kuyrukta bekler, bağlantı gelince sunucuya gider

## E2E'nin bulduğu ve düzeltilen hatalar
- Pencere tıklamaları alttaki haritaya geçip görevi sıfırlıyordu.
- Karar sonrası klavye odağı kayboluyordu.
- Yeşil düğmeler ve modül renkleri WCAG AA kontrastının altındaydı.
- Bildirim kutusu “İnşa” düğmesini örtüyordu.

## Test edilmeyenler
Gerçek cihazlar, ekran okuyucu ile insan testi, canlı LLM çağrısı, canlı HTTPS yayını, gerçek kullanıcı testi (bkz. KNOWN_ISSUES.md).
