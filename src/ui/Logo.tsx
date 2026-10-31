/** YarınLab işareti: izometrik elmas zemin, yaprak ve enerji güneşi (palet: gece mavisi, iklim yeşili, enerji altını). */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="YarınLab logosu">
      <rect width="64" height="64" rx="14" fill="#12263a" />
      <path d="M32 30 L54 41 L32 52 L10 41 Z" fill="#bfeadb" />
      <path d="M32 52 L54 41 L54 45 L32 56 Z" fill="#8cc9b3" />
      <path d="M32 52 L10 41 L10 45 L32 56 Z" fill="#a6dac7" />
      <path d="M32 12 C44 16 46 30 32 40 C18 30 20 16 32 12 Z" fill="#2e9e6b" />
      <path d="M32 18 L32 38" stroke="#bfeadb" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="47" cy="17" r="6" fill="#e8b73a" />
    </svg>
  );
}
