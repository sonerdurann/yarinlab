/**
 * İnşa sistemi: maliyet, bakım, kapasite ve etki. Tüm değerler OYUN VARSAYIMIDIR (bütçe puanı gerçek para değildir).
 * Etki yönleri kaynaklara dayanır (docs/SIMULATION_ASSUMPTIONS.md); büyüklükler oyun dengesi için seçilmiştir.
 */
export type ZoneId = 'school' | 'canteen' | 'energy' | 'waste' | 'city' | 'farm' | 'ocean';

export type BuildingEffects = {
  solarKw?: number;
  windKw?: number;
  storageKwh?: number;
  /** Enerji talebinde yüzde azalma (0..1) */
  efficiency?: number;
  /** Ek enerji talebi kWh/gün */
  extraDemandKwh?: number;
  /** Atık akışından ayrılan kg/gün */
  wasteDivertKg?: number;
  /** Gıda atığında kg/gün azalma */
  foodWasteCutKg?: number;
  greenShare?: number;
  rainShare?: number;
  sealedShare?: number;
  shade?: number;
  habitatCare?: number;
  /** Su kullanımında m³/gün tasarruf */
  waterSaveM3?: number;
  /** Toplu ulaşım payı (puan) */
  transitShare?: number;
  wellbeing?: number;
  literacy?: number;
};

export type UnlockRule = { completedTasks?: number; /** Bu modülde en az bir görev tamamlanmış olmalı */ moduleTask?: string; level?: number };

export type BuildingDef = {
  type: string;
  name: string;
  zone: ZoneId;
  description: string;
  /** Seviye 1, 2, 3 için inşa/yükseltme maliyeti (puan) */
  cost: [number, number, number];
  /** Seviye başına günlük bakım (puan) */
  upkeep: number;
  /** Seviye başına etki; seviye ile çarpılır */
  perLevel: BuildingEffects;
  unlock: UnlockRule;
  sourceIds: string[];
  sprite: string;
};

