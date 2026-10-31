import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { energy, food, waste } from '../data/scenarios';
import { learningOutcomes } from '../data/learningOutcomes';
import { runDecision } from '../game/systems/DecisionEngine';
import { ENERGY_BASELINE, energyFromChoice, outageRisk, wasteCollection, wasteFromChoice } from '../game/systems/ClimateEngine';
import { composeWorld } from '../state/composeWorld';
import { gameStore, isTaskComplete, taskSteps } from '../state/gameStore';
import { fallbackForResult } from '../ai/fallbackResponses';
import { validateTutorResponse } from '../ai/tutorClient';

beforeEach(() => gameStore.resetSession());
afterEach(() => vi.unstubAllGlobals());

describe('enerji çapraz kuralı', () => {
  it('formül: depolamasız pay artınca risk yükselir, depolama düşünce düşer', () => {
    expect(outageRisk(20, 0)).toBe(33);
    expect(outageRisk(50, 0)).toBe(60);
    expect(outageRisk(40, 2)).toBe(7);
    expect(outageRisk(25, 3)).toBe(0);
    expect(outageRisk(-4, -2)).toBe(15);
  });

  it('A riski yükseltir; depolamalı seçenekler başlangıcın altında kalır', () => {
    const risk = (id: string) => {
      const choice = [...energy.choices, energy.noDecision].find((c) => c.id === id)!;
      const sys = energyFromChoice(choice.system ?? ENERGY_BASELINE);
      return outageRisk(sys.renewableShare, sys.storageUnits);
    };
    const base = outageRisk(ENERGY_BASELINE.renewableShare, ENERGY_BASELINE.storageUnits);
    expect(risk('A')).toBeGreaterThan(base);
    expect(risk('B')).toBeLessThan(base);
    expect(risk('C')).toBeLessThan(base);
    expect(risk('N')).toBe(base);
  });

  it('üç seçenek farklıdır ve en az üç gösterge değişir', () => {
    const ids = learningOutcomes.map((l) => l.id as string);
    for (const id of energy.learningOutcomeIds) expect(ids).toContain(id);
    const outs = energy.choices.map((c) => runDecision(energy, c.id).after);
    expect(new Set(outs.map((o) => o.energyScore)).size).toBe(3);
    for (const c of energy.choices) {
      const res = runDecision(energy, c.id);
      const changed = (Object.keys(res.after) as (keyof typeof res.after)[]).filter((k) => res.after[k] !== res.before[k]);
      expect(changed.length).toBeGreaterThanOrEqual(3);
      expect(validateTutorResponse(fallbackForResult(res), res)).toBe(true);
    }
  });
});

describe('atık çapraz kuralı', () => {
  it('aynı gıda atığında önleme yükü azaltır; ayırma da azaltır', () => {
    const base = wasteCollection(30, 20, 10, 0).collectionNeed;
    const a = wasteFromChoice(waste.choices[0].system);
    const c = wasteFromChoice(waste.choices[2].system);
    expect(wasteCollection(30, a.otherWasteKg, 10, a.sortingRecovery).collectionNeed).toBeLessThan(base);
    expect(wasteCollection(30, c.otherWasteKg, 10, c.sortingRecovery).collectionNeed).toBeLessThan(base);
  });

  it('kantin atığı düşünce aynı atık kararı daha az sefer ister', () => {
    const sys = wasteFromChoice(waste.choices[0].system);
    const high = wasteCollection(30, sys.otherWasteKg, 10, sys.sortingRecovery).collectionNeed;
    const low = wasteCollection(18, sys.otherWasteKg, 10, sys.sortingRecovery).collectionNeed;
    expect(low).toBeLessThan(high);
  });

  it('hazır açıklama doğrulamadan geçer', () => {
    for (const c of waste.choices) {
      const res = runDecision(waste, c.id);
      expect(validateTutorResponse(fallbackForResult(res), res)).toBe(true);
    }
  });
});

describe('ortak dünya', () => {
  it('kantin ve enerji üst üste biner; kantini geri almak enerjiyi silmez', () => {
    gameStore.pickChoice('B');
    gameStore.evaluate();
    gameStore.selectHotspot('energy');
    gameStore.pickChoice('A');
    gameStore.evaluate();
    const both = gameStore.get().world;
    expect(both.foodWasteKg).toBe(20);
    expect(both.energyScore).toBe(88);
    expect(both.budget).toBe(10700);
    gameStore.selectHotspot('canteen');
    gameStore.retry();
    const left = gameStore.get().world;
    expect(left.foodWasteKg).toBe(food.baseline.foodWasteKg);
    expect(left.energyScore).toBe(88);
    expect(left.budget).toBe(11400);
    expect(composeWorld(gameStore.get().applied).energyScore).toBe(88);
  });

  it('enerji kararları kantin görevini tamamlamaz', () => {
    gameStore.selectHotspot('energy');
    gameStore.pickChoice('A');
    gameStore.evaluate();
    gameStore.retry();
    gameStore.pickChoice('B');
    gameStore.evaluate();
    expect(taskSteps(gameStore.get()).find((t) => t.id === 'compare')?.done).toBe(false);
    expect(isTaskComplete(gameStore.get())).toBe(false);
  });

  it('oturum yerel kayda yazılır ve geri yüklenir', () => {
    const mem = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => mem.set(k, v),
      removeItem: (k: string) => mem.delete(k),
    });
    gameStore.pickChoice('B');
    gameStore.evaluate();
    const snap = localStorage.getItem('yarinlab.session.v1');
    expect(snap).toContain('food_001');
    gameStore.resetSession();
    expect(localStorage.getItem('yarinlab.session.v1')).toBeNull();
    expect(gameStore.get().history).toHaveLength(0);
    localStorage.setItem('yarinlab.session.v1', snap!);
    gameStore.reloadSession();
    expect(gameStore.get().history).toHaveLength(1);
    expect(gameStore.get().world.foodWasteKg).toBe(20);
    expect(gameStore.get().introOpen).toBe(false);
  });
});
