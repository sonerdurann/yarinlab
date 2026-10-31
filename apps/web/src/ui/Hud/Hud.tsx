import { useGameState } from '../../state/gameStore';
import { levelForXp, xpForLevel } from '@yarinlab/shared';
import { cityOf } from '../../state/city';
import { teacherStore } from '../../state/teacherStore';
import { useCountUp } from '../useCountUp';
import { Logo } from '../Logo';
import { settingsStore } from '../../state/settingsStore';
import { gameStore as gs } from '../../state/gameStore';

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
  const st = useGameState();
  const { world } = st;
  const city = cityOf(st);
  const { user } = useAuth();
  const sync = useSync();
  const lvl = levelForXp(st.xp), lo = xpForLevel(lvl), hi = xpForLevel(lvl + 1);
  return (
    <header className="topbar">
      <span className="brand">
        <Logo />
        <strong>YarınLab<span className="slogan-mini">Geleceği sen tasarla</span></strong>
      </span>
      <TimeChip />
      <span className="pills" aria-label="Kaynaklar">
        <span className="pill" title="Kasa (oyun puanı, gerçek para değil)"><span className="ico" aria-hidden="true">💰</span><span className="sr-only">Bütçe </span><Num value={world.budget} /></span>
        <span className="pill" title="Enerji göstergesi (0-100)"><span className="ico" aria-hidden="true">⚡</span><span className="sr-only">Enerji </span><Num value={world.energyScore} /></span>
        <span className="pill" title="Okulun günlük çöpü (kg, varsayım)"><span className="ico" aria-hidden="true">🗑️</span><span className="sr-only">Atık </span><Num value={Math.round(city.indicators.wasteKg)} /> kg</span>
        <span className="pill hide-sm" title="Mutluluk"><span className="ico" aria-hidden="true">😊</span><span className="sr-only">Refah </span><Num value={world.wellbeing} /></span>
        <span className="pill level" title={`${st.xp} XP`}><span className="ico" aria-hidden="true">⭐</span>Seviye {lvl}
          <span className="xpbar" aria-hidden="true"><span style={{ width: `${Math.round((100 * (st.xp - lo)) / Math.max(1, hi - lo))}%` }} /></span>
        </span>
        <span role="status" className="sync hide-sm">{syncLabel(sync.status)}</span>
      </span>
      <span className="topbar-actions">
        <button onClick={() => gs.openOverlay('menu')} aria-label="Ana menü" title="Ana menü">☰</button>
        <button onClick={() => gs.openOverlay('help')} aria-label="Yardım" title="Yardım">?</button>
        <button onClick={authStore.open}>{user ? `👤 ${user.displayName}` : 'Giriş'}</button>
        <button onClick={teacherStore.openTeacher}>Öğretmen</button>
        <button onClick={settingsStore.open} aria-label="Ayarlar" title="Ayarlar">⚙</button>
      </span>
    </header>
  );
}