export const BUILDINGS: BuildingDef[] = [
  { type: 'solar', name: 'Güneş paneli tarlası', zone: 'energy', description: 'Gündüz ve açık havada üretir; gece üretmez.',
    cost: [1200, 900, 900], upkeep: 10, perLevel: { solarKw: 40 }, unlock: {}, sourceIds: ['R-IEA-RENEW'], sprite: 'solar' },
  { type: 'wind', name: 'Rüzgâr türbini', zone: 'energy', description: 'Rüzgârlı ve fırtınalı günlerde, gece de üretebilir.',
    cost: [1500, 1100, 1100], upkeep: 14, perLevel: { windKw: 30 }, unlock: { completedTasks: 1 }, sourceIds: ['R-IEA-RENEW'], sprite: 'turbine' },
  { type: 'battery', name: 'Enerji depolama', zone: 'energy', description: 'Fazla üretimi saklar, akşam ve kesintide kullanır.',
    cost: [1400, 1000, 1000], upkeep: 8, perLevel: { storageKwh: 120 }, unlock: { moduleTask: 'energy' }, sourceIds: ['R-IEA-RENEW'], sprite: 'battery' },
  { type: 'retrofit', name: 'Yalıtım ve LED', zone: 'school', description: 'Talebi azaltır; en ucuz enerji kullanılmayandır.',
    cost: [800, 700, 700], upkeep: 2, perLevel: { efficiency: 0.07, wellbeing: 1 }, unlock: {}, sourceIds: ['R-IEA-EFF'], sprite: 'building:buildingTiles_012.png' },
  { type: 'climateLab', name: 'İklim araştırma laboratuvarı', zone: 'school', description: 'Ölçüm ve proje kulübü; iklim okuryazarlığını artırır.',
    cost: [1600, 1200, 1200], upkeep: 12, perLevel: { literacy: 6, extraDemandKwh: 15 }, unlock: { completedTasks: 3 }, sourceIds: ['R-UNESCO-ESD'], sprite: 'building:buildingTiles_010.png' },
  { type: 'compost', name: 'Kompost ünitesi', zone: 'canteen', description: 'Yenmeyen kısımları atık akışından ayırır; israfı önlemez.',
    cost: [600, 500, 500], upkeep: 4, perLevel: { wasteDivertKg: 4 }, unlock: { completedTasks: 1 }, sourceIds: ['R-UNEP-FWI'], sprite: 'bin' },
  { type: 'sorting', name: 'Ayrıştırma istasyonu', zone: 'waste', description: 'Geri kazanılabilir atığı ayırır.',
    cost: [700, 600, 600], upkeep: 6, perLevel: { wasteDivertKg: 3 }, unlock: {}, sourceIds: ['R-UNEP-WASTE'], sprite: 'bin' },
  { type: 'repair', name: 'Tamir ve onarım merkezi', zone: 'waste', description: 'Ürün ömrünü uzatır; atık oluşmadan önler.',
    cost: [900, 700, 700], upkeep: 6, perLevel: { wasteDivertKg: 2, wellbeing: 2 }, unlock: { completedTasks: 2 }, sourceIds: ['R-UNEP-WASTE'], sprite: 'building:buildingTiles_003.png' },
  { type: 'park', name: 'Cep parkı ve gölgelik', zone: 'city', description: 'Gölge ve geçirgen yüzey: sıcak ve sel riskini azaltır.',
    cost: [900, 800, 800], upkeep: 5, perLevel: { greenShare: 6, sealedShare: -4, shade: 5, wellbeing: 2 }, unlock: {}, sourceIds: ['R-UNEP-COOL', 'R-IPCC-AR6-WG2'], sprite: 'tree' },
  { type: 'rainTank', name: 'Yağmur suyu hasadı', zone: 'city', description: 'Yağmuru biriktirir: taşkını ve su kullanımını azaltır.',
    cost: [800, 700, 700], upkeep: 4, perLevel: { rainShare: 8, waterSaveM3: 4 }, unlock: { completedTasks: 1 }, sourceIds: ['R-IPCC-AR6-WG2'], sprite: 'battery' },
  { type: 'bus', name: 'Elektrikli otobüs hattı', zone: 'city', description: 'Toplu ulaşım payını artırır; enerji talebi ekler.',
    cost: [2000, 1500, 1500], upkeep: 18, perLevel: { transitShare: 10, extraDemandKwh: 40, wellbeing: 2 }, unlock: { completedTasks: 4 }, sourceIds: ['R-IPCC-AR6-WG3'], sprite: 'building:buildingTiles_017.png' },
  { type: 'waterPlant', name: 'Su arıtma ve geri kazanım', zone: 'city', description: 'Gri suyu arıtıp sulamada kullanır.',
    cost: [1800, 1400, 1400], upkeep: 14, perLevel: { waterSaveM3: 8, extraDemandKwh: 25 }, unlock: { completedTasks: 5 }, sourceIds: ['R-UNESCO-WATER'], sprite: 'building:buildingTiles_011.png' },
  { type: 'greenhouse', name: 'Damla sulamalı sera', zone: 'farm', description: 'Az suyla yerel sebze; kuraklıkta üretimi korur.',
    cost: [1100, 900, 900], upkeep: 8, perLevel: { waterSaveM3: 3, foodWasteCutKg: 1, wellbeing: 1 }, unlock: { completedTasks: 2 }, sourceIds: ['R-FAO-SOFA'], sprite: 'crop' },
  { type: 'wetland', name: 'Kıyı sulak alan restorasyonu', zone: 'ocean', description: 'Habitatı korur, kıyı taşkınını tamponlar.',
    cost: [1300, 1000, 1000], upkeep: 6, perLevel: { habitatCare: 10, greenShare: 2 }, unlock: { completedTasks: 2 }, sourceIds: ['R-IPCC-SROCC'], sprite: 'tree' },
  { type: 'trap', name: 'Dere ağzı atık tutucu', zone: 'ocean', description: 'Atığın denize ulaşmasını engeller.',
    cost: [700, 600, 600], upkeep: 5, perLevel: { habitatCare: 5, wasteDivertKg: 1 }, unlock: {}, sourceIds: ['R-UNEP-PLASTIC'], sprite: 'bin' },
];
export const buildingDef = (type: string) => BUILDINGS.find((b) => b.type === type);

const MODULE_TR: Record<string, string> = { energy: 'Enerji Adası', carbon: 'Karbon Dedektifleri', city: 'KrizKenti', food: 'Son Tabak', ocean: 'Mavi Nöbet', waste: 'Döngü Ustaları', council: 'Gelecek Meclisi' };

export type BuildSlot = { id: string; zone: ZoneId; x: number; y: number };
/** Haritadaki boş yapı alanları (yol, dekor ve bina karosu dışında; test: decor/slot çakışma testi). */
export const BUILD_SLOTS: BuildSlot[] = [
  ...([[4, 3], [6, 3], [2, 6], [8, 6], [6, 9]] as const).map(([x, y], i) => ({ id: `en-${i + 1}`, zone: 'energy' as const, x, y })),
  ...([[2, 17], [8, 17], [2, 22], [8, 22], [9, 19]] as const).map(([x, y], i) => ({ id: `wa-${i + 1}`, zone: 'waste' as const, x, y })),
  ...([[25, 7], [29, 8], [25, 13], [29, 12], [22, 8]] as const).map(([x, y], i) => ({ id: `ci-${i + 1}`, zone: 'city' as const, x, y })),
  ...([[10, 23], [16, 23], [16, 27], [10, 28], [17, 25]] as const).map(([x, y], i) => ({ id: `fa-${i + 1}`, zone: 'farm' as const, x, y })),
  ...([[24, 25], [25, 24], [26, 25], [24, 28], [28, 24]] as const).map(([x, y], i) => ({ id: `oc-${i + 1}`, zone: 'ocean' as const, x, y })),
  ...([[11, 13], [17, 11], [11, 11], [12, 17]] as const).map(([x, y], i) => ({ id: `sc-${i + 1}`, zone: 'school' as const, x, y })),
  ...([[19, 16], [20, 19]] as const).map(([x, y], i) => ({ id: `ca-${i + 1}`, zone: 'canteen' as const, x, y })),
];

