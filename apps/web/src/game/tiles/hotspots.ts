export type Hotspot = {
  id: string;
  label: string;
  tileX: number;
  tileY: number;
  scene: string;
  locked: boolean;
  /** Dahil sınırlar, 0 tabanlı: [x0, x1, y0, y1] */
  bounds: [number, number, number, number];
};

// Kılavuz §08: yedi bölge oynanır. Tarım karosu Karbon Dedektifleri modülünü açar. Meclisin pini yoktur.
export const hotspots: Hotspot[] = [
  { id: 'school', label: 'Okul', tileX: 14, tileY: 14, scene: 'school.overview', locked: false, bounds: [11, 17, 11, 17] },
  { id: 'canteen', label: 'Kantin', tileX: 17, tileY: 18, scene: 'food.intro', locked: false, bounds: [15, 20, 16, 19] },
  { id: 'energy', label: 'Enerji', tileX: 5, tileY: 6, scene: 'energy.decision', locked: false, bounds: [2, 8, 3, 9] },
  { id: 'waste', label: 'Atık', tileX: 5, tileY: 19, scene: 'waste.decision', locked: false, bounds: [2, 9, 16, 23] },
  { id: 'city', label: 'Şehir', tileX: 25, tileY: 10, scene: 'city.decision', locked: false, bounds: [22, 29, 6, 14] },
  { id: 'farm', label: 'Karbon', tileX: 12, tileY: 25, scene: 'carbon.decision', locked: false, bounds: [8, 17, 22, 29] },
  { id: 'ocean', label: 'Kıyı', tileX: 27, tileY: 27, scene: 'ocean.decision', locked: false, bounds: [24, 31, 24, 31] },
];

export const hotspotById = (id: string) => hotspots.find((h) => h.id === id);
