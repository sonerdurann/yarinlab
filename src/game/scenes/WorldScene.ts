import Phaser from 'phaser';
import { BUILDING_FRAMES, GROUND_FRAMES, GROUND_SPRITE_HEIGHT, MAP } from '../tiles/mapManifest';
import { hotspots, type Hotspot } from '../tiles/hotspots';
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
const clampZoom = (z: number) => Phaser.Math.Clamp(z, 0.8, 1.4);

export class WorldScene extends Phaser.Scene {
  private glow?: Phaser.GameObjects.Graphics;
  private tip?: Phaser.GameObjects.Text;
  private dragged = false;

  constructor() {
    super('WorldScene');
  }

  create() {
    const map = this.cache.json.get(MAP.key) as TiledMap;
    this.cameras.main.setBackgroundColor(0xeaf3f7);
    this.drawTiles(map);
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
  }

  private drawTiles(map: TiledMap) {
    const ground = map.layers.find((l) => l.name === 'ground')?.data ?? [];
    const roads = map.layers.find((l) => l.name === 'roads')?.data ?? [];
    // Satır-sütun sırası (right-down) düz karolar için doğru ressam sırasını verir.
    for (let y = 0; y < MAP.size; y++) {
      for (let x = 0; x < MAP.size; x++) {
        const i = y * MAP.size + x;
        const def = GROUND_FRAMES[roads[i] || ground[i]];
        if (!def) continue;
        const p = iso(x, y);
        const img = this.add.image(p.x, p.y, def.atlas, def.frame).setOrigin(0.5, 0).setScale(1.015).setDepth(0); // hafif taşma: karolar arası dikişi kapatır
        if (def.tint) img.setTint(def.tint);
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
      const img = this.add.image(p.x, top, def.atlas, def.frame).setOrigin(0.5, 0).setScale(scale).setDepth(10 + p.y);
      if (h.locked) img.setAlpha(0.6).setTint(0xcfd6e2);
      this.add
        .text(p.x, top - 6, h.locked ? `${h.label} · Yakında` : h.label, {
          fontFamily: 'Noto Sans, sans-serif', fontSize: '22px', color: '#12263a', backgroundColor: '#f7f5efcc', padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(5500);
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
    this.hovered = h?.id;
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
    cam.setZoom(clampZoom(1));
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
