// Yarın Şehri: Tiled uyumlu 40x40 izometrik harita üretir -> apps/web/public/assets/maps/world_v2.json
// Pusula (izometrik): kuzey = ekran üstü (düşük x+y), doğu = ekran sağı (yüksek x, düşük y),
// batı = ekran solu (düşük x, yüksek y), güney = ekran altı (yüksek x+y). Kararlar: docs/decision-log/017-harita-v2.md
import { writeFileSync } from 'node:fs';

const N = 40;
const T = { grass: 1, road: 2, water: 3, farm: 4, sand: 5, plaza: 6 };
const inBox = (x, y, [x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

/** Bölgeler: kutu [x0,x1,y0,y1], ana bina üst köşesi ve taban (karo). hotspots.ts ile birebir aynı tutulur (test). */
export const zones = {
  school: { box: [14, 25, 14, 25], anchor: [18, 17], foot: [3, 2], scene: 'school.overview', label: 'Okul kampüsü' },
  canteen: { box: [21, 24, 21, 24], anchor: [22, 22], foot: [2, 2], scene: 'food.intro', label: 'Kantin' },
  energy: { box: [2, 12, 2, 12], anchor: [7, 7], foot: [2, 2], scene: 'energy.decision', label: 'Enerji vadisi' },
  city: { box: [27, 38, 2, 12], anchor: [30, 4], foot: [2, 2], scene: 'city.decision', label: 'Şehir merkezi' },
  farm: { box: [2, 12, 27, 38], anchor: [5, 29], foot: [2, 2], scene: 'carbon.decision', label: 'Tarım alanı' },
  waste: { box: [27, 37, 27, 37], anchor: [29, 29], foot: [2, 2], scene: 'waste.decision', label: 'Döngü atölyesi' },
  ocean: { box: [36, 39, 15, 25], anchor: [37, 19], foot: [1, 1], scene: 'ocean.decision', label: 'Kıyı kapısı' },
};

const ground = new Array(N * N).fill(T.grass);
const roads = new Array(N * N).fill(0);
const decoration = new Array(N * N).fill(0);

const road = (x0, x1, y0, y1) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) roads[y * N + x] = T.road;
};
// Kampüs halka yolu + dört yöne ışınsal yollar
road(13, 26, 13, 13); road(13, 26, 26, 26); road(13, 13, 13, 26); road(26, 26, 13, 26);
road(3, 12, 13, 13); road(13, 13, 3, 12); road(4, 12, 10, 10); // kuzey: enerji
road(26, 26, 2, 12); road(27, 38, 8, 8); road(33, 33, 2, 7); road(33, 33, 9, 12); // doğu: şehir
road(13, 13, 27, 38); road(2, 12, 33, 33); // batı: tarım
road(27, 37, 26, 26); road(32, 32, 27, 37); // güney: döngü
road(27, 36, 21, 21); // kıyı kapısına
road(24, 24, 19, 25); // kampüs içi servis yolu (kantin)

const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (inBox(x, y, zones.city.box) || inBox(x, y, zones.waste.box)) ground[i] = T.plaza;
    if (inBox(x, y, zones.farm.box) && !(x <= 8 && y <= 31)) ground[i] = T.farm;
    // kampüs: spor sahası ve meydan
    if (inBox(x, y, [22, 25, 14, 17]) || inBox(x, y, [17, 21, 20, 20])) ground[i] = T.plaza;
    // doğu kıyısı: kumsal şerit ve deniz
    if (x >= 36 && y >= 14 && y <= 26) ground[i] = x === 39 ? T.water : T.sand;
    // ada kenarı: kum
    if ((x === 0 || y === 0 || x === N - 1 || y === N - 1) && ground[i] === T.grass) ground[i] = T.sand;
    // şehir parkı göleti
    if (inBox(x, y, [35, 36, 10, 11])) ground[i] = T.water;
    // ağaçlar: bölge dışı çimde seyrek; batıda (meyve bahçesi) daha sık
    const h = hash(x, y) % 100;
    const dense = x < 13 && y > 14 && y < 27 ? 30 : inBox(x, y, zones.school.box) ? 4 : 11;
    if (ground[i] === T.grass && !roads[i] && h < dense) decoration[i] = 7;
  }
}

const prop = (name, type, value) => ({ name, type, value });
const hotspots = Object.entries(zones).map(([id, z], k) => {
  const [x0, x1, y0, y1] = z.box;
  return {
    id: 100 + k, name: id, type: 'hotspot', visible: true, x: 0, y: 0, width: 0, height: 0,
    properties: [
      prop('id', 'string', id), prop('scene', 'string', z.scene), prop('locked', 'bool', false), prop('label', 'string', z.label),
      prop('tileX', 'int', z.anchor[0]), prop('tileY', 'int', z.anchor[1]), prop('footW', 'int', z.foot[0]), prop('footD', 'int', z.foot[1]),
      prop('x0', 'int', x0), prop('x1', 'int', x1), prop('y0', 'int', y0), prop('y1', 'int', y1),
    ],
  };
});
const buildings = Object.entries(zones).map(([id, z], k) => ({
  id: k + 1, name: id, type: 'building', visible: true, x: 0, y: 0, width: 0, height: 0,
  properties: [prop('id', 'string', id), prop('tileX', 'int', z.anchor[0]), prop('tileY', 'int', z.anchor[1]), prop('footprint', 'int', z.foot[0] * z.foot[1])],
}));

const tl = (id, name, data) => ({ id, name, type: 'tilelayer', width: N, height: N, x: 0, y: 0, opacity: 1, visible: true, data });
const og = (id, name, objects) => ({ id, name, type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects });
const map = {
  type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'isometric', renderorder: 'right-down', infinite: false,
  width: N, height: N, tilewidth: 132, tileheight: 66, nextlayerid: 7, nextobjectid: 200,
  properties: [prop('tilesetNote', 'string', 'Zemin Kenney landscape atlasından; gid->kare eşlemesi src/game/tiles/mapManifest.ts. Binalar kodla üretilir (src/game/art).')],
  tilesets: [{ firstgid: 1, name: 'TiledCityTileset', tilewidth: 132, tileheight: 66, tilecount: 7, columns: 7, image: '../kenney/landscape/landscapeTiles_sheet.png', imagewidth: 1024, imageheight: 2048, margin: 0, spacing: 0 }],
  layers: [tl(1, 'ground', ground), tl(2, 'roads', roads), tl(3, 'decoration', decoration), og(4, 'buildings', buildings), og(5, 'markers', []), og(6, 'hotspotObjects', hotspots)],
};
writeFileSync(new URL('../public/assets/maps/world_v2.json', import.meta.url), JSON.stringify(map));
console.log('world_v2.json yazıldı');
