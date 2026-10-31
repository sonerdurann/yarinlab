import { gameStore, useGameState } from '../../state/gameStore';

/** Rehber: kural motoru sonucuna dayalı açıklama + en çok 2 yönlendirici soru (kılavuz §18). */
export function TutorCard() {
  const { tutor, reflection } = useGameState();

  if (tutor.status !== 'ready' || !tutor.outcome) {
    return (
      <section className="tutor" aria-live="polite" aria-busy="true">
        <h3>Rehber</h3>
        <p>Geri bildirim hazırlanıyor…</p>
      </section>
    );
  }
  const { source, response } = tutor.outcome;
  const qs = [response.question1, response.question2];
  return (
    <section className="tutor" aria-live="polite" aria-label="Rehber geri bildirimi">
      <h3>Yapay zekâ iklim öğretmeni</h3>
      <p className="source">{source === 'ai' ? 'Dil modeli yanıtı (sayılar ve kaynaklar doğrulandı)' : 'Doğrulanmış hazır geri bildirim (model servisi yokken de çalışır)'}</p>
      <p>{response.summary}</p>
      <p>
        <strong>Ödünleşim:</strong> {response.tradeoff}
      </p>
      <ol className="questions">
        {qs.map((q, i) => (
          <li key={i}>
            <label className="text-row">
              <span>{q}</span>
              <textarea rows={2} value={reflection[i]} onChange={(e) => gameStore.setReflection(i as 0 | 1, e.target.value)} />
            </label>
          </li>
        ))}
      </ol>
    </section>
  );
}
