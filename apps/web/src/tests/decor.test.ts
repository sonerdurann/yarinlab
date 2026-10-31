import { describe, expect, it } from 'vitest';
import map from '../../public/assets/maps/world_v2.json';
import { DECOR } from '../game/tiles/decor';
import { footprintTiles, hotspots } from '../game/tiles/hotspots';
import { BUILD_SLOTS } from '@yarinlab/shared';

type Layer = { name: string; data?: number[] };
const layer = (n: string) => (map.layers as unknown as Layer[]).find((l) => l.name === n)!.data!;

describe('dekor yerleşimi', () => {
  const roads = layer('roads');
  const key = (x: number, y: number) => y * 40 + x;

  it('tüm dekor harita içinde', () => {
    for (const d of DECOR) {
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThan(40);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThan(40);
    }
  });

  it('yola veya hotspot bina karosuna denk gelmez; iki dekor aynı karoyu paylaşmaz', () => {
    const seen = new Set<number>();
    const buildingTiles = new Set(hotspots.flatMap((h) => footprintTiles(h).map(([x, y]) => key(x, y))));
    for (const d of DECOR) {
      const k = key(d.x, d.y);
      expect(roads[k], `${d.kind} ${d.x},${d.y} yolda`).toBe(0);
      expect(buildingTiles.has(k), `${d.kind} ${d.x},${d.y} bina karosunda`).toBe(false);
      expect(seen.has(k), `${d.kind} ${d.x},${d.y} çift`).toBe(false);
      seen.add(k);
    }
    for (const s of BUILD_SLOTS.filter((x) => x.map !== 'coast')) expect(seen.has(key(s.x, s.y)), `alan ${s.id} dekorda`).toBe(false);
  });

  it('dekor binası kareleri atlasta var', () => {
    const frames = new Set(Array.from({ length: 129 }, (_, i) => `buildingTiles_${String(i).padStart(3, '0')}.png`));
    for (const d of DECOR.filter((x) => x.kind === 'building')) expect(frames.has(d.frame!)).toBe(true);
  });
});
