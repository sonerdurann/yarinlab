# Asset lisans ve indirme kaydı

Kenney paketleri CC0 (ticari kullanım serbest, atıf zorunlu değil; oyunda kaynak listesi önerilir) [R5]. Paketlerin kendi `License.txt` dosyaları doğrulandı: "Creative Commons Zero, CC0 – kişisel ve ticari projelerde kullanılabilir".

İndirme yöntemi: kenney.nl sayfasındaki "Download → Continue without donating" ücretsiz akışı (31 Ekim 2026). ZIP'ler `design/third_party/kenney/` altında orijinal halde saklanır; kullanılan spritesheet ve lisans dosyaları `public/assets/kenney/` altındadır.

| Paket | URL | Lisans | İndirme tarihi | Dosya / boyut | Durum |
|---|---|---|---|---|---|
| Isometric Tiles City | https://kenney.nl/assets/isometric-tiles-city | CC0 | 2026-10-31 | isometric-tiles-city.zip, 0,99 MB | indirildi |
| Isometric Tiles Buildings | https://kenney.nl/assets/isometric-tiles-buildings | CC0 | 2026-10-31 | isometric-tiles-buildings.zip, 1,71 MB | indirildi |
| Isometric Tiles Landscape | https://kenney.nl/assets/isometric-tiles-landscape | CC0 | 2026-10-31 | isometric-tiles-landscape.zip, 1,14 MB | indirildi |
| UI Pack | https://kenney.nl/assets/ui-pack | CC0 | 2026-10-31 | ui-pack.zip, 1,23 MB | indirildi (kullanım UI adımında) |
| Isometric Tiles Vehicles | https://kenney.nl/assets/isometric-tiles-vehicles | CC0 | 2026-10-31 | isometric-tiles-vehicles.zip, 2,27 MB | kullanılıyor: `sheet_allCars` atlası (taksi, çöp kamyonu, polis, ambulans) |
| Interface Sounds | https://kenney.nl/assets/interface-sounds | CC0 | 2026-10-31 | interface-sounds.zip, 0,83 MB | kullanılıyor: 9 efekt (`apps/web/public/assets/kenney/sounds`) |
| Game Icons | https://kenney.nl/assets/game-icons | CC0 | 2026-10-31 | game-icons.zip, 1,05 MB | kullanılıyor: 14 simge (üst çubuk, yakınlaştırma) |
| Input Prompts | https://kenney.nl/assets/input-prompts | CC0 | – | – | indirilmedi (opsiyon) |

## Ölçülen gerçek boyutlar (kılavuz §06: "128×64 varsayma")
- Spritesheet'ler 1024×2048 PNG + XML atlas (City 128, Landscape 128, Buildings 129 alt doku; City ayrıca `cityDetails_sheet`).
- Zemin karoları 132 px genişlik; en yaygın doku boyutu 132×99 (City 132×101) = ~132×66 elmas + kalınlık. Yani 2:1 oran korunuyor ama taban 128 değil ~132.
- Binalar çoğunlukla 132×127 (büyük) ve 99×54-85 (küçük).

Ekip yapımı özel asset'ler (`license: team-owned`, `source: custom-compatible-art`): `BootScene` içinde kodla üretilen ağaç, güneş paneli, batarya, rüzgâr türbini, ayrıştırma kutusu ve ekin sırası dokuları. Kenney sanatından kopya değildir; aynı 2:1 elmas, palet ve yumuşak gölge dilini izler.

## Ek kayıtlar (31 Ekim 2026, A2-A7)
| Öğe | Kaynak | Lisans | Konum |
|---|---|---|---|
| DejaVu Sans / Sans Bold (PDF raporlarında Türkçe karakter) | Debian `fonts-dejavu-core` | Bitstream Vera türevi, serbest dağıtım (bkz. `LICENSE-DejaVu.txt`) | `apps/server/assets/fonts/` |
| Yapı alanı işareti, yağmur damlası, araç, yaya dokuları | `BootScene` içinde kodla üretildi | ekip yapımı | `apps/web/src/game/scenes/BootScene.ts` |
| Ses efektleri (karar, inşa, gün, rozet, uyarı) | WebAudio osilatörüyle kodla üretildi; ses dosyası yok | ekip yapımı | `apps/web/src/audio/sfx.ts` |
| Yeni yapıların görünümü (güneş, türbin, batarya, park, tamir merkezi vb.) | Kenney Buildings karelerinin yeniden kullanımı + kodla üretilmiş dokular | CC0 + ekip yapımı | `packages/shared/src/sim/buildings.ts` (`sprite`) |

Üçüncü taraf yazılım bağımlılıkları npm üzerinden kendi lisanslarıyla gelir (Phaser MIT, React MIT, Fastify MIT, Prisma Apache-2.0, pdfkit MIT, @anthropic-ai/sdk MIT, zod MIT).
