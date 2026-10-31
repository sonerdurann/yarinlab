import { describe, expect, it } from 'vitest';
import {
  advanceDay, BASE_SYSTEMS, BUILD_SLOTS, BUILDINGS, build, buildingEffects, calendar, computeCity, demolish, earnedBadges,
  levelForXp, mulberry32, newSim, scoreAttempt, scoreReasoning, simulateEnergyDay, upgrade, weatherFor, type CoreResources,
} from '../index';

const base: CoreResources = { budget: 12000, foodWasteKg: 30, energyScore: 76, waterScore: 81, wellbeing: 75 };
const ctx = { completedTasks: 10, modulesPlayed: ['energy', 'food'], level: 5 };

describe('deterministik rastgelelik ve takvim', () => {
  it('aynı tohum aynı diziyi verir', () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(mulberry32(43)()).not.toBe(mulberry32(42)());
  });
  it('hava tohum+gün ile tekrarlanır ve mevsime göre değişir', () => {
    const w1 = Array.from({ length: 40 }, (_, d) => weatherFor(7, d));
    const w2 = Array.from({ length: 40 }, (_, d) => weatherFor(7, d));
    expect(w1).toEqual(w2);
    const summer = Array.from({ length: 400 }, (_, i) => weatherFor(i, 24));
    const winter = Array.from({ length: 400 }, (_, i) => weatherFor(i, 8));
    expect(summer.filter((w) => w === 'heatwave').length).toBeGreaterThan(winter.filter((w) => w === 'heatwave').length);
  });
  it('mevsim ve yıl ilerler', () => {
    expect(calendar(0)).toMatchObject({ year: 2026, season: 'autumn', dayInSeason: 1 });
    expect(calendar(8).season).toBe('winter');
    expect(calendar(32).year).toBe(2027);
  });
});

describe('saatlik enerji modeli', () => {
  const sunny = { solarKw: 120, windKw: 0, storageKwh: 0, efficiency: 0, weather: 'sunny' as const, season: 'summer' as const };
  it('güneş gece üretmez, gündüz üretir', () => {
    const d = simulateEnergyDay(sunny);
    expect(d.hours[2].solar).toBe(0);
    expect(d.hours[12].solar).toBeGreaterThan(100);
    expect(d.hours).toHaveLength(24);
  });
  it('bulut üretimi düşürür; rüzgâr gece de üretir', () => {
    expect(simulateEnergyDay({ ...sunny, weather: 'cloudy' }).prodKwh).toBeLessThan(simulateEnergyDay(sunny).prodKwh);
    const w = simulateEnergyDay({ ...sunny, solarKw: 0, windKw: 60, weather: 'windy' });
    expect(w.hours[2].wind).toBeGreaterThan(0);
  });
  it('depolama yenilenebilir payını artırır ve şebeke çekişini azaltır', () => {
    const no = simulateEnergyDay(sunny);
    const yes = simulateEnergyDay({ ...sunny, storageKwh: 300 });
    expect(yes.renewableSharePct).toBeGreaterThan(no.renewableSharePct);
    expect(yes.gridKwh).toBeLessThan(no.gridKwh);
  });
  it('fırtınada şebeke sınırı düşer, kesinti olur; batarya + verimlilik azaltır', () => {
    const storm = { solarKw: 0, windKw: 0, storageKwh: 0, efficiency: 0, weather: 'storm' as const, season: 'winter' as const };
    const a = simulateEnergyDay(storm);
    const b = simulateEnergyDay({ ...storm, windKw: 60, storageKwh: 240, efficiency: 0.2 });
    expect(a.outageHours).toBeGreaterThan(0);
    expect(b.outageHours).toBeLessThan(a.outageHours);
  });
  it('enerji korunur: talep = yenilenebilir kullanım + şebeke + karşılanamayan (yuvarlama payıyla)', () => {
    const d = simulateEnergyDay({ ...sunny, storageKwh: 200, weather: 'heatwave' });
    const used = (d.renewableSharePct / 100) * d.demandKwh;
    expect(Math.abs(used + d.gridKwh + d.unmetKwh - d.demandKwh)).toBeLessThan(d.demandKwh * 0.02);
  });
});

describe('inşa sistemi', () => {
  it('maliyet düşülür, alan doluluğu ve bölge kontrol edilir', () => {
    const r = build([], 'solar', 'en-1', 5000, 0, ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cost).toBe(1200);
    expect(build(r.buildings, 'solar', 'en-1', 5000, 0, ctx)).toMatchObject({ ok: false, error: 'slot_taken' });
    expect(build([], 'solar', 'ci-1', 5000, 0, ctx)).toMatchObject({ ok: false, error: 'wrong_zone' });
    expect(build([], 'solar', 'en-2', 100, 0, ctx)).toMatchObject({ ok: false, error: 'no_budget' });
  });
  it('kilitler görev ve modül ilerlemesine bağlı', () => {
    const fresh = { completedTasks: 0, modulesPlayed: [], level: 1 };
    expect(build([], 'wind', 'en-1', 9000, 0, fresh)).toMatchObject({ ok: false, error: 'locked' });
    expect(build([], 'battery', 'en-1', 9000, 0, { ...fresh, completedTasks: 5 })).toMatchObject({ ok: false, error: 'locked' });
    expect(build([], 'battery', 'en-1', 9000, 0, { ...fresh, modulesPlayed: ['energy'] }).ok).toBe(true);
  });
  it('yükseltme etkiyi ve bakımı ölçekler; 3. seviyede durur; yıkım kısmi iade', () => {
    const r = build([], 'solar', 'en-1', 9000, 0, ctx);
    if (!r.ok) throw new Error();
    let bs = r.buildings;
    expect(buildingEffects(bs).solarKw).toBe(40);
    for (let i = 0; i < 2; i++) { const u = upgrade(bs, bs[0].id, 9000); if (!u.ok) throw new Error(); bs = u.buildings; }
    expect(buildingEffects(bs)).toMatchObject({ solarKw: 120, upkeep: 30 });
    expect(upgrade(bs, bs[0].id, 9000)).toMatchObject({ ok: false, error: 'max_level' });
    expect(demolish(bs, bs[0].id).refund).toBe(Math.round(3000 * 0.3));
  });
  it('her bina tanımı geçerli bir bölgeye ve en az bir yapı alanına sahip; alanlar benzersiz', () => {
    for (const b of BUILDINGS) expect(BUILD_SLOTS.some((s) => s.zone === b.zone)).toBe(true);
    expect(new Set(BUILD_SLOTS.map((s) => `${s.x},${s.y}`)).size).toBe(BUILD_SLOTS.length);
  });
});

