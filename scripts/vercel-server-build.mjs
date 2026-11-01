// Vercel "server" hizmeti derlemesi (vercel.json services.server.buildCommand). Hizmet kökü: apps/server.
// 1) Prisma istemcisi  2) DATABASE_URL varsa göçler  3) esbuild ile dist/server.mjs (ortak TypeScript paketi dahil)
// 4) PDF fontları dist/assets/fonts. Ayrıntı: docs/DEPLOY.md "Seçenek C — Vercel".
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const server = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../apps/server');
const run = (cmd, env = {}) => execSync(cmd, { cwd: server, stdio: 'inherit', env: { ...process.env, ...env } });

run('npx prisma generate');
if (process.env.DATABASE_URL) {
  run('npx prisma migrate deploy', { DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
} else {
  console.warn('UYARI: DATABASE_URL yok; göçler atlandı (Vercel → Storage → Neon bağlayıp yeniden yayınlayın).');
}

const dist = path.join(server, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
await build({
  entryPoints: [path.join(server, 'src/vercel-server.ts')],
  outfile: path.join(dist, 'server.mjs'),
  bundle: true, platform: 'node', target: 'node22', format: 'esm',
  // Yerel motor veya veri dosyası taşıyan paketler node_modules'tan yüklenir.
  external: ['@prisma/client', '.prisma/client', 'pdfkit', '@anthropic-ai/sdk'],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'warning',
});
cpSync(path.join(server, 'assets/fonts'), path.join(dist, 'assets/fonts'), { recursive: true });
console.log('✔ apps/server/dist/server.mjs hazır');
