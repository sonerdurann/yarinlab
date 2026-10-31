import { settingsStore, useSettings, type MotionSetting, type TextSize } from '../../state/settingsStore';
import { Modal } from '../Modal/Modal';

const MOTION: { id: MotionSetting; label: string; hint: string }[] = [
  { id: 'auto', label: 'Otomatik', hint: 'Cihazının "hareketi azalt" ayarını izler' },
  { id: 'reduce', label: 'Azalt', hint: 'Animasyonlar ve sayaç akışı kapalı' },
  { id: 'full', label: 'Tam', hint: 'Tüm animasyonlar açık' },
];
const SIZES: { id: TextSize; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Büyük' },
  { id: 'xlarge', label: 'Çok büyük' },
];

/** Ayarlar (kılavuz §09, §13): hareket azaltma ve yazı boyutu; bu cihazda saklanır. */
export function SettingsPanel() {
  const s = useSettings();
  if (!s.open) return null;
  return (
    <Modal titleId="set-title" title="Ayarlar" onClose={settingsStore.close}>
      <fieldset className="setting">
        <legend>Hareket</legend>
        {MOTION.map((m) => (
          <label key={m.id} className="radio-row">
            <input type="radio" name="motion" value={m.id} checked={s.motion === m.id} onChange={() => settingsStore.setMotion(m.id)} />
            <span>
              <strong>{m.label}</strong> <small>{m.hint}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset className="setting">
        <legend>Yazı boyutu</legend>
        <div className="size-row">
          {SIZES.map((z) => (
            <label key={z.id} className={s.textSize === z.id ? 'size on' : 'size'}>
              <input type="radio" name="textsize" value={z.id} checked={s.textSize === z.id} onChange={() => settingsStore.setTextSize(z.id)} />
              {z.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="hint">Ayarlar yalnızca bu cihazda saklanır; kişisel veri toplanmaz.</p>
      <div className="actions">
        <button onClick={settingsStore.reset}>Varsayılana dön</button>
        <button className="primary" onClick={settingsStore.close}>
          Tamam
        </button>
      </div>
    </Modal>
  );
}
