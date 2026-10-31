import { chapterFor, MODULES, taskStatus, tasksOfModule } from '@yarinlab/shared';
import { hotspots } from '../../game/tiles/hotspots';
import { gameStore, useGameState } from '../../state/gameStore';
import { completedTaskIds } from '../../state/city';

type Props = { onPick: (id: string) => void };

/** Görev Merkezi: hikâye bölümü, 7 modül × görev zinciri, kilit nedenleri ve erişilebilir Bölge Listesi. */
export function TaskPanel({ onPick }: Props) {
  const s = useGameState();
  const done = completedTaskIds(s);
  const ch = chapterFor(done.length);
  const total = MODULES.reduce((n, m) => n + tasksOfModule(m.id).length, 0);
  const suggested = MODULES.map((m) => tasksOfModule(m.id).find((t) => taskStatus(t.id, done).status === 'available'))
    .filter(Boolean)
    .sort((a, b) => done.filter((d) => d.startsWith(a!.module)).length - done.filter((d) => d.startsWith(b!.module)).length)[0];
  return (
    <aside className="panel task-panel" aria-label="Görev merkezi">
      <h2>Görev merkezi</h2>
      <p className="chapter"><strong>{ch.title}</strong><br /><span className="hint">{ch.text}</span></p>
      <p className="hint">{done.length}/{total} görev tamamlandı (karar + gerekçe).</p>
      {suggested && !s.decisionOpen && (
        <button className="primary" onClick={() => gameStore.openTask(suggested.id)}>Önerilen: {suggested.title.split('–')[1]?.trim() ?? suggested.title}</button>
      )}
      <button className="link" onClick={() => gameStore.openOverlay('assessment')}>Ön/son değerlendirme</button>
      <div className="module-list">
        {MODULES.map((m) => {
          const ts = tasksOfModule(m.id);
          const n = ts.filter((t) => done.includes(t.id)).length;
          return (
            <details key={m.id} className="module">
              <summary><span>{m.name}</span><span className="hint">{n}/{ts.length}</span></summary>
              <p className="hint">{m.subtitle}</p>
              <ol className="task-list">
                {ts.map((t) => {
                  const st = taskStatus(t.id, done);
                  return (
                    <li key={t.id} className={st.status}>
                      <button className="zone" onClick={() => gameStore.openTask(t.id)} aria-disabled={st.status === 'locked'} title={st.reason}>
                        <span aria-hidden="true">{st.status === 'done' ? '✓' : st.status === 'locked' ? '🔒' : '▶'}</span> {t.order}. {t.title.split('–')[1]?.trim() ?? t.title}
                        <span className="sr-only">{st.status === 'done' ? ' (tamamlandı)' : st.status === 'locked' ? ` (kilitli: ${st.reason})` : ' (oynanabilir)'}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </div>
      <nav id="zones" tabIndex={-1} aria-label="Bölge Listesi">
        <h3>Bölgeler</h3>
        {hotspots.map((h) => (
          <button key={h.id} className={h.locked ? 'zone locked' : 'zone'} onClick={() => onPick(h.id)}>
            {h.label}
            {h.locked ? ' (Yakında)' : ''}
          </button>
        ))}
        <button className="zone" onClick={() => gameStore.openCouncil()}>Gelecek Meclisi</button>
      </nav>
    </aside>
  );
}
