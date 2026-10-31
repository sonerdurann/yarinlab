import { useState } from 'react';
import { Modal } from '../Modal/Modal';

const done = [
  'P0 Kantin görevi: üç karar, gerekçe, iki gelecek, yedek rehber',
  'P1 Enerji Adası ve Döngü Ustaları; okul özeti; sekmeli öğretmen paneli',
  'P2 KrizKenti, Karbon Dedektifleri, Mavi Nöbet, Gelecek Meclisi',
  'Yerel anonim kurum kodu ve bu cihazdaki modül ilerlemesi',
];
const now = [
  'Taşkın, kıyı, iddia inceleme ve meclis puanları simülasyon varsayımıdır',
  'Karbon modülü sera gazı miktarı hesaplamaz',
  'Meclis harita pini değildir; okul ve görev listesinden açılır',
];
const later = [
  'Canlı model servisi: anahtar yokken oyun yedek açıklamayla biter',
  'Bulut sınıf eşitlemesi yok; kod başka cihazla eşleşmez',
  'Gerçek telefon provası, 90 sn prova, saha görüşmesi, yayın',
];

/** Sunumda P0 / P1 / P2 ayrımı (kılavuz §27 madde 12). */
export function RoadmapButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Kapsam</button>
      {open && (
        <Modal titleId="road-title" title="Ne bitti, ne duruyor" onClose={() => setOpen(false)}>
          <p>Yedi bölge oynanır. “Tamamı çalışıyor” yalnızca aşağıdaki bitmiş maddeler içindir. Canlı model bu listede yoktur.</p>
          <h3>Bitti</h3>
          <ul className="indicators">
            {done.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3>Bu sürümde okunan kurallar</h3>
          <ul className="indicators">
            {now.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3>Yol haritası, henüz yok</h3>
          <ul className="indicators">
            {later.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="notice">Değerler simülasyon göstergesidir. Kanıtlanmış karbon azaltımı veya tamamlanmış okul pilotu iddia edilmez.</p>
          <div className="actions">
            <button className="primary" onClick={() => setOpen(false)}>
              Kapat
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
