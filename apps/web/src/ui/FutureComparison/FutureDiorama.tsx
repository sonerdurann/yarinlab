import { useId, useRef, useState } from 'react';
import type { Resources } from '../../state/types';

export type DioramaParams = { score: number; after: Resources; flood?: number; label: string };

const W = 520, H = 300;
const cx = W / 2, top = 96, hw = 210, hh = 105;
/** İzometrik zemin noktası: u,v ∈ [0,1] */
const P = (u: number, v: number, z = 0) => ({ x: cx + (u - v) * hw, y: top + (u + v) * hh - z });
const pts = (...p: { x: number; y: number }[]) => p.map((q) => `${q.x},${q.y}`).join(' ');

function Box({ u, v, w, d, h, wall, roof, lit = 0, panels = 0 }: { u: number; v: number; w: number; d: number; h: number; wall: string; roof: string; lit?: number; panels?: number }) {
  const a = P(u, v + d), b = P(u + w, v + d), c = P(u + w, v), t = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - h });
  const win = [];
  for (let k = 0; k < 4; k++) {
    const p0 = P(u + (w * (k + 0.2)) / 4, v + d, h * 0.65), p1 = P(u + (w * (k + 0.8)) / 4, v + d, h * 0.65);
    win.push(<polygon key={k} points={pts(p0, p1, { x: p1.x, y: p1.y + h * 0.3 }, { x: p0.x, y: p0.y + h * 0.3 })} fill={k < lit ? '#f6c453' : '#9ee3ea'} opacity={k < lit ? 1 : 0.8} />);
  }
  const pan = [];
  for (let k = 0; k < panels; k++) {
    const p0 = P(u + 0.02 + (w * k) / Math.max(1, panels), v + 0.02, h), p1 = P(u + (w * (k + 0.85)) / Math.max(1, panels), v + 0.02, h);
    const p2 = P(u + (w * (k + 0.85)) / Math.max(1, panels), v + d * 0.7, h), p3 = P(u + 0.02 + (w * k) / Math.max(1, panels), v + d * 0.7, h);
    pan.push(<polygon key={`p${k}`} points={pts(p0, p1, p2, p3)} fill="#2f5f9e" stroke="#a5ddf2" strokeWidth="1" />);
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

function Tree({ u, v, s = 1 }: { u: number; v: number; s?: number }) {
  const p = P(u, v);
  return (
    <g>
      <ellipse cx={p.x + 4} cy={p.y + 2} rx={12 * s} ry={4 * s} fill="#243447" opacity="0.15" />
      <rect x={p.x - 2} y={p.y - 18 * s} width="4" height={18 * s} fill="#9a6b47" />
      <circle cx={p.x} cy={p.y - 24 * s} r={12 * s} fill="#26b887" />
      <circle cx={p.x - 4 * s} cy={p.y - 28 * s} r={6 * s} fill="#6fd39c" />
    </g>
  );
}

/** Aynı şehrin göstergelerden çizilen izometrik dioraması: ağaç, panel, su seviyesi, duman, çöp, ışıklar. */
export function FutureDiorama({ p }: { p: DioramaParams }) {
  const { score, after } = p;
  const trees = Math.max(1, Math.min(9, Math.round(score / 11)));
  const panels = Math.max(0, Math.min(4, Math.round((after.energyScore - 40) / 12)));
  const smoke = Math.max(0, Math.min(4, Math.round((65 - score) / 9)));
  const litter = Math.max(0, Math.min(10, Math.round(after.foodWasteKg / 6)));
  const lit = Math.max(0, Math.min(4, Math.round(after.wellbeing / 22)));
  const water = Math.max(0, Math.min(1, (p.flood ?? 0) / 100));
  const sky = score >= 70 ? ['#8fd3f0', '#e9f8ff'] : score >= 50 ? ['#a9cfe0', '#eef4f2'] : ['#9aa3a8', '#d9d4c7'];
  const treeSpots: [number, number][] = [[0.1, 0.2], [0.12, 0.6], [0.3, 0.88], [0.55, 0.9], [0.85, 0.15], [0.9, 0.45], [0.2, 0.08], [0.7, 0.75], [0.48, 0.12]];
  // SVG kimliği boşluk/Türkçe karakter içermemeli (aksi hâlde degrade bulunamaz, gök siyah çizilir)
  const id = `sky${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diorama" role="img" aria-label={`${p.label}: ${trees} ağaç, ${panels} güneş paneli, ${smoke ? 'duman var' : 'hava temiz'}, ${litter} çöp`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
      {score >= 60 && <circle cx={W - 60} cy={44} r={24} fill="#f6c453" opacity="0.9" />}
      <polygon points={pts(P(0, 0, -10), P(1, 0, -10), P(1, 1, -10), P(0, 1, -10))} fill="#a77d52" />
      <polygon points={pts(P(0, 0), P(1, 0), P(1, 1), P(0, 1))} fill={score >= 50 ? '#7cc576' : '#b4b98a'} />
      {/* yol */}
      <polygon points={pts(P(0.45, 0), P(0.55, 0), P(0.55, 1), P(0.45, 1))} fill="#9aa5ad" />
      {/* sel suyu: kıyı tarafından yükselir */}
      {water > 0.05 && <polygon points={pts(P(1 - water * 0.6, 0.55), P(1, 0.55), P(1, 1), P(1 - water * 0.6, 1))} fill="#41c9d1" opacity="0.7" />}
      <Box u={0.6} v={0.22} w={0.3} d={0.22} h={46} wall="#f3ead7" roof="#ef795e" lit={lit} panels={panels} />
      <Box u={0.12} v={0.3} w={0.22} d={0.18} h={32} wall="#d9eef0" roof="#176b58" lit={Math.max(0, lit - 1)} />
      <Box u={0.62} v={0.6} w={0.18} d={0.16} h={26} wall="#f2d6c5" roof="#243447" lit={Math.max(0, lit - 2)} />
      {treeSpots.slice(0, trees).map(([u, v], k) => <Tree key={k} u={u} v={v} s={0.8 + (k % 3) * 0.15} />)}
      {Array.from({ length: litter }, (_, k) => { const q = P(0.2 + ((k * 0.37) % 0.6), 0.55 + ((k * 0.23) % 0.4)); return <rect key={k} x={q.x} y={q.y - 3} width="6" height="4" rx="1" fill={k % 2 ? '#ef795e' : '#fff'} />; })}
      {Array.from({ length: smoke }, (_, k) => { const q = P(0.75, 0.3, 60 + k * 18); return <circle key={k} cx={q.x + k * 10} cy={q.y} r={10 + k * 4} fill="#7d868c" opacity={0.55 - k * 0.08} />; })}
      {lit >= 3 && <text x={24} y={40} fontSize="26" aria-hidden="true">😊</text>}
      {smoke >= 3 && <text x={24} y={40} fontSize="26" aria-hidden="true">😷</text>}
    </svg>
  );
}

/**
 * İki gelecek: aynı şehrin iki dioraması üst üste; ortadaki çizgi sürüklenir (fare, dokunma) veya ok tuşlarıyla
 * kaydırılır (prompt §8). Sol taraf A, sağ taraf B.
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
        <FutureDiorama p={a} />
        <div className="fs-b" style={{ clipPath: `inset(0 0 0 ${split}%)` }}><FutureDiorama p={b} /></div>
        <div className="fs-line" style={{ left: `${split}%` }} aria-hidden="true"><span>⟷</span></div>
        <span className="fs-tag fs-tag-a">A · {a.label}</span>
        <span className="fs-tag fs-tag-b">B · {b.label}</span>
      </div>
      <label className="fs-range">
        <span className="sr-only">Karşılaştırma çizgisi: sola A, sağa B</span>
        <input type="range" min={0} max={100} step={1} value={Math.round(split)} onChange={(e) => setSplit(Number(e.target.value))}
          aria-valuetext={`Senaryo A %${Math.round(split)}, Senaryo B %${100 - Math.round(split)}`} />
      </label>
    </div>
  );
}
