import type { FastifyInstance, FastifyReply } from 'fastify';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { MODULES, REAL_WORLD_TASKS, SCENARIO_ID_RE, taskById } from '@yarinlab/shared';
import { prisma } from '../db.js';
import { hashPassword } from '../lib/password.js';
import { requireAuth, requireRole } from '../lib/session.js';
import { buildClassReport, reportToCsv, type ReportData } from '../reports/classReport.js';
import { reportToPdf } from '../reports/pdf.js';
import type { AiService } from '../ai/service.js';

export const NOTICE_VERSION = '2026-10-kvkk-v1';
const teacher = { preHandler: requireRole('TEACHER') };
const idParam = z.object({ id: z.string().min(1).max(40) });
const RW_KEYS = REAL_WORLD_TASKS.map((r) => r.key) as [string, ...string[]];

/** Öğretmen yalnızca kendi sınıfına erişir; değilse 404 (varlık sızdırılmaz). */
async function ownClass(teacherId: string, classId: string, reply: FastifyReply) {
  const c = await prisma.classroom.findFirst({ where: { id: classId, teacherId } });
  if (!c) { reply.code(404).send({ error: 'not_found' }); return null; }
  return c;
}

export async function loadReportData(classId: string): Promise<ReportData> {
  const c = await prisma.classroom.findUniqueOrThrow({ where: { id: classId }, include: { enrollments: { include: { user: true, group: true } }, assignments: true } });
  const ids = c.enrollments.map((e) => e.userId);
  const [attempts, assessments, measurements] = await Promise.all([
    prisma.taskAttempt.findMany({ where: { userId: { in: ids } }, select: { userId: true, taskId: true, choiceId: true, reasoning: true, score: true, createdAt: true } }),
    prisma.assessment.findMany({ where: { userId: { in: ids } }, select: { userId: true, moduleId: true, kind: true, answers: true, score: true, createdAt: true } }),
    prisma.realWorldMeasurement.findMany({ where: { OR: [{ userId: { in: ids } }, { classroomId: classId }] } }),
  ]);
  return {
    classroom: { id: c.id, name: c.name, joinCode: c.joinCode },
    students: c.enrollments.map((e) => ({ id: e.userId, nickname: e.user.nickname ?? e.user.displayName, groupId: e.groupId, groupName: e.group?.name ?? null })),
    attempts: attempts.map((a) => ({ ...a, score: a.score as ReportData['attempts'][number]['score'] })),
    assessments: assessments.map((a) => ({ ...a, answers: (a.answers ?? {}) as Record<string, number> })),
    measurements, assignments: c.assignments,
  };
}

