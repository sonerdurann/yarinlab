import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TASKS } from '@yarinlab/shared';
import { buildApp } from '../app.js';
import { NullProvider } from '../ai/provider.js';
import { prisma } from '../db.js';
import { client, tag } from './helpers.js';

describe('rehber modları /api/ai/tutor (prompt §9)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  const tg = tag();
  beforeAll(async () => { app = await buildApp({ aiProvider: new NullProvider() }); });
  afterAll(async () => { await prisma.user.deleteMany({ where: { email: { contains: tg } } }); await app.close(); await prisma.$disconnect(); });
  it('mod alanı doğrulanır; geçerli modda o moda özgü doğrulanmış yedek döner', async () => {
    const c = client(app);
    const cookie = await c.teacher(tg, 'mode');
    const task = TASKS[0];
    const body = { scenarioId: task.id, choiceId: 'A', before: task.baseline, after: task.baseline, reasoning: 'Çünkü israf azalır' };
    const ok = await c.post('/api/ai/tutor', { ...body, mode: 'alternative' }, cookie);
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ source: 'fallback', mode: 'alternative' });
    expect(ok.json().response.summary).toMatch(/Diğer yollar/);
    expect((await c.post('/api/ai/tutor', { ...body, mode: 'cheat' }, cookie)).statusCode).toBe(400);
    expect((await c.post('/api/ai/tutor', body, cookie)).json().mode).toBe('feedback');
  });
});
