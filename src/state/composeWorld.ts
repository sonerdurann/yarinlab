import { food } from '../data/scenarios';
import type { DecisionResult, Resources } from './types';

const SCORE = ['energyScore', 'waterScore', 'wellbeing'] as const;
const ORDER = ['food_001', 'energy_001', 'waste_001', 'city_001', 'carbon_001', 'ocean_001', 'council_001'] as const;

/** Son uygulanan modül kararlarının deltalarını ortak sabah durumuna ekler. Her modül kendi baseline'ından ölçülür. */
export function composeWorld(applied: Partial<Record<string, DecisionResult>>): Resources {
  const w: Resources = { ...food.baseline };
  for (const id of ORDER) {
    const r = applied[id];
    if (!r) continue;
    w.budget += r.after.budget - r.before.budget;
    w.foodWasteKg += r.after.foodWasteKg - r.before.foodWasteKg;
    for (const k of SCORE) w[k] += r.after[k] - r.before[k];
  }
  w.foodWasteKg = Math.max(0, w.foodWasteKg);
  for (const k of SCORE) w[k] = Math.max(0, Math.min(100, w[k]));
  return w;
}
