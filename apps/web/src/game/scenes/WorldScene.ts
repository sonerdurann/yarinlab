import Phaser from 'phaser';
import { BUILDING_FRAMES, GROUND_FRAMES, GROUND_SPRITE_HEIGHT, MAP, ROAD_FRAMES, TREE_GID, WATER_DROP, WATER_GID } from '../tiles/mapManifest';
import { hotspots, type Hotspot } from '../tiles/hotspots';
import { DECOR } from '../tiles/decor';
import { gameStore } from '../../state/gameStore';
import { isReducedMotion as reducedMotion, settingsStore } from '../../state/settingsStore';
import { BUILD_SLOTS, buildingDef, weatherFor, type PlacedBuilding, type Weather } from '@yarinlab/shared';

type TiledLayer = { name: string; type: string; data?: number[] };
type TiledMap = { layers: TiledLayer[] };

const HW = MAP.tileWidth / 2;
const HH = MAP.tileHeight / 2;
/** Karo (x,y) -> dünya koordinatı; 2:1 izometrik elmas. */
export const iso = (x: number, y: number) => ({ x: (x - y) * HW, y: (x + y) * HH });

type P = Phaser.Math.Vector2;
const pt = (x: number, y: number): P => new Phaser.Math.Vector2(x, y);
const diamond = (x: number, y: number, w = 1, h = 1) => {
  const a = iso(x, y), b = iso(x + w, y), c = iso(x + w, y + h), d = iso(x, y + h);
  return [pt(a.x, a.y), pt(b.x, b.y), pt(c.x, c.y), pt(d.x, d.y)];
};

const area = (h: Hotspot) => (h.bounds[1] - h.bounds[0] + 1) * (h.bounds[3] - h.bounds[2] + 1);
const clampZoom = (z: number) => Phaser.Math.Clamp(z, 0.8, 1.4);

export class WorldScene extends Phaser.Scene {
  private glow?: Phaser.GameObjects.Graphics;
  private tip?: Phaser.GameObjects.Text;
  private dragged = false;
  private nodes = new Map<string, { img: Phaser.GameObjects.Image; label: Phaser.GameObjects.Container; imgY: number; labelY: number; scale: number; x: number; baseY: number }>();
  private lastResult: unknown = null;
  /** Sürekli ortam animasyonları (su parıltısı, türbin); hareket ayarına göre durdurulur/sürdürülür. */
  private ambient: Phaser.Tweens.Tween[] = [];
  private waterTiles: Phaser.GameObjects.Image[] = [];
  private placed = new Map<string, { objs: Phaser.GameObjects.GameObject[]; level: number }>();
  private slotMarks = new Map<string, Phaser.GameObjects.Image>();
  private sky?: Phaser.GameObjects.Rectangle;
  private rain: Phaser.GameObjects.Image[] = [];
  private rainTweens: Phaser.Tweens.Tween[] = [];
  private lastDay = -1;
  private lastWeather?: Weather;

  constructor() {
    super('WorldScene');
  }

  create() {
    const map = this.cache.json.get(MAP.key) as TiledMap;
    this.cameras.main.setBackgroundColor(0x9fd3e8); // ada çevresi: açık deniz
    this.drawTiles(map);
    this.drawDecor();
    this.drawBuildings();
    this.glow = this.add.graphics().setDepth(5000);
    this.tip = this.add
      .text(0, 0, '', { fontFamily: 'Noto Sans, sans-serif', fontSize: '22px', color: '#12263a', backgroundColor: '#f7f5ef', padding: { x: 10, y: 6 } })
      .setDepth(6000)
      .setVisible(false);
    this.addHotspots();
    this.setupCamera();
    this.addTraffic();
    this.setupSky();
    this.syncCity(true);
    const unsubCity = gameStore.subscribe(() => this.syncCity(false));
    this.events.once('shutdown', unsubCity);
    // Kanvas sınırları ilk yerleşimde eski kalabiliyor; işaretçi koordinatları için yenile.
    this.scale.updateBounds();
    this.scale.on('resize', () => this.scale.updateBounds());
    this.events.on('focus-hotspot', (id: string) => this.focusHotspot(id));
    // Karar sonucu gelince kantin vurgulanır (kılavuz §04: bina vurgusu, 1-2 sn karar efekti).
    const unsub = gameStore.subscribe(() => {
      const r = gameStore.get().result;
      if (r && r !== this.lastResult) this.pulse('canteen');
      this.lastResult = r;
    });
    this.events.once('shutdown', unsub);
    // Hareket ayarı (otomatik/azalt/tam): ortam animasyonlarını durdur veya sürdür.
    const applyMotion = () => {
      const reduced = reducedMotion();
      this.ambient.forEach((t) => (reduced ? t.pause() : t.resume()));
      if (reduced) this.waterTiles.forEach((w) => w.setAlpha(1));
      this.rainTweens.forEach((t) => (reduced ? t.pause() : t.resume()));
    };
    applyMotion();
    const unsubMotion = settingsStore.subscribe(applyMotion);
    this.events.once('shutdown', unsubMotion);
    gameStore.setWorldReady();
  }

