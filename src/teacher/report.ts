import type { DemoStudent } from '../data/teacherDemo';

const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: number[]) => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

export type ClassSummary = {
  joined: number;
  completed: number;
  choiceCounts: Record<string, number>;
  /** En az iki farklı seçeneği deneyen tamamlayan sayısı */
  balanced: number;
  avgPre: number | null;
  avgPost: number | null;
  /** Yalnızca hem ön hem son testi olanlar; ham puan farkı, etki iddiası değildir */
  avgGain: number | null;
  avgRationale: number | null;
  duplicateCodes: string[];
};

/** Oturum sayısı çift sayım kontrolü: aynı anonim kod iki kez gelirse raporlanır ve bir kez sayılır. */
export function summarize(all: DemoStudent[]): ClassSummary {
  const seen = new Set<string>();
  const duplicateCodes: string[] = [];
  const students = all.filter((s) => {
    if (seen.has(s.code)) {
      duplicateCodes.push(s.code);
      return false;
    }
    seen.add(s.code);
    return true;
  });
  const done = students.filter((s) => s.completed);
  const choiceCounts: Record<string, number> = {};
  for (const s of done) if (s.choiceId) choiceCounts[s.choiceId] = (choiceCounts[s.choiceId] ?? 0) + 1;
  const paired = students.filter((s) => s.post !== null);
  return {
    joined: students.length,
    completed: done.length,
    choiceCounts,
    balanced: done.filter((s) => s.attempts >= 2).length,
    avgPre: mean(paired.map((s) => s.pre)),
    avgPost: mean(paired.map((s) => s.post as number)),
    avgGain: mean(paired.map((s) => (s.post as number) - s.pre)),
    avgRationale: mean(done.flatMap((s) => (s.rationaleScore === null ? [] : [s.rationaleScore]))),
    duplicateCodes,
  };
}

export type SchoolMeasure = { totalKg: number; students: number; days: number };

/** Öğretmenin girdiği gerçek okul ölçümü: kişisel veri yok, yalnızca toplam kg / öğrenci / gün. */
export function validateSchoolMeasure(m: { totalKg: unknown; students: unknown; days: unknown }): SchoolMeasure | null {
  const totalKg = Number(m.totalKg), students = Number(m.students), days = Number(m.days);
  if (![totalKg, students, days].every(Number.isFinite)) return null;
  if (totalKg < 0 || totalKg > 100000) return null;
  if (!Number.isInteger(students) || students < 1 || students > 5000) return null;
  if (!Number.isInteger(days) || days < 1 || days > 365) return null;
  return { totalKg, students, days };
}

/** kg / öğrenci / gün */
export const perStudentPerDay = (m: SchoolMeasure) => Math.round((m.totalKg / m.students / m.days) * 1000) / 1000;
