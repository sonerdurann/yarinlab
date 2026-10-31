import { useSyncExternalStore } from 'react';
import { api, type ApiUser } from '../api/client';

export type AuthState = { user: ApiUser | null; checked: boolean; open: boolean; offline: boolean };
let state: AuthState = { user: null, checked: false, open: false, offline: false };
const listeners = new Set<() => void>();
const set = (p: Partial<AuthState>) => { state = { ...state, ...p }; listeners.forEach((l) => l()); };

export const authStore = {
  get: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  open: () => set({ open: true }),
  close: () => set({ open: false }),
  setUser: (user: ApiUser | null) => set({ user, open: false }),
  async refresh() {
    try {
      const r = await api<{ user: ApiUser | null }>('/api/auth/me');
      set({ user: r.user, checked: true, offline: false, open: !r.user && !state.open ? true : state.open });
    } catch {
      set({ checked: true, offline: true }); // sunucu yok: çevrim dışı oynanabilir
    }
  },
  async logout() {
    try { await api('/api/auth/logout', { method: 'POST', body: {} }); } catch { /* yoksay */ }
    set({ user: null });
  },
};
export const useAuth = () => useSyncExternalStore(authStore.subscribe, authStore.get);
