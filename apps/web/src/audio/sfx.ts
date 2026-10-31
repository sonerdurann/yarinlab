import { gameStore, type GameState } from '../state/gameStore';
import { settingsStore } from '../state/settingsStore';

/**
 * Kod ile üretilen kısa ses efektleri (WebAudio; harici ses dosyası/lisans yok). Ses kapalıysa veya tarayıcı
 * desteklemiyorsa sessizce hiçbir şey yapmaz. AudioContext ilk kullanıcı etkileşiminden sonra açılır.
 */
export type Sfx = 'decision' | 'build' | 'day' | 'badge' | 'warn' | 'menu' | 'select' | 'upgrade' | 'complete';
const NOTES: Record<Sfx, [number, number, OscillatorType][]> = {
  decision: [[523, 0.08, 'sine'], [659, 0.12, 'sine']],
  build: [[392, 0.07, 'triangle'], [523, 0.07, 'triangle'], [784, 0.14, 'triangle']],
  day: [[330, 0.18, 'sine'], [440, 0.22, 'sine']],
  badge: [[659, 0.08, 'square'], [784, 0.08, 'square'], [1047, 0.18, 'square']],
  warn: [[220, 0.16, 'sawtooth'], [196, 0.2, 'sawtooth']],
  menu: [[660, 0.05, 'sine'], [880, 0.07, 'sine']],
  select: [[740, 0.06, 'triangle']],
  upgrade: [[392, 0.06, 'triangle'], [494, 0.06, 'triangle'], [587, 0.06, 'triangle'], [784, 0.16, 'triangle']],
  complete: [[523, 0.08, 'sine'], [659, 0.08, 'sine'], [784, 0.08, 'sine'], [1047, 0.2, 'sine']],
};
let ctx: AudioContext | null = null;

/** Kenney Interface Sounds (CC0) dosyaları; scripts/fetch-kenney-extras.sh ile eklenir. Yoksa kodla üretilen ses çalar. */
export const KENNEY_SOUND: Record<Sfx, string> = {
  decision: 'confirmation_002', build: 'maximize_006', day: 'pluck_002', badge: 'confirmation_004', warn: 'error_004',
  menu: 'click_002', select: 'select_002', upgrade: 'maximize_008', complete: 'confirmation_001',
};
const buffers = new Map<Sfx, AudioBuffer | null>();
async function loadBuffer(kind: Sfx): Promise<AudioBuffer | null> {
  if (buffers.has(kind)) return buffers.get(kind)!;
  let buf: AudioBuffer | null = null;
  try {
    const res = await fetch(`/assets/kenney/sounds/${KENNEY_SOUND[kind]}.ogg`);
    const type = res.headers.get('content-type') ?? '';
    if (res.ok && !type.includes('text/html')) buf = await ctx!.decodeAudioData(await res.arrayBuffer());
  } catch { /* dosya yok veya çözülemedi */ }
  buffers.set(kind, buf);
  return buf;
}

export const sfx = (kind: Sfx) => play(kind);

export function play(kind: Sfx) {
  const st = settingsStore.get();
  if (!st.sound || st.volume <= 0) return;
  try {
    const AC0 = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
    if (!AC0) return;
    ctx ??= new AC0();
    if (ctx.state === 'suspended') void ctx.resume();
    void loadBuffer(kind).then((buf) => {
      if (buf && ctx) {
        const src = ctx.createBufferSource(), g = ctx.createGain();
        g.gain.value = st.volume;
        src.buffer = buf;
        src.connect(g).connect(ctx.destination);
        src.start();
      } else synth(kind, st.volume);
    });
  } catch {
    /* ses yok */
  }
}

function synth(kind: Sfx, volume: number) {
  const st = { volume };
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
  if (next.sim.buildings.length > prev.sim.buildings.length) return 'build';
  const lv = (s: GameState) => s.sim.buildings.reduce((a, b) => a + b.level, 0);
  if (lv(next) > lv(prev)) return 'upgrade';
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
