export const MAP = {
  key: 'world',
  url: '/assets/maps/world_alpha.json',
  size: 32,
  // Kenney spritesheet'lerinden ölçülen gerçek taban: 132 px genişlik, 2:1 elmas = 66 px (docs/licenses/licenses.md).
  tileWidth: 132,
  tileHeight: 66,
} as const;

/** Kenney atlasları (CC0). Yüklenen anahtar -> png/xml. */
export const ATLASES = [
  { key: 'landscape', png: '/assets/kenney/landscape/landscapeTiles_sheet.png', xml: '/assets/kenney/landscape/landscapeTiles_sheet.xml' },
  { key: 'buildings', png: '/assets/kenney/buildings/buildingTiles_sheet.png', xml: '/assets/kenney/buildings/buildingTiles_sheet.xml' },
] as const;

type Frame = { atlas: 'landscape' | 'buildings'; frame: string; tint?: number };

/** Tiled gid -> Kenney karosu. Sheet'teki indeksler contact sheet ile görsel olarak seçildi. */
export const GROUND_FRAMES: Record<number, Frame> = {
  1: { atlas: 'landscape', frame: 'landscapeTiles_022.png' }, // çim
  2: { atlas: 'landscape', frame: 'landscapeTiles_080.png' }, // yol (asfalt)
  3: { atlas: 'landscape', frame: 'landscapeTiles_035.png' }, // su
  4: { atlas: 'landscape', frame: 'landscapeTiles_083.png' }, // tarım toprağı
  5: { atlas: 'landscape', frame: 'landscapeTiles_059.png' }, // kıyı kumu
  6: { atlas: 'landscape', frame: 'landscapeTiles_081.png', tint: 0xdfe6f2 }, // meydan
};

/** Hotspot id -> bina sprite'ı (132x127 sınıfı, 1 karo taban). */
export const BUILDING_FRAMES: Record<string, Frame> = {
  school: { atlas: 'buildings', frame: 'buildingTiles_035.png' },
  canteen: { atlas: 'buildings', frame: 'buildingTiles_018.png' },
  energy: { atlas: 'buildings', frame: 'buildingTiles_041.png' },
  waste: { atlas: 'buildings', frame: 'buildingTiles_048.png' },
  city: { atlas: 'buildings', frame: 'buildingTiles_025.png' },
  farm: { atlas: 'buildings', frame: 'buildingTiles_022.png' },
  ocean: { atlas: 'buildings', frame: 'buildingTiles_011.png' },
};

/** Zemin sprite'ında elmasın altındaki kalınlık dahil toplam yükseklik (132x99). */
export const GROUND_SPRITE_HEIGHT = 99;
