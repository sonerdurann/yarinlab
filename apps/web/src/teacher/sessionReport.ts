import type { DecisionResult } from '../state/types';
import type { SchoolMeasure } from './report';

/** Bu cihazdaki tek oturumun anonim raporu (kılavuz §12, §16). Ad, e-posta, konum, fotoğraf içermez. */
export type SessionReport = {
  schemaVersion: 1;
  demo: false;
  sessionId: string;
  generatedAt: string;
  scenario: { id: string; version: string; modelVersion: string | null };
  taskComplete: boolean;
  attempts: {
    order: number;
    scenarioId: string;
    choiceId: string;
    before: DecisionResult['before'];
    after: DecisionResult['after'];
    reasoning: string | null;
  }[];
  reflection: [string, string];
  transferAnswer: string;
  guideSource: 'ai' | 'fallback' | null;
  schoolMeasure: SchoolMeasure | null;
  notes: string[];
};

export type ReportInput = {
  sessionId: string;
  generatedAt: string;
  scenario: { id: string; version: string };
  history: DecisionResult[];
  reflection: [string, string];
  transferAnswer: string;
  taskComplete: boolean;
  guideSource: 'ai' | 'fallback' | null;
  schoolMeasure: SchoolMeasure | null;
};

export function buildSessionReport(i: ReportInput): SessionReport {
  return {
    schemaVersion: 1,
    demo: false,
    sessionId: i.sessionId,
    generatedAt: i.generatedAt,
    scenario: { id: i.scenario.id, version: i.scenario.version, modelVersion: i.history[0]?.modelVersion ?? null },
    taskComplete: i.taskComplete,
    attempts: i.history.map((h, k) => ({ order: k + 1, scenarioId: h.scenarioId, choiceId: h.choiceId, before: h.before, after: h.after, reasoning: h.reasoning ?? null })),
    reflection: i.reflection,
    transferAnswer: i.transferAnswer,
    guideSource: i.guideSource,
    schoolMeasure: i.schoolMeasure,
    notes: [
      'Değerler simülasyon göstergeleridir; gerçek saha ölçümü değildir.',
      'Gerekçe ve cevaplar öğrencinin yazdığı serbest metindir; paylaşmadan önce öğretmen incelemesi gerekir.',
      'Enerji ve atık denemeleri aynı listede scenarioId ile durur.',
    ],
  };
}

/** CSV hücresi: tırnak kaçışı + elektronik tablo formül enjeksiyonuna karşı önek (= + - @ TAB CR). */
export function csvCell(v: string | number | null): string {
  let s = v === null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Her deneme bir satır; Türkçe Excel için `;` ayırıcılı değil, standart `,` + BOM indirme tarafında eklenir. */
export function reportToCsv(r: SessionReport): string {
  const head = ['oturum', 'senaryo', 'deneme', 'secenek', 'atik_once_kg', 'atik_sonra_kg', 'butce_once', 'butce_sonra', 'memnuniyet_once', 'memnuniyet_sonra', 'gerekce', 'gorev_tamam'];
  const rows = r.attempts.map((a) =>
    [r.sessionId, a.scenarioId, a.order, a.choiceId, a.before.foodWasteKg, a.after.foodWasteKg, a.before.budget, a.after.budget, a.before.wellbeing, a.after.wellbeing, a.reasoning, r.taskComplete ? 'evet' : 'hayır'].map(csvCell).join(','),
  );
  return [head.join(','), ...rows].join('\r\n') + '\r\n';
}
