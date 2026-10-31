import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { prisma } from '../db.js';
import { MockProvider } from '../ai/provider.js';
import { buildClassReport, csvCell, reportToCsv } from '../reports/classReport.js';
import { client, tag as mkTag, type App } from './helpers.js';

let app: App;
let c: ReturnType<typeof client>;
const tag = mkTag();
let t1 = '', t2 = '', cls = { id: '', joinCode: '' };
let s1 = { cookie: '', id: '' }, s2 = { cookie: '', id: '' };
const res = { budget: 12000, foodWasteKg: 30, energyScore: 76, waterScore: 81, wellbeing: 75 };
const attempt = (scenarioId: string, choiceId: string, reasoning?: string, total = 70) => ({ scenarioId, choiceId, reasoning, before: res, after: res, score: { outcome: 60, reasoning: reasoning ? 80 : 0, balance: 90, total }, day: 0 });

beforeAll(async () => {
  app = await buildApp({ aiProvider: new MockProvider(() => 'geçersiz') });
  c = client(app);
  t1 = await c.teacher(tag, 'a'); t2 = await c.teacher(tag, 'b');
  cls = await c.classroom(t1, '6-C');
  s1 = await c.student(cls.joinCode, `Ada${tag}`.slice(0, 18));
  s2 = await c.student(cls.joinCode, `Can${tag}`.slice(0, 18));
  await c.post('/api/attempts', attempt('energy_002', 'A'), s1.cookie); // yanılgı, gerekçesiz
  await c.post('/api/attempts', attempt('energy_001', 'B', 'depolama gerekir çünkü gece güneş yok'), s1.cookie);
  await c.post('/api/attempts', attempt('energy_002', 'B', 'çünkü depolama'), s1.cookie); // sonra düzeltti
  await c.post('/api/attempts', attempt('waste_002', 'B', '=HYPERLINK("x") çünkü'), s2.cookie);
  await c.post('/api/assessments', { moduleId: 'energy', kind: 'PRE', answers: { 'en-q1': 0, 'en-q2': 1, 'en-q3': 0, 'en-q4': 0 } }, s1.cookie);
  await c.post('/api/assessments', { moduleId: 'energy', kind: 'POST', answers: { 'en-q1': 1, 'en-q2': 1, 'en-q3': 1, 'en-q4': 0 } }, s1.cookie);
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { OR: [{ email: { contains: tag } }, { nickname: { contains: tag.slice(0, 12) } }] } });
  await app.close(); await prisma.$disconnect();
});

describe('sınıf yönetimi ve yetki', () => {
  it('sınıf ayrıntısı: öğrenciler takma adla, izin durumu açık', async () => {
    const r = (await c.get(`/api/classrooms/${cls.id}`, t1)).json();
    expect(r.students).toHaveLength(2);
    expect(r.consent).toEqual({ school: true, parent: true });
    expect(JSON.stringify(r)).not.toMatch(/passwordHash|email/);
  });
  it('başka öğretmen ve öğrenci hiçbir sınıf ucuna erişemez (IDOR)', async () => {
    for (const url of ['', '/report', '/report.csv', '/report.pdf']) {
      expect((await c.get(`/api/classrooms/${cls.id}${url}`, t2)).statusCode, url).toBe(404);
      expect((await c.get(`/api/classrooms/${cls.id}${url}`, s1.cookie)).statusCode, url).toBe(403);
    }
    expect((await c.post(`/api/classrooms/${cls.id}/groups`, { name: 'X' }, t2)).statusCode).toBe(404);
    expect((await c.del(`/api/classrooms/${cls.id}/students/${s1.id}`, t2)).statusCode).toBe(404);
    expect((await c.post(`/api/classrooms/${cls.id}/students/${s1.id}/reset-password`, {}, t2)).statusCode).toBe(404);
    expect((await c.post(`/api/classrooms/${cls.id}/ai-advice`, {}, t2)).statusCode).toBe(404);
  });
  it('gruplar: oluştur, öğrenci ata; başka sınıfın grubu atanamaz', async () => {
    const g = (await c.post(`/api/classrooms/${cls.id}/groups`, { name: 'Enerji ekibi' }, t1)).json().group;
    expect((await c.patch(`/api/classrooms/${cls.id}/students/${s1.id}`, { groupId: g.id }, t1)).statusCode).toBe(200);
    const other = await c.classroom(t2, 'Diğer');
    const og = (await c.post(`/api/classrooms/${other.id}/groups`, { name: 'Y' }, t2)).json().group;
    expect((await c.patch(`/api/classrooms/${cls.id}/students/${s2.id}`, { groupId: og.id }, t1)).statusCode).toBe(400);
  });
  it('parola sıfırlama geçici parola üretir ve eski oturumları kapatır', async () => {
    const r = (await c.post(`/api/classrooms/${cls.id}/students/${s2.id}/reset-password`, {}, t1)).json();
    expect(r.temporaryPassword).toMatch(/^[a-z0-9]{8}$/);
    expect((await c.get('/api/auth/me', s2.cookie)).json().user).toBeNull();
    const login = await c.post('/api/auth/student/login', { classCode: cls.joinCode, nickname: `Can${tag}`.slice(0, 18), password: r.temporaryPassword });
    expect(login.statusCode).toBe(200);
    s2.cookie = `${login.cookies[0].name}=${login.cookies[0].value}`;
  });
});

