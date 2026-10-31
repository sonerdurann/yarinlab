import data from './aiFallback.tr.json';
import type { DecisionResult } from '../state/types';

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
  };
  return t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');
}

export function fallbackForResult(r: DecisionResult): TutorResponse {
  const byChoice = data.byChoice as Record<string, Template>;
  const t = byChoice[r.choiceId] ?? data.unknownChoice;
  return {
    summary: fillTemplate(t.summary, r),
    tradeoff: t.tradeoff,
    question1: t.question1,
    question2: t.question2,
    sourceIds: data.sourceIds,
  };
}

export function fallbackForComparison(): TutorResponse {
  return { ...data.comparison, sourceIds: data.sourceIds };
}

export const FALLBACK_VERSION = data.version;
