import { useSyncExternalStore } from 'react';
import { api, ApiError } from '../api/client';
import { authStore } from './authStore';
import { gameStore, type AttemptEvent } from './gameStore';

/**
 * Sunucu eşitlemesi: girişli kullanıcıda ilerleme otomatik kaydedilir. Ağ kesilirse oyun yerelde devam eder,
 * bekleyen kayıt ve denemeler kuyrukta tutulur ve bağlantı gelince gönderilir (veri kaybı yok).
 */
export type SyncStatus = 'guest' | 'idle' | 'saving' | 'saved' | 'offline' | 'error';
type S = { status: SyncStatus; version: number; lastSaved: number | null };
let st: S = { status: 'guest', version: 0, lastSaved: null };
const ls = new Set<() => void>();
const setS = (p: Partial<S>) => { st = { ...st, ...p }; ls.forEach((l) => l()); };
export const useSync = () => useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l); }, () => st);

const QKEY = 'yarinlab.syncQueue.v2';
type QItem = { url: string; body: unknown };
const store = () => (globalThis as { localStorage?: Storage }).localStorage;
const readQ = (): QItem[] => { try { return JSON.parse(store()?.getItem(QKEY) ?? '[]'); } catch { return []; } };
const writeQ = (q: QItem[]) => { try { store()?.setItem(QKEY, JSON.stringify(q.slice(-300))); } catch { /* dolu */ } };

let timer: ReturnType<typeof setTimeout> | null = null;
let dirty = false;
const loggedIn = () => !!authStore.get().user;

async function pushSave(): Promise<void> {
  if (!loggedIn()) return;
  const state = gameStore.exportSave();
  if (!state) return;
  setS({ status: 'saving' });
  try {
    const r = await api<{ version: number }>('/api/save', { method: 'PUT', body: { version: st.version, state } });
    dirty = false;
    setS({ status: 'saved', version: r.version, lastSaved: Date.now() });
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      // Aynı kullanıcı başka sekmede/cihazda kaydetmiş: en son yerel eylem kazanır, sürüm güncellenip yeniden yazılır.
      try {
        const cur = await api<{ save: { version: number } | null }>('/api/save');
        setS({ version: cur.save?.version ?? 0 });
        return pushSave();
      } catch { /* aşağıda */ }
    }
    dirty = true;
    setS({ status: e instanceof ApiError ? 'error' : 'offline' });
  }
}

async function flushAttempts() {
  if (!loggedIn()) return;
  let q = readQ();
  while (q.length) {
    try {
      await api(q[0].url, { method: 'POST', body: q[0].body });
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) { /* geçersiz kayıt: at */ } else return;
    }
    q = q.slice(1);
    writeQ(q);
  }
}

const schedule = () => {
  dirty = true;
  if (!loggedIn()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; void pushSave(); }, 1200);
};

/** Girişte: sunucudaki kayıt varsa ve yerelde ilerleme yoksa sunucudakini yükle; yoksa yereli gönder. */
async function onLogin() {
  try {
    const r = await api<{ save: { version: number; state: unknown } | null }>('/api/save');
    if (r.save) {
      setS({ version: r.save.version });
      if (!gameStore.hasSave()) gameStore.importSave(r.save.state);
      else await pushSave();
    } else {
      setS({ version: 0 });
      if (gameStore.hasSave()) await pushSave();
      else setS({ status: 'idle' });
    }
    await flushAttempts();
  } catch {
    setS({ status: 'offline' });
  }
}

/** Sunucuya gidecek kaydı kuyruğa ekler; çevrim dışıysa bağlantı gelince gönderilir. */
export function enqueue(url: string, body: unknown) {
  writeQ([...readQ(), { url, body }]);
  void flushAttempts();
}

let started = false;
export function startSaveSync() {
  if (started) return;
  started = true;
  gameStore.onPersist(schedule);
  gameStore.onAttempt((a: AttemptEvent) => enqueue('/api/attempts', a));
  let prevUser = authStore.get().user?.id;
  authStore.subscribe(() => {
    const u = authStore.get().user?.id;
    if (u === prevUser) return;
    prevUser = u;
    if (u) void onLogin();
    else setS({ status: 'guest', version: 0 });
  });
  if (prevUser) void onLogin();
  globalThis.addEventListener?.('online', () => { if (dirty) void pushSave(); void flushAttempts(); });
}

export const syncLabel = (s: SyncStatus) => ({
  guest: 'Misafir: ilerleme bu cihazda', idle: 'Kayıt hazır', saving: 'Kaydediliyor…', saved: 'Kaydedildi ✓',
  offline: 'Çevrim dışı: bu cihazda saklandı', error: 'Kayıt hatası: yeniden denenecek',
})[s];
