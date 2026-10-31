import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { prisma } from '../db.js';
import { client, tag as mkTag, type App } from './helpers.js';

let app: App;
let c: ReturnType<typeof client>;
const tag = mkTag();
let s1 = '', s2 = '';

beforeAll(async () => {
  app = await buildApp();
  c = client(app);
  const t = await c.teacher(tag);
  const cls = await c.classroom(t);
  s1 = (await c.student(cls.joinCode, `Ali${tag}`.slice(0, 20))).cookie;
  s2 = (await c.student(cls.joinCode, `Ece${tag}`.slice(0, 20))).cookie;
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { OR: [{ email: { contains: tag } }, { nickname: { contains: tag.slice(0, 14) } }] } });
  await app.close();
  await prisma.$disconnect();
});

const state = (day: number) => ({ history: [], sim: { seed: 42, day, treasury: 0, buildings: [], shock: {}, log: [] }, xp: 10 });
const res = { budget: 12000, foodWasteKg: 30, energyScore: 76, waterScore: 81, wellbeing: 75 };

describe('kayıt sistemi', () => {
  it('girişsiz kayıt yapılamaz', async () => {
    expect((await c.get('/api/save')).statusCode).toBe(401);
    expect((await c.put('/api/save', { version: 0, state: state(1) })).statusCode).toBe(401);
  });
  it('kaydet → geri yükle; sürüm artar; tohum saklanır', async () => {
    expect((await c.get('/api/save', s1)).json().save).toBeNull();
    const p = await c.put('/api/save', { version: 0, state: state(3) }, s1);
    expect(p.json().version).toBe(1);
    const g = (await c.get('/api/save', s1)).json().save;
    expect(g.state.sim.day).toBe(3);
    expect(g.seed).toBe(42);
    expect((await c.put('/api/save', { version: 1, state: state(4) }, s1)).json().version).toBe(2);
  });
  it('eski sürümle yazma çakışma verir (iki sekme / ağ kesintisi)', async () => {
    const r = await c.put('/api/save', { version: 1, state: state(9) }, s1);
    expect(r.statusCode).toBe(409);
    expect(r.json().save.version).toBe(2);
  });
  it('öğrenci başka öğrencinin kaydını göremez', async () => {
    expect((await c.get('/api/save', s2)).json().save).toBeNull();
  });
  it('geçersiz veya çok büyük kayıt reddedilir', async () => {
    expect((await c.put('/api/save', { version: 0, state: { history: 'x' } }, s2)).statusCode).toBe(400);
    const big = { ...state(1), blob: 'x'.repeat(420_000) };
    expect([400, 413]).toContain((await c.put('/api/save', { version: 0, state: big }, s2)).statusCode);
  });
});

describe('görev denemeleri', () => {
  it('deneme kaydedilir, deneme sırası artar; geçersiz görev kimliği reddedilir', async () => {
    const body = { scenarioId: 'food_001', choiceId: 'B', reasoning: 'çünkü veri', before: res, after: { ...res, foodWasteKg: 20 }, score: { outcome: 60, reasoning: 70, balance: 100, total: 72 }, day: 0 };
    expect((await c.post('/api/attempts', body, s1)).json().attemptNo).toBe(1);
    expect((await c.post('/api/attempts', { ...body, choiceId: 'A' }, s1)).json().attemptNo).toBe(2);
    expect((await c.post('/api/attempts', { ...body, scenarioId: '../etc' }, s1)).statusCode).toBe(400);
    expect((await c.post('/api/attempts', { ...body, before: { budget: 'x' } }, s1)).statusCode).toBe(400);
    const mine = (await c.get('/api/attempts/mine', s1)).json().attempts;
    expect(mine).toHaveLength(2);
    expect((await c.get('/api/attempts/mine', s2)).json().attempts).toHaveLength(0);
  });
});
