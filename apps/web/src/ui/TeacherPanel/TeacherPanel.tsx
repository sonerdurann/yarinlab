import { useCallback, useEffect, useState } from 'react';
import { MODULES, REAL_WORLD_TASKS, tasksOfModule, TASKS } from '@yarinlab/shared';
import { api, errorText } from '../../api/client';
import { authStore, useAuth } from '../../state/authStore';
import { teacherStore, useTeacherState } from '../../state/teacherStore';
import { Modal } from '../Modal/Modal';

type Classroom = { id: string; name: string; joinCode: string; _count?: { enrollments: number } };
type Detail = {
  classroom: Classroom; consent: { school: boolean; parent: boolean }; noticeVersion: string;
  groups: { id: string; name: string }[];
  students: { id: string; nickname: string; groupId: string | null; joinedAt: string }[];
  assignments: { id: string; title: string }[];
};
type Report = {
  studentsCount: number;
  students: { id: string; nickname: string; group: string | null; completedTasks: number; modulesPlayed: number; attempts: number; avgTotal: number | null; avgReasoning: number | null; avgBalance: number | null; misconceptionChoices: number; lastActive: string | null }[];
  outcomes: { id: string; text: string; pct: number | null; evidence: number }[];
  misconceptions: { taskId: string; title: string; choiceId: string; text: string; students: number; withoutReasoning: number; laterCorrected: number }[];
  modules: { id: string; name: string; tasks: number; startedPct: number; completedPct: number; avgDone: number; pre: number | null; post: number | null; prePostN: number }[];
  reasonings: { nickname: string; title: string; choice: string; reasoning: string; total: number | null; reasoningScore: number | null; misconception: boolean; at: string }[];
  assignments: { id: string; title: string; dueAt: string | null; target: number; completed: number; pct: number; overdue: boolean; pending: string[]; groupId: string | null }[];
  realWorld: { key: string; title: string; unit: string; baseline: number | null; followup: number | null; change: number | null; nBaseline: number; nFollowup: number }[];
  notes: string[];
};
type Tab = 'class' | 'assign' | 'progress' | 'learning' | 'field' | 'reports';

const Bar = ({ value, label }: { value: number | null; label: string }) => (
  <span className="hbar" title={label}>
    <span className="hbar-track" aria-hidden="true"><span className="hbar-fill green" style={{ width: `${value ?? 0}%` }} /></span>
    <span className="hbar-val">{value === null ? '–' : `%${value}`}</span>
  </span>
);

/** KVKK bilgilendirme metni (taslak; okulun hukuki birimince incelenmelidir). */
const NOTICE = [
  'YarınLab, öğrenciden yalnızca takma ad ve parola alır; ad-soyad, e-posta, telefon, fotoğraf veya konum toplamaz.',
  'Oyun içi kararlar, gerekçe metinleri, değerlendirme cevapları ve öğretmenin atadığı ölçümler eğitim amacıyla işlenir.',
  'Veriler yalnızca sınıfın öğretmeni tarafından görülür; öğretmen öğrenci veya sınıf verisini istediği an silebilir.',
  'Yapay zekâ servisine öğrenci kimliği gönderilmez; yalnızca görev sonucu ve (kişisel bilgiden temizlenmiş) gerekçe gider.',
];

