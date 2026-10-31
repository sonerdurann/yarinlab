import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame } from './game/createGame';
import { hotspots } from './game/tiles/hotspots';
import { gameStore, useGameState } from './state/gameStore';
import { TopBar, WorldStatus } from './ui/Hud/Hud';
import { TaskPanel } from './ui/TaskPanel/TaskPanel';
import { DecisionModal } from './ui/DecisionModal/DecisionModal';
import { TeacherPanel } from './ui/TeacherPanel/TeacherPanel';
import { SourcesPanel } from './ui/Sources/SourcesPanel';
import { FutureComparison } from './ui/FutureComparison/FutureComparison';

export function App() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const { selectedHotspotId, notice, decisionOpen } = useGameState();
  const selected = hotspots.find((h) => h.id === selectedHotspotId);

  useEffect(() => {
    if (!host.current) return;
    game.current = createGame(host.current);
    return () => {
      game.current?.destroy(true);
      game.current = null;
    };
  }, []);

  const pick = (id: string) => {
    gameStore.selectHotspot(id);
    game.current?.scene.getScene('WorldScene')?.events.emit('focus-hotspot', id);
  };

  return (
    <div className="app">
      <div ref={host} className="world" />
      <TopBar />
      <TaskPanel onPick={pick} />
      <WorldStatus />
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
      <DecisionModal />
      <FutureComparison />
      <TeacherPanel />
      <SourcesPanel />
    </div>
  );
}
