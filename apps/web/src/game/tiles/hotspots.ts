export type Hotspot = {
  id: string;
  label: string;
  /** Ana binanın taban üst köşesi (karo) */
  tileX: number;
  tileY: number;
  /** Ana bina tabanı (karo): genişlik x, derinlik y */
  foot: [number, number];
  scene: string;
  locked: boolean;
  /** Dahil sınırlar, 0 tabanlı: [x0, x1, y0, y1] */
  bounds: [number, number, number, number];
  /** Pusula yönü (prompt §2) */
  compass: 'merkez' | 'kuzey' | 'doğu' | 'batı' | 'güney' | 'güneydoğu';
};

// Yarın Şehri (40x40). Kaynak: scripts/generate-world-v2.mjs (aynı koordinatlar; test: tests/map.test.ts).
export const hotspots: Hotspot[] = [
  { id: 'school', label: 'Okul kampüsü', tileX: 18, tileY: 17, foot: [3, 2], scene: 'school.overview', locked: false, bounds: [14, 25, 14, 25], compass: 'merkez' },
  { id: 'canteen', label: 'Kantin', tileX: 22, tileY: 22, foot: [2, 2], scene: 'food.intro', locked: false, bounds: [21, 24, 21, 24], compass: 'merkez' },
  { id: 'energy', label: 'Enerji vadisi', tileX: 7, tileY: 7, foot: [2, 2], scene: 'energy.decision', locked: false, bounds: [2, 12, 2, 12], compass: 'kuzey' },
  { id: 'city', label: 'Şehir merkezi', tileX: 30, tileY: 4, foot: [2, 2], scene: 'city.decision', locked: false, bounds: [27, 38, 2, 12], compass: 'doğu' },
  { id: 'farm', label: 'Tarım alanı', tileX: 5, tileY: 29, foot: [2, 2], scene: 'carbon.decision', locked: false, bounds: [2, 12, 27, 38], compass: 'batı' },
  { id: 'waste', label: 'Döngü atölyesi', tileX: 29, tileY: 29, foot: [2, 2], scene: 'waste.decision', locked: false, bounds: [27, 37, 27, 37], compass: 'güney' },
  { id: 'ocean', label: 'Kıyı kapısı', tileX: 37, tileY: 19, foot: [1, 1], scene: 'ocean.decision', locked: false, bounds: [36, 39, 15, 25], compass: 'güneydoğu' },
];

export const hotspotById = (id: string) => hotspots.find((h) => h.id === id);
/** Ana binanın taban merkezi (karo) */
export const hotspotCenter = (h: Hotspot) => ({ x: h.tileX + h.foot[0] / 2, y: h.tileY + h.foot[1] / 2 });
/** Ana binanın kapladığı karolar */
export const footprintTiles = (h: Hotspot) => {
  const out: [number, number][] = [];
  for (let dy = 0; dy < h.foot[1]; dy++) for (let dx = 0; dx < h.foot[0]; dx++) out.push([h.tileX + dx, h.tileY + dy]);
  return out;
};
