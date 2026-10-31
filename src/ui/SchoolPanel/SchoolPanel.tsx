import { hotspots } from '../../game/tiles/hotspots';
import { gameStore } from '../../state/gameStore';
import { Modal } from '../Modal/Modal';

type Props = { onPick: (id: string) => void };

const phase = (id: string) => (id === 'canteen' ? 'ana görev' : id === 'energy' || id === 'waste' ? 'P1' : 'P2');

/** Okul özeti (kılavuz §08 school.overview): görev listesi. Meclis pin değildir. */
export function SchoolPanel({ onPick }: Props) {
  const open = hotspots.filter((h) => !h.locked && h.id !== 'school');
  const locked = hotspots.filter((h) => h.locked);
  return (
    <Modal titleId="school-title" title="Okul" onClose={gameStore.closePanel}>
      <p>Burası bugünkü okulun. 2040'tan gelen çağrı, kantin, enerji, atık, şehir, karbon ve kıyı kararlarının aynı yerleşkeyi etkilemesini ister.</p>
      <h3>Açık görevler</h3>
      <div className="actions left">
        {open.map((h) => (
          <button key={h.id} onClick={() => onPick(h.id)}>
            {h.label}
            {` · ${phase(h.id)}`}
          </button>
        ))}
        <button onClick={() => gameStore.openCouncil()}>Gelecek Meclisi · P2</button>
      </div>
      {locked.length > 0 && (
        <>
          <h3>Henüz kapalı</h3>
          <ul className="indicators">
            {locked.map((h) => (
              <li key={h.id}>{h.label}: sonraki sürüm</li>
            ))}
          </ul>
        </>
      )}
      <p className="notice">Haritadaki sayılar simülasyondur; okul ölçümü değildir.</p>
      <div className="actions">
        <button className="primary" onClick={gameStore.closePanel}>
          Haritaya dön
        </button>
      </div>
    </Modal>
  );
}
