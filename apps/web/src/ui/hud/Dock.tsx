import { useEffect, useRef } from 'react';
import { ASSESSMENTS, LEARNING_OUTCOMES, SCIENCE_SOURCES } from '@yarinlab/shared';
import { gameStore, useGameState, type Drawer } from '../../state/gameStore';
import { teacherStore } from '../../state/teacherStore';
import { TaskPanel } from '../TaskPanel/TaskPanel';
import { CityIndicators } from '../City/CityPanels';

type Item = { id: string; ico: string; label: string; drawer?: Drawer; run?: () => void };

/** Alt dock: Harita, İnşa, Görevler, Araştırmalar, Başarılar, Şehir raporu (prompt §5). */
export function Dock({ onMap }: { onMap: () => void }) {
  const s = useGameState();
  const items: Item[] = [
    { id: 'map', ico: '🗺️', label: 'Harita', run: () => { gameStore.setDrawer('none'); onMap(); } },
    { id: 'build', ico: '🏗️', label: 'İnşa', run: () => gameStore.openOverlay('build') },
    { id: 'tasks', ico: '📋', label: 'Görevler', drawer: 'tasks' },
    { id: 'research', ico: '🔬', label: 'Araştırmalar', drawer: 'research' },
    { id: 'badges', ico: '🏅', label: 'Başarılar', run: () => gameStore.openOverlay('progress') },
    { id: 'report', ico: '📊', label: 'Şehir raporu', drawer: 'report' },
  ];
  return (
    <nav className="hud-dock" aria-label="Oyun menüsü">
      {items.map((it) => {
        const on = it.drawer ? s.drawer === it.drawer : it.id === 'map' && s.drawer === 'none';
        return (
          <button key={it.id} className={on ? 'on' : ''} aria-pressed={it.drawer ? on : undefined}
            onClick={() => (it.drawer ? gameStore.setDrawer(s.drawer === it.drawer ? 'none' : it.drawer) : it.run?.())}>
            <span className="dock-ico" aria-hidden="true">{it.ico}</span>
            <span className="dock-label">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Araştırmalar: ön/son testler, ödevler, öğrenme kazanımları ve bilimsel kaynaklar. */
function Research() {
  const s = useGameState();
  const pre = new Set(s.assessments.filter((a) => a.kind === 'PRE').map((a) => a.moduleId));
  const post = new Set(s.assessments.filter((a) => a.kind === 'POST').map((a) => a.moduleId));
  const mods = Object.keys(ASSESSMENTS);
  return (
    <section className="panel research" aria-label="Araştırmalar">
      <h2><span aria-hidden="true">🔬</span> Araştırmalar</h2>
      <div className="research-grid">
        <button onClick={() => gameStore.openOverlay('assessment')}><b>📝 Ön / son testler</b><span className="hint">Ön test {pre.size}/{mods.length} · son test {post.size}/{mods.length}</span></button>
        <button onClick={() => gameStore.openOverlay('tasks')}><b>📋 Ödevlerim</b><span className="hint">Öğretmenin atadığı görevler</span></button>
        <button onClick={teacherStore.openSources}><b>📚 Bilgi kartları ve kaynaklar</b><span className="hint">{SCIENCE_SOURCES.length} bilimsel kaynak</span></button>
        <button onClick={() => gameStore.openOverlay('help')}><b>❓ Nasıl oynanır</b><span className="hint">Rehber ve kısayollar</span></button>
      </div>
      <h3>Öğrenme kazanımları</h3>
      <ul className="outcome-list">
        {Object.entries(LEARNING_OUTCOMES).slice(0, 14).map(([id, text]) => <li key={id}><b>{id}</b> {text}</li>)}
      </ul>
    </section>
  );
}

/** Dock çekmecesi: oyun alanını tamamen kapatmaz, katlanabilir; Esc kapatır. */
export function DockDrawer({ onPick }: { onPick: (id: string) => void }) {
  const s = useGameState();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (s.drawer === 'none') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role=dialog]')) gameStore.setDrawer('none'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s.drawer]);
  if (s.drawer === 'none') return null;
  return (
    <div ref={ref} className={`hud-drawer drawer-${s.drawer}`}>
      <button className="icon-btn drawer-close" aria-label="Çekmeceyi kapat" onClick={() => gameStore.setDrawer('none')}>✕</button>
      {s.drawer === 'tasks' && <TaskPanel onPick={onPick} />}
      {s.drawer === 'report' && <CityIndicators />}
      {s.drawer === 'research' && <Research />}
    </div>
  );
}
