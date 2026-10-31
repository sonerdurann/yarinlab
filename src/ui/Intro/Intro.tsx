import { gameStore, useGameState } from '../../state/gameStore';
import { Modal } from '../Modal/Modal';
import { Logo } from '../Logo';

/** Açılış (kılavuz §20, 00:00-00:45): 2040 mesajı, hedef ve kontrol anlatımı. */
export function Intro() {
  const { introOpen } = useGameState();
  if (!introOpen) return null;
  return (
    <Modal titleId="intro-title" title="2040'tan bir mesaj var" onClose={gameStore.closeIntro}>
      <div className="intro-hero">
        <Logo size={48} />
        <blockquote>
          “Merhaba! Ben 2040'ta aynı okulda okuyorum. Yıllar içinde kantinde yemek israfı büyüdü; bütçe, su, enerji ve atık dengemiz bozuldu.
          Bugün senin vereceğin kararlar bizim geleceğimizi değiştirebilir. Bize yardım eder misin?”
        </blockquote>
      </div>
      <h3>Hedefin</h3>
      <p>
        Okulun yemekhanesinde israfı azaltırken öğrencilerin ihtiyacını karşıla. İyi çözüm tek bir sayıya değil, <strong>gerekçeli dengeye</strong> bakar.
      </p>
      <h3>Nasıl oynanır?</h3>
      <ul className="howto">
        <li>
          <strong>Haritayı gez:</strong> sürükle (dokunmatikte kaydır). Yakınlaştırmak için fare tekerleği veya + / − düğmeleri.
        </li>
        <li>
          <strong>Okulu ve kantini bul:</strong> Kantin'e tıkla ya da “Göreve başla” düğmesini ve Bölge listesini kullan (klavyeyle de çalışır).
        </li>
        <li>
          <strong>Karar ver:</strong> üç seçenekten birini seç, nedenini yaz, sonucu gör; sonra başka bir kararı dene ve iki geleceği karşılaştır.
        </li>
        <li>
          <strong>Unutma:</strong> burada gördüğün sayılar bir <em>simülasyondur</em>; gerçek okul ölçümü değildir.
        </li>
      </ul>
      <div className="actions">
        <button className="primary" onClick={gameStore.closeIntro}>
          Başla
        </button>
      </div>
    </Modal>
  );
}
