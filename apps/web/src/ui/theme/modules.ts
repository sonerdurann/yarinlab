import type { ModuleId } from '@yarinlab/shared';

/** Her modülün karakteri, rengi ve simgesi (çocuk dostu kimlik). Karakterler kurgusaldır. */
export type ModuleTheme = { id: ModuleId; emoji: string; color: string; soft: string; character: string; avatar: string; hello: string };
export const MODULE_THEME: Record<ModuleId, ModuleTheme> = {
  energy: { id: 'energy', emoji: '⚡', color: '#c97a00', soft: '#fff1cc', character: 'Mühendis Ece', avatar: '👩‍🔧', hello: 'Güneş, rüzgâr ve batarya… Işıkları gece de açık tutabilir miyiz?' },
  carbon: { id: 'carbon', emoji: '🔍', color: '#7a4fd6', soft: '#efe8ff', character: 'Dedektif Kerem', avatar: '🕵️', hello: 'Her ürünün bir hikâyesi var. İpuçlarını birlikte inceleyelim!' },
  city: { id: 'city', emoji: '🏙️', color: '#d1492b', soft: '#ffe7e0', character: 'Başkan Defne', avatar: '👩‍💼', hello: 'Sel, sıcak ve kuraklığa hazır bir şehir kuralım. Kimse geride kalmasın!' },
  food: { id: 'food', emoji: '🍎', color: '#1f8a4c', soft: '#dff5e7', character: 'Aşçı Ayla', avatar: '👩‍🍳', hello: 'Mutfakta tek bir lokma bile boşa gitmesin. Hazır mısın?' },
  ocean: { id: 'ocean', emoji: '🐢', color: '#1769b8', soft: '#e0efff', character: 'Kaptan Deniz', avatar: '🧑‍✈️', hello: 'Kaplumbağalar bize güveniyor. Kıyıyı birlikte koruyalım!' },
  waste: { id: 'waste', emoji: '♻️', color: '#0f8585', soft: '#dcf4f4', character: 'Tamirci Can', avatar: '🧑‍🔧', hello: 'Atmadan önce düşün: onarabilir miyiz, yeniden kullanabilir miyiz?' },
  council: { id: 'council', emoji: '🏛️', color: '#4b4bc4', soft: '#e8e8ff', character: 'Meclis Başkanı Umut', avatar: '🧑‍⚖️', hello: 'Herkesin sesini dinleyip kanıtlarla karar verme zamanı!' },
};
export const themeOf = (scenarioOrModule: string) => MODULE_THEME[(scenarioOrModule.split('_')[0] as ModuleId)] ?? MODULE_THEME.council;

/** Görev yıldızı: en iyi karar puanından (öğrenciyi zorlamaz; tekrar denemek serbesttir). */
export const starsFor = (total: number | undefined) => (total === undefined ? 0 : total >= 80 ? 3 : total >= 60 ? 2 : 1);
