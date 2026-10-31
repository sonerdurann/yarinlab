import { food, playableById, type PlayableChoice } from '../../data/scenarios';
import { ASSUMED_COLLECTION_CAPACITY_KG, CARBON_NOTE, CITY_FLOOD_NOTE, COUNCIL_NOTE, ENERGY_RISK_NOTE, OCEAN_NOTE, SIMULATION_NOTICE, WASTE_RULE_NOTE } from '../../data/constants';
import { applyChoice } from '../../game/systems/DecisionEngine';
import {
  CARBON_BASELINE,
  CITY_BASELINE,
  COUNCIL_BASELINE,
  ENERGY_BASELINE,
  OCEAN_BASELINE,
  WASTE_BASELINE,
  carbonFromChoice,
  cityFromChoice,
  coastalRisk,
  councilFromChoice,
  councilStanding,
  energyFromChoice,
  floodRisk,
  oceanFromChoice,
  outageRisk,
  scenarioImpactScore,
  wasteCollection,
  wasteFromChoice,
} from '../../game/systems/ClimateEngine';
import { gameStore, useGameState } from '../../state/gameStore';
import type { Resources } from '../../state/types';
import { fallbackForComparison } from '../../ai/fallbackResponses';
import { Modal } from '../Modal/Modal';
import { Mascot, Speech } from '../Mascot';
import { FutureSlider } from './FutureDiorama';

type Metric = { key: string; label: string; unit: string; max: number; lowerIsBetter?: boolean; read: (r: Resources, choice: PlayableChoice) => number };

const num = (n: number) => n.toLocaleString('tr-TR');