export async function teacherRoutes(app: FastifyInstance, opts: { ai: AiService }) {
  app.get('/api/classrooms/:id', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    const c = await prisma.classroom.findUniqueOrThrow({ where: { id }, include: { groups: true, consents: true, assignments: { orderBy: { createdAt: 'desc' } },
      enrollments: { include: { user: { select: { id: true, nickname: true, createdAt: true } } }, orderBy: { joinedAt: 'asc' } } } });
    const consent = { school: c.consents.some((x) => x.kind === 'SCHOOL_APPROVAL'), parent: c.consents.some((x) => x.kind === 'PARENT_NOTICE') };
    return { classroom: { id: c.id, name: c.name, joinCode: c.joinCode, createdAt: c.createdAt }, consent, noticeVersion: NOTICE_VERSION,
      groups: c.groups, assignments: c.assignments, students: c.enrollments.map((e) => ({ id: e.user.id, nickname: e.user.nickname, groupId: e.groupId, joinedAt: e.joinedAt })) };
  });

  app.patch('/api/classrooms/:id', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const b = z.object({ name: z.string().trim().min(2).max(60) }).parse(req.body);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    return { classroom: await prisma.classroom.update({ where: { id }, data: { name: b.name } }) };
  });

  /** Sınıfı ve tüm öğrenci verisini siler (KVKK: amaç sona erince silme). */
  app.delete('/api/classrooms/:id', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    const ids = (await prisma.enrollment.findMany({ where: { classroomId: id } })).map((e) => e.userId);
    await prisma.$transaction([prisma.user.deleteMany({ where: { id: { in: ids }, role: 'STUDENT' } }), prisma.classroom.delete({ where: { id } })]);
    return { ok: true, deletedStudents: ids.length };
  });

  /** İzin akışı: okul yönetimi onayı ve veli bilgilendirmesi kaydedilmeden öğrenci katılamaz. */
  app.post('/api/classrooms/:id/consent', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const b = z.object({ kind: z.enum(['SCHOOL_APPROVAL', 'PARENT_NOTICE']), confirm: z.literal(true) }).parse(req.body);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    const r = await prisma.consentRecord.create({ data: { classroomId: id, kind: b.kind, confirmedBy: req.user!.id, noticeVersion: NOTICE_VERSION } });
    return reply.code(201).send({ consent: r });
  });

  app.post('/api/classrooms/:id/groups', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const b = z.object({ name: z.string().trim().min(1).max(40) }).parse(req.body);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    return reply.code(201).send({ group: await prisma.studentGroup.create({ data: { classroomId: id, name: b.name } }) });
  });

  app.delete('/api/classrooms/:id/groups/:gid', teacher, async (req, reply) => {
    const p = z.object({ id: z.string(), gid: z.string() }).parse(req.params);
    if (!(await ownClass(req.user!.id, p.id, reply))) return;
    const r = await prisma.studentGroup.deleteMany({ where: { id: p.gid, classroomId: p.id } });
    return r.count ? { ok: true } : reply.code(404).send({ error: 'not_found' });
  });

  app.patch('/api/classrooms/:id/students/:sid', teacher, async (req, reply) => {
    const p = z.object({ id: z.string(), sid: z.string() }).parse(req.params);
    const b = z.object({ groupId: z.string().nullable() }).parse(req.body);
    if (!(await ownClass(req.user!.id, p.id, reply))) return;
    if (b.groupId && !(await prisma.studentGroup.findFirst({ where: { id: b.groupId, classroomId: p.id } }))) return reply.code(400).send({ error: 'invalid_group' });
    const r = await prisma.enrollment.updateMany({ where: { userId: p.sid, classroomId: p.id }, data: { groupId: b.groupId } });
    return r.count ? { ok: true } : reply.code(404).send({ error: 'not_found' });
  });

  /** Unutulan parola: öğretmen geçici parola üretir (öğrenciden e-posta istenmez). */
  app.post('/api/classrooms/:id/students/:sid/reset-password', teacher, async (req, reply) => {
    const p = z.object({ id: z.string(), sid: z.string() }).parse(req.params);
    if (!(await ownClass(req.user!.id, p.id, reply))) return;
    const e = await prisma.enrollment.findFirst({ where: { userId: p.sid, classroomId: p.id } });
    if (!e) return reply.code(404).send({ error: 'not_found' });
    const temp = Array.from({ length: 8 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[randomInt(31)]).join('');
    await prisma.$transaction([prisma.user.update({ where: { id: p.sid }, data: { passwordHash: await hashPassword(temp) } }), prisma.session.deleteMany({ where: { userId: p.sid } })]);
    return { temporaryPassword: temp };
  });

  /** Öğrencinin tüm verisini siler (KVKK: silme hakkı). */
  app.delete('/api/classrooms/:id/students/:sid', teacher, async (req, reply) => {
    const p = z.object({ id: z.string(), sid: z.string() }).parse(req.params);
    if (!(await ownClass(req.user!.id, p.id, reply))) return;
    const e = await prisma.enrollment.findFirst({ where: { userId: p.sid, classroomId: p.id } });
    if (!e) return reply.code(404).send({ error: 'not_found' });
    await prisma.user.delete({ where: { id: p.sid } });
    return { ok: true };
  });

  const assignmentBody = z.object({
    title: z.string().trim().min(2).max(80),
    moduleId: z.enum(MODULES.map((m) => m.id) as [string, ...string[]]).nullable().optional(),
    taskIds: z.array(z.string().regex(SCENARIO_ID_RE)).max(35).refine((xs) => xs.every((t) => !!taskById(t)), 'unknown_task'),
    realWorldTaskId: z.enum(RW_KEYS).nullable().optional(),
    groupId: z.string().nullable().optional(),
    dueAt: z.iso.datetime().nullable().optional(),
  }).refine((b) => b.taskIds.length > 0 || !!b.realWorldTaskId, 'empty_assignment');

  app.post('/api/classrooms/:id/assignments', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const b = assignmentBody.parse(req.body);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    if (b.groupId && !(await prisma.studentGroup.findFirst({ where: { id: b.groupId, classroomId: id } }))) return reply.code(400).send({ error: 'invalid_group' });
    const a = await prisma.assignment.create({ data: { classroomId: id, title: b.title, moduleId: b.moduleId ?? null, taskIds: b.taskIds, realWorldTaskId: b.realWorldTaskId ?? null, groupId: b.groupId ?? null, dueAt: b.dueAt ? new Date(b.dueAt) : null } });
    return reply.code(201).send({ assignment: a });
  });

  app.delete('/api/classrooms/:id/assignments/:aid', teacher, async (req, reply) => {
    const p = z.object({ id: z.string(), aid: z.string() }).parse(req.params);
    if (!(await ownClass(req.user!.id, p.id, reply))) return;
    const r = await prisma.assignment.deleteMany({ where: { id: p.aid, classroomId: p.id } });
    return r.count ? { ok: true } : reply.code(404).send({ error: 'not_found' });
  });

  /** Öğretmenin sınıf düzeyi gerçek dünya ölçümü (ör. kantinde tartılan toplam atık). */
  app.post('/api/classrooms/:id/measurements', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const b = measurementBody.parse(req.body);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    const m = await prisma.realWorldMeasurement.create({ data: { userId: req.user!.id, classroomId: id, taskKey: b.taskKey, phase: b.phase, value: b.value, unit: unitOf(b.taskKey), students: b.students ?? null, days: b.days ?? null, note: b.note || null } });
    return reply.code(201).send({ measurement: m });
  });

  app.get('/api/classrooms/:id/report', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    return buildClassReport(await loadReportData(id));
  });

  app.get('/api/classrooms/:id/report.csv', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const c = await ownClass(req.user!.id, id, reply);
    if (!c) return;
    const csv = reportToCsv(buildClassReport(await loadReportData(id)));
    return reply.header('content-type', 'text/csv; charset=utf-8').header('content-disposition', `attachment; filename="yarinlab-${c.joinCode}.csv"`).send(csv);
  });

  app.get('/api/classrooms/:id/report.pdf', teacher, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const c = await ownClass(req.user!.id, id, reply);
    if (!c) return;
    const pdf = await reportToPdf(buildClassReport(await loadReportData(id)));
    return reply.header('content-type', 'application/pdf').header('content-disposition', `attachment; filename="yarinlab-${c.joinCode}.pdf"`).send(pdf);
  });

  /** AI öğretmen asistanı: yalnızca anonim, toplu veriler gönderilir (takma ad dahil hiçbir öğrenci kimliği yok). */
  app.post('/api/classrooms/:id/ai-advice', { ...teacher, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    if (!(await ownClass(req.user!.id, id, reply))) return;
    const r = buildClassReport(await loadReportData(id));
    const summary = {
      students: r.studentsCount,
      outcomes: r.outcomes.filter((o) => o.pct !== null).map((o) => ({ id: o.id, name: o.text, pct: o.pct! })),
      misconceptions: r.misconceptions.slice(0, 5).map((m) => ({ text: m.text, count: m.students })),
      modules: r.modules.map((m) => ({ id: m.id, completedPct: m.startedPct })),
      prePost: r.modules.filter((m) => m.pre !== null && m.post !== null).map((m) => ({ module: m.id, pre: m.pre!, post: m.post! })),
    };
    const out = await opts.ai.teacherAssistant(req.user!.id, summary);
    return { source: out.source === 'MODEL' ? 'ai' : 'fallback', advice: out.data };
  });

  /**
   * Okul özeti (okul yöneticisi görünümü, kılavuz §02): öğretmenin tüm sınıfları yan yana; toplu gıda atığı tartımı
   * ve sınıf bazlı izleme. Yalnızca kendi sınıfları; öğrenci adı içermez.
   */
  app.get('/api/school/overview', teacher, async (req) => {
    const classes = await prisma.classroom.findMany({ where: { teacherId: req.user!.id }, orderBy: { name: 'asc' } });
    const rows = [];
    for (const c of classes) {
      const r = buildClassReport(await loadReportData(c.id));
      const fw = r.realWorld.find((x) => x.key === 'food-waste');
      rows.push({
        id: c.id, name: c.name, students: r.studentsCount, active: r.kpis.activeStudents, completedTasks: r.kpis.completedTasks,
        startedModules: r.modules.filter((m) => m.startedPct > 0).length,
        prePost: r.modules.filter((m) => m.pre !== null).map((m) => ({ module: m.id, pre: m.pre, post: m.post })),
        foodWaste: fw ? { baselineGps: fw.perStudent?.baselineGps ?? null, followupGps: fw.perStudent?.followupGps ?? null, nBaseline: fw.nBaseline, nFollowup: fw.nFollowup } : null,
      });
    }
    const totals = { classes: rows.length, students: rows.reduce((a, x) => a + x.students, 0), completedTasks: rows.reduce((a, x) => a + x.completedTasks, 0) };
    return { totals, classes: rows, note: 'Gıda atığı değerleri öğretmenlerin girdiği tartımlardır (Ölçülmüş), gram/öğrenci/gün olarak normalize edilir.' };
  });

  // ---- Öğrenci tarafı: ödevlerim ve gerçek dünya ölçümlerim ----
  app.get('/api/me/assignments', { preHandler: requireAuth }, async (req) => {
    const e = await prisma.enrollment.findUnique({ where: { userId: req.user!.id } });
    if (!e) return { assignments: [] };
    const list = await prisma.assignment.findMany({ where: { classroomId: e.classroomId, OR: [{ groupId: null }, { groupId: e.groupId ?? '__none__' }] }, orderBy: { createdAt: 'desc' } });
    return { assignments: list };
  });

  app.post('/api/me/measurements', { preHandler: requireAuth }, async (req, reply) => {
    const b = measurementBody.parse(req.body);
    const m = await prisma.realWorldMeasurement.create({ data: { userId: req.user!.id, taskKey: b.taskKey, phase: b.phase, value: b.value, unit: unitOf(b.taskKey), students: b.students ?? null, days: b.days ?? null, note: b.note || null } });
    return reply.code(201).send({ measurement: m });
  });

  app.get('/api/me/measurements', { preHandler: requireAuth }, async (req) => ({
    measurements: await prisma.realWorldMeasurement.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'asc' } }),
  }));
}

const measurementBody = z.object({
  taskKey: z.enum(RW_KEYS), phase: z.enum(['BASELINE', 'FOLLOWUP']),
  value: z.number().finite().min(0).max(100000), note: z.string().trim().max(200).optional(),
  students: z.number().int().min(1).max(5000).optional(), days: z.number().int().min(1).max(365).optional(),
});
const unitOf = (k: string) => REAL_WORLD_TASKS.find((r) => r.key === k)!.unit;
