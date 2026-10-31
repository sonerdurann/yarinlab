import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fallbackForResult } from '../ai/fallbackResponses';
import { validateTutorResponse } from '../ai/tutorClient';
import { ASSUMED_COLLECTION_CAPACITY_KG } from '../data/constants';
import { carbon, city, council, ocean, playableOrder, waste } from '../data/scenarios';
import { runDecision } from '../game/systems/DecisionEngine';
import { coastalRisk, councilScore, floodRisk, wasteCollection } from '../game/systems/ClimateEngine';
import { gameStore, isTaskComplete, taskSteps } from '../state/gameStore';

beforeEach(() => gameStore.resetSession());
afterEach(() => {
  vi.unstubAllGlobals();
});

const loadOf = () => {
  const s = gameStore.get();
  return wasteCollection(s.world.foodWasteKg, s.wasteSystem.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, s.wasteSystem.sortingRecovery).wasteLoadKg;
};

describe('P2 formüller', () => {
  it('taşkın: yeşil ve yağmur düşürür, boru yükseltir', () => {
    expect(floodRisk(40, 20, 0)).toBe(53);
    expect(floodRisk(25, 55, 0)).toBe(33);
    expect(floodRisk(30, 35, 45)).toBe(23);
    expect(floodRisk(55, 15, 10)).toBe(58);
  });

  it('kıyı: habitat düşürür; düşük yük aynı bakımı daha da düşürür', () => {
    expect(coastalRisk(50, 10)).toBe(41);
    expect(coastalRisk(50, 20)).toBe(37);
    expect(coastalRisk(50, 50)).toBe(25);
    expect(coastalRisk(50, 15)).toBe(39);
    const light = wasteCollection(30, 8, ASSUMED_COLLECTION_CAPACITY_KG, 0).wasteLoadKg;
    expect(light).toBe(38);
    expect(coastalRisk(light, 50)).toBe(19);
  });

  it('meclis: tek gösterge düşürür, iki kantin ve gerekçe yükseltir', () => {
    expect(councilScore({ playedModules: 0, foodDistinct: 0, wroteReason: false, evidenceBias: 0 })).toBe(15);
    expect(councilScore({ playedModules: 0, foodDistinct: 0, wroteReason: false, evidenceBias: -15 })).toBe(0);
    expect(councilScore({ playedModules: 1, foodDistinct: 2, wroteReason: true, evidenceBias: 20 })).toBe(65);
  });
});

describe('P2 senaryolar', () => {
  it('yedi modül kayıtlıdır; her modülde en az 5 görev, toplam ≥35', () => {
    const ids = playableOrder.map((s) => s.id);
    for (const first of ['food_001', 'energy_001', 'waste_001', 'city_001', 'carbon_001', 'ocean_001', 'council_001']) expect(ids).toContain(first);
    expect(ids.length).toBeGreaterThanOrEqual(35);
    for (const m of ['food', 'energy', 'waste', 'city', 'carbon', 'ocean', 'council']) expect(ids.filter((i) => i.startsWith(m + '_')).length).toBeGreaterThanOrEqual(5);
  });

  it('dört modül üç farklı sonuç ve doğrulanmış yedek metin üretir', () => {
    for (const sc of [city, carbon, ocean, council]) {
      const outs = sc.choices.map((c) => JSON.stringify(runDecision(sc, c.id).after));
      expect(new Set(outs).size, sc.id).toBe(3);
      for (const c of [...sc.choices, sc.noDecision]) {
        const r = runDecision(sc, c.id === 'N' ? sc.choices[0].id : c.id);
        if (c.id === 'N') continue;
        const text = fallbackForResult(r);
        expect(validateTutorResponse(text, r), `${sc.id} ${c.id}`).toBe(true);
        expect(`${text.summary} ${text.tradeoff} ${text.question1} ${text.question2}`).not.toMatch(/co2|co₂|emisyon|karbon\s*(ayak|salım)/i);
      }
    }
  });

  it('şehir A riski düşürür; kantin kararı durur, tekrar yalnızca şehri siler', () => {
    gameStore.selectHotspot('canteen');
    gameStore.pickChoice('B');
    gameStore.evaluate();
    gameStore.selectHotspot('city');
    gameStore.pickChoice('A');
    gameStore.evaluate();
    const w = gameStore.get().world;
    expect(w.foodWasteKg).toBe(20);
    expect(w.budget).toBe(10900);
    expect(w.waterScore).toBe(87);
    const citySys = gameStore.get().citySystem;
    expect(floodRisk(citySys.sealedShare, citySys.greenShare, citySys.rainShare)).toBe(33);
    gameStore.retry();
    expect(gameStore.get().world.foodWasteKg).toBe(20);
    expect(gameStore.get().world.budget).toBe(11300);
    const back = gameStore.get().citySystem;
    expect(floodRisk(back.sealedShare, back.greenShare, back.rainShare)).toBe(53);
  });

  it('atık azalınca aynı kıyı kararı daha düşük risk verir', () => {
    gameStore.selectHotspot('ocean');
    gameStore.pickChoice('B');
    gameStore.evaluate();
    const heavy = coastalRisk(loadOf(), gameStore.get().oceanSystem.habitatCare);
    expect(heavy).toBe(25);
    gameStore.resetSession();
    gameStore.selectHotspot('waste');
    gameStore.pickChoice('A');
    gameStore.evaluate();
    expect(gameStore.get().wasteSystem.otherWasteKg).toBe(waste.choices[0].system?.otherWasteKg);
    gameStore.selectHotspot('ocean');
    gameStore.pickChoice('B');
    gameStore.evaluate();
    const light = coastalRisk(loadOf(), gameStore.get().oceanSystem.habitatCare);
    expect(light).toBe(19);
    expect(light).toBeLessThan(heavy);
  });

  it('şehir kararı kantin görevini tamamlamaz; meclis okuldan açılır', () => {
    gameStore.selectHotspot('city');
    gameStore.pickChoice('A');
    gameStore.setReasoningOption(city.reasoningOptions[0]);
    gameStore.evaluate();
    expect(taskSteps(gameStore.get()).find((t) => t.id === 'choose')?.done).toBe(false);
    expect(isTaskComplete(gameStore.get())).toBe(false);
    gameStore.openCouncil();
    expect(gameStore.get().activeScenarioId).toBe(council.id);
    expect(gameStore.get().decisionOpen).toBe(true);
    expect(gameStore.get().schoolOpen).toBe(false);
  });

  it('karbon inceleme puanları birbirinden ayrıdır', () => {
    expect(carbon.choices.map((c) => c.system?.claimScore)).toEqual([30, 75, 45]);
    expect(ocean.choices.map((c) => c.system?.habitatCare)).toEqual([20, 50, 15]);
  });

  it('oturum şehir sistemini geri yükler', () => {
    const mem = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    });
    gameStore.selectHotspot('city');
    gameStore.pickChoice('C');
    gameStore.evaluate();
    const snap = localStorage.getItem('yarinlab.session.v1');
    expect(snap).toContain('city_001');
    gameStore.resetSession();
    localStorage.setItem('yarinlab.session.v1', snap!);
    gameStore.reloadSession();
    expect(gameStore.get().citySystem.sealedShare).toBe(55);
    expect(gameStore.get().world.waterScore).toBe(85);
  });
});
