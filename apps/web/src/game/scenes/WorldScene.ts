import Phaser from 'phaser';
import { GROUND_FRAMES, GROUND_SPRITE_HEIGHT, MAP, ROAD_FRAMES, TREE_GID, VEHICLE_DIR, WATER_DROP, WATER_GID } from '../tiles/mapManifest';
import { footprintTiles, hotspotCenter, hotspots, type Hotspot } from '../tiles/hotspots';
import { DECOR } from '../tiles/decor';
import { gameStore, type MapLayer } from '../../state/gameStore';
import { cityOf, unlockCtx } from '../../state/city';
import { isReducedMotion as reducedMotion, settingsStore } from '../../state/settingsStore';
import {
  BUILD_SLOTS, buildingDef, CAMPUS_TYPE, isUnlocked, maxLevel, taskStatus, tasksOfModule, weatherFor,
  type CityIndicators, type PlacedBuilding, type Weather,
} from '@yarinlab/shared';
import { textureOrigin } from '../art/isoArt';
import { makePlayerTextures } from '../art/player';
import { zoneWarningsOf } from '../../state/warnings';
import { depthOf, diamond, HH, isWorldPointer, iso, placeIso, placeUpright, setupCameraControls, toTile } from './iso';

export { iso } from './iso';

/** BootScene'de üretilen özel dokuların zemin elması dikey kayması (px). */
const CUSTOM_GROUND_OFFSET: Record<string, number> = { raingarden: 24, greenhouse: 54, compost: 56, wetland: 26 };

const HOTSPOT_MODULE: Record<string, string> = { school: 'council', canteen: 'food', energy: 'energy', waste: 'waste', city: 'city', farm: 'carbon', ocean: 'ocean' };
/** Bölge ana binası dokusu (kampüs seviyeye göre değişir). */
const HOTSPOT_TEXTURE: Record<string, string> = { canteen: 'canteen', energy: 'monitor', city: 'townhall', farm: 'barn', waste: 'recycle', ocean: 'lighthouse' };

type TiledLayer = { name: string; type: string; data?: number[] };
type TiledMap = { layers: TiledLayer[] };

const area = (h: Hotspot) => (h.bounds[1] - h.bounds[0] + 1) * (h.bounds[3] - h.bounds[2] + 1);
const N = MAP.size;

type Node = { img: Phaser.GameObjects.Image; top: number; x: number; baseY: number; level: number; warn?: Phaser.GameObjects.Image; up?: Phaser.GameObjects.Image };

export class WorldScene extends Phaser.Scene {
  private glow?: Phaser.GameObjects.Graphics;
  private ring?: Phaser.GameObjects.Graphics;
  private layerG?: Phaser.GameObjects.Graphics;
  private tip?: Phaser.GameObjects.Text;
  private dragged = false;
  private nodes = new Map<string, Node>();
  private lastResult: unknown = null;
  /** Sürekli ortam animasyonları; hareket ayarına göre durdurulur/sürdürülür. */
  private ambient: Phaser.Tweens.Tween[] = [];
  private waterTiles: Phaser.GameObjects.Image[] = [];
  private placed = new Map<string, { objs: Phaser.GameObjects.Image[]; level: number; up?: Phaser.GameObjects.Image }>();
  private slotMarks = new Map<string, Phaser.GameObjects.Image>();
  private extraTrees: Phaser.GameObjects.Image[] = [];
  private cityHouses: Phaser.GameObjects.Image[] = [];
  private sky?: Phaser.GameObjects.Rectangle;
  private rain: Phaser.GameObjects.Image[] = [];
  private rainTweens: Phaser.Tweens.Tween[] = [];
  private lastDay = -1;
  private lastWeather?: Weather;
  private lastLayer: MapLayer = 'none';
  private quests = new Map<string, { img: Phaser.GameObjects.Image; tween?: Phaser.Tweens.Tween }>();
  private selected?: string;

  constructor() {
    super('WorldScene');
  }

