import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { prisma } from '../db.js';
import { NullProvider } from '../ai/provider.js';
import { client, cookieOf, tag } from './helpers.js';

describe('öğretmen hesap ayarları PATCH /api/auth/me', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  const tg = tag();
  beforeAll(async () => { app = await buildApp({ authRateMax: 1000, aiProvider: new NullProvider() }); });
  afterAll(async () => { await prisma.user.deleteMany({ where: { OR: [{ email: { contains: tg } }, { nickname: { contains: tg.slice(0, 10) } }] } }); await app.close(); await prisma.$disconnect(); });

  it('yanlış parolada 403; ad değişir; parola değişince eski oturum kapanır ve yeni parolayla giriş yapılır', async () => {
    const c = client(app);
    const cookie = await c.teacher(tg, 'acc');
    expect((await c.patch('/api/auth/me', { currentPassword: 'yanlis', displayName: 'Yeni Ad' }, cookie)).statusCode).toBe(403);
    expect((await c.patch('/api/auth/me', { currentPassword: 'sifre1234' }, cookie)).statusCode).toBe(400);
    const r1 = await c.patch('/api/auth/me', { currentPassword: 'sifre1234', displayName: 'Ayşe Öğretmen' }, cookie);
    expect(r1.json().user.displayName).toBe('Ayşe Öğretmen');
    const r2 = await c.patch('/api/auth/me', { currentPassword: 'sifre1234', newPassword: 'yeniSifre99' }, cookie);
    expect(r2.statusCode).toBe(200);
    const fresh = cookieOf(r2);
    expect((await c.get('/api/auth/me', cookie)).json().user).toBeNull();
    expect((await c.get('/api/auth/me', fresh)).json().user.displayName).toBe('Ayşe Öğretmen');
    expect((await c.post('/api/auth/teacher/login', { email: `acc-${tg}@okul.test`, password: 'sifre1234' })).statusCode).toBe(401);
    expect((await c.post('/api/auth/teacher/login', { email: `acc-${tg}@okul.test`, password: 'yeniSifre99' })).statusCode).toBe(200);
  });

  it('öğrenci bu uca erişemez', async () => {
    const c = client(app);
    const tc = await c.teacher(tg, 'acc2');
    const cls = await c.classroom(tc);
    const st = await c.student(cls.joinCode, `Ac${tg}`.slice(0, 16));
    expect((await c.patch('/api/auth/me', { currentPassword: 'abc123', displayName: 'X Y' }, st.cookie)).statusCode).toBe(403);
  });
});
