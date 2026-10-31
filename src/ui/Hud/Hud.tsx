import { useGameState } from '../../state/gameStore';
import { teacherStore } from '../../state/teacherStore';
import { useCountUp } from '../useCountUp';
import { Logo } from '../Logo';
import { settingsStore } from '../../state/settingsStore';
import { ASSUMED_COLLECTION_CAPACITY_KG, CITY_FLOOD_NOTE, ENERGY_RISK_NOTE, OCEAN_NOTE, WASTE_RULE_NOTE } from '../../data/constants';
import { coastalRisk, councilStanding, floodRisk, outageRisk, wasteCollection } from '../../game/systems/ClimateEngine';
import { gameStore as gs } from '../../state/gameStore';
import { RoadmapButton } from '../Roadmap/RoadmapPanel';

const fmt = (n: number) => n.toLocaleString('tr-TR');

/** Animasyonlu sayı: ekranda ilerler, ekran okuyucu yalnızca son değeri okur. */
function Num({ value }: { value: number }) {
  const v = useCountUp(value);
  return (
    <>
      <span aria-hidden="true">{fmt(v)}</span>
      <span className="sr-only">{fmt(value)}</span>
    </>
  );
}

/** Üst durum çubuğu (kılavuz §09: dönem / enerji / atık / bütçe). */
export function TopBar() {
  const { world } = useGameState();
  return (
    <header className="topbar">
      <span className="brand">
        <Logo />
        <strong>YARINLAB / 2040</strong>
      </span>
      <span className="topbar-stats" aria-label="Dünya durumu özeti">
        <span>Enerji <Num value={world.energyScore} /></span>
        <span>Atık <Num value={world.foodWasteKg} /></span>
        <span>Bütçe <Num value={world.budget} /></span>
      </span>
      <span className="topbar-actions">
        <button onClick={gs.openIntro} aria-label="Nasıl oynanır?">?</button>
        <button onClick={teacherStore.openTeacher}>Öğretmen</button>
        <button onClick={teacherStore.openSources}>Kaynaklar</button>
        <RoadmapButton />
        <button onClick={settingsStore.open} aria-label="Ayarlar">⚙</button>
      </span>
    </header>
  );
}

const meters: { key: 'energyScore' | 'waterScore' | 'wellbeing'; label: string }[] = [
  { key: 'energyScore', label: 'Enerji' },
  { key: 'waterScore', label: 'Su' },
  { key: 'wellbeing', label: 'Refah' },
];

/** Sağ sonuç paneli: ortak dünya durumu. */
export function WorldStatus() {
  const { world, energySystem, wasteSystem, citySystem, carbonSystem, oceanSystem, councilSystem, applied, history } = useGameState();
  const risk = outageRisk(energySystem.renewableShare, energySystem.storageUnits);
  const col = wasteCollection(world.foodWasteKg, wasteSystem.otherWasteKg, ASSUMED_COLLECTION_CAPACITY_KG, wasteSystem.sortingRecovery);
  const flood = floodRisk(citySystem.sealedShare, citySystem.greenShare, citySystem.rainShare);
  const coast = coastalRisk(col.wasteLoadKg, oceanSystem.habitatCare);
  const meclis = councilStanding({ appliedIds: Object.keys(applied), history, evidenceBias: councilSystem.evidenceBias });
  return (
    <aside className="panel world-status" aria-label="Dünya durumu">
      <h2>Dünya durumu</h2>
      <p className="stat">
        <span>Gıda atığı</span>
        <strong><Num value={world.foodWasteKg} /> kg/gün</strong>
      </p>
      {meters.map((m) => (
        <div key={m.key} className="meter">
          <div className="meter-label">
            <span>{m.label}</span>
            <strong><Num value={world[m.key]} />/100</strong>
          </div>
          <div className="meter-track" role="progressbar" aria-valuenow={world[m.key]} aria-valuemin={0} aria-valuemax={100} aria-label={m.label}>
            <div className="meter-fill" style={{ width: `${world[m.key]}%` }} />
          </div>
        </div>
      ))}
      <p className="stat" title="Atık modülü: gıda atığı + diğer okul atığı, varsayılan toplama kapasitesine bölünür">
        <span>Toplama ihtiyacı (Atık)</span>
        <strong>
          <Num value={col.collectionNeed} /> sefer/gün
        </strong>
      </p>
      <p className="stat" title={ENERGY_RISK_NOTE}>
        <span>Kesinti riski (Enerji)</span>
        <strong>
          <Num value={risk} />/100
        </strong>
      </p>
      <p className="stat" title={CITY_FLOOD_NOTE}>
        <span>Taşkın riski (Şehir)</span>
        <strong>
          <Num value={flood} />/100
        </strong>
      </p>
      <p className="stat" title={OCEAN_NOTE}>
        <span>Kıyı riski</span>
        <strong>
          <Num value={coast} />/100
        </strong>
      </p>
      <p className="stat" title="İddia inceleme puanı. Sera gazı miktarı değildir.">
        <span>İddia inceleme</span>
        <strong>
          <Num value={carbonSystem.claimScore} />/100
        </strong>
      </p>
      <p className="stat" title="Oynanan modüller, iki kantin seçeneği, gerekçe ve meclis seçimi. Sera gazı miktarı değildir.">
        <span>Meclis puanı</span>
        <strong>
          <Num value={meclis} />/100
        </strong>
      </p>
      <p className="hint">{WASTE_RULE_NOTE}</p>
      <p className="stat">
        <span>Bütçe (oyun puanı)</span>
        <strong><Num value={world.budget} /></strong>
      </p>
    </aside>
  );
}
