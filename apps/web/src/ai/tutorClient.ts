import { fallbackForResult, type TutorResponse } from './fallbackResponses';
import type { DecisionResult } from '../state/types';
import { playableById } from '../data/scenarios';
import { validateTutorResponse as validateShared } from '@yarinlab/shared';

/** Kılavuz §18: 5-8 sn ağ gecikmesinde fallback; burada 6 sn. */
export const AI_TIMEOUT_MS = 6000;

export type TutorOutcome = { source: 'ai' | 'fallback'; response: TutorResponse };

/** Doğrulama ortak pakette: şema, sayılar, kaynaklar, çocuk güvenliği (packages/shared/src/ai/feedback.ts). */
export function validateTutorResponse(x: unknown, r: DecisionResult): x is TutorResponse {
  return validateShared(x, { scenarioId: r.scenarioId, choiceId: r.choiceId, before: r.before, after: r.after }, playableById(r.scenarioId).evidenceRefs);
}
export { allowedNumbers } from '@yarinlab/shared';

/**
 * Önce sunucu uç noktası (VITE_AI_ENDPOINT) denenir; tanımlı değilse, zaman aşımı, ağ hatası,
 * geçersiz JSON veya doğrulama hatasında hazır geri bildirim döner. Oyun AI olmadan da biter (fail-open).
 * Model anahtarı istemcide asla bulunmaz; sunucu uç noktası anahtarı kendi secret'ından kullanır.
 */
export async function getTutorFeedback(result: DecisionResult, fetchImpl: typeof fetch = fetch): Promise<TutorOutcome> {
  const fallback: TutorOutcome = { source: 'fallback', response: fallbackForResult(result) };
  const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
  if (!endpoint) return fallback;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // Yalnızca doğrulanmış motor sonucu ve senaryo kimliği gider; öğrenciye ait kişisel veri yok.
      body: JSON.stringify({ scenarioId: result.scenarioId, choiceId: result.choiceId, before: result.before, after: result.after }),
      signal: ctrl.signal,
    });
    if (!res.ok) return fallback;
    const json: unknown = await res.json();
    return validateTutorResponse(json, result) ? { source: 'ai', response: json } : fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
