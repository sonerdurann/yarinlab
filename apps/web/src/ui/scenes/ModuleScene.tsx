import type { ModuleId } from '@yarinlab/shared';
import type { CastId } from '../characters/Avatar';

/** Modül → sahne karakteri (yan karakter sistemi). */
export const MODULE_CAST: Record<ModuleId, CastId> = {
  energy: 'engineer', carbon: 'detective', city: 'official', food: 'cook', ocean: 'marine', waste: 'volunteer', council: 'teacher',
};

type Props = { module: ModuleId; phase: 'brief' | 'chosen' | 'result'; tone?: 'good' | 'ok' | 'bad' };
const W = 560, H = 170;

/** Enerji kontrol merkezi: üretim → depolama → tüketim akış çizgileri, gün/gece paneli. */
function Energy({ phase, tone }: Props) {
  const strong = phase === 'result' && tone !== 'bad';
  return (
    <>
      <rect width={W} height={H} fill="#1f3a52" />
      <rect x="0" y="0" width={W / 2} height={H} fill="#f6c45322" />
      <circle cx="60" cy="40" r="18" fill="#f6c453" /><circle cx={W - 60} cy="40" r="14" fill="#e9eef2" /><circle cx={W - 54} cy="36" r="12" fill="#1f3a52" />
      <g transform="translate(40 90)"><rect width="90" height="50" rx="8" fill="#2f5f9e" /><path d="M0 16h90M0 33h90M30 0v50M60 0v50" stroke="#a5ddf2" strokeWidth="2" /><text x="45" y="68" textAnchor="middle" fill="#fff" fontSize="13">Üretim</text></g>
      <g transform="translate(235 85)"><rect width="90" height="56" rx="10" fill="#26b887" /><rect x="30" y="-8" width="30" height="10" rx="3" fill="#26b887" /><rect x="12" y="12" width={strong ? 66 : 30} height="32" rx="4" fill="#f6c453" /><text x="45" y="74" textAnchor="middle" fill="#fff" fontSize="13">Depolama</text></g>
      <g transform="translate(430 80)"><rect width="90" height="60" rx="6" fill="#f3ead7" /><path d="M0 0 l45 -26 l45 26z" fill="#ef795e" />{[0, 1, 2].map((k) => <rect key={k} x={10 + k * 27} y="18" width="16" height="16" fill={strong || k < 1 ? '#f6c453' : '#9aa5ad'} />)}<text x="45" y="80" textAnchor="middle" fill="#fff" fontSize="13">Tüketim</text></g>
      <path className="flow" d="M130 115 H235" stroke="#f6c453" strokeWidth={strong ? 7 : 4} />
      <path className="flow" d="M325 113 H430" stroke="#f6c453" strokeWidth={strong ? 7 : 3} strokeDasharray="10 8" />
    </>
  );
}

/** Karbon dedektif masası: büyüteç, ürün kartları ve yaşam döngüsü akışı. */
function Carbon({ phase }: Props) {
  const steps = ['Üretim', 'Taşıma', 'Kullanım', 'Atık'];
  return (
    <>
      <rect width={W} height={H} fill="#5b3d2a" />
      <rect x="10" y="10" width={W - 20} height={H - 20} rx="14" fill="#8a6247" />
      {steps.map((s, k) => (
        <g key={s} transform={`translate(${30 + k * 130} 52) rotate(${(k % 2 ? 3 : -3)})`}>
          <rect width="100" height="64" rx="8" fill="#fffaf0" stroke="#e8dcc4" />
          <text x="50" y="38" textAnchor="middle" fontSize="15" fontWeight="700" fill="#243447">{s}</text>
          {k < 3 && <path d="M104 32 h22" stroke="#f6c453" strokeWidth="4" className="flow" />}
        </g>
      ))}
      <g transform={`translate(${phase === 'brief' ? 380 : 120} 20)`} className="lens-move">
        <circle cx="0" cy="0" r="24" fill="#a5ddf266" stroke="#243447" strokeWidth="5" />
        <path d="M17 17 l22 22" stroke="#243447" strokeWidth="8" strokeLinecap="round" />
      </g>
    </>
  );
}

