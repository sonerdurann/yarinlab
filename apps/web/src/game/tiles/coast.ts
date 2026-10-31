/** Kıyı haritası 24x24: kara (x+y<=11), kumsal (12-15), sığ su (16-18), derin deniz (19+). */
export const COAST_N = 24;
export type CoastGround = 'grass' | 'sand' | 'shallow' | 'deep';
export const coastGround = (x: number, y: number): CoastGround => {
  const s = x + y;
  return s <= 11 ? 'grass' : s <= 15 ? 'sand' : s <= 18 ? 'shallow' : 'deep';
};
/** Araştırma istasyonu (Mavi Nöbet görevleri) taban üst köşesi ve iskele karoları. */
export const STATION = { x: 4, y: 4, fw: 2, fd: 2 };
export const PIER: [number, number][] = [12, 13, 14, 15, 16, 17, 18].map((x) => [x, 4]);
