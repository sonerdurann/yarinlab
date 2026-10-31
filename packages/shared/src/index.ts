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
export * from './sim';

const finite = z.number().finite();
export const resourcesSchema = z.object({ budget: finite, foodWasteKg: finite, energyScore: finite, waterScore: finite, wellbeing: finite });
export const SCENARIO_ID_RE = /^[a-z]+_\d{3}$/;
export const attemptSchema = z.object({
  scenarioId: z.string().regex(SCENARIO_ID_RE),
  choiceId: z.string().regex(/^[A-Z]$/),
  reasoning: z.string().trim().max(280).optional(),
  before: resourcesSchema,
  after: resourcesSchema,
  score: z.object({ outcome: finite, reasoning: finite, balance: finite, total: finite }),
  day: z.number().int().min(0).max(100000),
});
export type AttemptInput = z.infer<typeof attemptSchema>;
export const MAX_SAVE_BYTES = 400_000;
export const saveSchema = z.object({
  version: z.number().int().min(0),
  state: z.object({
    history: z.array(z.unknown()).max(2000),
    sim: z.object({ seed: z.number().int(), day: z.number().int().min(0) }).passthrough(),
  }).passthrough(),
});
export * from './content';
export * from './ai';
export const assessmentSchema = z.object({
  moduleId: z.enum(['energy', 'carbon', 'city', 'food', 'ocean', 'waste', 'council']),
  kind: z.enum(['PRE', 'POST']),
  answers: z.record(z.string().max(20), z.number().int().min(0).max(10)),
});
