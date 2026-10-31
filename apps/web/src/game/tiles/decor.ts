export type DecorKind = 'solar' | 'battery' | 'turbine' | 'bin' | 'crop' | 'building';
export type Decor = { kind: DecorKind; x: number; y: number; frame?: string };

const at = (kind: DecorKind, pts: [number, number][], frame?: string): Decor[] => pts.map(([x, y]) => ({ kind, x, y, frame }));

/**
 * Etkileşimsiz dekor: bölge kimliğini gösterir (kılavuz §04 "özel parçalar").
 * Yollara (x=5 ve y=15 ekseni vb.) ve hotspot bina karolarına denk gelmez; test: tests/decor.test.ts
 */
export const DECOR: Decor[] = [
  // Enerji bölgesi: güneş panelleri, batarya, rüzgâr türbinleri
  ...at('solar', [[3, 4], [3, 5], [3, 6], [3, 7], [7, 4], [7, 5], [7, 6], [7, 7]]),
  ...at('battery', [[4, 8], [6, 8]]),
  ...at('turbine', [[2, 3], [8, 3], [2, 9], [8, 9]]),
  // Atık döngü bölgesi: ayrıştırma kutuları
  ...at('bin', [[3, 18], [3, 20], [7, 18], [7, 20], [4, 22], [6, 22]]),
  // Topluluk bostanı: ekin sıraları (tek x'li karolar; yol x=14 ve bina çevresi hariç)
  ...[9, 11, 13, 15].flatMap((x) =>
    [23, 24, 25, 26, 27, 28].filter((y) => !(Math.abs(x - 12) <= 1 && Math.abs(y - 25) <= 1)).map((y) => ({ kind: 'crop' as const, x, y })),
  ),
  // Şehir meydanı çevresi: dekor binaları
  ...at('building', [[23, 7]], 'buildingTiles_001.png'),
  ...at('building', [[27, 7]], 'buildingTiles_009.png'),
  ...at('building', [[23, 13]], 'buildingTiles_011.png'),
  ...at('building', [[27, 13]], 'buildingTiles_014.png'),
  ...at('building', [[28, 10]], 'buildingTiles_017.png'),
  ...at('building', [[22, 11]], 'buildingTiles_003.png'),
  // Okul çevresi
  ...at('building', [[12, 12]], 'buildingTiles_012.png'),
  ...at('building', [[16, 12]], 'buildingTiles_010.png'),
];
