export const MAP = {
  key: 'world',
  url: '/assets/maps/world_alpha.json',
  size: 32,
  // Kenney tile ölçüsü doğrulanana kadar hedef değer (kılavuz §07); gerçek ölçü paket metadata'sından alınır.
  tileWidth: 128,
  tileHeight: 64,
} as const;

/** Tileset gid → renk (geçici prosedürel zemin; Kenney atlasıyla değişecek). */
export const TILE_COLORS: Record<number, number> = {
  1: 0xa9d9a0, // çim
  2: 0xc9c6bd, // yol
  3: 0x8fcdea, // su
  4: 0xd9c98a, // tarım
  5: 0xf0e2b6, // kıyı
  6: 0xd7dbe3, // meydan
};
export const TREE_GID = 7;