/** KrizKenti mahalle haritası: sel ve ısı katmanı. */
function City({ phase, tone }: Props) {
  const risk = phase === 'result' ? (tone === 'good' ? 0.15 : tone === 'ok' ? 0.4 : 0.7) : 0.6;
  return (
    <>
      <rect width={W} height={H} fill="#d9eef0" />
      {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={20 + k * 90} y={30 + (k % 2) * 20} width="62" height={80 - (k % 3) * 14} rx="6" fill={['#f3ead7', '#f2d6c5', '#e9e2d0'][k % 3]} stroke="#24344722" />)}
      <rect x="0" y={H - 40} width={W} height="40" fill="#9aa5ad" />
      <rect className="water-rise" x="0" y={H - 40 * risk - 10} width={W} height={40 * risk + 10} fill="#41c9d1" opacity="0.65" />
      <rect x="0" y="0" width={W} height={H} fill="#ef795e" opacity={risk * 0.25} />
      {phase === 'result' && tone !== 'bad' && [80, 260, 440].map((x) => <g key={x}><rect x={x - 2} y="100" width="4" height="22" fill="#9a6b47" /><circle cx={x} cy="96" r="14" fill="#26b887" /></g>)}
    </>
  );
}

/** Son Tabak kantini: tepsiler, porsiyon, stok rafı, memnuniyet yüzleri. */
function Food({ phase, tone }: Props) {
  const waste = phase === 'result' ? (tone === 'good' ? 1 : tone === 'ok' ? 3 : 5) : 5;
  return (
    <>
      <rect width={W} height={H} fill="#fff6e0" />
      <rect x="0" y={H - 50} width={W} height="50" fill="#f6c453" />
      <g transform="translate(20 20)"><rect width="110" height="100" rx="6" fill="#9a6b47" />{[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={20 + c * 35} cy={22 + r * 30} r="10" fill={['#ef795e', '#4dbe78', '#f6c453'][(r + c) % 3]} />))}</g>
      {[0, 1, 2, 3].map((k) => (
        <g key={k} transform={`translate(${170 + k * 95} ${H - 70})`}>
          <rect width="80" height="34" rx="8" fill="#fff" stroke="#e8dcc4" />
          <circle cx="24" cy="17" r="10" fill="#f3ead7" /><rect x="44" y="9" width="24" height="16" rx="4" fill="#4dbe78" />
          {k < waste - 1 && <circle cx="24" cy="17" r="6" fill="#c79a5b" />}
        </g>
      ))}
      {[0, 1, 2].map((k) => <text key={k} x={210 + k * 110} y="50" fontSize="30" aria-hidden="true">{phase === 'result' && tone !== 'bad' ? '😋' : k === 1 ? '🙂' : '😐'}</text>)}
    </>
  );
}

/** Mavi Nöbet katmanlı deniz kesiti: canlılar, kirlilik, habitat. */
function Ocean({ phase, tone }: Props) {
  const litter = phase === 'result' ? (tone === 'good' ? 1 : tone === 'ok' ? 3 : 6) : 6;
  return (
    <>
      <rect width={W} height="40" fill="#a5ddf2" />
      <rect y="40" width={W} height="45" fill="#41c9d1" />
      <rect y="85" width={W} height="55" fill="#1d6f86" />
      <rect y="140" width={W} height="30" fill="#e6c98f" />
      <path className="wave" d={`M0 40 ${Array.from({ length: 15 }, (_, k) => `q ${20} ${k % 2 ? 6 : -6} 40 0`).join(' ')}`} stroke="#fff" strokeWidth="3" fill="none" />
      {Array.from({ length: litter }, (_, k) => <rect key={k} x={40 + k * 80} y={55 + (k % 3) * 25} width="14" height="8" rx="2" fill={k % 2 ? '#fff' : '#ef795e'} opacity="0.9" />)}
      {[60, 180, 300, 420, 520].map((x, k) => <path key={x} d={`M${x} 145 q-6 -22 2 -40 M${x + 8} 145 q6 -18 -2 -34`} stroke="#4dbe78" strokeWidth="4" fill="none" opacity={phase === 'result' && tone !== 'bad' ? 1 : k % 2 ? 0.35 : 0.8} />)}
      <g className="swim"><ellipse cx="200" cy="110" rx="26" ry="14" fill="#176b58" /><ellipse cx="200" cy="110" rx="16" ry="9" fill="#26b887" /><circle cx="230" cy="110" r="7" fill="#4dbe78" /></g>
      <g className="swim slow"><path d="M380 70 q14 -10 26 0 q-12 10 -26 0z M406 70 l10 -7 v14z" fill="#f6c453" /></g>
    </>
  );
}

