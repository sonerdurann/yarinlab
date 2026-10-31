import { ASSESSMENTS, LEARNING_OUTCOMES, MODULES, REAL_WORLD_TASKS, RUBRIC, RUBRIC_LEVEL_TR, rubricLevel, taskById, TASKS, type ModuleId, type RubricLevel } from '@yarinlab/shared';

export type Score = { outcome: number; reasoning: number; balance: number; total: number };
export type ReportData = {
  classroom: { id: string; name: string; joinCode: string };
  students: { id: string; nickname: string; groupId: string | null; groupName: string | null }[];
  attempts: { userId: string; taskId: string; choiceId: string; reasoning: string | null; score: Score | null; createdAt: Date }[];
  assessments: { userId: string; moduleId: string; kind: string; answers: Record<string, number>; score: number; createdAt: Date }[];
  measurements: { userId: string; classroomId: string | null; taskKey: string; phase: string; value: number; unit: string; students?: number | null; days?: number | null; createdAt: Date }[];
  assignments: { id: string; title: string; taskIds: string[]; moduleId: string | null; realWorldTaskId: string | null; groupId: string | null; dueAt: Date | null }[];
};

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/** Sınıf raporu: yalnızca kendi sınıfının verisiyle çağrılır (yetki rotada denetlenir). Hiçbir kişisel iletişim bilgisi içermez. */
export function buildClassReport(d: ReportData, now = new Date()) {
  const byStudent = new Map(d.students.map((s) => [s.id, s]));
  const attempts = d.attempts.filter((a) => byStudent.has(a.userId));
  const completed = new Map<string, Set<string>>(); // öğrenci → gerekçeli tamamlanan görevler
  for (const a of attempts) if (a.reasoning) (completed.get(a.userId) ?? completed.set(a.userId, new Set()).get(a.userId)!).add(a.taskId);
  // öğrenci-görev başına son deneme
  const latest = new Map<string, (typeof attempts)[number]>();
  for (const a of [...attempts].sort((x, y) => +x.createdAt - +y.createdAt)) latest.set(`${a.userId}|${a.taskId}`, a);

  const prePostOf = (userId: string, moduleId: string) => {
    const as = d.assessments.filter((a) => a.userId === userId && a.moduleId === moduleId).sort((x, y) => +x.createdAt - +y.createdAt);
    return { pre: as.find((a) => a.kind === 'PRE')?.score ?? null, post: [...as].reverse().find((a) => a.kind === 'POST')?.score ?? null };
  };

  const students = d.students.map((s) => {
    const mine = attempts.filter((a) => a.userId === s.id);
    const scores = mine.map((a) => a.score).filter((x): x is Score => !!x);
    const done = completed.get(s.id) ?? new Set<string>();
    const mis = mine.filter((a) => taskById(a.taskId)?.choices.find((c) => c.id === a.choiceId)?.misconception).length;
    const byTask = new Map<string, Set<string>>();
    for (const a of mine) (byTask.get(a.taskId) ?? byTask.set(a.taskId, new Set()).get(a.taskId)!).add(a.choiceId);
    const comparePct = byTask.size ? Math.round((100 * [...byTask.values()].filter((c) => c.size >= 2).length) / byTask.size) : 0;
    const myM = d.measurements.filter((m) => m.userId === s.id);
    const field = (myM.some((m) => m.phase === 'BASELINE') ? 1 : 0) + (myM.some((m) => m.phase === 'FOLLOWUP') ? 1 : 0);
    const values: Record<string, number> = { reasoning: avg(scores.map((x) => x.reasoning)) ?? 0, balance: avg(scores.map((x) => x.balance)) ?? 0, compare: comparePct, field };
    const rubric = Object.fromEntries(RUBRIC.map((r) => [r.id, mine.length || r.id === 'field' ? rubricLevel(values[r.id], r.cut) : null])) as Record<string, RubricLevel | null>;
    return {
      rubric,
      id: s.id, nickname: s.nickname, group: s.groupName,
      completedTasks: done.size,
      modulesPlayed: new Set([...done].map((t) => t.split('_')[0])).size,
      attempts: mine.length,
      avgTotal: avg(scores.map((x) => x.total)), avgReasoning: avg(scores.map((x) => x.reasoning)), avgBalance: avg(scores.map((x) => x.balance)),
      misconceptionChoices: mis,
      lastActive: mine.length ? new Date(Math.max(...mine.map((a) => +a.createdAt))).toISOString() : null,
      prePost: Object.fromEntries(MODULES.map((m) => [m.id, prePostOf(s.id, m.id)])),
    };
  });

  // Kazanım düzeyi: ilgili görevlerdeki son deneme puanları + ilgili değerlendirme sorularındaki doğruluk.
  const outcomes = Object.entries(LEARNING_OUTCOMES).map(([id, text]) => {
    const taskScores = [...latest.values()].filter((a) => a.score && taskById(a.taskId)?.learningOutcomeIds.includes(id)).map((a) => a.score!.total);
    const qs = Object.values(ASSESSMENTS).flat().filter((q) => q.outcome === id);
    const qScores: number[] = [];
    for (const a of d.assessments) for (const q of qs) if (q.id in a.answers) qScores.push(a.answers[q.id] === q.answer ? 100 : 0);
    const all = [...taskScores, ...qScores];
    return { id, text, pct: avg(all), evidence: all.length, fromTasks: taskScores.length, fromQuestions: qScores.length };
  });

  // Kavram yanılgısı raporu: yanılgı işaretli seçenekler; gerekçesiz seçim ayrıca sayılır.
  const misMap = new Map<string, { taskId: string; title: string; choiceId: string; text: string; students: Set<string>; withoutReasoning: number; laterCorrected: number }>();
  for (const a of attempts) {
    const t = taskById(a.taskId);
    const c = t?.choices.find((x) => x.id === a.choiceId);
    if (!t || !c?.misconception) continue;
    const k = `${a.taskId}|${a.choiceId}`;
    const e = misMap.get(k) ?? { taskId: t.id, title: t.title, choiceId: c.id, text: c.misconception, students: new Set(), withoutReasoning: 0, laterCorrected: 0 };
    e.students.add(a.userId);
    if (!a.reasoning) e.withoutReasoning++;
    const last = latest.get(`${a.userId}|${a.taskId}`);
    if (last && last !== a && !t.choices.find((x) => x.id === last.choiceId)?.misconception) e.laterCorrected++;
    misMap.set(k, e);
  }
  const misconceptions = [...misMap.values()].map((e) => ({ ...e, students: e.students.size })).sort((a, b) => b.students - a.students);

  const n = d.students.length;
  const modules = MODULES.map((m) => {
    const ids = TASKS.filter((t) => t.module === m.id).map((t) => t.id);
    const per = d.students.map((s) => ids.filter((i) => completed.get(s.id)?.has(i)).length);
    const pp = d.students.map((s) => prePostOf(s.id, m.id)).filter((x) => x.pre !== null && x.post !== null);
    return {
      id: m.id as ModuleId, name: m.name, tasks: ids.length,
      startedPct: n ? Math.round((100 * per.filter((x) => x > 0).length) / n) : 0,
      completedPct: n ? Math.round((100 * per.filter((x) => x === ids.length).length) / n) : 0,
      avgDone: n ? Math.round((10 * per.reduce((a, b) => a + b, 0)) / n) / 10 : 0,
      pre: avg(pp.map((x) => x.pre!)), post: avg(pp.map((x) => x.post!)), prePostN: pp.length,
    };
  });

  const reasonings = [...attempts].filter((a) => a.reasoning).sort((x, y) => +y.createdAt - +x.createdAt).slice(0, 100).map((a) => {
    const t = taskById(a.taskId);
    return { nickname: byStudent.get(a.userId)!.nickname, taskId: a.taskId, title: t?.title ?? a.taskId, choice: t?.choices.find((c) => c.id === a.choiceId)?.label ?? a.choiceId,
      reasoning: a.reasoning!, total: a.score?.total ?? null, reasoningScore: a.score?.reasoning ?? null, misconception: !!t?.choices.find((c) => c.id === a.choiceId)?.misconception, at: a.createdAt.toISOString() };
  });

  const assignments = d.assignments.map((as) => {
    const target = d.students.filter((s) => !as.groupId || s.groupId === as.groupId);
    const doneBy = target.filter((s) => {
      const tasksOk = as.taskIds.every((t) => completed.get(s.id)?.has(t));
      const rwOk = !as.realWorldTaskId || d.measurements.some((m) => m.taskKey === as.realWorldTaskId && m.phase === 'FOLLOWUP' && (m.userId === s.id || m.classroomId === d.classroom.id));
      return tasksOk && rwOk;
    });
    return { id: as.id, title: as.title, taskIds: as.taskIds, realWorldTaskId: as.realWorldTaskId, groupId: as.groupId, dueAt: as.dueAt?.toISOString() ?? null,
      target: target.length, completed: doneBy.length, pct: target.length ? Math.round((100 * doneBy.length) / target.length) : 0,
      overdue: !!as.dueAt && as.dueAt < now && doneBy.length < target.length, pending: target.filter((s) => !doneBy.includes(s)).map((s) => s.nickname) };
  });

  // Gerçek dünya: başlangıç ve sonuç ölçümleri (Ölçülmüş). Fark yalnızca ikisi de varsa hesaplanır; etki iddiası değildir.
  const realWorld = REAL_WORLD_TASKS.map((r) => {
    const ms = d.measurements.filter((m) => m.taskKey === r.key);
    const b = ms.filter((m) => m.phase === 'BASELINE').map((m) => m.value), f = ms.filter((m) => m.phase === 'FOLLOWUP').map((m) => m.value);
    const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, c) => a + c, 0) / xs.length) * 100) / 100 : null);
    const bm = mean(b), fm = mean(f);
    // Tartım: toplam kg, öğrenci ve gün sayısıyla gram/öğrenci/gün'e çevrilir (kılavuz §19: gerçek tartım + öğrenci + öğün).
    const norm = (phase: string) => mean(ms.filter((m) => m.phase === phase && m.students && m.days).map((m) => (m.value * 1000) / (m.students! * m.days!)));
    const per = 'perStudent' in r && r.perStudent ? { baselineGps: norm('BASELINE'), followupGps: norm('FOLLOWUP') } : null;
    return { key: r.key, title: r.title, unit: r.unit, baseline: bm, followup: fm, change: bm !== null && fm !== null ? Math.round((fm - bm) * 100) / 100 : null, nBaseline: b.length, nFollowup: f.length, label: 'Ölçülmüş' as const, perStudent: per };
  });

  const rubricSummary = RUBRIC.map((r) => {
    const lv = students.map((st) => st.rubric[r.id]).filter((x): x is RubricLevel => !!x);
    return { id: r.id, name: r.name, levels: r.levels, counts: { baslangic: lv.filter((x) => x === 'baslangic').length, gelisen: lv.filter((x) => x === 'gelisen').length, yetkin: lv.filter((x) => x === 'yetkin').length } };
  });
  const kpis = {
    students: n,
    activeStudents: students.filter((st) => st.attempts > 0).length,
    completedTasks: students.reduce((a, st) => a + st.completedTasks, 0),
    prePostPairs: modules.reduce((a, m) => a + m.prePostN, 0),
    avgReasoning: avg(students.map((st) => st.avgReasoning).filter((x): x is number => x !== null)),
  };
  return {
    generatedAt: now.toISOString(),
    kpis, rubric: rubricSummary, rubricLevelNames: RUBRIC_LEVEL_TR,
    classroom: { id: d.classroom.id, name: d.classroom.name },
    studentsCount: n,
    students, outcomes, misconceptions, modules, reasonings, assignments, realWorld,
    notes: [
      'Oyun puanları ve göstergeler simülasyondur; gerçek saha sonucu değildir.',
      'Gerçek dünya değerleri öğrenci/öğretmen tarafından girilen ölçümlerdir (Ölçülmüş); doğrulanmış çevresel fayda iddiası değildir.',
      'Rapor ad-soyad, e-posta, konum veya fotoğraf içermez; öğrenciler takma adla yer alır.',
    ],
  };
}
export type ClassReport = ReturnType<typeof buildClassReport>;

