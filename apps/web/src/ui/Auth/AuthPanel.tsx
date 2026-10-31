import { useState, type FormEvent } from 'react';
import { Modal } from '../Modal/Modal';
import { api, errorText, type ApiUser } from '../../api/client';
import { authStore, useAuth } from '../../state/authStore';

type Mode = 'student-login' | 'student-register' | 'teacher-login' | 'teacher-register';
const TITLES: Record<Mode, string> = {
  'student-login': 'Öğrenci girişi', 'student-register': 'Öğrenci kaydı',
  'teacher-login': 'Öğretmen girişi', 'teacher-register': 'Öğretmen kaydı',
};

/** Giriş ve hesap yönetimi. Öğrenciden e-posta, ad-soyad veya fotoğraf istenmez (veri minimizasyonu). */
export function AuthPanel() {
  const { open, user, offline } = useAuth();
  const [mode, setMode] = useState<Mode>('student-login');
  const [f, setF] = useState({ classCode: '', nickname: '', password: '', email: '', displayName: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  if (user) {
    return (
      <Modal titleId="auth-title" title="Hesabım" onClose={authStore.close}>
        <p>Giriş yapan: <strong>{user.displayName}</strong> ({user.role === 'TEACHER' ? 'öğretmen' : 'öğrenci'})</p>
        <div className="actions">
          <button onClick={() => void authStore.logout().then(authStore.close)}>Çıkış yap</button>
          <button className="primary" onClick={authStore.close}>Tamam</button>
        </div>
      </Modal>
    );
  }

  const isTeacher = mode.startsWith('teacher');
  const isRegister = mode.endsWith('register');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const path = `/api/auth/${isTeacher ? 'teacher' : 'student'}/${isRegister ? 'register' : 'login'}`;
      const body = isTeacher
        ? { email: f.email, password: f.password, ...(isRegister ? { displayName: f.displayName } : {}) }
        : { classCode: f.classCode, nickname: f.nickname, password: f.password };
      const r = await api<{ user: ApiUser }>(path, { body });
      authStore.setUser(r.user);
    } catch (x) { setErr(errorText(x)); } finally { setBusy(false); }
  };

  return (
    <Modal titleId="auth-title" title={TITLES[mode]} onClose={authStore.close}>
      <div role="tablist" className="tabs" aria-label="Hesap türü">
        {(['student-login', 'student-register', 'teacher-login', 'teacher-register'] as Mode[]).map((m) => (
          <button key={m} role="tab" aria-selected={m === mode} onClick={() => { setMode(m); setErr(''); }}>{TITLES[m]}</button>
        ))}
      </div>
      {offline && <p role="status">Sunucuya ulaşılamıyor; hesapsız (çevrim dışı) oynayabilirsin, ilerleme bu cihazda kalır.</p>}
      <form onSubmit={submit} className="auth-form">
        {isTeacher ? (
          <>
            {isRegister && <label>Ad Soyad<input required minLength={2} value={f.displayName} onChange={set('displayName')} autoComplete="name" /></label>}
            <label>E-posta<input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
          </>
        ) : (
          <>
            <label>Sınıf kodu (öğretmenin verir)<input required maxLength={6} value={f.classCode} onChange={set('classCode')} autoCapitalize="characters" autoComplete="off" /></label>
            <label>Takma ad (gerçek adını yazma)<input required minLength={3} maxLength={20} value={f.nickname} onChange={set('nickname')} autoComplete="off" /></label>
          </>
        )}
        <label>Parola<input required type="password" minLength={isTeacher ? 8 : 6} value={f.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} /></label>
        {err && <p role="alert" className="form-error">{err}</p>}
        <div className="actions">
          <button type="button" onClick={authStore.close}>Hesapsız devam et</button>
          <button className="primary" type="submit" disabled={busy}>{busy ? 'Bekle…' : isRegister ? 'Kaydol' : 'Giriş yap'}</button>
        </div>
      </form>
    </Modal>
  );
}
