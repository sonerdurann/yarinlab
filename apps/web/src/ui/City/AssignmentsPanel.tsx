import { useEffect, useState } from 'react';
import { REAL_WORLD_TASKS, taskById } from '@yarinlab/shared';
import { api, errorText } from '../../api/client';
import { useAuth } from '../../state/authStore';
import { gameStore, useGameState } from '../../state/gameStore';
import { completedTaskIds } from '../../state/city';
import { Modal } from '../Modal/Modal';

type Assignment = { id: string; title: string; taskIds: string[]; realWorldTaskId: string | null; dueAt: string | null };
type Measurement = { taskKey: string; phase: 'BASELINE' | 'FOLLOWUP'; value: number; unit: string; createdAt: string };

/** Öğrenci: öğretmenin atadığı görevler ve gerçek dünya ölçümleri (Ölçülmüş etiketli). */
export function AssignmentsPanel() {
  const s = useGameState();
  const { user } = useAuth();
  const [list, setList] = useState<Assignment[]>([]);
  const [ms, setMs] = useState<Measurement[]>([]);
  const [f, setF] = useState<{ key: string; phase: 'BASELINE' | 'FOLLOWUP'; value: string; note: string }>({ key: REAL_WORLD_TASKS[0].key, phase: 'BASELINE', value: '', note: '' });
  const [msg, setMsg] = useState('');
  const open = s.overlay === 'tasks';
  useEffect(() => {
    if (!open || !user) return;
    void api<{ assignments: Assignment[] }>('/api/me/assignments').then((r) => setList(r.assignments)).catch(() => setMsg('Ödevler yüklenemedi (çevrim dışı olabilirsin).'));
    void api<{ measurements: Measurement[] }>('/api/me/measurements').then((r) => setMs(r.measurements)).catch(() => undefined);
  }, [open, user]);
  if (!open) return null;
  const done = completedTaskIds(s);
  const save = async () => {
    try {
      await api('/api/me/measurements', { body: { taskKey: f.key, phase: f.phase, value: Number(f.value), note: f.note || undefined } });
      gameStore.recordRealWorld();
      setMsg('Ölçüm kaydedildi.');
      setF({ ...f, value: '', note: '' });
      setMs((await api<{ measurements: Measurement[] }>('/api/me/measurements')).measurements);
    } catch (e) { setMsg(errorText(e)); }
  };
  return (
    <Modal titleId="asg-title" title="Ödevlerim ve saha görevleri" onClose={gameStore.closeOverlay} wide>
      {!user ? <p>Öğretmeninin atadığı görevleri görmek için sınıf koduyla giriş yap.</p> : (
        <>
          {list.length === 0 ? <p>Şu an atanmış görev yok.</p> : (
            <ul className="build-list">
              {list.map((a) => {
                const n = a.taskIds.filter((t) => done.includes(t)).length;
                return (
                  <li key={a.id}>
                    <div>
                      <strong>{a.title}</strong>{a.dueAt && <span className="hint"> · son gün {new Date(a.dueAt).toLocaleDateString('tr-TR')}</span>}<br />
                      {a.taskIds.length > 0 && <span className="hint">Oyun görevleri: {n}/{a.taskIds.length}</span>}
                      {a.realWorldTaskId && <span className="hint"> · Saha: {REAL_WORLD_TASKS.find((r) => r.key === a.realWorldTaskId)?.title}</span>}
                    </div>
                    <div className="actions">
                      {a.taskIds.filter((t) => !done.includes(t)).slice(0, 1).map((t) => <button key={t} onClick={() => gameStore.openTask(t)}>{taskById(t)?.title.split('–')[1]?.trim() ?? t}</button>)}
                      {a.taskIds.length > 0 && n === a.taskIds.length && <span className="badge-ok">Tamam</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <h3>Gerçek dünya ölçümü ekle <span className="tag measured">Ölçülmüş</span></h3>
          <p className="hint">Ad, fotoğraf veya konum yazma. Önce “başlangıç”, uygulamadan sonra aynı koşullarda “sonuç” ölçümünü gir.</p>
          <form className="inline-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
            <select aria-label="Etkinlik" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })}>{REAL_WORLD_TASKS.map((r) => <option key={r.key} value={r.key}>{r.title} ({r.unit})</option>)}</select>
            <select aria-label="Aşama" value={f.phase} onChange={(e) => setF({ ...f, phase: e.target.value as 'BASELINE' | 'FOLLOWUP' })}><option value="BASELINE">Başlangıç</option><option value="FOLLOWUP">Sonuç</option></select>
            <input aria-label="Değer" type="number" min={0} step="0.01" required value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
            <input aria-label="Not" placeholder="Koşullar (ör. aynı saat)" maxLength={200} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            <button type="submit">Kaydet</button>
          </form>
          {msg && <p role="status" className="notice">{msg}</p>}
          {ms.length > 0 && (
            <table className="result"><thead><tr><th>Etkinlik</th><th>Aşama</th><th>Değer</th><th>Tarih</th></tr></thead>
              <tbody>{ms.map((m, k) => <tr key={k}><td>{REAL_WORLD_TASKS.find((r) => r.key === m.taskKey)?.title}</td><td>{m.phase === 'BASELINE' ? 'Başlangıç' : 'Sonuç'}</td><td>{m.value} {m.unit}</td><td>{new Date(m.createdAt).toLocaleDateString('tr-TR')}</td></tr>)}</tbody></table>
          )}
        </>
      )}
    </Modal>
  );
}
