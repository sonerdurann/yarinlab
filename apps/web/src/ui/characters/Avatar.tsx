import { HAIR_COLOR, OUTFIT, SKIN, type AvatarLook } from '../../state/profile';

export type Expression = 'neutral' | 'talk' | 'think' | 'joy' | 'worried';

/** Yüz ifadesi: göz ve ağız şekli (tüm karakterler ortak kullanır). */
function Face({ cx, cy, expr, ink = '#243447' }: { cx: number; cy: number; expr: Expression; ink?: string }) {
  const eyeY = cy - 2;
  return (
    <g className={`face face-${expr}`}>
      {expr === 'joy' ? (
        <>
          <path d={`M${cx - 11} ${eyeY} q4 -5 8 0`} stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d={`M${cx + 3} ${eyeY} q4 -5 8 0`} stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle className="eye" cx={cx - 7} cy={eyeY} r="2.6" fill={ink} />
          <circle className="eye" cx={cx + 7} cy={eyeY} r="2.6" fill={ink} />
        </>
      )}
      {expr === 'think' && <path d={`M${cx - 5} ${cy + 9} h9`} stroke={ink} strokeWidth="2.4" strokeLinecap="round" />}
      {expr === 'worried' && <path d={`M${cx - 6} ${cy + 11} q6 -5 12 0`} stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
      {expr === 'neutral' && <path d={`M${cx - 6} ${cy + 8} q6 5 12 0`} stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
      {expr === 'joy' && <path d={`M${cx - 8} ${cy + 6} q8 10 16 0 z`} fill={ink} />}
      {expr === 'talk' && <ellipse className="mouth-talk" cx={cx} cy={cy + 9} rx="4.5" ry="3.5" fill={ink} />}
      <circle cx={cx - 13} cy={cy + 5} r="3.2" fill="#ef795e" opacity="0.35" />
      <circle cx={cx + 13} cy={cy + 5} r="3.2" fill="#ef795e" opacity="0.35" />
    </g>
  );
}

function Hair({ style, color, cx, cy }: { style: number; color: string; cx: number; cy: number }) {
  switch (style) {
    case 0: return <path d={`M${cx - 22} ${cy - 2} q2 -24 22 -24 q20 0 22 24 q-6 -12 -22 -12 q-16 0 -22 12z`} fill={color} />;
    case 1: return <path d={`M${cx - 24} ${cy + 6} q-4 -32 24 -32 q28 0 24 32 q-4 -6 -6 -14 q-8 6 -18 -2 q-10 8 -20 2 q-2 8 -4 14z`} fill={color} />;
    case 2: return (
      <g fill={color}>
        <path d={`M${cx - 22} ${cy} q0 -26 22 -26 q22 0 22 26 q-8 -14 -22 -14 q-14 0 -22 14z`} />
        <path d={`M${cx + 18} ${cy - 14} q16 4 12 30 q-4 -10 -12 -14z`} />
      </g>
    );
    case 3: return <g fill={color}>{[-18, -9, 0, 9, 18].map((d, i) => <circle key={i} cx={cx + d} cy={cy - 18 + Math.abs(d) * 0.35} r="9" />)}<circle cx={cx - 22} cy={cy - 4} r="7" /><circle cx={cx + 22} cy={cy - 4} r="7" /></g>;
    default: return (
      <g fill={color}>
        <path d={`M${cx - 22} ${cy} q0 -26 22 -26 q22 0 22 26 q-8 -14 -22 -14 q-14 0 -22 14z`} />
        {[0, 1, 2].map((k) => <circle key={k} cx={cx - 22} cy={cy + 8 + k * 9} r="5" />)}
        {[0, 1, 2].map((k) => <circle key={`r${k}`} cx={cx + 22} cy={cy + 8 + k * 9} r="5" />)}
      </g>
    );
  }
}

/** Oyuncu avatarı (SVG): ten, saç, kıyafet ve aksesuar. `full` gövdeyi de çizer. */
export function AvatarFace({ look, size = 48, expr = 'neutral', full = false, title }: { look: AvatarLook; size?: number; expr?: Expression; full?: boolean; title?: string }) {
  const skin = SKIN[look.skin], hair = HAIR_COLOR[look.hairColor], outfit = OUTFIT[look.outfit];
  const h = full ? 150 : 100;
  return (
    <svg className={`avatar-svg${full ? ' full' : ''}`} viewBox={`0 0 100 ${h}`} width={size} height={(size * h) / 100} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {!full && <circle cx="50" cy="50" r="48" fill="#a5ddf2" />}
      <g className="avatar-body">
        <path d={`M18 ${full ? 128 : 104} q0 -32 32 -32 q32 0 32 32 z`} fill={outfit} />
        <path d={`M42 ${full ? 98 : 74} l8 9 l8 -9`} fill="#f5f8f4" opacity="0.9" />
        {full && (
          <>
            <rect x="30" y="126" width="15" height="20" rx="5" fill="#243447" />
            <rect x="55" y="126" width="15" height="20" rx="5" fill="#243447" />
            <rect x="12" y="98" width="12" height="28" rx="6" fill={outfit} />
            <rect x="76" y="98" width="12" height="28" rx="6" fill={outfit} />
            <circle cx="18" cy="128" r="6" fill={skin} /><circle cx="82" cy="128" r="6" fill={skin} />
          </>
        )}
      </g>
      <g className="avatar-head" transform={full ? 'translate(0 26)' : undefined}>
        <rect x="44" y="60" width="12" height="14" rx="4" fill={skin} />
        <circle cx="50" cy="44" r="23" fill={skin} />
        <Hair style={look.hair} color={hair} cx={50} cy={40} />
        <Face cx={50} cy={46} expr={expr} />
        {look.acc === 'glasses' && (
          <g stroke="#243447" strokeWidth="2.4" fill="#ffffff55">
            <circle cx="43" cy="44" r="6.5" /><circle cx="57" cy="44" r="6.5" /><path d="M49.5 44 h1" />
          </g>
        )}
        {look.acc === 'cap' && <g><path d="M27 32 q23 -26 46 0 z" fill="#ef795e" /><rect x="26" y="30" width="48" height="5" rx="2.5" fill="#d9644c" /><path d="M58 31 q16 0 20 6 h-20z" fill="#d9644c" /></g>}
        {look.acc === 'headband' && <rect x="27" y="28" width="46" height="6" rx="3" fill="#f6c453" />}
      </g>
    </svg>
  );
}

export type CastId = 'teacher' | 'farmer' | 'official' | 'scientist' | 'cook' | 'volunteer' | 'engineer' | 'marine' | 'resident' | 'detective';
/** Yan karakterler: aynı SVG sistemi, sabit görünüm + rol aksesuarı (kurgusal kişiler). */
export const CAST: Record<CastId, { name: string; look: AvatarLook; prop?: 'helmet' | 'chef' | 'straw' | 'coat' | 'tie' | 'captain' | 'lens' }> = {
  teacher: { name: 'Öğretmen Selin', look: { skin: 1, hair: 2, hairColor: 1, outfit: 4, acc: 'glasses' } },
  farmer: { name: 'Çiftçi Mehmet', look: { skin: 3, hair: 0, hairColor: 0, outfit: 2, acc: 'none' }, prop: 'straw' },
  official: { name: 'Başkan Defne', look: { skin: 2, hair: 1, hairColor: 0, outfit: 3, acc: 'none' }, prop: 'tie' },
  scientist: { name: 'Bilim insanı Arda', look: { skin: 4, hair: 3, hairColor: 0, outfit: 1, acc: 'glasses' }, prop: 'coat' },
  cook: { name: 'Aşçı Ayla', look: { skin: 1, hair: 2, hairColor: 2, outfit: 0, acc: 'none' }, prop: 'chef' },
  volunteer: { name: 'Gönüllü Zeynep', look: { skin: 2, hair: 4, hairColor: 1, outfit: 0, acc: 'headband' } },
  engineer: { name: 'Mühendis Ece', look: { skin: 2, hair: 2, hairColor: 2, outfit: 2, acc: 'none' }, prop: 'helmet' },
  marine: { name: 'Kaptan Deniz', look: { skin: 3, hair: 0, hairColor: 4, outfit: 1, acc: 'none' }, prop: 'captain' },
  resident: { name: 'Komşu Ali', look: { skin: 0, hair: 0, hairColor: 3, outfit: 5, acc: 'none' } },
  detective: { name: 'Dedektif Kerem', look: { skin: 1, hair: 1, hairColor: 0, outfit: 4, acc: 'none' }, prop: 'lens' },
};

/** Yan karakter: avatar + rol eşyası, ifade animasyonu (konuşma/düşünme/sevinç). */
export function Character({ id, size = 64, expr = 'neutral' }: { id: CastId; size?: number; expr?: Expression }) {
  const c = CAST[id];
  return (
    <span className={`character char-${id} expr-${expr}`} style={{ width: size, height: size }} role="img" aria-label={c.name}>
      <AvatarFace look={c.look} size={size} expr={expr} />
      <svg className="char-prop" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        {c.prop === 'helmet' && <path d="M26 34 q24 -30 48 0 v4 h-48z" fill="#f6c453" stroke="#c99a1e" strokeWidth="2" />}
        {c.prop === 'chef' && <g fill="#fff" stroke="#d9dfe3" strokeWidth="2"><rect x="32" y="20" width="36" height="14" rx="4" /><circle cx="38" cy="16" r="9" /><circle cx="50" cy="12" r="10" /><circle cx="62" cy="16" r="9" /></g>}
        {c.prop === 'straw' && <g><ellipse cx="50" cy="30" rx="34" ry="7" fill="#e6be8a" /><path d="M32 30 q18 -22 36 0z" fill="#d9a85f" /></g>}
        {c.prop === 'captain' && <g><path d="M28 32 q22 -22 44 0z" fill="#fff" /><rect x="27" y="29" width="46" height="6" rx="3" fill="#243447" /><circle cx="50" cy="24" r="3.5" fill="#f6c453" /></g>}
        {c.prop === 'tie' && <path d="M47 76 l3 -4 l3 4 l-3 18z" fill="#243447" />}
        {c.prop === 'coat' && <path d="M24 100 q0 -26 18 -28 l8 12 l8 -12 q18 2 18 28z" fill="#fff" opacity="0.9" />}
        {c.prop === 'lens' && <g><circle cx="80" cy="74" r="10" fill="#a5ddf280" stroke="#243447" strokeWidth="3" /><path d="M73 81 l-8 9" stroke="#243447" strokeWidth="4" strokeLinecap="round" /></g>}
      </svg>
    </span>
  );
}

/** 2040'tan gelen öğrenci Ada: turkuaz hologram, tarama çizgileri ve parıltı (prompt §4). */
export function Ada({ size = 120, expr = 'talk' }: { size?: number; expr?: Expression }) {
  const look: AvatarLook = { skin: 2, hair: 1, hairColor: 4, outfit: 1, acc: 'headband' };
  return (
    <span className={`ada-holo expr-${expr}`} style={{ width: size, height: size * 1.5 }} role="img" aria-label="Ada, 2040'tan gelen öğrenci (hologram)">
      <AvatarFace look={look} size={size} expr={expr} full />
      <span className="holo-scan" aria-hidden="true" />
      <span className="holo-base" aria-hidden="true" />
    </span>
  );
}
