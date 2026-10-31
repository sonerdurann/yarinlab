import type { FastifyInstance } from 'fastify';
import { assessmentSchema, attemptSchema, MAX_SAVE_BYTES, saveSchema, scoreAssessment } from '@yarinlab/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAuth } from '../lib/session.js';

/** Oyun kaydı ve görev denemeleri: her kullanıcı yalnızca kendi kaydına erişir. */
export async function gameRoutes(app: FastifyInstance) {
  app.get('/api/save', { preHandler: requireAuth }, async (req) => {
    const s = await prisma.saveGame.findUnique({ where: { userId_slot: { userId: req.user!.id, slot: 'main' } } });
    return { save: s ? { version: s.version, seed: s.seed, state: s.state, updatedAt: s.updatedAt } : null };
  });

  app.put('/api/save', { preHandler: requireAuth, bodyLimit: MAX_SAVE_BYTES + 10_000 }, async (req, reply) => {
    const b = saveSchema.parse(req.body);
    if (JSON.stringify(b.state).length > MAX_SAVE_BYTES) return reply.code(413).send({ error: 'save_too_large' });
    const userId = req.user!.id;
    const cur = await prisma.saveGame.findUnique({ where: { userId_slot: { userId, slot: 'main' } } });
    const curVersion = cur?.version ?? 0;
    if (b.version !== curVersion) {
      return reply.code(409).send({ error: 'version_conflict', save: cur && { version: cur.version, state: cur.state, updatedAt: cur.updatedAt } });
    }
    const data = { state: b.state as Prisma.InputJsonValue, seed: b.state.sim.seed, version: curVersion + 1 };
    // Optimistik kilit: sürüm eşleşmezse güncelleme yapılmaz.
    if (cur) {
      const r = await prisma.saveGame.updateMany({ where: { id: cur.id, version: curVersion }, data });
      if (r.count === 0) return reply.code(409).send({ error: 'version_conflict' });
    } else {
      await prisma.saveGame.create({ data: { ...data, userId, slot: 'main' } });
    }
    return { version: curVersion + 1 };
  });

  app.delete('/api/save', { preHandler: requireAuth }, async (req) => {
    await prisma.saveGame.deleteMany({ where: { userId: req.user!.id } });
    return { ok: true };
  });

  app.post('/api/attempts', { preHandler: requireAuth }, async (req, reply) => {
    const b = attemptSchema.parse(req.body);
    const userId = req.user!.id;
    const moduleId = b.scenarioId.split('_')[0];
    const attemptNo = (await prisma.taskAttempt.count({ where: { userId, taskId: b.scenarioId } })) + 1;
    const a = await prisma.taskAttempt.create({
      data: {
        userId, moduleId, taskId: b.scenarioId, choiceId: b.choiceId, reasoning: b.reasoning || null,
        before: b.before, after: b.after, score: b.score, attemptNo,
      },
    });
    await prisma.decisionLog.create({
      data: { userId, day: b.day, kind: 'decision', message: `${b.scenarioId}:${b.choiceId}`, data: { score: b.score.total } },
    });
    return reply.code(201).send({ id: a.id, attemptNo });
  });

  app.get('/api/attempts/mine', { preHandler: requireAuth }, async (req) => {
    const attempts = await prisma.taskAttempt.findMany({
      where: { userId: req.user!.id }, orderBy: { createdAt: 'asc' },
      select: { taskId: true, moduleId: true, choiceId: true, reasoning: true, score: true, attemptNo: true, createdAt: true },
    });
    return { attempts };
  });

  /** Ön/son değerlendirme: puan sunucuda hesaplanır (istemci puanına güvenilmez). */
  app.post('/api/assessments', { preHandler: requireAuth }, async (req, reply) => {
    const b = assessmentSchema.parse(req.body);
    const sc = scoreAssessment(b.moduleId, b.answers);
    const a = await prisma.assessment.create({ data: { userId: req.user!.id, kind: b.kind, moduleId: b.moduleId, answers: b.answers, score: sc.pct } });
    return reply.code(201).send({ id: a.id, ...sc });
  });

  app.get('/api/assessments/mine', { preHandler: requireAuth }, async (req) => {
    const assessments = await prisma.assessment.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'asc' }, select: { moduleId: true, kind: true, score: true, createdAt: true } });
    return { assessments };
  });
}
