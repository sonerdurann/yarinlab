import { describe, expect, it } from 'vitest';
import { isReducedMotion, resolveMotion, settingsStore, TEXT_PERCENT } from '../state/settingsStore';

describe('ayarlar', () => {
  it('hareket: otomatik cihaz tercihini izler; azalt/tam onu geçersiz kılar', () => {
    expect(resolveMotion('auto', true)).toBe(true);
    expect(resolveMotion('auto', false)).toBe(false);
    expect(resolveMotion('reduce', false)).toBe(true);
    expect(resolveMotion('full', true)).toBe(false);
  });

  it('yazı boyutu oranları ve ayar değişimi (depolama olmasa da çalışır)', () => {
    expect(TEXT_PERCENT).toEqual({ normal: 100, large: 112.5, xlarge: 125 });
    settingsStore.setMotion('reduce');
    expect(isReducedMotion()).toBe(true);
    settingsStore.setMotion('full');
    expect(isReducedMotion()).toBe(false);
    settingsStore.setTextSize('xlarge');
    expect(settingsStore.get().textSize).toBe('xlarge');
    settingsStore.reset();
    expect(settingsStore.get()).toMatchObject({ motion: 'auto', textSize: 'normal' });
  });

  it('pencere aç/kapat', () => {
    settingsStore.open();
    expect(settingsStore.get().open).toBe(true);
    settingsStore.close();
    expect(settingsStore.get().open).toBe(false);
  });
});

import { sfxFor } from '../audio/sfx';
import { gameStore } from '../state/gameStore';
describe('ses ve grafik ayarları', () => {
  it('ses seviyesi 0..1 aralığında; düşük grafik ortam animasyonlarını kapatır', async () => {
    const { settingsStore, isReducedMotion } = await import('../state/settingsStore');
    settingsStore.setVolume(3);
    expect(settingsStore.get().volume).toBe(1);
    settingsStore.setMotion('full');
    settingsStore.setGraphics('low');
    expect(isReducedMotion()).toBe(true);
    settingsStore.reset();
    expect(settingsStore.get()).toMatchObject({ sound: true, graphics: 'high', volume: 0.4 });
  });
  it('olay sesleri store değişiminden türetilir', () => {
    gameStore.resetSession();
    const a = gameStore.get();
    gameStore.endDay();
    expect(['day', 'warn']).toContain(sfxFor(a, gameStore.get()));
    const b = gameStore.get();
    gameStore.build('solar', 'en-1');
    expect(sfxFor(b, gameStore.get())).toBe('build');
  });
});
