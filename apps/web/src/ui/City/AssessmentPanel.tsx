import { useState } from 'react';
import { ASSESSMENTS, MODULES, scoreAssessment, type ModuleId } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { enqueue } from '../../state/saveSync';
import { Modal } from '../Modal/Modal';

/** Öğrenme değerlendirmesi: modül başına ön ve son test (4 soru). Ön/son farkı kazanım raporunda kullanılır. */
export function AssessmentPanel() {
  const s = useGameState();
  const [mod, setMod] = useState<ModuleId>('energy');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState<{ pct: number; correct: number; total: number } | null>(null);
  if (s.overlay !== 'assessment') return null;
  const pre = s.assessments.filter((a) => a.moduleId === mod && a.kind === 'PRE').pop();
  const post = s.assessments.filter((a) => a.moduleId === mod && a.kind === 'POST').pop();
  const kind: 'PRE' | 'POST' = pre ? 'POST' : 'PRE';
  const qs = ASSESSMENTS[mod];
  const submit = () => {
    const r = scoreAssessment(mod, answers);
    gameStore.recordAssessment(mod, kind, r.pct);
    enqueue('/api/assessments', { moduleId: mod, kind, answers });
    setDone(r);
  };
  return (
    <Modal titleId="as-title" title="Öğrenme değerlendirmesi" onClose={() => { setDone(null); gameStore.closeOverlay(); }} wide>
      <p className="hint">Her modül için oynamadan önce bir ön test, oynadıktan sonra bir son test çöz. Bu bir sınav değil; neyi öğrendiğini görmek için.</p>
      <label className="text-row">Modül{' '}
        <select value={mod} onChange={(e) => { setMod(e.target.value as ModuleId); setAnswers({}); setDone(null); }}>
          {MODULES.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <p>Ön test: {pre ? `%${pre.pct}` : 'yapılmadı'} · Son test: {post ? `%${post.pct}` : 'yapılmadı'}{pre && post ? ` · Değişim: ${post.pct - pre.pct >= 0 ? '+' : ''}${post.pct - pre.pct} puan` : ''}</p>
      {done ? (
        <div className="badge-ok" role="status">{kind === 'PRE' ? 'Son' : 'Ön'} test kaydedildi: {done.correct}/{done.total} doğru (%{done.pct}).</div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <h3>{kind === 'PRE' ? 'Ön test' : 'Son test'}</h3>
          {qs.map((q, i) => (
            <fieldset key={q.id}>
              <legend>{i + 1}. {q.q}</legend>
              {q.options.map((o, k) => (
                <label key={k} className="radio-row">
                  <input type="radio" name={q.id} checked={answers[q.id] === k} onChange={() => setAnswers({ ...answers, [q.id]: k })} /> {o}
                </label>
              ))}
            </fieldset>
          ))}
          <div className="actions"><button className="primary" type="submit" disabled={Object.keys(answers).length < qs.length}>Gönder</button></div>
        </form>
      )}
    </Modal>
  );
}
