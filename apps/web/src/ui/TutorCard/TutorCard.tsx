import { gameStore, useGameState } from '../../state/gameStore';
import { Mascot, Speech } from '../Mascot';

/** Yapay zekâ iklim öğretmeni: Yarı'nın ağzından açıklama + en çok 2 düşündürücü soru (doğrudan cevap vermez). */
export function TutorCard() {
  const { tutor, reflection } = useGameState();
  if (tutor.status !== 'ready' || !tutor.outcome) {
    return (
      <section className="tutor" aria-live="polite" aria-busy="true">
        <div className="speech"><Mascot mood="think" size={56} /><div className="bubble"><strong className="bubble-name">Yarı düşünüyor…</strong>Kararını inceliyorum.</div></div>
      </section>
    );
  }
  const { source, response } = tutor.outcome;
  const qs = [response.question1, response.question2];
  return (
    <section className="tutor" aria-live="polite" aria-label="Yapay zekâ iklim öğretmeni">
      <h3 className="sr-only">Yapay zekâ iklim öğretmeni</h3>
      <Speech mood="happy" size={64} name="Yarı · iklim öğretmenin">
        {response.summary} {response.tradeoff}
      </Speech>
      <p className="source hint">{source === 'ai' ? 'Yapay zekâ yanıtı (sayılar ve kaynaklar doğrulandı)' : 'Doğrulanmış hazır geri bildirim (internet olmadan da çalışır)'}</p>
      <ol className="questions">
        {qs.map((q, i) => (
          <li key={i}>
            <label className="text-row">
              <span>🤔 {q}</span>
              <textarea rows={2} value={reflection[i]} placeholder="Düşündüğünü birkaç kelimeyle yaz…" onChange={(e) => gameStore.setReflection(i as 0 | 1, e.target.value)} />
            </label>
          </li>
        ))}
      </ol>
    </section>
  );
}
