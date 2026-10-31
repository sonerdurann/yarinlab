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

## Yayın sonrası kontrol listesi
- [ ] HTTPS ve HSTS etkin (`COOKIE_SECURE=true`).
- [ ] `/healthz` 200.
- [ ] Gizli pencerede T01-T12 (ACCEPTANCE.md).
- [ ] API anahtarı repo, istemci paketi ve ekran görüntülerinde yok.
- [ ] Yedek ve geri yükleme denendi.

**Durum:** Bu çalışma ortamında hiçbir canlı yayın yapılmadı; doğrulanmış canlı adres yoktur.
