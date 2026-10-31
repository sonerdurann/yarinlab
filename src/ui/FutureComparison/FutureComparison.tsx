import { useEffect, useRef } from 'react';
import { food } from '../../data/scenarios';
import { SIMULATION_NOTICE } from '../../data/constants';
import { applyChoice } from '../../game/systems/DecisionEngine';
import { scenarioImpactScore } from '../../game/systems/ClimateEngine';
import { gameStore, useGameState } from '../../state/gameStore';
import type { Resources } from '../../state/types';
import { fallbackForComparison } from '../../ai/fallbackResponses';

const futures = [food.noDecision, ...food.choices];
const futureById = (id: string) => futures.find((f) => f.id === id) ?? futures[0];

type Metric = { key: keyof Resources; label: string; unit: string; max: number; lowerIsBetter?: boolean };
const metrics: Metric[] = [
  { key: 'foodWasteKg', label: 'Gıda atığı', unit: 'kg/gün', max: 40, lowerIsBetter: true },
  { key: 'budget', label: 'Bütçe', unit: 'puan', max: 13000 },
  { key: 'wellbeing', label: 'Memnuniyet', unit: '/100', max: 100 },
  { key: 'energyScore', label: 'Enerji', unit: '/100', max: 100 },
];

const num = (n: number) => n.toLocaleString('tr-TR');

/** Aynı başlangıç koşulunda iki geleceği yan yana gösterir (kılavuz §11). */
export function FutureComparison() {
  const s = useGameState();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!s.comparisonOpen) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && gameStore.closeComparison();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s.comparisonOpen]);

  if (!s.comparisonOpen) return null;

  // Karar yok her zaman; seçenekler yalnızca denendiyse karşılaştırılabilir.
  const tried = new Set(s.history.map((h) => h.choiceId));
  const available = futures.filter((f) => f.id === 'N' || tried.has(f.id));
  const sides = [
    { slot: 'A' as const, title: 'Senaryo A', f: futureById(s.compareA) },
    { slot: 'B' as const, title: 'Senaryo B', f: futureById(s.compareB) },
  ].map((x) => {
    const after = applyChoice(food.baseline, x.f);
    return { ...x, after, score: scenarioImpactScore(after, food.baseline) };
  });

  return (
    <div className="modal-backdrop">
      <div className="modal wide" role="dialog" aria-modal="true" aria-labelledby="fc-title" tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2 id="fc-title">Aynı okul, iki farklı gelecek</h2>
          <button onClick={gameStore.closeComparison} aria-label="Kapat">
            ✕
          </button>
        </div>
        <p className="hint">Her iki gelecek de aynı başlangıç koşullarından (atık {food.baseline.foodWasteKg} kg/gün, bütçe {num(food.baseline.budget)}) hesaplanır.</p>

        <div className="future-grid">
          {sides.map((x) => (
            <section key={x.slot} className="future-card" aria-labelledby={`fc-${x.slot}`}>
              <label className="text-row">
                <span id={`fc-${x.slot}`}>
                  <strong>{x.title}</strong>
                </span>
                <select value={x.f.id} onChange={(e) => gameStore.setCompare(x.slot, e.target.value)}>
                  {available.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.id === 'N' ? 'Kararlar yok' : `${f.id} · ${f.label}`}
                    </option>
                  ))}
                </select>
              </label>
              <p className="why">
                <strong>Neden böyle?</strong> {x.f.tradeoff}
              </p>
              <p className="score">
                Senaryo etki puanı: <strong>{x.score}/100</strong>
              </p>
            </section>
          ))}
        </div>

        <h3>Göstergeler</h3>
        <div className="bars" role="table" aria-label="İki gelecek karşılaştırması">
          {metrics.map((m) => (
            <div key={m.key} className="bar-row" role="row">
              <div className="bar-name" role="rowheader">
                {m.label} <small>({m.unit})</small>
              </div>
              {sides.map((x) => {
                const v = x.after[m.key];
                const base = food.baseline[m.key];
                const d = v - base;
                return (
                  <div key={x.slot} className="bar-cell" role="cell">
                    <div className="bar-track" aria-hidden="true">
                      <div className={`bar-fill ${x.slot === 'A' ? 'a' : 'b'}`} style={{ width: `${Math.min(100, Math.max(2, (v / m.max) * 100))}%` }} />
                    </div>
                    <span>
                      {x.slot}: <strong>{num(v)}</strong> ({d === 0 ? 'aynı' : `${d > 0 ? '+' : ''}${num(d)}`})
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <p className="hint">Renkler yalnızca A/B ayrımı içindir; iyi/kötü yargısı için sayılara ve açıklamaya bak. Etki puanı oyun içi dengedir, kg CO₂e değildir.</p>

        <div className="tutor" aria-label="Rehber soruları">
          <h3>Rehber: iki soruluk yansıtma</h3>
          <p>{fallbackForComparison().tradeoff}</p>
          <ol>
            <li>{fallbackForComparison().question1}</li>
            <li>{fallbackForComparison().question2}</li>
          </ol>
        </div>

        <div className="real-world">
          <h3>{food.realWorldAction.title}</h3>
          <p>{food.realWorldAction.action}</p>
          <ul>
            {food.realWorldAction.measurementPlan.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <p className="notice">{SIMULATION_NOTICE}</p>
        <div className="actions">
          <button className="primary" onClick={gameStore.closeComparison}>
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