export type PlacedBuilding = { id: string; type: string; level: number; slot: string; builtDay: number };

export type UnlockContext = { completedTasks: number; modulesPlayed: string[]; level: number };
export function isUnlocked(def: BuildingDef, ctx: UnlockContext): boolean {
  const u = def.unlock;
  if (u.completedTasks && ctx.completedTasks < u.completedTasks) return false;
  if (u.moduleTask && !ctx.modulesPlayed.includes(u.moduleTask)) return false;
  if (u.level && ctx.level < u.level) return false;
  return true;
}
export function unlockText(def: BuildingDef): string {
  const parts: string[] = [];
  if (def.unlock.completedTasks) parts.push(`${def.unlock.completedTasks} görev tamamla`);
  if (def.unlock.moduleTask) parts.push(`${MODULE_TR[def.unlock.moduleTask] ?? def.unlock.moduleTask} modülünde bir görev bitir`);
  if (def.unlock.level) parts.push(`seviye ${def.unlock.level}`);
  return parts.join(', ') || 'açık';
}

export type BuildResult =
  | { ok: true; buildings: PlacedBuilding[]; cost: number; message: string }
  | { ok: false; error: 'unknown_type' | 'locked' | 'slot_taken' | 'wrong_zone' | 'no_budget' | 'max_level' | 'not_found'; message: string };

export function build(buildings: PlacedBuilding[], type: string, slotId: string, budget: number, day: number, ctx: UnlockContext): BuildResult {
  const def = buildingDef(type);
  if (!def) return { ok: false, error: 'unknown_type', message: 'Bilinmeyen yapı.' };
  if (!isUnlocked(def, ctx)) return { ok: false, error: 'locked', message: `${def.name} kilitli: ${unlockText(def)}.` };
  const slot = BUILD_SLOTS.find((s) => s.id === slotId);
  if (!slot || slot.zone !== def.zone) return { ok: false, error: 'wrong_zone', message: 'Bu yapı bu alana kurulamaz.' };
  if (buildings.some((b) => b.slot === slotId)) return { ok: false, error: 'slot_taken', message: 'Bu alan dolu.' };
  if (budget < def.cost[0]) return { ok: false, error: 'no_budget', message: `Bütçe yetmiyor (${def.cost[0]} puan gerekir).` };
  const id = `${type}-${slotId}`;
  return { ok: true, cost: def.cost[0], buildings: [...buildings, { id, type, level: 1, slot: slotId, builtDay: day }], message: `${def.name} kuruldu (−${def.cost[0]} puan).` };
}

export function upgrade(buildings: PlacedBuilding[], id: string, budget: number): BuildResult {
  const b = buildings.find((x) => x.id === id);
  const def = b && buildingDef(b.type);
  if (!b || !def) return { ok: false, error: 'not_found', message: 'Yapı bulunamadı.' };
  if (b.level >= 3) return { ok: false, error: 'max_level', message: 'En üst seviyede.' };
  const cost = def.cost[b.level];
  if (budget < cost) return { ok: false, error: 'no_budget', message: `Bütçe yetmiyor (${cost} puan gerekir).` };
  return { ok: true, cost, buildings: buildings.map((x) => (x.id === id ? { ...x, level: x.level + 1 } : x)), message: `${def.name} seviye ${b.level + 1} (−${cost} puan).` };
}

/** Yıkım: maliyetin %30'u geri döner (varsayım). */
export function demolish(buildings: PlacedBuilding[], id: string): { buildings: PlacedBuilding[]; refund: number } {
  const b = buildings.find((x) => x.id === id);
  const def = b && buildingDef(b.type);
  if (!b || !def) return { buildings, refund: 0 };
  const spent = def.cost.slice(0, b.level).reduce((a, c) => a + c, 0);
  return { buildings: buildings.filter((x) => x.id !== id), refund: Math.round(spent * 0.3) };
}

export function buildingEffects(buildings: PlacedBuilding[]): Required<BuildingEffects> & { upkeep: number } {
  const out = { solarKw: 0, windKw: 0, storageKwh: 0, efficiency: 0, extraDemandKwh: 0, wasteDivertKg: 0, foodWasteCutKg: 0, greenShare: 0, rainShare: 0, sealedShare: 0, shade: 0, habitatCare: 0, waterSaveM3: 0, transitShare: 0, wellbeing: 0, literacy: 0, upkeep: 0 };
  for (const b of buildings) {
    const def = buildingDef(b.type);
    if (!def) continue;
    out.upkeep += def.upkeep * b.level;
    for (const [k, v] of Object.entries(def.perLevel)) (out as Record<string, number>)[k] += (v as number) * b.level;
  }
  out.efficiency = Math.min(0.4, out.efficiency);
  return out;
}
