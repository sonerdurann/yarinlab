import { describe, expect, it } from 'vitest';
import { applyChoice, runDecision } from '../game/systems/DecisionEngine';
import { isValidState, wasteCollection } from '../game/systems/ClimateEngine';
import type { Choice, Resources, Scenario } from '../state/types';

const base: Resources = { budget: 12000, foodWasteKg: 30, energyScore: 76, waterScore: 81, wellbeing: 75 };
const scenario: Scenario = {
  id: 't', version: '1', baseline: base, learningOutcomeIds: [], evidenceRefs: [],
  choices: [{ id: 'a', label: 'A', tradeoff: '', deltas: { foodWasteKg: -10, wellbeing: 5 } }],
};

describe('applyChoice', () => {
  it('T03: aynı karar aynı başlangıçta 3 kez aynı sonucu verir', () => {
    const r = [1, 2, 3].map(() => runDecision(scenario, 'a').after);
    expect(r[1]).toEqual(r[0]);
    expect(r[2]).toEqual(r[0]);
  });
  it('başlangıç durumunu değiştirmez', () => {
    const copy = { ...base };
    applyChoice(base, scenario.choices[0]);
    expect(base).toEqual(copy);
  });
  it('T05: atık 0 altına inmez, skorlar 0-100 sınırında kalır', () => {
    const wild: Choice = { id: 'w', label: 'w', tradeoff: '', deltas: { foodWasteKg: -999, energyScore: 999, waterScore: -999, wellbeing: 1e9 } };
    const out = applyChoice(base, wild);
    expect(out.foodWasteKg).toBe(0);
    expect(out.energyScore).toBe(100);
    expect(out.waterScore).toBe(0);
    expect(out.wellbeing).toBe(100);
    expect(isValidState(out)).toBe(true);
  });
  it('bilinmeyen seçenek hata verir', () => {
    expect(() => runDecision(scenario, 'x')).toThrow();
  });
});

describe('wasteCollection çapraz kural', () => {
  it('gıda atığı azalınca toplama ihtiyacı azalır', () => {
    expect(wasteCollection(30).collectionNeed).toBeGreaterThanOrEqual(wasteCollection(18).collectionNeed);
    expect(wasteCollection(30, 0, 25).collectionNeed).toBe(2);
    expect(wasteCollection(0, 0, 25).collectionNeed).toBe(0);
  });
});

import { scenarioImpactScore } from '../game/systems/ClimateEngine';
import { food } from '../data/scenarios';

describe('scenarioImpactScore', () => {
  const score = (c: Choice) => scenarioImpactScore(applyChoice(food.baseline, c), food.baseline);
  it('0-100 aralığında, deterministik ve karar yok durumundan yüksek', () => {
    const none = score(food.noDecision);
    for (const c of food.choices) {
      const s = score(c);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
      expect(score(c)).toBe(s);
    }
    expect(score(food.choices[1])).toBeGreaterThan(none);
  });
  it('uç değerlerde sınırlı kalır', () => {
    const extreme = { ...food.baseline, foodWasteKg: 9999, budget: -5000, wellbeing: 500 };
    expect(scenarioImpactScore(extreme, food.baseline)).toBeLessThanOrEqual(100);
    expect(scenarioImpactScore(extreme, food.baseline)).toBeGreaterThanOrEqual(0);
  });
});
