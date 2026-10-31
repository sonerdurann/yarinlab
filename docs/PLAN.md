# YarinLab – Ana Plan (kılavuz §01-§04, §14, §16, §18-§20)

## Ürün
6-8. sınıf öğrencilerinin iklimle bağlantılı kararlar verdiği, sonuçları ortak bir şehir simülasyonunda gördüğü web tabanlı eğitim oyunu. Görsel dil: modern 2.5D izometrik.
Hikâye: 2040'tan gelen bir mesaj öğrenciyi bugünkü okulunun geleceğini değiştirmeye çağırır. İyi çözüm tek metrikle değil, gerekçeli dengeyle değerlendirilir.

## Kapsam kilidi
| Faz | İçerik |
|---|---|
| **P0 (dondurulmuş)** | 1 oynanabilir kantin görevi; 32×32 harita; temel sonuç paneli; 3 karar; iki gelecek; fallback açıklama; öğretmen özeti; kaynak/lisans sayfası |
| P1 | Enerji ve atık senaryosu; gelişmiş öğretmen paneli; AI rehberi (sunucu tarafı) |
| P2 | 7 tam bölge; gelişmiş simülasyon; sınıf ve okul yönetimi |

Aktif hotspotlar: Okul, Kantin, Enerji, Atık. Şehir, Tarım, Kıyı "Yakında" (görünür, "Henüz açılmadı" mesajı).
"Tamamı çalışıyor" iddiası yalnızca test edilmiş işlevler için kullanılır.

## Kullanıcılar
- Öğrenci (11-14): 8-12 dk görev, iki gelecek sahnesi, geri alma.
- Öğretmen: ön/son ölçüm, görev raporu, rubrik, çıktılar.
- Okul yöneticisi: toplu gıda atığı ölçümü, sınıf bazlı izleme.

## Öğrenme çıktıları
- L1 Gıda israfının çevre, bütçe ve sosyal etkileri arasında neden-sonuç ilişkisi kurar.
- L2 En az iki çözüm seçeneğini veri ve gerekçe ile karşılaştırır.
- L3 Çevresel kararların ödünleşimlerini açıklar; tek metriğin yetmediğini kavrar.
- L4 Gerçek okulda ölçülebilir atık azaltma önerisi geliştirir.
- L5 Simülasyon sonucu ile gerçek saha verisini ayırt eder.
İlke: her modülde görev → karar → sonuç → AI/kural tabanlı açıklama → yeni durumda transfer. Bilgi soruları tek başına ilerleme sağlamaz.

## Yedi modül
| # | Bölge | Karar | Ortak etki | Faz |
|---|---|---|---|---|
| 01 | Son Tabak | porsiyon, stok, öğün üretimi | atık, bütçe, memnuniyet | P0 |
| 02 | Enerji Adası | güneş, rüzgâr, batarya | enerji, bütçe, emisyon göstergesi | P1 |
| 03 | Döngü Ustaları | önleme, yeniden kullanım, ayırma | atık sistemi maliyeti, kaynak kullanımı | P1 |
| 04 | KrizKenti | yeşil alan, yağmur suyu, altyapı | su, risk, refah, bütçe | P2 |
| 05 | Karbon Dedektifleri | ürün iddiası, yaşam döngüsü analizi | tüketim davranışı / bilgi puanı | P2 |
| 06 | Mavi Nöbet | kıyı atığı, habitat yönetimi | kıyı ekosistem riski | P2 |
| 07 | Gelecek Meclisi | kanıtla müzakere, ortak karar | öğrenme/karar gerekçesi puanı | P2 |

**Çapraz bağ kuralı:** gıda atığı miktarı değişince atık modülünün toplama/işleme yükü değişir (`wasteLoadKg = foodWasteKg + otherSchoolWasteKg; collectionNeed = ceil(wasteLoadKg / assumedCollectionCapacityKg)`; kapasite simülasyon varsayımıdır ve ekranda dipnotla belirtilir). Enerjide depolama olmadan yenilenebilir payı artınca kesinti riski yükselir. Her çapraz kural ayrı tanımlanır, kaynaklandırılır, test edilir.

