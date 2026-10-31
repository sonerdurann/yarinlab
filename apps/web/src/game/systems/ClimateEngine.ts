import { OTHER_SCHOOL_WASTE_KG } from '../../data/constants';
import type { Resources } from '../../state/types';

export type EnergySystem = { renewableShare: number; storageUnits: number; solarKw?: number; windKw?: number; storageKwh?: number; efficiency?: number };
export type WasteSystem = { otherWasteKg: number; sortingRecovery: number };
export type CitySystem = { sealedShare: number; greenShare: number; rainShare: number; shade?: number; transitShare?: number };
export type CarbonSystem = { claimScore: number };
export type OceanSystem = { habitatCare: number };
export type CouncilSystem = { evidenceBias: number };

/** Enerji modülü başlangıcı: oyun göstergesi, ölçülmüş pay değildir. */
export const ENERGY_BASELINE: EnergySystem = { renewableShare: 20, storageUnits: 0 };
/** Atık modülü başlangıcı: diğer okul atığı sabiti ile aynı varsayım. */
export const WASTE_BASELINE: WasteSystem = { otherWasteKg: OTHER_SCHOOL_WASTE_KG, sortingRecovery: 0 };
/** Şehir başlangıcı: sızdırmaz 40, yeşil 20, yağmur 0. Ölçülmüş yüzey değildir. */
export const CITY_BASELINE: CitySystem = { sealedShare: 40, greenShare: 20, rainShare: 0 };
/** İddia inceleme başlangıcı. Sera gazı miktarı değildir. */
export const CARBON_BASELINE: CarbonSystem = { claimScore: 40 };
/** Kıyı başlangıcı: habitat bakımı 10. Saha sayımı değildir. */
export const OCEAN_BASELINE: OceanSystem = { habitatCare: 10 };
/** Meclis seçim eğilimi: 0 nötr. Puan ayrıca oynanan modüllerden gelir. */
export const COUNCIL_BASELINE: CouncilSystem = { evidenceBias: 0 };

export function energyFromChoice(system?: Partial<EnergySystem>): EnergySystem {
  return {
    renewableShare: system?.renewableShare ?? ENERGY_BASELINE.renewableShare,
    storageUnits: system?.storageUnits ?? ENERGY_BASELINE.storageUnits,
    ...(system?.solarKw !== undefined && { solarKw: system.solarKw }),
    ...(system?.windKw !== undefined && { windKw: system.windKw }),
    ...(system?.storageKwh !== undefined && { storageKwh: system.storageKwh }),
    ...(system?.efficiency !== undefined && { efficiency: system.efficiency }),
  };
}

export function wasteFromChoice(system?: Partial<WasteSystem>): WasteSystem {
  return {
    otherWasteKg: system?.otherWasteKg ?? WASTE_BASELINE.otherWasteKg,
    sortingRecovery: system?.sortingRecovery ?? WASTE_BASELINE.sortingRecovery,
  };
}

export function cityFromChoice(system?: Partial<CitySystem>): CitySystem {
  return {
    sealedShare: system?.sealedShare ?? CITY_BASELINE.sealedShare,
    greenShare: system?.greenShare ?? CITY_BASELINE.greenShare,
    rainShare: system?.rainShare ?? CITY_BASELINE.rainShare,
    ...(system?.shade !== undefined && { shade: system.shade }),
    ...(system?.transitShare !== undefined && { transitShare: system.transitShare }),
  };
}

export function carbonFromChoice(system?: Partial<CarbonSystem>): CarbonSystem {
  return { claimScore: system?.claimScore ?? CARBON_BASELINE.claimScore };
}

export function oceanFromChoice(system?: Partial<OceanSystem>): OceanSystem {
  return { habitatCare: system?.habitatCare ?? OCEAN_BASELINE.habitatCare };
}

export function councilFromChoice(system?: Partial<CouncilSystem>): CouncilSystem {
  return { evidenceBias: system?.evidenceBias ?? COUNCIL_BASELINE.evidenceBias };
}

export { outageRisk, wasteCollection, floodRisk, coastalRisk, councilScore } from '@yarinlab/shared';
import { councilScore } from '@yarinlab/shared';

/** Geçmişten meclis puanı. Meclisin kendi kararı oynanan modül sayısına girmez. */
export function councilStanding(input: {
  appliedIds: readonly string[];
  history: readonly { scenarioId: string; choiceId: string; reasoning?: string }[];
  evidenceBias: number;
}): number {
  const playedModules = new Set(input.appliedIds.filter((id) => id !== 'council_001')).size;
  const foodDistinct = new Set(input.history.filter((h) => h.scenarioId === 'food_001').map((h) => h.choiceId)).size;
  const wroteReason = input.history.some((h) => !!h.reasoning);
  return councilScore({ playedModules, foodDistinct, wroteReason, evidenceBias: input.evidenceBias });
}

/** Kaynak kısıt kontrolü: geçerli durum mu? */
export function isValidState(r: Resources): boolean {
  const inRange = (n: number) => n >= 0 && n <= 100;
  return (
    r.foodWasteKg >= 0 &&
    inRange(r.energyScore) &&
    inRange(r.waterScore) &&
    inRange(r.wellbeing)
  );
}

/**
 * Senaryo etki puanı (0-100): oyun içi denge göstergesi; kg CO2e DEĞİLDİR.
 * Atık azalması, bütçenin korunması ve memnuniyetin ortalaması. Kılavuz §11: "atık kg" ile ayrı gösterilir.
 */
export function scenarioImpactScore(r: Resources, baseline: Resources): number {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const wastePts = clamp(100 * (1 - r.foodWasteKg / (baseline.foodWasteKg * 1.5)));
  const budgetPts = clamp((100 * r.budget) / baseline.budget);
  return Math.round((wastePts + budgetPts + clamp(r.wellbeing)) / 3);
}
