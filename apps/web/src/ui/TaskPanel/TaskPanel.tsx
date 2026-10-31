import type { CSSProperties } from 'react';
import { chapterFor, MODULES, taskStatus, tasksOfModule } from '@yarinlab/shared';
import { hotspots } from '../../game/tiles/hotspots';
import { gameStore, useGameState } from '../../state/gameStore';
import { completedTaskIds, isFullyComplete } from '../../state/city';
import { DirectorTip } from './DirectorTip';
import { MODULE_THEME, starsFor } from '../theme/modules';

type Props = { onPick: (id: string) => void };
const short = (title: string) => title.split('–')[1]?.trim() ?? title;

/** Görev haritası: hikâye bölümü, 7 modül kartı, görev patikası ve yıldızlar; erişilebilir Bölge Listesi. */
export function TaskPanel({ onPick }: Props) {
  const s = useGameState();
  const done = completedTaskIds(s);
  const ch = chapterFor(done.length);
  const total = MODULES.reduce((n, m) => n + tasksOfModule(m.id).length, 0);
  const best = new Map<string, number>();
  for (const sc of s.scores) best.set(sc.scenarioId, Math.max(best.get(sc.scenarioId) ?? 0, sc.total));
  const starsTotal = [...best.values()].reduce((a, v) => a + starsFor(v), 0);
  return (
    <aside className="panel task-panel" aria-label="Görev merkezi">
      <h2><span aria-hidden="true">🗺️</span> Görev merkezi</h2>
      <p className="chapter"><strong>{ch.title}</strong><br /><span className="hint">{ch.text}</span></p>
      <p className="hint"><b>{done.length}/{total}</b> görev tamamlandı · <span aria-hidden="true">⭐</span> {starsTotal} yıldız</p>
      <DirectorTip />
      <div className="actions left" style={{ marginTop: 4 }}>
        <button className="link" onClick={() => gameStore.openOverlay('tasks')}>📋 Ödevlerim</button>
        <button className="link" onClick={() => gameStore.openOverlay('assessment')}>📝 Testler</button>
      </div>
      <div className="module-list">
        {MODULES.map((m) => {
          const th = MODULE_THEME[m.id];
          const ts = tasksOfModule(m.id);
          const n = ts.filter((t) => done.includes(t.id)).length;
          return (
            <details key={m.id} className="quest-card" style={{ '--mod': th.color, '--soft': th.soft } as CSSProperties}>
              <summary>
                <span className="avatar sm" aria-hidden="true">{th.emoji}</span>
                <span style={{ flex: 1 }}>
                  <span className="qc-title">{m.name}</span><br />
                  <span className="qc-sub">{th.character}</span>
                  <span className="dots" aria-hidden="true">{ts.map((t) => <i key={t.id} className={done.includes(t.id) ? 'on' : ''} />)}</span>
                </span>
                <span className="hint"><b>{n}</b>/{ts.length}</span>
              </summary>
              <ol className="trail">
                {ts.map((t) => {
                  const st = taskStatus(t.id, done);
                  const stars = starsFor(best.get(t.id));
                  return (
                    <li key={t.id} className={st.status}>
                      <button onClick={() => gameStore.openTask(t.id)} aria-disabled={st.status === 'locked'} title={st.reason}>
                        <span className="step" aria-hidden="true">{st.status === 'locked' ? '🔒' : t.order}</span>
                        <span>{short(t.title)}</span>
                        {st.status === 'done' && <span className="stars" aria-label={`${stars} yıldız`}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>}
                        {isFullyComplete(s, t.id) && <span aria-label="tam tamamlandı" title="4 adımın hepsi bitti">🏆</span>}
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
        <h3>Haritadaki yerler</h3>
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
