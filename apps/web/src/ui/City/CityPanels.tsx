import { BADGES, endingFor, levelForXp, WEATHER_ICON, xpForLevel } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { cityOf, completedTaskIds, moduleOf } from '../../state/city';
import { playableScenarios } from '../../data/scenarios';
import { Modal } from '../Modal/Modal';
import { RoadmapButton } from '../Roadmap/RoadmapPanel';
import { authStore, useAuth } from '../../state/authStore';

/** Üst çubuk: tarih, mevsim, hava, seviye ve gün ilerletme. */
export function TimeChip() {
  const s = useGameState();
  const c = cityOf(s).indicators;
  const lvl = levelForXp(s.xp);
  return (
    <span className="time-chip" aria-label="Zaman ve hava">
      <span title="Oyun takvimi">{c.year} {c.seasonTr} · Gün {s.sim.day + 1}</span>
      <span title="Hava">{WEATHER_ICON[c.weather]} {c.weatherTr}</span>
      <span title={`${s.xp} XP`}>Seviye {lvl}</span>
      <button className="primary" onClick={() => gameStore.endDay()}>Günü bitir</button>
    </span>
  );
}

const pct = (n: number) => `${Math.max(0, Math.min(100, n))}%`;
type Row = { label: string; value: string; bar?: number; tag: 'Simülasyon' | 'Varsayım'; title?: string; bad?: boolean };

/** Ortak şehir göstergeleri (promptun 10 göstergesi). Tüm sayılar oyun simülasyonudur. */
export function CityIndicators() {
  const s = useGameState();
  const { indicators: i } = cityOf(s);
  const rows: Row[] = [
    { label: 'Bütçe', value: `${i.budget.toLocaleString('tr-TR')} puan`, tag: 'Simülasyon', title: 'Oyun puanı; gerçek para değildir.' },
    { label: 'Enerji üretim / talep', value: `${i.energy.prodKwh} / ${i.energy.demandKwh} kWh`, tag: 'Simülasyon', bar: i.energy.renewableSharePct, title: `Yenilenebilir pay %${i.energy.renewableSharePct}, kesinti ${i.energy.outageHours} sa` },
    { label: 'Su kullanımı', value: `${i.waterUseM3} m³/gün`, tag: 'Varsayım' },
    { label: 'Atık', value: `${i.wasteKg} kg/gün · ${i.collectionNeed} sefer`, tag: 'Varsayım' },
    { label: 'Gıda kaybı', value: `${i.foodLossKg} kg/gün`, tag: 'Simülasyon' },
    { label: 'Emisyon endeksi', value: `${i.emissionIndex} (başlangıç 100)`, tag: 'Varsayım', title: 'Birimsiz göreli endeks; kgCO₂e değildir.', bad: i.emissionIndex > 100 },
    { label: 'Ekosistem sağlığı', value: `${i.ecosystem}/100`, bar: i.ecosystem, tag: 'Simülasyon' },
    { label: 'İklim dayanıklılığı', value: `${i.resilience}/100`, bar: i.resilience, tag: 'Simülasyon', title: `Taşkın ${i.floodRisk}, sıcak ${i.heatRisk}, enerji riski ${i.energyRisk}` },
    { label: 'Toplum refahı', value: `${i.wellbeing}/100`, bar: i.wellbeing, tag: 'Simülasyon' },
    { label: 'İklim okuryazarlığı', value: `${i.literacy}/100`, bar: i.literacy, tag: 'Simülasyon', title: 'Görev çeşitliliği, gerekçe kalitesi ve karşılaştırmalardan hesaplanır.' },
  ];
  return (
    <aside className="panel world-status" aria-label="Şehir göstergeleri">
      <h2>Şehir durumu</h2>
      {rows.map((r) => (
        <div key={r.label} className="meter" title={r.title}>
          <div className="meter-label">
            <span>{r.label} <span className={r.tag === 'Varsayım' ? 'tag assume' : 'tag sim'}>{r.tag}</span></span>
            <strong className={r.bad ? 'warn' : undefined}>{r.value}</strong>
          </div>
          {r.bar !== undefined && (
            <div className="meter-track" role="progressbar" aria-valuenow={r.bar} aria-valuemin={0} aria-valuemax={100} aria-label={r.label}>
              <div className="meter-fill" style={{ width: pct(r.bar) }} />
            </div>
          )}
        </div>
      ))}
      <div className="actions left">
        <button onClick={() => gameStore.openOverlay('build')}>İnşa</button>
        <button onClick={() => gameStore.openOverlay('log')}>Olay günlüğü</button>
        <button onClick={() => gameStore.openOverlay('progress')}>İlerleme</button>
      </div>
    </aside>
  );
}

