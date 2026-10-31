import { gameStore, useGameState } from '../../state/gameStore';
import { Modal } from '../Modal/Modal';
import { Logo } from '../Logo';
import { authStore, useAuth } from '../../state/authStore';

/** Açılış (kılavuz §20, 00:00-00:45): 2040 mesajı, hedef ve kontrol anlatımı. */
export function Intro() {
  const { introOpen } = useGameState();
  const { user } = useAuth();
  if (!introOpen) return null;
  return (
    <Modal titleId="intro-title" title="2040'tan bir mesaj var" onClose={gameStore.closeIntro}>
      <div className="intro-hero">
        <Logo size={48} />
        <blockquote>
          “Geleceğimiz düşündüğümüzden daha hızlı değişiyor. Şehrimiz sıcak hava dalgaları, kuraklık, enerji sorunları ve kaynak yetersizliğiyle
          mücadele ediyor. Ancak geleceğimiz henüz kesinleşmedi. Bugün vereceğin kararlar, yarının dünyasını değiştirebilir.”
          <footer>— 2040'tan bir öğrenci</footer>
        </blockquote>
      </div>
      <h3>Hedefin</h3>
      <p>
        Yıl 2026. Küçük bir okulun ve çevresindeki yerleşimin sorumluluğu sende. Okulu geliştir, enerji tesisleri kur, kantini, tarımı, atığı ve kıyıyı yönet.
        Amaç yalnızca güzel bir şehir değil: toplumun ihtiyaçları ile çevre arasında <strong>gerekçeli bir denge</strong> kurmak.
      </p>
      <h3>Nasıl oynanır?</h3>
      <ul className="howto">
        <li>
          <strong>Haritayı gez:</strong> sürükle (dokunmatikte kaydır). Yakınlaştırmak için fare tekerleği veya + / − düğmeleri.
        </li>
        <li>
          <strong>Bölgeleri keşfet:</strong> yapılara tıkla ya da Görevler ve Bölge listesini kullan (klavyeyle de çalışır). Yedi modülün görevleri aynı şehri etkiler.
        </li>
        <li>
          <strong>Şehir, Karbon ve Kıyı:</strong> haritadan açılır. Gelecek Meclisi okul panelinden ve görev listesinden açılır.
        </li>
        <li>
          <strong>Karar ver ve inşa et:</strong> seçeneklerden birini seç, nedenini yaz, sonucu gör; başka bir kararı dene ve iki geleceği karşılaştır. Görev tamamladıkça yeni yapılar açılır; “Günü bitir” ile zaman, mevsim ve hava ilerler.
        </li>
        <li>
          <strong>Unutma:</strong> burada gördüğün sayılar bir <em>simülasyondur</em>; gerçek okul ölçümü değildir.
        </li>
      </ul>
      <div className="actions">
        {!user && <button onClick={() => { gameStore.closeIntro(); authStore.open(); }}>Giriş yap / sınıfa katıl</button>}
        <button className="primary" onClick={gameStore.closeIntro}>
          Başla
        </button>
      </div>
    </Modal>
  );
}
