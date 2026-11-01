/** Kıyı haritası 24x24: kara (x+y<=11), kumsal (12-15), sığ su (16-18), derin deniz (19+). */
export const COAST_N = 24;
export type CoastGround = 'grass' | 'sand' | 'shallow' | 'deep' | 'river';
/** Dere: karadan denize akan küçük su yolu; kara kaynaklı atık buradan kıyıya ulaşır (Mavi Nöbet). */
export const RIVER: [number, number][] = [0, 1, 2, 3, 4, 5].map((x) => [x, 9]);
export const coastGround = (x: number, y: number): CoastGround => {
  if (RIVER.some(([rx, ry]) => rx === x && ry === y)) return 'river';
  const s = x + y;
  return s <= 11 ? 'grass' : s <= 15 ? 'sand' : s <= 18 ? 'shallow' : 'deep';
};
/** Araştırma istasyonu (Mavi Nöbet görevleri) taban üst köşesi ve iskele karoları. */
export const STATION = { x: 4, y: 4, fw: 2, fd: 2 };
export const PIER: [number, number][] = [12, 13, 14, 15, 16, 17, 18].map((x) => [x, 4]);
