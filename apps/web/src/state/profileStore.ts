import { gameStore, useGameState } from './gameStore';
import { sanitizeProfile, type Profile } from './profile';

export * from './profile';

export const profileStore = {
  get: () => gameStore.get().profile,
  save: (p: Profile) => gameStore.setProfile(sanitizeProfile({ ...p, chosen: true })),
};
export const useProfile = () => useGameState().profile;
