import type { CSSProperties } from 'react';
import { chapterFor, MODULES, taskStatus, tasksOfModule } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { completedTaskIds, scenarioSteps } from '../../state/city';
import { MODULE_THEME } from '../theme/modules';
import { AvatarFace } from '../characters/Avatar';
import { Mascot } from '../Mascot';

const short = (title: string) => title.split('–')[1]?.trim() ?? title;
const TOTAL = MODULES.reduce((n, m) => n + tasksOfModule(m.id).length, 0);

/** Önerilen görev: en az ilerlenen modülün sıradaki açık görevi. */
export function suggestedTask(done: string[]) {
  return MODULES.map((m) => tasksOfModule(m.id).find((t) => taskStatus(t.id, done).status === 'available'))
    .filter(Boolean)
    .sort((a, b) => done.filter((d) => d.startsWith(a!.module)).length - done.filter((d) => d.startsWith(b!.module)).length)[0];
}

/** Sol HUD: oyuncu kartı, hikâye bölümü, aktif görev (ilerleme + sonraki adım) ve rehbere erişim (prompt §5). */
export function LeftHud() {
  const s = useGameState();
  const done = completedTaskIds(s);
  const ch = chapterFor(done.length);
  const next = suggestedTask(done);
  const steps = next ? scenarioSteps(s, next.id) : null;
  const th = next ? MODULE_THEME[next.module] : MODULE_THEME.council;
  return (
    <aside className="hud-left" aria-label="Aktif görev">
      <div className="player-card panel">
        <AvatarFace look={s.profile.avatar} size={46} expr="joy" />
        <div>
          <strong>{s.profile.nickname || 'Yarının mimarı'}</strong>
          <span className="hint">{done.length}/{TOTAL} görev</span>
          <span className="mini-progress" aria-hidden="true"><span style={{ width: `${(100 * done.length) / TOTAL}%` }} /></span>
        </div>
      </div>
      <div className="story-chip panel" title={ch.text}>
        <span aria-hidden="true">📖</span> <span><b>{ch.title}</b><span className="hint story-text">{ch.text}</span></span>
      </div>
      {next && !s.decisionOpen && (
        <div className="active-task panel" style={{ '--mod': th.color, '--soft': th.soft } as CSSProperties}>
          <span className="mod-chip"><span aria-hidden="true">{th.emoji}</span> {next.module === 'council' ? 'Gelecek Meclisi' : MODULES.find((m) => m.id === next.module)?.name}</span>
          {steps && <ul className="step-dots" aria-label="Görev adımları">{steps.map((x) => <li key={x.id} className={x.done ? 'on' : ''} title={x.label} />)}</ul>}
          <button className="primary task-go" onClick={() => gameStore.openTask(next.id)}>
            <span aria-hidden="true">{th.emoji} </span>Önerilen: {short(next.title)}
          </button>
          <span className="hint">Sonraki adım: {th.character} seni bekliyor.</span>
        </div>
      )}
      <button className="guide-btn" onClick={() => gameStore.openGuide()} aria-label="Yapay zekâ rehberi Yarı'ya sor">
        <Mascot mood="happy" size={38} /> <span>Yarı'ya sor</span>
      </button>
    </aside>
  );
}
