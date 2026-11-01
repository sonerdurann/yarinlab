import { useId, useRef, useState } from 'react';
import type { ModuleId } from '@yarinlab/shared';

/** Karşılaştırılan bir göstergenin bu taraftaki değeri. */
export type DioramaMetric = { key: string; label: string; unit: string; value: number; max: number; lowerIsBetter?: boolean };
export type DioramaParams = { label: string; module: ModuleId; score: number; metrics: DioramaMetric[] };

const W = 520, H = 300;
const cx = W / 2, top = 96, hw = 210, hh = 105;
/** İzometrik zemin noktası: u,v ∈ [0,1] */
const P = (u: number, v: number, z = 0) => ({ x: cx + (u - v) * hw, y: top + (u + v) * hh - z });
const pts = (...p: { x: number; y: number }[]) => p.map((q) => `${q.x},${q.y}`).join(' ');
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((c, i) => Math.round(c + (pb[i] - c) * clamp01(t)).toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Göstergenin “iyilik” düzeyi 0..1. Mutlak değer (0..max) ile iki gelecek arasındaki göreli konum birlikte
 * kullanılır; böylece küçük ama gerçek bir fark da görselde seçilir. Sayılar her zaman yanında yazılıdır.
 */
export function goodness(m: DioramaMetric, other?: DioramaMetric) {
  const abs = clamp01(m.value / Math.max(1, m.max));
  const a = m.lowerIsBetter ? 1 - abs : abs;
  if (!other || other.value === m.value) return a;
  const better = m.lowerIsBetter ? m.value < other.value : m.value > other.value;
  return clamp01(0.35 * a + (better ? 0.75 : 0.12));
}

function Box({ u, v, w, d, h, wall, roof, lit = 0, dark = false, panels = 0 }: { u: number; v: number; w: number; d: number; h: number; wall: string; roof: string; lit?: number; dark?: boolean; panels?: number }) {
  const a = P(u, v + d), b = P(u + w, v + d), c = P(u + w, v), t = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - h });
  const win = [];
  for (let k = 0; k < 4; k++) {
    const p0 = P(u + (w * (k + 0.2)) / 4, v + d, h * 0.65), p1 = P(u + (w * (k + 0.8)) / 4, v + d, h * 0.65);
    win.push(<polygon key={k} points={pts(p0, p1, { x: p1.x, y: p1.y + h * 0.3 }, { x: p0.x, y: p0.y + h * 0.3 })} fill={dark ? '#3d4e63' : k < lit ? '#f6c453' : '#9ee3ea'} />);
  }
  const pan = [];
  for (let k = 0; k < panels; k++) {
    const f0 = k / panels, f1 = (k + 0.85) / panels;
    pan.push(<polygon key={`p${k}`} points={pts(P(u + w * f0, v + 0.02, h), P(u + w * f1, v + 0.02, h), P(u + w * f1, v + d * 0.8, h), P(u + w * f0, v + d * 0.8, h))} fill="#2f5f9e" stroke="#a5ddf2" strokeWidth="1" />);
  }
  return (
    <g>
      <polygon points={pts(a, b, t(b), t(a))} fill={wall} />
      <polygon points={pts(b, c, t(c), t(b))} fill={wall} style={{ filter: 'brightness(0.78)' }} />
      <polygon points={pts(t(P(u, v)), t(c), t(b), t(a))} fill={roof} />
      {win}
      {pan}
    </g>
  );
}

function Tree({ u, v, s = 1, dry = false }: { u: number; v: number; s?: number; dry?: boolean }) {
  const p = P(u, v);
  return (
    <g>
      <ellipse cx={p.x + 4} cy={p.y + 2} rx={12 * s} ry={4 * s} fill="#243447" opacity="0.15" />
      <rect x={p.x - 2} y={p.y - 18 * s} width="4" height={18 * s} fill="#9a6b47" />
      <circle cx={p.x} cy={p.y - 24 * s} r={12 * s} fill={dry ? '#b5a36a' : '#26b887'} />
      <circle cx={p.x - 4 * s} cy={p.y - 28 * s} r={6 * s} fill={dry ? '#cbbd86' : '#6fd39c'} />
    </g>
  );
}

