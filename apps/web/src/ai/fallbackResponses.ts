import data from './aiFallback.tr.json';
import type { DecisionResult } from '../state/types';
import { fallbackFeedback } from '@yarinlab/shared';
import { playableById } from '../data/scenarios';

/** Kılavuz §18 çıktı sözleşmesi. */
export type TutorResponse = {
  summary: string;
  tradeoff: string;
  question1: string;
  question2: string;
  sourceIds: string[];
};

type Template = Omit<TutorResponse, 'sourceIds'>;
const fmt = (n: number) => n.toLocaleString('tr-TR');

/** Yer tutucular yalnızca doğrulanmış kural motoru sonucundan doldurulur. */
export function fillTemplate(t: string, r: DecisionResult): string {
  const v: Record<string, string> = {
    wasteBefore: fmt(r.before.foodWasteKg),
    wasteAfter: fmt(r.after.foodWasteKg),
    budgetBefore: fmt(r.before.budget),
    budgetAfter: fmt(r.after.budget),
    wellbeingBefore: fmt(r.before.wellbeing),
    wellbeingAfter: fmt(r.after.wellbeing),
    energyBefore: fmt(r.before.energyScore),
    energyAfter: fmt(r.after.energyScore),
    waterBefore: fmt(r.before.waterScore),
    waterAfter: fmt(r.after.waterScore),
  };
  return t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');
}

export function fallbackForResult(r: DecisionResult): TutorResponse {
  const byScenario = (data.byScenario as Record<string, Record<string, Template>> | undefined)?.[r.scenarioId];
  const t = byScenario?.[r.choiceId] ?? (r.scenarioId === 'food_001' ? (data.byChoice as Record<string, Template>)[r.choiceId] : undefined);
  // Elle yazılmış metni olmayan görevler: görev verisinden üretilen doğrulanmış geri bildirim.
  if (!t) return fallbackFeedback({ scenarioId: r.scenarioId, choiceId: r.choiceId, before: r.before, after: r.after, reasoning: r.reasoning });
  const sourceIds = playableById(r.scenarioId).evidenceRefs.slice(0, 3);
  return {
    summary: fillTemplate(t.summary, r),
    tradeoff: t.tradeoff,
    question1: t.question1,
    question2: t.question2,
    sourceIds,
  };
}

export function fallbackForComparison(): TutorResponse {
  return { ...data.comparison, sourceIds: data.sourceIds };
}

export const FALLBACK_VERSION = data.version;
