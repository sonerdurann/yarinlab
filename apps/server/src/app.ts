import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { authRoutes } from './routes/auth.js';
import { prisma } from './db.js';

export async function buildApp(opts: { logger?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 256 * 1024 });
  await app.register(helmet);
  await app.register(cookie);
  await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });

  app.setErrorHandler((err: any, _req, reply) => {
    if (err instanceof ZodError) return reply.code(400).send({ error: 'invalid_input' });
    if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ error: err.code ?? 'bad_request' });
    app.log.error(err);
    return reply.code(500).send({ error: 'internal_error' }); // ayrıntı sızdırılmaz
  });

  app.get('/healthz', async () => {
    await prisma.$queryRaw`select 1`;
    return { ok: true };
  });
  await app.register(authRoutes);
  return app;
}
