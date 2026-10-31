import { describe, expect, it } from 'vitest';
import { DEMO_STUDENTS } from '../data/teacherDemo';
import { perStudentPerDay, summarize, validateSchoolMeasure } from '../teacher/report';
import { assetLicenses, sources } from '../data/sources';

describe('öğretmen raporu', () => {
  const s = summarize(DEMO_STUDENTS);

  it('demo: 24 katılımcı, 19 tamamlayan; tamamlayanlar seçim dağılımına eşit', () => {
    expect(s.joined).toBe(24);
    expect(s.completed).toBe(19);
    expect(Object.values(s.choiceCounts).reduce((a, b) => a + b, 0)).toBe(19);
    expect(s.balanced).toBeLessThanOrEqual(s.completed);
  });

  it('ön/son test yalnızca eşleşen öğrencilerle ve ham puan olarak hesaplanır', () => {
    expect(s.avgPre).not.toBeNull();
    expect(s.avgPost as number).toBeGreaterThanOrEqual(s.avgPre as number);
    for (const st of DEMO_STUDENTS) {
      expect(st.pre).toBeGreaterThanOrEqual(0);
      expect(st.pre).toBeLessThanOrEqual(5);
      if (st.post !== null) expect(st.post).toBeLessThanOrEqual(5);
    }
  });

  it('çift sayım: aynı anonim kod bir kez sayılır ve bildirilir', () => {
    const dup = summarize([...DEMO_STUDENTS, DEMO_STUDENTS[0]]);
    expect(dup.joined).toBe(24);
    expect(dup.duplicateCodes).toEqual([DEMO_STUDENTS[0].code]);
    expect(s.duplicateCodes).toEqual([]);
  });

  it('boş sınıf hata vermez', () => {
    const e = summarize([]);
    expect(e.joined).toBe(0);
    expect(e.avgPre).toBeNull();
  });

  it('demo kayıtlarında kişisel veri alanı yok (yalnızca anonim kod)', () => {
    expect(Object.keys(DEMO_STUDENTS[0]).sort()).toEqual(
      ['attempts', 'choiceId', 'code', 'completed', 'post', 'pre', 'rationaleScore', 'reasoning', 'reasoningKind'].sort(),
    );
    expect(DEMO_STUDENTS.every((x) => /^Ö-\d{2}$/.test(x.code))).toBe(true);
  });
});

describe('gerçek okul ölçümü doğrulama', () => {
  it('geçerli girdiyi kabul eder ve kg/öğrenci/gün hesaplar', () => {
    const m = validateSchoolMeasure({ totalKg: '42', students: '280', days: '5' });
    expect(m).toEqual({ totalKg: 42, students: 280, days: 5 });
    expect(perStudentPerDay(m!)).toBe(0.03);
  });
  it('negatif, sıfır, ondalıklı sayı ve metin reddedilir', () => {
    expect(validateSchoolMeasure({ totalKg: -1, students: 10, days: 1 })).toBeNull();
    expect(validateSchoolMeasure({ totalKg: 5, students: 0, days: 1 })).toBeNull();
    expect(validateSchoolMeasure({ totalKg: 5, students: 2.5, days: 1 })).toBeNull();
    expect(validateSchoolMeasure({ totalKg: 'abc', students: 10, days: 1 })).toBeNull();
    expect(validateSchoolMeasure({ totalKg: 5, students: 10, days: 9999 })).toBeNull();
  });
});

describe('T10: kaynak ve lisans listesi', () => {
  it('her kaynakta https bağlantı; Kenney paketleri CC0', () => {
    for (const x of sources) expect(x.url).toMatch(/^https:\/\//);
    for (const a of assetLicenses.filter((a) => a.name.startsWith('Kenney'))) {
      expect(a.license).toBe('CC0');
      expect(a.url).toMatch(/^https:\/\/kenney\.nl\//);
    }
  });
});
