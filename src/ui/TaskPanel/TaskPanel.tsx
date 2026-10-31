import { hotspots } from '../../game/tiles/hotspots';
import { gameStore, isTaskComplete, taskSteps, useGameState } from '../../state/gameStore';

type Props = { onPick: (id: string) => void };

/** Sol görev paneli + erişilebilir Bölge Listesi (kılavuz §09, §13). */
export function TaskPanel({ onPick }: Props) {
  const s = useGameState();
  const steps = taskSteps(s);
  return (
    <aside className="panel task-panel" aria-label="Görevler">
      <h2>Görevler</h2>
      <ol className="steps">
        {steps.map((t, i) => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <span aria-hidden="true">{t.done ? '✓' : i + 1}</span> {t.label}
            {t.done && <span className="sr-only"> (tamamlandı)</span>}
          </li>
        ))}
      </ol>
      {isTaskComplete(s) && <p className="badge-ok">Görev tamamlandı</p>}
      {!s.decisionOpen && (
        <button className="primary" onClick={gameStore.openDecision}>
          {s.canteenVisited ? 'Göreve devam et' : 'Göreve başla'}
        </button>
      )}
      <nav aria-label="Bölge Listesi">
        <h3>Bölgeler</h3>
        {hotspots.map((h) => (
          <button key={h.id} className={h.locked ? 'zone locked' : 'zone'} onClick={() => onPick(h.id)}>
            {h.label}
            {h.locked ? ' (Yakında)' : ''}
          </button>
        ))}
      </nav>
      <button className="link" onClick={gameStore.resetSession}>
        Yeni oturum (örnek veriyi sıfırla)
      </button>
    </aside>
  );
}
