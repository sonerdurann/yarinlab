import { useSyncExternalStore } from 'react';

/** Kılavuz §09 "ayarlar", §13 "metinler cihazda ölçeklenir, animasyon azaltma tercihi". */
export type MotionSetting = 'auto' | 'reduce' | 'full';
export type TextSize = 'normal' | 'large' | 'xlarge';

export const TEXT_PERCENT: Record<TextSize, number> = { normal: 100, large: 112.5, xlarge: 125 };
const KEY = 'yarinlab.settings.v1';

export type SettingsState = { motion: MotionSetting; textSize: TextSize; open: boolean };

/** Otomatik: cihazın "hareketi azalt" tercihi geçerli; "azalt/tam" onu geçersiz kılar. */
export const resolveMotion = (setting: MotionSetting, systemReduced: boolean) => setting === 'reduce' || (setting === 'auto' && systemReduced);

const systemReduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const isMotion = (v: unknown): v is MotionSetting => v === 'auto' || v === 'reduce' || v === 'full';
const isSize = (v: unknown): v is TextSize => v === 'normal' || v === 'large' || v === 'xlarge';

/** Depolama kapalı/bozuksa sessizce varsayılana döner. */
function load(): Pick<SettingsState, 'motion' | 'textSize'> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as { motion?: unknown; textSize?: unknown };
      return { motion: isMotion(p.motion) ? p.motion : 'auto', textSize: isSize(p.textSize) ? p.textSize : 'normal' };
    }
  } catch {
    /* yoksay */
  }
  return { motion: 'auto', textSize: 'normal' };
}

let state: SettingsState = { ...load(), open: false };
const listeners = new Set<() => void>();

export const isReducedMotion = () => resolveMotion(state.motion, systemReduced());

function applyDom() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.motion = isReducedMotion() ? 'reduce' : 'full';
  document.documentElement.style.fontSize = `${TEXT_PERCENT[state.textSize]}%`;
}

const set = (patch: Partial<SettingsState>) => {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify({ motion: state.motion, textSize: state.textSize }));
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
  reset: () => set({ motion: 'auto', textSize: 'normal' }),
};

export function useSettings(): SettingsState {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
}
