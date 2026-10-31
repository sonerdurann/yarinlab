import { useState } from 'react';
import { Modal } from '../Modal/Modal';

const done = [
  'Yedi modül × beş görev (35 görev): karar, gerekçe, puan, iki gelecek karşılaştırması, görev zinciri',
  'Ortak şehir simülasyonu: gün/mevsim/hava, saatlik enerji, 10 gösterge, olay günlüğü, tohumlu tekrar',
  'İnşa ve yükseltme (15 yapı), kilitler, seviye ve rozetler, final 2040 sonları',
  'Öğrenci/öğretmen hesapları, sunucuya otomatik kayıt, çevrim dışı kuyruk, ön/son değerlendirme',
];
const now = [
  'Tüm göstergeler simülasyon veya belgelenmiş varsayımdır; gerçek ölçüm değildir',
  'Emisyon endeksi birimsizdir; kg CO₂e hesaplanmaz',
  'Yapay zekâ öğretmeni yanıtları doğrulanır; doğrulanmazsa hazır geri bildirim gösterilir',
];
const later = [
  'Canlı dil modeli bağlantısı yapılandırma gerektirir (anahtar yokken doğrulanmış yedek çalışır)',
  'Gerçek cihazlarda performans ölçümü ve okul pilotu yapılmadı',
  'KVKK metinleri hukuki inceleme gerektirir; canlı yayın adresi yok',
];

/** Sunumda P0 / P1 / P2 ayrımı (kılavuz §27 madde 12). */
export function RoadmapButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Ne bitti, ne duruyor?</button>
      {open && (
        <Modal titleId="road-title" title="Ne bitti, ne duruyor" onClose={() => setOpen(false)}>
          <p>“Çalışıyor” yalnızca aşağıdaki test edilmiş maddeler içindir. Ayrıntı: docs/KNOWN_ISSUES.md.</p>
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
