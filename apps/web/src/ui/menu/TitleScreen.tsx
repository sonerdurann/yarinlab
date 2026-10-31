import { useEffect, useRef, useState } from 'react';
import { CAMPUS_TYPE, levelForXp } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { cityOf, completedTaskIds } from '../../state/city';
import { authStore, useAuth } from '../../state/authStore';
import { RoadmapButton } from '../Roadmap/RoadmapPanel';
import { AvatarFace } from '../characters/Avatar';
import { Logo } from '../Logo';
import { sfx } from '../../audio/sfx';

type Props = { onSettings: () => void; onTeacher: () => void; onSources: () => void };

/** Dünyam: şehrin genel görünümü ve istatistikleri. */
function MyWorld({ onBack }: { onBack: () => void }) {
  const s = useGameState();
  const c = cityOf(s).indicators;
  const campus = s.sim.buildings.find((b) => b.type === CAMPUS_TYPE)?.level ?? 1;
  const stats: [string, string, string][] = [
    ['📅', 'Zaman', `${c.year} · ${c.seasonTr} · Gün ${s.sim.day + 1}`],
    ['🏫', 'Kampüs', `Seviye ${campus}/4`],
    ['🏗️', 'Yapılar', `${s.sim.buildings.length - 1}`],
    ['🎯', 'Görevler', `${completedTaskIds(s).length}/35`],
    ['⭐', 'Oyuncu seviyesi', `${levelForXp(s.xp)}`],
    ['🛡️', 'Dayanıklılık', `${c.resilience}/100`],
    ['🌿', 'Ekosistem', `${c.ecosystem}/100`],
    ['😊', 'Refah', `${c.wellbeing}/100`],
  ];
  return (
    <div className="my-world">
      <h2>🌍 Dünyam</h2>
      <ul className="world-stats">{stats.map(([i, l, v]) => <li key={l}><span aria-hidden="true">{i}</span><b>{v}</b><small>{l}</small></li>)}</ul>
      <p className="hint">Sayılar oyun simülasyonudur; gerçek ölçüm değildir.</p>
      <button onClick={onBack}>← Menüye dön</button>
    </div>
  );
}

/** Başlık ekranı: canlı şehir arka planda yavaş kamera turunda; ana menü klavyeyle gezilebilir (prompt §6). */
export function TitleScreen({ onSettings, onTeacher, onSources }: Props) {
  const s = useGameState();
  const { user } = useAuth();
  const [view, setView] = useState<'menu' | 'world'>('menu');
  const ref = useRef<HTMLDivElement>(null);
  const open = s.overlay === 'menu';
  const has = gameStore.hasSave();
  useEffect(() => {
    if (!open) return;
    setView('menu');
    const t = setTimeout(() => ref.current?.querySelector<HTMLButtonElement>('.title-menu button')?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);
  if (!open) return null;
  const go = (fn: () => void) => () => { sfx('menu'); fn(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && has) return gameStore.closeOverlay();
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>('.title-menu button') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    e.preventDefault();
  };
  const startNew = () => {
    if (has && !confirm('Mevcut şehir silinip yeni oyun başlasın mı?')) return;
    gameStore.newGame();
  };
  return (
    <div className="title-screen" role="dialog" aria-modal="true" aria-labelledby="title-heading" ref={ref} onKeyDown={onKey}>
      <div className="title-sky" aria-hidden="true"><span className="sun" /><span className="cloud c1" /><span className="cloud c2" /></div>
      <div className="title-card">
        <div className="title-brand">
          <Logo />
          <div>
            <h1 id="title-heading">YARINLAB</h1>
            <p className="title-sub">Geleceği Sen Tasarla</p>
          </div>
        </div>
        <p className="title-slogan">Bugünün kararları, yarının dünyasını şekillendirir.</p>
        {view === 'world' ? <MyWorld onBack={() => setView('menu')} /> : (
          <>
            {s.profile.chosen && (
              <div className="title-player">
                <AvatarFace look={s.profile.avatar} size={52} expr="joy" />
                <span>{user ? <>Tekrar hoş geldin <b>{user.displayName}</b>!</> : <>Merhaba <b>{s.profile.nickname || 'yarının mimarı'}</b>!</>}</span>
              </div>
            )}
            <nav className="title-menu" aria-label="Ana menü">
              {has && <button className="primary big" onClick={go(gameStore.closeOverlay)}>▶ Oyuna devam et <small>Gün {s.sim.day + 1}</small></button>}
              <button className={has ? 'big' : 'primary big'} onClick={go(startNew)}>🌱 Yeni oyuna başla</button>
              <button onClick={go(() => setView('world'))}>🌍 Dünyam</button>
              <button onClick={go(() => gameStore.openOverlay('progress'))}>🏅 Başarılarım</button>
              <button onClick={go(onTeacher)}>🍎 Öğretmen girişi</button>
              <button onClick={go(onSettings)}>⚙️ Ayarlar</button>
            </nav>
            <div className="title-secondary">
              <button className="link" onClick={authStore.open}>{user ? '👤 Hesabım' : '🔑 Giriş / sınıfa katıl'}</button>
              <button className="link" onClick={go(gameStore.openCreator)}>🎨 Karakterim</button>
              <button className="link" onClick={() => gameStore.openOverlay('help')}>❓ Yardım</button>
              <button className="link" onClick={onSources}>📚 Kaynaklar ve lisanslar</button>
              <button className="link" onClick={() => { gameStore.closeOverlay(); gameStore.closeIntro(); gameStore.openTask('food_001'); }}>🎬 90 sn tanıtım</button>
              <RoadmapButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
