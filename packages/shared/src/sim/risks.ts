// Ortak risk kuralları (önceden apps/web/src/game/systems/ClimateEngine.ts). Hepsi simülasyon varsayımıdır.
export const ASSUMED_COLLECTION_CAPACITY_KG = 10;
export const OTHER_SCHOOL_WASTE_KG = 20;
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** risk = clamp(round(15 + yenilenebilirPay·0,9 − depolamaBirimi·22)). Gerçek şebeke verisi değildir. */
export function outageRisk(renewableShare: number, storageUnits: number): number {
  return clamp(Math.round(15 + Math.max(0, renewableShare) * 0.9 - Math.max(0, storageUnits) * 22));
}

/** Gıda atığı + diğer atık − ayırmayla düşen kısım; sefer = ceil(yük / kapasite). */
export function wasteCollection(
  foodWasteKg: number,
  otherSchoolWasteKg = OTHER_SCHOOL_WASTE_KG,
  capacityKg = ASSUMED_COLLECTION_CAPACITY_KG,
  sortingRecovery = 0,
) {
  const other = Math.max(0, otherSchoolWasteKg);
  const recovery = clamp(sortingRecovery, 0, 1);
  const sortedOutKg = other * recovery;
  const wasteLoadKg = Math.max(0, foodWasteKg) + other - sortedOutKg;
  const collectionNeed = capacityKg > 0 ? Math.ceil(wasteLoadKg / capacityKg) : 0;
  return { wasteLoadKg, collectionNeed, assumedCollectionCapacityKg: capacityKg, sortedOutKg, sortingRecovery: recovery };
}

/** risk = clamp(round(40 + sızdırmaz·0,5 − yeşil·0,35 − yağmur·0,45)). Ölçülmüş sel modeli değildir. */
export function floodRisk(sealedShare: number, greenShare: number, rainShare: number): number {
  return clamp(Math.round(40 + Math.max(0, sealedShare) * 0.5 - Math.max(0, greenShare) * 0.35 - Math.max(0, rainShare) * 0.45));
}

/** risk = clamp(round(20 + atıkYükü·0,5 − habitatBakımı·0,4)). Saha sayımı değildir. */
export function coastalRisk(wasteLoadKg: number, habitatCare: number): number {
  return clamp(Math.round(20 + Math.max(0, wasteLoadKg) * 0.5 - Math.max(0, habitatCare) * 0.4));
}

/**
 * Sıcak stres riski: risk = clamp(round(25 + sızdırmaz·0,5 − yeşil·0,6 − gölge)).
 * Kentsel ısı adası etkisinin nitel yönüne dayanır (yeşil alan ve gölge serinletir [R-UNEP-COOL]); katsayılar varsayımdır.
 */
export function heatRisk(sealedShare: number, greenShare: number, shade: number): number {
  return clamp(Math.round(25 + Math.max(0, sealedShare) * 0.5 - Math.max(0, greenShare) * 0.6 - Math.max(0, shade)));
}

export function councilScore(input: { playedModules: number; foodDistinct: number; wroteReason: boolean; evidenceBias: number }): number {
  const base = 15 + Math.max(0, input.playedModules) * 8 + (input.foodDistinct >= 2 ? 12 : 0) + (input.wroteReason ? 10 : 0);
  return clamp(Math.round(base + input.evidenceBias));
}
