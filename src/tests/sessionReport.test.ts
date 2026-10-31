import { describe, expect, it } from 'vitest';
import { food } from '../data/scenarios';
import { runDecision } from '../game/systems/DecisionEngine';
import { buildSessionReport, csvCell, reportToCsv } from '../teacher/sessionReport';

const input = (history = [runDecision(food, 'B', 'Dengeyi korumak istedim, "esnek" olsun.')]) => ({
  sessionId: 'abc-123',
  generatedAt: '2026-10-31T10:00:00.000Z',
  scenario: { id: food.id, version: food.version },
  history,
  reflection: ['a', 'b'] as [string, string],
  transferAnswer: 'Gerçek ölçüm tartımla yapılır.',
  taskComplete: false,
  guideSource: 'fallback' as const,
  schoolMeasure: null,
});

describe('oturum raporu', () => {
  it('anonim: yalnızca beklenen alanlar, kişisel veri alanı yok', () => {
    const r = buildSessionReport(input());
    expect(Object.keys(r).sort()).toEqual(
      ['attempts', 'demo', 'generatedAt', 'guideSource', 'notes', 'reflection', 'scenario', 'schemaVersion', 'schoolMeasure', 'sessionId', 'taskComplete', 'transferAnswer'].sort(),
    );
    expect(r.demo).toBe(false);
    expect(r.attempts[0]).toMatchObject({ order: 1, choiceId: 'B', before: food.baseline });
    expect(r.scenario.modelVersion).toMatch(/rules-/);
    expect(r.notes.join(' ')).toMatch(/simülasyon/);
  });

  it('boş oturum hata vermez', () => {
    const r = buildSessionReport(input([]));
    expect(r.attempts).toEqual([]);
    expect(r.scenario.modelVersion).toBeNull();
    expect(reportToCsv(r).trim().split('\r\n')).toHaveLength(1);
  });

  it('CSV: başlık + her deneme bir satır; tırnak kaçışı', () => {
    const csv = reportToCsv(buildSessionReport(input([runDecision(food, 'A', 'x'), runDecision(food, 'C', 'a "b", c')])));
    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0].split(',')).toHaveLength(12);
    expect(lines[2]).toContain('"a ""b"", c"');
  });

  it('CSV formül enjeksiyonuna karşı önek ekler; sayılar bozulmaz', () => {
    expect(csvCell('=HYPERLINK("http://kotu")')).toMatch(/^"'=/);
    expect(csvCell('+1+1')).toBe("'+1+1");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('-5')).toBe('-5');
    expect(csvCell(-700)).toBe('-700');
    expect(csvCell(null)).toBe('');
    expect(csvCell('düz metin')).toBe('düz metin');
  });
});