## Mimari (§14)
React UI (HUD/kararlar/rapor/erişilebilirlik) · Phaser scenes (harita, sprite, efekt, hotspot) · DecisionEngine (seçenek→geçerli değişim, deterministik) · ClimateEngine (kaynak durumu, kısıt kontrolü) · AI Tutor (açıklama/soru/yansıtma, API yedeği var) · Store (oturum, sürüm, öğretmen raporu; MVP yerel).
React ↔ Phaser paylaşımı EventBus değil ortak store adapter ile. Model anahtarı istemci paketine asla konmaz; Cloudflare Worker/Pages Functions secret kullanılır. P0 model servisi olmadan bitebilir.

## Veri modeli (§16)
`Resources {budget, foodWasteKg, energyScore, waterScore, wellbeing}` · `Choice {id,label,deltas,tradeoff}` · `Scenario {id,version,baseline,choices,learningOutcomeIds,evidenceRefs}` · `DecisionResult {scenarioId,choiceId,before,after,reasoning?,modelVersion}`. Atık ≥ 0; skorlar 0..100. Aynı seed ve koşullar saklanır.

## Simülasyon dürüstlüğü (§19)
- Çapraz kural arayüzde: Dünya durumu, karar sonucu, iki gelecek ve Atık paneli (docs/decision-log/006).
- Temsili sonuç tablosu (30 kg başlangıç; A 29 / B 20 / C 18 kg; bütçe 12.000 → 11.900 / 11.300 / 12.200; memnuniyet 75 → 65 / 87 / 58) mekanik gösterimi içindir; saha deneyi veya karbon iddiası değildir.
- Oyun göstergesi ≠ gerçek dünya; saha verisi gerçek tartım ile kayıtlanır; emisyon yalnızca doğrulanmış ürün-bazlı katsayı ve sistem sınırı varsa üretilir; "atık kg" ile "senaryo etki puanı" ayrı.
- Küresel istatistikler (UNEP Food Waste Index 2024) ürünün kanıtlanmış etkisi olarak sunulmaz.

## Öğrenci akışı (§20)
00:00 giriş (2040 mesajı) → 00:45 dünya (okul, kantin) → 02:00 kantin kararı → 04:00 geri bildirim (gerekçe, AI/fallback) → 05:30 karşılaştırma (başka kararla yeniden dene) → 07:00 gerçek görev (okul için öneri).
Görev tamamlama: (1) bir seçenek seçilip simülasyon çalışır, (2) ilk karar gerekçelendirilir, (3) farklı seçeneğin sonucu karşılaştırılır, (4) simülasyon–gerçek ölçüm farkı sorusu cevaplanır.
İlk görev metni: "Bugün okulumuzun yemekhanesinde 280 öğrenci için öğün hazırlanıyor. Son bir haftadan alınmış örnek olayda tabak artıkları ve hazırlık fazlası önemli bir sorun. Tek hedefin atığı sıfırlamak değil; öğrencilerin ihtiyacını karşılayarak kaynakları daha akıllıca kullanmak."

## Yapay zekâ (§18)
Kullanım: açıklama, ipucu (en çok 2 kısa soru), uyarlama, öğretmen özeti. Sözleşme: `OUTPUT {summary, tradeoff, question1, question2, sourceIds}`; sayısal değerler yalnızca doğrulanmış motor sonucundan; kgCO₂e uydurulmaz. İstemler sunucuda; yanıt JSON şemasıyla doğrulanır; 5-8 sn gecikmede fallback; rate limit, bütçe kotası, kısa yanıt, cache. Serbest sohbet yok.

## Gizlilik (§24)
P0'da ad, fotoğraf, tam konum, e-posta, sağlık verisi toplanmaz. Sınıf raporu anonim oturum / kurum kodu. Gerçek okul uygulamasında kurum/veli izni ve KVKK ayrıca. Her asset için paket, URL, lisans, indirme tarihi kaydı. API anahtarı repo, public dosya ve ekran görüntüsünde bulunmaz.
