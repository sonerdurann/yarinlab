import { describe, expect, it } from 'vitest';
import { periodCaption, PERIODS } from '../ui/PeriodSwitch/PeriodSwitch';
import { food } from '../data/scenarios';
import { runDecision } from '../game/systems/DecisionEngine';

describe('dönem açıklaması', () => {
  it('üç dönem, kararsız/karar açıklamaları farklı', () => {
    expect(PERIODS.map((p) => p.id)).toEqual(['today', 'future-none', 'future-mine']);
    const texts = PERIODS.map((p) => periodCaption({ period: p.id, history: [] }));
    expect(new Set(texts).size).toBe(3);
  });

  it('kararlarınla: karar yokken yönlendirir, varken yalnızca motor sonucundaki sayıları kullanır', () => {
    expect(periodCaption({ period: 'future-mine', history: [] })).toMatch(/Önce Kantin/);
    const r = runDecision(food, 'B');
    const t = periodCaption({ period: 'future-mine', history: [r] });
    expect(t).toContain(String(r.after.foodWasteKg));
    expect(t).toContain(String(r.after.wellbeing));
    expect(t).not.toMatch(/CO2|CO₂|karbon/i);
  });
});
