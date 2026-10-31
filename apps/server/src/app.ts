import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';

declare module 'fastify' { interface FastifyInstance { ai: import('./ai/service.js').AiService } }
import { authRoutes } from './routes/auth.js';
import { gameRoutes } from './routes/game.js';
import { teacherRoutes } from './routes/teacher.js';
import { aiRoutes, prismaAiLog, prismaUserCallsToday } from './routes/ai.js';
import { AiService, DEFAULT_LIMITS, type AiLimits } from './ai/service.js';
import { providerFromEnv, type LlmProvider } from './ai/provider.js';
import { prisma } from './db.js';

const envLimits = (): Partial<AiLimits> => {
  const n = (v?: string) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined);
  const o: Partial<AiLimits> = { dailyUserCalls: n(process.env.AI_DAILY_USER_CALLS), dailyTokenBudget: n(process.env.AI_DAILY_TOKEN_BUDGET), timeoutMs: n(process.env.AI_TIMEOUT_MS) };
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
};

export async function buildApp(opts: { logger?: boolean; authRateMax?: number; aiProvider?: LlmProvider; aiLimits?: Partial<AiLimits> } = {}) {
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
  await app.register(authRoutes, { authRateMax: opts.authRateMax ?? (process.env.VITEST ? 1000 : 10) });
  await app.register(gameRoutes);
  const ai = new AiService(opts.aiProvider ?? providerFromEnv(), prismaAiLog, prismaUserCallsToday, { ...DEFAULT_LIMITS, ...envLimits(), ...opts.aiLimits });
  app.decorate('ai', ai);
  await app.register(aiRoutes, { ai });
  await app.register(teacherRoutes, { ai });
  return app;
}