/** Öğretmen paneli: yalnızca girişli öğretmenin kendi sınıfları ve gerçek verileri. */
export function TeacherPanel() {
  const { teacherOpen } = useTeacherState();
  const { user } = useAuth();
  if (!teacherOpen) return null;
  if (user?.role !== 'TEACHER') {
    return (
      <Modal titleId="tp-title" title="Öğretmen paneli" onClose={teacherStore.closeTeacher}>
        <p>Öğretmen paneli yalnızca öğretmen hesabıyla açılır. Sınıf oluşturabilir, öğrencilere sınıf kodu verebilir, görev atayabilir ve raporları indirebilirsiniz.</p>
        <div className="actions"><button className="primary" onClick={() => { teacherStore.closeTeacher(); authStore.open(); }}>Öğretmen girişi / kaydı</button></div>
      </Modal>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await api<{ classrooms: Classroom[] }>('/api/classrooms');
      setClasses(r.classrooms);
      setSel((s) => s ?? r.classrooms[0]?.id ?? null);
    } catch (e) { setErr(errorText(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const create = async () => {
    try {
      const r = await api<{ classroom: Classroom }>('/api/classrooms', { body: { name } });
      setName(''); setSel(r.classroom.id); await load();
    } catch (e) { setErr(errorText(e)); }
  };
  return (
    <Modal titleId="tp-title" title="Öğretmen paneli" onClose={teacherStore.closeTeacher} wide>
      <div className="class-bar">
        <label>Sınıf{' '}
          <select value={sel ?? ''} onChange={(e) => setSel(e.target.value)} aria-label="Sınıf seç">
            {classes.length === 0 && <option value="">Henüz sınıf yok</option>}
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c._count?.enrollments ?? 0} öğrenci)</option>)}
          </select>
        </label>
        <form onSubmit={(e) => { e.preventDefault(); void create(); }} className="inline-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Yeni sınıf adı (ör. 7-A)" aria-label="Yeni sınıf adı" minLength={2} maxLength={60} required />
          <button type="submit">Sınıf oluştur</button>
        </form>
      </div>
      {err && <p role="alert" className="form-error">{err}</p>}
      {sel ? <ClassView key={sel} id={sel} onChanged={load} onDeleted={() => { setSel(null); void load(); }} /> : <p>Başlamak için bir sınıf oluşturun.</p>}
    </Modal>
  );
}

function ClassView({ id, onChanged, onDeleted }: { id: string; onChanged: () => void; onDeleted: () => void }) {
  const [tab, setTab] = useState<Tab>('class');
  const [d, setD] = useState<Detail | null>(null);
  const [r, setR] = useState<Report | null>(null);
  const [msg, setMsg] = useState('');
  const refresh = useCallback(async () => {
    try {
      const [dd, rr] = await Promise.all([api<Detail>(`/api/classrooms/${id}`), api<Report>(`/api/classrooms/${id}/report`)]);
      setD(dd); setR(rr);
    } catch (e) { setMsg(errorText(e)); }
  }, [id]);
  // Sekme değişince güncel veriyi çek (öğrenciler oynarken rapor bayatlamasın).
  useEffect(() => { void refresh(); onChanged(); }, [refresh, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); setMsg(ok ?? ''); await refresh(); onChanged(); } catch (e) { setMsg(errorText(e)); }
  };
  if (!d || !r) return <p role="status">Yükleniyor…</p>;
  const tabs: [Tab, string][] = [['class', 'Sınıf ve öğrenciler'], ['assign', 'Görev atama'], ['progress', 'İlerleme'], ['learning', 'Kazanım ve yanılgılar'], ['field', 'Gerçek dünya'], ['reports', 'Raporlar ve öneriler']];
  return (
    <>
      <div className="tabs" role="tablist" aria-label="Öğretmen bölümleri">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
        <button onClick={() => void refresh()} aria-label="Verileri yenile">↻ Yenile</button>
      </div>
      {msg && <p role="status" className="notice">{msg}</p>}
      {tab === 'class' && <ClassTab d={d} act={act} onDeleted={onDeleted} />}
      {tab === 'assign' && <AssignTab id={id} d={d} r={r} act={act} />}
      {tab === 'progress' && <ProgressTab r={r} />}
      {tab === 'learning' && <LearningTab r={r} />}
      {tab === 'field' && <FieldTab id={id} r={r} act={act} />}
      {tab === 'reports' && <ReportsTab id={id} r={r} />}
    </>
  );
}

type Act = (fn: () => Promise<unknown>, ok?: string) => Promise<void>;

