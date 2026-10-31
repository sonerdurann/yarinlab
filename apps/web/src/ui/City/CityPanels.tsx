import { BADGES, endingFor, levelForXp, WEATHER_ICON, xpForLevel } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { cityOf, completedTaskIds, moduleOf } from '../../state/city';
import { playableScenarios } from '../../data/scenarios';
import { Modal } from '../Modal/Modal';
import { RoadmapButton } from '../Roadmap/RoadmapPanel';
import { Speech } from '../Mascot';

const BADGE_ICON: Record<string, string> = { 'first-decision': '👣', reasoner: '💬', 'two-futures': '🔮', explorer: '🧭', builder: '🏗️', upgrader: '🚀', 'clean-grid': '⚡', seasons: '🍂', halfway: '🏔️', council: '🏛️', field: '🔬', reflect: '📝' };
import { authStore, useAuth } from '../../state/authStore';

/** Üst çubuk: tarih, mevsim, büyük hava simgesi ve gün ilerletme. */
export function TimeChip() {
  const s = useGameState();
  const c = cityOf(s).indicators;
  return (
    <span className="time-chip" aria-label="Zaman ve hava">
      <span className="weather" aria-hidden="true" title={c.weatherTr}>{WEATHER_ICON[c.weather]}</span>
      <span className="date"><span>{c.seasonTr} · Gün {s.sim.day + 1}</span><small>{c.year} · {c.weatherTr}</small></span>
      <button className="sun" onClick={() => gameStore.endDay()}>🌙 Günü bitir</button>
    </span>
  );
}

const pct = (n: number) => `${Math.max(0, Math.min(100, n))}%`;
type Tile = { ico: string; label: string; value: string; bar?: number; tone: 'good' | 'ok' | 'bad'; tag?: 'Simülasyon' | 'Varsayım'; title?: string; wide?: boolean };
const toneOf = (v: number, higherBetter = true) => { const x = higherBetter ? v : 100 - v; return x >= 70 ? 'good' : x >= 45 ? 'ok' : 'bad'; };

