/** Deterministik PRNG (mulberry32). Aynı tohum → aynı dizi; tohum kayıtta saklanır. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Belirli bir gün için bağımsız, tekrarlanabilir rastgele sayı üreteci. */
export const rngFor = (seed: number, day: number, salt = 0) =>
  mulberry32((Math.imul(seed >>> 0, 2654435761) ^ Math.imul(day + 1, 40503) ^ Math.imul(salt + 7, 97)) >>> 0);

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export function pickWeighted<T extends string>(rand: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [k, w] of entries) {
    if ((r -= w) < 0) return k;
  }
  return entries[entries.length - 1][0];
}
