import { calendar, weatherFor, WEATHER_TR, type Weather } from './clock';
import { simulateEnergyDay, type EnergyDay } from './energy';
import { buildingEffects, type PlacedBuilding } from './buildings';
import { ASSUMED_COLLECTION_CAPACITY_KG, coastalRisk, floodRisk, heatRisk, OTHER_SCHOOL_WASTE_KG, wasteCollection } from './risks';
import { rngFor } from './rng';

/** Görev kararlarından gelen temel göstergeler (oyun puanları; bütçe gerçek para değildir). */
export type CoreResources = { budget: number; foodWasteKg: number; energyScore: number; waterScore: number; wellbeing: number };

/** Modül sistemleri: görev kararlarıyla değişen yapısal değişkenler. */
export type ModuleSystems = {
  renewableShare: number; storageUnits: number; solarKw: number; windKw: number; storageKwh: number; efficiency: number;
  otherWasteKg: number; sortingRecovery: number;
  sealedShare: number; greenShare: number; rainShare: number; shade: number; transitShare: number;
  claimScore: number; habitatCare: number; evidenceBias: number;
};
export const BASE_SYSTEMS: ModuleSystems = {
  renewableShare: 20, storageUnits: 0, solarKw: 0, windKw: 0, storageKwh: 0, efficiency: 0,
  otherWasteKg: OTHER_SCHOOL_WASTE_KG, sortingRecovery: 0,
  sealedShare: 40, greenShare: 20, rainShare: 0, shade: 0, transitShare: 20,
  claimScore: 40, habitatCare: 10, evidenceBias: 0,
};

export type LogKind = 'decision' | 'build' | 'upgrade' | 'demolish' | 'event' | 'day' | 'unlock' | 'badge' | 'system';
export type LogEntry = { day: number; kind: LogKind; message: string; why?: string };

export type SimState = {
  seed: number;
  day: number;
  /** Gün sonu gelir/gider ve inşaatların birikimi (bütçe puanı) */
  treasury: number;
  buildings: PlacedBuilding[];
  /** Geçici olay etkileri: her gün yarıya iner */
  shock: Partial<Record<'energyScore' | 'waterScore' | 'wellbeing', number>>;
  log: LogEntry[];
};
export const newSim = (seed: number): SimState => ({ seed, day: 0, treasury: 0, buildings: [], shock: {}, log: [] });

/** Varsayım: günlük işletme bütçesi geliri (puan). */
export const DAILY_INCOME = 300;
/** Varsayım: günlük su kullanımı tabanı (m³). */
export const BASE_WATER_M3 = 40;
/**
 * Emisyon endeksi göreli ağırlıkları (VARSAYIM; birimsiz). kgCO₂e DEĞİLDİR: şebeke elektriği, atık ve
 * özel araç ulaşımının emisyona katkı yönü IPCC AR6 WG3 ile uyumludur, ağırlıklar oyun dengesi içindir.
 */
export const EMISSION_WEIGHTS = { gridKwh: 1, wasteKg: 6, carTrips: 3 };

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export type CityIndicators = {
  day: number; year: number; seasonTr: string; weather: Weather; weatherTr: string;
  budget: number;
  energy: EnergyDay;
  waterUseM3: number;
  wasteKg: number;
  collectionNeed: number;
  foodLossKg: number;
  emissionIndex: number;
  floodRisk: number;
  heatRisk: number;
  coastalRisk: number;
  energyRisk: number;
  ecosystem: number;
  resilience: number;
  wellbeing: number;
  literacy: number;
  upkeep: number;
};

export type CityResult = { resources: CoreResources; indicators: CityIndicators; effective: ModuleSystems };

const BASE_EMISSION_RAW = (() => {
  const e = simulateEnergyDay({ solarKw: 0, windKw: 0, storageKwh: 0, efficiency: 0, weather: 'sunny', season: 'autumn' });
  const w = wasteCollection(30).wasteLoadKg;
  return e.gridKwh * EMISSION_WEIGHTS.gridKwh + w * EMISSION_WEIGHTS.wasteKg + (100 - BASE_SYSTEMS.transitShare) * EMISSION_WEIGHTS.carTrips;
})();

