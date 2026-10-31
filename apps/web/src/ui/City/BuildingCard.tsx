import { useEffect } from 'react';
import { BUILD_SLOTS, buildingDef, CAMPUS_TYPE, effectsAt, isUnlocked, maxLevel, taskStatus, tasksOfModule, unlockText, upkeepAt, type ZoneId } from '@yarinlab/shared';
import { gameStore, useGameState, type GameState } from '../../state/gameStore';
import { cityOf, completedTaskIds, unlockCtx } from '../../state/city';
import { hotspotById } from '../../game/tiles/hotspots';
import { zoneWarningsOf } from '../../state/warnings';
import { BUILDING_ICON, effectText, ZONE_TR } from './BuildPanel';
import { MODULE_THEME } from '../theme/modules';
import type { ModuleId } from '@yarinlab/shared';

const ZONE_MODULE: Record<string, ModuleId> = { school: 'council', canteen: 'food', energy: 'energy', waste: 'waste', city: 'city', farm: 'carbon', ocean: 'ocean' };

function Levels({ level, max, names }: { level: number; max: number; names?: string[] }) {
  return (
    <ol className="level-track" aria-label={`Seviye ${level}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <li key={i} className={i < level ? 'on' : ''} title={names?.[i]}>
          <span aria-hidden="true">{i + 1}</span>
          {names && <small>{names[i]}</small>}
        </li>
      ))}
    </ol>
  );
}

function UpgradeRow({ s, id }: { s: GameState; id: string }) {
  const b = s.sim.buildings.find((x) => x.id === id);
  const def = b && buildingDef(b.type);
  if (!b || !def) return null;
  const max = maxLevel(def);
  if (b.level >= max) return <p className="hint">En üst seviyede ✨</p>;
  const cost = def.cost[b.level];
  const open = isUnlocked(def, unlockCtx(s));
  const next = effectText(effectsAt(def, b.level + 1) as Record<string, number>);
  return (
    <div className="upgrade-row">
      <p><strong>Sonraki seviye{def.levelNames ? `: ${def.levelNames[b.level]}` : ''}</strong><br /><span className="hint">{next} · bakım {upkeepAt(def, b.level + 1)}/gün</span></p>
      <button className="primary" disabled={!open || s.world.budget < cost} onClick={() => gameStore.upgrade(b.id)}>
        ⬆ Geliştir ({cost.toLocaleString('tr-TR')})
      </button>
      {!open && <span className="hint">🔒 {unlockText(def)}</span>}
    </div>
  );
}

/** Haritada seçilen bölge, yapı veya boş alanın bilgi kartı (prompt §3): seviye, etki, durum ve eylemler. */
export function BuildingCard() {
  const s = useGameState();
  const t = s.inspect;
  useEffect(() => {
    if (!t) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role=dialog]')) gameStore.inspectTarget(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [t]);
  if (!t || s.overlay !== 'none' || s.decisionOpen) return null;
  const close = () => gameStore.inspectTarget(null);
  const ind = cityOf(s).indicators;

  if (t.kind === 'zone') {
    const h = hotspotById(t.id);
    if (!h) return null;
    const mod = ZONE_MODULE[h.id];
    const th = MODULE_THEME[mod];
    const done = completedTaskIds(s);
    const tasks = tasksOfModule(mod);
    const finished = tasks.filter((x) => done.includes(x.id)).length;
    const open = tasks.some((x) => taskStatus(x.id, done).status === 'available');
    const warn = zoneWarningsOf(ind)[h.id];
    const campus = h.id === 'school' ? s.sim.buildings.find((b) => b.type === CAMPUS_TYPE) : undefined;
    const campusDef = buildingDef(CAMPUS_TYPE)!;
    const zone = h.id as ZoneId;
    const builtHere = s.sim.buildings.filter((b) => BUILD_SLOTS.find((x) => x.id === b.slot)?.zone === zone && b.type !== CAMPUS_TYPE).length;
    return (
      <aside className="inspect-card panel" aria-labelledby="inspect-title" style={{ ['--mod' as string]: th.color, ['--soft' as string]: th.soft }}>
        <header>
          <span className="avatar" aria-hidden="true">{th.emoji}</span>
          <div>
            <h2 id="inspect-title">{h.label}</h2>
            <span className="mod-chip">{th.character} · {h.compass}</span>
          </div>
          <button className="icon-btn" aria-label="Kartı kapat" onClick={close}>✕</button>
        </header>
        {warn && <p className="warn-line" role="status">⚠️ {warn}</p>}
        {campus && <Levels level={campus.level} max={maxLevel(campusDef)} names={campusDef.levelNames} />}
        <p className="hint">Görevler: {finished}/{tasks.length} tamamlandı{open ? ' · yeni görev var ❗' : ''} · Bu bölgedeki yapılar: {builtHere}</p>
        {campus && <UpgradeRow s={s} id={campus.id} />}
        <div className="card-actions">
          <button className="primary" onClick={() => { close(); gameStore.selectHotspot(h.id); }}>🎯 Göreve git</button>
          {h.id === 'ocean' && s.mapView === 'world' && <button onClick={() => gameStore.setMapView('coast')}>🌊 Kıyıya git</button>}
          <button onClick={() => gameStore.openOverlay('build', zone)}>🏗️ İnşa</button>
          <button onClick={close}>Kapat</button>
        </div>
      </aside>
    );
  }

  if (t.kind === 'slot') {
    const slot = BUILD_SLOTS.find((x) => x.id === t.id);
    if (!slot) return null;
    return (
      <aside className="inspect-card panel" aria-labelledby="inspect-title">
        <header>
          <span className="avatar" aria-hidden="true">🟩</span>
          <div><h2 id="inspect-title">Boş yapı alanı</h2><span className="mod-chip">{ZONE_TR[slot.zone]}</span></div>
          <button className="icon-btn" aria-label="Kartı kapat" onClick={close}>✕</button>
        </header>
        <p>Bu alana bölgeye uygun bir yapı kurabilirsin.</p>
        <div className="card-actions">
          <button className="primary" onClick={() => gameStore.openOverlay('build', slot.zone)}>🏗️ İnşa et</button>
          <button onClick={close}>Kapat</button>
        </div>
      </aside>
    );
  }

  const b = s.sim.buildings.find((x) => x.id === t.id);
  const def = b && buildingDef(b.type);
  if (!b || !def) return null;
  const max = maxLevel(def);
  return (
    <aside className="inspect-card panel" aria-labelledby="inspect-title">
      <header>
        <span className="avatar" aria-hidden="true">{BUILDING_ICON[def.type] ?? '🏠'}</span>
        <div><h2 id="inspect-title">{def.name}</h2><span className="mod-chip">{ZONE_TR[def.zone]}</span></div>
        <button className="icon-btn" aria-label="Kartı kapat" onClick={close}>✕</button>
      </header>
      <Levels level={b.level} max={max} names={def.levelNames} />
      <p>{def.description}</p>
      <p className="hint">Şu anki etki: {effectText(effectsAt(def, b.level) as Record<string, number>) || '—'} · bakım {upkeepAt(def, b.level)}/gün · kuruluş günü {b.builtDay + 1}</p>
      <UpgradeRow s={s} id={b.id} />
      <div className="card-actions">
        {!def.fixed && <button onClick={() => { gameStore.demolish(b.id); close(); }}>Kaldır</button>}
        <button onClick={close}>Kapat</button>
      </div>
    </aside>
  );
}
