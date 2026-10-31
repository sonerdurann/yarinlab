import { useGameState } from '../../state/gameStore';

const fmt = (n: number) => n.toLocaleString('tr-TR');

/** Üst durum çubuğu (kılavuz §09: dönem / enerji / atık / bütçe). */
export function TopBar() {
  const { world } = useGameState();
  return (
    <header className="topbar">
      <strong>YARINLAB / 2040</strong>
      <span className="topbar-stats" aria-label="Dünya durumu özeti">
        <span>Enerji {world.energyScore}</span>
        <span>Atık {world.foodWasteKg}</span>
        <span>Bütçe {fmt(world.budget)}</span>
      </span>
    </header>
  );
}

const meters: { key: 'energyScore' | 'waterScore' | 'wellbeing'; label: string }[] = [
  { key: 'energyScore', label: 'Enerji' },
  { key: 'waterScore', label: 'Su' },
  { key: 'wellbeing', label: 'Refah' },
];

/** Sağ sonuç paneli: ortak dünya durumu. */
export function WorldStatus() {
  const { world } = useGameState();
  return (
    <aside className="panel world-status" aria-label="Dünya durumu">
      <h2>Dünya durumu</h2>
      <p className="stat">
        <span>Gıda atığı</span>
        <strong>{world.foodWasteKg} kg/gün</strong>
      </p>
      {meters.map((m) => (
        <div key={m.key} className="meter">
          <div className="meter-label">
            <span>{m.label}</span>
            <strong>{world[m.key]}/100</strong>
          </div>
          <div className="meter-track" role="progressbar" aria-valuenow={world[m.key]} aria-valuemin={0} aria-valuemax={100} aria-label={m.label}>
            <div className="meter-fill" style={{ width: `${world[m.key]}%` }} />
          </div>
        </div>
      ))}
      <p className="stat">
        <span>Bütçe (oyun puanı)</span>
        <strong>{fmt(world.budget)}</strong>
      </p>
    </aside>
  );
}
