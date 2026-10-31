import { describe, expect, it } from 'vitest';
import { build, buildingEffects, CAMPUS_TYPE, ensureFixedBuildings, FIXED_BUILDINGS, guideFeedback, maxLevel, buildingDef, newSim, TASKS, TUTOR_MODES, upgrade, validateTutorResponse } from '../index';

describe('rehber Yarı modları (prompt §9)', () => {
  it('her görev, her seçenek ve her mod için yedek yanıt doğrulayıcıdan geçer', () => {
    for (const t of TASKS) {
      for (const c of [...t.choices.map((x) => x.id), 'N']) {
        for (const mode of TUTOR_MODES) {
          const ctx = { scenarioId: t.id, choiceId: c, before: t.baseline, after: t.baseline, reasoning: c === 'A' ? 'Çünkü 25 kg azalır, https://x.y bak' : undefined };
          const r = guideFeedback(ctx, mode);
          expect(validateTutorResponse(r, ctx, t.evidenceRefs), `${t.id} ${c} ${mode}: ${JSON.stringify(r)}`).toBe(true);
        }
      }
    }
  });
  it('modlar birbirinden farklı içerik üretir; değerlendirme gerekçeyi sayısız ve bağlantısız yansıtır', () => {
    const t = TASKS[0];
    const ctx = { scenarioId: t.id, choiceId: 'A', before: t.baseline, after: t.baseline, reasoning: 'Çünkü 25 kg azalır https://x.y' };
    const texts = TUTOR_MODES.map((m) => JSON.stringify(guideFeedback(ctx, m)));
    expect(new Set(texts).size).toBe(TUTOR_MODES.length);
    const ev = guideFeedback(ctx, 'evaluate');
    expect(ev.summary).toMatch(/neden-sonuç/i);
    expect(ev.summary).not.toMatch(/\d|https?:/);
  });
});

describe('kampüs: 4 seviye, hazır yapı (prompt §3)', () => {
  it('yeni şehir kampüs seviye 1 ile başlar; seviye 1 etkisiz ve bakımsız', () => {
    const sim = newSim(1);
    expect(sim.buildings).toEqual(FIXED_BUILDINGS);
    const e = buildingEffects(sim.buildings);
    expect(e.upkeep).toBe(0);
    expect(e.solarKw + e.rainShare + e.literacy).toBe(0);
  });
  it('kampüs 4 seviyeye kadar gelişir; seviye etkileri birikimli; inşa panelinden kurulamaz', () => {
    const def = buildingDef(CAMPUS_TYPE)!;
    expect(maxLevel(def)).toBe(4);
    let bs = newSim(1).buildings;
    const id = bs[0].id;
    for (const lvl of [2, 3, 4]) {
      const r = upgrade(bs, id, 99999);
      if (!r.ok) throw new Error(r.message);
      expect(r.cost).toBe(def.cost[lvl - 1]);
      bs = r.buildings;
    }
    expect(upgrade(bs, id, 99999)).toMatchObject({ ok: false, error: 'max_level' });
    expect(buildingEffects(bs)).toMatchObject({ solarKw: 30, literacy: 8, upkeep: 16 });
    expect(build([], CAMPUS_TYPE, 'campus', 99999, 0, { completedTasks: 9, modulesPlayed: [], level: 9 })).toMatchObject({ ok: false });
  });
  it('eski kayıtlara hazır kampüs eklenir, tekrar eklenmez', () => {
    const once = ensureFixedBuildings([{ id: 'solar-en-1', type: 'solar', level: 1, slot: 'en-1', builtDay: 0 }]);
    expect(once).toHaveLength(2);
    expect(ensureFixedBuildings(once)).toBe(once);
  });
});