describe('ödev ve gerçek dünya görevleri', () => {
  let aid = '';
  it('ödev atanır; geçersiz görev/boş ödev reddedilir; öğrenci kendi ödevini görür', async () => {
    expect((await c.post(`/api/classrooms/${cls.id}/assignments`, { title: 'Bozuk', taskIds: ['yok_001'] }, t1)).statusCode).toBe(400);
    expect((await c.post(`/api/classrooms/${cls.id}/assignments`, { title: 'Boş', taskIds: [] }, t1)).statusCode).toBe(400);
    const r = await c.post(`/api/classrooms/${cls.id}/assignments`, { title: 'Enerji 1-2', moduleId: 'energy', taskIds: ['energy_001', 'energy_002'], dueAt: new Date(Date.now() + 86400000).toISOString() }, t1);
    expect(r.statusCode).toBe(201);
    aid = r.json().assignment.id;
    await c.post(`/api/classrooms/${cls.id}/assignments`, { title: 'Gıda atığını tart', taskIds: [], realWorldTaskId: 'food-waste' }, t1);
    expect((await c.get('/api/me/assignments', s1.cookie)).json().assignments).toHaveLength(2);
  });
  it('ölçümler: öğrenci ve öğretmen başlangıç/sonuç girer; geçersiz değer reddedilir', async () => {
    expect((await c.post('/api/me/measurements', { taskKey: 'food-waste', phase: 'BASELINE', value: -5 }, s1.cookie)).statusCode).toBe(400);
    expect((await c.post('/api/me/measurements', { taskKey: 'uydurma', phase: 'BASELINE', value: 5 }, s1.cookie)).statusCode).toBe(400);
    await c.post(`/api/classrooms/${cls.id}/measurements`, { taskKey: 'food-waste', phase: 'BASELINE', value: 32 }, t1);
    await c.post(`/api/classrooms/${cls.id}/measurements`, { taskKey: 'food-waste', phase: 'FOLLOWUP', value: 24 }, t1);
    expect((await c.get('/api/me/measurements', s1.cookie)).json().measurements).toHaveLength(0);
  });
  it('rapor: kazanım, yanılgı, ön/son, ödev tamamlama ve ölçüm farkı', async () => {
    const r = (await c.get(`/api/classrooms/${cls.id}/report`, t1)).json();
    expect(r.studentsCount).toBe(2);
    const ada = r.students.find((s: { nickname: string }) => s.nickname.startsWith('Ada'));
    expect(ada.completedTasks).toBe(2);
    expect(ada.prePost.energy).toEqual({ pre: 50, post: 100 });
    expect(r.modules.find((m: { id: string }) => m.id === 'energy')).toMatchObject({ pre: 50, post: 100, prePostN: 1 });
    expect(r.outcomes.find((o: { id: string }) => o.id === 'EN2').evidence).toBeGreaterThan(0);
    const mis = r.misconceptions.find((m: { taskId: string }) => m.taskId === 'energy_002');
    expect(mis).toMatchObject({ students: 1, withoutReasoning: 1, laterCorrected: 1 });
    const as = r.assignments.find((a: { id: string }) => a.id === aid);
    expect(as).toMatchObject({ target: 2, completed: 1, pct: 50 });
    expect(r.realWorld.find((x: { key: string }) => x.key === 'food-waste')).toMatchObject({ baseline: 32, followup: 24, change: -8, label: 'Ölçülmüş' });
    expect(r.reasonings.length).toBeGreaterThan(0);
  });
  it('CSV formül enjeksiyonuna karşı korumalı, BOM ile; PDF geçerli', async () => {
    const csv = await c.get(`/api/classrooms/${cls.id}/report.csv`, t1);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.body.charCodeAt(0)).toBe(0xfeff);
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('a;b')).toBe('"a;b"');
    const pdf = await app.inject({ method: 'GET', url: `/api/classrooms/${cls.id}/report.pdf`, headers: { cookie: t1 } });
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(pdf.rawPayload.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.rawPayload.length).toBeGreaterThan(3000);
  });
  it('AI öğretmen asistanı: model geçersizse doğrulanmış yedek öneri', async () => {
    const r = (await c.post(`/api/classrooms/${cls.id}/ai-advice`, {}, t1)).json();
    expect(r.source).toBe('fallback');
    expect(r.advice.summary).toContain('2 öğrenci');
  });
});