export function EventLogPanel() {
  const s = useGameState();
  if (s.overlay !== 'log') return null;
  const entries = [...s.sim.log].reverse();
  return (
    <Modal titleId="log-title" title="Olay günlüğü" onClose={gameStore.closeOverlay} wide>
      <p className="hint">Kararların, yapıların ve hava olaylarının sonuçları neden-sonuç açıklamasıyla kaydedilir. Tohum: {s.sim.seed} (aynı tohum aynı olayları üretir).</p>
      {entries.length === 0 ? <p>Henüz kayıt yok. Bir karar ver veya günü bitir.</p> : (
        <ol className="log-list" reversed>
          {entries.map((e, k) => (
            <li key={k} className={`log-${e.kind}`}>
              <span className="log-day">Gün {e.day + 1}</span> {e.message}
              {e.why && <div className="hint">Neden: {e.why}</div>}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}

const MODULES: { id: string; name: string }[] = [
  { id: 'energy', name: 'Enerji Adası' }, { id: 'carbon', name: 'Karbon Dedektifleri' }, { id: 'city', name: 'KrizKenti' },
  { id: 'food', name: 'Son Tabak' }, { id: 'ocean', name: 'Mavi Nöbet' }, { id: 'waste', name: 'Döngü Ustaları' }, { id: 'council', name: 'Gelecek Meclisi' },
];

/** Öğrenci ilerleme raporu: seviye, rozetler, modüller, görev geçmişi ve puan ayrıntısı. */
export function ProgressPanel() {
  const s = useGameState();
  if (s.overlay !== 'progress') return null;
  const lvl = levelForXp(s.xp);
  const lo = xpForLevel(lvl), hi = xpForLevel(lvl + 1);
  const done = completedTaskIds(s);
  const all = Object.keys(playableScenarios);
  return (
    <Modal titleId="progress-title" title="İlerleme ve rozetler" onClose={gameStore.closeOverlay} wide>
      <p>Seviye <strong>{lvl}</strong> · {s.xp} XP</p>
      <div className="meter-track" role="progressbar" aria-valuenow={s.xp - lo} aria-valuemin={0} aria-valuemax={hi - lo} aria-label="Sonraki seviye">
        <div className="meter-fill" style={{ width: pct(((s.xp - lo) / Math.max(1, hi - lo)) * 100) }} />
      </div>
      <p className="hint">Puan; sonuç (%40), gerekçe (%35) ve denge (%25) birleşimidir. Süre baskısı ve sıralama yoktur.</p>
      <h3>Modüller</h3>
      <ul className="module-grid">
        {MODULES.map((m) => {
          const tasks = all.filter((id) => moduleOf(id) === m.id);
          const n = tasks.filter((t) => done.includes(t)).length;
          return <li key={m.id} className={n === tasks.length && n > 0 ? 'done' : ''}><strong>{m.name}</strong><br />{n}/{tasks.length} görev</li>;
        })}
      </ul>
      <h3>Rozetler</h3>
      <ul className="badge-grid">
        {BADGES.map((b) => {
          const got = s.badges.includes(b.key);
          return <li key={b.key} className={got ? 'got' : ''} aria-label={`${b.name}: ${got ? 'kazanıldı' : 'henüz değil'}`}><strong>{got ? '★' : '☆'} {b.name}</strong><br /><span className="hint">{b.description}</span></li>;
        })}
      </ul>
      <h3>Görev geçmişi</h3>
      {s.scores.length === 0 ? <p>Henüz karar yok.</p> : (
        <table className="result">
          <thead><tr><th>Gün</th><th>Görev</th><th>Seçim</th><th>Sonuç</th><th>Gerekçe</th><th>Denge</th><th>Toplam</th></tr></thead>
          <tbody>
            {[...s.scores].reverse().slice(0, 40).map((r, k) => (
              <tr key={k}><td>{r.day + 1}</td><td>{playableScenarios[r.scenarioId]?.shortTitle ?? r.scenarioId}</td><td>{r.choiceId}</td><td>{r.outcome}</td><td>{r.reasoning}</td><td>{r.balance}</td><td><strong>{r.total}</strong></td></tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}

/** Ana menü: yeni oyun, devam, giriş, ayarlar, yardım. */
export function MainMenu({ onSettings, onTeacher, onSources }: { onSettings: () => void; onTeacher: () => void; onSources: () => void }) {
  const s = useGameState();
  const { user } = useAuth();
  if (s.overlay !== 'menu') return null;
  const has = gameStore.hasSave();
  return (
    <Modal titleId="menu-title" title="YarınLab — Geleceği Sen Tasarla" onClose={gameStore.closeOverlay}>
      <p className="slogan">Bugünün kararları, yarının dünyasını şekillendirir.</p>
      {user && <p>Hoş geldin, <strong>{user.displayName}</strong>.</p>}
      <div className="menu-buttons">
        {has && <button className="primary" onClick={gameStore.closeOverlay}>Devam et (Gün {s.sim.day + 1})</button>}
        <button className={has ? '' : 'primary'} onClick={() => { if (!has || confirm('Mevcut şehir silinip yeni oyun başlasın mı?')) { gameStore.resetSession(); gameStore.closeOverlay(); } }}>Yeni oyun</button>
        <button onClick={authStore.open}>{user ? 'Hesabım' : 'Giriş / kayıt'}</button>
        {user?.role === 'TEACHER' && <button onClick={onTeacher}>Öğretmen paneli</button>}
        <button onClick={() => gameStore.openOverlay('progress')}>İlerleme ve rozetler</button>
        <button onClick={() => gameStore.openOverlay('assessment')}>Öğrenme değerlendirmesi</button>
        <button onClick={onSettings}>Ayarlar</button>
        <button onClick={() => gameStore.openOverlay('help')}>Yardım ve rehber</button>
        <button onClick={onSources}>Kaynaklar ve lisanslar</button>
        <RoadmapButton />
      </div>
    </Modal>
  );
}

/** Final: 2040 sonu (göstergelerden deterministik; oyun kurgusu). Yeniden deneme teşvik edilir. */
export function EndingPanel() {
  const s = useGameState();
  if (s.overlay !== 'ending') return null;
  const ind = cityOf(s).indicators;
  const last = [...s.history].reverse().find((h) => h.scenarioId === 'council_005');
  const e = endingFor({ resilience: ind.resilience, ecosystem: ind.ecosystem, wellbeing: ind.wellbeing, emissionIndex: ind.emissionIndex, literacy: ind.literacy, balancedPlan: last?.choiceId === 'A' });
  return (
    <Modal titleId="end-title" title={e.title} onClose={gameStore.closeOverlay} wide>
      <div className={`ending ending-${e.key}`}>
        <p className="ending-text">{e.text}</p>
        <ul className="facts">
          <li>Dayanıklılık {ind.resilience}/100</li><li>Ekosistem {ind.ecosystem}/100</li><li>Refah {ind.wellbeing}/100</li>
          <li>Emisyon endeksi {ind.emissionIndex}</li><li>Okuryazarlık {ind.literacy}/100</li><li>Gelecek puanı {e.score}</li>
        </ul>
        <p className="notice">Bu son bir oyun kurgusudur; gerçek 2040 tahmini değildir. Farklı kararlar farklı gelecekler kurar.</p>
      </div>
      <div className="actions">
        <button onClick={() => gameStore.openOverlay('log')}>Olay günlüğünü incele</button>
        <button onClick={() => gameStore.openOverlay('assessment')}>Son değerlendirmeyi yap</button>
        <button className="primary" onClick={gameStore.closeOverlay}>Şehri geliştirmeye devam et</button>
      </div>
    </Modal>
  );
}
