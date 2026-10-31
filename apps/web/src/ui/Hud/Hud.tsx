import { useGameState } from '../../state/gameStore';
import { teacherStore } from '../../state/teacherStore';
import { useCountUp } from '../useCountUp';
import { Logo } from '../Logo';
import { settingsStore } from '../../state/settingsStore';
import { gameStore as gs } from '../../state/gameStore';
import { RoadmapButton } from '../Roadmap/RoadmapPanel';

const fmt = (n: number) => n.toLocaleString('tr-TR');

/** Animasyonlu sayı: ekranda ilerler, ekran okuyucu yalnızca son değeri okur. */
function Num({ value }: { value: number }) {
  const v = useCountUp(value);
  return (
    <>
      <span aria-hidden="true">{fmt(v)}</span>
      <span className="sr-only">{fmt(value)}</span>
    </>
  );
}

/** Üst durum çubuğu (kılavuz §09: dönem / enerji / atık / bütçe). */
import { authStore, useAuth } from '../../state/authStore';

import { TimeChip } from '../City/CityPanels';
import { syncLabel, useSync } from '../../state/saveSync';

export function TopBar() {
  const { world } = useGameState();
  const { user } = useAuth();
  const sync = useSync();
  return (
    <header className="topbar">
      <span className="brand">
        <Logo />
        <strong>YARINLAB / 2040</strong>
      </span>
      <TimeChip />
      <span className="topbar-stats" aria-label="Dünya durumu özeti">
        <span>Bütçe <Num value={world.budget} /></span>
        <span role="status" className="sync">{syncLabel(sync.status)}</span>
      </span>
      <span className="topbar-actions">
        <button onClick={() => gs.openOverlay('menu')} aria-label="Ana menü">☰</button>
        <button onClick={() => gs.openOverlay('help')} aria-label="Yardım">?</button>
        <button onClick={authStore.open}>{user ? user.displayName : 'Giriş'}</button>
        <button onClick={teacherStore.openTeacher}>Öğretmen</button>
        <button onClick={teacherStore.openSources}>Kaynaklar</button>
        <RoadmapButton />
        <button onClick={settingsStore.open} aria-label="Ayarlar">⚙</button>
      </span>
    </header>
  );
}
