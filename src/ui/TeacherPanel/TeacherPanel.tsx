import { useMemo, useState } from 'react';
import { DEMO_LABEL, DEMO_STUDENTS } from '../../data/teacherDemo';
import { food } from '../../data/scenarios';
import { perStudentPerDay, summarize } from '../../teacher/report';
import { gameStore, isTaskComplete, useGameState } from '../../state/gameStore';
import { teacherStore, useTeacherState } from '../../state/teacherStore';
import { Modal } from '../Modal/Modal';

const fmt = (n: number | null, unit = '') => (n === null ? '–' : `${n.toLocaleString('tr-TR')}${unit}`);

/** Öğretmen yönetim ekranı (kılavuz §12, Ekran 04). Örnek veriler DEMO VERİSİ olarak etiketlenir. */
export function TeacherPanel() {
  const t = useTeacherState();
  const g = useGameState();
  const [form, setForm] = useState({ totalKg: '', students: '', days: '' });
  const [formError, setFormError] = useState('');
  const demo = useMemo(() => summarize(t.demoVisible ? DEMO_STUDENTS : []), [t.demoVisible]);

  if (!t.teacherOpen) return null;
  const m = t.schoolMeasure;
  const distinctTried = new Set(g.history.map((h) => h.choiceId)).size;

  const save = () => {
    const ok = teacherStore.saveMeasure(form);
    setFormError(ok ? '' : 'Geçerli sayılar gir: toplam kg ≥ 0, öğrenci ve gün sayısı pozitif tam sayı.');
  };

  return (
    <Modal titleId="tp-title" title="Öğretmen paneli" onClose={teacherStore.closeTeacher} wide>
      {t.demoVisible && <p className="demo-badge">{DEMO_LABEL} – gerçek öğrenci verisi değildir</p>}

      <h3>Sınıf özeti</h3>
      <div className="cards">
        <div className="card"><span>Katılan öğrenci</span><strong>{fmt(demo.joined)}</strong></div>
        <div className="card"><span>Tamamlanan görev</span><strong>{fmt(demo.completed)}</strong></div>
        <div className="card"><span>Ön / son test (ayrı sorular, ham puan /5)</span><strong>{fmt(demo.avgPre)} → {fmt(demo.avgPost)}</strong></div>
      </div>
      {t.demoVisible && demo.avgGain !== null && (
        <p className="hint">Ortalama ham puan farkı {fmt(demo.avgGain)}. Ön ve son test farklı soru setleridir; fark zorluk dengesine bağlıdır ve etki iddiası değildir.</p>
      )}

      <h3>Öğrenme göstergeleri</h3>
      <ul className="indicators">
        <li>
          <strong>Atık ölçümü:</strong>{' '}
          {m ? `${fmt(perStudentPerDay(m))} kg/öğrenci/gün (öğretmen girdisi: ${fmt(m.totalKg)} kg, ${m.students} öğrenci, ${m.days} gün)` : 'Henüz gerçek okul ölçümü girilmedi (aşağıdan ekle).'}
        </li>
        <li>
          <strong>Gerekçe kalitesi:</strong> {fmt(demo.avgRationale)} / 3 (öğretmen rubriği; AI çıktısı yalnızca öneridir, inceleme size açıktır)
        </li>
        <li>
          <strong>Karar dengesi:</strong> {demo.completed ? `${demo.balanced}/${demo.completed} öğrenci en az iki seçeneği denedi` : '–'}
          {demo.completed > 0 && (
            <span className="hint"> · Seçim dağılımı: {Object.entries(demo.choiceCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
          )}
        </li>
      </ul>

      <h3>Bu cihazdaki gerçek oturum</h3>
      <p>
        Denenen karar: <strong>{g.history.length}</strong> (farklı seçenek: {distinctTried}) · Gerekçe yazıldı: {g.history.some((h) => h.reasoning) ? 'evet' : 'hayır'} · Görev:{' '}
        {isTaskComplete(g) ? 'tamamlandı' : 'sürüyor'}
      </p>
      {g.history.length > 0 && (
        <table className="result">
          <caption className="sr-only">Bu oturumdaki kararlar ve gerekçeler</caption>
          <thead>
            <tr><th scope="col">Seçenek</th><th scope="col">Gerekçe</th><th scope="col">Rehber kaynağı</th></tr>
          </thead>
          <tbody>
            {g.history.map((h, i) => (
              <tr key={i}>
                <th scope="row">{h.choiceId} · {food.choices.find((c) => c.id === h.choiceId)?.label}</th>
                <td>{h.reasoning ?? '–'}</td>
                <td>{i === g.history.length - 1 && g.tutor.outcome ? (g.tutor.outcome.source === 'ai' ? 'AI (inceleme gerekir)' : 'Hazır geri bildirim') : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {t.demoVisible && (
        <>
          <h3>Örnek karar gerekçeleri</h3>
          <table className="result">
            <caption className="sr-only">Örnek (DEMO) öğrenci gerekçeleri</caption>
            <thead>
              <tr><th scope="col">Kod</th><th scope="col">Karar</th><th scope="col">Gerekçe</th><th scope="col">Tür</th><th scope="col">Rubrik</th></tr>
            </thead>
            <tbody>
              {DEMO_STUDENTS.filter((s) => s.completed).slice(0, 6).map((s) => (
                <tr key={s.code}>
                  <th scope="row">{s.code}</th>
                  <td>{s.choiceId}</td>
                  <td>{s.reasoning}</td>
                  <td>{s.reasoningKind === 'option' ? 'seçenek' : 'yazı'}</td>
                  <td>{s.rationaleScore}/3</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3>Gerçek okul görevi: ölçüm girişi</h3>
      <p className="hint">Yalnızca toplam kg, öğrenci sayısı ve gün sayısı. Ad, fotoğraf veya konum girme. Veri bu cihazda yerel saklanır.</p>
      <div className="measure-form">
        <label>Toplam atık (kg)<input inputMode="decimal" value={form.totalKg} onChange={(e) => setForm({ ...form, totalKg: e.target.value })} /></label>
        <label>Öğrenci sayısı<input inputMode="numeric" value={form.students} onChange={(e) => setForm({ ...form, students: e.target.value })} /></label>
        <label>Gün sayısı<input inputMode="numeric" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></label>
        <button onClick={save}>Ölçümü kaydet</button>
      </div>
      {formError && <p role="alert" className="error">{formError}</p>}
      <p className="notice">Simülasyon sonuçları ile bu gerçek ölçüm ayrı gösterilir; birbirinin yerine geçmez.</p>

      <table className="result sources-table">
        <caption>İlk rapor alanları: kaynak ve doğrulama</caption>
        <thead>
          <tr><th scope="col">Alan</th><th scope="col">Kaynak</th><th scope="col">Doğrulama</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Oturum sayısı</th><td>Anonim/yerel oyun oturumu</td><td>Çift sayım kontrolü (aynı kod bir kez)</td></tr>
          <tr><th scope="row">Öğrenme ön/son testi</th><td>Ayrı soru setleri</td><td>Güçlük dengesi; ham puanla ver</td></tr>
          <tr><th scope="row">Karar gerekçesi</th><td>Öğrenci cevabı veya seçenek</td><td>AI çıktısı öğretmen incelemesine açık</td></tr>
          <tr><th scope="row">Gerçek okul görevi</th><td>Öğretmenin girdiği toplam veri</td><td>Kişisel fotoğraf/konum istenmez</td></tr>
        </tbody>
      </table>

      <div className="actions">
        <button onClick={() => { teacherStore.resetDemo(); gameStore.resetSession(); }}>Örnek veriyi sıfırla</button>
        {!t.demoVisible && <button onClick={teacherStore.restoreDemo}>Örnek veriyi geri yükle</button>}
        <button className="primary" onClick={teacherStore.closeTeacher}>Kapat</button>
      </div>
    </Modal>
  );
}
