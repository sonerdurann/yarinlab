import { useState } from 'react';
import { MODE_TR, SCIENCE_SOURCES, taskById, type TutorMode } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { completedTaskIds } from '../../state/city';
import { getGuide, type TutorOutcome } from '../../ai/tutorClient';
import { Mascot } from '../Mascot';
import { suggestedTask } from '../hud/LeftHud';

const AFTER: TutorMode[] = ['why', 'alternative', 'explain', 'evaluate', 'relearn', 'hint'];
const BEFORE: TutorMode[] = ['hint', 'relearn'];

/**
 * Yapay zekâ rehberi Yarı (prompt §9): sağ altta yüzen yardımcı. Son karara (yoksa önerilen göreve) göre
 * İpucu / Neden / Farklı çözüm / Biraz daha açıkla / Konuyu tekrar öğren / Kararımı değerlendir.
 * Sayılar yalnızca simülasyondan gelir; yanıt doğrulanmadan gösterilmez.
 */
export function GuidePanel() {
  const s = useGameState();
  const [busy, setBusy] = useState<TutorMode | null>(null);
  const [out, setOut] = useState<{ mode: TutorMode; o: TutorOutcome } | null>(null);
  if (!s.guideOpen) return null;
  const last = s.result ?? [...s.history].reverse()[0] ?? null;
  const next = suggestedTask(completedTaskIds(s));
  const taskId = last?.scenarioId ?? next?.id ?? 'food_001';
  const task = taskById(taskId);
  const ctx = last
    ? { scenarioId: last.scenarioId, choiceId: last.choiceId, before: last.before, after: last.after, reasoning: last.reasoning }
    : { scenarioId: taskId, choiceId: 'N', before: task!.baseline, after: task!.baseline };
  const modes = last ? AFTER : BEFORE;
  const ask = async (mode: TutorMode) => {
    setBusy(mode);
    const o = await getGuide(ctx, mode);
    setOut({ mode, o });
    setBusy(null);
  };
  const r = out?.o.response;
  return (
    <aside className="guide-panel panel" role="region" aria-label="Yapay zekâ rehberi Yarı" aria-busy={!!busy}>
      <header>
        <Mascot mood={busy ? 'think' : out ? 'happy' : 'wave'} size={56} />
        <div>
          <h2>Rehber Yarı</h2>
          <span className="hint">{last ? `Son kararın: ${task?.title ?? taskId}` : `Sıradaki görev: ${task?.title ?? ''}`}</span>
        </div>
        <button className="icon-btn" aria-label="Rehberi kapat" onClick={() => { setOut(null); gameStore.closeGuide(); }}>✕</button>
      </header>
      <div className="guide-intents" role="group" aria-label="Ne istersin?">
        {modes.map((m) => (
          <button key={m} disabled={!!busy} aria-pressed={out?.mode === m} onClick={() => void ask(m)}>{MODE_TR[m]}</button>
        ))}
      </div>
      <div aria-live="polite">
        {busy && <p className="thinking"><span className="dot" /><span className="dot" /><span className="dot" /> Yarı düşünüyor…</p>}
        {r && !busy && (
          <div className="guide-answer">
            <p>{r.summary}</p>
            <p>{r.tradeoff}</p>
            <ul className="guide-q"><li>🤔 {r.question1}</li><li>🤔 {r.question2}</li></ul>
            {r.sourceIds.length > 0 && <p className="hint">Kaynak: {r.sourceIds.map((id) => SCIENCE_SOURCES.find((x) => x.id === id)?.org ?? id).join(', ')}</p>}
            <p className="hint">{out!.o.source === 'ai' ? 'Yapay zekâ yanıtı (doğrulandı)' : 'Hazır rehber yanıtı'} · Sayılar oyun simülasyonundandır.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
