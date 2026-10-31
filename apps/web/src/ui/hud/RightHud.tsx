import { useEffect, useMemo, useRef, useState } from 'react';
import type Phaser from 'phaser';
import map from '../../../public/assets/maps/world_v2.json';
import { gameStore, useGameState, type MapLayer } from '../../state/gameStore';
import { cityOf } from '../../state/city';
import { zoneWarningsOf } from '../../state/warnings';
import { hotspots } from '../../game/tiles/hotspots';
import { Icon } from '../Icon';

const N = 40;
const S = 2.2; // mini harita karo yarı genişliği (px)
const MW = N * 2 * S + 8, MH = N * S + 8;
const GROUND_COLOR: Record<number, string> = { 1: '#7cc576', 2: '#9aa5ad', 3: '#41c9d1', 4: '#c79a5b', 5: '#f0dc9c', 6: '#d9dfe3' };
const toMini = (x: number, y: number) => ({ x: MW / 2 + (x - y) * S, y: 4 + (x + y) * (S / 2) });
const HW = 66, HH = 33;

type Props = { game: React.RefObject<Phaser.Game | null>; onZoom: (d: number) => void };

/** Mini harita: zemin, bölgeler, kamera dikdörtgeni; tıklayınca o noktaya gider (prompt §5 sağ panel). */
function Minimap({ game }: { game: Props['game'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const layers = map.layers as { name: string; data?: number[] }[];
  const ground = layers.find((l) => l.name === 'ground')!.data!, roads = layers.find((l) => l.name === 'roads')!.data!;
  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const p = toMini(x, y);
      c.fillStyle = roads[y * N + x] ? '#5f6b75' : GROUND_COLOR[ground[y * N + x]] ?? '#7cc576';
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + S, p.y + S / 2); c.lineTo(p.x, p.y + S); c.lineTo(p.x - S, p.y + S / 2); c.closePath(); c.fill();
    }
    for (const h of hotspots) {
      const p = toMini(h.tileX + h.foot[0] / 2, h.tileY + h.foot[1] / 2);
      c.fillStyle = '#243447'; c.beginPath(); c.arc(p.x, p.y, 3.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f6c453'; c.beginPath(); c.arc(p.x, p.y, 2, 0, Math.PI * 2); c.fill();
    }
  }, [ground, roads]);
  useEffect(() => {
    const t = setInterval(() => {
      const cam = game.current?.scene.getScene('WorldScene')?.cameras?.main;
      if (!cam) return;
      const v = cam.worldView;
      // dünya -> karo -> mini: x_t - y_t = wx/HW, x_t + y_t = wy/HH
      setView({ x: MW / 2 + (v.x / HW) * S, y: 4 + (v.y / HH) * (S / 2), w: (v.width / HW) * S, h: (v.height / HH) * (S / 2) });
    }, 400);
    return () => clearInterval(t);
  }, [game]);
  const go = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * MW, my = ((e.clientY - r.top) / r.height) * MH;
    const a = (mx - MW / 2) / S, b = (my - 4) / (S / 2); // a = x-y, b = x+y
    game.current?.scene.getScene('WorldScene')?.events.emit('focus-tile', (a + b) / 2, (b - a) / 2);
  };
  return (
    <div className="minimap panel">
      <canvas ref={ref} width={MW} height={MH} onClick={go} aria-label="Mini harita: tıklayarak o bölgeye git" role="img" />
      {view && <span className="cam-rect" aria-hidden="true" style={{ left: `${(view.x / MW) * 100}%`, top: `${(view.y / MH) * 100}%`, width: `${(view.w / MW) * 100}%`, height: `${(view.h / MH) * 100}%` }} />}
      {/* Klavye ve ekran okuyucu: bölgeye git ve bilgi kartını aç */}
      <ul className="sr-only" aria-label="Haritadaki bölgeler">{hotspots.map((h) => (
        <li key={h.id}><button onClick={() => { game.current?.scene.getScene('WorldScene')?.events.emit('focus-hotspot', h.id); gameStore.inspectTarget({ kind: 'zone', id: h.id }); }}>{h.label} bilgi kartı</button></li>
      ))}</ul>
    </div>
  );
}

