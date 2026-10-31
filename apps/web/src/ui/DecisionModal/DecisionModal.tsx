import { MODULES, nextTaskOf } from '@yarinlab/shared';
import { cityOf, completedTaskIds, scenarioSteps } from '../../state/city';
import { useEffect, useState, type CSSProperties } from 'react';
import { Speech } from '../Mascot';
import { starsFor, themeOf } from '../theme/modules';
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

const CONFETTI = ['#ff7a59', '#ffc93c', '#4cc38a', '#4aa8d8', '#7a4fd6'];

/** Yıldızlı sonuç: puan (sonuç, gerekçe, denge) yıldıza çevrilir; 3 yıldızda konfeti. Baskı yok: tekrar denemek serbest. */
function StarResult({ scenarioId }: { scenarioId: string }) {
  const s = useGameState();
  const sc = [...s.scores].reverse().find((x) => x.scenarioId === scenarioId);
  if (!sc) return null;
  const stars = starsFor(sc.total);
  const mood = stars === 3 ? 'wow' : stars === 2 ? 'happy' : 'think';
  const line = stars === 3 ? 'Harika denge! Hem sonuca hem gerekçene bayıldım.' : stars === 2 ? 'Güzel karar! Bir göstergeyi daha düşünürsen üç yıldız olabilir.' : 'İyi bir başlangıç. Başka bir yol deneyip iki geleceği karşılaştırmaya ne dersin?';
  return (
    <div className="star-result" aria-label={`Karar puanı ${sc.total}, ${stars} yıldız`}>
      {stars === 3 && <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, k) => <i key={k} style={{ left: `${(k * 41) % 100}%`, background: CONFETTI[k % 5], animationDelay: `${(k % 8) * 60}ms` }} />)}</div>}
      <div className="star-row" aria-hidden="true">{[0, 1, 2].map((k) => <span key={k} className={k < stars ? 's on' : 's'}>★</span>)}</div>
      <div className="score-parts"><span>🎯 Sonuç {sc.outcome}</span><span>💬 Gerekçe {sc.reasoning}</span><span>⚖️ Denge {sc.balance}</span><span>Toplam {sc.total}</span></div>
      <Speech mood={mood} size={64}>{line}{sc.feedback.length > 0 && <><br /><small>{sc.feedback.join(' ')}</small></>}</Speech>
    </div>
  );
}

/** Görev tamamlanınca sıradaki görev; final görevinde 2040 sonu. */
function NextTaskButton({ scenarioId }: { scenarioId: string }) {
  const s = useGameState();
  const done = completedTaskIds(s);
  if (!done.includes(scenarioId)) return null;
  if (scenarioId === 'council_005') return <button className="primary" onClick={() => { gameStore.closeDecision(); gameStore.openOverlay('ending'); }}>🌅 2040’a bak</button>;
  const mod = scenarioId.split('_')[0];
  const next = nextTaskOf(mod, done);
  if (next.id === scenarioId || done.includes(next.id)) return null;
  return <button className="primary" onClick={() => gameStore.openTask(next.id)}>➡️ Sonraki görev: {next.title.split('–')[1]?.trim() ?? next.title}</button>;
}

/** Meclis kanıt kartları: önceki modüllerdeki kararların ve şehir göstergelerinin özeti. */
function EvidenceCards() {
  const s = useGameState();
  const ind = cityOf(s).indicators;
  const cards = MODULES.filter((m) => m.id !== 'council').map((m) => {
    const last = [...s.history].reverse().find((h) => h.scenarioId.startsWith(m.id + '_'));
    const sc = last && playableById(last.scenarioId);
    const ch = sc?.choices.find((c) => c.id === last!.choiceId);
    return { m, text: ch ? `${sc!.shortTitle}: “${ch.label}”` : 'Henüz karar yok' };
  });
  return (
    <section className="evidence" aria-label="Kanıt kartların">
      <h3>Kanıt kartların</h3>
      <ul className="evidence-grid">
        {cards.map((c) => <li key={c.m.id}><strong>{c.m.name}</strong><br />{c.text}</li>)}
        <li><strong>Şehir göstergeleri</strong><br />Dayanıklılık {ind.resilience} · Ekosistem {ind.ecosystem} · Refah {ind.wellbeing} · Emisyon endeksi {ind.emissionIndex}</li>
      </ul>
    </section>
  );
}

