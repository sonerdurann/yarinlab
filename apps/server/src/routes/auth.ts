import type { FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';
import {
  classroomCreateSchema, studentLoginSchema, studentRegisterSchema, teacherLoginSchema, teacherRegisterSchema,
} from '@yarinlab/shared';
import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { endSession, loadUser, requireRole, startSession } from '../lib/session.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');
const strict = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/teacher/register', strict, async (req, reply) => {
    const b = teacherRegisterSchema.parse(req.body);
    const email = b.email.toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) return reply.code(409).send({ error: 'email_taken' });
    const u = await prisma.user.create({
      data: { role: 'TEACHER', email, displayName: b.displayName, passwordHash: await hashPassword(b.password) },
    });
    await startSession(reply, u.id);
    return reply.code(201).send({ user: { id: u.id, role: u.role, displayName: u.displayName } });
  });

  app.post('/api/auth/teacher/login', strict, async (req, reply) => {
    const b = teacherLoginSchema.parse(req.body);
    const u = await prisma.user.findUnique({ where: { email: b.email.toLowerCase() } });
    if (!u || u.role !== 'TEACHER' || !(await verifyPassword(b.password, u.passwordHash)))
      return reply.code(401).send({ error: 'invalid_credentials' });
    await startSession(reply, u.id);
    return { user: { id: u.id, role: u.role, displayName: u.displayName } };
  });

  app.post('/api/auth/student/register', strict, async (req, reply) => {
    const b = studentRegisterSchema.parse(req.body);
    const cls = await prisma.classroom.findUnique({ where: { joinCode: b.classCode } });
    if (!cls) return reply.code(404).send({ error: 'class_not_found' });
    const taken = await prisma.enrollment.findFirst({
      where: { classroomId: cls.id, user: { nickname: { equals: b.nickname, mode: 'insensitive' } } },
    });
    if (taken) return reply.code(409).send({ error: 'nickname_taken' });
    const u = await prisma.user.create({
      data: {
        role: 'STUDENT', nickname: b.nickname, displayName: b.nickname,
        passwordHash: await hashPassword(b.password),
        enrollment: { create: { classroomId: cls.id } },
      },
    });
    await startSession(reply, u.id);
    return reply.code(201).send({ user: { id: u.id, role: u.role, displayName: u.displayName, classroomId: cls.id } });
  });

  app.post('/api/auth/student/login', strict, async (req, reply) => {
    const b = studentLoginSchema.parse(req.body);
    const e = await prisma.enrollment.findFirst({
      where: { classroom: { joinCode: b.classCode }, user: { nickname: { equals: b.nickname, mode: 'insensitive' } } },
      include: { user: true },
    });
    if (!e || !(await verifyPassword(b.password, e.user.passwordHash)))
      return reply.code(401).send({ error: 'invalid_credentials' });
    await startSession(reply, e.user.id);
    return { user: { id: e.user.id, role: e.user.role, displayName: e.user.displayName, classroomId: e.classroomId } };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    await endSession(req, reply);
    return { ok: true };
  });

  app.get('/api/auth/me', async (req) => {
    await loadUser(req);
    if (!req.user) return { user: null };
    const e = await prisma.enrollment.findUnique({ where: { userId: req.user.id } });
    return { user: { ...req.user, classroomId: e?.classroomId } };
  });

  // --- Öğretmen: sınıf yönetimi (yalnızca kendi sınıfları) ---
  app.post('/api/classrooms', { preHandler: requireRole('TEACHER') }, async (req, reply) => {
    const b = classroomCreateSchema.parse(req.body);
    for (let i = 0; i < 5; i++) {
      try {
        const c = await prisma.classroom.create({ data: { name: b.name, joinCode: newCode(), teacherId: req.user!.id } });
        return reply.code(201).send({ classroom: c });
      } catch (err: any) { if (err?.code !== 'P2002') throw err; }
    }
    return reply.code(500).send({ error: 'code_generation_failed' });
  });

  app.get('/api/classrooms', { preHandler: requireRole('TEACHER') }, async (req) => {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: req.user!.id }, orderBy: { createdAt: 'desc' },
      include: { _count: { select: { enrollments: true } } },
    });
    return { classrooms };
  });
}
