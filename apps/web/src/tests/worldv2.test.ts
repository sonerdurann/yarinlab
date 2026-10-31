import { describe, expect, it } from 'vitest';
import { migrateSim } from '../state/migrate';
import { DEFAULT_PROFILE, sanitizeProfile } from '../state/profile';
import { zoneWarningsOf } from '../state/warnings';
import { computeCity, BASE_SYSTEMS, newSim } from '@yarinlab/shared';
import { gameStore } from '../state/gameStore';

describe('kayıt göçü (harita v1 -> v2)', () => {
  it('alan kimlikleri korunur; bilinmeyen tür/alan ve çift alan atılır; seviye sınırlanır; kampüs eklenir', () => {
    const old = { ...newSim(5), buildings: [
      { id: 'solar-en-1', type: 'solar', level: 3, slot: 'en-1', builtDay: 1 },
      { id: 'x', type: 'ufo', level: 1, slot: 'en-2', builtDay: 1 },
      { id: 'y', type: 'park', level: 1, slot: 'zz-9', builtDay: 1 },
      { id: 'z', type: 'wind', level: 9, slot: 'en-1', builtDay: 2 },
      { id: 'w', type: 'wetland', level: 7, slot: 'oc-1', builtDay: 2 },
    ] };
    const m = migrateSim(old);
    expect(m.buildings.map((b) => b.id).sort()).toEqual(['campus-campus', 'solar-en-1', 'w']);
    expect(m.buildings.find((b) => b.id === 'w')!.level).toBe(3);
  });
});

describe('profil ve avatar', () => {
  it('geçersiz değerler güvenli varsayılana döner; takma ad kısaltılır ve temizlenir', () => {
    expect(sanitizeProfile(null)).toEqual(DEFAULT_PROFILE);
    const p = sanitizeProfile({ avatar: { skin: 99, hair: 2, hairColor: -1, outfit: 3, acc: 'jetpack' }, nickname: '<b>ÇokUzunBirTakmaAdBuradaa</b>', chosen: true });
    expect(p.avatar).toEqual({ skin: 0, hair: 2, hairColor: 0, outfit: 3, acc: 'none' });
    expect(p.nickname).not.toMatch(/[<>]/);
    expect(p.nickname.length).toBeLessThanOrEqual(20);
  });
  it('yeni oyun şehri sıfırlar, kimliği korur; avatar seçilmediyse oluşturucu açılır', () => {
    gameStore.setProfile({ ...DEFAULT_PROFILE, nickname: 'Ece', chosen: true });
    gameStore.newGame();
    expect(gameStore.get().profile.nickname).toBe('Ece');
    expect(gameStore.get().creatorOpen).toBe(false);
    expect(gameStore.get().overlay).toBe('none');
    gameStore.setProfile(DEFAULT_PROFILE);
    gameStore.newGame();
    expect(gameStore.get().creatorOpen).toBe(true);
  });
});

describe('bölge uyarıları', () => {
  it('eşik aşılınca ilgili bölgede uyarı; başlangıçta kesinti yok', () => {
    const base = { budget: 10000, foodWasteKg: 30, energyScore: 70, waterScore: 80, wellbeing: 70 };
    const ind = computeCity(base, BASE_SYSTEMS, newSim(1), 0).indicators;
    const w = zoneWarningsOf(ind);
    expect(w.energy).toBeUndefined();
    expect(zoneWarningsOf({ ...ind, floodRisk: 80 }).city).toMatch(/Sel/);
    expect(zoneWarningsOf({ ...ind, coastalRisk: 60 }).ocean).toMatch(/Kıyı/);
  });
});
