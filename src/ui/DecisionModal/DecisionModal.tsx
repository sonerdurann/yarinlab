import { food } from '../../data/scenarios';
import { SIMULATION_NOTICE } from '../../data/constants';
import { gameStore, useGameState } from '../../state/gameStore';
import type { Resources } from '../../state/types';
import { TutorCard } from '../TutorCard/TutorCard';
import { Modal } from '../Modal/Modal';

const rows: { key: keyof Resources; label: string; unit: string; lowerIsBetter?: boolean }[] = [
  { key: 'foodWasteKg', label: 'Gıda atığı', unit: 'kg/gün', lowerIsBetter: true },
  { key: 'budget', label: 'Bütçe', unit: 'puan' },
  { key: 'wellbeing', label: 'Memnuniyet', unit: '/100' },
];

const sign = (n: number) => (n > 0 ? `+${n.toLocaleString('tr-TR')}` : n.toLocaleString('tr-TR'));

/** Kantin / Görev 01 karar ve sonuç ekranı (kılavuz §10). */
export function DecisionModal() {
  const s = useGameState();
  if (!s.decisionOpen) return null;
  const { result } = s;
  const chosen = food.choices.find((c) => c.id === (result?.choiceId ?? s.pendingChoiceId));
  const ctx = food.context;

  return (
    <Modal titleId="dm-title" title={food.title} onClose={gameStore.closeDecision} active={!s.comparisonOpen}>
        <p>{food.brief}</p>
        <ul className="facts">
          <li>Öğrenci: {ctx.students}</li>
          <li>Öğün talebi: {ctx.mealDemand}</li>
          <li>Örnek atık: {food.baseline.foodWasteKg} kg/gün</li>
          <li>Bütçe: {ctx.budgetLabel}</li>
          <li>Hedef: denge kurmak</li>
        </ul>

        {!result ? (
          <>
            <fieldset className="choices">
              <legend>Kararını ver</legend>
              {food.choices.map((c) => (
                <label key={c.id} className={s.pendingChoiceId === c.id ? 'choice on' : 'choice'}>
                  <input type="radio" name="choice" value={c.id} aria-label={`${c.id} ${c.label}`} checked={s.pendingChoiceId === c.id} onChange={() => gameStore.pickChoice(c.id)} />
                  <span>
                    <strong>
                      {c.id} · {c.label}
                    </strong>
                    <br />
                    <small>{c.summary}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="reasoning">
              <legend>Bu seçimi neden yaptın?</legend>
              {food.reasoningOptions.map((o) => (
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
                {rows.map((r) => {
                  const d = result.after[r.key] - result.before[r.key];
                  const good = r.lowerIsBetter ? d < 0 : d > 0;
                  return (
                    <tr key={r.key}>
                      <th scope="row">{r.label}</th>
                      <td>{result.before[r.key].toLocaleString('tr-TR')}</td>
                      <td>{result.after[r.key].toLocaleString('tr-TR')}</td>
                      <td>
                        {sign(d)} {r.unit} <span className="sr-only">{d === 0 ? 'değişmedi' : good ? 'olumlu yönde' : 'olumsuz yönde'}</span>
                        <span aria-hidden="true">{d === 0 ? ' •' : good ? ' ▲' : ' ▼'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

            {s.history.length > 1 && (
              <div>
                <h3>Denediğin kararlar</h3>
                <ul className="attempts">
                  {s.history.map((h, i) => (
                    <li key={i}>
                      {h.choiceId}: atık {h.after.foodWasteKg} kg · bütçe {h.after.budget.toLocaleString('tr-TR')} · memnuniyet {h.after.wellbeing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="text-row">
              <span>{food.transferQuestion}</span>
              <textarea value={s.transferAnswer} rows={2} onChange={(e) => gameStore.setTransferAnswer(e.target.value)} />
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
