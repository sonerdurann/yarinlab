import { createHash, randomBytes } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@prisma/client';
import { prisma } from '../db.js';

export const COOKIE = 'yl_session';
const TTL_MS = 1000 * 60 * 60 * 24 * 14;
const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export type AuthUser = { id: string; role: Role; displayName: string };
declare module 'fastify' { interface FastifyRequest { user?: AuthUser } }

export async function startSession(reply: FastifyReply, userId: string) {
  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({ data: { id: hash(token), userId, expiresAt: new Date(Date.now() + TTL_MS) } });
  reply.setCookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: TTL_MS / 1000,
    secure: process.env.COOKIE_SECURE === 'true',
  });
}
export async function endSession(req: FastifyRequest, reply: FastifyReply) {
  const t = req.cookies[COOKIE];
  if (t) await prisma.session.deleteMany({ where: { id: hash(t) } });
  reply.clearCookie(COOKIE, { path: '/' });
}
export async function loadUser(req: FastifyRequest) {
  const t = req.cookies[COOKIE];
  if (!t) return;
  const s = await prisma.session.findUnique({ where: { id: hash(t) }, include: { user: true } });
  if (!s || s.expiresAt < new Date()) return;
  req.user = { id: s.user.id, role: s.user.role, displayName: s.user.displayName };
}
export const requireAuth = async (req: FastifyRequest, reply: FastifyReply) => {
  await loadUser(req);
  if (!req.user) return reply.code(401).send({ error: 'unauthorized' });
};
export const requireRole = (role: Role) => async (req: FastifyRequest, reply: FastifyReply) => {
  await loadUser(req);
  if (!req.user) return reply.code(401).send({ error: 'unauthorized' });
  if (req.user.role !== role) return reply.code(403).send({ error: 'forbidden' });
};
