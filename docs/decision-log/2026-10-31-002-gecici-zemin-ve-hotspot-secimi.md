# 002 – Geçici prosedürel zemin ve ters-izometrik hotspot seçimi (2026-10-31)

**Karar 1:** Kenney paketleri henüz indirilmediği için (indirme kullanıcı onayı gerektirir) 32×32 harita `scripts/generate-world-alpha.mjs` ile Tiled uyumlu JSON olarak üretildi; zemin ve binalar Phaser Graphics ile geçici çizilir. Kenney atlası eklenince `TiledCityTileset` görseli ve `mapManifest.ts` güncellenecek (kılavuz §26 geri çekilme: sabit sahne tabanlı harita).
**Karar 2:** Hotspot tıklaması Phaser Graphics hit alanıyla değil, dünya noktasını ters izometrik karoya çevirip `hotspots.ts` sınırlarına bakarak yapılır; örtüşmede en küçük alan kazanır (kantin, okul sınırının içine taşar). Phaser 4'te `Geom.Point` yok (Vector2 kullanılır) ve `pointer.worldX` güvenilir değil (`camera.getWorldPoint` kullanılır).
**Karar 3:** Phaser kanvas sınırları ilk yerleşimde eski kalabildiği için `scale.updateBounds()` create ve resize'ta çağrılır.

## Güncelleme (aynı gün): Kenney atlası bağlandı
Zemin ve binalar artık Kenney Landscape/Buildings atlaslarından (`load.atlasXML`) çiziliyor; geçici prosedürel zemin kaldırıldı. Ölçülen taban 132×66 olduğu için `tileWidth/tileHeight` ve JSON harita 132×66'ya çekildi. gid→kare ve hotspot→bina eşlemesi `src/game/tiles/mapManifest.ts` içinde; kareler contact sheet ile görsel seçildi. Bilinen eksikler: yol karoları yön ayrımı yapmıyor (tek asfalt karo), ağaç/dekor katmanı henüz çizilmiyor, özel parçalar (güneş paneli, batarya vb.) üretilecek.

## Görsel cila (aynı gün)
Yollar komşu karoya göre seçiliyor: x ekseni `landscapeTiles_074`, y ekseni aynı karonun yatay aynası, kavşak `landscapeTiles_090` (`ROAD_FRAMES`). Kenney paketlerinde ağaç olmadığı için `BootScene.makeTreeTexture` aynı paletle düz gölgeli bir ağaç üretiyor (özel asset, `team-owned`); `decoration` katmanındaki gid 7 bu ağaçla çiziliyor. Karolar 1.015 ölçekle çizilerek dikişler kapatıldı. Kalan: kıyı su geçişleri.

## Görsel cila 2 (aynı gün)
Ada görünümü: dış halka kum, çevresi açık deniz rengi; meydan ve atık bölgesi açık kaldırım karosu (`landscapeTiles_059` tonlu). Bölge kimliği için etkileşimsiz dekor (`src/game/tiles/decor.ts`): enerji bölgesinde güneş paneli/batarya/rüzgâr türbini, atık bölgesinde ayrıştırma kutuları, bostanda ekin sıraları, şehir ve okul çevresinde Kenney dekor binaları. Özel parçalar `BootScene.makeCustomTextures` ile kodla üretilir (`team-owned`). Dekor yollara ve hotspot bina karolarına denk gelmez (`tests/decor.test.ts`); dekor karosundaki ağaç çizilmez. Kalan: kıyı su geçiş karoları, hafif karo çizgileri, gerçek cihazda performans.

## Görsel cila 3 (aynı gün)
Kıyı: şeritli `landscapeTiles_035` yerine düz su karosu `landscapeTiles_066`; köşede koy (x+y ≥ 56 su, çevresi kumsal), su yüzeyi kumsala göre 8 px çökük. Hareket: rüzgâr türbini kanatları ayrı dokuyla döner (7 sn/tur), su karoları hafif parlar (alpha 0.93↔1); ikisi de `prefers-reduced-motion` açıkken çalışmaz. Türbinler bataryalarla çakışmayacak yere alındı; dekor karosu ve türbin çevresinde ağaç çizilmez. Kalan: çimde çok hafif karo çizgileri, gerçek cihazda performans/FPS ölçümü.

## Görsel cila 4 (aynı gün)
Binalara yumuşak yer gölgesi (`shadow` dokusu), yuvarlak köşeli etiketler (kilitliler gri), üzerine gelinen bina 6 px yükselir (180 ms). Karar sonucu gelince kantin büyüyüp genişleyen halka çıkarır (~1,4 sn; kılavuz §04 "karar efekti"). HUD sayaçları (`useCountUp`, 700 ms) yeni değere akar; ekran okuyucu yalnızca son değeri okur. Üç hareket de `prefers-reduced-motion` açıkken kapalıdır; arka planda `requestAnimationFrame` durursa sayaç zamanlayıcıyla son değere zorlanır.

## Görsel cila 5: karar penceresi
Seçenekler A/B/C rozetli kartlara döndü (mobilde alt alta; yerel radyo düğmeleri korunur, klavye/odak halkası kartta görünür). Sonuç tablosuna başlangıçtan yeni değere uzayan çubuk ve yön oku + sayı + metin içeren değişim etiketi eklendi (renk tek başına anlam taşımaz; ekran okuyucuya "olumlu/olumsuz yönde" metni korunur). Pencere girişinde 160-220 ms solma/yükselme animasyonu (hareket azaltma açıkken kapalı). 360 px'te taşma yok, hedefler ≥44 px.

## Görsel cila 6: öğretmen paneli grafikleri
Seçim dağılımı, ön/son test (ham puan /5), gerekçe kalitesi (/3) ve "iki seçenek deneyen" yatay çubuklarla gösterilir; yalnızca DEMO verisi görünürken çıkar ve "DEMO VERİSİ" rozetiyle birlikte durur. Çubuklar görseldir (`aria-hidden`); aynı değerler metin olarak "Öğrenme göstergeleri" listesinde ve kartlarda da bulunur. Ön/son test farkı etki iddiası değildir uyarısı korunur.
