import { gameStore, type GameState } from '../state/gameStore';
import { settingsStore } from '../state/settingsStore';

/**
 * Kod ile üretilen kısa ses efektleri (WebAudio; harici ses dosyası/lisans yok). Ses kapalıysa veya tarayıcı
 * desteklemiyorsa sessizce hiçbir şey yapmaz. AudioContext ilk kullanıcı etkileşiminden sonra açılır.
 */
export type Sfx = 'decision' | 'build' | 'day' | 'badge' | 'warn';
const NOTES: Record<Sfx, [number, number, OscillatorType][]> = {
  decision: [[523, 0.08, 'sine'], [659, 0.12, 'sine']],
  build: [[392, 0.07, 'triangle'], [523, 0.07, 'triangle'], [784, 0.14, 'triangle']],
  day: [[330, 0.18, 'sine'], [440, 0.22, 'sine']],
  badge: [[659, 0.08, 'square'], [784, 0.08, 'square'], [1047, 0.18, 'square']],
  warn: [[220, 0.16, 'sawtooth'], [196, 0.2, 'sawtooth']],
};
let ctx: AudioContext | null = null;

export function play(kind: Sfx) {
  const st = settingsStore.get();
  if (!st.sound || st.volume <= 0) return;
  try {
    const AC = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    let t = ctx.currentTime;
    for (const [freq, dur, type] of NOTES[kind]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, st.volume * 0.25), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  } catch {
    /* ses yok */
  }
}

/** Store değişimlerinden ses olayı türetir (oyun mantığına dokunmaz). */
export function sfxFor(prev: GameState, next: GameState): Sfx | null {
  if (next.badges.length > prev.badges.length) return 'badge';
  if (next.sim.day > prev.sim.day) return next.sim.log.slice(prev.sim.log.length).some((e) => e.kind === 'event' && /kesinti|baskını|dalgası/i.test(e.message)) ? 'warn' : 'day';
  const lv = (s: GameState) => s.sim.buildings.reduce((a, b) => a + b.level, 0);
  if (lv(next) > lv(prev)) return 'build';
  if (next.scores.length > prev.scores.length) return 'decision';
  return null;
}

let started = false;
export function startSfx() {
  if (started) return;
  started = true;
  let prev = gameStore.get();
  gameStore.subscribe(() => {
    const next = gameStore.get();
    const k = sfxFor(prev, next);
    prev = next;
    if (k) play(k);
  });
}
