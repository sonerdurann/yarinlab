# Simülasyon varsayımları ve bilimsel dayanaklar

**İlke:** Oyundaki değerler bir *eğitim simülasyonudur*. Kaynaklar etkinin **yönünü** ve kavramı destekler; **büyüklükler oyun dengesi için seçilmiş varsayımlardır**. Ekranda üç etiket kullanılır: **Simülasyon** (kurallarla hesaplanır), **Varsayım** (belgelenmiş varsayıma dayanır), **Ölçülmüş** (okulda gerçekten ölçülen veri). Ürün kg CO₂e hesaplamaz; emisyon *birimsiz göreli endekstir*.

Kod: `packages/shared/src/sim/`. Kaynak kimlikleri: `packages/shared/src/content/index.ts` (`SCIENCE_SOURCES`) ve `docs/sources/SOURCES.md`.

## Zaman ve hava
| Kural | Değer (varsayım) | Dayanak |
|---|---|---|
| Mevsim uzunluğu | 8 oyun günü; 4 mevsim = 1 oyun yılı | Oyun temposu |
| Hava olasılıkları | Mevsime göre ağırlıklı; yaz: sıcak dalga 18, kuraklık 12 / 100 | Kurgusal Akdeniz kenti; sıcak uçların artması yönü IPCC AR6 WG1/WG2 |
| İlk 3 gün | Uç olay yok | Öğretici amaç |
| Rastgelelik | mulberry32, `rngFor(seed, day)`; tohum kayıtta | Tekrarlanabilirlik |

## Enerji (saatlik, `energy.ts`)
| Kural | Değer | Dayanak |
|---|---|---|
| Günlük talep | 900 kWh × mevsim (kış 1,15; yaz 1,1) × hava (sıcak dalga 1,3) × (1 − verimlilik) | Varsayım; soğutma/ısıtma talebi artışı yönü IEA |
| Talep profili | 08-16 ağır, 17-21 orta, gece düşük | Okul + yerleşim varsayımı |
| Güneş | kW × sin(gün eğrisi 06-18) × hava (açık 1, bulut 0,45, yağmur 0,25, fırtına 0,12) × mevsim (yaz 1, kış 0,5) | Gündüz/bulut bağımlılığı yönü IEA Renewables |
| Rüzgâr | kW × kapasite faktörü (rüzgârlı 0,65, fırtına 0,45, güneşli 0,15) | Varsayım |
| Depolama | %90 gidiş-dönüş verimi | Varsayım |
| Şebeke sınırı | 70 kW; fırtına 50, sıcak dalga 55 | Kesinti mekaniği için varsayım |
| Enerji göstergesi | görev deltası + yenilenebilir pay × 0,15 − kesinti saati × 3 | Oyun göstergesi |
| Eski kesinti riski | 15 + pay × 0,9 − depolama × 22 (yalnızca Enerji 1 açıklaması) | Varsayım |

## Atık, gıda, kıyı
| Kural | Değer | Dayanak |
|---|---|---|
| Atık yükü | gıda atığı + diğer atık × (1 − ayırma) − yapıların ayırdığı | Varsayım; hiyerarşi UNEP GWMO 2024 |
| Sefer | ⌈yük / 10 kg⌉ | Varsayım |
| Kıyı riski | 20 + yük × 0,5 − habitat bakımı × 0,4 | Kara kaynaklı kirlilik yönü UNEP |
| Ekosistem | 100 − kıyı riski × 0,5 − sızdırmaz × 0,3 + yeşil × 0,4 + habitat × 0,2 | Oyun göstergesi |

## Şehir riskleri
| Kural | Değer | Dayanak |
|---|---|---|
| Taşkın riski | 40 + sızdırmaz × 0,5 − yeşil × 0,35 − yağmur hasadı × 0,45 | Geçirgen yüzeyin etkisi yönü IPCC AR6 WG2 |
| Sıcak stres riski | 25 + sızdırmaz × 0,5 − yeşil × 0,6 − gölge | Yeşil alan/gölge serinletir: UNEP “Beating the Heat” |
| Dayanıklılık | 100 − (taşkın + sıcak + enerji riski) / 3 | Oyun göstergesi |
| Fırtına hasarı | risk eşiği (fırtına 45, yağmur 65) aşılırsa (risk − eşik) × 25 puan | Varsayım |
| Su kullanımı | 40 m³ × hava/mevsim − tasarruf − (su göstergesi − 81) × 0,3 | Varsayım; su verimliliği yönü UNESCO WWDR |

## Emisyon endeksi
`ham = şebeke kWh × 1 + atık kg × 6 + (100 − toplu ulaşım payı) × 3`; endeks = 100 × ham / başlangıç hamı. **Birimsizdir, kg CO₂e değildir.** Ağırlıklar yalnızca üç kaynağın göreli katkısını göstermek için seçilmiştir (sektör katkılarının varlığı IPCC AR6 WG3).

## Ekonomi ve yapılar
Günlük gelir 300 puan; yapı maliyeti, bakım ve seviye etkileri `buildings.ts` dosyasında tablo olarak durur. Bütçe gerçek para değildir.

## Puanlama
- Sonuç: gösterge yönlerine göre normalize değişim (50 ± 200 × ortalama göreli değişim).
- Gerekçe: uzunluk, nedensellik bağlacı ve kanıt sözcükleri (sezgisel; öğretmen gerekçeleri ayrıca okur).
- Denge: %10'dan fazla kötüleşen her gösterge −30.
- Okuryazarlık endeksi: tamamlanan görev, modül çeşitliliği, karşılaştırma ve gerekçe ortalaması.

## Gerçek dünya ölçümleri
Öğrenci ve öğretmenlerin girdiği değerler **Ölçülmüş** olarak etiketlenir. Başlangıç ile sonuç farkı raporlanır, ancak çevresel fayda veya karbon azaltımı olarak sunulmaz.
