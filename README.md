# YarinLab – Geleceği Sen Tasarla

COP31 / KLM Teknolojileri Creathonu için modern 2.5D izometrik iklim karar oyunu (6-8. sınıf).
Öğrenciler bütçe, su, enerji, atık ve refah arasında seçim yapar; sonuçları ortak bir okul-şehir simülasyonunda görür ve açıklama alır.

**Teknoloji:** Phaser 4.2.1 + React + TypeScript + Vite · Tiled JSON harita · Kenney Isometric Tiles (CC0)

## Durum (P0 – 31 Ekim 2026)
Çalışan prototip, tarayıcıda oynanır:
- 32×32 izometrik ada haritası; Okul, Kantin, Enerji, Atık tıklanır (Şehir, Tarım, Kıyı "Yakında"); sürükle, tekerlek, +/− ile yakınlaştırma, klavyeyle Bölge Listesi.
- **Kantin / Görev 01:** A/B/C kararı, gerekçe, sonuç (önce/sonra çubukları), tekrar dene, **iki gelecek karşılaştırması**, gıda atığı → **atık toplama** çapraz etkisi.
- **Dönem görünümü:** Bugün / 2040 Kararsız / 2040 Kararlarınla (görsel yorum).
- **AI yedeği:** doğrulanmış hazır pedagojik geri bildirim + iki soruluk yansıtma; model servisi olmadan da oyun biter (sunucu uç noktası taslağı `functions/`).
- **Öğretmen paneli:** DEMO etiketli sınıf özeti ve grafikler, gerçek okul ölçümü girişi, anonim oturum raporu indirme (JSON/CSV).
- **Erişilebilirlik ve mobil:** 360 px, ≥44 px hedefler, ortak odak yönetimli pencereler, Ayarlar (hareket, yazı boyutu), açılış mesajı, kaynak/lisans sayfası.
- Test: 52 birim/akış testi (`npm run test`), üretim derlemesi (`npm run build`).

**Henüz yapılmadı / doğrulanmadı:** yayınlanmış URL (Cloudflare Pages), gerçek telefonda ve gerçek klavye turuyla deneme, 90 sn'lik insan provası, hedef cihazda performans ölçümü, saha görüşmeleri; P1/P2 modülleri ve gerçek model servisi. Ayrıntı: [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md).

## Proje merkezi (docs/)
| Belge | İçerik |
|---|---|
| [docs/kilavuz.pdf](docs/kilavuz.pdf) | Orijinal uygulama kılavuzu (tek gerçek kaynak) |
| [docs/PLAN.md](docs/PLAN.md) | Kapsam (P0/P1/P2), öğrenme çıktıları, modüller, mimari, veri modeli |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Takvim ve ilerleme durumu |
| [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) | Kabul testleri T01-T12 ve sonuçları |
| [docs/RISKS.md](docs/RISKS.md) | Riskler ve GO / NO-GO eşikleri |
| [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) | Stil kilidi, palet, asset standartları |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Çalışma kuralları, iş kartı şablonu |
| [docs/PRESENTATION.md](docs/PRESENTATION.md) | 5 dk sunum + jüri soruları |
| [docs/sources/SOURCES.md](docs/sources/SOURCES.md) | Kaynaklar K1, R1-R18 |
| [docs/licenses/licenses.md](docs/licenses/licenses.md) | Asset lisans / indirme kaydı |
| [docs/decision-log/](docs/decision-log/) | Tarihli kararlar (001-009) |

## Komutlar
```bash
npm install
npm run dev        # geliştirme sunucusu (http://localhost:5173)
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run build      # dist/ (Cloudflare Pages: build=npm run build, output=dist)
node scripts/generate-world-alpha.mjs   # public/assets/maps/world_alpha.json'u yeniden üretir
```

## Yapı
`src/game` (Phaser sahneleri, karar/iklim motoru, harita ve dekor), `src/ui` (React HUD, pencereler, paneller), `src/state` (ortak store adapter), `src/ai` (hazır geri bildirim + istemci), `src/teacher` (rapor mantığı), `src/data` (senaryo, sabitler, kaynaklar), `src/tests`, `functions/` (Cloudflare taslağı), `public/assets` (harita, Kenney atlasları), `design/third_party/kenney` (orijinal ZIP'ler).

## Dürüstlük notu
Oyundaki değerler **simülasyon göstergeleridir**; gerçek saha ölçümü veya kanıtlanmış karbon azaltımı değildir.
Doğrulanmış katsayı olmadan kgCO₂e üretilmez. Öğretmen paneli örnek verileri "DEMO VERİSİ" olarak etiketlenir. Çocuklardan ad, fotoğraf, konum, e-posta toplanmaz.
