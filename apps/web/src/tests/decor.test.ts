import { describe, expect, it } from 'vitest';
import map from '../../public/assets/maps/world_alpha.json';
import { DECOR } from '../game/tiles/decor';
import { hotspots } from '../game/tiles/hotspots';

type Layer = { name: string; data?: number[] };
const layer = (n: string) => (map.layers as unknown as Layer[]).find((l) => l.name === n)!.data!;

describe('dekor yerleşimi', () => {
  const roads = layer('roads');
  const key = (x: number, y: number) => y * 32 + x;

  it('tüm dekor harita içinde', () => {
    for (const d of DECOR) {
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThan(32);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThan(32);
    }
  });

  it('yola veya hotspot bina karosuna denk gelmez; iki dekor aynı karoyu paylaşmaz', () => {
    const seen = new Set<number>();
    const buildingTiles = new Set(hotspots.map((h) => key(h.tileX, h.tileY)));
    for (const d of DECOR) {
      const k = key(d.x, d.y);
      expect(roads[k], `${d.kind} ${d.x},${d.y} yolda`).toBe(0);
      expect(buildingTiles.has(k), `${d.kind} ${d.x},${d.y} bina karosunda`).toBe(false);
      expect(seen.has(k), `${d.kind} ${d.x},${d.y} çift`).toBe(false);
      seen.add(k);
    }
  });

  it('dekor binası kareleri atlasta var', () => {
    const frames = new Set(Array.from({ length: 129 }, (_, i) => `buildingTiles_${String(i).padStart(3, '0')}.png`));
    for (const d of DECOR.filter((x) => x.kind === 'building')) expect(frames.has(d.frame!)).toBe(true);
  });
});
