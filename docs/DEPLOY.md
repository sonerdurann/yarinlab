# Yayın rehberi (kılavuz §24)

## Seçenek A — Tam ürün (önerilen): Docker + PostgreSQL + HTTPS
1. Sunucuda `POSTGRES_PASSWORD=... COOKIE_SECURE=true docker compose up -d --build`.
2. Önüne TLS sonlandıran ters vekil koyun (ör. Caddy: `yarinlab.okul.example { reverse_proxy app:3001 }`).
3. Gizli pencerede aç: giriş/kayıt, bir görev, öğretmen raporu indirme (T01, T10, T11).
4. Yapay zekâ için `AI_PROVIDER=anthropic` ve `ANTHROPIC_API_KEY` yalnızca sunucu ortamında tanımlanır.
5. `scripts/backup.sh` günlük cron.

## Seçenek B — Cloudflare Pages (yalnızca misafir/çevrim dışı oyun)
Kılavuzdaki yol: GitHub deposunu Pages'e bağlayın.
- Build command: `npm ci && npm run build -w @yarinlab/web`
- Output directory: `apps/web/dist`
- Bu modda API olmadığı için hesap, sunucu kaydı, öğretmen paneli ve canlı AI çalışmaz. Oyun misafir modunda tam oynanır ve ilerleme cihazda saklanır; AI yerine doğrulanmış yedek geri bildirim gösterilir.
- API'yi ayrı bir sunucuda çalıştırırsanız aynı alan adı altında `/api/*` yönlendirmesi (Pages Functions proxy) gerekir; çerez tabanlı oturum aynı köken ister.

## Seçenek C — Vercel (vercel.app, tam ürün: oyun + hesaplar + öğretmen paneli)
Depo Vercel **Services** biçimindedir (`vercel.json`). Tek proje, tek alan adı, iki hizmet:

| Hizmet | Kök | Çerçeve | Herkese açık yol | Derleme |
|---|---|---|---|---|
| `web` | `apps/web` | Vite | `/` (diğer tüm yollar) | `npm run build` → `dist` |
| `server` | `apps/server` | Fastify (giriş: `vercel-entry.mjs`) | `/api/*`, `/healthz` | `npm run vercel-build` → `dist/server.mjs` |

- Hizmetler arası bağlantı (binding) yoktur: tarayıcı API'yi aynı adresteki `/api` ile çağırır, sunucu web'i çağırmaz.
- `server` derlemesi (`scripts/vercel-server-build.mjs`): `prisma generate`, `DATABASE_URL` varsa `prisma migrate deploy` (tablolar otomatik kurulur), esbuild ile ortak TypeScript paketi dahil `dist/server.mjs`, PDF fontları.
- Vercel `/api` önekini sunucuya kırparak iletse de rotalar bulunur (`VERCEL` ortamında önek tamamlanır).
- Statik dosyalara güvenlik başlıkları (`vercel.json` `headers`); API yanıtlarına Fastify/helmet ekler.

**Adımlar**
1. Vercel → **Add New → Project** → `yarinlab` deposu. Ekran “birden fazla uygulama / Hizmetler” gösterir; depodaki `vercel.json` kullanılır (önerilen başka `vercel.json` eklenmez). Kök dizin `./`.
2. Ortam değişkeni: `COOKIE_SECURE` = `true` (isteğe bağlı `AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY`). **Deploy**.
3. Proje → **Storage → Create Database → Neon** → projeye bağla (`DATABASE_URL`, `DATABASE_URL_UNPOOLED` otomatik eklenir).
4. **Deployments → ⋯ → Redeploy** (göçler bu derlemede çalışır).
5. `https://<proje>.vercel.app/healthz` → `{"ok":true}`; gizli pencerede öğretmen kaydı → sınıf → öğrenci → görev → rapor.

**Sınırlar:** Hız sınırı hizmet örneği başına bellekte; soğuk başlangıç olabilir; ücretsiz Neon boştayken uyur.

**Durum:** Vercel belgelerine bu ortamdan erişilemedi ve canlı dağıtım yapılamadı. `dist/server.mjs` yerelde `VERCEL=1` ile çalıştırıldı: önekli ve öneki kırpılmış yollar, öğretmen kaydı, sınıf ve Türkçe fontlu PDF çalıştı; web derlemesi başarılı. İlk Vercel derlemesinde hata olursa derleme kaydı incelenmelidir.

Alternatif: tek proje Build Output API çıktısı `npm run build:vercel` (`scripts/vercel-build.mjs`) Vercel CLI ile `vercel deploy --prebuilt` için korunur.

## Yayın sonrası kontrol listesi
- [ ] HTTPS ve HSTS etkin (`COOKIE_SECURE=true`).
- [ ] `/healthz` 200.
- [ ] Gizli pencerede T01-T12 (ACCEPTANCE.md).
- [ ] API anahtarı repo, istemci paketi ve ekran görüntülerinde yok.
- [ ] Yedek ve geri yükleme denendi.

**Durum:** Bu çalışma ortamında hiçbir canlı yayın yapılmadı; doğrulanmış canlı adres yoktur. Vercel için hazırlık yerelde doğrulandı (Seçenek C).
