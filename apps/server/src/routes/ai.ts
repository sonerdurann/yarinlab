import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { resourcesSchema, SCENARIO_ID_RE } from '@yarinlab/shared';
import { prisma } from '../db.js';
import { requireAuth } from '../lib/session.js';
import type { AiService } from '../ai/service.js';

const tutorBody = z.object({
  scenarioId: z.string().regex(SCENARIO_ID_RE), choiceId: z.string().regex(/^[A-Z]$/),
  before: resourcesSchema, after: resourcesSchema, reasoning: z.string().max(280).optional(),
});
const directorBody = z.object({
  completed: z.array(z.string().regex(SCENARIO_ID_RE)).max(200),
  recent: z.array(z.object({ taskId: z.string().regex(SCENARIO_ID_RE), total: z.number().min(0).max(100), reasoning: z.number().min(0).max(100) })).max(20),
});

/** Yapay zekâ uçları: API anahtarı yalnızca sunucuda; kullanıcı başına hız sınırı ve günlük kota. */
export async function aiRoutes(app: FastifyInstance, opts: { ai: AiService }) {
  const limit = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };
  app.get('/api/ai/status', async () => ({ provider: opts.ai.providerName, live: opts.ai.providerName !== 'none' }));
  app.post('/api/ai/tutor', { preHandler: requireAuth, ...limit }, async (req) => {
    const b = tutorBody.parse(req.body);
    const r = await opts.ai.tutor(req.user!.id, b);
    return { source: r.source === 'MODEL' ? 'ai' : 'fallback', response: r.data, reason: r.reason };
  });
  app.post('/api/ai/director', { preHandler: requireAuth, ...limit }, async (req) => {
    const b = directorBody.parse(req.body);
    const r = await opts.ai.director(req.user!.id, b);
    return { source: r.source === 'MODEL' ? 'ai' : 'fallback', advice: r.data };
  });
}

export const prismaAiLog = async (e: { userId: string; role: string; source: string; accepted: boolean; reason?: string }) => {
  await prisma.aiInteraction.create({ data: { userId: e.userId, role: e.role, source: e.source, accepted: e.accepted, reason: e.reason } }).catch(() => undefined);
};
export const prismaUserCallsToday = (userId: string) =>
  prisma.aiInteraction.count({ where: { userId, source: 'MODEL', createdAt: { gte: new Date(new Date().toISOString().slice(0, 10)) } } });
