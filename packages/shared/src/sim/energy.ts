import { calendar, type Season, type Weather } from './clock';

/**
 * Saatlik enerji dengesi (24 adım). OYUN MODELİ — gerçek şebeke ya da ölçülmüş üretim değildir.
 * Nitel dayanaklar: güneş üretimi gündüz ve bulutlulukla değişir, rüzgâr havaya bağlıdır, depolama
 * değişkenliği dengeler [R-IEA-RENEW]. Katsayılar sadeleştirilmiş varsayımlardır (docs/SIMULATION_ASSUMPTIONS.md).
 */
export type EnergyInput = {
  solarKw: number;
  windKw: number;
  storageKwh: number;
  /** Verimlilik iyileştirmesi: talepte yüzde azalma (0..0,5) */
  efficiency: number;
  /** Ek talep (yeni bina, soğutma vb.), kWh/gün */
  extraDemandKwh?: number;
  weather: Weather;
  season: Season;
};
export type EnergyHour = { hour: number; solar: number; wind: number; demand: number; battery: number; grid: number; unmet: number };
export type EnergyDay = {
  hours: EnergyHour[];
  prodKwh: number;
  demandKwh: number;
  gridKwh: number;
  unmetKwh: number;
  outageHours: number;
  renewableSharePct: number;
  gridCapKw: number;
};

/** Varsayım: okul + çevre yerleşimi için günlük talep (kWh). */
export const BASE_DEMAND_KWH = 900;
/** Varsayım: şebekeden çekilebilecek en yüksek güç (kW); fırtına ve sıcak dalgada düşer. */
export const GRID_CAP_KW: Record<Weather, number> = { sunny: 70, cloudy: 70, rainy: 65, windy: 65, storm: 50, heatwave: 55, drought: 60 };
const SOLAR_WEATHER: Record<Weather, number> = { sunny: 1, cloudy: 0.45, rainy: 0.25, windy: 0.85, storm: 0.12, heatwave: 0.92, drought: 1 };
const SOLAR_SEASON: Record<Season, number> = { autumn: 0.7, winter: 0.5, spring: 0.85, summer: 1 };
const WIND_CF: Record<Weather, number> = { sunny: 0.15, cloudy: 0.3, rainy: 0.35, windy: 0.65, storm: 0.45, heatwave: 0.08, drought: 0.12 };
const HEAT_DEMAND: Record<Weather, number> = { sunny: 1, cloudy: 1, rainy: 1, windy: 1, storm: 1.05, heatwave: 1.3, drought: 1.1 };
const SEASON_DEMAND: Record<Season, number> = { autumn: 1, winter: 1.15, spring: 0.95, summer: 1.1 };
/** Talep profili: 24 saatlik paylar (toplam 1). Gündüz okul saatleri yoğun. */
const PROFILE = (() => {
  const w = Array.from({ length: 24 }, (_, h) => (h >= 8 && h <= 16 ? 3 : h >= 17 && h <= 21 ? 2 : 0.8));
  const t = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / t);
})();
const ROUND_TRIP = 0.9;
const r1 = (n: number) => Math.round(n * 10) / 10;

export function solarFactor(hour: number): number {
  if (hour < 6 || hour > 18) return 0;
  return Math.sin(((hour - 6) / 12) * Math.PI);
}

export function simulateEnergyDay(i: EnergyInput): EnergyDay {
  const eff = Math.max(0, Math.min(0.5, i.efficiency));
  const demandKwh = (BASE_DEMAND_KWH * SEASON_DEMAND[i.season] * HEAT_DEMAND[i.weather] + (i.extraDemandKwh ?? 0)) * (1 - eff);
  const cap = GRID_CAP_KW[i.weather];
  let soc = 0;
  const maxSoc = Math.max(0, i.storageKwh);
  const hours: EnergyHour[] = [];
  let prod = 0, grid = 0, unmet = 0, outageHours = 0, renewUsed = 0;
  for (let h = 0; h < 24; h++) {
    const solar = Math.max(0, i.solarKw) * solarFactor(h) * SOLAR_WEATHER[i.weather] * SOLAR_SEASON[i.season];
    const wind = Math.max(0, i.windKw) * WIND_CF[i.weather];
    const demand = demandKwh * PROFILE[h];
    const ren = solar + wind;
    prod += ren;
    let need = demand - ren;
    let battery = 0;
    if (need < 0) {
      const charge = Math.min(-need * ROUND_TRIP, maxSoc - soc);
      soc += charge;
      battery = charge;
      renewUsed += demand;
      need = 0;
    } else {
      renewUsed += ren;
      const dis = Math.min(need, soc);
      soc -= dis;
      battery = -dis;
      renewUsed += dis;
      need -= dis;
    }
    const g = Math.min(need, cap);
    const u = need - g;
    grid += g;
    unmet += u;
    if (u > 0.05) outageHours++;
    hours.push({ hour: h, solar: r1(solar), wind: r1(wind), demand: r1(demand), battery: r1(battery), grid: r1(g), unmet: r1(u) });
  }
  return {
    hours,
    prodKwh: Math.round(prod),
    demandKwh: Math.round(demandKwh),
    gridKwh: Math.round(grid),
    unmetKwh: Math.round(unmet),
    outageHours,
    renewableSharePct: demandKwh > 0 ? Math.round((100 * renewUsed) / demandKwh) : 0,
    gridCapKw: cap,
  };
}

export const energyForDay = (day: number, weather: Weather, base: Omit<EnergyInput, 'weather' | 'season'>) =>
  simulateEnergyDay({ ...base, weather, season: calendar(day).season });
