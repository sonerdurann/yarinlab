# Kurulum ve çalıştırma

## Gereksinimler
- Node.js 22+, npm 10+
- PostgreSQL 16 (yerelde veya `docker compose up db`)
- (İsteğe bağlı) Anthropic API anahtarı: canlı yapay zekâ öğretmeni için. Anahtar yoksa doğrulanmış çevrim dışı geri bildirim çalışır.

## Geliştirme
```bash
npm ci
cp .env.example apps/server/.env      # DATABASE_URL vb. düzenleyin
npm -w @yarinlab/server exec prisma migrate deploy
npm run dev                            # API :3001 + web :5173 (Vite, /api vekili)
```
Tarayıcıda http://localhost:5173 açılır.

## Testler
```bash
npm run typecheck                      # tüm paketler
npm test                               # shared + server (gerçek PostgreSQL) + web birim/akış testleri
npm -w @yarinlab/web run e2e           # Playwright: üretim derlemesi + API, masaüstü ve tablet görünümü, axe
```
Sunucu testleri `DATABASE_URL` veri tabanına bağlanır ve oluşturduğu kayıtları siler; ayrı bir test veri tabanı kullanılması önerilir.

## Üretim derlemesi ve çalıştırma
```bash
npm run build                          # web: apps/web/dist
PORT=3001 COOKIE_SECURE=true npm -w @yarinlab/server run start
```
Sunucu, `apps/web/dist` varsa web uygulamasını da aynı kökenden sunar (tek alan adı, çerez tabanlı oturum). `WEB_DIST` ile farklı klasör verilebilir.

## Docker
```bash
POSTGRES_PASSWORD=guclu-parola docker compose up -d --build
```
- Uygulama :3001'de çalışır, açılışta migration'ları uygular.
- **HTTPS zorunludur:** önüne TLS sonlandıran bir ters vekil (Caddy, Nginx, Traefik) koyun ve `COOKIE_SECURE=true` ayarlayın; bu durumda HSTS ve `upgrade-insecure-requests` de açılır.

## Ortam değişkenleri
| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantısı |
| `PORT` | API portu (varsayılan 3001) |
| `COOKIE_SECURE` | `true`: çerez yalnızca HTTPS, HSTS açık |
| `AI_PROVIDER` | `none` (varsayılan) veya `anthropic` |
| `ANTHROPIC_API_KEY` | Yalnızca sunucuda. İstemciye asla gönderilmez |
| `AI_MODEL` | Varsayılan `claude-opus-5-5` |
| `AI_TIMEOUT_MS`, `AI_DAILY_USER_CALLS`, `AI_DAILY_TOKEN_BUDGET` | Zaman aşımı ve maliyet sınırları |
| `WEB_DIST` | Web derleme klasörü (isteğe bağlı) |

## Kenney destek paketleri (isteğe bağlı)
Bulut geliştirme ortamı kenney.nl'e erişemediği için Vehicles, Interface Sounds ve Game Icons paketleri betikle yerelde indirilir:
```bash
./scripts/fetch-kenney-extras.sh
git add -A && git commit -m "assets: Kenney destek paketleri" && git push
```
Betik ZIP'leri `design/third_party/kenney/` altına koyar, sesleri ve lisansları `apps/web/public/assets/kenney/` altına kopyalar, `manifest.json`'u günceller.

## Yedekleme
`scripts/backup.sh` günlük cron ile çalıştırılır (`pg_dump` özel biçim, `BACKUP_KEEP_DAYS` gün saklama). Geri yükleme komutu betiğin sonunda yazılıdır. Yedekler öğrenci verisi içerir: şifreli diskte, erişimi kısıtlı tutun.

## CI/CD
`.github/workflows/ci.yml`: PostgreSQL servisiyle migration, typecheck, birim/entegrasyon testleri, derleme ve Playwright uçtan uca testleri. Dağıtım adımı ortamınıza özeldir (Docker imajını kayda gönderip sunucuda `docker compose pull && up -d`).

## Günlük ve izleme
Fastify/pino JSON günlükleri stdout'a yazılır (istek kimliği, süre, durum). Hatalarda istemciye ayrıntı sızdırılmaz (`internal_error`). `/healthz` veri tabanı bağlantısını da denetler; konteyner sağlık kontrolü bunu kullanır. Yapay zekâ çağrıları `AiInteraction` tablosuna (kaynak, kabul, ret nedeni) kaydedilir.