/** Saf hesap: görev sonuçları + modül sistemleri + binalar + gün → şehir durumu. */
export function computeCity(base: CoreResources, sys: ModuleSystems, sim: SimState, literacy: number): CityResult {
  const b = buildingEffects(sim.buildings);
  const cal = calendar(sim.day);
  const weather = weatherFor(sim.seed, sim.day);
  const eff: ModuleSystems = {
    ...sys,
    solarKw: sys.solarKw + b.solarKw,
    windKw: sys.windKw + b.windKw,
    storageKwh: sys.storageKwh + b.storageKwh,
    efficiency: Math.min(0.45, sys.efficiency + b.efficiency),
    sealedShare: clamp(sys.sealedShare + b.sealedShare),
    greenShare: clamp(sys.greenShare + b.greenShare),
    rainShare: clamp(sys.rainShare + b.rainShare),
    shade: sys.shade + b.shade,
    transitShare: clamp(sys.transitShare + b.transitShare),
    habitatCare: clamp(sys.habitatCare + b.habitatCare),
  };
  const energy = simulateEnergyDay({
    solarKw: eff.solarKw, windKw: eff.windKw, storageKwh: eff.storageKwh, efficiency: eff.efficiency,
    extraDemandKwh: b.extraDemandKwh, weather, season: cal.season,
  });
  const foodLossKg = Math.max(0, Math.round((base.foodWasteKg - b.foodWasteCutKg) * 10) / 10);
  const col = wasteCollection(foodLossKg, sys.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, sys.sortingRecovery);
  const wasteKg = Math.max(0, Math.round((col.wasteLoadKg - b.wasteDivertKg) * 10) / 10);
  const collectionNeed = Math.ceil(wasteKg / ASSUMED_COLLECTION_CAPACITY_KG);
  const shock = sim.shock;
  const energyScore = clamp(Math.round(base.energyScore + energy.renewableSharePct * 0.15 - energy.outageHours * 3 + (shock.energyScore ?? 0)));
  const waterScore = clamp(Math.round(base.waterScore + b.waterSaveM3 * 0.8 + (shock.waterScore ?? 0)));
  const wellbeing = clamp(Math.round(base.wellbeing + b.wellbeing + (shock.wellbeing ?? 0)));
  const waterFactor = weather === 'drought' ? 1.25 : weather === 'heatwave' ? 1.2 : cal.season === 'summer' ? 1.1 : 1;
  const waterUseM3 = Math.max(0, Math.round(BASE_WATER_M3 * waterFactor - b.waterSaveM3 - (base.waterScore - 81) * 0.3));
  const fr = floodRisk(eff.sealedShare, eff.greenShare, eff.rainShare);
  const hr = heatRisk(eff.sealedShare, eff.greenShare, eff.shade);
  const cr = coastalRisk(wasteKg, eff.habitatCare);
  const energyRisk = clamp(energy.outageHours * 12 + (eff.storageKwh === 0 ? 10 : 0));
  const raw = energy.gridKwh * EMISSION_WEIGHTS.gridKwh + wasteKg * EMISSION_WEIGHTS.wasteKg + (100 - eff.transitShare) * EMISSION_WEIGHTS.carTrips;
  const ecosystem = clamp(Math.round(100 - cr * 0.5 - eff.sealedShare * 0.3 + eff.greenShare * 0.4 + eff.habitatCare * 0.2));
  const resilience = clamp(Math.round(100 - (fr + hr + energyRisk) / 3));
  const budget = Math.round(base.budget + sim.treasury);
  return {
    effective: eff,
    resources: { budget, foodWasteKg: foodLossKg, energyScore, waterScore, wellbeing },
    indicators: {
      day: sim.day, year: cal.year, seasonTr: cal.seasonTr, weather, weatherTr: WEATHER_TR[weather],
      budget, energy, waterUseM3, wasteKg, collectionNeed, foodLossKg,
      emissionIndex: Math.round((100 * raw) / BASE_EMISSION_RAW),
      floodRisk: fr, heatRisk: hr, coastalRisk: cr, energyRisk, ecosystem, resilience,
      wellbeing, literacy: clamp(Math.round(literacy + b.literacy)), upkeep: b.upkeep,
    },
  };
}

const CITIZEN_REQUESTS = [
  'Veliler okul bahçesinde daha çok gölgelik istiyor.',
  'Esnaf, akşam saatlerinde elektrik kesintisinden endişeli.',
  'Balıkçılar sahilde plastik atık gördüklerini bildirdi.',
  'Öğrenci meclisi tamir atölyesi önerdi.',
  'Mahalle sakinleri otobüs seferlerinin artmasını istiyor.',
  'Kantin ekibi porsiyon seçeneklerini tartışmak istiyor.',
  'Çiftçiler kuru günlerde sulama suyunun azaldığını söylüyor.',
];

