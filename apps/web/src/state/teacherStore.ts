import { useSyncExternalStore } from 'react';
import { validateSchoolMeasure, type SchoolMeasure } from '../teacher/report';

const KEY = 'yarinlab.teacher.v1';

export type TeacherState = {
  teacherOpen: boolean;
  sourcesOpen: boolean;
  /** Örnek (DEMO) öğrenci kayıtları gösterilsin mi */
  demoVisible: boolean;
  /** Öğretmenin girdiği gerçek okul ölçümü (yerel kayıt) */
  schoolMeasure: SchoolMeasure | null;
  /** Anonim kurum kodu. Yalnızca bu tarayıcıda durur; öğrenci adı değildir. */
  classCode: string;
};

const cleanCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

/** Yerel saklama: bozuk/yasak depolama durumunda sessizce bellekte çalışır. */
function load(): Pick<TeacherState, 'demoVisible' | 'schoolMeasure' | 'classCode'> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as { demoVisible?: unknown; schoolMeasure?: unknown; classCode?: unknown };
      return {
        demoVisible: p.demoVisible !== false,
        schoolMeasure: p.schoolMeasure ? validateSchoolMeasure(p.schoolMeasure as SchoolMeasure) : null,
        classCode: typeof p.classCode === 'string' ? cleanCode(p.classCode) : '',
      };
    }
  } catch {
    /* depolama yok veya bozuk */
  }
  return { demoVisible: true, schoolMeasure: null, classCode: '' };
}

let state: TeacherState = { teacherOpen: false, sourcesOpen: false, ...load() };
const listeners = new Set<() => void>();
const set = (patch: Partial<TeacherState>) => {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify({ demoVisible: state.demoVisible, schoolMeasure: state.schoolMeasure, classCode: state.classCode }));
  } catch {
    /* yoksay */
  }
  listeners.forEach((l) => l());
};

export const teacherStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  openTeacher: () => set({ teacherOpen: true }),
  closeTeacher: () => set({ teacherOpen: false }),
  openSources: () => set({ sourcesOpen: true }),
  closeSources: () => set({ sourcesOpen: false }),
  /** Geçersiz giriş kaydedilmez; false döner. */
  saveMeasure(m: { totalKg: unknown; students: unknown; days: unknown }) {
    const v = validateSchoolMeasure(m);
    if (!v) return false;
    set({ schoolMeasure: v });
    return true;
  },
  clearMeasure: () => set({ schoolMeasure: null }),
  /** T09: örnek öğrenci verisini ve girilen ölçümü sıfırla. */
  resetDemo: () => set({ demoVisible: false, schoolMeasure: null }),
  restoreDemo: () => set({ demoVisible: true }),
  /** Harf ve rakam, en fazla 12. Boş kod serbesttir. */
  setClassCode: (raw: string) => set({ classCode: cleanCode(raw) }),
};

export function useTeacherState(): TeacherState {
  return useSyncExternalStore(teacherStore.subscribe, teacherStore.get);
}