/** Döngü Ustaları: bant ve tamir tezgâhı. */
function Waste({ phase, tone }: Props) {
  const fixed = phase === 'result' && tone !== 'bad';
  return (
    <>
      <rect width={W} height={H} fill="#e8f3ee" />
      <rect x="20" y="100" width="330" height="24" rx="12" fill="#243447" />
      {[0, 1, 2, 3, 4, 5].map((k) => <circle key={k} cx={40 + k * 58} cy="112" r="8" fill="#9aa5ad" />)}
      <g className="belt">{['🥫', '📦', '🧴', '📰'].map((e, k) => <text key={k} x={40 + k * 80} y="94" fontSize="28" aria-hidden="true">{e}</text>)}</g>
      {[['#4dbe78', 'Kâğıt'], ['#41c9d1', 'Plastik'], ['#f6c453', 'Metal']].map(([c, l], k) => (
        <g key={l} transform={`translate(${380 + k * 58} 70)`}><rect width="48" height="62" rx="6" fill={c} /><text x="24" y="80" textAnchor="middle" fontSize="11" fill="#243447">{l}</text></g>
      ))}
      <g transform="translate(40 20)"><rect width="120" height="40" rx="6" fill="#9a6b47" /><text x="16" y="30" fontSize="24" aria-hidden="true">🔧</text><text x="70" y="30" fontSize="24" aria-hidden="true">{fixed ? '📻✨' : '📻'}</text></g>
    </>
  );
}

/** Gelecek Meclisi: salon, şehir hologramı ve paydaşlar. */
function Council({ phase }: Props) {
  return (
    <>
      <rect width={W} height={H} fill="#2b2f6b" />
      <path d={`M0 ${H} Q ${W / 2} 60 ${W} ${H}`} fill="#3b3bae" />
      <g className="holo" transform="translate(220 20)">
        <ellipse cx="60" cy="90" rx="70" ry="16" fill="#41c9d155" />
        {[0, 1, 2, 3].map((k) => <rect key={k} x={20 + k * 22} y={40 - (k % 2) * 18} width="16" height={50 + (k % 2) * 18} fill="#41c9d1" opacity="0.6" />)}
        <circle cx="96" cy="26" r="10" fill="#4dbe78" opacity="0.7" />
      </g>
      {['🧑‍🌾', '👩‍🔬', '🧑‍💼', '👵', '🧒', '🧑‍🏫'].map((e, k) => <text key={k} x={30 + k * 90} y={H - 18} fontSize="30" aria-hidden="true" className={phase === 'result' ? 'cheer' : ''}>{e}</text>)}
    </>
  );
}

const SCENES: Record<ModuleId, (p: Props) => React.ReactElement> = { energy: Energy, carbon: Carbon, city: City, food: Food, ocean: Ocean, waste: Waste, council: Council };
const TITLE: Record<ModuleId, string> = {
  energy: 'Enerji kontrol merkezi', carbon: 'Karbon dedektif masası', city: 'KrizKenti mahalle haritası', food: 'Son Tabak kantini',
  ocean: 'Mavi Nöbet deniz kesiti', waste: 'Döngü Ustaları atölyesi', council: 'Gelecek Meclisi salonu',
};

/** Modül sahnesi (prompt §7): görev ekranının üstünde, seçim ve sonuca göre değişen animasyonlu SVG. */
export function ModuleScene(p: Props) {
  const S = SCENES[p.module];
  return (
    <svg className={`module-scene scene-${p.module} phase-${p.phase}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${TITLE[p.module]}${p.phase === 'result' ? ' (karardan sonra)' : ''}`}>
      <S {...p} />
    </svg>
  );
}
