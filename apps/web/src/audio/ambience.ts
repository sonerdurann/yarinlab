import { gameStore } from '../state/gameStore';
import { settingsStore } from '../state/settingsStore';

/**
 * Müzik ve ortam sesi (prompt §12): WebAudio ile kodla üretilir; harici dosya/lisans yok.
 * Müzik: sakin dört akorlu döngü (C–G–Am–F) + yumuşak arpej. Ortam: şehirde rüzgâr + ara sıra kuş cıvıltısı,
 * kıyıda dalga uğultusu. Her biri ayrı açılır ve ayrı ses düzeyindedir; ilk kullanıcı etkileşiminden sonra başlar.
 */
const CHORDS = [[261.6, 329.6, 392.0], [196.0, 246.9, 293.7], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6]];
let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null, ambGain: GainNode | null = null, noiseSrc: AudioBufferSourceNode | null = null, noiseFilter: BiquadFilterNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null, birdTimer: ReturnType<typeof setInterval> | null = null;
let bar = 0;

function ac() {
  const AC = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, out: AudioNode, f: number, t: number, dur: number, peak: number, type: OscillatorType) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.4, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + dur + 0.05);
}

function playBar() {
  const c = ctx, out = musicGain;
  if (!c || !out) return;
  const chord = CHORDS[bar % CHORDS.length], t = c.currentTime + 0.05;
  chord.forEach((f) => tone(c, out, f / 2, t, 2.3, 0.05, 'sine'));
  chord.concat(chord[0] * 2).forEach((f, k) => tone(c, out, f, t + k * 0.5, 0.45, 0.035, 'triangle'));
  bar++;
}

function noiseBuffer(c: AudioContext) {
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  return b;
}

function chirp() {
  const c = ctx, out = ambGain;
  if (!c || !out || gameStore.get().mapView === 'coast') return;
  const t = c.currentTime + 0.02, base = 2200 + Math.random() * 1400;
  for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) {
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(base, t + k * 0.12);
    o.frequency.exponentialRampToValueAtTime(base * 1.4, t + k * 0.12 + 0.07);
    g.gain.setValueAtTime(0.0001, t + k * 0.12);
    g.gain.exponentialRampToValueAtTime(0.05, t + k * 0.12 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.12 + 0.09);
    o.connect(g).connect(out);
    o.start(t + k * 0.12); o.stop(t + k * 0.12 + 0.1);
  }
}

/** Ayar ve harita değişiminde müzik/ortam durumunu uygular. */
export function applyAudio() {
  const st = settingsStore.get();
  const wantMusic = st.music && st.musicVolume > 0, wantAmb = st.ambient && st.ambientVolume > 0;
  if (!wantMusic && !wantAmb && !ctx) return;
  const c = ac();
  if (!c) return;
  musicGain ??= (() => { const g = c.createGain(); g.connect(c.destination); return g; })();
  ambGain ??= (() => { const g = c.createGain(); g.connect(c.destination); return g; })();
  musicGain.gain.setTargetAtTime(wantMusic ? st.musicVolume : 0, c.currentTime, 0.3);
  if (wantMusic && !musicTimer) { playBar(); musicTimer = setInterval(playBar, 2400); }
  if (!wantMusic && musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  const coast = gameStore.get().mapView === 'coast';
  ambGain.gain.setTargetAtTime(wantAmb ? st.ambientVolume * (coast ? 0.9 : 0.5) : 0, c.currentTime, 0.4);
  if (wantAmb && !noiseSrc) {
    noiseSrc = c.createBufferSource();
    noiseSrc.buffer = noiseBuffer(c);
    noiseSrc.loop = true;
    noiseFilter = c.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseSrc.connect(noiseFilter).connect(ambGain);
    noiseSrc.start();
    birdTimer = setInterval(() => { if (Math.random() < 0.45) chirp(); }, 3500);
  }
  if (noiseFilter) noiseFilter.frequency.setTargetAtTime(coast ? 900 : 380, c.currentTime, 0.5);
  if (!wantAmb && noiseSrc) { noiseSrc.stop(); noiseSrc = null; if (birdTimer) clearInterval(birdTimer); birdTimer = null; }
}

let started = false;
export function startAmbience() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // Tarayıcılar sesi ancak kullanıcı etkileşiminden sonra başlatır.
  const kick = () => { applyAudio(); window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
  window.addEventListener('pointerdown', kick);
  window.addEventListener('keydown', kick);
  settingsStore.subscribe(applyAudio);
  let view = gameStore.get().mapView;
  gameStore.subscribe(() => { const v = gameStore.get().mapView; if (v !== view) { view = v; applyAudio(); } });
}