describe('ortak şehir modeli ve gün döngüsü', () => {
  it('çapraz etki: gıda atığı azalınca atık yükü, toplama ihtiyacı ve kıyı riski düşer', () => {
    const sim = newSim(1);
    const a = computeCity(base, BASE_SYSTEMS, sim, 0).indicators;
    const b = computeCity({ ...base, foodWasteKg: 18 }, BASE_SYSTEMS, sim, 0).indicators;
    expect(b.wasteKg).toBeLessThan(a.wasteKg);
    expect(b.collectionNeed).toBeLessThanOrEqual(a.collectionNeed);
    expect(b.coastalRisk).toBeLessThan(a.coastalRisk);
    expect(b.emissionIndex).toBeLessThan(a.emissionIndex);
  });
  it('çapraz etki: yenilenebilir yapılar şebeke kaynaklı emisyon endeksini düşürür', () => {
    const sim = newSim(1);
    const r = build([], 'solar', 'en-1', 9000, 0, ctx);
    if (!r.ok) throw new Error();
    const withSolar = { ...sim, buildings: r.buildings };
    expect(computeCity(base, BASE_SYSTEMS, withSolar, 0).indicators.emissionIndex)
      .toBeLessThanOrEqual(computeCity(base, BASE_SYSTEMS, sim, 0).indicators.emissionIndex);
  });
  it('yeşil alan sıcak ve taşkın riskini düşürür, dayanıklılığı artırır', () => {
    const sim = newSim(3);
    const g = { ...BASE_SYSTEMS, greenShare: 50, sealedShare: 25 };
    const a = computeCity(base, BASE_SYSTEMS, sim, 0).indicators, b = computeCity(base, g, sim, 0).indicators;
    expect(b.heatRisk).toBeLessThan(a.heatRisk);
    expect(b.floodRisk).toBeLessThan(a.floodRisk);
    expect(b.resilience).toBeGreaterThan(a.resilience);
  });
  it('gün döngüsü deterministiktir, günlük gelir/bakım işler, günlük kayıt neden içerir', () => {
    const run = () => { let s = newSim(99); for (let i = 0; i < 40; i++) s = advanceDay(base, BASE_SYSTEMS, s, 0).sim; return s; };
    const a = run(), b = run();
    expect(a).toEqual(b);
    expect(a.day).toBe(40);
    expect(a.log.some((e) => e.kind === 'event' && e.why)).toBe(true);
    expect(a.log.length).toBeLessThanOrEqual(200);
  });
  it('olay etkileri geçicidir (göstergeler sıfıra kaymaz)', () => {
    let s = newSim(5);
    for (let i = 0; i < 120; i++) s = advanceDay(base, BASE_SYSTEMS, s, 0).sim;
    const r = computeCity(base, BASE_SYSTEMS, s, 0).resources;
    expect(r.wellbeing).toBeGreaterThan(50);
    expect(r.waterScore).toBeGreaterThan(50);
  });
});

describe('puanlama ve ilerleme', () => {
  const rows = [{ key: 'foodWasteKg', lowerIsBetter: true }, { key: 'budget' }, { key: 'wellbeing' }];
  it('gerekçe puanı nedensellik ve kanıt sözcükleriyle artar', () => {
    expect(scoreReasoning('')).toBe(0);
    expect(scoreReasoning('iyi')).toBeLessThan(scoreReasoning('Atık azalır çünkü porsiyonu ölçüp veriye göre planladık; bütçe de korunur.'));
  });
  it('tek göstergeyi bozan karar denge puanı kaybeder', () => {
    const before = { foodWasteKg: 30, budget: 12000, wellbeing: 75 };
    const balanced = scoreAttempt(before, { foodWasteKg: 20, budget: 11800, wellbeing: 80 }, rows, 'çünkü veri');
    const lopsided = scoreAttempt(before, { foodWasteKg: 18, budget: 12200, wellbeing: 58 }, rows, 'çünkü veri');
    expect(balanced.balance).toBeGreaterThan(lopsided.balance);
    expect(balanced.total).toBeGreaterThan(lopsided.total);
  });
  it('seviye ve rozetler', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(160)).toBe(3);
    const f = { decisions: 1, reasonedDecisions: 5, completedTasks: 1, modulesPlayed: 7, comparedTasks: 0, buildings: 0, maxBuildingLevel: 0, days: 0, greenEnergyDays: 0, councilDone: false, realWorldMeasurements: 0, assessmentsPost: 0 };
    expect(earnedBadges(f)).toEqual(expect.arrayContaining(['first-decision', 'reasoner', 'explorer']));
    expect(earnedBadges(f)).not.toContain('builder');
  });
});