  /** Yuvarlak köşeli etiket (arka plan + metin tek kapta). */
  private pill(x: number, y: number, text: string, locked: boolean) {
    const t = this.add
      .text(0, 0, text, { fontFamily: 'Noto Sans, sans-serif', fontSize: '20px', color: locked ? '#4a5a6c' : '#12263a', fontStyle: '600' })
      .setOrigin(0.5);
    const w = t.width + 24, h = t.height + 8;
    const g = this.add.graphics();
    g.fillStyle(locked ? 0xe5e3dc : 0xf7f5ef, 0.95).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.lineStyle(1.5, 0x12263a, 0.2).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    return this.add.container(x, y, [g, t]).setDepth(5500);
  }

  /** Karar sonrası bina vurgusu: büyüme + genişleyen halka. */
  private pulse(id: string) {
    const n = this.nodes.get(id);
    if (!n || reducedMotion()) return;
    this.tweens.add({ targets: n.img, scale: n.scale * 1.08, duration: 220, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    const ring = this.add.graphics().setDepth(5100).setPosition(n.x, n.baseY);
    ring.lineStyle(5, 0x2e9e6b, 0.9).strokeEllipse(0, 0, 120, 60);
    this.tweens.add({ targets: ring, scaleX: 2.6, scaleY: 2.6, alpha: 0, duration: 1400, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  }

  /** Üzerine gelinen bina hafifçe yükselir (150-250 ms). */
  private lift(id: string | undefined, up: boolean) {
    const n = id ? this.nodes.get(id) : undefined;
    if (!n) return;
    const d = up ? -6 : 0;
    this.tweens.add({ targets: n.img, y: n.imgY + d, duration: reducedMotion() ? 0 : 180, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: n.label, y: n.labelY + d, duration: reducedMotion() ? 0 : 180, ease: 'Sine.easeOut' });
  }

  private drawTiles(map: TiledMap) {
    const layer = (n: string) => map.layers.find((l) => l.name === n)?.data ?? [];
    const ground = layer('ground'), roads = layer('roads'), deco = layer('decoration');
    const isRoad = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP.size && y < MAP.size && !!roads[y * MAP.size + x];
    // dekor karosu ve türbin çevresinde (yüksek parça) ağaç çizilmez
    const decorTiles = new Set<number>();
    for (const d of DECOR) {
      const r = d.kind === 'turbine' ? 1 : 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) decorTiles.add((d.y + dy) * MAP.size + d.x + dx);
    }
    // Satır-sütun sırası (right-down) düz karolar için doğru ressam sırasını verir.
    for (let y = 0; y < MAP.size; y++) {
      for (let x = 0; x < MAP.size; x++) {
        const i = y * MAP.size + x;
        const p = iso(x, y);
        let def: { atlas: string; frame: string; tint?: number; flipX?: boolean } | undefined = GROUND_FRAMES[ground[i]];
        if (roads[i]) {
          const ax = isRoad(x - 1, y) || isRoad(x + 1, y), ay = isRoad(x, y - 1) || isRoad(x, y + 1);
          def = ax && ay ? ROAD_FRAMES.cross : ay ? ROAD_FRAMES.alongY : ROAD_FRAMES.alongX;
        }
        if (!def) continue;
        // 1.015 ölçek: karolar arası dikişi kapatır
        const isWater = !roads[i] && ground[i] === WATER_GID;
        const img = this.add
          .image(p.x, p.y + (isWater ? WATER_DROP : 0), def.atlas, def.frame)
          .setOrigin(0.5, 0)
          .setScale(def.flipX ? -1.015 : 1.015, 1.015)
          .setDepth(0);
        // su parıltısı: karo karo hafif gecikmeli (hareket azaltma açıksa çalışmaz)
        if (isWater) {
          this.waterTiles.push(img);
          this.ambient.push(this.tweens.add({ targets: img, alpha: 0.93, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: ((x + y) % 8) * 200 }));
        }
        if (deco[i] === TREE_GID && !decorTiles.has(i)) {
          const c = iso(x + 0.5, y + 0.5);
          this.add.image(c.x, c.y + 6, 'tree').setOrigin(0.5, 1).setDepth(10 + c.y);
        }
      }
    }
  }

  /** Etkileşimsiz dekor: üretilmiş özel parçalar ve Kenney dekor binaları. */
  private drawDecor() {
    for (const d of DECOR) {
      const p = iso(d.x, d.y);
      if (d.kind === 'building') {
        const f = this.textures.getFrame('buildings', d.frame!);
        this.add.image(p.x, p.y - (f.height - GROUND_SPRITE_HEIGHT), 'buildings', d.frame).setOrigin(0.5, 0).setDepth(10 + p.y);
      } else if (d.kind === 'turbine') {
        const bottom = p.y + MAP.tileHeight * 0.75;
        this.add.image(p.x, bottom, d.kind).setOrigin(0.5, 1).setDepth(10 + p.y + 20);
        const hub = this.add.image(p.x, bottom - 150 + 38, 'blades').setDepth(10 + p.y + 21).setAngle((d.x * 37 + d.y * 53) % 120);
        this.ambient.push(this.tweens.add({ targets: hub, angle: hub.angle + 360, duration: 7000, repeat: -1 }));
      } else {
        // zemin karosunun elmasına oturur (üst köşe hizası); kutu parçaları yukarı taşar
        this.add.image(p.x, p.y, d.kind).setOrigin(0.5, 0).setDepth(d.kind === 'crop' ? 1 : 10 + p.y + 10);
      }
    }
  }

  private drawBuildings() {
    for (const h of hotspots) {
      const def = BUILDING_FRAMES[h.id];
      const p = iso(h.tileX, h.tileY);
      const frame = this.textures.getFrame(def.atlas, def.frame);
      // Binanın taban bloğu 99 px; üst kısım yukarı taşar. Önemli binalar daha büyük çizilir.
      const scale = h.id === 'school' ? 1.8 : h.locked ? 1.2 : 1.4;
      const top = p.y - (frame.height - GROUND_SPRITE_HEIGHT) * scale;
      this.add.image(p.x, p.y + HH, 'shadow').setScale(scale * 1.1).setAlpha(h.locked ? 0.6 : 1).setDepth(5 + p.y);
      const img = this.add.image(p.x, top, def.atlas, def.frame).setOrigin(0.5, 0).setScale(scale).setDepth(10 + p.y);
      if (h.locked) img.setAlpha(0.6).setTint(0xcfd6e2);
      const label = this.pill(p.x, top - 10, h.locked ? `${h.label} · Yakında` : h.label, h.locked);
      this.nodes.set(h.id, { img, label, imgY: top, labelY: top - 10, scale, x: p.x, baseY: p.y + HH });
    }
  }

  /** Kurulan yapılar ve boş alanlar store ile eşitlenir; yeni yapı ve yükseltmede kısa animasyon. */
  private syncCity(initial: boolean) {
    const st = gameStore.get();
    const ids = new Set(st.sim.buildings.map((b) => b.id));
    for (const [id, v] of this.placed) {
      if (!ids.has(id)) { v.objs.forEach((o) => o.destroy()); this.placed.delete(id); }
    }
    for (const b of st.sim.buildings) {
      const cur = this.placed.get(b.id);
      if (cur && cur.level === b.level) continue;
      cur?.objs.forEach((o) => o.destroy());
      const objs = this.drawPlaced(b);
      this.placed.set(b.id, { objs, level: b.level });
      if (!initial && !reducedMotion()) {
        objs.forEach((o) => {
          const img = o as Phaser.GameObjects.Image;
          if (!('y' in img)) return;
          const y = img.y;
          img.setAlpha(0).setY(y - 40);
          this.tweens.add({ targets: img, alpha: 1, y, duration: 420, ease: 'Back.easeOut' });
        });
        const p = this.slotCenter(b.slot);
        if (p) this.burst(p.x, p.y);
      }
    }
    const taken = new Set(st.sim.buildings.map((b) => b.slot));
    for (const s of BUILD_SLOTS) {
      let m = this.slotMarks.get(s.id);
      if (!m) {
        const p = iso(s.x, s.y);
        m = this.add.image(p.x, p.y, 'slot').setOrigin(0.5, 0).setDepth(2).setAlpha(0.85);
        this.slotMarks.set(s.id, m);
      }
      m.setVisible(!taken.has(s.id));
    }
    const weather = weatherFor(st.sim.seed, st.sim.day);
    if (st.sim.day !== this.lastDay || weather !== this.lastWeather) {
      const changedDay = this.lastDay >= 0 && st.sim.day !== this.lastDay;
      this.lastDay = st.sim.day;
      this.lastWeather = weather;
      this.applyWeather(weather, changedDay);
    }
  }

  private slotCenter(slotId: string) {
    const s = BUILD_SLOTS.find((x) => x.id === slotId);
    return s ? iso(s.x + 0.5, s.y + 0.5) : undefined;
  }

  private drawPlaced(b: PlacedBuilding): Phaser.GameObjects.GameObject[] {
    const s = BUILD_SLOTS.find((x) => x.id === b.slot);
    const def = buildingDef(b.type);
    if (!s || !def) return [];
    const p = iso(s.x, s.y);
    const objs: Phaser.GameObjects.GameObject[] = [];
    const scale = 0.9 + b.level * 0.1;
    if (def.sprite.startsWith('building:')) {
      const frame = def.sprite.slice(9);
      const f = this.textures.getFrame('buildings', frame);
      objs.push(this.add.image(p.x, p.y - (f.height - GROUND_SPRITE_HEIGHT) * scale, 'buildings', frame).setOrigin(0.5, 0).setScale(scale).setDepth(10 + p.y));
    } else if (def.sprite === 'turbine') {
      const bottom = p.y + MAP.tileHeight * 0.75;
      objs.push(this.add.image(p.x, bottom, 'turbine').setOrigin(0.5, 1).setDepth(10 + p.y + 20));
      const hub = this.add.image(p.x, bottom - 150 + 38, 'blades').setDepth(10 + p.y + 21);
      objs.push(hub);
      const t = this.tweens.add({ targets: hub, angle: 360, duration: 6000 / b.level, repeat: -1 });
      this.ambient.push(t);
      if (reducedMotion()) t.pause();
    } else if (def.sprite === 'tree') {
      for (let k = 0; k < b.level + 1; k++) {
        const c = iso(s.x + 0.3 + (k % 2) * 0.4, s.y + 0.3 + Math.floor(k / 2) * 0.4);
        objs.push(this.add.image(c.x, c.y + 6, 'tree').setOrigin(0.5, 1).setDepth(10 + c.y));
      }
    } else {
      objs.push(this.add.image(p.x, p.y, def.sprite).setOrigin(0.5, 0).setDepth(def.sprite === 'crop' ? 1 : 10 + p.y + 10));
    }
    if (b.level > 1) {
      const c = iso(s.x + 0.5, s.y + 0.5);
      objs.push(this.add.text(c.x + 30, c.y - 40, `★${b.level}`, { fontFamily: 'Noto Sans, sans-serif', fontSize: '18px', color: '#12263a', backgroundColor: '#e8b73a', padding: { x: 4, y: 1 } }).setDepth(5400));
    }
    return objs;
  }

  /** İnşa / görev bildirimi: kıvılcım halkası. */
  private burst(x: number, y: number) {
    const ring = this.add.graphics().setDepth(5100).setPosition(x, y);
    ring.lineStyle(5, 0x2e9e6b, 1).strokeEllipse(0, 0, 90, 45);
    this.tweens.add({ targets: ring, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  }

  private pulseObj(o?: Phaser.GameObjects.GameObject) {
    if (!o || reducedMotion()) return;
    const img = o as Phaser.GameObjects.Image;
    this.tweens.add({ targets: img, scale: img.scale * 1.08, duration: 200, yoyo: true });
  }

  /** Gökyüzü katmanı: ekrana sabit, renk/alfa ile gün-gece ve hava tonu. */
  private setupSky() {
    const { width, height } = this.scale;
    this.sky = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0).setScrollFactor(0).setDepth(7000);
    this.scale.on('resize', (s: Phaser.Structs.Size) => this.sky?.setSize(s.width, s.height));
    for (let k = 0; k < 90; k++) {
      this.rain.push(this.add.image(0, 0, 'drop').setScrollFactor(0).setDepth(7001).setVisible(false).setAngle(12));
    }
  }

  private applyWeather(w: Weather, newDay: boolean) {
    const tint: Record<Weather, [number, number]> = {
      sunny: [0xffffff, 0], cloudy: [0x6d7d8c, 0.18], rainy: [0x40566b, 0.26], windy: [0x9fb3c2, 0.08],
      storm: [0x1d2b3a, 0.38], heatwave: [0xff9b3d, 0.16], drought: [0xc49a5a, 0.16],
    };
    const [color, alpha] = tint[w];
    const sky = this.sky!;
    const finish = () => { sky.setFillStyle(color, alpha); };
    if (newDay && !reducedMotion()) {
      // gece geçişi: kararır, sonra yeni günün tonuna açılır
      sky.setFillStyle(0x0b1830, sky.fillAlpha);
      this.tweens.add({ targets: sky, fillAlpha: 0.62, duration: 650, ease: 'Sine.easeIn', yoyo: false, onComplete: () => {
        sky.setFillStyle(color, 0.62);
        this.tweens.add({ targets: sky, fillAlpha: alpha, duration: 900, ease: 'Sine.easeOut' });
      } });
    } else finish();
    this.rainTweens.forEach((t) => t.remove());
    this.rainTweens = [];
    const raining = w === 'rainy' || w === 'storm';
    const { width, height } = this.scale;
    this.rain.forEach((d, k) => {
      d.setVisible(raining);
      if (!raining) return;
      const x = (k * 97) % Math.max(1, width), y0 = -20 - ((k * 53) % height);
      d.setPosition(x, y0);
      const t = this.tweens.add({ targets: d, y: height + 20, x: x - 60, duration: (w === 'storm' ? 500 : 800) + (k % 7) * 60, repeat: -1, delay: (k % 11) * 70 });
      if (reducedMotion()) { t.pause(); d.setVisible(k % 3 === 0).setY((k * 37) % height); }
      this.rainTweens.push(t);
    });
  }

  /** Yollarda gidip gelen araçlar ve yürüyen insanlar (ortam animasyonu; hareket azaltmada durur). */
  private addTraffic() {
    const route = (kind: 'car' | 'walker', from: [number, number], to: [number, number], dur: number, delay: number) => {
      const a = iso(from[0] + 0.5, from[1] + 0.5), b = iso(to[0] + 0.5, to[1] + 0.5);
      const img = this.add.image(a.x, a.y, kind).setOrigin(0.5, 1).setDepth(10 + a.y + 5);
      img.setFlipX(b.x < a.x);
      const t = this.tweens.add({
        targets: img, x: b.x, y: b.y, duration: dur, delay, yoyo: true, repeat: -1, ease: 'Linear',
        onUpdate: () => img.setDepth(10 + img.y + 5),
        onYoyo: () => img.setFlipX(!img.flipX),
      });
      this.ambient.push(t);
    };
    route('car', [3, 15], [27, 15], 16000, 0);
    route('car', [14, 4], [14, 26], 14000, 3000);
    route('car', [25, 10], [14, 10], 9000, 1500);
    route('walker', [14, 12], [14, 20], 12000, 500);
    route('walker', [6, 15], [12, 15], 10000, 2500);
    route('walker', [5, 8], [5, 18], 15000, 4000);
  }

  /** Dünya koordinatı -> karo (ters izometrik). */
  private toTile(wx: number, wy: number) {
    return { x: (wx / HW + wy / HH) / 2, y: (wy / HH - wx / HW) / 2 };
  }

  /** Örtüşen alanlarda en küçük hotspot kazanır (kantin, okulun içine taşar). */
  private hotspotAt(wx: number, wy: number): Hotspot | undefined {
    const t = this.toTile(wx, wy);
    return hotspots
      .filter((h) => t.x >= h.bounds[0] && t.x < h.bounds[1] + 1 && t.y >= h.bounds[2] && t.y < h.bounds[3] + 1)
      .sort((a, b) => area(a) - area(b))[0];
  }

  private hotspotAtPointer(p: Phaser.Input.Pointer) {
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    return this.hotspotAt(w.x, w.y);
  }

  private addHotspots() {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) return;
      const h = this.hotspotAtPointer(p);
      this.hover(h);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.dragged) return;
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      const t = this.toTile(w.x, w.y);
      const slot = BUILD_SLOTS.find((s) => Math.floor(t.x) === s.x && Math.floor(t.y) === s.y);
      if (slot) {
        const b = gameStore.get().sim.buildings.find((x) => x.slot === slot.id);
        gameStore.openOverlay('build', slot.zone);
        if (b) this.pulseObj(this.placed.get(b.id)?.objs[0]);
        return;
      }
      const h = this.hotspotAtPointer(p);
      if (h) gameStore.selectHotspot(h.id);
    });
  }

