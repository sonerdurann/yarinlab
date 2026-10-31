import { fallbackForResult, type TutorResponse } from './fallbackResponses';
import type { DecisionResult } from '../state/types';
import { food } from '../data/scenarios';

/** Kılavuz §18: 5-8 sn ağ gecikmesinde fallback; burada 6 sn. */
export const AI_TIMEOUT_MS = 6000;

export type TutorOutcome = { source: 'ai' | 'fallback'; response: TutorResponse };

/** Motor sonucundan çıkan, metinde geçmesine izin verilen tüm sayılar. */
export function allowedNumbers(r: DecisionResult): Set<number> {
  const out = new Set<number>();
  for (const k of Object.keys(r.before) as (keyof typeof r.before)[]) {
    out.add(r.before[k]);
    out.add(r.after[k]);
    out.add(Math.abs(r.after[k] - r.before[k]));
  }
  return out;
}

const numbersIn = (text: string) => (text.match(/\d[\d.]*/g) ?? []).map((m) => Number(m.replace(/\./g, '')));

/**
 * Yanıtı şema ve içerik kurallarıyla doğrular:
 * alanlar string, en çok 2 kısa soru, kaynaklar senaryo kanıtlarından, sayılar yalnızca motor sonucundan,
 * kgCO2e / karbon katsayısı iddiası yok.
 */
export function validateTutorResponse(x: unknown, r: DecisionResult): x is TutorResponse {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  const text = ['summary', 'tradeoff', 'question1', 'question2'] as const;
  for (const k of text) if (typeof o[k] !== 'string' || !(o[k] as string).trim() || (o[k] as string).length > 400) return false;
  if (!Array.isArray(o.sourceIds) || !o.sourceIds.every((s) => typeof s === 'string' && food.evidenceRefs.includes(s))) return false;
  const joined = text.map((k) => o[k] as string).join(' ');
  if (/co2|co₂|karbon\s*(ayak|salım)|emisyon/i.test(joined)) return false;
  const allowed = allowedNumbers(r);
  if (!numbersIn(joined).every((n) => allowed.has(n))) return false;
  if (((o.question1 as string) + (o.question2 as string)).split('?').length - 1 > 2) return false;
  return true;
}

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
