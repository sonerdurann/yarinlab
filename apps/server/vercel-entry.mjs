// Vercel "server" hizmetinin giriş dosyası (vercel.json services.server.entrypoint).
// Vercel giriş dosyasını derlemeden önce arar; bu dosya depoda hep vardır ve derlemede üretilen
// dist/server.mjs paketini yükler (npm run vercel-build → scripts/vercel-server-build.mjs).
import app from './dist/server.mjs';
export default app;