  create() {
    const map = this.cache.json.get(MAP.key) as TiledMap;
    this.cameras.main.setBackgroundColor(0xa5ddf2); // ada çevresi: açık deniz
    this.drawTiles(map);
    this.drawDecor();
    this.drawZoneBuildings();
    this.glow = this.add.graphics().setDepth(4);
    this.ring = this.add.graphics().setDepth(5);
    this.layerG = this.add.graphics().setDepth(4900);
    this.tip = this.add
      .text(0, 0, '', { fontFamily: "'Baloo 2', Nunito, sans-serif", fontSize: '20px', color: '#243447', backgroundColor: '#f5f8f4', padding: { x: 10, y: 4 } })
      .setDepth(6000).setOrigin(0.5, 1).setVisible(false);
    this.addPointer();
    this.setupCamera();
    this.addTraffic();
    this.addLife();
    this.addPlayer();
    this.addClouds();
    this.setupSky();
    this.syncCity(true);
    const unsubCity = gameStore.subscribe(() => this.syncCity(false));
    this.events.once('shutdown', unsubCity);
    this.scale.updateBounds();
    this.scale.on('resize', () => this.scale.updateBounds());
    this.events.on('focus-hotspot', (id: string) => this.focusHotspot(id));
    this.events.on('focus-tile', (x: number, y: number) => this.cameras.main.pan(iso(x, y).x, iso(x, y).y, 400, 'Sine.easeInOut'));
    // Karar penceresi kapanınca kamera ilgili bölgeye gider ve değişim vurgulanır (prompt §7 "dünyada etki").
    let wasOpen = gameStore.get().decisionOpen;
    const unsubFocus = gameStore.subscribe(() => {
      const st = gameStore.get();
      if (wasOpen && !st.decisionOpen && st.history.length && st.mapView === 'world') {
        const mod = st.activeScenarioId.split('_')[0];
        const zone = Object.entries(HOTSPOT_MODULE).find(([, m]) => m === mod)?.[0];
        if (zone) { this.focusHotspot(zone); this.time.delayedCall(reducedMotion() ? 0 : 450, () => this.pulse(zone)); }
      }
      wasOpen = st.decisionOpen;
    });
    this.events.once('shutdown', unsubFocus);
    const unsub = gameStore.subscribe(() => {
      const r = gameStore.get().result;
      if (r && r !== this.lastResult) {
        const mod = r.scenarioId.split('_')[0];
        const zone = Object.entries(HOTSPOT_MODULE).find(([, m]) => m === mod)?.[0] ?? 'canteen';
        this.pulse(zone);
      }
      this.lastResult = r;
    });
    this.events.once('shutdown', unsub);
    const applyMotion = () => {
      const reduced = reducedMotion();
      this.ambient.forEach((t) => (reduced ? t.pause() : t.resume()));
      if (reduced) this.waterTiles.forEach((w) => w.setAlpha(1));
      this.rainTweens.forEach((t) => (reduced ? t.pause() : t.resume()));
    };
    applyMotion();
    const unsubMotion = settingsStore.subscribe(applyMotion);
    this.events.once('shutdown', unsubMotion);
    // Kıyı haritasına geçiş (kamera solması)
    const unsubView = gameStore.subscribe(() => {
      if (gameStore.get().mapView === 'coast' && this.scene.isActive()) {
        let done = false;
        const go = () => { if (done || !this.scene.isActive()) return; done = true; this.scene.sleep(); if (this.scene.isSleeping('CoastScene')) this.scene.wake('CoastScene'); else this.scene.launch('CoastScene'); };
        if (reducedMotion()) go();
        else {
          // Solma bitişi düşük kare hızında gecikebilir; gerçek zamanlı yedek geçişi garanti eder.
          this.cameras.main.fadeOut(260, 165, 221, 242);
          this.cameras.main.once('camerafadeoutcomplete', go);
          setTimeout(go, 420);
        }
      }
    });
    this.events.once('shutdown', unsubView);
    this.events.on('wake', () => { this.cameras.main.fadeIn(reducedMotion() ? 0 : 260, 165, 221, 242); this.scale.updateBounds(); setTimeout(() => this.cameras.main.resetFX(), 700); });
    gameStore.setWorldReady();
  }

