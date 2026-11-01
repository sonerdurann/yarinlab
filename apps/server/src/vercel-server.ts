import { buildApp } from './app.js';

/**
 * Vercel "server" hizmetinin girişi (vercel.json services.server). Derlemede esbuild ile dist/server.mjs'e
 * paketlenir (scripts/vercel-server-build.mjs). Aynı Fastify uygulaması; Vercel'in verdiği PORT'u dinler.
 */
const app = await buildApp({ logger: true });
await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
export default app;
