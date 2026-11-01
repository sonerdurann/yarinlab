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
Depo Vercel'e hazırdır: `vercel.json` derleme komutu `scripts/vercel-build.mjs`'i çalıştırır. Betik Vercel Build Output API ile `.vercel/output` üretir:
- `static/`: web derlemesi (Phaser + React), güvenlik başlıkları (CSP, HSTS, nosniff, frame engeli), `index.html`/`sw.js` önbelleksiz, SPA yönlendirmesi.
- `functions/api.func`: aynı Fastify uygulaması tek Node 22 fonksiyonu olarak (`/api/*` ve `/healthz`). Prisma motoru (rhel-openssl-3.0.x), pdfkit ve DejaVu fontları pakete dahildir.
- Derleme sırasında `DATABASE_URL` tanımlıysa `prisma migrate deploy` çalışır (tablolar otomatik oluşur).

**Adımlar**
1. [vercel.com](https://vercel.com) → **Add New… → Project** → GitHub'daki `yarinlab` deposunu seçin. Framework Preset: **Other** (ayarlar `vercel.json`'dan gelir; Root Directory boş bırakılır).
2. **Storage → Create Database → Neon (Postgres)** ile ücretsiz bir veri tabanı oluşturup projeye bağlayın. Entegrasyon `DATABASE_URL` ve `DATABASE_URL_UNPOOLED` değişkenlerini otomatik ekler. (Başka bir PostgreSQL kullanırsanız ikisini de kendiniz girin; havuzsuz adres yoksa ikisine aynı adresi yazın.)
3. **Settings → Environment Variables**:
   | Değişken | Değer | Zorunlu |
   |---|---|---|
   | `DATABASE_URL` | Neon havuzlu bağlantı (`...-pooler...?sslmode=require`) | evet (entegrasyon ekler) |
   | `DATABASE_URL_UNPOOLED` | Neon doğrudan bağlantı | evet (entegrasyon ekler) |
   | `COOKIE_SECURE` | `true` | evet |
   | `AI_PROVIDER` | `anthropic` (yoksa `none`) | hayır |
   | `ANTHROPIC_API_KEY` | anahtar | yalnızca AI açıksa |
4. **Deploy**. Derleme ~1-2 dk sürer. Bittiğinde `https://<proje>.vercel.app/healthz` → `{"ok":true}`.
5. Gizli pencerede kontrol: oyun açılır, öğretmen kaydı → sınıf oluştur → izin akışı → öğrenci kodla katılır → görev → öğretmen raporu PDF/CSV.

Yerelde aynı çıktıyı üretmek için: `npm run build:vercel` (yerel PostgreSQL ile göç de çalışır).

**Vercel'e özgü sınırlar**
- Hız sınırı fonksiyon örneği başına bellektedir; çok sayıda eşzamanlı örnekte sınır gevşer (okul ölçeğinde yeterli; büyük ölçekte Redis/Upstash önerilir).
- İlk istekte soğuk başlangıç (~1-2 sn) olabilir. AI zaman aşımı (6 sn) fonksiyon süresinin (30 sn) altındadır.
- Ücretsiz Neon veri tabanı boştayken uyur; ilk sorgu birkaç saniye sürebilir.
- Yedekleme: Neon'un nokta zamanlı geri yükleme özelliği kullanılır (`scripts/backup.sh` Docker kurulumu içindir).

**Durum:** Bu çalışma ortamından Vercel hesabına erişim olmadığı için canlı dağıtım yapılmadı. `.vercel/output` yerelde üretildi; paketlenmiş fonksiyon depo dışındaki izole bir klasörde (kaynak `node_modules` olmadan) Vercel rotalarını taklit eden bir sarmalayıcıyla çalıştırıldı: `/healthz`, öğretmen kaydı, sınıf, PDF (Türkçe font), CSV, AI önerisi ve tarayıcıda yeni oyun → görev → giriş penceresi hatasız çalıştı.

## Yayın sonrası kontrol listesi
- [ ] HTTPS ve HSTS etkin (`COOKIE_SECURE=true`).
- [ ] `/healthz` 200.
- [ ] Gizli pencerede T01-T12 (ACCEPTANCE.md).
- [ ] API anahtarı repo, istemci paketi ve ekran görüntülerinde yok.
- [ ] Yedek ve geri yükleme denendi.

**Durum:** Bu çalışma ortamında hiçbir canlı yayın yapılmadı; doğrulanmış canlı adres yoktur. Vercel için hazırlık yerelde doğrulandı (Seçenek C).
