// Vercel derlemesi (Build Output API v3): web statik + API Node fonksiyonu → .vercel/output
// Kullanım: Vercel otomatik çalıştırır (vercel.json buildCommand). Yerelde: node scripts/vercel-build.mjs
// Ayrıntı: docs/DEPLOY.md "Seçenek C — Vercel".
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { nodeFileTrace } from '@vercel/nft';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.vercel/output');
const fn = path.join(out, 'functions/api.func');
const run = (cmd, env = {}) => execSync(cmd, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
const log = (m) => console.log(`\n▶ ${m}`);

rmSync(out, { recursive: true, force: true });
mkdirSync(fn, { recursive: true });

log('Web derlemesi');
run('npm run build -w @yarinlab/web');
cpSync(path.join(root, 'apps/web/dist'), path.join(out, 'static'), { recursive: true });

log('Prisma istemcisi');
run('npm -w @yarinlab/server exec prisma generate');
if (process.env.DATABASE_URL) {
  log('Veri tabanı göçleri (prisma migrate deploy)');
  // Neon/Vercel entegrasyonu DATABASE_URL_UNPOOLED tanımlar; yoksa aynı adres kullanılır.
  run('npm -w @yarinlab/server exec prisma migrate deploy', { DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
} else {
  console.warn('UYARI: DATABASE_URL tanımlı değil; göçler atlandı. Vercel ortam değişkenlerine ekleyin (docs/DEPLOY.md).');
}

log('API fonksiyonu paketleniyor (esbuild)');
const entry = path.join(fn, 'index.mjs');
await build({
  entryPoints: [path.join(root, 'apps/server/src/vercel.ts')],
  outfile: entry,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  // Yerel motor/veri dosyası taşıyan paketler dışarıda kalır ve aşağıda izlenerek kopyalanır.
  external: ['@prisma/client', '.prisma/client', 'pdfkit', '@anthropic-ai/sdk'],
  // ESM paketinde CommonJS bağımlılıkları için require tanımı
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'warning',
});

log('Dış bağımlılıklar izleniyor (@vercel/nft)');
const { fileList } = await nodeFileTrace([entry], { base: root, processCwd: root });
let n = 0;
for (const f of fileList) {
  if (f.startsWith('.vercel/')) continue;
  const src = path.join(root, f);
  const dst = path.join(fn, f);
  mkdirSync(path.dirname(dst), { recursive: true });
  cpSync(src, dst, { dereference: true });
  n++;
}
// Prisma sorgu motoru dinamik yüklenir: üretilen istemci kopyalanır (tip, wasm ve edge dosyaları hariç).
// Vercel'de yalnızca rhel motoru gerekir; yerel denemede yerel motor da tutulur.
const prismaDir = path.join(root, 'node_modules/.prisma/client');
cpSync(prismaDir, path.join(fn, 'node_modules/.prisma/client'), {
  recursive: true, dereference: true,
  filter: (src) => {
    const b = path.basename(src);
    if (/\.d\.ts$|wasm|edge|index-browser/.test(b)) return false;
    if (process.env.VERCEL && /^libquery_engine-/.test(b) && !b.includes('rhel-openssl-3.0.x')) return false;
    return true;
  },
});
cpSync(path.join(root, 'apps/server/assets/fonts'), path.join(fn, 'assets/fonts'), { recursive: true });
console.log(`${n} dosya kopyalandı`);

writeFileSync(path.join(fn, 'package.json'), JSON.stringify({ type: 'module' }));
writeFileSync(path.join(fn, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', shouldAddHelpers: false, maxDuration: 30,
}, null, 2));

// Statik dosyalar için güvenlik başlıkları (API yanıtlarına Fastify/helmet ekler).
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; worker-src 'self' blob:; upgrade-insecure-requests";
const security = {
  'content-security-policy': CSP,
  'strict-transport-security': 'max-age=15552000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
};
writeFileSync(path.join(out, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: '/api' },
    { src: '/healthz', dest: '/api' },
    { src: '/assets/(.*)', headers: { 'cache-control': 'public, max-age=604800', ...security }, continue: true },
    { src: '/(sw\\.js|index\\.html)?', headers: { 'cache-control': 'no-cache', ...security }, continue: true },
    { src: '/(.*)', headers: security, continue: true },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
}, null, 2));

console.log('\n✔ .vercel/output hazır (static + functions/api.func)');