/** Şehir durumu: 10 gösterge, simgeli ve renk tonlu kartlar. Tüm sayılar oyun simülasyonudur. */
export function CityIndicators() {
  const s = useGameState();
  const { indicators: i } = cityOf(s);
  const e = i.energy;
  const tiles: Tile[] = [
    { ico: '⚡', label: 'Elektrik', value: `${e.prodKwh}/${e.demandKwh} kWh`, bar: e.renewableSharePct, tone: e.outageHours > 0 ? 'bad' : toneOf(e.renewableSharePct * 1.4), title: `Temiz enerji payı %${e.renewableSharePct}${e.outageHours ? `, ${e.outageHours} saat kesinti` : ''}`, wide: true },
    { ico: '😊', label: 'Mutluluk', value: `${i.wellbeing}`, bar: i.wellbeing, tone: toneOf(i.wellbeing) },
    { ico: '🌿', label: 'Doğa', value: `${i.ecosystem}`, bar: i.ecosystem, tone: toneOf(i.ecosystem) },
    { ico: '🛡️', label: 'Hazırlık', value: `${i.resilience}`, bar: i.resilience, tone: toneOf(i.resilience), title: `Sel ${i.floodRisk}, sıcak ${i.heatRisk}, enerji riski ${i.energyRisk}` },
    { ico: '📚', label: 'İklim bilgisi', value: `${i.literacy}`, bar: i.literacy, tone: toneOf(i.literacy + 30) },
    { ico: '💧', label: 'Su', value: `${i.waterUseM3} m³`, tone: i.waterUseM3 > 42 ? 'bad' : i.waterUseM3 > 36 ? 'ok' : 'good', tag: 'Varsayım' },
    { ico: '🗑️', label: 'Çöp', value: `${i.wasteKg} kg`, tone: i.wasteKg > 45 ? 'bad' : i.wasteKg > 30 ? 'ok' : 'good', tag: 'Varsayım', title: `${i.collectionNeed} çöp kamyonu seferi` },
    { ico: '🍎', label: 'Boşa giden yemek', value: `${i.foodLossKg} kg`, tone: i.foodLossKg > 25 ? 'bad' : i.foodLossKg > 15 ? 'ok' : 'good' },
    { ico: '🌫️', label: 'Kirlilik endeksi', value: `${i.emissionIndex}`, tone: i.emissionIndex > 95 ? 'bad' : i.emissionIndex > 75 ? 'ok' : 'good', tag: 'Varsayım', title: 'Başlangıç 100. Birimsiz göreli endeks; kg CO₂e değildir.' },
  ];
  return (
    <aside className="panel world-status" aria-label="Şehir durumu">
      <h2>🏙️ Şehrim</h2>
      <div className="stat-grid">
        {tiles.map((t) => (
          <div key={t.label} className={`stat-tile tone-${t.tone}${t.wide ? ' wide' : ''}`} title={t.title}>
            <div className="st-top"><span className="st-ico" aria-hidden="true">{t.ico}</span>{t.label}</div>
            <div className="st-val">{t.value}</div>
            {t.bar !== undefined && (
              <div className="st-bar" role="progressbar" aria-valuenow={t.bar} aria-valuemin={0} aria-valuemax={100} aria-label={t.label}><span style={{ width: pct(t.bar) }} /></div>
            )}
            {t.tag && <span className="tag assume">{t.tag}</span>}
          </div>
        ))}
      </div>
      <p className="hint">Bu sayılar oyun içi simülasyondur, gerçek ölçüm değildir.</p>
      <div className="actions left">
        <button onClick={() => gameStore.openOverlay('build')}>🏗️ İnşa</button>
        <button onClick={() => gameStore.openOverlay('log')}>📜 Günlük</button>
        <button onClick={() => gameStore.openOverlay('progress')}>🏅 Rozetler</button>
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
      <Speech mood={s.badges.length ? 'wow' : 'happy'}>Seviye <b>{lvl}</b> oldun! {s.badges.length} rozet topladın. Rozetler yarış değil: her biri öğrendiğin bir şeyi kutlar.</Speech>
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
          return <li key={b.key} className={got ? 'got' : ''} aria-label={`${b.name}: ${got ? 'kazanıldı' : 'henüz değil'}`}><span className="medal" aria-hidden="true">{got ? BADGE_ICON[b.key] ?? '🏅' : '🔒'}</span><strong>{b.name}</strong><br /><span className="hint">{b.description}</span></li>;
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
      <Speech mood="wave">{user ? <>Tekrar hoş geldin <b>{user.displayName}</b>! Şehrin seni bekliyor.</> : <>Bugünün kararları, yarının dünyasını şekillendirir. Hadi başlayalım!</>}</Speech>
      <div className="menu-buttons">
        {has && <button className="primary" onClick={gameStore.closeOverlay}>▶️ Devam et (Gün {s.sim.day + 1})</button>}
        <button className={has ? '' : 'primary'} onClick={() => { if (!has || confirm('Mevcut şehir silinip yeni oyun başlasın mı?')) { gameStore.resetSession(); gameStore.closeOverlay(); } }}>🌱 Yeni oyun</button>
        <button onClick={authStore.open}>{user ? '👤 Hesabım' : '🔑 Giriş / sınıfa katıl'}</button>
        {user?.role === 'TEACHER' && <button onClick={onTeacher}>🍎 Öğretmen paneli</button>}
        <button onClick={() => gameStore.openOverlay('progress')}>🏅 Rozetlerim ve ilerlemem</button>
        <button onClick={() => gameStore.openOverlay('assessment')}>📝 Ön/son testler</button>
        <button onClick={onSettings}>⚙️ Ayarlar (ses, yazı, hareket)</button>
        <button onClick={() => { gameStore.closeOverlay(); gameStore.closeIntro(); gameStore.openTask('food_001'); }}>🎬 90 saniyelik tanıtım (kantin görevi)</button>
        <button onClick={() => gameStore.openOverlay('help')}>❓ Yardım ve rehber</button>
        <button onClick={onSources}>📚 Bilimsel kaynaklar ve lisanslar</button>
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
        <div className="ending-scene" aria-hidden="true">{e.key === 'thriving' ? '🌳🏙️☀️🐢' : e.key === 'transition' ? '🌱🏗️⛅' : '🌡️🏚️🌧️'}</div>
        <Speech mood={e.key === 'thriving' ? 'wow' : e.key === 'transition' ? 'happy' : 'worried'}>{e.text}</Speech>
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
