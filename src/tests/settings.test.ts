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
