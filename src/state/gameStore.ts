import { useSyncExternalStore } from 'react';
import { hotspotById } from '../game/tiles/hotspots';
import { food } from '../data/scenarios';
import { runDecision } from '../game/systems/DecisionEngine';
import type { DecisionResult, Resources } from './types';

export type GameState = {
  selectedHotspotId: string | null;
  notice: string | null;
  /** Kantin karar paneli açık mı */
  decisionOpen: boolean;
  /** Kantin görevi ziyaret edildi mi (adım 1) */
  canteenVisited: boolean;
  /** Seçili ama henüz değerlendirilmemiş seçenek */
  pendingChoiceId: string | null;
  /** Gerekçe: hazır seçenek veya kısa yazı */
  reasoningOption: string | null;
  reasoningText: string;
  transferAnswer: string;
  /** Güncel değerlendirme sonucu */
  result: DecisionResult | null;
  /** Aynı başlangıç koşullarında denenen tüm kararlar */
  history: DecisionResult[];
  /** Ortak dünya durumu: değerlendirmeden sonra `after`, tekrar denemede baseline */
  world: Resources;
};

const initial = (): GameState => ({
  selectedHotspotId: null,
  notice: null,
  decisionOpen: false,
  canteenVisited: false,
  pendingChoiceId: null,
  reasoningOption: null,
  reasoningText: '',
  transferAnswer: '',
  result: null,
  history: [],
  world: { ...food.baseline },
});

let state: GameState = initial();
const listeners = new Set<() => void>();
const set = (patch: Partial<GameState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export type TaskStep = { id: string; label: string; done: boolean };

/** Kılavuz §20 görev tamamlama şartları + §09 sol panel adımları. */
export function taskSteps(s: GameState): TaskStep[] {
  const distinct = new Set(s.history.map((h) => h.choiceId)).size;
  return [
    { id: 'inspect', label: 'Kantini incele', done: s.canteenVisited },
    { id: 'choose', label: 'Porsiyon seç', done: s.history.length > 0 },
    { id: 'explain', label: 'Kararını açıkla', done: s.history.some((h) => !!h.reasoning) },
    { id: 'compare', label: 'Geleceği karşılaştır', done: distinct >= 2 },
    { id: 'transfer', label: 'Simülasyon ≠ gerçek ölçüm', done: s.transferAnswer.trim().length > 0 },
  ];
}
export const isTaskComplete = (s: GameState) => taskSteps(s).every((t) => t.done);

/** React ve Phaser arasındaki ortak state adapter (kılavuz §09; EventBus yok). */
export const gameStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  selectHotspot(id: string) {
    const h = hotspotById(id);
    if (!h) return;
    if (h.locked) return set({ selectedHotspotId: null, notice: `${h.label}: Henüz açılmadı (Yakında)` });
    if (id === 'canteen') return set({ selectedHotspotId: id, notice: null, decisionOpen: true, canteenVisited: true });
    set({ selectedHotspotId: id, notice: null });
  },
  closePanel: () => set({ selectedHotspotId: null }),
  clearNotice: () => set({ notice: null }),
  openDecision: () => set({ decisionOpen: true, canteenVisited: true }),
  closeDecision: () => set({ decisionOpen: false, selectedHotspotId: null }),
  pickChoice: (id: string) => set({ pendingChoiceId: id }),
  setReasoningOption: (v: string | null) => set({ reasoningOption: v }),
  setReasoningText: (v: string) => set({ reasoningText: v.slice(0, 280) }),
  setTransferAnswer: (v: string) => set({ transferAnswer: v.slice(0, 280) }),
  /** Seçmeden simülasyon başlatılamaz. */
  evaluate() {
    if (!state.pendingChoiceId) return;
    const reasoning = state.reasoningText.trim() || state.reasoningOption || undefined;
    const result = runDecision(food, state.pendingChoiceId, reasoning);
    set({ result, history: [...state.history, result], world: result.after });
  },
  /** "Tekrar dene": aynı başlangıç koşullarına dön, başka karar dene. */
  retry: () => set({ result: null, pendingChoiceId: null, reasoningOption: null, reasoningText: '', world: { ...food.baseline } }),
  /** Yeni oturum: örnek öğrenci verisi sıfırlanır (T09). */
  resetSession: () => {
    state = initial();
    listeners.forEach((l) => l());
  },
};

export function useGameState(): GameState {
  return useSyncExternalStore(gameStore.subscribe, gameStore.get);
}
