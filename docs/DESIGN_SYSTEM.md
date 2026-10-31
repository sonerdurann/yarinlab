# YarınLab tasarım sistemi

Kaynak dosyalar: `apps/web/src/design/tokens.css` (belirteçler), `apps/web/src/design/game-ui.css` (HUD, kartlar, menü, karakterler), `apps/web/src/game/art/isoArt.ts` (izometrik sanat paleti `PAL`). Eski `index.css` ve `theme.css` temel düzen ve bileşenleri taşır. Eski renk adları (`--climate-green`, `--ink` …) yeni palete bağlıdır.

## Renk

| Belirteç | Renk | Kullanım |
|---|---|---|
| `--yl-green` | #26B887 | Vurgu, ilerleme çubuğu, seçili halka, seviye rozeti (üstünde **koyu** metin) |
| `--yl-deep` | #176B58 | Birincil düğme ve dolgu, **beyaz metin** (kontrast ≈ 6.5:1) |
| `--yl-teal` | #41C9D1 | Su, rehber Yarı, hologram, katman vurgusu (koyu metin) |
| `--yl-sun` | #F6C453 | Günü bitir, seviye, odak halkası, enerji |
| `--yl-sky` | #A5DDF2 | Gökyüzü ve deniz arka planı |
| `--yl-cloud` | #F5F8F4 | Kart zemini |
| `--yl-ink` | #243447 | Metin |
| `--yl-coral` | #EF795E | Uyarı, çatı, risk katmanı |
| `--yl-leaf` | #4DBE78 | Doğa, yeşil çatı |

**Kontrast kuralı:** Beyaz metin yalnızca `--yl-deep` veya `--yl-ink` üzerinde. `--yl-green` ve `--yl-teal` yalnızca vurgu ya da koyu metinli dolgu olarak kullanılır. Modül renkleri (`--yl-mod-*`) beyaz zeminde AA geçecek koyuluktadır. Axe (WCAG 2 A/AA) E2E testinde çalışır.

## Tipografi
- Başlık: **Baloo 2** 600/800 (OFL), gövde: **Nunito** 400/700/800 (OFL), `@fontsource` ile yerel paket.
- Ölçek: `--yl-fs-xs` 0.78rem … `--yl-fs-hero` clamp(2.6rem, 6vw, 4.6rem). Ayarlardaki yazı boyutu kökü %100 / %112,5 / %125 yapar.

## Boşluk, yarıçap, gölge, katman
- Boşluk: 4 / 8 / 12 / 16 / 24 / 32 px (`--yl-s1…s6`).
- Yarıçap: 10 / 16 / 22 px, hap 999 px.
- Gölge: `--yl-shadow-1` (kart), `--yl-shadow-2` (yüzen HUD), `--yl-shadow-press` (birincil düğmenin “basılabilir” alt kenarı).
- Katmanlar: HUD 3, çekmece 4, kart 5, bildirim 6, pencere 10, başlık ekranı 12.

## Bileşenler ve durumlar
| Bileşen | Sınıf | Durumlar |
|---|---|---|
| Birincil düğme | `button.primary` | hover koyulaşır, basınca 2 px iner, odakta 4 px sarı halka, devre dışı soluk |
| İkincil düğme | `button` | beyaz zemin, ince kenar, aynı hareket |
| Simge düğmesi | `.icon-btn` | 44×44 yuvarlak (dokunma hedefi ≥ 44 px) |
| Kaynak hapı | `.pill` + `.pill-btn` | `tone-good/ok/bad`, tıklayınca `.res-card` açıklama |
| Panel/kart | `.panel` | cam beyazı, 2 px beyaz kenar, yumuşak gölge |
| Bilgi kartı | `.inspect-card` | modül renginde kenar, `.level-track`, `.upgrade-row`, `.card-actions` |
| Dock | `.hud-dock` | seçili öğe koyu yeşil, `aria-pressed` |
| Çekmece | `.hud-drawer` | Esc ve ✕ kapatır, oyun alanını tamamen örtmez |
| Bildirim merkezi | `.notif` | okunmamış sayısı, uyarılar karta götürür |
| Katman seçici | `.layers` | `aria-pressed`, seçili koyu |
| Rehber | `.guide-panel` | niyet düğmeleri, düşünme animasyonu, kaynak satırı |
| Karakter | `AvatarFace`, `Character`, `Ada` | ifade: nötr / konuşma / düşünme / sevinç / endişe |

## Hareket
- Süreler: hızlı 120 ms, orta 220 ms; geçişlerde hafif “yaylanma” (`--yl-ease`).
- Hareket azaltma (sistem tercihi veya Ayarlar) ve düşük grafik: ortam animasyonları (bulut, kuş, ağaç salınımı, su parıltısı, trafik, kamera turu, hologram titremesi) durur; durum değişiklikleri anında uygulanır.

## İzometrik sanat kuralları
- Karo 132×66 (2:1). Işık sol üstten: sol yüz açık, sağ yüz koyu, üst en açık; gölge sağ alta düşer.
- Doku pivotu taban üst köşesidir (`registry origin:<id>`); ressam sırası taban alt köşesinin y değeriyle (`depthOf`).
- Bina = kaide + gövde + kat çizgileri + pencere ızgarası + kapı + çatı (düz/beşik/yeşil/kubbe/testere) + ekler (GES, tank, anten, bayrak, tente, tabela).
- Yazı ve büyük etiket doku içine çizilmez; adlar arayüzde (ipucu ve kart) görünür.

## Duyarlı düzen
- 1920×1080 öncelikli; 1366×768 ve 1024×768 tam işlevli. 1200 px altında marka yazısı ve hikâye çipi gizlenir; 900 px altında kaynaklar kayan satıra iner, sol HUD alta taşınır, mini harita gizlenir, kart ve çekmeceler tam genişliktir. Dar dikey telefonda “cihazını yan çevir” önerisi gösterilir.
- Dokunmatik: sürükle, iki parmakla yakınlaştırma (pinch), dokununca bilgi kartı.
