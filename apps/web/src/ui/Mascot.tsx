export type Mood = 'happy' | 'think' | 'wow' | 'worried' | 'wave';

/**
 * “Yarı”: 2040'tan gelen, başında filiz olan küçük robot. Tamamen SVG (ekip yapımı, harici görsel yok).
 * Duygusu: mutlu, düşünceli, şaşkın-heyecanlı, endişeli, el sallayan.
 */
export function Mascot({ mood = 'happy', size = 96, className = '', title }: { mood?: Mood; size?: number; className?: string; title?: string }) {
  const eyes = {
    happy: <><path d="M37 50 q5 -6 10 0" /><path d="M63 50 q5 -6 10 0" /></>,
    wave: <><path d="M37 50 q5 -6 10 0" /><path d="M63 50 q5 -6 10 0" /></>,
    think: <><circle cx="44" cy="46" r="4.5" fill="#12263a" stroke="none" /><circle cx="70" cy="46" r="4.5" fill="#12263a" stroke="none" /></>,
    wow: <><circle cx="42" cy="49" r="6" fill="#12263a" stroke="none" /><circle cx="68" cy="49" r="6" fill="#12263a" stroke="none" /><circle cx="44" cy="47" r="2" fill="#fff" stroke="none" /><circle cx="70" cy="47" r="2" fill="#fff" stroke="none" /></>,
    worried: <><circle cx="42" cy="51" r="4.5" fill="#12263a" stroke="none" /><circle cx="68" cy="51" r="4.5" fill="#12263a" stroke="none" /><path d="M35 42 l12 3" /><path d="M75 42 l-12 3" /></>,
  }[mood];
  const mouth = {
    happy: <path d="M47 62 q8 8 16 0" />, wave: <path d="M45 61 q10 11 20 0" fill="#ff8a7a" />,
    think: <path d="M49 64 h10" />, wow: <ellipse cx="55" cy="64" rx="5" ry="6" fill="#ff8a7a" />, worried: <path d="M47 66 q8 -6 16 0" />,
  }[mood];
  return (
    <svg className={`mascot mascot-${mood} ${className}`} width={size} height={size} viewBox="0 0 110 120" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {/* filiz */}
      <path d="M55 22 V10" stroke="#1d7a52" strokeWidth="4" strokeLinecap="round" />
      <path className="leaf leaf-l" d="M55 12 C44 4 36 8 38 14 C44 18 52 16 55 12 Z" fill="#4cc38a" />
      <path className="leaf leaf-r" d="M55 10 C64 0 74 2 73 9 C67 14 60 13 55 10 Z" fill="#7ad9a6" />
      {/* gövde */}
      <rect x="32" y="84" width="46" height="28" rx="12" fill="#4aa8d8" />
      <circle cx="55" cy="98" r="6" fill="#ffd166" />
      {mood === 'wave'
        ? <path className="arm-wave" d="M78 92 q14 -8 12 -24" stroke="#4aa8d8" strokeWidth="8" strokeLinecap="round" fill="none" />
        : <path d="M78 94 q10 4 10 12" stroke="#4aa8d8" strokeWidth="8" strokeLinecap="round" fill="none" />}
      <path d="M32 94 q-10 4 -10 12" stroke="#4aa8d8" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* baş */}
      <rect x="18" y="22" width="74" height="64" rx="26" fill="#f7f5ef" stroke="#12263a" strokeWidth="3" />
      <rect x="27" y="32" width="56" height="44" rx="18" fill="#dff4ec" />
      <circle cx="32" cy="64" r="5" fill="#ffb3a7" opacity=".8" />
      <circle cx="78" cy="64" r="5" fill="#ffb3a7" opacity=".8" />
      <g stroke="#12263a" strokeWidth="3.5" strokeLinecap="round" fill="none">{eyes}{mouth}</g>
      {mood === 'wow' && <g fill="#ffd166"><path d="M8 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" /><path d="M98 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" /></g>}
      {mood === 'think' && <g fill="#bfeadb"><circle cx="96" cy="26" r="4" /><circle cx="102" cy="14" r="6" /></g>}
    </svg>
  );
}

/** Maskot + konuşma balonu. */
export function Speech({ mood = 'happy', children, size = 72, name = 'Yarı' }: { mood?: Mood; children: React.ReactNode; size?: number; name?: string }) {
  return (
    <div className="speech">
      <Mascot mood={mood} size={size} />
      <div className="bubble"><strong className="bubble-name">{name}</strong>{children}</div>
    </div>
  );
}
