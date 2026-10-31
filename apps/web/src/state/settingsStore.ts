import { useSyncExternalStore } from 'react';

/** Kılavuz §09 "ayarlar", §13 "metinler cihazda ölçeklenir, animasyon azaltma tercihi". */
export type MotionSetting = 'auto' | 'reduce' | 'full';
export type TextSize = 'normal' | 'large' | 'xlarge';

export const TEXT_PERCENT: Record<TextSize, number> = { normal: 100, large: 112.5, xlarge: 125 };
const KEY = 'yarinlab.settings.v1';

export type Graphics = 'high' | 'low';
export type SettingsState = { motion: MotionSetting; textSize: TextSize; sound: boolean; volume: number; graphics: Graphics; open: boolean };
type Persisted = Pick<SettingsState, 'motion' | 'textSize' | 'sound' | 'volume' | 'graphics'>;
const DEFAULTS: Persisted = { motion: 'auto', textSize: 'normal', sound: true, volume: 0.4, graphics: 'high' };

/** Otomatik: cihazın "hareketi azalt" tercihi geçerli; "azalt/tam" onu geçersiz kılar. */
export const resolveMotion = (setting: MotionSetting, systemReduced: boolean) => setting === 'reduce' || (setting === 'auto' && systemReduced);

const systemReduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const isMotion = (v: unknown): v is MotionSetting => v === 'auto' || v === 'reduce' || v === 'full';
const isSize = (v: unknown): v is TextSize => v === 'normal' || v === 'large' || v === 'xlarge';

/** Depolama kapalı/bozuksa sessizce varsayılana döner. */
function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Record<string, unknown>;
      return {
        motion: isMotion(p.motion) ? p.motion : 'auto',
        textSize: isSize(p.textSize) ? p.textSize : 'normal',
        sound: typeof p.sound === 'boolean' ? p.sound : DEFAULTS.sound,
        volume: typeof p.volume === 'number' && p.volume >= 0 && p.volume <= 1 ? p.volume : DEFAULTS.volume,
        graphics: p.graphics === 'low' ? 'low' : 'high',
      };
    }
  } catch {
    /* yoksay */
  }
  return { ...DEFAULTS };
}

let state: SettingsState = { ...load(), open: false };
const listeners = new Set<() => void>();

/** Hareket azaltma veya düşük grafik: sürekli ortam animasyonları kapanır. */
export const isReducedMotion = () => resolveMotion(state.motion, systemReduced()) || state.graphics === 'low';

function applyDom() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.motion = isReducedMotion() ? 'reduce' : 'full';
  document.documentElement.style.fontSize = `${TEXT_PERCENT[state.textSize]}%`;
}

const set = (patch: Partial<SettingsState>) => {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify({ motion: state.motion, textSize: state.textSize, sound: state.sound, volume: state.volume, graphics: state.graphics }));
  } catch {
    /* yoksay */
  }
  applyDom();
  listeners.forEach((l) => l());
};

applyDom();
if (typeof window !== 'undefined') {
  // Cihaz tercihi sonradan değişirse (otomatik modda) yeniden uygula.
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => set({}));
}

export const settingsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  open: () => set({ open: true }),
  close: () => set({ open: false }),
  setMotion: (motion: MotionSetting) => set({ motion }),
  setTextSize: (textSize: TextSize) => set({ textSize }),
  setSound: (sound: boolean) => set({ sound }),
  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setGraphics: (graphics: Graphics) => set({ graphics }),
  reset: () => set({ ...DEFAULTS }),
};

export function useSettings(): SettingsState {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
}