  /** Karar sonrası bina vurgusu: büyüme + genişleyen halka. */
  private pulse(id: string) {
    const n = this.nodes.get(id);
    if (!n || reducedMotion()) return;
    const s = n.img.scale;
    this.tweens.add({ targets: n.img, scale: s * 1.06, duration: 220, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    const ring = this.add.graphics().setDepth(5100).setPosition(n.x, n.baseY);
    ring.lineStyle(5, 0x26b887, 0.9).strokeEllipse(0, 0, 150, 75);
    this.tweens.add({ targets: ring, scaleX: 2.4, scaleY: 2.4, alpha: 0, duration: 1400, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    this.sparkle(n.x, n.top + 20);
  }

  private drawTiles(map: TiledMap) {
    const layer = (n: string) => map.layers.find((l) => l.name === n)?.data ?? [];
    const ground = layer('ground'), roads = layer('roads'), deco = layer('decoration');
    const isRoad = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && !!roads[y * N + x];
    // dekor, bina tabanı, yapı alanı ve türbin çevresinde ağaç çizilmez
    const blocked = new Set<number>();
    for (const d of DECOR) {
      const r = d.kind === 'turbine' ? 1 : 0;
      const s = d.kind === 'court' ? 2 : 1;
      for (let dy = -r; dy < s + r; dy++) for (let dx = -r; dx < s + r; dx++) blocked.add((d.y + dy) * N + d.x + dx);
    }
    for (const h of hotspots) for (const [x, y] of footprintTiles(h)) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) blocked.add((y + dy) * N + x + dx);
    for (const s of BUILD_SLOTS) if (!s.map || s.map === 'world') blocked.add(s.y * N + s.x);
    // Performans: durağan zemin ve yollar 10x10 karoluk parçalar hâlinde dokuya "pişirilir" (≈1600 nesne yerine 16).
    // Parçalar satır-sütun sırasıyla eklenir; karo kalınlığı bir sonraki parçanın karolarıyla örtülür.
    const B = 10;
    for (let by = 0; by < N; by += B) {
      for (let bx = 0; bx < N; bx += B) {
        const left = iso(bx, by + B).x - 2, top = iso(bx, by).y - 2;
        const w = 2 * B * (MAP.tileWidth / 2) + 4, h = 2 * B * HH + GROUND_SPRITE_HEIGHT + 4;
        const rt = this.add.renderTexture(left, top, w, h).setOrigin(0, 0).setDepth(0);
        for (let y = by; y < by + B; y++) {
          for (let x = bx; x < bx + B; x++) {
            const i = y * N + x;
            const p = iso(x, y);
            let def: { atlas: string; frame: string; tint?: number; flipX?: boolean } | undefined = GROUND_FRAMES[ground[i]];
            if (roads[i]) {
              const ax = isRoad(x - 1, y) || isRoad(x + 1, y), ay = isRoad(x, y - 1) || isRoad(x, y + 1);
              def = ax && ay ? ROAD_FRAMES.cross : ay ? ROAD_FRAMES.alongY : ROAD_FRAMES.alongX;
            }
            if (!def) continue;
            const isWater = !roads[i] && ground[i] === WATER_GID;
            if (isWater) {
              // su karoları ayrı kalır (parıltı animasyonu)
              const img = this.add.image(p.x, p.y + WATER_DROP, def.atlas, def.frame).setOrigin(0.5, 0).setScale(1.015).setDepth(0.5);
              this.waterTiles.push(img);
              this.ambient.push(this.tweens.add({ targets: img, alpha: 0.9, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: ((x + y) % 8) * 200 }));
              continue;
            }
            rt.stamp(def.atlas, def.frame, p.x - left, p.y - top, { originX: 0.5, originY: 0, scaleX: def.flipX ? -1.015 : 1.015, scaleY: 1.015, tint: def.tint ?? 0xffffff });
          }
        }
        rt.render();
      }
    }
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        if (deco[i] === TREE_GID && !blocked.has(i)) {
          const key = (x * 7 + y * 3) % 5 === 0 ? 'tree-b' : x < 13 && y > 14 && y < 27 ? 'fruit' : 'tree';
          const t = placeUpright(this, key, x, y);
          if ((x + y) % 6 === 0) this.ambient.push(this.tweens.add({ targets: t, angle: { from: -1.5, to: 1.5 }, duration: 2400 + ((x * y) % 7) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
        } else if (ground[i] === 1 && !roads[i] && !blocked.has(i) && (x * 31 + y * 17) % 23 === 0 && !deco[i]) {
          // yeşil alan arttıkça açılan ek ağaç adayları (kararlar dünyada görünür)
          this.extraTrees.push(placeUpright(this, 'tree-b', x, y).setVisible(false));
        }
      }
    }
  }

  /** Etkileşimsiz dekor: kodla üretilen parçalar. */
  private drawDecor() {
    for (const d of DECOR) {
      const p = iso(d.x, d.y);
      if (d.kind === 'turbine') {
        const bottom = p.y + MAP.tileHeight * 0.75;
        this.add.image(p.x, bottom, 'turbine').setOrigin(0.5, 1).setDepth(depthOf(d.x, d.y) + 20);
        const hub = this.add.image(p.x, bottom - 150 + 38, 'blades').setDepth(depthOf(d.x, d.y) + 21).setAngle((d.x * 37 + d.y * 53) % 120);
        this.ambient.push(this.tweens.add({ targets: hub, angle: hub.angle + 360, duration: 7000, repeat: -1 }));
      } else if (d.kind === 'fruit' || d.kind === 'pine') {
        placeUpright(this, d.kind, d.x, d.y);
      } else if (['house', 'shop', 'apartment'].includes(d.kind)) {
        const img = placeIso(this, `${d.kind}-${d.variant ?? 0}`, d.x, d.y);
        if (d.x >= 27 && d.y <= 12) this.cityHouses.push(img);
      } else if (textureOrigin(this, d.kind)) {
        const img = placeIso(this, d.kind, d.x, d.y);
        if (d.kind === 'flowers' || d.kind === 'court') img.setDepth(2);
      } else {
        this.add.image(p.x, p.y, d.kind).setOrigin(0.5, 0).setDepth(d.kind === 'crop' ? 1 : depthOf(d.x, d.y) + 10);
      }
    }
  }

  private zoneTexture(id: string) {
    if (id !== 'school') return HOTSPOT_TEXTURE[id];
    const lvl = gameStore.get().sim.buildings.find((b) => b.type === CAMPUS_TYPE)?.level ?? 1;
    return `campus-${lvl}`;
  }

  /** Bölge ana binaları (kalıcı büyük etiket yok; ad yalnızca üzerine gelince küçük ipucu olarak görünür). */
  private drawZoneBuildings() {
    for (const h of hotspots) {
      const key = this.zoneTexture(h.id);
      const img = placeIso(this, key, h.tileX, h.tileY);
      const c = iso(hotspotCenter(h).x, hotspotCenter(h).y);
      const top = img.y - img.height * img.originY;
      this.nodes.set(h.id, { img, top, x: c.x, baseY: c.y, level: Number(key.split('-')[1] ?? 1) });
    }
  }

  /** Kampüs seviyesi değişince ana bina yeniden çizilir (iskele + toz + ışıltı). */
  private refreshCampus(initial: boolean) {
    const n = this.nodes.get('school');
    const h = hotspots.find((x) => x.id === 'school')!;
    const key = this.zoneTexture('school');
    const lvl = Number(key.split('-')[1]);
    if (!n || n.level === lvl) return;
    n.img.destroy();
    n.img = placeIso(this, key, h.tileX, h.tileY);
    n.top = n.img.y - n.img.height * n.img.originY;
    n.level = lvl;
    if (!initial) this.constructAnim(n.img, n.x, n.baseY);
  }

  /** Geliştirme animasyonu: iskele, toz parçacıkları, yükselme ve ışıltı (prompt §3). */
  private constructAnim(img: Phaser.GameObjects.Image, x: number, baseY: number) {
    if (reducedMotion()) return;
    const top = img.y - img.height * img.originY;
    const scaffold = this.add.image(x, baseY + HH, 'scaffold').setOrigin(0.5, 1).setDepth(img.depth + 1).setScale(Math.max(1, img.width / 110), Math.max(1, (baseY + HH - top) / 116));
    const y = img.y;
    img.setY(y + 30).setAlpha(0.4);
    this.tweens.add({ targets: img, y, alpha: 1, duration: 900, ease: 'Back.easeOut' });
    for (let k = 0; k < 10; k++) {
      const d = this.add.image(x + (k - 5) * 12, baseY + HH - 6, 'dust').setDepth(img.depth + 2).setScale(0.6);
      this.tweens.add({ targets: d, x: d.x + (k - 5) * 9, y: d.y - 18 - (k % 3) * 8, alpha: 0, scale: 1.4, duration: 900, delay: k * 40, onComplete: () => d.destroy() });
    }
    this.tweens.add({ targets: scaffold, alpha: 0, delay: 800, duration: 400, onComplete: () => { scaffold.destroy(); this.sparkle(x, top + 10); } });
  }

  private sparkle(x: number, y: number) {
    if (reducedMotion()) return;
    for (let k = 0; k < 7; k++) {
      const s = this.add.image(x, y, 'spark').setDepth(5200).setScale(0.5);
      const a = (k / 7) * Math.PI * 2;
      this.tweens.add({ targets: s, x: x + Math.cos(a) * 46, y: y + Math.sin(a) * 26 - 10, alpha: 0, scale: 1.1, angle: 90, duration: 700, onComplete: () => s.destroy() });
    }
  }

  /** Kurulan yapılar, boş alanlar, rozetler ve dünya görünürlüğü store ile eşitlenir. */
  private syncCity(initial: boolean) {
    const st = gameStore.get();
    const city = cityOf(st);
    this.refreshCampus(initial);
    const ids = new Set(st.sim.buildings.map((b) => b.id));
    for (const [id, v] of this.placed) {
      if (!ids.has(id)) { v.objs.forEach((o) => o.destroy()); v.up?.destroy(); this.placed.delete(id); }
    }
    for (const b of st.sim.buildings) {
      if (b.type === CAMPUS_TYPE) continue;
      const slot = BUILD_SLOTS.find((s) => s.id === b.slot);
      if (slot?.map === 'coast') continue;
      const cur = this.placed.get(b.id);
      if (cur && cur.level === b.level) continue;
      cur?.objs.forEach((o) => o.destroy());
      cur?.up?.destroy();
      const objs = this.drawPlaced(b);
      this.placed.set(b.id, { objs, level: b.level });
      if (!initial && objs[0]) {
        const c = this.slotCenter(b.slot)!;
        this.constructAnim(objs[0], c.x, c.y - HH);
      }
    }
    const taken = new Set(st.sim.buildings.map((b) => b.slot));
    for (const s of BUILD_SLOTS) {
      if (s.map === 'coast' || s.id === 'campus') continue;
      let m = this.slotMarks.get(s.id);
      if (!m) {
        const p = iso(s.x, s.y);
        m = this.add.image(p.x, p.y, 'slot').setOrigin(0.5, 0).setDepth(2).setAlpha(0.85);
        this.slotMarks.set(s.id, m);
      }
      m.setVisible(!taken.has(s.id));
    }
    this.syncBadges(st, city.indicators);
    this.syncQuests(st);
    // Kararların dünyada görünürlüğü: yeşil alan arttıkça ağaç; kesintide şehir pencereleri söner.
    const extra = Phaser.Math.Clamp(Math.round((city.effective.greenShare - 20) / 2), 0, this.extraTrees.length);
    this.extraTrees.forEach((t, k) => t.setVisible(k < extra));
    const dim = city.indicators.energy.outageHours > 0;
    this.cityHouses.forEach((h) => (dim ? h.setTint(0xb9c2cc) : h.clearTint()));
    const weather = weatherFor(st.sim.seed, st.sim.day);
    if (st.sim.day !== this.lastDay || weather !== this.lastWeather) {
      const changedDay = this.lastDay >= 0 && st.sim.day !== this.lastDay;
      this.lastDay = st.sim.day;
      this.lastWeather = weather;
      this.applyWeather(weather, changedDay);
    }
    if (st.mapLayer !== this.lastLayer || st.mapLayer !== 'none') { this.lastLayer = st.mapLayer; this.drawLayer(st.mapLayer, city.indicators); }
    const sel = st.inspect?.kind === 'zone' ? st.inspect.id : undefined;
    if (sel !== this.selected) this.drawSelection(sel);
  }

  /** Geliştirilebilir (yeşil ok) ve uyarı balonu rozetleri. */
  private syncBadges(st: ReturnType<typeof gameStore.get>, ind: CityIndicators) {
    const budget = st.world.budget;
    const ctx = unlockCtx(st);
    const canUp = (b: PlacedBuilding) => {
      const def = buildingDef(b.type);
      return !!def && b.level < maxLevel(def) && budget >= def.cost[b.level] && isUnlocked(def, ctx);
    };
    const bob = (img: Phaser.GameObjects.Image) => {
      const t = this.tweens.add({ targets: img, y: img.y - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.ambient.push(t);
      if (reducedMotion()) t.pause();
    };
    for (const b of st.sim.buildings) {
      if (b.type === CAMPUS_TYPE) continue;
      const v = this.placed.get(b.id);
      if (!v?.objs[0]) continue;
      const show = canUp(b);
      if (show && !v.up) {
        const o = v.objs[0];
        v.up = this.add.image(o.x + 34, o.y - o.height * o.originY + 18, 'badge-up').setDepth(5500).setScale(0.75);
        bob(v.up);
      }
      v.up?.setVisible(show);
    }
    const campus = st.sim.buildings.find((b) => b.type === CAMPUS_TYPE);
    const warns = zoneWarningsOf(ind);
    for (const [id, n] of this.nodes) {
      const up = id === 'school' && !!campus && canUp(campus);
      if (up && !n.up) { n.up = this.add.image(n.x + 60, n.top + 24, 'badge-up').setDepth(5500); bob(n.up); }
      n.up?.setVisible(up);
      const w = warns[id];
      if (w && !n.warn) { n.warn = this.add.image(n.x - 50, n.top + 30, 'badge-warn').setDepth(5500).setOrigin(0.5, 1); bob(n.warn); }
      n.warn?.setVisible(!!w);
    }
  }

  /** Açık görevi olan bölgelerin üstünde zıplayan ❗ (oyuncuyu nazikçe yönlendirir; baskı yok). */
  private syncQuests(st: ReturnType<typeof gameStore.get>) {
    const done = [...new Set(st.history.filter((h) => !!h.reasoning).map((h) => h.scenarioId))];
    for (const h of hotspots) {
      const mod = HOTSPOT_MODULE[h.id];
      const open = !!mod && tasksOfModule(mod).some((t) => taskStatus(t.id, done).status === 'available');
      let q = this.quests.get(h.id);
      const node = this.nodes.get(h.id);
      if (!node) continue;
      if (!q) {
        const img = this.add.image(node.x, node.top - 10, 'quest').setDepth(5600).setScale(0.75);
        const tween = this.tweens.add({ targets: img, y: img.y - 12, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.ambient.push(tween);
        if (reducedMotion()) tween.pause();
        q = { img, tween };
        this.quests.set(h.id, q);
      }
      q.img.setVisible(open);
    }
  }

  /** Harita katmanları: sıcaklık, sel riski, enerji akışı, atık akışı (göstergelerden). */
  private drawLayer(layer: MapLayer, ind: CityIndicators) {
    const g = this.layerG!;
    g.clear();
    if (layer === 'none') return;
    const zone = (id: string, color: number, value: number) => {
      const h = hotspots.find((x) => x.id === id)!;
      const [x0, x1, y0, y1] = h.bounds;
      g.fillStyle(color, 0.12 + (Phaser.Math.Clamp(value, 0, 100) / 100) * 0.4).fillPoints(diamond(x0, y0, x1 - x0 + 1, y1 - y0 + 1), true);
    };
    const flow = (from: string, to: string, color: number, width: number) => {
      const a = this.nodes.get(from)!, b = this.nodes.get(to)!;
      g.lineStyle(width, color, 0.85).lineBetween(a.x, a.baseY, b.x, b.baseY);
      g.fillStyle(color, 1).fillCircle(b.x, b.baseY, width + 3);
    };
    if (layer === 'heat') {
      zone('school', 0xef795e, ind.heatRisk);
      zone('city', 0xef795e, ind.heatRisk + 10);
      zone('waste', 0xef795e, ind.heatRisk - 5);
      zone('energy', 0xf6c453, ind.heatRisk - 20);
      zone('farm', 0xf6c453, ind.heatRisk - 15);
    } else if (layer === 'flood') {
      zone('city', 0x41c9d1, ind.floodRisk);
      zone('school', 0x41c9d1, ind.floodRisk - 10);
      zone('ocean', 0x41c9d1, ind.coastalRisk);
      zone('farm', 0x41c9d1, ind.floodRisk - 20);
    } else if (layer === 'energy') {
      const w = 3 + Math.round(ind.energy.renewableSharePct / 15);
      for (const to of ['school', 'city', 'canteen', 'waste', 'farm']) flow('energy', to, ind.energy.outageHours > 0 ? 0xef795e : 0xf6c453, w);
    } else if (layer === 'waste') {
      const w = 2 + Math.round(ind.wasteKg / 25);
      for (const from of ['canteen', 'school', 'city', 'farm']) flow(from, 'waste', ind.wasteKg > 45 ? 0xef795e : 0x4dbe78, w);
      flow('waste', 'ocean', 0x41c9d1, Math.max(2, Math.round(ind.coastalRisk / 20)));
    }
  }

  private drawSelection(id?: string) {
    this.selected = id;
    this.ring?.clear();
    const h = id ? hotspots.find((x) => x.id === id) : undefined;
    if (!h) return;
    const poly = diamond(h.tileX - 0.25, h.tileY - 0.25, h.foot[0] + 0.5, h.foot[1] + 0.5);
    this.ring?.lineStyle(5, 0x26b887, 1).strokePoints(poly, true).fillStyle(0x26b887, 0.18).fillPoints(poly, true);
  }

  /** Gökyüzünde süzülen bulutlar (hareket azaltmada durur). */
  private addClouds() {
    const left = iso(0, N).x - 300, right = iso(N, 0).x + 300;
    for (let k = 0; k < 6; k++) {
      const y = iso(0, 0).y - 60 + k * 300;
      const img = this.add.image(left + ((k * 577) % (right - left)), y, 'cloud').setDepth(6500).setAlpha(0.5).setScale(0.8 + (k % 3) * 0.25);
      const t = this.tweens.add({ targets: img, x: right, duration: 100000 + k * 15000, repeat: -1, onRepeat: () => img.setX(left) });
      this.ambient.push(t);
    }
  }

  /** Canlı çevre: kuş sürüleri, kampüste yürüyen öğrenciler, parkta insanlar. */
  private addLife() {
    const left = iso(0, N).x - 200, right = iso(N, 0).x + 200;
    for (let k = 0; k < 3; k++) {
      const y = iso(10 + k * 8, 10).y - 200;
      const flock = [0, 1, 2, 3].map((j) => this.add.image(left - j * 30, y + (j % 2) * 18 - j * 6, 'bird').setDepth(6400).setScale(0.8 - j * 0.08));
      flock.forEach((b, j) => this.ambient.push(this.tweens.add({ targets: b, x: right + j * 30, y: b.y - 120, duration: 38000 + k * 9000, delay: k * 11000, repeat: -1, onRepeat: () => b.setPosition(left - j * 30, y) })));
    }
    const walk = (key: string, path: [number, number][], dur: number, delay: number) => {
      const pts = path.map(([x, y]) => iso(x + 0.5, y + 0.5));
      const img = this.add.image(pts[0].x, pts[0].y, key).setOrigin(0.5, 1).setDepth(10 + pts[0].y + HH);
      const tl = this.tweens.chain({
        targets: img, loop: -1, delay,
        tweens: pts.slice(1).concat([pts[0]]).map((p, i, arr) => {
          const prev = i === 0 ? pts[0] : arr[i - 1];
          return { x: p.x, y: p.y, duration: dur, ease: 'Linear', onStart: () => img.setFlipX(p.x < prev.x), onUpdate: () => img.setDepth(10 + img.y + HH) };
        }),
      });
      this.ambient.push(tl as unknown as Phaser.Tweens.Tween);
    };
    walk('student', [[16, 19], [16, 23], [20, 23], [20, 19]], 5000, 0);
    walk('student', [[22, 18], [25, 18], [25, 19], [22, 19]], 4200, 800);
    walk('student', [[17, 20], [21, 20]], 4000, 1500);
    walk('walker', [[34, 12], [37, 12], [37, 9]], 6000, 300);
    walk('walker', [[27, 10], [27, 3]], 9000, 2000);
  }

  private slotCenter(slotId: string) {
    const s = BUILD_SLOTS.find((x) => x.id === slotId);
    return s ? iso(s.x + 0.5, s.y + 0.5) : undefined;
  }

  private drawPlaced(b: PlacedBuilding): Phaser.GameObjects.Image[] {
    const s = BUILD_SLOTS.find((x) => x.id === b.slot);
    const def = buildingDef(b.type);
    if (!s || !def) return [];
    const p = iso(s.x, s.y);
    const objs: Phaser.GameObjects.Image[] = [];
    if (textureOrigin(this, def.sprite)) {
      // seviye büyüdükçe yapı biraz büyür (seviye 1: 0.92, 3: 1.08)
      objs.push(placeIso(this, def.sprite, s.x, s.y).setScale(0.84 + b.level * 0.08));
    } else if (def.sprite === 'turbine') {
      const bottom = p.y + MAP.tileHeight * 0.75;
      objs.push(this.add.image(p.x, bottom, 'turbine').setOrigin(0.5, 1).setDepth(depthOf(s.x, s.y) + 20));
      const hub = this.add.image(p.x, bottom - 150 + 38, 'blades').setDepth(depthOf(s.x, s.y) + 21);
      objs.push(hub);
      const t = this.tweens.add({ targets: hub, angle: 360, duration: 6000 / b.level, repeat: -1 });
      this.ambient.push(t);
      if (reducedMotion()) t.pause();
    } else if (def.sprite === 'tree') {
      for (let k = 0; k < b.level + 1; k++) objs.push(placeUpright(this, k % 2 ? 'tree-b' : 'tree', s.x, s.y, 0.3 + (k % 2) * 0.4, 0.3 + Math.floor(k / 2) * 0.4));
    } else {
      const oy = CUSTOM_GROUND_OFFSET[def.sprite] ?? 0;
      const h = this.textures.getFrame(def.sprite).height;
      objs.push(this.add.image(p.x, p.y, def.sprite).setOrigin(0.5, oy / h).setDepth(oy < 30 ? 2 + p.y / 1000 : depthOf(s.x, s.y) + 10).setScale(0.9 + b.level * 0.05));
    }
    return objs;
  }

  /** Gökyüzü katmanı: ekrana sabit, renk/alfa ile gün-gece ve hava tonu. */
  private setupSky() {
    const { width, height } = this.scale;
    this.sky = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0).setScrollFactor(0).setDepth(7000);
    this.scale.on('resize', (s: Phaser.Structs.Size) => this.sky?.setSize(s.width, s.height));
    for (let k = 0; k < 90; k++) this.rain.push(this.add.image(0, 0, 'drop').setScrollFactor(0).setDepth(7001).setVisible(false).setAngle(12));
  }

  private applyWeather(w: Weather, newDay: boolean) {
    const tint: Record<Weather, [number, number]> = {
      sunny: [0xffffff, 0], cloudy: [0x6d7d8c, 0.16], rainy: [0x40566b, 0.24], windy: [0x9fb3c2, 0.08],
      storm: [0x1d2b3a, 0.36], heatwave: [0xff9b3d, 0.14], drought: [0xc49a5a, 0.14],
    };
    const [color, alpha] = tint[w];
    const sky = this.sky!;
    if (newDay && !reducedMotion()) {
      // gece -> sabah sıcak tonu -> günün havası
      sky.setFillStyle(0x0b1830, sky.fillAlpha);
      this.tweens.add({ targets: sky, fillAlpha: 0.6, duration: 650, ease: 'Sine.easeIn', onComplete: () => {
        sky.setFillStyle(0xffb46b, 0.6);
        this.tweens.add({ targets: sky, fillAlpha: 0.18, duration: 500, ease: 'Sine.easeOut', onComplete: () => {
          sky.setFillStyle(color, 0.18);
          this.tweens.add({ targets: sky, fillAlpha: alpha, duration: 900, ease: 'Sine.easeOut' });
        } });
      } });
    } else sky.setFillStyle(color, alpha);
    this.rainTweens.forEach((t) => t.remove());
    this.rainTweens = [];
    const raining = w === 'rainy' || w === 'storm';
    const { width, height } = this.scale;
    this.rain.forEach((d, k) => {
      d.setVisible(raining);
      if (!raining) return;
      const x = (k * 97) % Math.max(1, width), y0 = -20 - ((k * 53) % height);
      d.setPosition(x, y0);
      const t = this.tweens.add({ targets: d, y: height + 20, x: x - (w === 'storm' ? 120 : 60), duration: (w === 'storm' ? 500 : 800) + (k % 7) * 60, repeat: -1, delay: (k % 11) * 70 });
      if (reducedMotion()) { t.pause(); d.setVisible(k % 3 === 0).setY((k * 37) % height); }
      this.rainTweens.push(t);
    });
  }

  /**
   * Yollarda gidip gelen araçlar (Kenney Isometric Vehicles, CC0; yön karesi harekete göre seçilir) ve yayalar.
   * Araç atlası yüklenemezse kodla üretilen araç kullanılır. Hareket azaltmada durur.
   */
  private addTraffic() {
    const hasVehicles = this.textures.exists('vehicles') && this.textures.get('vehicles').has('taxi_SE.png');
    const dirOf = (a: [number, number], b: [number, number]) =>
      VEHICLE_DIR[b[0] !== a[0] ? (b[0] > a[0] ? '+x' : '-x') : (b[1] > a[1] ? '+y' : '-y')];
    const route = (kind: 'taxi' | 'garbage' | 'police' | 'ambulance' | 'walker', from: [number, number], to: [number, number], dur: number, delay: number) => {
      const a = iso(from[0] + 0.5, from[1] + 0.5), b = iso(to[0] + 0.5, to[1] + 0.5);
      const kenney = kind !== 'walker' && hasVehicles;
      const there = `${kind}_${dirOf(from, to)}.png`, back = `${kind}_${dirOf(to, from)}.png`;
      const img = kenney
        ? this.add.image(a.x, a.y, 'vehicles', there).setOrigin(0.5, 0.8).setScale(1.5)
        : this.add.image(a.x, a.y, kind === 'walker' ? 'walker' : 'car').setOrigin(0.5, 1).setFlipX(b.x < a.x);
      img.setDepth(10 + a.y + HH);
      this.ambient.push(this.tweens.add({
        targets: img, x: b.x, y: b.y, duration: dur, delay, yoyo: true, repeat: -1, ease: 'Linear',
        onUpdate: () => img.setDepth(10 + img.y + HH),
        onYoyo: () => { if (kenney) img.setFrame(back); else img.setFlipX(!img.flipX); },
        onRepeat: () => { if (kenney) img.setFrame(there); else img.setFlipX(b.x < a.x); },
      }));
    };
    route('taxi', [13, 13], [26, 13], 9000, 0);
    route('taxi', [26, 14], [26, 26], 9000, 2500);
    route('police', [27, 8], [38, 8], 10000, 1000);
    route('taxi', [13, 27], [13, 38], 10000, 4000);
    route('ambulance', [3, 13], [12, 13], 8000, 1500);
    route('garbage', [27, 26], [37, 26], 12000, 3000);
    route('garbage', [32, 27], [32, 37], 11000, 6000);
    route('taxi', [27, 21], [36, 21], 8000, 3000);
    route('walker', [13, 16], [13, 24], 12000, 500);
  }

  /** Örtüşen alanlarda en küçük bölge kazanır (kantin, kampüsün içindedir). */
  private hotspotAt(wx: number, wy: number): Hotspot | undefined {
    const t = toTile(wx, wy);
    return hotspots
      .filter((h) => t.x >= h.bounds[0] && t.x < h.bounds[1] + 1 && t.y >= h.bounds[2] && t.y < h.bounds[3] + 1)
      .sort((a, b) => area(a) - area(b))[0];
  }

  /** Ana bina görüntüsüne isabet (çatı karonun üstüne taşar). */
  private buildingAt(wx: number, wy: number): Hotspot | undefined {
    const hits = [...this.nodes.entries()].filter(([, n]) => n.img.getBounds().contains(wx, wy));
    if (!hits.length) return undefined;
    hits.sort((a, b) => b[1].img.depth - a[1].img.depth);
    return hotspots.find((h) => h.id === hits[0][0]);
  }

  private addPointer() {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) return;
      if (!isWorldPointer(this, p)) return this.hover(undefined);
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      this.hover(this.buildingAt(w.x, w.y) ?? this.hotspotAt(w.x, w.y), w.x, w.y);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.dragged || !isWorldPointer(this, p)) return;
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      const t = toTile(w.x, w.y);
      const onBuilding = this.buildingAt(w.x, w.y);
      const slot = !onBuilding && BUILD_SLOTS.find((s) => (!s.map || s.map === 'world') && s.id !== 'campus' && Math.floor(t.x) === s.x && Math.floor(t.y) === s.y);
      if (slot) {
        const b = gameStore.get().sim.buildings.find((x) => x.slot === slot.id);
        if (b) gameStore.inspectTarget({ kind: 'building', id: b.id });
        else gameStore.inspectTarget({ kind: 'slot', id: slot.id });
        return;
      }
      const h = onBuilding ?? this.hotspotAt(w.x, w.y);
      if (h) {
        gameStore.inspectTarget({ kind: 'zone', id: h.id });
        const c = hotspotCenter(h);
        const pt = iso(c.x, c.y);
        this.cameras.main.pan(pt.x, pt.y, reducedMotion() ? 0 : 500, 'Sine.easeInOut');
      } else gameStore.inspectTarget(null);
    });
  }

  private hovered?: string;
  private hover(h?: Hotspot, wx = 0, wy = 0) {
    if (h) this.tip?.setPosition(wx, wy - 18);
    if (this.hovered === h?.id) return;
    const prev = this.hovered ? this.nodes.get(this.hovered) : undefined;
    if (prev) { prev.img.clearTint(); this.tweens.add({ targets: prev.img, y: prev.img.y + 6, duration: reducedMotion() ? 0 : 160 }); }
    this.hovered = h?.id;
    const n = h ? this.nodes.get(h.id) : undefined;
    if (n) { n.img.setTint(0xfff6dc); this.tweens.add({ targets: n.img, y: n.img.y - 6, duration: reducedMotion() ? 0 : 160, ease: 'Sine.easeOut' }); }
    this.glow?.clear();
    this.tip?.setVisible(!!h);
    this.input.setDefaultCursor(h ? 'pointer' : 'default');
    if (!h) return;
    const [x0, x1, y0, y1] = h.bounds;
    this.glow?.lineStyle(4, 0xf6c453, 0.9).strokePoints(diamond(x0, y0, x1 - x0 + 1, y1 - y0 + 1), true);
    this.tip?.setText(h.label);
  }

  // ---- Oyuncu karakteri: avatar görünümüyle haritada yürür (duruş, yürüme, düşünme, sevinç) ----
  private player?: Phaser.GameObjects.Image;
  private playerBubble?: Phaser.GameObjects.Text;
  private playerLook = '';
  private playerWalk?: Phaser.Tweens.Tween;
  private playerStep?: Phaser.Time.TimerEvent;
  private playerIdle?: Phaser.Tweens.Tween;
  private lastScores = 0;

  private addPlayer() {
    const st = gameStore.get();
    this.playerLook = JSON.stringify(st.profile.avatar);
    makePlayerTextures(this, st.profile.avatar);
    const p = iso(19.5, 20.5);
    this.player = this.add.image(p.x, p.y, 'player-0').setOrigin(0.5, 1).setScale(1.6).setDepth(10 + p.y + HH);
    this.playerBubble = this.add.text(p.x, p.y - 100, '', { fontFamily: "'Baloo 2', Nunito, sans-serif", fontSize: '26px', backgroundColor: '#ffffff', color: '#243447', padding: { x: 8, y: 2 } })
      .setOrigin(0.5, 1).setDepth(5650).setVisible(false);
    this.playerIdle = this.tweens.add({ targets: this.player, scaleY: 1.66, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.ambient.push(this.playerIdle);
    this.lastScores = st.scores.length;
    let wasOpen = st.decisionOpen, lastInspect = '';
    const unsub = gameStore.subscribe(() => {
      const s = gameStore.get();
      const look = JSON.stringify(s.profile.avatar);
      if (look !== this.playerLook) { this.playerLook = look; makePlayerTextures(this, s.profile.avatar); this.player?.setTexture('player-0'); }
      const target = s.inspect?.kind === 'zone' ? s.inspect.id : s.decisionOpen && s.selectedHotspotId ? s.selectedHotspotId : '';
      if (target && target !== lastInspect) this.walkTo(target);
      lastInspect = target;
      // düşünme: karar penceresi açıkken düşünce balonu
      if (s.decisionOpen !== wasOpen) this.bubble(s.decisionOpen ? '💭' : '');
      wasOpen = s.decisionOpen;
      // sevinç: yeni puan 80+ ise zıplar
      if (s.scores.length > this.lastScores) {
        const last = s.scores[s.scores.length - 1];
        if (last.total >= 80) this.cheer();
      }
      this.lastScores = s.scores.length;
    });
    this.events.once('shutdown', unsub);
  }

  private bubble(text: string) {
    const b = this.playerBubble, pl = this.player;
    if (!b || !pl) return;
    b.setText(text).setVisible(!!text).setPosition(pl.x, pl.y - pl.displayHeight - 6);
  }

  private cheer() {
    const pl = this.player;
    if (!pl || reducedMotion()) return;
    this.bubble('🎉');
    this.tweens.add({ targets: pl, y: pl.y - 26, duration: 220, yoyo: true, repeat: 2, ease: 'Quad.easeOut', onComplete: () => this.bubble('') });
  }

  /** Bölgenin önündeki karoya yürür (kampüs içinde düz çizgi; hareket azaltmada anında). */
  private walkTo(zoneId: string) {
    const h = hotspots.find((x) => x.id === zoneId), pl = this.player;
    if (!h || !pl) return;
    const t = iso(h.tileX + h.foot[0] / 2 + 0.3, h.tileY + h.foot[1] + 0.6);
    this.playerWalk?.remove();
    this.playerStep?.remove();
    pl.setFlipX(t.x < pl.x);
    if (reducedMotion()) { pl.setPosition(t.x, t.y).setDepth(10 + t.y + HH); return; }
    const dist = Phaser.Math.Distance.Between(pl.x, pl.y, t.x, t.y);
    let f = 0;
    this.playerStep = this.time.addEvent({ delay: 180, loop: true, callback: () => pl.setTexture(`player-${(f = 1 - f)}`) });
    this.playerWalk = this.tweens.add({
      targets: pl, x: t.x, y: t.y, duration: Phaser.Math.Clamp(dist * 2.2, 400, 4500), ease: 'Sine.easeInOut',
      onUpdate: () => { pl.setDepth(10 + pl.y + HH); this.playerBubble?.setPosition(pl.x, pl.y - pl.displayHeight - 6); },
      onComplete: () => { this.playerStep?.remove(); pl.setTexture('player-0'); },
    });
  }

  private focusHotspot(id: string) {
    const h = hotspots.find((x) => x.id === id);
    if (!h) return;
    const c = hotspotCenter(h);
    const p = iso(c.x, c.y);
    this.cameras.main.pan(p.x, p.y, 400, 'Sine.easeInOut');
  }

  /** Başlık ekranında yavaş kamera turu (hareket azaltmada durur). */
  private tourT = 0;
  private touring = false;
  update(_t: number, dt: number) {
    const st = gameStore.get();
    if (st.overlay !== 'menu' || reducedMotion()) {
      // tur bitince kamera kampüse döner
      if (this.touring) { this.touring = false; const c = iso(20, 20); this.cameras.main.centerOn(c.x, c.y); }
      return;
    }
    this.touring = true;
    this.tourT += dt;
    const c = iso(20, 20), cam = this.cameras.main;
    cam.centerOn(c.x + Math.sin(this.tourT / 14000) * 900, c.y + Math.sin(this.tourT / 9000) * 260);
  }

  private setupCamera() {
    const cam = this.cameras.main;
    const c = iso(20, 20);
    const left = iso(0, N).x, right = iso(N, 0).x, bottom = iso(N, N).y;
    const clamp = setupCameraControls(this, {
      min: 0.45, max: 1.5,
      bounds: new Phaser.Geom.Rectangle(left - 200, -360, right - left + 400, bottom + 560),
      onDragChange: (d) => (this.dragged = d),
    });
    cam.setZoom(clamp(this.scale.width < 700 ? 0.55 : this.scale.width < 1400 ? 0.75 : 0.9));
    cam.centerOn(c.x, c.y);
  }
}
