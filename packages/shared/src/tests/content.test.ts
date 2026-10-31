import { describe, expect, it } from 'vitest';
import {
  ASSESSMENTS, endingFor, LEARNING_OUTCOMES, MODULES, nextTaskOf, REAL_WORLD_TASKS, SCIENCE_SOURCES, scoreAssessment, TASKS, taskById, taskStatus, BASE_SYSTEMS,
} from '../index';

const LEGACY_SOURCES = ['R9', 'R11']; // web/src/data/sources.ts içinde tanımlı
const sourceIds = new Set([...SCIENCE_SOURCES.map((s) => s.id), ...LEGACY_SOURCES]);
const SYSTEM_KEYS = new Set(Object.keys(BASE_SYSTEMS));

describe('içerik bütünlüğü', () => {
  it('7 modül ve en az 35 görev; her modülde en az 5 görev', () => {
    expect(MODULES).toHaveLength(7);
    expect(TASKS.length).toBeGreaterThanOrEqual(35);
    for (const m of MODULES) expect(TASKS.filter((t) => t.module === m.id).length).toBeGreaterThanOrEqual(5);
  });
  it.each(TASKS.map((t) => [t.id, t] as const))('%s geçerli', (_id, t) => {
    expect(t.id).toMatch(/^[a-z]+_\d{3}$/);
    expect(t.id.startsWith(t.module + '_')).toBe(true);
    expect(t.choices.length).toBeGreaterThanOrEqual(3);
    expect(new Set(t.choices.map((c) => c.id)).size).toBe(t.choices.length);
    expect(t.title.length).toBeGreaterThan(5);
    expect(t.brief.length).toBeGreaterThan(40);
    expect(t.transferQuestion.length).toBeGreaterThan(20);
    expect(t.realWorldAction.action.length).toBeGreaterThan(20);
    expect(t.reasoningOptions.length).toBeGreaterThanOrEqual(3);
    for (const lo of t.learningOutcomeIds) expect(LEARNING_OUTCOMES[lo], lo).toBeTruthy();
    for (const r of t.evidenceRefs) expect(sourceIds.has(r), r).toBe(true);
    for (const c of [...t.choices, t.noDecision]) {
      for (const k of Object.keys(c.system ?? {})) expect(SYSTEM_KEYS.has(k), `${t.id}.${c.id}.${k}`).toBe(true);
      for (const k of Object.keys(c.systemAdd ?? {})) expect(SYSTEM_KEYS.has(k), `${t.id}.${c.id}.${k}`).toBe(true);
      expect(c.tradeoff.length).toBeGreaterThan(10);
    }
    // farklı karar yolları farklı sonuç verir
    const sigs = new Set(t.choices.map((c) => JSON.stringify([c.deltas, c.system, c.systemAdd])));
    expect(sigs.size).toBe(t.choices.length);
    if (t.order > 1) expect(taskById(t.requires!)?.module).toBe(t.module);
  });
  it('her modülün kazanımı tanımlı ve en az bir görevde ölçülüyor', () => {
    for (const m of MODULES) for (const o of m.outcomes) {
      expect(LEARNING_OUTCOMES[o]).toBeTruthy();
      expect(TASKS.some((t) => t.learningOutcomeIds.includes(o)), o).toBe(true);
    }
  });
  it('kavram yanılgısı içeren seçenekler var (öğretmen raporu için)', () => {
    expect(TASKS.filter((t) => t.choices.some((c) => c.misconception)).length).toBeGreaterThanOrEqual(20);
  });
  it('ön/son değerlendirme: her modülde 4 soru, geçerli cevap ve kazanım', () => {
    for (const m of MODULES) {
      const qs = ASSESSMENTS[m.id];
      expect(qs).toHaveLength(4);
      for (const q of qs) { expect(q.answer).toBeLessThan(q.options.length); expect(LEARNING_OUTCOMES[q.outcome]).toBeTruthy(); }
    }
    expect(scoreAssessment('energy', { 'en-q1': 1, 'en-q2': 1, 'en-q3': 0, 'en-q4': 0 })).toEqual({ correct: 3, total: 4, pct: 75 });
  });
  it('gerçek dünya görevleri en az 7', () => expect(REAL_WORLD_TASKS.length).toBeGreaterThanOrEqual(7));
  it('kaynak URL’leri https', () => SCIENCE_SOURCES.forEach((s) => expect(s.url).toMatch(/^https:\/\//)));
});

describe('görev zinciri ve meclis kapıları', () => {
  it('ilk görev açık, sonraki öncekine bağlı', () => {
    expect(taskStatus('energy_001', []).status).toBe('available');
    expect(taskStatus('energy_002', []).status).toBe('locked');
    expect(taskStatus('energy_002', ['energy_001']).status).toBe('available');
    expect(nextTaskOf('energy', ['energy_001']).id).toBe('energy_002');
  });
  it('meclis finali her modülden bir görev ister', () => {
    const chain = ['council_001', 'council_002', 'council_003', 'council_004'];
    const base = ['energy_001', 'carbon_001', 'city_001', 'food_001', 'ocean_001', 'waste_001', 'energy_002', 'city_002', 'food_002', 'waste_002'];
    expect(taskStatus('council_005', chain).status).toBe('locked');
    expect(taskStatus('council_005', [...chain, ...base]).status).toBe('available');
    expect(taskStatus('council_002', ['council_001']).status).toBe('locked');
  });
  it('final sonu göstergelere göre değişir', () => {
    const hi = endingFor({ resilience: 85, ecosystem: 85, wellbeing: 85, emissionIndex: 60, literacy: 80, balancedPlan: true });
    const lo = endingFor({ resilience: 30, ecosystem: 40, wellbeing: 40, emissionIndex: 130, literacy: 10, balancedPlan: false });
    expect(hi.key).toBe('thriving');
    expect(lo.key).toBe('fragile');
  });
});

import { fallbackFeedback, validateTutorResponse } from '../index';
describe('doğrulanmış yedek geri bildirim', () => {
  it('35 görevin tüm seçenekleri için yedek, doğrulayıcıdan geçer', () => {
    for (const t of TASKS) for (const c of [...t.choices, t.noDecision]) {
      const after = { ...t.baseline };
      for (const [k, v] of Object.entries(c.deltas)) (after as Record<string, number>)[k] += v as number;
      const ctx = { scenarioId: t.id, choiceId: c.id, before: t.baseline, after, reasoning: 'çünkü' };
      const fb = fallbackFeedback(ctx);
      expect(validateTutorResponse(fb, ctx), `${t.id}.${c.id}: ${JSON.stringify(fb)}`).toBe(true);
    }
  });
  it('uydurma sayı, sayısal karbon iddiası, bağlantı ve korkutucu dil reddedilir', () => {
    const t = TASKS[0];
    const ctx = { scenarioId: t.id, choiceId: 'A', before: t.baseline, after: t.baseline };
    const ok = fallbackFeedback(ctx);
    expect(validateTutorResponse({ ...ok, summary: 'Bu karar 4321 puan kazandırır.' }, ctx)).toBe(false);
    expect(validateTutorResponse({ ...ok, summary: 'Yılda 76 kg CO2 azalır.' }, ctx)).toBe(false);
    expect(validateTutorResponse({ ...ok, tradeoff: 'Ayrıntı: https://ornek.com' }, ctx)).toBe(false);
    expect(validateTutorResponse({ ...ok, tradeoff: 'Herkes ölecek, felaket kaçınılmaz.' }, ctx)).toBe(false);
    expect(validateTutorResponse({ ...ok, sourceIds: ['UYDURMA'] }, ctx)).toBe(false);
    expect(validateTutorResponse({ ...ok, question1: 'Bir? İki? Üç?' }, ctx)).toBe(false);
    expect(validateTutorResponse({ ...ok, tradeoff: 'Kanıt ve emisyon endeksi birlikte düşünülmeli.' }, ctx)).toBe(true);
  });
  it('kavram yanılgısı seçeneğinde soru yanılgıyı sorgular; gerekçesizse gerekçe ister', () => {
    const t = taskById('energy_002')!;
    const fb = fallbackFeedback({ scenarioId: t.id, choiceId: 'A', before: t.baseline, after: t.baseline });
    expect(fb.question1).toMatch(/her durumda doğru mu/);
    expect(fb.question2).toMatch(/neden/);
  });
});