const SEEN_KEY = 'yarinlab.notifSeen.v1';
/** Bildirim merkezi: olay günlüğünden son kayıtlar + etkin uyarılar; okunmamış sayısı. */
function Notifications() {
  const s = useGameState();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => { try { return Number(localStorage.getItem(SEEN_KEY) ?? 0); } catch { return 0; } });
  const warns = Object.entries(zoneWarningsOf(cityOf(s).indicators)).filter(([, v]) => !!v) as [string, string][];
  const total = s.sim.log.length;
  const unread = Math.max(0, total - seen) + warns.length;
  const items = useMemo(() => [...s.sim.log].reverse().slice(0, 15), [s.sim.log]);
  const toggle = () => {
    setOpen(!open);
    if (!open) { setSeen(total); try { localStorage.setItem(SEEN_KEY, String(total)); } catch { /* yoksay */ } }
  };
  return (
    <div className="notif">
      <button className="icon-btn bell" aria-expanded={open} aria-controls="notif-list" onClick={toggle} aria-label={`Bildirimler${unread ? `: ${unread} yeni` : ''}`}>
        🔔{unread > 0 && <span className="count" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div id="notif-list" className="notif-panel panel" role="region" aria-label="Bildirim merkezi">
          <h3>Bildirimler</h3>
          {warns.map(([id, w]) => (
            <button key={id} className="notif-item warn" onClick={() => { gameStore.inspectTarget({ kind: 'zone', id }); setOpen(false); }}>⚠️ {w}</button>
          ))}
          {items.length === 0 && warns.length === 0 && <p className="hint">Henüz bildirim yok.</p>}
          <ol>{items.map((e, k) => <li key={k} className={`log-${e.kind}`}><span className="log-day">Gün {e.day + 1}</span> {e.message}</li>)}</ol>
          <button className="link" onClick={() => { setOpen(false); gameStore.openOverlay('log'); }}>Tüm olay günlüğü →</button>
        </div>
      )}
    </div>
  );
}

const LAYERS: { id: MapLayer; ico: string; label: string; coast?: boolean }[] = [
  { id: 'none', ico: '🗺️', label: 'Normal' }, { id: 'heat', ico: '🌡️', label: 'Sıcaklık' }, { id: 'flood', ico: '🌊', label: 'Sel riski' },
  { id: 'energy', ico: '⚡', label: 'Enerji akışı' }, { id: 'waste', ico: '♻️', label: 'Atık akışı' }, { id: 'under', ico: '🐠', label: 'Su altı', coast: true },
];
function Layers() {
  const s = useGameState();
  const coast = s.mapView === 'coast';
  return (
    <div className="layers panel" role="group" aria-label="Harita katmanları">
      {LAYERS.filter((l) => (coast ? l.id === 'none' || l.coast : !l.coast)).map((l) => (
        <button key={l.id} aria-pressed={s.mapLayer === l.id} className={s.mapLayer === l.id ? 'on' : ''} onClick={() => gameStore.setMapLayer(l.id)} title={l.label}>
          <span aria-hidden="true">{l.ico}</span><span className="sr-only">{l.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Sağ HUD: yakınlaştırma, mini harita, bildirim merkezi, harita katmanları; kıyıdayken şehre dönüş. */
export function RightHud({ game, onZoom }: Props) {
  const s = useGameState();
  return (
    <aside className="hud-right" aria-label="Harita araçları">
      <div className="hud-row">
        <Notifications />
        <div className="zoom-btns">
          <button aria-label="Yakınlaştır" onClick={() => onZoom(0.1)}><Icon name="zoomIn" tone="black" size={24} /></button>
          <button aria-label="Uzaklaştır" onClick={() => onZoom(-0.1)}><Icon name="zoomOut" tone="black" size={24} /></button>
        </div>
      </div>
      {s.mapView === 'world' ? <Minimap game={game} /> : <button className="primary back-city" onClick={() => gameStore.setMapView('world')}>🏙️ Şehre dön</button>}
      <Layers />
    </aside>
  );
}