const Person = ({ u, v, happy }: { u: number; v: number; happy: boolean }) => {
  const p = P(u, v);
  return (
    <g>
      <rect x={p.x - 4} y={p.y - 16} width="8" height="12" rx="3" fill={happy ? '#41c9d1' : '#8a95a0'} />
      <circle cx={p.x} cy={p.y - 21} r="5" fill="#e0ac7e" />
      <path d={happy ? `M${p.x - 2.5} ${p.y - 20} q2.5 2.5 5 0` : `M${p.x - 2.5} ${p.y - 18.5} q2.5 -2.5 5 0`} stroke="#243447" strokeWidth="1.2" fill="none" />
    </g>
  );
};

/** Aynı şehrin göstergelerden çizilen izometrik dioraması; modülün kendi göstergesi öne çıkar. */
export function FutureDiorama({ p, other }: { p: DioramaParams; other?: DioramaParams }) {
  const g = (key: string) => {
    const m = p.metrics.find((x) => x.key === key);
    return m ? goodness(m, other?.metrics.find((x) => x.key === key)) : undefined;
  };
  const all = p.metrics.map((m) => goodness(m, other?.metrics.find((x) => x.key === m.key)));
  const overall = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0.5;
  const gEnergy = g('energyScore'), gOutage = g('outage'), gFood = g('foodWasteKg'), gWater = g('waterScore'), gWell = g('wellbeing');
  const gFlood = g('flood'), gCoast = g('coast'), gCollect = g('collection'), gClaim = g('claim'), gCouncil = g('council');
  const id = `sky${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const sky = [mix('#8c9499', '#7cc8ea', overall), mix('#d6d0c2', '#eaf8ff', overall)];
  const ground = mix('#b9b27e', '#6cc272', gWater ?? overall);
  const trees = Math.round(2 + overall * 7);
  const treeSpots: [number, number][] = [[0.1, 0.2], [0.12, 0.6], [0.3, 0.88], [0.55, 0.92], [0.88, 0.12], [0.92, 0.45], [0.2, 0.08], [0.72, 0.8], [0.45, 0.1]];
  const smoke = Math.round((1 - overall) * 4);
  const panels = gEnergy !== undefined ? Math.round(gEnergy * 5) : 0;
  const outageBad = gOutage !== undefined && gOutage < 0.45;
  const lit = Math.round((gEnergy ?? gWell ?? overall) * 4);
  const happy = (gWell ?? overall) >= 0.5;
  const people = Math.round(2 + (gWell ?? overall) * 4);
  const flood = gFlood !== undefined ? 1 - gFlood : 0;
  const litter = Math.round((1 - (gFood ?? gCollect ?? 1)) * 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diorama" role="img" aria-label={`${p.label}: ${p.metrics.map((m) => `${m.label} ${m.value} ${m.unit}`).join(', ')}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
      {overall >= 0.5 && <circle cx={W - 60} cy={44} r={24} fill="#f6c453" opacity={0.5 + overall / 2} />}
      {Array.from({ length: smoke }, (_, k) => <ellipse key={`c${k}`} cx={70 + k * 110} cy={40 + (k % 2) * 14} rx={46} ry={16} fill="#6f7780" opacity={0.35} />)}
      {/* deniz şeridi (kıyı görevinde) */}
      {gCoast !== undefined && <polygon points={pts(P(1, -0.2, -6), P(1.25, -0.2, -6), P(1.25, 1.1, -6), P(1, 1.1, -6))} fill={mix('#6f8f86', '#41c9d1', gCoast)} />}
      <polygon points={pts(P(0, 0, -10), P(1, 0, -10), P(1, 1, -10), P(0, 1, -10))} fill="#a77d52" />
      <polygon points={pts(P(0, 0), P(1, 0), P(1, 1), P(0, 1))} fill={ground} />
      <polygon points={pts(P(0.45, 0), P(0.55, 0), P(0.55, 1), P(0.45, 1))} fill="#9aa5ad" />
      {/* sel suyu (şehir): kötü tarafta yükselir */}
      {flood > 0.1 && <polygon points={pts(P(1 - flood * 0.75, 0.3), P(1, 0.3), P(1, 1), P(1 - flood * 0.75, 1))} fill="#41c9d1" opacity="0.75" />}
      {/* okul: çatı GES, ışıklar; kesintide karanlık */}
      <Box u={0.6} v={0.18} w={0.3} d={0.22} h={46} wall="#f3ead7" roof="#ef795e" lit={lit} dark={outageBad} panels={panels} />
      <Box u={0.12} v={0.3} w={0.22} d={0.18} h={32} wall="#d9eef0" roof="#176b58" lit={Math.max(0, lit - 1)} dark={outageBad} />
      {/* enerji: rüzgâr türbini ve batarya */}
      {gEnergy !== undefined && gEnergy >= 0.55 && (() => { const q = P(0.18, 0.75); return <g><rect x={q.x - 2} y={q.y - 70} width="4" height="70" fill="#e9eef2" /><g transform={`translate(${q.x} ${q.y - 70})`}><path d="M0 0 L-4 -30 L4 -30Z M0 0 L24 14 L20 20Z M0 0 L-24 14 L-20 20Z" fill="#fff" stroke="#c7d0d6" /></g></g>; })()}
      {gOutage !== undefined && gOutage >= 0.55 && (() => { const q = P(0.4, 0.6); return <g><rect x={q.x - 14} y={q.y - 18} width="28" height="18" rx="3" fill="#26b887" /><rect x={q.x - 6} y={q.y - 22} width="12" height="5" fill="#26b887" /><rect x={q.x - 9} y={q.y - 14} width="18" height="9" fill="#f6c453" /></g>; })()}
      {outageBad && (() => { const q = P(0.75, 0.3, 80); return <g><rect x={q.x - 44} y={q.y - 16} width="88" height="26" rx="13" fill="#ef795e" /><text x={q.x} y={q.y + 2} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">⚡ kesinti</text></g>; })()}
      {/* kantin / atık: çöp yığını ve geri dönüşüm kutuları */}
      {Array.from({ length: litter }, (_, k) => { const q = P(0.22 + ((k * 0.37) % 0.55), 0.6 + ((k * 0.23) % 0.35)); return <ellipse key={`l${k}`} cx={q.x} cy={q.y - 3} rx="6" ry="4" fill={['#5b6670', '#ef795e', '#f5f8f4'][k % 3]} />; })}
      {(gFood !== undefined || gCollect !== undefined) && (gFood ?? gCollect)! >= 0.55 && ['#4dbe78', '#41c9d1', '#f6c453'].map((c, k) => { const q = P(0.3 + k * 0.06, 0.52); return <rect key={`b${k}`} x={q.x - 6} y={q.y - 16} width="12" height="16" rx="2" fill={c} stroke="#243447" strokeWidth="1" />; })}
      {/* karbon: fabrika dumanı */}
      {gClaim !== undefined && (() => { const q = P(0.15, 0.1); const puffs = Math.round((1 - gClaim) * 4); return <g><rect x={q.x - 16} y={q.y - 40} width="32" height="40" fill="#8a95a0" /><rect x={q.x + 6} y={q.y - 62} width="8" height="24" fill="#6f7780" />{Array.from({ length: puffs }, (_, k) => <circle key={k} cx={q.x + 10 + k * 9} cy={q.y - 70 - k * 12} r={8 + k * 3} fill="#5b6670" opacity={0.6 - k * 0.1} />)}{gClaim >= 0.6 && <text x={q.x} y={q.y - 46} textAnchor="middle" fontSize="16">✔️</text>}</g>; })()}
      {/* kıyı: denizde çöp veya balık/kaplumbağa */}
      {gCoast !== undefined && Array.from({ length: 6 }, (_, k) => { const q = P(1.1, 0.05 + k * 0.17, -6); const clean = k / 6 < gCoast; return clean ? <text key={`s${k}`} x={q.x} y={q.y} fontSize="14" textAnchor="middle">{k % 2 ? '🐟' : '🐢'}</text> : <rect key={`s${k}`} x={q.x - 5} y={q.y - 6} width="10" height="6" rx="1" fill={k % 2 ? '#ef795e' : '#f5f8f4'} />; })}
      {/* meclis / refah: insanlar */}
      {Array.from({ length: gCouncil !== undefined ? Math.round(2 + gCouncil * 6) : people }, (_, k) => <Person key={`h${k}`} u={0.3 + (k % 4) * 0.07} v={0.78 + Math.floor(k / 4) * 0.08} happy={(gCouncil ?? gWell ?? overall) >= 0.5} />)}
      {treeSpots.slice(0, trees).map(([u, v], k) => <Tree key={`t${k}`} u={u} v={v} s={0.8 + (k % 3) * 0.15} dry={(gWater ?? overall) < 0.35} />)}
      <text x={24} y={40} fontSize="26" aria-hidden="true">{happy ? '😊' : '😟'}</text>
    </svg>
  );
}

const fmt = (n: number) => n.toLocaleString('tr-TR');

/** Bir taraftaki gösterge çipleri: daha iyi olan ✓ ile işaretlenir (renk tek başına anlam taşımaz). */
function Chips({ side, other, align }: { side: DioramaParams; other: DioramaParams; align: 'left' | 'right' }) {
  return (
    <div className={`fs-chips fs-chips-${align}`}>
      {side.metrics.slice(0, 4).map((m) => {
        const o = other.metrics.find((x) => x.key === m.key);
        const better = o && o.value !== m.value && (m.lowerIsBetter ? m.value < o.value : m.value > o.value);
        return <span key={m.key} className={better ? 'chip better' : 'chip'}>{m.label}: <b>{fmt(m.value)}</b>{m.unit.startsWith('/') ? m.unit : ` ${m.unit}`}{better ? ' ✓' : ''}</span>;
      })}
    </div>
  );
}

/**
 * İki gelecek: aynı şehrin iki dioraması üst üste; ortadaki çizgi sürüklenir (fare, dokunma) veya ok tuşlarıyla
 * kaydırılır (prompt §8). Sol taraf A, sağ taraf B. Görsel fark vurgulanır; kesin değerler çiplerde yazılıdır.
 */
export function FutureSlider({ a, b }: { a: DioramaParams; b: DioramaParams }) {
  const [split, setSplit] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setSplit(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="future-slider">
      <div
        className="fs-stage" ref={box}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); drag(e.clientX); }}
        onPointerMove={(e) => { if (e.buttons) drag(e.clientX); }}
      >
        <FutureDiorama p={a} other={b} />
        <div className="fs-b" style={{ clipPath: `inset(0 0 0 ${split}%)` }}><FutureDiorama p={b} other={a} /></div>
        <div className="fs-line" style={{ left: `${split}%` }} aria-hidden="true"><span>⟷</span></div>
        <span className="fs-tag fs-tag-a">A · {a.label}</span>
        <span className="fs-tag fs-tag-b">B · {b.label}</span>
      </div>
      <div className="fs-compare">
        <Chips side={a} other={b} align="left" />
        <Chips side={b} other={a} align="right" />
      </div>
      <label className="fs-range">
        <span className="sr-only">Karşılaştırma çizgisi: sola A, sağa B</span>
        <input type="range" min={0} max={100} step={1} value={Math.round(split)} onChange={(e) => setSplit(Number(e.target.value))}
          aria-valuetext={`Senaryo A %${Math.round(split)}, Senaryo B %${100 - Math.round(split)}`} />
      </label>
      <p className="hint">Görselde iki gelecek arasındaki fark vurgulanır; kesin değerler yukarıdaki çiplerde ve aşağıdaki göstergelerde.</p>
    </div>
  );
}
