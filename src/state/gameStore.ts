import { useSyncExternalStore } from 'react';
import { hotspotById } from '../game/tiles/hotspots';

export type GameState = {
  selectedHotspotId: string | null;
  notice: string | null;
};

let state: GameState = { selectedHotspotId: null, notice: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<GameState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

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
    if (h.locked) set({ selectedHotspotId: null, notice: `${h.label}: Henüz açılmadı (Yakında)` });
    else set({ selectedHotspotId: id, notice: null });
  },
  closePanel: () => set({ selectedHotspotId: null }),
  clearNotice: () => set({ notice: null }),
};

export function useGameState(): GameState {
  return useSyncExternalStore(gameStore.subscribe, gameStore.get);
}