const sign = (n: number) => (n > 0 ? `+${n.toLocaleString('tr-TR')}` : n.toLocaleString('tr-TR'));

/** Görevin 4 adımı (kılavuz §20); hepsi bitince görev 🏆 tam tamamlanır. */
function StepList({ scenarioId }: { scenarioId: string }) {
  const s = useGameState();
  const steps = scenarioSteps(s, scenarioId);
  const all = steps.every((x) => x.done);
  return (
    <ol className="step-list" aria-label="Görev adımları">
      {steps.map((x, k) => <li key={x.id} className={x.done ? 'done' : ''}><span aria-hidden="true">{x.done ? '✓' : k + 1}</span>{x.label}<span className="sr-only">{x.done ? ' (tamam)' : ''}</span></li>)}
      {all && <li className="trophy" role="status">🏆 Görev tam tamamlandı!</li>}
    </ol>
  );
}

const ROW_ICON: Record<string, string> = { budget: '💰', foodWasteKg: '🍎', energyScore: '⚡', waterScore: '💧', wellbeing: '😊' };

/** Görev ekranı: karakter durumu anlatır, büyük seçim kartları, fikir kartı gerekçeler, yıldızlı sonuç. */
export function DecisionModal() {
  const s = useGameState();
  if (!s.decisionOpen) return null;
  const scenario = playableById(s.activeScenarioId);
  const th = themeOf(scenario.id);
  const { result } = s;
  const chosen = scenario.choices.find((c) => c.id === (result?.choiceId ?? s.pendingChoiceId));
  const attempts = s.history.filter((h) => h.scenarioId === scenario.id);
  const transferValue = scenario.id === food.id ? s.transferAnswer : (s.transferByScenario[scenario.id] ?? '');
  const ready = !!s.pendingChoiceId && !!(s.reasoningOption || s.reasoningText.trim());
  const ideas = scenario.reasoningOptions.filter((o) => !/^Başka bir neden/.test(o));

  return (
    <Modal titleId="dm-title" title={scenario.title} onClose={gameStore.closeDecision} active={!s.comparisonOpen} wide>
      <div style={{ '--mod': th.color, '--soft': th.soft } as CSSProperties}>
        <div className="dm-hero">
          <span className="avatar" aria-hidden="true">{th.avatar}</span>
          <div className="bubble"><strong className="bubble-name" style={{ color: th.color }}>{th.character}</strong>{scenario.brief}</div>
        </div>
        {scenario.facts.length > 0 && (
          <ul className="facts">{scenario.facts.map((f) => <li key={f.label}><b>{f.label}:</b> {f.value}</li>)}</ul>
        )}
        <StepList scenarioId={scenario.id} />
        {scenario.module === 'council' && <EvidenceCards />}

        {!result ? (
          <>
            <fieldset className="choices">
              <legend>1. Ne yapalım?</legend>
              <div className="cards">
                {scenario.choices.map((c) => (
                  <label key={c.id} className={s.pendingChoiceId === c.id ? 'choice on' : 'choice'}>
                    <input type="radio" name="choice" value={c.id} aria-label={`${c.id} ${c.label}`} checked={s.pendingChoiceId === c.id} onChange={() => gameStore.pickChoice(c.id)} />
                    <span className="badge" aria-hidden="true">{c.id}</span>
                    <strong>{c.label}</strong>
                    <small>{c.summary}</small>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="reasoning">
              <legend>2. Neden bunu seçtin?</legend>
              <div className="idea-chips" role="radiogroup" aria-label="Hazır fikirler">
                {ideas.map((o) => (
                  <label key={o} className={s.reasoningOption === o ? 'on' : ''}>
                    <input type="radio" name="reason" value={o} aria-label={o} checked={s.reasoningOption === o} onChange={() => gameStore.setReasoningOption(o)} />
                    <span aria-hidden="true">💡</span>{o}
                  </label>
                ))}
              </div>
              <label className="text-row">
                <span>…ya da kendi cümlenle yaz (“çünkü” ile başlamayı dene!)</span>
                <textarea value={s.reasoningText} rows={2} maxLength={280} onChange={(e) => gameStore.setReasoningText(e.target.value)} />
              </label>
            </fieldset>
            <div className="actions">
              <button className="primary" disabled={!ready} onClick={gameStore.evaluate}>✨ Kararımı dene</button>
            </div>
            <p className="hint" role="status">{!s.pendingChoiceId ? 'Önce bir kart seç.' : !ready ? 'Şimdi nedenini seç ya da yaz: yıldızların gerekçene de bakar.' : 'Hazırsın!'}</p>
          </>
        ) : (
          <>
            <h3 tabIndex={-1} ref={(el) => { if (el && document.activeElement === document.body) el.focus(); }}>
              Sonuç – {chosen?.id} · {chosen?.label}
            </h3>
            <StarResult scenarioId={scenario.id} />
            <div className="change-cards">
              {scenario.rows.map((r) => {
                const d = result.after[r.key] - result.before[r.key];
                const good = r.lowerIsBetter ? d < 0 : d > 0;
                const tone = d === 0 ? '' : good ? 'good' : 'bad';
                return (
                  <div key={r.key} className={`change-card ${tone}`}>
                    <div className="cc-label"><span aria-hidden="true">{ROW_ICON[r.key]} </span>{r.label}</div>
                    <div className="cc-val">{result.after[r.key].toLocaleString('tr-TR')}</div>
                    <div className="cc-delta"><span aria-hidden="true">{d === 0 ? '•' : d > 0 ? '▲' : '▼'}</span> {sign(d)} {r.unit}<span className="sr-only"> {d === 0 ? 'değişmedi' : good ? 'iyi yönde' : 'kötü yönde'}</span></div>
                    <DeltaBar before={result.before[r.key]} after={result.after[r.key]} max={r.max} tone={d === 0 ? 'flat' : good ? 'good' : 'bad'} />
                  </div>
                );
              })}
            </div>
            <p className="tradeoff"><strong>⚖️ Her kararın bir bedeli var:</strong> {chosen?.tradeoff}</p>
            {result.reasoning && <p><strong>💬 Senin gerekçen:</strong> {result.reasoning}</p>}
            <TutorCard />
            <label className="text-row">
              <span>🔬 <b>Gerçek hayatta:</b> {scenario.transferQuestion}</span>
              <textarea value={transferValue} rows={2} onChange={(e) => gameStore.setTransferAnswer(e.target.value)} />
            </label>
            <details className="more">
              <summary>🔎 Ayrıntılar: şehre etkisi ve denemelerin</summary>
              <CrossNote />
              {attempts.length > 1 && (
                <ul className="attempts">
                  {attempts.map((h, i) => (
                    <li key={i}>{h.choiceId}: {scenario.rows.map((r) => `${r.label} ${h.after[r.key].toLocaleString('tr-TR')}`).join(' · ')}</li>
                  ))}
                </ul>
              )}
              <p className="notice">{SIMULATION_NOTICE}</p>
            </details>
            <div className="actions">
              <button onClick={gameStore.retry}>🔄 Başka yol dene</button>
              <button onClick={gameStore.openComparison}>🔮 İki geleceği karşılaştır</button>
              <NextTaskButton scenarioId={scenario.id} />
              <button className={scenario.id === 'council_005' ? '' : 'primary'} onClick={gameStore.closeDecision}>🗺️ Haritaya dön</button>
            </div>
          </>
        )}
      </div>
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
