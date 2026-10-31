import { describe, expect, it, vi } from 'vitest';
import { food } from '../data/scenarios';
import { runDecision } from '../game/systems/DecisionEngine';
import { fallbackForResult } from '../ai/fallbackResponses';
import { getTutorFeedback, validateTutorResponse } from '../ai/tutorClient';

describe('AI yedeği (T06)', () => {
  it('her seçenek için hazır açıklama doğrulayıcıdan geçer', () => {
    for (const c of food.choices) {
      const r = runDecision(food, c.id);
      const fb = fallbackForResult(r);
      expect(validateTutorResponse(fb, r), c.id).toBe(true);
      expect(fb.summary).toContain(String(r.after.foodWasteKg));
    }
  });

  it('en çok iki soru; yer tutucu kalmaz', () => {
    const r = runDecision(food, 'B');
    const fb = fallbackForResult(r);
    expect(fb.summary).not.toMatch(/\{|\}/);
    expect((fb.question1 + fb.question2).split('?').length - 1).toBeLessThanOrEqual(2);
  });

  it('uydurma sayı, kgCO2e ve yabancı kaynak reddedilir', () => {
    const r = runDecision(food, 'B');
    const ok = fallbackForResult(r);
    expect(validateTutorResponse({ ...ok, summary: 'Atık 777 kg azaldı.' }, r)).toBe(false);
    expect(validateTutorResponse({ ...ok, tradeoff: 'Bu 12 kgCO2e tasarruf sağlar.' }, r)).toBe(false);
    expect(validateTutorResponse({ ...ok, sourceIds: ['X99'] }, r)).toBe(false);
    expect(validateTutorResponse({ ...ok, summary: '' }, r)).toBe(false);
    expect(validateTutorResponse(null, r)).toBe(false);
  });

  it('uç nokta tanımlı değilken ağa çıkmadan yedek döner', async () => {
    const spy = vi.fn();
    const out = await getTutorFeedback(runDecision(food, 'A'), spy as never);
    expect(out.source).toBe('fallback');
    expect(spy).not.toHaveBeenCalled();
  });

  it('uç nokta hata verirse veya geçersiz yanıt dönerse yedeğe düşer', async () => {
    vi.stubEnv('VITE_AI_ENDPOINT', 'https://example.test/api/tutor');
    const r = runDecision(food, 'C');
    const bad = await getTutorFeedback(r, (async () => new Response(JSON.stringify({ summary: 'x' }), { status: 200 })) as never);
    expect(bad.source).toBe('fallback');
    const down = await getTutorFeedback(r, (async () => { throw new Error('offline'); }) as never);
    expect(down.source).toBe('fallback');
    const good = fallbackForResult(r);
    const ai = await getTutorFeedback(r, (async () => new Response(JSON.stringify(good), { status: 200 })) as never);
    expect(ai.source).toBe('ai');
    vi.unstubAllEnvs();
  });
});
