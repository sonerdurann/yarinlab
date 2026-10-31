import { useEffect, useState } from 'react';
import { playableById, food } from '../../data/scenarios';
import { ASSUMED_COLLECTION_CAPACITY_KG, CARBON_NOTE, CITY_FLOOD_NOTE, COUNCIL_NOTE, ENERGY_RISK_NOTE, OCEAN_NOTE, SIMULATION_NOTICE, WASTE_RULE_NOTE } from '../../data/constants';
import { gameStore, useGameState } from '../../state/gameStore';
import { TutorCard } from '../TutorCard/TutorCard';
import { Modal } from '../Modal/Modal';
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
  wasteCollection,
  wasteFromChoice,
} from '../../game/systems/ClimateEngine';

/** Başlangıç işaretinden yeni değere uzayan çubuk (renk tek başına anlam taşımaz; sayı ve ok yanında). */
function DeltaBar({ before, after, max, tone }: { before: number; after: number; max: number; tone: 'good' | 'bad' | 'flat' }) {
  const pct = (v: number) => Math.max(2, Math.min(100, (v / max) * 100));
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <span className="delta-bar" aria-hidden="true">
      <span className={`delta-fill ${tone}`} style={{ width: `${pct(grown ? after : before)}%` }} />
      <span className="delta-before" style={{ left: `${pct(before)}%` }} />
    </span>
  );
}

const sign = (n: number) => (n > 0 ? `+${n.toLocaleString('tr-TR')}` : n.toLocaleString('tr-TR'));

