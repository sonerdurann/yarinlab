import { BUILD_SLOTS, BUILDINGS, buildingDef, isUnlocked, unlockText, WEATHER_ICON, type ZoneId } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { cityOf, unlockCtx } from '../../state/city';
import { Modal } from '../Modal/Modal';
import { EnergyChart } from './EnergyChart';

const ZONE_TR: Record<ZoneId, string> = {
  school: 'Okul kampüsü', canteen: 'Kantin ve mutfak', energy: 'Enerji bölgesi', waste: 'Geri dönüşüm merkezi',
  city: 'Şehir merkezi ve mahalleler', farm: 'Tarım ve sera', ocean: 'Kıyı ve deniz',
};
const ZONES = Object.keys(ZONE_TR) as ZoneId[];
const BUILDING_ICON: Record<string, string> = { solar: '☀️', wind: '🌬️', battery: '🔋', retrofit: '💡', climateLab: '🔬', compost: '🪱', sorting: '♻️', repair: '🛠️', park: '🌳', rainTank: '🌧️', bus: '🚌', waterPlant: '🚰', greenhouse: '🌱', wetland: '🦆', trap: '🕸️' };

const effectText = (e: Record<string, number | undefined>) => {
  const L: Record<string, string> = {
    solarKw: 'güneş kW', windKw: 'rüzgâr kW', storageKwh: 'depolama kWh', efficiency: 'talep azaltma', extraDemandKwh: 'ek talep kWh/gün',
    wasteDivertKg: 'atıktan ayrılan kg/gün', foodWasteCutKg: 'gıda atığı −kg/gün', greenShare: 'yeşil alan', rainShare: 'yağmur hasadı',
    sealedShare: 'sızdırmaz yüzey', shade: 'gölge', habitatCare: 'habitat bakımı', waterSaveM3: 'su tasarrufu m³/gün',
    transitShare: 'toplu ulaşım', wellbeing: 'refah', literacy: 'okuryazarlık',
  };
  return Object.entries(e).map(([k, v]) => `${k === 'efficiency' ? `%${Math.round((v ?? 0) * 100)}` : (v ?? 0) > 0 ? `+${v}` : v} ${L[k] ?? k}`).join(', ');
};

/** İnşa ve geliştirme: maliyet, bakım, kapasite ve sonuç hesaplarıyla çalışır (oyun puanı; gerçek para değildir). */
export function BuildPanel() {
  const s = useGameState();
  if (s.overlay !== 'build') return null;
  const zone = (s.buildZone as ZoneId) ?? 'energy';
  const ctx = unlockCtx(s);
  const city = cityOf(s);
  const slots = BUILD_SLOTS.filter((x) => x.zone === zone);
  const free = slots.filter((x) => !s.sim.buildings.some((b) => b.slot === x.id));
  const here = s.sim.buildings.filter((b) => slots.some((x) => x.id === b.slot));
  const defs = BUILDINGS.filter((b) => b.zone === zone);
  return (
    <Modal titleId="build-title" title="İnşa ve geliştirme" onClose={gameStore.closeOverlay} wide>
      <p>Bütçe: <strong>{s.world.budget.toLocaleString('tr-TR')} puan</strong> · Günlük bakım: {city.indicators.upkeep} puan · Boş alan: {free.length}/{slots.length}</p>
      <div role="tablist" className="tabs" aria-label="Bölge">
        {ZONES.map((z) => (
          <button key={z} role="tab" aria-selected={z === zone} onClick={() => gameStore.setBuildZone(z)}>{ZONE_TR[z]}</button>
        ))}
      </div>
      {zone === 'energy' && (
        <section aria-label="Bugünün enerji dengesi">
          <h3>Bugünün enerji dengesi ({WEATHER_ICON[city.indicators.weather]} {city.indicators.weatherTr})</h3>
          <EnergyChart day={city.indicators.energy} />
        </section>
      )}
      {here.length > 0 && (
        <>
          <h3>Bu bölgedeki yapılar</h3>
          <ul className="build-list">
            {here.map((b) => {
              const d = buildingDef(b.type)!;
              const next = b.level < 3 ? d.cost[b.level] : null;
              return (
                <li key={b.id}>
                  <div><span className="bld-ico" aria-hidden="true">{BUILDING_ICON[d.type] ?? '🏠'}</span><strong>{d.name}</strong> · {'★'.repeat(b.level)}{'☆'.repeat(3 - b.level)}<br /><span className="hint">{effectText(Object.fromEntries(Object.entries(d.perLevel).map(([k, v]) => [k, (v as number) * b.level])))}</span></div>
                  <div className="actions">
                    {next !== null && <button onClick={() => gameStore.upgrade(b.id)} disabled={s.world.budget < next}>Yükselt ({next})</button>}
                    <button onClick={() => gameStore.demolish(b.id)}>Kaldır</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <h3>Kurulabilir yapılar</h3>
      <ul className="build-list">
        {defs.map((d) => {
          const open = isUnlocked(d, ctx);
          const slot = free[0];
          return (
            <li key={d.type} className={open ? '' : 'locked'}>
              <div>
                <span className="bld-ico" aria-hidden="true">{BUILDING_ICON[d.type] ?? '🏠'}</span><strong>{d.name}</strong> — {d.description}<br />
                <span className="hint">Maliyet {d.cost[0]} · bakım {d.upkeep}/gün · etki/seviye: {effectText(d.perLevel)}</span>
                {!open && <><br /><span className="hint">🔒 {unlockText(d)}</span></>}
              </div>
              <div className="actions">
                <button className="primary" disabled={!open || !slot || s.world.budget < d.cost[0]} onClick={() => slot && gameStore.build(d.type, slot.id)}>
                  {!slot ? 'Alan dolu' : 'Kur'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {s.notice && <p role="status" className="notice">{s.notice}</p>}
      <p className="hint">Yapı değerleri simülasyon varsayımıdır (docs/SIMULATION_ASSUMPTIONS.md).</p>
    </Modal>
  );
}