describe('KVKK silme', () => {
  it('öğrenci silinince tüm verisi gider', async () => {
    expect((await c.del(`/api/classrooms/${cls.id}/students/${s2.id}`, t1)).statusCode).toBe(200);
    expect(await prisma.taskAttempt.count({ where: { userId: s2.id } })).toBe(0);
    expect(await prisma.user.count({ where: { id: s2.id } })).toBe(0);
  });
  it('sınıf silinince öğrencileri de silinir', async () => {
    const r = (await c.del(`/api/classrooms/${cls.id}`, t1)).json();
    expect(r.deletedStudents).toBe(1);
    expect(await prisma.user.count({ where: { id: s1.id } })).toBe(0);
  });
});

describe('rapor saf fonksiyonu', () => {
  it('boş sınıfta hata vermez', () => {
    const r = buildClassReport({ classroom: { id: 'x', name: 'Boş', joinCode: 'AAAAAA' }, students: [], attempts: [], assessments: [], measurements: [], assignments: [] });
    expect(r.studentsCount).toBe(0);
    expect(reportToCsv(r)).toContain('Takma ad');
  });
});

describe('rubrik, özet kartları, tartım ve okul özeti', () => {
  it('tartım öğrenci ve gün sayısıyla gram/öğrenci/gün olur; okul özeti tüm sınıfları gösterir; rubrik düzeyleri hesaplanır', async () => {
    const t = await c.teacher(`${tag}r`, 'r');
    const a = await c.classroom(t, '5-A'); const b = await c.classroom(t, '5-B');
    const st = await c.student(a.joinCode, `Rub${tag}`.slice(0, 18));
    await c.post('/api/attempts', attempt('food_001', 'B', 'Esnek porsiyon çünkü veriye göre atık ve bütçe dengesi', 85), st.cookie);
    await c.post('/api/attempts', attempt('food_001', 'C', 'çünkü tahmin riski', 60), st.cookie);
    await c.post(`/api/classrooms/${a.id}/measurements`, { taskKey: 'food-waste', phase: 'BASELINE', value: 42, students: 280, days: 5 }, t);
    await c.post(`/api/classrooms/${a.id}/measurements`, { taskKey: 'food-waste', phase: 'FOLLOWUP', value: 28, students: 280, days: 5 }, t);
    expect((await c.post(`/api/classrooms/${a.id}/measurements`, { taskKey: 'food-waste', phase: 'BASELINE', value: 1, students: 0, days: 5 }, t)).statusCode).toBe(400);
    const r = (await c.get(`/api/classrooms/${a.id}/report`, t)).json();
    expect(r.kpis).toMatchObject({ students: 1, activeStudents: 1, completedTasks: 1 });
    expect(r.realWorld.find((x: { key: string }) => x.key === 'food-waste').perStudent).toEqual({ baselineGps: 30, followupGps: 20 });
    expect(r.students[0].rubric.compare).toBe('yetkin');
    expect(r.rubric.find((x: { id: string }) => x.id === 'reasoning').counts).toBeDefined();
    const o = (await c.get('/api/school/overview', t)).json();
    expect(o.totals).toMatchObject({ classes: 2, students: 1 });
    expect(o.classes.find((x: { id: string }) => x.id === a.id).foodWaste).toMatchObject({ baselineGps: 30, followupGps: 20 });
    expect(o.classes.map((x: { id: string }) => x.id)).toContain(b.id);
    expect((await c.get('/api/school/overview', st.cookie)).statusCode).toBe(403);
    const other = (await c.get('/api/school/overview', t2)).json();
    expect(other.classes.map((x: { id: string }) => x.id)).not.toContain(a.id);
  });
});
