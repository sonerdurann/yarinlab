# Kılavuz uyum tablosu (docs/kilavuz.pdf, 29 sayfa, §01–§28)

Durum: ✅ uygulandı ve test edildi · 🟡 kısmen / sınırlı · ⛔ bu ortamda yapılamadı (bkz. KNOWN_ISSUES.md)

| § | Kılavuz maddesi | Uygulamadaki karşılığı | Durum |
|---|---|---|---|
| 01 | Phaser 4.2.1 + React + TS + Vite; Tiled JSON; Kenney; önce yerel senaryo sonra güvenli AI | `apps/web` (Phaser 4.2.1 sabit), `world_alpha.json`, Kenney CC0 atlasları, `apps/server/src/ai` | ✅ |
| 01 | P0: 32×32 harita, Okul/Kantin/Enerji/Atık; Son Tabak tam akış; çapraz etki; öğretmen ekranı; AI yedeği | Tümü + P1/P2: 7 bölge açık, 35 görev | ✅ |
| 02 | 2040 mesajı; bütçe/su/enerji/atık/refah dengesi; gerekçeli denge puanı | Çizgi roman giriş (`Intro.tsx`), puan = sonuç %40 + gerekçe %35 + denge %25 | ✅ |
| 02 | Öğrenci 8-12 dk görev, iki gelecek, geri alma | Görev akışı, “İki geleceği karşılaştır”, “Başka yol dene” | ✅ |
| 02 | Öğretmen: ön/son ölçüm, görev raporu, rubrik, çıktılar | Ön/son test, sınıf raporu, rubrik, CSV/PDF | ✅ |
| 02 | Okul yöneticisi: toplu gıda atığı ölçümü, sınıf bazlı izleme | Öğretmen panelinde “Okul özeti” (`/api/school/overview`), g/öğrenci/gün | ✅ |
| 02 | L1–L5 kazanımları; görev→karar→sonuç→açıklama→transfer | `LEARNING_OUTCOMES` (L1–L5 + modül kazanımları), transfer sorusu her görevde | ✅ |
| 03 | Yedi modül tek dünyada; çapraz kurallar ayrı tanımlı, kaynaklı, test edilmiş | `packages/shared/src/sim`, `SIMULATION_ASSUMPTIONS.md`, `sim.test.ts` | ✅ |
| 04 | 2.5D izometrik stil kilidi; tutarlı ışık/gölge; köşe 10-14 px; Türkçe destekli yazı; 150-250 ms geçiş | Kenney + aynı dilde özel parçalar; arayüz çocuk dostu temaya güncellendi (yuvarlak köşeler 14-26 px, Nunito/Baloo 2) | 🟡 köşe yarıçapı çocuk dostu tasarım için büyütüldü (karar 013) |
| 04 | Özel üretim: logo, rehber karakter, güneş paneli, batarya, yağmur bahçesi, geri dönüşüm alanı; iki dönem varyasyonu | Logo, maskot “Yarı”, 18 kod-üretimli doku (manifestte), Bugün/2040 dönem görünümü | ✅ |
| 05 | Kenney City/Buildings/Landscape/UI Pack (zorunlu) | İndirildi, lisanslar `public/assets/kenney/*/License.txt` | ✅ |
| 05 | Vehicles, Interface Sounds, Game Icons (destek) | Ağ politikası kenney.nl'i engelliyor; araç/ses/simge kodla üretildi | ⛔→🟡 |
| 06 | ZIP'ler orijinal; gerçek ölçüler; manifest | `design/third_party/kenney/*.zip`, `public/assets/manifest.json` + `assets.test.ts` | ✅ |
| 07–08 | 32×32 Tiled harita, katmanlar, hotspot koordinatları, kamera 0.8–1.4, sürükle/dokun, parıltı+ipucu, kilitli bölge mesajı | `generate-world-alpha.mjs`, `hotspots.ts`, `WorldScene.ts`, `map.test.ts` | ✅ |
| 09 | Ekran 01: üst çubuk Dönem/Enerji/Atık/Bütçe; sol görev 260 px; sağ durum 290 px; ortak state adapter | Üst çubukta ⚡/🗑️/💰/seviye, dönem anahtarı; görev haritası ve şehir kartları; `gameStore` | ✅ |
| 10 | Ekran 02: koşullar görünür; seçmeden simülasyon yok; ≥3 gösterge değişir; gerekçe; tekrar dene; simülasyon ibaresi | `DecisionModal.tsx`; `acceptance.test.ts` (T04/T05) | ✅ |
| 11 | Ekran 03: iki strateji aynı başlangıç; nedenli kartlar; yan yana çubuklar; 2 soruluk yansıtma; “Gerçek okulda ne yapabilirim?”; kgCO₂e yok | `FutureComparison.tsx` (kapı görselleri + maskot) | ✅ |
| 12 | Ekran 04: öğretmen KPI kartları, öğrenme göstergeleri, saha verisi; oturum çift sayım kontrolü; DEMO etiketi | Gerçek veri (DEMO verisi kaldırıldı), KPI kartları, kazanım/rubrik/yanılgı, saha ölçümü; oturumlar hesap bazlı (çift sayım yok) | ✅ |
| 13 | Mobil 360 px, alttan sheet, 44 px hedef, Bölge Listesi, klavye, prefers-reduced-motion, kontrast | Mobil düzen, “Bölge listesine geç”, axe taraması, hareket/grafik ayarı | ✅ (gerçek cihaz ⛔) |
| 14 | Phaser/React/DecisionEngine/ClimateEngine/AI/Store ayrımı; anahtar istemcide yok | `ARCHITECTURE.md`; anahtar yalnız sunucu ortamında | ✅ |
| 15 | Klasör mimarisi | Monorepo'ya uyarlandı (`apps/web/src/...` aynı alt yapı) | ✅ (karar 011) |
| 16 | Veri modeli, saf fonksiyon, sürüm, aynı tohum | `types.ts`, `DecisionEngine`, tohum kayıtta | ✅ |
| 17 | Tiled→Phaser entegrasyonu | Tiled JSON okunur; atlas eşlemesi `mapManifest.ts` | ✅ |
| 18 | AI: açıklama, ipucu (≤2 soru), uyarlama, öğretmen özeti; istem sözleşmesi; JSON şema; 5-8 sn yedek; hız/bütçe/önbellek; serbest sohbet yok | Üç rol, `validateTutorResponse`, 6 sn zaman aşımı, kota/bütçe/önbellek, `ai.test.ts` | ✅ (canlı model ⛔) |
| 19 | Temsili tablo; çapraz formül; gözlem/tahmin ayrımı; tartım + öğrenci + öğün; kgCO₂e yok | Simülasyon/Varsayım/Ölçülmüş etiketleri; tartım g/öğrenci/gün | ✅ |
| 20 | Öğrenci akışı; ilk görev metni; 4 tamamlama şartı | Kantin metni birebir; her görevde 4 adım listesi + 🏆 | ✅ |
| 21 | Karar günlüğü, her gün çalışan main | `docs/decision-log/`, CI | ✅ |
| 22 | Takvim | Yarışma takvimi kullanıcıya ait (sunum, saha görüşmesi) | ⛔ insan işi |
| 23 | T01–T12 kabul testleri; performans hedefleri; çevrim dışı çekirdek | `ACCEPTANCE.md`, E2E; service worker (`public/sw.js`) | ✅ (T12 insan provası ⛔) |
| 24 | Cloudflare Pages yayını; gizlilik; telif kaydı | `DEPLOY.md` (Pages + Docker), KVKK izin akışı, lisans kayıtları | 🟡 gerçek yayın ⛔ |
| 25 | Sunum planı ve jüri soruları | `PRESENTATION.md` güncellendi | ✅ |
| 26 | Risk tablosu, GO/NO-GO | `RISKS.md` güncellendi | ✅ |
| 27 | Başlangıç kontrol listesi | 12 maddenin tamamı | ✅ |
| 28 | Kaynaklar | `sources/SOURCES.md` + bilimsel kaynaklar | ✅ |
