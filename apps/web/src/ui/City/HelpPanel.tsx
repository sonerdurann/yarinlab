import { gameStore, useGameState } from '../../state/gameStore';
import { Modal } from '../Modal/Modal';

/** Yardım ve eğitim rehberi (öğrenci + öğretmen). */
export function HelpPanel() {
  const s = useGameState();
  if (s.overlay !== 'help') return null;
  return (
    <Modal titleId="help-title" title="Yardım ve rehber" onClose={gameStore.closeOverlay} wide>
      <h3>Oyunun amacı</h3>
      <p>2040'tan gelen öğrenci senden yardım istiyor. Şehrin bütçesi, enerjisi, suyu, atığı, ekosistemi ve insanların refahı arasında <strong>denge</strong> kur. Tek bir göstergeyi en yükseğe çıkarmak iyi gelecek demek değildir.</p>
      <h3>Temel döngü</h3>
      <ol>
        <li><strong>Bölge seç:</strong> haritada bir yapıya tıkla veya Görevler listesini kullan. Her bölgenin görevleri farklı bir iklim problemini anlatır.</li>
        <li><strong>Karar ver ve gerekçelendir:</strong> seçeneklerden birini seç, nedenini yaz. Puanın sonuç, gerekçe ve dengeden oluşur.</li>
        <li><strong>Sonucu incele:</strong> önce/sonra göstergeleri, ödünleşim ve yapay zekâ öğretmeninin soruları. Başka bir kararı dene, iki geleceği karşılaştır.</li>
        <li><strong>İnşa et:</strong> görev tamamladıkça yeni yapılar açılır. Kurulan yapılar maliyet ve bakım ister, şehrin göstergelerini değiştirir.</li>
        <li><strong>Günü bitir:</strong> hava ve mevsim değişir; güneş gece üretmez, fırtına şebekeyi zorlar, sıcak dalga refahı düşürür. Olay günlüğü her sonucun nedenini yazar.</li>
      </ol>
      <h3>Kontroller</h3>
      <ul>
        <li>Haritayı sürükle (dokunmatikte parmakla kaydır); fare tekerleği, + / − düğmeleri veya klavyede + / − ile yakınlaştır.</li>
        <li>Tüm pencereler klavyeyle kullanılır: Tab ile gezin, Enter/Boşluk ile seç, Esc ile kapat. “Bölge listesine geç” bağlantısı haritayı atlar.</li>
        <li>Ayarlar: hareketi azaltma, yazı boyutu, ses.</li>
      </ul>
      <h3>Sayılar ne anlama geliyor?</h3>
      <p><span className="tag sim">Simülasyon</span> oyunun kurallarıyla hesaplanır. <span className="tag assume">Varsayım</span> belgelenmiş bir varsayıma dayanır. <span className="tag measured">Ölçülmüş</span> yalnızca okulda gerçekten yaptığın ölçümlerdir. Oyundaki sayılar gerçek okul ya da şehir ölçümü değildir.</p>
      <h3>Öğretmenler için</h3>
      <p>Öğretmen hesabıyla giriş yapıp sınıf oluşturun, sınıf kodunu öğrencilere verin. Panelden görev atayabilir, ilerleme ve kazanım raporlarını görebilir, CSV/PDF indirebilirsiniz. Öğrencilerden e-posta veya gerçek ad istenmez.</p>
      <div className="actions"><button className="primary" onClick={gameStore.closeOverlay}>Anladım</button></div>
    </Modal>
  );
}
