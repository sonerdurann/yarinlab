/** Oyuncu avatarı (prompt §4): ten tonu, saç modeli ve rengi, kıyafet rengi, aksesuar. Kayda yazılır. */
export type AvatarLook = { skin: number; hair: number; hairColor: number; outfit: number; acc: 'none' | 'glasses' | 'cap' | 'headband' };
export type Profile = { avatar: AvatarLook; nickname: string; chosen: boolean };
export const DEFAULT_AVATAR: AvatarLook = { skin: 2, hair: 1, hairColor: 0, outfit: 0, acc: 'none' };
export const DEFAULT_PROFILE: Profile = { avatar: DEFAULT_AVATAR, nickname: '', chosen: false };

export const SKIN = ['#f9dcc4', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'];
export const HAIR_COLOR = ['#2b1b10', '#5a3825', '#b5651d', '#e6be8a', '#243447'];
export const OUTFIT = ['#26b887', '#41c9d1', '#f6c453', '#ef795e', '#7a6fd6', '#243447'];
export const HAIR_STYLES = ['Kısa', 'Dalgalı', 'At kuyruğu', 'Kıvırcık', 'Örgü'];
export const ACCESSORIES: { id: AvatarLook['acc']; label: string }[] = [
  { id: 'none', label: 'Yok' }, { id: 'glasses', label: 'Gözlük' }, { id: 'cap', label: 'Şapka' }, { id: 'headband', label: 'Saç bandı' },
];

const inRange = (v: unknown, n: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) < n ? (v as number) : 0);
export function sanitizeProfile(p: unknown): Profile {
  if (!p || typeof p !== 'object') return DEFAULT_PROFILE;
  const o = p as Partial<Profile>;
  const a = (o.avatar ?? {}) as Partial<AvatarLook>;
  return {
    avatar: {
      skin: inRange(a.skin, SKIN.length), hair: inRange(a.hair, HAIR_STYLES.length), hairColor: inRange(a.hairColor, HAIR_COLOR.length),
      outfit: inRange(a.outfit, OUTFIT.length), acc: ACCESSORIES.some((x) => x.id === a.acc) ? a.acc! : 'none',
    },
    nickname: typeof o.nickname === 'string' ? o.nickname.replace(/[<>]/g, '').slice(0, 20) : '',
    chosen: o.chosen === true,
  };
}

