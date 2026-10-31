# 002 – Geçici prosedürel zemin ve ters-izometrik hotspot seçimi (2026-10-31)

**Karar 1:** Kenney paketleri henüz indirilmediği için (indirme kullanıcı onayı gerektirir) 32×32 harita `scripts/generate-world-alpha.mjs` ile Tiled uyumlu JSON olarak üretildi; zemin ve binalar Phaser Graphics ile geçici çizilir. Kenney atlası eklenince `TiledCityTileset` görseli ve `mapManifest.ts` güncellenecek (kılavuz §26 geri çekilme: sabit sahne tabanlı harita).
**Karar 2:** Hotspot tıklaması Phaser Graphics hit alanıyla değil, dünya noktasını ters izometrik karoya çevirip `hotspots.ts` sınırlarına bakarak yapılır; örtüşmede en küçük alan kazanır (kantin, okul sınırının içine taşar). Phaser 4'te `Geom.Point` yok (Vector2 kullanılır) ve `pointer.worldX` güvenilir değil (`camera.getWorldPoint` kullanılır).
**Karar 3:** Phaser kanvas sınırları ilk yerleşimde eski kalabildiği için `scale.updateBounds()` create ve resize'ta çağrılır.

## Güncelleme (aynı gün): Kenney atlası bağlandı
Zemin ve binalar artık Kenney Landscape/Buildings atlaslarından (`load.atlasXML`) çiziliyor; geçici prosedürel zemin kaldırıldı. Ölçülen taban 132×66 olduğu için `tileWidth/tileHeight` ve JSON harita 132×66'ya çekildi. gid→kare ve hotspot→bina eşlemesi `src/game/tiles/mapManifest.ts` içinde; kareler contact sheet ile görsel seçildi. Bilinen eksikler: yol karoları yön ayrımı yapmıyor (tek asfalt karo), ağaç/dekor katmanı henüz çizilmiyor, özel parçalar (güneş paneli, batarya vb.) üretilecek.
