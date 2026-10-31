// Tiled uyumlu 32x32 izometrik harita üretir: public/assets/maps/world_alpha.json
// Kenney atlası eklenince Tiled'da açılıp düzenlenebilir (kılavuz §07, §17).
import { writeFileSync } from 'node:fs';

const N = 32;
const T = { grass: 1, road: 2, water: 3, farm: 4, sand: 5, plaza: 6 };
const inBox = (x, y, [x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

const zones = {
  school: { box: [11, 17, 11, 17], center: [14, 14], scene: 'school.overview', label: 'Okul', locked: false },
  canteen: { box: [15, 20, 16, 19], center: [17, 18], scene: 'food.intro', label: 'Kantin', locked: false },
  energy: { box: [2, 8, 3, 9], center: [5, 6], scene: 'energy.preview', label: 'Enerji', locked: false },
  city: { box: [22, 29, 6, 14], center: [25, 10], scene: 'city.locked', label: 'Şehir', locked: true },
  waste: { box: [2, 9, 16, 23], center: [5, 19], scene: 'waste.preview', label: 'Atık', locked: false },
  farm: { box: [8, 17, 22, 29], center: [12, 25], scene: 'farm.locked', label: 'Tarım', locked: true },
  ocean: { box: [24, 31, 24, 31], center: [27, 27], scene: 'ocean.locked', label: 'Kıyı', locked: true },
};

const ground = new Array(N * N).fill(T.grass);
const roads = new Array(N * N).fill(0);
const decoration = new Array(N * N).fill(0);
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (inBox(x, y, zones.ocean.box)) ground[i] = x + y >= 52 ? T.water : T.sand;
    else if (inBox(x, y, zones.farm.box)) ground[i] = T.farm;
    else if (inBox(x, y, zones.city.box)) ground[i] = T.plaza;
    // yollar: ana eksenler
    if ((y === 15 && x >= 3 && x <= 27) || (x === 14 && y >= 4 && y <= 26) || (y === 15 && x < 3)) roads[i] = T.road;
    if (x === 5 && y >= 6 && y <= 19) roads[i] = T.road;
    if (y === 10 && x >= 14 && x <= 25) roads[i] = T.road;
    if (ground[i] === T.grass && roads[i] === 0 && (x * 7 + y * 13) % 11 === 0) decoration[i] = 7; // ağaç
  }
}

const buildings = Object.entries(zones).map(([id, z], k) => ({
  id: k + 1, name: id, type: 'building', visible: true, x: 0, y: 0, width: 0, height: 0,
  properties: [
    { name: 'id', type: 'string', value: id },
    { name: 'tileX', type: 'int', value: z.center[0] },
    { name: 'tileY', type: 'int', value: z.center[1] },
    { name: 'footprint', type: 'int', value: 3 },
    { name: 'locked', type: 'bool', value: z.locked },
  ],
}));

const hotspots = Object.entries(zones).map(([id, z], k) => {
  const [x0, x1, y0, y1] = z.box;
  return {
    id: 100 + k, name: id, type: 'hotspot', visible: true, x: 0, y: 0, width: 0, height: 0,
    properties: [
      { name: 'id', type: 'string', value: id },
      { name: 'scene', type: 'string', value: z.scene },
      { name: 'locked', type: 'bool', value: z.locked },
      { name: 'label', type: 'string', value: z.label },
      { name: 'tileX', type: 'int', value: z.center[0] },
      { name: 'tileY', type: 'int', value: z.center[1] },
      { name: 'x0', type: 'int', value: x0 }, { name: 'x1', type: 'int', value: x1 },
      { name: 'y0', type: 'int', value: y0 }, { name: 'y1', type: 'int', value: y1 },
    ],
  };
});

const tl = (id, name, data) => ({ id, name, type: 'tilelayer', width: N, height: N, x: 0, y: 0, opacity: 1, visible: true, data });
const og = (id, name, objects) => ({ id, name, type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects });

const map = {
  type: 'map', version: '1.10', tiledversion: '1.11.0',
  orientation: 'isometric', renderorder: 'right-down', infinite: false,
  width: N, height: N, tilewidth: 132, tileheight: 66, nextlayerid: 7, nextobjectid: 200,
  properties: [{ name: 'tilesetNote', type: 'string', value: 'Zemin Kenney landscape atlasından; gid->kare eşlemesi src/game/tiles/mapManifest.ts' }],
  tilesets: [{
    firstgid: 1, name: 'TiledCityTileset', tilewidth: 132, tileheight: 66, tilecount: 7, columns: 7,
    image: '../kenney/landscape/landscapeTiles_sheet.png', imagewidth: 1024, imageheight: 2048, margin: 0, spacing: 0,
  }],
  layers: [
    tl(1, 'ground', ground), tl(2, 'roads', roads), tl(3, 'decoration', decoration),
    og(4, 'buildings', buildings), og(5, 'markers', []), og(6, 'hotspotObjects', hotspots),
  ],
};

writeFileSync('public/assets/maps/world_alpha.json', JSON.stringify(map));
console.log('world_alpha.json yazıldı');
