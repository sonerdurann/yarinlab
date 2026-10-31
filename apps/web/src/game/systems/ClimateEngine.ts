import {
  ASSUMED_COLLECTION_CAPACITY_KG,
  OTHER_SCHOOL_WASTE_KG,
} from '../../data/constants';
import type { Resources } from '../../state/types';

/** Çapraz etki: gıda atığı → atık modülünün toplama yükü (kılavuz §03, §19). */
export function wasteCollection(
  foodWasteKg: number,
  otherSchoolWasteKg = OTHER_SCHOOL_WASTE_KG,
  capacityKg = ASSUMED_COLLECTION_CAPACITY_KG,
) {
  const wasteLoadKg = Math.max(0, foodWasteKg) + Math.max(0, otherSchoolWasteKg);
  const collectionNeed = Math.ceil(wasteLoadKg / capacityKg);
  return { wasteLoadKg, collectionNeed, assumedCollectionCapacityKg: capacityKg };
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