export type DayOutcome = { sim: SimState; entries: LogEntry[]; city: CityResult };

/**
 * Bir oyun günü ilerletir (deterministik: tohum + gün). Olay etkileri azaltıcı önlemlerle hafifler; her etkinin
 * nedeni günlüğe yazılır. Etkiler geçicidir (her gün yarıya iner).
 */
export function advanceDay(base: CoreResources, sys: ModuleSystems, sim: SimState, literacy: number): DayOutcome {
  const next: SimState = { ...sim, day: sim.day + 1 };
  const decayed: SimState['shock'] = {};
  for (const [k, v] of Object.entries(sim.shock)) {
    const h = Math.trunc((v as number) / 2);
    if (h !== 0) decayed[k as keyof SimState['shock']] = h;
  }
  next.shock = decayed;
  const city = computeCity(base, sys, next, literacy);
  const ind = city.indicators;
  const entries: LogEntry[] = [];
  const add = (k: keyof SimState['shock'], v: number) => { if (v) next.shock[k] = (next.shock[k] ?? 0) + v; };
  let damage = 0;
  entries.push({ day: next.day, kind: 'day', message: `${ind.year} ${ind.seasonTr}, gün ${calendar(next.day).dayInSeason}: ${ind.weatherTr}.` });

  if (ind.weather === 'heatwave') {
    const hit = Math.round(ind.heatRisk / 10);
    add('wellbeing', -hit); add('waterScore', -4);
    entries.push({ day: next.day, kind: 'event', message: `Sıcak hava dalgası: refah −${hit}, su −4.`,
      why: `Sıcak stres riski ${ind.heatRisk}/100. Yeşil alan ve gölgelik bu riski azaltır.` });
  }
  if (ind.weather === 'storm' || ind.weather === 'rainy') {
    const threshold = ind.weather === 'storm' ? 45 : 65;
    if (ind.floodRisk > threshold) {
      damage = (ind.floodRisk - threshold) * 25;
      add('wellbeing', -3);
      entries.push({ day: next.day, kind: 'event', message: `Yağış sonrası su baskını: onarım −${damage} puan, refah −3.`,
        why: `Taşkın riski ${ind.floodRisk}/100 eşiği (${threshold}) aştı. Geçirgen yüzey ve yağmur hasadı riski düşürür.` });
    } else {
      entries.push({ day: next.day, kind: 'event', message: 'Yağış oldu; altyapı suyu taşıdı.', why: `Taşkın riski ${ind.floodRisk}/100, eşik ${threshold}.` });
    }
  }
  if (ind.weather === 'drought') {
    const hit = Math.max(0, 6 - Math.floor((ind.waterUseM3 < 35 ? 3 : 0) + city.effective.rainShare / 10));
    add('waterScore', -hit);
    entries.push({ day: next.day, kind: 'event', message: `Kurak gün: su −${hit}.`, why: 'Yağmur suyu hasadı ve verimli sulama kuraklık etkisini azaltır.' });
  }
  if (ind.energy.outageHours > 0) {
    add('wellbeing', -Math.min(6, ind.energy.outageHours));
    add('energyScore', -Math.min(8, ind.energy.outageHours * 2));
    entries.push({ day: next.day, kind: 'event', message: `Elektrik kesintisi: ${ind.energy.outageHours} saat.`,
      why: `Talep ${ind.energy.demandKwh} kWh; şebeke sınırı ${ind.energy.gridCapKw} kW. Depolama ve verimlilik kesintiyi azaltır.` });
  } else if (ind.energy.renewableSharePct >= 40) {
    entries.push({ day: next.day, kind: 'event', message: `Yenilenebilir pay %${ind.energy.renewableSharePct}; kesinti yok.` });
  }
  const r = rngFor(sim.seed, next.day, 3)();
  if (r < 0.35) entries.push({ day: next.day, kind: 'event', message: `Vatandaş isteği: ${CITIZEN_REQUESTS[Math.floor(r * 20) % CITIZEN_REQUESTS.length]}` });

  const net = DAILY_INCOME - ind.upkeep - damage;
  next.treasury = sim.treasury + net;
  entries.push({ day: next.day, kind: 'day', message: `Gün sonu bütçe: +${DAILY_INCOME} gelir, −${ind.upkeep} bakım${damage ? `, −${damage} onarım` : ''}.` });
  next.log = [...sim.log, ...entries].slice(-200);
  return { sim: next, entries, city: computeCity(base, sys, next, literacy) };
}
