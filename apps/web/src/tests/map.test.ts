import { describe, expect, it } from 'vitest';
import map from '../../public/assets/maps/world_v2.json';
import { hotspots } from '../game/tiles/hotspots';

type Prop = { name: string; value: unknown };
type Obj = { properties: Prop[] };
const get = (o: Obj, k: string) => o.properties.find((p) => p.name === k)?.value;

describe('world_v2.json', () => {
  it('40x40 izometrik ve gerekli katmanlar', () => {
    expect(map.orientation).toBe('isometric');
    expect([map.width, map.height]).toEqual([40, 40]);
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
      expect([get(o, 'footW'), get(o, 'footD')]).toEqual(h.foot);
      expect([get(o, 'x0'), get(o, 'x1'), get(o, 'y0'), get(o, 'y1')]).toEqual(h.bounds);
    }
  });
  it('yedi bölge açıktır', () => {
    expect(hotspots.filter((h) => !h.locked).map((h) => h.id).sort()).toEqual(['canteen', 'city', 'energy', 'farm', 'ocean', 'school', 'waste']);
  });
});

describe('pusula yerleşimi ve yollar (prompt §2)', () => {
  const roads = (map.layers as unknown as { name: string; data?: number[] }[]).find((l) => l.name === 'roads')!.data!;
  const N = 40;
  const c = (id: string) => { const h = hotspots.find((x) => x.id === id)!; return { sx: h.tileX - h.tileY, sy: h.tileX + h.tileY }; };
  it('kampüs merkezde; enerji kuzeyde, şehir doğuda, tarım batıda, döngü güneyde (ekran yönleri)', () => {
    const m = c('school');
    expect(c('energy').sy).toBeLessThan(m.sy - 10);
    expect(c('city').sx).toBeGreaterThan(m.sx + 10);
    expect(c('farm').sx).toBeLessThan(m.sx - 10);
    expect(c('waste').sy).toBeGreaterThan(m.sy + 10);
    expect(c('ocean').sx).toBeGreaterThan(m.sx + 10);
  });
  it('ana bina tabanları yola denk gelmez; her bölge yol ağına bağlı', () => {
    for (const h of hotspots) {
      for (let dy = 0; dy < h.foot[1]; dy++) for (let dx = 0; dx < h.foot[0]; dx++) expect(roads[(h.tileY + dy) * N + h.tileX + dx], h.id).toBe(0);
    }
    // yol karoları tek bir bağlı ağ oluşturur
    const start = roads.findIndex((r) => r > 0);
    const seen = new Set([start]);
    const q = [start];
    while (q.length) {
      const i = q.pop()!;
      const x = i % N, y = Math.floor(i / N);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const j = ny * N + nx;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N && roads[j] && !seen.has(j)) { seen.add(j); q.push(j); }
      }
    }
    expect(seen.size).toBe(roads.filter((r) => r > 0).length);
    // her bölgenin kutusunda veya bitişiğinde yol var
    for (const h of hotspots) {
      const [x0, x1, y0, y1] = h.bounds;
      let found = false;
      for (let y = Math.max(0, y0 - 1); y <= Math.min(N - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(N - 1, x1 + 1); x++) if (roads[y * N + x]) found = true;
      expect(found, h.id).toBe(true);
    }
  });
});
