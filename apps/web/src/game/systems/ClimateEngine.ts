import {
  ASSUMED_COLLECTION_CAPACITY_KG,
  OTHER_SCHOOL_WASTE_KG,
} from '../../data/constants';
import type { Resources } from '../../state/types';

export type EnergySystem = { renewableShare: number; storageUnits: number };
export type WasteSystem = { otherWasteKg: number; sortingRecovery: number };
export type CitySystem = { sealedShare: number; greenShare: number; rainShare: number };
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

/**
 * Kesinti riski (0-100), simülasyon kuralı (kılavuz §03):
 * risk = clamp(0, 100, round(15 + yenilenebilirPay * 0.9 - depolamaBirimi * 22)).
 * Depolama olmadan pay artınca risk yükselir. Gerçek şebeke verisi değildir.
 */
export function outageRisk(renewableShare: number, storageUnits: number): number {
  const share = Math.max(0, renewableShare);
  const storage = Math.max(0, storageUnits);
  const raw = 15 + share * 0.9 - storage * 22;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Çapraz etki: gıda atığı + diğer okul atığı − ayırmayla düşen kısım (kılavuz §03, §19).
 * sortingRecovery 0..1 simülasyon varsayımıdır.
 */
export function wasteCollection(
  foodWasteKg: number,
  otherSchoolWasteKg = OTHER_SCHOOL_WASTE_KG,
  capacityKg = ASSUMED_COLLECTION_CAPACITY_KG,
  sortingRecovery = 0,
) {
  const other = Math.max(0, otherSchoolWasteKg);
  const recovery = Math.min(1, Math.max(0, sortingRecovery));
  const sortedOutKg = other * recovery;
  const wasteLoadKg = Math.max(0, foodWasteKg) + other - sortedOutKg;
  const collectionNeed = capacityKg > 0 ? Math.ceil(wasteLoadKg / capacityKg) : 0;
  return { wasteLoadKg, collectionNeed, assumedCollectionCapacityKg: capacityKg, sortedOutKg, sortingRecovery: recovery };
}

/**
 * Taşkın riski (0-100), simülasyon kuralı:
 * risk = clamp(0, 100, round(40 + sızdırmaz * 0.5 - yeşil * 0.35 - yağmur * 0.45)).
 * Ölçülmüş sel modeli değildir.
 */
export function floodRisk(sealedShare: number, greenShare: number, rainShare: number): number {
  const sealed = Math.max(0, sealedShare);
  const green = Math.max(0, greenShare);
  const rain = Math.max(0, rainShare);
  const raw = 40 + sealed * 0.5 - green * 0.35 - rain * 0.45;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Kıyı riski (0-100), simülasyon kuralı:
 * risk = clamp(0, 100, round(20 + atıkYüküKg * 0.5 - habitatBakımı * 0.4)).
 * Yük, kantin gıda atığı ile atık modülünden gelir. Saha sayımı değildir.
 */
export function coastalRisk(wasteLoadKg: number, habitatCare: number): number {
  const load = Math.max(0, wasteLoadKg);
  const care = Math.max(0, habitatCare);
  const raw = 20 + load * 0.5 - care * 0.4;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Meclis puanı (0-100), oyun göstergesi. Sera gazı miktarı değildir.
 * taban = 15 + oynananModül * 8 + (iki farklı kantin seçeneği ? 12 : 0) + (gerekçe ? 10 : 0) + seçim eğilimi.
 */
export function councilScore(input: { playedModules: number; foodDistinct: number; wroteReason: boolean; evidenceBias: number }): number {
  const played = Math.max(0, input.playedModules);
  const base = 15 + played * 8 + (input.foodDistinct >= 2 ? 12 : 0) + (input.wroteReason ? 10 : 0);
  return Math.max(0, Math.min(100, Math.round(base + input.evidenceBias)));
}

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