/** Aynı başlangıç koşulunda iki geleceği yan yana gösterir (kılavuz §11). */
export function FutureComparison() {
  const s = useGameState();
  if (!s.comparisonOpen) return null;
  const scenario = playableById(s.activeScenarioId);
  const futures = [scenario.noDecision, ...scenario.choices];
  const futureById = (id: string) => futures.find((f) => f.id === id) ?? futures[0];
  const tried = new Set(s.history.filter((h) => h.scenarioId === scenario.id).map((h) => h.choiceId));
  const available = futures.filter((f) => f.id === 'N' || tried.has(f.id));
  const liveFood = s.applied[food.id]?.after.foodWasteKg ?? food.baseline.foodWasteKg;
  const liveLoad = wasteCollection(s.world.foodWasteKg, s.wasteSystem.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, s.wasteSystem.sortingRecovery).wasteLoadKg;
  const standing = { appliedIds: Object.keys(s.applied), history: s.history };

  const metrics: Metric[] = scenario.rows.map((row) => ({
    key: row.key,
    label: row.label,
    unit: row.unit,
    max: row.max,
    lowerIsBetter: row.lowerIsBetter,
    read: (r) => r[row.key],
  }));
  if (scenario.cross === 'energy-storage') {
    metrics.push({
      key: 'outage',
      label: 'Kesinti riski',
      unit: '/100',
      max: 100,
      lowerIsBetter: true,
      read: (_r, choice) => {
        const sys = energyFromChoice(choice.system ?? ENERGY_BASELINE);
        return outageRisk(sys.renewableShare, sys.storageUnits);
      },
    });
  } else if (scenario.cross === 'city-flood') {
    metrics.push({
      key: 'flood',
      label: 'Taşkın riski',
      unit: '/100',
      max: 100,
      lowerIsBetter: true,
      read: (_r, choice) => {
        const sys = cityFromChoice(choice.system);
        return floodRisk(sys.sealedShare, sys.greenShare, sys.rainShare);
      },
    });
  } else if (scenario.cross === 'carbon-claim') {
    metrics.push({
      key: 'claim',
      label: 'İddia inceleme',
      unit: '/100',
      max: 100,
      read: (_r, choice) => carbonFromChoice(choice.system).claimScore,
    });
  } else if (scenario.cross === 'ocean-habitat') {
    metrics.push({
      key: 'coast',
      label: 'Kıyı riski',
      unit: '/100',
      max: 100,
      lowerIsBetter: true,
      read: (_r, choice) => coastalRisk(liveLoad, oceanFromChoice(choice.system).habitatCare),
    });
  } else if (scenario.cross === 'council-evidence') {
    metrics.push({
      key: 'council',
      label: 'Meclis puanı',
      unit: '/100',
      max: 100,
      read: (_r, choice) => councilStanding({ ...standing, evidenceBias: councilFromChoice(choice.system).evidenceBias }),
    });
  } else {
    metrics.push({
      key: 'collection',
      label: 'Toplama ihtiyacı',
      unit: 'sefer/gün',
      max: 8,
      lowerIsBetter: true,
      read: (r, choice) => {
        const sys = scenario.cross === 'waste-loop' ? wasteFromChoice(choice.system) : s.wasteSystem;
        const foodKg = scenario.cross === 'waste-loop' ? liveFood : r.foodWasteKg;
        return wasteCollection(foodKg, sys.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, sys.sortingRecovery).collectionNeed;
      },
    });
  }

  const baseRead = (m: Metric) => {
    if (m.key === 'outage') return outageRisk(ENERGY_BASELINE.renewableShare, ENERGY_BASELINE.storageUnits);
    if (m.key === 'flood') return floodRisk(CITY_BASELINE.sealedShare, CITY_BASELINE.greenShare, CITY_BASELINE.rainShare);
    if (m.key === 'claim') return CARBON_BASELINE.claimScore;
    if (m.key === 'coast') return coastalRisk(liveLoad, OCEAN_BASELINE.habitatCare);
    if (m.key === 'council') return councilStanding({ ...standing, evidenceBias: COUNCIL_BASELINE.evidenceBias });
    if (m.key === 'collection' && scenario.cross === 'waste-loop') {
      return wasteCollection(liveFood, WASTE_BASELINE.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, WASTE_BASELINE.sortingRecovery).collectionNeed;
    }
    if (m.key === 'collection') {
      return wasteCollection(scenario.baseline.foodWasteKg, s.wasteSystem.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, s.wasteSystem.sortingRecovery).collectionNeed;
    }
    return scenario.baseline[m.key as keyof Resources];
  };

  const ruleNote =
    scenario.cross === 'energy-storage' ? ENERGY_RISK_NOTE
    : scenario.cross === 'city-flood' ? CITY_FLOOD_NOTE
    : scenario.cross === 'carbon-claim' ? CARBON_NOTE
    : scenario.cross === 'ocean-habitat' ? OCEAN_NOTE
    : scenario.cross === 'council-evidence' ? COUNCIL_NOTE
    : WASTE_RULE_NOTE;

  const sides = [
    { slot: 'A' as const, title: 'Senaryo A', f: futureById(s.compareA) },
    { slot: 'B' as const, title: 'Senaryo B', f: futureById(s.compareB) },
  ].map((x) => {
    const after = applyChoice(scenario.baseline, x.f);
    return { ...x, after, score: scenarioImpactScore(after, scenario.baseline) };
  });

  return (
     <Modal titleId="fc-title" title="🔮 Aynı okul, iki farklı gelecek" onClose={gameStore.closeComparison} wide>
      <p className="hint">
        {scenario.shortTitle}: her iki gelecek de bu görevin başlangıcından hesaplanır
        {scenario.cross === 'waste-loop' ? ` (kantin gıda atığı ${num(liveFood)} kg/gün bu karşılaştırmada sabit)` : ''}.
      </p>
      <Speech mood="think">Çizgiyi sürükle: solda A, sağda B. Aynı şehir, farklı kararlar. Hangisi daha dengeli? Sayılara ve nedenlerine de bak!</Speech>
      {(() => {
        const risk = metrics.find((m) => m.key === 'flood' || m.key === 'coast');
        const p = (x: (typeof sides)[number]) => ({ score: x.score, after: x.after, flood: risk?.read(x.after, x.f), label: x.f.id === 'N' ? 'Kararlar yok' : x.f.label });
        return <FutureSlider a={p(sides[0])} b={p(sides[1])} />;
      })()}
      <div className="future-grid">
        {sides.map((x) => (
          <section key={x.slot} className={`future-card portal-${x.score >= 70 ? 'bright' : x.score >= 50 ? 'mid' : 'dim'}`} aria-labelledby={`fc-${x.slot}`}>
            <div className="portal" aria-hidden="true">
              <span className="portal-scene">{x.score >= 70 ? '🌳☀️🏫😊' : x.score >= 50 ? '🌱⛅🏫🙂' : '🗑️🌫️🏫😟'}</span>
              <Mascot mood={x.score >= 70 ? 'wow' : x.score >= 50 ? 'happy' : 'worried'} size={58} />
            </div>
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
              const v = m.read(x.after, x.f);
              const base = baseRead(m);
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
      <p className="hint">
        Renkler yalnızca A/B ayrımı içindir; iyi/kötü yargısı için sayılara ve açıklamaya bak. Etki puanı oyun içi dengedir, kg CO₂e değildir.
        {` ${ruleNote}`}
      </p>
      <div className="tutor" aria-label="Rehber soruları">
        <h3>Rehber: iki soruluk yansıtma</h3>
        <p>{fallbackForComparison().tradeoff}</p>
        <ol>
          <li>{fallbackForComparison().question1}</li>
          <li>{fallbackForComparison().question2}</li>
        </ol>
      </div>
      <div className="real-world">
        <h3>{scenario.realWorldAction.title}</h3>
        <p>{scenario.realWorldAction.action}</p>
        <ul>
          {scenario.realWorldAction.measurementPlan.map((p) => (
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
    </Modal>
  );
}
