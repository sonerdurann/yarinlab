import { MODULES, nextTaskOf, tasksOfModule } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { completedTaskIds } from '../../state/city';
import { Modal } from '../Modal/Modal';

type Props = { onPick: (id: string) => void };

/** Okul kampüsü: yedi modülün sıradaki görevleri, kampüs yapıları ve değerlendirme. */
export function SchoolPanel(_props: Props) {
  const s = useGameState();
  const done = completedTaskIds(s);
  return (
    <Modal titleId="school-title" title="Okul kampüsü" onClose={gameStore.closePanel}>
      <p>2040’tan gelen çağrı burada başladı. Yedi modülün kararları aynı şehri etkiler: biri değişince diğerlerinin göstergeleri de değişir.</p>
      <h3>Modüller ve sıradaki görev</h3>
      <ul className="build-list">
        {MODULES.map((m) => {
          const next = nextTaskOf(m.id, done);
          const n = tasksOfModule(m.id).filter((t) => done.includes(t.id)).length;
          return (
            <li key={m.id}>
              <div><strong>{m.name}</strong> · {n}/{tasksOfModule(m.id).length}<br /><span className="hint">{m.description}</span></div>
              <div className="actions"><button onClick={() => { gameStore.closePanel(); gameStore.openTask(next.id); }}>{done.includes(next.id) ? 'Tekrar oyna' : 'Oyna'}</button></div>
            </li>
          );
        })}
      </ul>
      <div className="actions left">
        <button onClick={() => { gameStore.closePanel(); gameStore.openOverlay('build', 'school'); }}>Kampüste inşa et</button>
        <button onClick={() => { gameStore.closePanel(); gameStore.openOverlay('assessment'); }}>Öğrenme değerlendirmesi</button>
      </div>
      <p className="notice">Haritadaki sayılar simülasyondur; okul ölçümü değildir.</p>
      <div className="actions">
        <button className="primary" onClick={gameStore.closePanel}>Haritaya dön</button>
      </div>
    </Modal>
  );
}
