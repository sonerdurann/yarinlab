import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { prisma } from '../db.js';

let app: Awaited<ReturnType<typeof buildApp>>;
const tag = Date.now().toString(36);
const cookieOf = (res: any) => (res.cookies[0] ? `${res.cookies[0].name}=${res.cookies[0].value}` : '');

beforeAll(async () => { app = await buildApp(); });
afterAll(async () => {
  await prisma.user.deleteMany({ where: { OR: [{ email: { contains: tag } }, { nickname: { contains: tag } }] } });
  await app.close(); await prisma.$disconnect();
});

const post = (url: string, payload: unknown, cookie?: string) =>
  app.inject({ method: 'POST', url, payload: payload as any, headers: cookie ? { cookie } : {} });

describe('auth ve yetki', () => {
  let tCookie = '', t2Cookie = '', code = '', classId = '';

  it('öğretmen kaydolur, sınıf açar', async () => {
    const r = await post('/api/auth/teacher/register', { email: `a-${tag}@okul.test`, password: 'sifre1234', displayName: 'Ayşe Öğretmen' });
    expect(r.statusCode).toBe(201);
    expect(JSON.stringify(r.json())).not.toContain('passwordHash');
    tCookie = cookieOf(r);
    const c = await post('/api/classrooms', { name: '7-A' }, tCookie);
    expect(c.statusCode).toBe(201);
    code = c.json().classroom.joinCode; classId = c.json().classroom.id;
    // izin akışı tamamlanmadan öğrenci katılamaz
    expect((await post('/api/auth/student/register', { classCode: code, nickname: `Erken${tag}`, password: 'abc123' })).statusCode).toBe(403);
    for (const kind of ['SCHOOL_APPROVAL', 'PARENT_NOTICE']) expect((await post(`/api/classrooms/${classId}/consent`, { kind, confirm: true }, tCookie)).statusCode).toBe(201);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('aynı e-posta ikinci kez kaydolamaz; yanlış parola reddedilir', async () => {
    expect((await post('/api/auth/teacher/register', { email: `a-${tag}@okul.test`, password: 'sifre1234', displayName: 'X Y' })).statusCode).toBe(409);
    expect((await post('/api/auth/teacher/login', { email: `a-${tag}@okul.test`, password: 'yanlis-sifre' })).statusCode).toBe(401);
    expect((await post('/api/auth/teacher/login', { email: `a-${tag}@okul.test`, password: 'sifre1234' })).statusCode).toBe(200);
  });

  it('öğrenci sınıf koduyla kaydolur; e-posta istenmez; aynı takma ad reddedilir', async () => {
    const r = await post('/api/auth/student/register', { classCode: code, nickname: `Kara${tag}`, password: 'abc123' });
    expect(r.statusCode).toBe(201);
    expect((await post('/api/auth/student/register', { classCode: code, nickname: `kara${tag}`, password: 'abc123' })).statusCode).toBe(409);
    expect((await post('/api/auth/student/register', { classCode: 'ZZZZZZ', nickname: `Y${tag}`, password: 'abc123' })).statusCode).toBe(404);
    const l = await post('/api/auth/student/login', { classCode: code, nickname: `Kara${tag}`, password: 'abc123' });
    expect(l.statusCode).toBe(200);
    expect((await post('/api/auth/student/login', { classCode: code, nickname: `Kara${tag}`, password: 'hatali' })).statusCode).toBe(401);
  });

  it('öğrenci öğretmen uçlarına erişemez (403), girişsiz 401', async () => {
    const l = await post('/api/auth/student/login', { classCode: code, nickname: `Kara${tag}`, password: 'abc123' });
    const sc = cookieOf(l);
    expect((await app.inject({ method: 'GET', url: '/api/classrooms', headers: { cookie: sc } })).statusCode).toBe(403);
    expect((await post('/api/classrooms', { name: 'Hile' }, sc)).statusCode).toBe(403);
    expect((await app.inject({ method: 'GET', url: '/api/classrooms' })).statusCode).toBe(401);
  });

  it('öğretmen başka öğretmenin sınıfını göremez', async () => {
    const r = await post('/api/auth/teacher/register', { email: `b-${tag}@okul.test`, password: 'sifre1234', displayName: 'Bora Öğretmen' });
    t2Cookie = cookieOf(r);
    const mine = await app.inject({ method: 'GET', url: '/api/classrooms', headers: { cookie: t2Cookie } });
    expect(mine.json().classrooms).toHaveLength(0);
    const own = await app.inject({ method: 'GET', url: '/api/classrooms', headers: { cookie: tCookie } });
    expect(own.json().classrooms.map((c: any) => c.id)).toContain(classId);
  });

  it('/me ve çıkış çalışır; geçersiz girdi 400', async () => {
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: tCookie } });
    expect(me.json().user.role).toBe('TEACHER');
    await post('/api/auth/logout', {}, tCookie);
    const after = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: tCookie } });
    expect(after.json().user).toBeNull();
    expect((await post('/api/auth/teacher/register', { email: 'x', password: '1' })).statusCode).toBe(400);
  });

  it('healthz veritabanına ulaşır; güvenlik başlıkları var', async () => {
    const h = await app.inject({ method: 'GET', url: '/healthz' });
    expect(h.statusCode).toBe(200);
    expect(h.headers['x-content-type-options']).toBe('nosniff');
  });
});