  private hovered?: string;
  private hover(h?: Hotspot) {
    if (this.hovered === h?.id) return;
    this.lift(this.hovered, false);
    this.hovered = h?.id;
    this.lift(h?.id, true);
    this.glow?.clear();
    this.tip?.setVisible(!!h);
    this.input.setDefaultCursor(h ? 'pointer' : 'default');
    if (!h) return;
    const [x0, x1, y0, y1] = h.bounds;
    const poly = diamond(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    this.glow?.lineStyle(6, 0xe8b73a, 0.95).strokePoints(poly, true).fillStyle(0xe8b73a, 0.14).fillPoints(poly, true);
    const t = iso(h.tileX + 0.5, h.tileY + 0.5);
    this.tip?.setText(h.locked ? `${h.label} – Henüz açılmadı` : `${h.label} – tıkla`).setPosition(t.x, t.y + 40).setOrigin(0.5, 0);
  }

  private focusHotspot(id: string) {
    const h = hotspots.find((x) => x.id === id);
    if (!h) return;
    const p = iso(h.tileX + 0.5, h.tileY + 0.5);
    this.cameras.main.pan(p.x, p.y, 400, 'Sine.easeInOut');
  }

  private setupCamera() {
    const cam = this.cameras.main;
    const c = iso(14.5, 14.5);
    cam.centerOn(c.x, c.y);
    cam.setZoom(clampZoom(this.scale.width < 700 ? 0.8 : 1)); // dar ekranda daha geniş görünüm
    this.input.on('pointerdown', () => {
      this.dragged = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      if (Math.abs(p.x - p.downX) + Math.abs(p.y - p.downY) > 6) this.dragged = true;
      if (this.dragged) {
        cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
        cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
      }
    });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      cam.setZoom(clampZoom(cam.zoom * (dy > 0 ? 0.92 : 1.08)));
    });
    this.events.on('zoom', (delta: number) => cam.setZoom(clampZoom(cam.zoom + delta)));
  }
}
