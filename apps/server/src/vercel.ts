import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from './app.js';

/**
 * Vercel Node fonksiyonu girişi (scripts/vercel-build.mjs paketler). Aynı Fastify uygulaması kullanılır;
 * örnek sıcak çağrılarda yeniden kullanılır. /api/* ve /healthz bu fonksiyona yönlendirilir; web statik sunulur.
 */
let ready: Promise<Awaited<ReturnType<typeof buildApp>>> | null = null;
const app = () => (ready ??= buildApp({ logger: true }).then(async (a) => { await a.ready(); return a; }));

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const a = await app();
  a.server.emit('request', req, res);
}
