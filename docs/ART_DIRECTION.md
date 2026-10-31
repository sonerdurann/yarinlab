# Görsel sanat yönetimi (kılavuz §04-§06)

Stil: 2.5D izometrik, temiz geometri, yumuşak gölge, okunur pastel yüzeyler. Harita modern ve davetkâr; arayüz kurumsal ve sakin. Aşırı gerçekçi 3D, retro pixel-art ve fotogerçekçi öğeler ana stilde karıştırılmaz.

Palet: gece mavisi · iklim yeşili · nane · su mavisi · enerji altını · kırık beyaz (CSS tokenları `src/index.css`).

| Varlık | Standart |
|---|---|
| Zeminler | 1 temel 2:1 izometrik oran, tek tileset grubu |
| Binalar | Aynı ışık yönü, yumuşak gölge |
| Simgeler | Kalınlığı tutarlı SVG/PNG, küçük boyutta okunur |
| Arayüz | Köşe 10-14 px, sade yüzey, yeterli kontrast |
| Metin | Noto Sans / sistem sans, Türkçe karakter desteği |
| Animasyon | 150-250 ms geçiş, 1-2 sn karar efekti |

## Özel üretilecekler
- YarinLab logo ve simgesi; okul kimliği; kantin tabelası; yapay zekâ rehber karakteri.
- Güneş paneli, batarya, yağmur bahçesi, geri dönüşüm alanı için eksik izometrik parçalar.
- Dönemler arası değişimi gösteren iki renklendirme/tasarım varyasyonu.
Kenney sanat diliyle aynı perspektif, palet, kontur ve gölge. Üçüncü taraf eserleri yalnızca benzerlik için yeniden üretilmez; lisans/kaynak kaydı tutulur.

## Asset alış-veriş listesi (hepsi CC0)
| Öncelik | Paket | Bağlantı |
|---|---|---|
| ZORUNLU | Isometric Tiles City (128) | https://kenney.nl/assets/isometric-tiles-city |
| ZORUNLU | Isometric Tiles Buildings (128) | https://kenney.nl/assets/isometric-tiles-buildings |
| ZORUNLU | Isometric Tiles Landscape (128) | https://kenney.nl/assets/isometric-tiles-landscape |
| DESTEK | Isometric Tiles Vehicles (540) | https://kenney.nl/assets/isometric-tiles-vehicles |
| ZORUNLU | UI Pack (430) | https://kenney.nl/assets/ui-pack |
| DESTEK | Interface Sounds (100) | https://kenney.nl/assets/interface-sounds |
| DESTEK | Game Icons (105) | https://kenney.nl/assets/game-icons |
| OPSİYON | Input Prompts (1500) | https://kenney.nl/assets/input-prompts |

## İşleme adımları
1. Üretici sayfasından ZIP indir (ücretsiz devam yolu). 2. `design/third_party/kenney/` altında aç; ZIP ve lisans orijinal kalsın. 3. `tilemap.txt` ve örnek haritalardan gerçek tile boyutunu öğren; 128×64 varsayma. 4. Özel objeler şeffaf PNG; isimler İngilizce ASCII, tireli. 5. Kare ikonlar 128×128 kaynak; görsele metin gömme. 6. Her paketi örnek haritada perspektif/gölge/renk/piksel yoğunluğu/lisans yönünden karşılaştır. 7. Çok küçük dosya varsa atlas + manifest üret.

Manifest örneği: `{"id":"building_school","file":"/assets/custom/school.png","source":"custom-compatible-art","license":"team-owned","anchor":{"x":0.5,"y":1},"tileFootprint":[3,3],"interactive":true}`
