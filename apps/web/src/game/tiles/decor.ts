export type DecorKind =
  | 'solar' | 'battery' | 'turbine' | 'bin' | 'crop' | 'building'
  | 'house' | 'shop' | 'apartment' | 'bench' | 'flowers' | 'bush' | 'rock' | 'fruit' | 'silo' | 'pylon' | 'lamp' | 'court' | 'pine';
export type Decor = { kind: DecorKind; x: number; y: number; frame?: string; variant?: number };

const at = (kind: DecorKind, pts: [number, number][], variant?: number): Decor[] => pts.map(([x, y], i) => ({ kind, x, y, variant: variant ?? i % 3 }));
const rect = (x0: number, x1: number, y0: number, y1: number, step = 1): [number, number][] => {
  const o: [number, number][] = [];
  for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) o.push([x, y]);
  return o;
};

/**
 * Etkileşimsiz dekor: her bölgenin kimliğini gösterir (prompt §2). Yollara, ana bina tabanlarına ve yapı
 * alanlarına denk gelmez; iki dekor aynı karoyu paylaşmaz (test: tests/decor.test.ts).
 */
export const DECOR: Decor[] = [
  // KUZEY · Enerji vadisi: panel tarlası, türbinler, batarya, iletim direkleri
  ...at('solar', rect(3, 5, 3, 5)),
  ...at('solar', rect(10, 12, 3, 5)),
  ...at('turbine', [[3, 8], [11, 8], [5, 12], [10, 12]]),
  ...at('battery', [[9, 7], [9, 8]]),
  ...at('pylon', [[12, 7], [13, 2]]),
  // DOĞU · Şehir merkezi: konutlar, dükkânlar, apartmanlar, park
  ...at('house', [[28, 3], [28, 5], [28, 10], [28, 12], [36, 3], [37, 5]]),
  ...at('shop', [[30, 7], [32, 7], [34, 7], [30, 9], [35, 9]]),
  ...at('apartment', [[34, 3], [34, 5], [31, 11], [37, 12]]),
  ...at('bench', [[34, 11], [37, 10]]),
  ...at('lamp', [[29, 7], [36, 7], [29, 9]]),
  ...at('bush', [[34, 10], [37, 11]]),
  // BATI · Tarım alanı: tarlalar, silo, meyve bahçesi
  ...at('crop', rect(9, 12, 28, 32).filter(([x, y]) => (x + y) % 1 === 0)),
  ...at('crop', rect(3, 12, 34, 37).filter(([x]) => x !== 7)),
  ...at('silo', [[8, 29]]),
  ...at('fruit', [[3, 23], [5, 23], [7, 23], [3, 25], [5, 25], [7, 25], [9, 25], [11, 23]]),
  // GÜNEY · Döngü atölyesi: kutular
  ...at('bin', [[28, 33], [29, 33], [30, 33], [34, 28], [35, 28], [36, 28]]),
  ...at('bench', [[34, 35]]),
  // MERKEZ · Kampüs: spor sahası, banklar, çiçekler
  ...at('court', [[23, 15]]),
  ...at('bench', [[17, 21], [19, 21], [15, 16]]),
  ...at('flowers', [[16, 15], [17, 15], [21, 16], [21, 19], [15, 19], [15, 23], [18, 24], [20, 24]]),
  ...at('bush', [[14, 14], [25, 25], [14, 25], [16, 19]]),
  // Kıyı yolu ve ada kenarı
  ...at('rock', [[36, 15], [38, 24], [36, 25], [1, 1], [38, 1]]),
  ...at('pine', [[1, 20], [1, 22], [2, 38], [20, 38], [22, 38], [38, 38]]),
];