/** Senaryo karar ekranı (kılavuz §10). Kantin, enerji ve atık aynı akışı kullanır. */
export function DecisionModal() {
  const s = useGameState();
  if (!s.decisionOpen) return null;
  const scenario = playableById(s.activeScenarioId);
  const { result } = s;
  const chosen = scenario.choices.find((c) => c.id === (result?.choiceId ?? s.pendingChoiceId));
  const attempts = s.history.filter((h) => h.scenarioId === scenario.id);
  const transferValue = scenario.id === food.id ? s.transferAnswer : (s.transferByScenario[scenario.id] ?? '');

  return (
    <Modal titleId="dm-title" title={scenario.title} onClose={gameStore.closeDecision} active={!s.comparisonOpen}>
      <p>{scenario.brief}</p>
      <ul className="facts">
        {scenario.facts.map((f) => (
          <li key={f.label}>
            {f.label}: {f.value}
          </li>
        ))}
      </ul>

      {!result ? (
        <>
          <fieldset className="choices">
            <legend>Kararını ver</legend>
            {scenario.choices.map((c) => (
              <label key={c.id} className={s.pendingChoiceId === c.id ? 'choice on' : 'choice'}>
                <input type="radio" name="choice" value={c.id} aria-label={`${c.id} ${c.label}`} checked={s.pendingChoiceId === c.id} onChange={() => gameStore.pickChoice(c.id)} />
                <span className="badge" aria-hidden="true">{c.id}</span>
                <span className="choice-text">
                  <strong>{c.label}</strong>
                  <small>{c.summary}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset className="reasoning">
            <legend>Bu seçimi neden yaptın?</legend>
            {scenario.reasoningOptions.map((o) => (
              <label key={o} className="radio-row">
                <input type="radio" name="reason" value={o} aria-label={o} checked={s.reasoningOption === o} onChange={() => gameStore.setReasoningOption(o)} />
                {o}
              </label>
            ))}
            <label className="text-row">
              <span>Kendi gerekçen (en fazla 280 karakter)</span>
              <textarea value={s.reasoningText} rows={2} onChange={(e) => gameStore.setReasoningText(e.target.value)} />
            </label>
          </fieldset>
          <button className="primary" disabled={!s.pendingChoiceId} onClick={gameStore.evaluate}>
            Kararı değerlendir
          </button>
          {!s.pendingChoiceId && <p className="hint">Simülasyonu başlatmak için bir seçenek seç.</p>}
        </>
      ) : (
        <>
          <h3>
            Sonuç – {chosen?.id} · {chosen?.label}
          </h3>
          <table className="result">
            <thead>
              <tr>
                <th scope="col">Gösterge</th>
                <th scope="col">Başlangıç</th>
                <th scope="col">Sonra</th>
                <th scope="col">Değişim</th>
              </tr>
            </thead>
            <tbody>
              {scenario.rows.map((r) => {
                const d = result.after[r.key] - result.before[r.key];
                const good = r.lowerIsBetter ? d < 0 : d > 0;
                return (
                  <tr key={r.key}>
                    <th scope="row">{r.label}</th>
                    <td>{result.before[r.key].toLocaleString('tr-TR')}</td>
                    <td>
                      {result.after[r.key].toLocaleString('tr-TR')}
                      <DeltaBar before={result.before[r.key]} after={result.after[r.key]} max={r.max} tone={d === 0 ? 'flat' : good ? 'good' : 'bad'} />
                    </td>
                    <td>
                      <span className={`chip ${d === 0 ? 'flat' : good ? 'good' : 'bad'}`}>
                        <span aria-hidden="true">{d === 0 ? '•' : d > 0 ? '▲' : '▼'}</span> {sign(d)} {r.unit}
                        <span className="sr-only"> {d === 0 ? 'değişmedi' : good ? 'olumlu yönde' : 'olumsuz yönde'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <CrossNote />
          <p className="tradeoff">
            <strong>Ödünleşim:</strong> {chosen?.tradeoff}
          </p>
          {result.reasoning && (
            <p>
              <strong>Gerekçen:</strong> {result.reasoning}
            </p>
          )}
          <p className="notice">{SIMULATION_NOTICE}</p>
          <TutorCard />
          {attempts.length > 1 && (
            <div>
              <h3>Denediğin kararlar</h3>
              <ul className="attempts">
                {attempts.map((h, i) => (
                  <li key={i}>
                    {h.choiceId}: {scenario.rows.map((r) => `${r.label} ${h.after[r.key].toLocaleString('tr-TR')}`).join(' · ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <label className="text-row">
            <span>{scenario.transferQuestion}</span>
            <textarea value={transferValue} rows={2} onChange={(e) => gameStore.setTransferAnswer(e.target.value)} />
          </label>
          <div className="actions">
            <button onClick={gameStore.retry}>Tekrar dene (aynı başlangıç)</button>
            <button onClick={gameStore.openComparison}>İki geleceği karşılaştır</button>
            <button className="primary" onClick={gameStore.closeDecision}>
              Haritaya dön
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function CrossNote() {
  const s = useGameState();
  const scenario = playableById(s.activeScenarioId);
  const result = s.result;
  const chosen = scenario.choices.find((c) => c.id === result?.choiceId);
  if (!result || !chosen) return null;

  if (scenario.cross === 'energy-storage') {
    const before = outageRisk(ENERGY_BASELINE.renewableShare, ENERGY_BASELINE.storageUnits);
    const sys = energyFromChoice(chosen.system);
    const after = outageRisk(sys.renewableShare, sys.storageUnits);
    return (
      <p className="cross" role="note">
        <strong>Depolama çapraz kuralı:</strong> kesinti riski {before} → {after}/100. Yenilenebilir pay {ENERGY_BASELINE.renewableShare} → {sys.renewableShare}, depolama {ENERGY_BASELINE.storageUnits} → {sys.storageUnits} birim.
        <small>{ENERGY_RISK_NOTE}</small>
      </p>
    );
  }

  if (scenario.cross === 'city-flood') {
    const before = floodRisk(CITY_BASELINE.sealedShare, CITY_BASELINE.greenShare, CITY_BASELINE.rainShare);
    const sys = cityFromChoice(chosen.system);
    const after = floodRisk(sys.sealedShare, sys.greenShare, sys.rainShare);
    return (
      <p className="cross" role="note">
        <strong>Yüzey kuralı:</strong> taşkın riski {before} → {after}/100. Sızdırmaz {CITY_BASELINE.sealedShare} → {sys.sealedShare}, yeşil {CITY_BASELINE.greenShare} → {sys.greenShare}, yağmur {CITY_BASELINE.rainShare} → {sys.rainShare}.
        <small>{CITY_FLOOD_NOTE}</small>
      </p>
    );
  }

  if (scenario.cross === 'carbon-claim') {
    const sys = carbonFromChoice(chosen.system);
    return (
      <p className="cross" role="note">
        <strong>İnceleme puanı:</strong> {CARBON_BASELINE.claimScore} → {sys.claimScore}/100. Kantin atığı ({s.world.foodWasteKg} kg/gün) ayrı bir göstergedir.
        <small>{CARBON_NOTE}</small>
      </p>
    );
  }

  if (scenario.cross === 'ocean-habitat') {
    const load = wasteCollection(s.world.foodWasteKg, s.wasteSystem.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, s.wasteSystem.sortingRecovery).wasteLoadKg;
    const before = coastalRisk(load, OCEAN_BASELINE.habitatCare);
    const sys = oceanFromChoice(chosen.system);
    const after = coastalRisk(load, sys.habitatCare);
    return (
      <p className="cross" role="note">
        <strong>Kıyı kuralı:</strong> risk {before} → {after}/100. Yük {load} kg (gıda {s.world.foodWasteKg} kg + diğer atık). Habitat bakımı {OCEAN_BASELINE.habitatCare} → {sys.habitatCare}.
        <small>{OCEAN_NOTE}</small>
      </p>
    );
  }

  if (scenario.cross === 'council-evidence') {
    const bias = councilFromChoice(chosen.system).evidenceBias;
    const standing = { appliedIds: Object.keys(s.applied), history: s.history };
    const before = councilStanding({ ...standing, evidenceBias: COUNCIL_BASELINE.evidenceBias });
    const after = councilStanding({ ...standing, evidenceBias: bias });
    return (
      <p className="cross" role="note">
        <strong>Kanıt kuralı:</strong> meclis puanı {before} → {after}/100. Seçim eğilimi {COUNCIL_BASELINE.evidenceBias} → {bias}.
        <small>{COUNCIL_NOTE}</small>
      </p>
    );
  }

  const liveFood = scenario.cross === 'waste-loop' ? (s.applied[food.id]?.after.foodWasteKg ?? food.baseline.foodWasteKg) : result.before.foodWasteKg;
  const beforeSys = scenario.cross === 'waste-loop' ? WASTE_BASELINE : s.wasteSystem;
  const afterSys = scenario.cross === 'waste-loop' ? wasteFromChoice(chosen.system) : s.wasteSystem;
  const foodBefore = scenario.cross === 'waste-loop' ? liveFood : result.before.foodWasteKg;
  const foodAfter = scenario.cross === 'waste-loop' ? liveFood : result.after.foodWasteKg;
  const b = wasteCollection(foodBefore, beforeSys.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, beforeSys.sortingRecovery);
  const a = wasteCollection(foodAfter, afterSys.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, afterSys.sortingRecovery);
  return (
    <p className="cross" role="note">
      <strong>{scenario.cross === 'waste-loop' ? 'Kantinle çapraz etki:' : 'Atık modülüne etkisi:'}</strong> toplama ihtiyacı {b.collectionNeed} → {a.collectionNeed} sefer/gün (yük {b.wasteLoadKg} → {a.wasteLoadKg} kg).
      {scenario.cross === 'waste-loop' && (
        <> Kantin gıda atığı {liveFood} kg/gün sabit; diğer atık {beforeSys.otherWasteKg} → {afterSys.otherWasteKg} kg; geri kazanım {beforeSys.sortingRecovery} → {afterSys.sortingRecovery}.</>
      )}
      <small>{WASTE_RULE_NOTE} Kapasite {a.assumedCollectionCapacityKg} kg/sefer.</small>
    </p>
  );
}
