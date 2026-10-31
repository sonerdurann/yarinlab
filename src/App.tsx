import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { createGame } from './game/createGame';
import { hotspots } from './game/tiles/hotspots';
import { gameStore, taskSteps, useGameState } from './state/gameStore';
import { TopBar, WorldStatus } from './ui/Hud/Hud';
import { TaskPanel } from './ui/TaskPanel/TaskPanel';
import { DecisionModal } from './ui/DecisionModal/DecisionModal';
import { TeacherPanel } from './ui/TeacherPanel/TeacherPanel';
import { SourcesPanel } from './ui/Sources/SourcesPanel';
import { FutureComparison } from './ui/FutureComparison/FutureComparison';
import { Intro } from './ui/Intro/Intro';
import { Logo } from './ui/Logo';

export function App() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const gs = useGameState();
  const { selectedHotspotId, notice, decisionOpen } = gs;
  const [sheet, setSheet] = useState(false);
  const next = taskSteps(gs).find((t) => !t.done);
  const selected = hotspots.find((h) => h.id === selectedHotspotId);

  useEffect(() => {
    if (!host.current) return;
    game.current = createGame(host.current);
    return () => {
      game.current?.destroy(true);
      game.current = null;
    };
  }, []);

  const zoom = (delta: number) => game.current?.scene.getScene('WorldScene')?.events.emit('zoom', delta);

  // Klavye: +/- ile yakınlaştırma (pencere açıkken devre dışı)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role=dialog]') || (e.target as HTMLElement)?.matches?.('input, textarea, select')) return;
      if (e.key === '+' || e.key === '=') zoom(0.1);
      if (e.key === '-' || e.key === '_') zoom(-0.1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const skipToZones = () => {
    setSheet(true);
    setTimeout(() => document.getElementById('zones')?.focus(), 50);
  };

  const pick = (id: string) => {
    gameStore.selectHotspot(id);
    game.current?.scene.getScene('WorldScene')?.events.emit('focus-hotspot', id);
  };

  return (
    <div className="app">
      <div ref={host} className="world" />
      <button className="skip" onClick={skipToZones}>Bölge listesine geç</button>
      <TopBar />
      <div className="zoom-btns">
        <button aria-label="Yakınlaştır" onClick={() => zoom(0.1)}>+</button>
        <button aria-label="Uzaklaştır" onClick={() => zoom(-0.1)}>−</button>
      </div>
      <div className={sheet ? 'dock open' : 'dock'}>
        <div className="cta-bar">
          <button aria-expanded={sheet} onClick={() => setSheet(!sheet)}>{sheet ? 'Gizle' : 'Görevler'}</button>
          <span className="cta-text">Görev: {next ? next.label : 'Tamamlandı'}</span>
          {!decisionOpen && (
            <button className="primary" onClick={gameStore.openDecision}>
              {gs.canteenVisited ? 'Devam' : 'Göreve başla'}
            </button>
          )}
        </div>
        <TaskPanel onPick={pick} />
        <WorldStatus />
      </div>
      {(notice || (selected && selected.id !== 'canteen')) && !decisionOpen && (
        <aside role="status" className="panel toast">
          {selected && !notice ? (
            <>
              <h2>{selected.label}</h2>
              <p>Bu bölgenin görevi sonraki sürümde (P1). Şimdilik Kantin görevi oynanabilir.</p>
              <button onClick={gameStore.closePanel}>Kapat</button>
            </>
          ) : (
            <>
              <p>{notice}</p>
              <button onClick={gameStore.clearNotice}>Tamam</button>
            </>
          )}
        </aside>
      )}
      <div className={gs.worldReady ? 'loading done' : 'loading'} role="status" aria-hidden={gs.worldReady}>
        <Logo size={56} />
        <p>Harita yükleniyor…</p>
        <span className="spinner" aria-hidden="true" />
      </div>
      <Intro />
      <DecisionModal />
      <FutureComparison />
      <TeacherPanel />
      <SourcesPanel />
    </div>
  );
}
