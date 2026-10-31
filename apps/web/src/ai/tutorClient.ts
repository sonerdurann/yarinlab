import { fallbackForResult, type TutorResponse } from './fallbackResponses';
import type { DecisionResult } from '../state/types';
import { playableById } from '../data/scenarios';
import { authStore } from '../state/authStore';
import { validateTutorResponse as validateShared } from '@yarinlab/shared';

/** Kılavuz §18: 5-8 sn ağ gecikmesinde yedek; sunucu 6 sn, istemci +1 sn bekler. */
export const AI_TIMEOUT_MS = 6000;

export type TutorOutcome = { source: 'ai' | 'fallback'; response: TutorResponse };

/** Doğrulama ortak pakette: şema, sayılar, kaynaklar, çocuk güvenliği (packages/shared/src/ai/feedback.ts). */
export function validateTutorResponse(x: unknown, r: DecisionResult): x is TutorResponse {
  return validateShared(x, { scenarioId: r.scenarioId, choiceId: r.choiceId, before: r.before, after: r.after }, playableById(r.scenarioId).evidenceRefs);
}
export { allowedNumbers } from '@yarinlab/shared';

/**
 * Girişli kullanıcıda sunucudaki yapay zekâ öğretmeni (/api/ai/tutor) çağrılır; anahtar yalnızca sunucudadır.
 * Misafirde, zaman aşımında, ağ hatasında veya doğrulama başarısızsa hazır geri bildirim döner (oyun AI olmadan da biter).
 * Sunucu yanıtı istemcide de yeniden doğrulanır (savunma derinliği).
 */
export async function getTutorFeedback(result: DecisionResult, fetchImpl: typeof fetch = globalThis.fetch): Promise<TutorOutcome> {
  const fallback: TutorOutcome = { source: 'fallback', response: fallbackForResult(result) };
  if (!authStore.get().user || !fetchImpl) return fallback;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS + 1000);
  try {
    const res = await fetchImpl('/api/ai/tutor', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      // Yalnızca motor sonucu, görev kimliği ve gerekçe gider; ad veya iletişim bilgisi yok.
      body: JSON.stringify({ scenarioId: result.scenarioId, choiceId: result.choiceId, before: result.before, after: result.after, reasoning: result.reasoning }),
      signal: ctrl.signal,
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { source?: string; response?: unknown };
    if (json.source === 'ai' && validateTutorResponse(json.response, result)) return { source: 'ai', response: json.response };
    return fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
