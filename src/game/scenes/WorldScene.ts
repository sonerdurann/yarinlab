import Phaser from 'phaser';
import { BUILDING_FRAMES, GROUND_FRAMES, GROUND_SPRITE_HEIGHT, MAP, ROAD_FRAMES, TREE_GID, WATER_DROP, WATER_GID } from '../tiles/mapManifest';
import { hotspots, type Hotspot } from '../tiles/hotspots';
import { DECOR } from '../tiles/decor';
import { gameStore } from '../../state/gameStore';

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
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const clampZoom = (z: number) => Phaser.Math.Clamp(z, 0.8, 1.4);

export class WorldScene extends Phaser.Scene {
  private glow?: Phaser.GameObjects.Graphics;
  private tip?: Phaser.GameObjects.Text;
  private dragged = false;
  private nodes = new Map<string, { img: Phaser.GameObjects.Image; label: Phaser.GameObjects.Container; imgY: number; labelY: number; scale: number; x: number; baseY: number }>();
  private lastResult: unknown = null;

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
        if (isWater && !reducedMotion()) {
          this.tweens.add({ targets: img, alpha: 0.93, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: ((x + y) % 8) * 200 });
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
        if (!reducedMotion()) this.tweens.add({ targets: hub, angle: hub.angle + 360, duration: 7000, repeat: -1 });
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
