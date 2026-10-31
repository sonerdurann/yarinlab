# Asset lisans ve indirme kaydı

Kenney paketleri CC0 (ticari kullanım serbest, atıf zorunlu değil; oyunda kaynak listesi önerilir) [R5]. Paketlerin kendi `License.txt` dosyaları doğrulandı: "Creative Commons Zero, CC0 – kişisel ve ticari projelerde kullanılabilir".

İndirme yöntemi: kenney.nl sayfasındaki "Download → Continue without donating" ücretsiz akışı (31 Ekim 2026). ZIP'ler `design/third_party/kenney/` altında orijinal halde saklanır; kullanılan spritesheet ve lisans dosyaları `public/assets/kenney/` altındadır.

| Paket | URL | Lisans | İndirme tarihi | Dosya / boyut | Durum |
|---|---|---|---|---|---|
| Isometric Tiles City | https://kenney.nl/assets/isometric-tiles-city | CC0 | 2026-10-31 | isometric-tiles-city.zip, 0,99 MB | indirildi |
| Isometric Tiles Buildings | https://kenney.nl/assets/isometric-tiles-buildings | CC0 | 2026-10-31 | isometric-tiles-buildings.zip, 1,71 MB | indirildi |
| Isometric Tiles Landscape | https://kenney.nl/assets/isometric-tiles-landscape | CC0 | 2026-10-31 | isometric-tiles-landscape.zip, 1,14 MB | indirildi |
| UI Pack | https://kenney.nl/assets/ui-pack | CC0 | 2026-10-31 | ui-pack.zip, 1,23 MB | indirildi (kullanım UI adımında) |
| Isometric Tiles Vehicles | https://kenney.nl/assets/isometric-tiles-vehicles | CC0 | – | – | indirilmedi (destek) |
| Interface Sounds | https://kenney.nl/assets/interface-sounds | CC0 | – | – | indirilmedi (destek) |
| Game Icons | https://kenney.nl/assets/game-icons | CC0 | – | – | indirilmedi (destek) |
| Input Prompts | https://kenney.nl/assets/input-prompts | CC0 | – | – | indirilmedi (opsiyon) |

## Ölçülen gerçek boyutlar (kılavuz §06: "128×64 varsayma")
- Spritesheet'ler 1024×2048 PNG + XML atlas (City 128, Landscape 128, Buildings 129 alt doku; City ayrıca `cityDetails_sheet`).
- Zemin karoları 132 px genişlik; en yaygın doku boyutu 132×99 (City 132×101) = ~132×66 elmas + kalınlık. Yani 2:1 oran korunuyor ama taban 128 değil ~132.
- Binalar çoğunlukla 132×127 (büyük) ve 99×54-85 (küçük).

Ekip yapımı özel asset'ler: `license: team-owned`, `source: custom-compatible-art`.
