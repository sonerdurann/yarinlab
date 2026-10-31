import { useSyncExternalStore } from 'react';

/** Öğretmen paneli ve kaynaklar penceresinin açık/kapalı durumu. Veriler sunucudan gelir (DEMO veri yok). */
export type TeacherState = { teacherOpen: boolean; sourcesOpen: boolean };
let state: TeacherState = { teacherOpen: false, sourcesOpen: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<TeacherState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };

export const teacherStore = {
  get: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  openTeacher: () => set({ teacherOpen: true }),
  closeTeacher: () => set({ teacherOpen: false }),
  openSources: () => set({ sourcesOpen: true }),
  closeSources: () => set({ sourcesOpen: false }),
};
export const useTeacherState = () => useSyncExternalStore(teacherStore.subscribe, teacherStore.get);
