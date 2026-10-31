# YarinLab – Geleceği Sen Tasarla

COP31 / KLM Teknolojileri Creathonu için modern 2.5D izometrik iklim karar oyunu (6-8. sınıf).
Öğrenciler bütçe, su, enerji, atık ve refah arasında seçim yapar; sonuçları ortak bir okul-şehir simülasyonunda görür ve açıklama alır.

**Teknoloji:** Phaser 4.2.1 + React + TypeScript + Vite · Tiled JSON harita · Kenney Isometric Tiles (CC0)

## Proje merkezi (docs/)
| Belge | İçerik |
|---|---|
| [docs/kilavuz.pdf](docs/kilavuz.pdf) | Orijinal uygulama kılavuzu (tek gerçek kaynak) |
| [docs/PLAN.md](docs/PLAN.md) | Kapsam (P0/P1/P2), öğrenme çıktıları, modüller, mimari, veri modeli |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Takvim ve ilerleme durumu |
| [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) | Kabul testleri T01-T12 |
| [docs/RISKS.md](docs/RISKS.md) | Riskler ve GO / NO-GO eşikleri |
| [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) | Stil kilidi, palet, asset standartları |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Çalışma kuralları, iş kartı şablonu |
| [docs/PRESENTATION.md](docs/PRESENTATION.md) | 5 dk sunum + jüri soruları |
| [docs/sources/SOURCES.md](docs/sources/SOURCES.md) | Kaynaklar K1, R1-R18 |
| [docs/licenses/licenses.md](docs/licenses/licenses.md) | Asset lisans / indirme kaydı |
| [docs/decision-log/](docs/decision-log/) | Tarihli kararlar |

## Komutlar
```bash
npm install
npm run dev        # geliştirme sunucusu
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run build      # dist/ (Cloudflare Pages: build=npm run build, output=dist)
```

## Dürüstlük notu
Oyundaki değerler **simülasyon göstergeleridir**; gerçek saha ölçümü veya kanıtlanmış karbon azaltımı değildir.
Doğrulanmış katsayı olmadan kgCO₂e üretilmez. Öğretmen paneli örnek verileri "DEMO VERİSİ" olarak etiketlenir.
