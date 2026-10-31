import { BUILD_SLOTS, buildingDef, ensureFixedBuildings, maxLevel, type SimState } from '@yarinlab/shared';

/**
 * Kayıt göçü (harita v1 32x32 -> Yarın Şehri v2 40x40). Yapı alanı kimlikleri korunduğu için yapılar aynı bölgede
 * yeni koordinatına taşınır; bilinmeyen alan/tür atılır, seviye sınırlanır, hazır kampüs eklenir.
 */
export function migrateSim(sim: SimState): SimState {
  const slots = new Set(BUILD_SLOTS.map((s) => s.id));
  const seen = new Set<string>();
  const buildings = sim.buildings.filter((b) => {
    const def = buildingDef(b.type);
    if (!def || !slots.has(b.slot) || seen.has(b.slot)) return false;
    seen.add(b.slot);
    return true;
  }).map((b) => ({ ...b, level: Math.max(1, Math.min(maxLevel(buildingDef(b.type)!), Math.round(b.level))) }));
  return { ...sim, buildings: ensureFixedBuildings(buildings) };
}
