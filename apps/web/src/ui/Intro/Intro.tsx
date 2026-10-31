import { useState } from 'react';
import { gameStore, useGameState } from '../../state/gameStore';
import { Modal } from '../Modal/Modal';
import { Mascot, type Mood } from '../Mascot';
import { authStore, useAuth } from '../../state/authStore';

type Scene = { cls: string; mood: Mood; big: string; text: React.ReactNode };
const SCENES: Scene[] = [
  { cls: 'scene-2040', mood: 'wave', big: '📡', text: <>Merhaba! Ben <b>Yarı</b>. 2040 yılından sana bir mesaj gönderiyorum!</> },
  { cls: 'scene-city', mood: 'worried', big: '🌡️ 💧 ⚡', text: <>Şehrimizde sıcak günler, kuraklık ve elektrik kesintileri arttı. Ama geleceğimiz <b>henüz kesinleşmedi</b>.</> },
  { cls: 'scene-choice', mood: 'think', big: '🏫 ☀️ 🌳', text: <>Yıl 2026. Okulun ve çevresi artık <b>senin ellerinde</b>. Her kararın şehri değiştirecek.</> },
  { cls: 'scene-go', mood: 'wow', big: '🚀', text: <>Tek bir sayıyı büyütmek yetmez: insanları, doğayı ve bütçeyi <b>birlikte</b> düşün. Hazır mısın?</> },
];

/** Hikâye başlangıcı: 4 sahnelik çizgi roman + nasıl oynanır kartları. */
export function Intro() {
  const { introOpen } = useGameState();
  const { user } = useAuth();
  const [i, setI] = useState(0);
  if (!introOpen) return null;
  const last = i === SCENES.length;
  const sc = SCENES[Math.min(i, SCENES.length - 1)];
  return (
    <Modal titleId="intro-title" title={last ? 'Nasıl oynanır?' : '2040’tan bir mesaj var!'} onClose={gameStore.closeIntro} wide>
      <div className="comic" aria-live="polite">
        {!last ? (
          <div className={`comic-scene ${sc.cls}`}>
            <div>
              <div className="big" aria-hidden="true">{sc.big}</div>
              <Mascot mood={sc.mood} size={110} />
              <p className="caption">{sc.text}</p>
            </div>
          </div>
        ) : (
          <ul className="howto-cards">
            <li><b aria-hidden="true">🗺️</b>Haritayı sürükle, yakınlaştır. Zıplayan <b aria-hidden="true" style={{ display: 'inline', fontSize: '1rem' }}>❗</b> işaretleri görev demek.</li>
            <li><b aria-hidden="true">🤔</b>Bir seçim yap ve <strong>nedenini</strong> söyle. Yıldızlar gerekçene de bakar.</li>
            <li><b aria-hidden="true">🏗️</b>Görev bitirdikçe yeni yapılar açılır: güneş paneli, park, tamir atölyesi…</li>
            <li><b aria-hidden="true">🌙</b>“Günü bitir” ile zaman akar: hava ve mevsim değişir.</li>
            <li><b aria-hidden="true">🔬</b>Buradaki sayılar bir <strong>oyun</strong>; gerçek ölçüm değil. Gerçeğini okulunda ölçebilirsin!</li>
          </ul>
        )}
        <div className="comic-dots" aria-hidden="true">{[...SCENES, null].map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
      </div>
      <div className="actions">
        {i > 0 && <button onClick={() => setI(i - 1)}>← Geri</button>}
        {!user && last && <button onClick={() => { gameStore.closeIntro(); authStore.open(); }}>Sınıfıma katıl</button>}
        {!last && <button className="link" onClick={() => setI(SCENES.length)}>Atla</button>}
        {!last ? <button className="primary" onClick={() => setI(i + 1)}>İleri →</button>
          : <button className="primary" onClick={() => { setI(0); gameStore.closeIntro(); }}>Başla</button>}
      </div>
    </Modal>
  );
}
