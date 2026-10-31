import { pickWeighted, rngFor } from './rng';

export type Season = 'autumn' | 'winter' | 'spring' | 'summer';
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'storm' | 'heatwave' | 'drought';

export const START_YEAR = 2026;
/** Oyun kurgusu: bir mevsim 8 oyun günüdür; 4 mevsim = 1 oyun yılı. */
export const DAYS_PER_SEASON = 8;
const SEASONS: Season[] = ['autumn', 'winter', 'spring', 'summer'];

export const SEASON_TR: Record<Season, string> = { autumn: 'Sonbahar', winter: 'Kış', spring: 'İlkbahar', summer: 'Yaz' };
export const WEATHER_TR: Record<Weather, string> = {
  sunny: 'Güneşli', cloudy: 'Bulutlu', rainy: 'Yağmurlu', windy: 'Rüzgârlı',
  storm: 'Fırtına / sağanak', heatwave: 'Sıcak hava dalgası', drought: 'Kurak gün',
};
export const WEATHER_ICON: Record<Weather, string> = {
  sunny: '☀', cloudy: '☁', rainy: '🌧', windy: '🌬', storm: '⛈', heatwave: '🌡', drought: '🏜',
};

export function calendar(day: number) {
  const d = Math.max(0, Math.floor(day));
  const seasonIndex = Math.floor(d / DAYS_PER_SEASON) % 4;
  const year = START_YEAR + Math.floor(d / (DAYS_PER_SEASON * 4));
  return { day: d, year, season: SEASONS[seasonIndex], seasonTr: SEASONS_TR(seasonIndex), dayInSeason: (d % DAYS_PER_SEASON) + 1 };
}
const SEASONS_TR = (i: number) => SEASON_TR[SEASONS[i]];

/**
 * Mevsime göre hava olasılıkları: OYUN VARSAYIMI (kurgusal Akdeniz kıyı kenti).
 * Sıcak dalga ve kuraklık yazın daha olası; IPCC AR6 sıcak uçların sıklığının arttığını belirtir [R-IPCC], ancak
 * buradaki oranlar ölçülmüş iklim istatistiği değildir.
 */
export const WEATHER_WEIGHTS: Record<Season, Record<Weather, number>> = {
  autumn: { sunny: 30, cloudy: 25, rainy: 20, windy: 15, storm: 7, heatwave: 1, drought: 2 },
  winter: { sunny: 15, cloudy: 30, rainy: 25, windy: 18, storm: 11, heatwave: 0, drought: 1 },
  spring: { sunny: 35, cloudy: 25, rainy: 18, windy: 15, storm: 4, heatwave: 1, drought: 2 },
  summer: { sunny: 45, cloudy: 8, rainy: 4, windy: 10, storm: 3, heatwave: 18, drought: 12 },
};

export function weatherFor(seed: number, day: number): Weather {
  if (day <= 0) return 'sunny'; // hikâye başlangıcı: sakin bir sonbahar sabahı
  if (day < 3) return pickWeighted(rngFor(seed, day, 1), { sunny: 2, cloudy: 1, windy: 1 }); // öğretici günler: uç olay yok
  return pickWeighted(rngFor(seed, day, 1), WEATHER_WEIGHTS[calendar(day).season]);
}
