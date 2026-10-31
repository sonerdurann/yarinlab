import { useState } from 'react';
import { taskById } from '@yarinlab/shared';
import { api } from '../../api/client';
import { useAuth } from '../../state/authStore';
import { gameStore, useGameState } from '../../state/gameStore';
import { completedTaskIds } from '../../state/city';

type Advice = { taskId: string; mode: 'next' | 'retry' | 'review'; message: string };

/** AI Senaryo Yönetmeni: başarıya göre sıradaki görevi veya yeniden denemeyi önerir (yalnızca açık görevler arasından). */
export function DirectorTip() {
  const { user } = useAuth();
  const s = useGameState();
  const [tip, setTip] = useState<(Advice & { source: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const ask = async () => {
    setBusy(true);
    try {
      const r = await api<{ source: string; advice: Advice }>('/api/ai/director', {
        body: { completed: completedTaskIds(s), recent: s.scores.slice(-6).map((x) => ({ taskId: x.scenarioId, total: x.total, reasoning: x.reasoning })) },
      });
      setTip({ ...r.advice, source: r.source });
    } catch {
      setTip(null);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="director" aria-live="polite">
      <button onClick={() => void ask()} disabled={busy}>{busy ? 'Rehber düşünüyor…' : 'Rehbere sor: ne yapayım?'}</button>
      {tip && (
        <p className="hint">
          <strong>{tip.mode === 'retry' ? 'Yeniden dene' : tip.mode === 'next' ? 'Öneri' : 'Gözden geçir'}:</strong> {tip.message}{' '}
          <button className="link" onClick={() => gameStore.openTask(tip.taskId)}>{taskById(tip.taskId)?.title ?? tip.taskId}</button>
          <br /><em>{tip.source === 'ai' ? 'Yapay zekâ önerisi (doğrulandı)' : 'Kural tabanlı öneri'}</em>
        </p>
      )}
    </div>
  );
}
