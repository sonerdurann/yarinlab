import { z } from 'zod';

export const NICKNAME_RE = /^[\p{L}\p{N}_ -]{3,20}$/u;

export const teacherRegisterSchema = z.object({
  email: z.email().max(120),
  password: z.string().min(8).max(100),
  displayName: z.string().trim().min(2).max(60),
});
export const teacherLoginSchema = z.object({ email: z.email(), password: z.string().min(1).max(100) });
export const studentRegisterSchema = z.object({
  classCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/),
  nickname: z.string().trim().regex(NICKNAME_RE),
  password: z.string().min(6).max(100),
});
export const studentLoginSchema = studentRegisterSchema;
export const classroomCreateSchema = z.object({ name: z.string().trim().min(2).max(60) });

export type Role = 'STUDENT' | 'TEACHER';
export type PublicUser = { id: string; role: Role; displayName: string; classroomId?: string };
