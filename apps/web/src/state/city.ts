import {
  BASE_SYSTEMS, computeCity, earnedBadges, levelForXp, literacyIndex, type CityResult, type ModuleSystems, type ProgressFacts,
} from '@yarinlab/shared';
import type { GameState } from './gameStore';
import { composeWorld } from './composeWorld';

/** Senaryo kimliğinden modül: food_001 → food */
export const moduleOf = (scenarioId: string) => scenarioId.split('_')[0];

/** Görev kararlarından gelen modül sistemleri tek yapıda birleşir (tanımsız alan taban değerinde kalır). */
export function systemsOf(s: Pick<GameState, 'energySystem' | 'wasteSystem' | 'citySystem' | 'carbonSystem' | 'oceanSystem' | 'councilSystem'>): ModuleSystems {
  return { ...BASE_SYSTEMS, ...s.energySystem, ...s.wasteSystem, ...s.citySystem, ...s.carbonSystem, ...s.oceanSystem, ...s.councilSystem };
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
