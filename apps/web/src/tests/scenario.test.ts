import { describe, expect, it } from 'vitest';
import { food } from '../data/scenarios';
import { learningOutcomes } from '../data/learningOutcomes';
import { runDecision } from '../game/systems/DecisionEngine';
import { isValidState } from '../game/systems/ClimateEngine';

describe('food_001', () => {
  it('3 seçenek ve temsili tablo değerleri', () => {
    expect(food.choices).toHaveLength(3);
    const r = Object.fromEntries(food.choices.map((c) => [c.id, runDecision(food, c.id).after]));
    expect(r.A).toMatchObject({ foodWasteKg: 29, budget: 11900, wellbeing: 65 });
    expect(r.B).toMatchObject({ foodWasteKg: 20, budget: 11300, wellbeing: 87 });
    expect(r.C).toMatchObject({ foodWasteKg: 18, budget: 12200, wellbeing: 58 });
  });
  it('T04: her seçenek ilk durumu korur ve en az üç gösterge değişir', () => {
    for (const c of food.choices) {
      const res = runDecision(food, c.id);
      expect(res.before).toEqual(food.baseline);
      expect(isValidState(res.after)).toBe(true);
      const changed = (Object.keys(res.after) as (keyof typeof res.after)[]).filter((k) => res.after[k] !== res.before[k]);
      expect(changed.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('öğrenme çıktısı referansları geçerli', () => {
    const ids = learningOutcomes.map((l) => l.id as string);
    for (const id of food.learningOutcomeIds) expect(ids).toContain(id);
  });
});