function ClassTab({ d, act, onDeleted }: { d: Detail; act: Act; onDeleted: () => void }) {
  const [group, setGroup] = useState('');
  const [temp, setTemp] = useState<{ nick: string; pw: string } | null>(null);
  const ready = d.consent.school && d.consent.parent;
  const id = d.classroom.id;
  return (
    <section>
      <p className="join-code">Sınıf kodu: <strong>{d.classroom.joinCode}</strong> <span className="hint">Öğrenciler “Öğrenci kaydı” ekranında bu kodu ve bir takma ad kullanır.</span></p>
      <details open={!ready} className="consent">
        <summary><strong>İzin akışı (KVKK)</strong> {ready ? '✓ tamamlandı' : '— öğrenciler katılmadan önce gerekli'}</summary>
        <ul className="indicators">{NOTICE.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="hint">Metin sürümü {d.noticeVersion}. Bu metin bir taslaktır; okulunuzun hukuk birimi ve veli bilgilendirme süreçlerine göre uyarlanmalıdır.</p>
        <div className="actions left">
          <button disabled={d.consent.school} onClick={() => void act(() => api(`/api/classrooms/${id}/consent`, { body: { kind: 'SCHOOL_APPROVAL', confirm: true } }), 'Okul yönetimi onayı kaydedildi.')}>
            {d.consent.school ? '✓ Okul yönetimi onayı alındı' : 'Okul yönetimi onayını aldığımı onaylıyorum'}
          </button>
          <button disabled={d.consent.parent} onClick={() => void act(() => api(`/api/classrooms/${id}/consent`, { body: { kind: 'PARENT_NOTICE', confirm: true } }), 'Veli bilgilendirmesi kaydedildi.')}>
            {d.consent.parent ? '✓ Veliler bilgilendirildi' : 'Velileri bilgilendirdiğimi onaylıyorum'}
          </button>
        </div>
      </details>
      <h3>Gruplar</h3>
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); void act(() => api(`/api/classrooms/${id}/groups`, { body: { name: group } })).then(() => setGroup('')); }}>
        <input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Grup adı" aria-label="Grup adı" required maxLength={40} />
        <button type="submit">Grup ekle</button>
      </form>
      <ul className="chips">{d.groups.map((g) => <li key={g.id}>{g.name} <button className="link" aria-label={`${g.name} grubunu sil`} onClick={() => void act(() => api(`/api/classrooms/${id}/groups/${g.id}`, { method: 'DELETE' }))}>×</button></li>)}</ul>
      <h3>Öğrenciler ({d.students.length})</h3>
      {temp && <p className="badge-ok" role="status">{temp.nick} için geçici parola: <strong>{temp.pw}</strong> (öğrenciye iletin; girişten sonra değiştirmesi önerilir).</p>}
      {d.students.length === 0 ? <p>Henüz öğrenci yok.</p> : (
        <table className="result">
          <thead><tr><th>Takma ad</th><th>Grup</th><th>Katılım</th><th>İşlemler</th></tr></thead>
          <tbody>{d.students.map((s) => (
            <tr key={s.id}>
              <td>{s.nickname}</td>
              <td><select aria-label={`${s.nickname} grubu`} value={s.groupId ?? ''} onChange={(e) => void act(() => api(`/api/classrooms/${id}/students/${s.id}`, { method: 'PATCH', body: { groupId: e.target.value || null } }))}>
                <option value="">—</option>{d.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select></td>
              <td>{new Date(s.joinedAt).toLocaleDateString('tr-TR')}</td>
              <td>
                <button onClick={() => void api<{ temporaryPassword: string }>(`/api/classrooms/${id}/students/${s.id}/reset-password`, { body: {} }).then((x) => setTemp({ nick: s.nickname, pw: x.temporaryPassword }))}>Parola sıfırla</button>
                <button onClick={() => { if (confirm(`${s.nickname} ve tüm verisi kalıcı olarak silinsin mi?`)) void act(() => api(`/api/classrooms/${id}/students/${s.id}`, { method: 'DELETE' }), 'Öğrenci verisi silindi.'); }}>Sil</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}
      <div className="actions">
        <button onClick={() => { if (confirm('Sınıf ve tüm öğrenci verileri kalıcı olarak silinsin mi?')) void api(`/api/classrooms/${id}`, { method: 'DELETE' }).then(onDeleted); }}>Sınıfı ve verilerini sil</button>
      </div>
    </section>
  );
}

function AssignTab({ id, d, r, act }: { id: string; d: Detail; r: Report; act: Act }) {
  const [f, setF] = useState({ title: '', moduleId: 'energy', tasks: tasksOfModule('energy').map((t) => t.id), rw: '', groupId: '', due: '' });
  const setModule = (m: string) => setF({ ...f, moduleId: m, tasks: m ? tasksOfModule(m).map((t) => t.id) : [] });
  const toggle = (t: string) => setF({ ...f, tasks: f.tasks.includes(t) ? f.tasks.filter((x) => x !== t) : [...f.tasks, t] });
  const submit = () => act(() => api(`/api/classrooms/${id}/assignments`, { body: {
    title: f.title, moduleId: f.moduleId || null, taskIds: f.tasks, realWorldTaskId: f.rw || null, groupId: f.groupId || null,
    dueAt: f.due ? new Date(f.due + 'T23:59:00').toISOString() : null } }), 'Görev atandı.');
  const list = f.moduleId ? tasksOfModule(f.moduleId) : TASKS;
  return (
    <section>
      <h3>Yeni görev ata</h3>
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <label>Başlık<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required minLength={2} maxLength={80} /></label>
        <label>Eğitim modülü<select value={f.moduleId} onChange={(e) => setModule(e.target.value)}>
          <option value="">(Modül seçmeden görev seç)</option>{MODULES.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select></label>
        <fieldset><legend>Görevler</legend>
          <div className="check-grid">{list.map((t) => <label key={t.id} className="radio-row"><input type="checkbox" checked={f.tasks.includes(t.id)} onChange={() => toggle(t.id)} /> {t.title}</label>)}</div>
        </fieldset>
        <label>Gerçek dünya görevi (isteğe bağlı)<select value={f.rw} onChange={(e) => setF({ ...f, rw: e.target.value })}>
          <option value="">—</option>{REAL_WORLD_TASKS.map((x) => <option key={x.key} value={x.key}>{x.title}</option>)}
        </select></label>
        <label>Grup<select value={f.groupId} onChange={(e) => setF({ ...f, groupId: e.target.value })}><option value="">Tüm sınıf</option>{d.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
        <label>Son tarih<input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></label>
        <div className="actions"><button className="primary" type="submit" disabled={!f.tasks.length && !f.rw}>Ata</button></div>
      </form>
      <h3>Atanan görevler ve tamamlanma</h3>
      {r.assignments.length === 0 ? <p>Henüz görev atanmadı.</p> : (
        <table className="result">
          <thead><tr><th>Görev</th><th>Son tarih</th><th>Tamamlanma</th><th>Bekleyen</th><th></th></tr></thead>
          <tbody>{r.assignments.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.dueAt ? new Date(a.dueAt).toLocaleDateString('tr-TR') : '–'}{a.overdue && <span className="warn"> (gecikti)</span>}</td>
              <td>{a.completed}/{a.target} <Bar value={a.pct} label="tamamlanma" /></td>
              <td className="hint">{a.pending.slice(0, 6).join(', ')}{a.pending.length > 6 ? '…' : ''}</td>
              <td><button className="link" onClick={() => void act(() => api(`/api/classrooms/${id}/assignments/${a.id}`, { method: 'DELETE' }))}>Sil</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </section>
  );
}

function ProgressTab({ r }: { r: Report }) {
  return (
    <section>
      <h3>Modüller</h3>
      <table className="result">
        <thead><tr><th>Modül</th><th>Başlayan</th><th>Bitiren</th><th>Ort. görev</th><th>Ön → son test</th></tr></thead>
        <tbody>{r.modules.map((m) => (
          <tr key={m.id}><td>{m.name}</td><td><Bar value={m.startedPct} label="başlayan" /></td><td><Bar value={m.completedPct} label="bitiren" /></td><td>{m.avgDone}/{m.tasks}</td>
            <td>{m.pre !== null ? `%${m.pre} → %${m.post} (n=${m.prePostN})` : '–'}</td></tr>
        ))}</tbody>
      </table>
      <h3>Öğrenci ilerleme raporu</h3>
      {r.students.length === 0 ? <p>Henüz öğrenci yok.</p> : (
        <table className="result">
          <thead><tr><th>Takma ad</th><th>Grup</th><th>Görev</th><th>Modül</th><th>Ort. puan</th><th>Gerekçe</th><th>Denge</th><th>Yanılgı</th><th>Son etkinlik</th></tr></thead>
          <tbody>{r.students.map((s) => (
            <tr key={s.id}><td>{s.nickname}</td><td>{s.group ?? '–'}</td><td>{s.completedTasks}</td><td>{s.modulesPlayed}/7</td><td>{s.avgTotal ?? '–'}</td><td>{s.avgReasoning ?? '–'}</td><td>{s.avgBalance ?? '–'}</td><td>{s.misconceptionChoices}</td>
              <td>{s.lastActive ? new Date(s.lastActive).toLocaleString('tr-TR') : '–'}</td></tr>
          ))}</tbody>
        </table>
      )}
      <p className="hint">Puanlar oyun içi değerlendirmedir (sonuç %40, gerekçe %35, denge %25); not değildir.</p>
    </section>
  );
}

function LearningTab({ r }: { r: Report }) {
  const outs = r.outcomes.filter((o) => o.evidence > 0);
  return (
    <section>
      <h3>Öğrenme kazanımı analizi</h3>
      {outs.length === 0 ? <p>Henüz kanıt yok: öğrenciler görev ve değerlendirme tamamladıkça oluşur.</p> : (
        <table className="result"><thead><tr><th>Kazanım</th><th>Düzey</th><th>Kanıt</th></tr></thead>
          <tbody>{outs.map((o) => <tr key={o.id}><td><strong>{o.id}</strong> {o.text}</td><td><Bar value={o.pct} label={o.id} /></td><td>{o.evidence}</td></tr>)}</tbody></table>
      )}
      <h3>Kavram yanılgısı raporu</h3>
      {r.misconceptions.length === 0 ? <p>Yanılgıya işaret eden seçim yok.</p> : (
        <table className="result"><thead><tr><th>Olası yanılgı</th><th>Görev</th><th>Öğrenci</th><th>Gerekçesiz</th><th>Sonra düzeltti</th></tr></thead>
          <tbody>{r.misconceptions.map((m) => <tr key={m.taskId + m.choiceId}><td>{m.text}</td><td>{m.title}</td><td>{m.students}</td><td>{m.withoutReasoning}</td><td>{m.laterCorrected}</td></tr>)}</tbody></table>
      )}
      <h3>Öğrenci karar gerekçeleri (son 100)</h3>
      {r.reasonings.length === 0 ? <p>Henüz gerekçe yok.</p> : (
        <ul className="reason-list">{r.reasonings.map((x, k) => (
          <li key={k}><strong>{x.nickname}</strong> · {x.title} · “{x.choice}”{x.misconception && <span className="warn"> (yanılgı riski)</span>}<br />
            <q>{x.reasoning}</q> <span className="hint">gerekçe puanı {x.reasoningScore ?? '–'}</span></li>
        ))}</ul>
      )}
    </section>
  );
}

function FieldTab({ id, r, act }: { id: string; r: Report; act: Act }) {
  const [f, setF] = useState({ taskKey: REAL_WORLD_TASKS[0].key as string, phase: 'BASELINE', value: '', note: '' });
  return (
    <section>
      <p className="notice">Bu bölümdeki değerler <span className="tag measured">Ölçülmüş</span> verilerdir. Başlangıç ve sonuç farkı tek başına çevresel fayda kanıtı değildir; ölçüm koşullarını not edin.</p>
      <table className="result"><thead><tr><th>Etkinlik</th><th>Birim</th><th>Başlangıç</th><th>Sonuç</th><th>Fark</th><th>n</th></tr></thead>
        <tbody>{r.realWorld.map((x) => <tr key={x.key}><td>{x.title}</td><td>{x.unit}</td><td>{x.baseline ?? '–'}</td><td>{x.followup ?? '–'}</td><td>{x.change ?? '–'}</td><td>{x.nBaseline}/{x.nFollowup}</td></tr>)}</tbody></table>
      <h3>Sınıf ölçümü ekle</h3>
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); void act(() => api(`/api/classrooms/${id}/measurements`, { body: { taskKey: f.taskKey, phase: f.phase, value: Number(f.value), note: f.note || undefined } }), 'Ölçüm kaydedildi.').then(() => setF({ ...f, value: '', note: '' })); }}>
        <select aria-label="Etkinlik" value={f.taskKey} onChange={(e) => setF({ ...f, taskKey: e.target.value })}>{REAL_WORLD_TASKS.map((x) => <option key={x.key} value={x.key}>{x.title} ({x.unit})</option>)}</select>
        <select aria-label="Aşama" value={f.phase} onChange={(e) => setF({ ...f, phase: e.target.value })}><option value="BASELINE">Başlangıç</option><option value="FOLLOWUP">Sonuç</option></select>
        <input aria-label="Değer" type="number" min={0} step="0.01" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} required />
        <input aria-label="Not" placeholder="Not (koşullar, kişisel bilgi yok)" maxLength={200} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <button type="submit">Kaydet</button>
      </form>
    </section>
  );
}

function ReportsTab({ id, r }: { id: string; r: Report }) {
  const [advice, setAdvice] = useState<{ source: string; advice: { summary: string; gaps: string[]; activities: { key: string; why: string }[] } } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section>
      <h3>Toplu sınıf raporu</h3>
      <p>{r.studentsCount} öğrenci · {r.assignments.length} atanmış görev</p>
      <div className="actions left">
        <a className="button" href={`/api/classrooms/${id}/report.csv`} download>CSV indir (Excel)</a>
        <a className="button" href={`/api/classrooms/${id}/report.pdf`} download>PDF indir</a>
      </div>
      <ul className="hint">{r.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      <h3>Yapay zekâ öğretmen asistanı</h3>
      <p className="hint">Yalnızca anonim, toplu sınıf verisi gönderilir (takma ad dahil öğrenci kimliği gitmez).</p>
      <button disabled={busy} onClick={() => { setBusy(true); void api<typeof advice>(`/api/classrooms/${id}/ai-advice`, { body: {} }).then(setAdvice).finally(() => setBusy(false)); }}>{busy ? 'Hazırlanıyor…' : 'Öneri oluştur'}</button>
      {advice && (
        <div className="tutor">
          <p className="source">{advice.source === 'ai' ? 'Dil modeli önerisi (doğrulandı)' : 'Kural tabanlı öneri (model servisi yok veya yanıt doğrulanamadı)'}</p>
          <p>{advice.advice.summary}</p>
          {advice.advice.gaps.length > 0 && <><strong>Öğrenme eksikleri</strong><ul>{advice.advice.gaps.map((g) => <li key={g}>{g}</li>)}</ul></>}
          <strong>Etkinlik önerileri</strong>
          <ul>{advice.advice.activities.map((a) => <li key={a.key}>{REAL_WORLD_TASKS.find((x) => x.key === a.key)?.title}: {a.why}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
