import {
  BASE_SYSTEMS, computeCity, earnedBadges, levelForXp, literacyIndex, type CityResult, type ModuleSystems, type ProgressFacts,
} from '@yarinlab/shared';
import type { GameState } from './gameStore';
import { composeWorld } from './composeWorld';
import { TASKS } from '@yarinlab/shared';
import type { DecisionResult } from './types';
import { playableScenarios } from '../data/scenarios';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const LIMITS: Partial<Record<keyof ModuleSystems, [number, number]>> = {
  renewableShare: [0, 100], sealedShare: [0, 100], greenShare: [0, 100], rainShare: [0, 100], transitShare: [0, 100],
  claimScore: [0, 100], habitatCare: [0, 100], sortingRecovery: [0, 0.9], efficiency: [-0.2, 0.45], otherWasteKg: [2, 60],
  evidenceBias: [-40, 40], solarKw: [0, 2000], windKw: [0, 2000], storageKwh: [0, 5000], storageUnits: [0, 20], shade: [-20, 60],
};

/**
 * Modül sistemlerini uygulanmış kararlardan türetir (deterministik). Görevler sırayla işlenir:
 * `system` mutlak değer atar, `systemAdd` ekler. Böylece bir modülün sonraki görevi öncekinin etkisini silmez.
 */
export function deriveFlatSystems(applied: Partial<Record<string, DecisionResult>>): ModuleSystems {
  const f: ModuleSystems = { ...BASE_SYSTEMS };
  for (const t of TASKS) {
    const r = applied[t.id];
    if (!r) continue;
    const sc = playableScenarios[t.id];
    const c = r.choiceId === 'N' ? sc.noDecision : sc.choices.find((x) => x.id === r.choiceId);
    if (!c) continue;
    Object.assign(f, c.system ?? {});
    for (const [k, v] of Object.entries(c.systemAdd ?? {})) (f as Record<string, number>)[k] += v as number;
  }
  for (const [k, [lo, hi]] of Object.entries(LIMITS) as [keyof ModuleSystems, [number, number]][]) f[k] = clamp(f[k], lo, hi);
  return f;
}

export function deriveSystems(applied: Partial<Record<string, DecisionResult>>) {
  const f = deriveFlatSystems(applied);
  return {
    energySystem: { renewableShare: f.renewableShare, storageUnits: f.storageUnits, solarKw: f.solarKw, windKw: f.windKw, storageKwh: f.storageKwh, efficiency: f.efficiency },
    wasteSystem: { otherWasteKg: f.otherWasteKg, sortingRecovery: f.sortingRecovery },
    citySystem: { sealedShare: f.sealedShare, greenShare: f.greenShare, rainShare: f.rainShare, shade: f.shade, transitShare: f.transitShare },
    carbonSystem: { claimScore: f.claimScore },
    oceanSystem: { habitatCare: f.habitatCare },
    councilSystem: { evidenceBias: f.evidenceBias },
  };
}

/** Senaryo kimliğinden modül: food_001 → food */
export const moduleOf = (scenarioId: string) => scenarioId.split('_')[0];

/** Görev kararlarından gelen modül sistemleri tek yapıda birleşir (tanımsız alan taban değerinde kalır). */
export function systemsOf(s: Pick<GameState, 'applied'>): ModuleSystems {
  return deriveFlatSystems(s.applied);
}

/** Görev tamamlama: kararın simüle edilmiş ve gerekçelendirilmiş olması. */
export function completedTaskIds(s: Pick<GameState, 'history'>): string[] {
  return [...new Set(s.history.filter((h) => !!h.reasoning).map((h) => h.scenarioId))];
}

export function progressFacts(s: GameState): ProgressFacts {
  const byTask = new Map<string, Set<string>>();
  for (const h of s.history) {
    if (!byTask.has(h.scenarioId)) byTask.set(h.scenarioId, new Set());
    byTask.get(h.scenarioId)!.add(h.choiceId);
  }
  return {
    decisions: s.history.length,
    reasonedDecisions: s.history.filter((h) => !!h.reasoning).length,
    completedTasks: completedTaskIds(s).length,
    modulesPlayed: new Set(s.history.map((h) => moduleOf(h.scenarioId))).size,
    comparedTasks: [...byTask.values()].filter((c) => c.size >= 2).length,
    buildings: s.sim.buildings.length,
    maxBuildingLevel: Math.max(0, ...s.sim.buildings.map((b) => b.level)),
    days: s.sim.day,
    greenEnergyDays: s.greenEnergyDays,
    councilDone: s.history.some((h) => moduleOf(h.scenarioId) === 'council' && !!h.reasoning),
    realWorldMeasurements: s.realWorldCount,
    assessmentsPost: s.assessmentsPost,
  };
}

export const avgReasoning = (s: GameState) =>
  s.scores.length ? s.scores.reduce((a, x) => a + x.reasoning, 0) / s.scores.length : 0;

export const literacyOf = (s: GameState) => literacyIndex(progressFacts(s), avgReasoning(s));

export function cityOf(s: GameState): CityResult {
  return computeCity(composeWorld(s.applied), systemsOf(s), s.sim, literacyOf(s));
}

export const levelOf = (s: GameState) => levelForXp(s.xp);
export const badgesOf = (s: GameState) => earnedBadges(progressFacts(s));
export const unlockCtx = (s: GameState) => ({
  completedTasks: completedTaskIds(s).length,
  modulesPlayed: [...new Set(completedTaskIds(s).map(moduleOf))],
  level: levelOf(s),
});
