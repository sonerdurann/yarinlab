export const MAP = {
  key: 'world',
  url: '/assets/maps/world_v2.json',
  size: 40,
  // Kenney spritesheet'lerinden ölçülen gerçek taban: 132 px genişlik, 2:1 elmas = 66 px (docs/licenses/licenses.md).
  tileWidth: 132,
  tileHeight: 66,
} as const;

/** Kenney atlasları (CC0). Yüklenen anahtar -> png/xml. */
export const ATLASES = [
  { key: 'landscape', png: '/assets/kenney/landscape/landscapeTiles_sheet.png', xml: '/assets/kenney/landscape/landscapeTiles_sheet.xml' },
  { key: 'buildings', png: '/assets/kenney/buildings/buildingTiles_sheet.png', xml: '/assets/kenney/buildings/buildingTiles_sheet.xml' },
  { key: 'vehicles', png: '/assets/kenney/vehicles/sheet_allCars.png', xml: '/assets/kenney/vehicles/sheet_allCars.xml' },
] as const;

/** Kenney araç yönleri (ekran pusulası): +x = SE, -x = NW, +y = SW, -y = NE. */
export const VEHICLE_DIR = { '+x': 'SE', '-x': 'NW', '+y': 'SW', '-y': 'NE' } as const;

type Frame = { atlas: 'landscape' | 'buildings'; frame: string; tint?: number };

/** Tiled gid -> Kenney karosu. Sheet'teki indeksler contact sheet ile görsel olarak seçildi. */
export const GROUND_FRAMES: Record<number, Frame> = {
  1: { atlas: 'landscape', frame: 'landscapeTiles_022.png' }, // çim
  2: { atlas: 'landscape', frame: 'landscapeTiles_074.png' }, // yol (yöne göre seçilir, ROAD_FRAMES)
  3: { atlas: 'landscape', frame: 'landscapeTiles_066.png' }, // su (düz)
  4: { atlas: 'landscape', frame: 'landscapeTiles_083.png' }, // tarım toprağı
  5: { atlas: 'landscape', frame: 'landscapeTiles_059.png' }, // kıyı kumu
  6: { atlas: 'landscape', frame: 'landscapeTiles_059.png', tint: 0xe3e8f1 }, // meydan / kaldırım (açık)
};

/** Zemin sprite'ında elmasın altındaki kalınlık dahil toplam yükseklik (132x99). */
export const GROUND_SPRITE_HEIGHT = 99;

/** Yol karoları: x ekseni, y ekseni (x'in aynası), kavşak. Komşu karoya göre seçilir. */
export const ROAD_FRAMES = {
  alongX: { atlas: 'landscape', frame: 'landscapeTiles_074.png', flipX: false },
  alongY: { atlas: 'landscape', frame: 'landscapeTiles_074.png', flipX: true },
  cross: { atlas: 'landscape', frame: 'landscapeTiles_090.png', flipX: false },
} as const;

export const TREE_GID = 7;

/** Su yüzeyi kumsala göre biraz çökük çizilir (px). */
export const WATER_DROP = 8;
export const WATER_GID = 3;
