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

/** Ayarlar ve erişilebilirlik: hareket, yazı boyutu, ses, grafik kalitesi; bu cihazda saklanır. */
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
      <fieldset className="setting">
        <legend>Ses</legend>
        {([
          ['Ses efektleri', s.sound, s.volume, settingsStore.setSound, settingsStore.setVolume],
          ['Müzik', s.music, s.musicVolume, settingsStore.setMusic, settingsStore.setMusicVolume],
          ['Ortam sesi (rüzgâr, kuş, dalga)', s.ambient, s.ambientVolume, settingsStore.setAmbient, settingsStore.setAmbientVolume],
        ] as const).map(([label, on, v, setOn, setV]) => (
          <div key={label} className="sound-row">
            <label className="radio-row"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /> {label} açık</label>
            <label className="radio-row">{label} seviyesi
              <input type="range" min={0} max={100} step={5} value={Math.round(v * 100)} disabled={!on} aria-valuetext={`%${Math.round(v * 100)}`} onChange={(e) => setV(Number(e.target.value) / 100)} />
              <span>%{Math.round(v * 100)}</span>
            </label>
          </div>
        ))}
        <p className="hint">Müzik ve sesler kodla üretilir. Sınıfta kulaklıksız oynarken müziği kapalı tutmanızı öneririz.</p>
      </fieldset>
      <fieldset className="setting">
        <legend>Grafik</legend>
        <label className="radio-row"><input type="radio" name="graphics" checked={s.graphics === 'high'} onChange={() => settingsStore.setGraphics('high')} /> <strong>Yüksek</strong> <small>araçlar, yayalar, hava efektleri</small></label>
        <label className="radio-row"><input type="radio" name="graphics" checked={s.graphics === 'low'} onChange={() => settingsStore.setGraphics('low')} /> <strong>Düşük</strong> <small>eski tabletler için: sürekli animasyonlar kapalı</small></label>
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
