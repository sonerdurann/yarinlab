import { beforeEach, describe, expect, it } from 'vitest';
import { gameStore } from '../state/gameStore';
import { cityOf, completedTaskIds, unlockCtx } from '../state/city';
import { BUILD_SLOTS } from '@yarinlab/shared';
import { DECOR } from '../game/tiles/decor';
import { hotspots } from '../game/tiles/hotspots';
import map from '../../public/assets/maps/world_alpha.json';

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage ??= {
  getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k),
};

beforeEach(() => gameStore.resetSession());

const decide = (hotspot: string, choice: string, reason = 'Atık azalır çünkü veriye göre plan yaptık.') => {
  gameStore.selectHotspot(hotspot);
  gameStore.pickChoice(choice);
  gameStore.setReasoningText(reason);
  gameStore.evaluate();
};

describe('ortak şehir simülasyonu (store)', () => {
  it('gün ilerler, hava ve günlük olay kaydı oluşur, bütçeye gelir/bakım yansır', () => {
    const b0 = gameStore.get().world.budget;
    gameStore.endDay();
    const s = gameStore.get();
    expect(s.sim.day).toBe(1);
    expect(s.sim.log.some((e) => e.kind === 'day')).toBe(true);
    expect(s.world.budget).toBeGreaterThanOrEqual(b0 - 1000);
  });

  it('karar puanlanır, XP verir, olay günlüğüne neden ile yazılır', () => {
    decide('canteen', 'B');
    const s = gameStore.get();
    expect(s.scores).toHaveLength(1);
    expect(s.scores[0].reasoning).toBeGreaterThan(0);
    expect(s.xp).toBeGreaterThan(0);
    expect(s.sim.log.find((e) => e.kind === 'decision')?.why).toBeTruthy();
    expect(completedTaskIds(s)).toContain('food_001');
  });

  it('inşa bütçeden düşer, yükseltilir; yenilenebilir yapı şehir enerjisini değiştirir', () => {
    const before = cityOf(gameStore.get()).indicators.energy.prodKwh;
    const b0 = gameStore.get().world.budget;
    const r = gameStore.build('solar', 'en-1');
    expect(r.ok).toBe(true);
    const s = gameStore.get();
    expect(s.world.budget).toBe(b0 - 1200);
    expect(cityOf(s).indicators.energy.prodKwh).toBeGreaterThan(before);
    gameStore.upgrade(s.sim.buildings[0].id);
    expect(gameStore.get().sim.buildings[0].level).toBe(2);
  });

  it('kilitli yapı kurulamaz; görev tamamlanınca açılır', () => {
    expect(gameStore.build('wind', 'en-2').ok).toBe(false);
    decide('canteen', 'B');
    expect(unlockCtx(gameStore.get()).completedTasks).toBe(1);
    expect(gameStore.build('wind', 'en-2').ok).toBe(true);
  });

  it('kayıt ve geri yükleme: gün, binalar, tohum ve XP korunur', () => {
    decide('canteen', 'B');
    gameStore.build('solar', 'en-1');
    gameStore.endDay();
    const before = gameStore.get();
    gameStore.reloadSession();
    const after = gameStore.get();
    expect(after.sim.seed).toBe(before.sim.seed);
    expect(after.sim.day).toBe(1);
    expect(after.sim.buildings).toEqual(before.sim.buildings);
    expect(after.xp).toBe(before.xp);
    expect(after.world).toEqual(before.world);
  });

  it('bozuk kayıt reddedilir, oyun sıfırdan başlar', () => {
    gameStore.importSave({ history: 'bozuk', sim: { seed: 'x' } });
    expect(gameStore.get().history).toHaveLength(0);
    expect(gameStore.get().sim.day).toBe(0);
  });

  it('rozet: ilk karar rozeti bildirilir', () => {
    decide('canteen', 'A');
    expect(gameStore.get().badges).toContain('first-decision');
  });
});

describe('yapı alanları haritayla çakışmaz', () => {
  const roads = (map as { layers: { name: string; data?: number[] }[] }).layers.find((l) => l.name === 'roads')!.data!;
  const ground = (map as { layers: { name: string; data?: number[] }[] }).layers.find((l) => l.name === 'ground')!.data!;
  it.each(BUILD_SLOTS)('$id', (slot) => {
    expect(roads[slot.y * 32 + slot.x]).toBe(0);
    expect(ground[slot.y * 32 + slot.x]).not.toBe(3); // su
    expect(DECOR.some((d) => d.x === slot.x && d.y === slot.y)).toBe(false);
    expect(hotspots.some((h) => Math.abs(h.tileX - slot.x) <= 1 && Math.abs(h.tileY - slot.y) <= 1)).toBe(false);
  });
});

import { deriveFlatSystems } from '../state/city';
describe('görev zinciri ve birikimli modül sistemleri', () => {
  it('modülde görev tamamlanınca hotspot sıradaki görevi açar; kilitli görev açılmaz', () => {
    gameStore.openTask('energy_002');
    expect(gameStore.get().decisionOpen).toBe(false);
    expect(gameStore.get().notice).toMatch(/Önce/);
    decide('energy', 'A');
    gameStore.closeDecision();
    gameStore.selectHotspot('energy');
    expect(gameStore.get().activeScenarioId).toBe('energy_002');
  });
  it('sonraki görev önceki görevin sistem etkisini silmez; geri alma yalnızca o görevi kaldırır', () => {
    decide('energy', 'A'); // 80 kW güneş
    gameStore.openTask('energy_002');
    gameStore.pickChoice('B'); gameStore.setReasoningText('Gece güneş yok çünkü depolama gerekir.'); gameStore.evaluate();
    let f = deriveFlatSystems(gameStore.get().applied);
    expect(f.solarKw).toBe(80);
    expect(f.storageKwh).toBe(200);
    expect(gameStore.get().energySystem.storageKwh).toBe(200);
    gameStore.retry();
    f = deriveFlatSystems(gameStore.get().applied);
    expect(f.solarKw).toBe(80);
    expect(f.storageKwh).toBe(0);
  });
  it('bir modüldeki karar başka modülün göstergesini değiştirir (onarım → atık yükü)', () => {
    const w0 = cityOf(gameStore.get()).indicators.wasteKg;
    decide('farm', 'B'); // karbon_001
    gameStore.openTask('carbon_002'); gameStore.pickChoice('B'); gameStore.setReasoningText('Tüm yaşam döngüsü çünkü kanıt gerekir.'); gameStore.evaluate();
    gameStore.openTask('carbon_003'); gameStore.pickChoice('B'); gameStore.setReasoningText('Bağımsız kaynak çünkü doğrulanabilir.'); gameStore.evaluate();
    gameStore.openTask('carbon_004'); gameStore.pickChoice('A'); gameStore.setReasoningText('Onarım atığı önler çünkü yeni üretim olmaz.'); gameStore.evaluate();
    expect(cityOf(gameStore.get()).indicators.wasteKg).toBeLessThan(w0);
  });
});
