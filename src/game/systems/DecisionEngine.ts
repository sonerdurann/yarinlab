import { MODEL_VERSION, SCORE_KEYS, SCORE_MAX, SCORE_MIN } from '../../data/constants';
import type { Choice, DecisionResult, Resources, Scenario } from '../../state/types';

export function applyChoice(before: Resources, choice: Choice): Resources {
  const next = { ...before };
  for (const [key, delta] of Object.entries(choice.deltas)) {
    const k = key as keyof Resources;
    next[k] = before[k] + (delta ?? 0);
  }
  next.foodWasteKg = Math.max(0, next.foodWasteKg);
  for (const key of SCORE_KEYS) {
    next[key] = Math.max(SCORE_MIN, Math.min(SCORE_MAX, next[key]));
  }
  return next;
}

/** Her zaman senaryonun baseline durumundan başlar; böylece "tekrar dene" ilk durumu korur. */
export function runDecision(
  scenario: Scenario,
  choiceId: string,
  reasoning?: string,
): DecisionResult {
  const choice = scenario.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Bilinmeyen seçenek: ${choiceId}`);
  const before = { ...scenario.baseline };
  return {
    scenarioId: scenario.id,
    choiceId,
    before,
    after: applyChoice(before, choice),
    reasoning,
    modelVersion: `${MODEL_VERSION}/${scenario.version}`,
  };
}
