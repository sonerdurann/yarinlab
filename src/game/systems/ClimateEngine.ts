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
