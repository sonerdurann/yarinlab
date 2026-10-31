import { describe, expect, it } from 'vitest';
import map from '../../public/assets/maps/world_alpha.json';
import { hotspots } from '../game/tiles/hotspots';

type Prop = { name: string; value: unknown };
type Obj = { properties: Prop[] };
const get = (o: Obj, k: string) => o.properties.find((p) => p.name === k)?.value;

describe('world_alpha.json', () => {
  it('32x32 izometrik ve gerekli katmanlar', () => {
    expect(map.orientation).toBe('isometric');
    expect([map.width, map.height]).toEqual([32, 32]);
    const names = map.layers.map((l) => l.name);
    for (const n of ['ground', 'roads', 'decoration', 'buildings', 'hotspotObjects']) expect(names).toContain(n);
  });
  it('hotspot objeleri hotspots.ts ile tutarlı', () => {
    const layer = map.layers.find((l) => l.name === 'hotspotObjects') as unknown as { objects: Obj[] };
    expect(layer.objects).toHaveLength(hotspots.length);
    for (const h of hotspots) {
      const o = layer.objects.find((x) => get(x, 'id') === h.id)!;
      expect(o, h.id).toBeDefined();
      expect(get(o, 'scene')).toBe(h.scene);
      expect(get(o, 'locked')).toBe(h.locked);
      expect([get(o, 'tileX'), get(o, 'tileY')]).toEqual([h.tileX, h.tileY]);
    }
  });
  it('aktif hotspotlar: okul, kantin, enerji, atık', () => {
    expect(hotspots.filter((h) => !h.locked).map((h) => h.id).sort()).toEqual(['canteen', 'energy', 'school', 'waste']);
  });
});