/** Formül enjeksiyonuna karşı korumalı CSV hücresi (Excel/Sheets). */
export const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Excel uyumlu (noktalı virgül, UTF-8 BOM) öğrenci ilerleme CSV'si. */
export function reportToCsv(r: ClassReport): string {
  const mods = MODULES.map((m) => m.id);
  const head = ['Takma ad', 'Grup', ...RUBRIC.map((x) => `Rubrik: ${x.name}`), 'Tamamlanan görev', 'Oynanan modül', 'Deneme', 'Ort. puan', 'Ort. gerekçe', 'Ort. denge', 'Yanılgı seçimi', 'Son etkinlik',
    ...mods.flatMap((m) => [`${m} ön %`, `${m} son %`])];
  const rows = r.students.map((s) => [s.nickname, s.group ?? '', ...RUBRIC.map((x) => (s.rubric[x.id] ? RUBRIC_LEVEL_TR[s.rubric[x.id]!] : '')), s.completedTasks, s.modulesPlayed, s.attempts, s.avgTotal ?? '', s.avgReasoning ?? '', s.avgBalance ?? '', s.misconceptionChoices, s.lastActive ?? '',
    ...mods.flatMap((m) => [s.prePost[m].pre ?? '', s.prePost[m].post ?? ''])]);
  const out = [head, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
  const outcomes = ['', 'Kazanım;Düzey %;Kanıt sayısı', ...r.outcomes.filter((o) => o.evidence).map((o) => [o.id + ' ' + o.text, o.pct ?? '', o.evidence].map(csvCell).join(';'))].join('\r\n');
  const rw = ['', 'Gerçek dünya (Ölçülmüş);Birim;Başlangıç ort.;Sonuç ort.;Fark;g/öğrenci/gün başlangıç;g/öğrenci/gün sonuç;n başlangıç;n sonuç', ...r.realWorld.filter((x) => x.nBaseline || x.nFollowup).map((x) => [x.title, x.unit, x.baseline ?? '', x.followup ?? '', x.change ?? '', x.perStudent?.baselineGps ?? '', x.perStudent?.followupGps ?? '', x.nBaseline, x.nFollowup].map(csvCell).join(';'))].join('\r\n');
  return '﻿' + out + '\r\n' + outcomes + '\r\n' + rw + '\r\n\r\n' + r.notes.map(csvCell).join('\r\n') + '\r\n';
}
