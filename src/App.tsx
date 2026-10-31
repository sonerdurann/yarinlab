import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame } from './game/createGame';
import { hotspots } from './game/tiles/hotspots';
import { gameStore, useGameState } from './state/gameStore';

export function App() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const { selectedHotspotId, notice } = useGameState();
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
    <div style={{ position: 'relative', height: '100%' }}>
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', background: '#12263acc', color: '#f7f5ef' }}>
        <strong>YARINLAB / 2040</strong> · Geleceği Sen Tasarla
      </header>
      <nav aria-label="Bölge Listesi" style={{ position: 'absolute', left: 12, top: 64, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hotspots.map((h) => (
          <button
            key={h.id}
            onClick={() => pick(h.id)}
            style={{ borderRadius: 12, border: '1px solid #12263a33', background: h.locked ? '#e5e3dc' : '#fff', padding: '4px 12px', textAlign: 'left' }}
          >
            {h.label}
            {h.locked ? ' (Yakında)' : ''}
          </button>
        ))}
      </nav>
      {(selected || notice) && (
        <aside role="status" style={{ position: 'absolute', right: 12, top: 64, width: 290, maxWidth: 'calc(100% - 24px)', background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 4px 20px #0002' }}>
          {selected ? (
            <>
              <h2 style={{ margin: 0 }}>{selected.label}</h2>
              <p>
                Sahne: <code>{selected.scene}</code>
              </p>
              <button onClick={gameStore.closePanel}>Kapat</button>
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}>{notice}</p>
              <button onClick={gameStore.clearNotice}>Tamam</button>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
