import Phaser from 'phaser';
import { MAP } from '../tiles/mapManifest';
import { textureOrigin } from '../art/isoArt';

export const HW = MAP.tileWidth / 2;
export const HH = MAP.tileHeight / 2;
/** Karo (x,y) -> dünya koordinatı; 2:1 izometrik elmas (üst köşe). */
export const iso = (x: number, y: number) => ({ x: (x - y) * HW, y: (x + y) * HH });
/** Dünya koordinatı -> karo (ters izometrik). */
export const toTile = (wx: number, wy: number) => ({ x: (wx / HW + wy / HH) / 2, y: (wy / HH - wx / HW) / 2 });
/** Ressam sırası: tabanın alt köşesi ne kadar aşağıdaysa o kadar önde. */
export const depthOf = (x: number, y: number, fw = 1, fd = 1) => 10 + iso(x + fw, y + fd).y;

export const diamond = (x: number, y: number, w = 1, h = 1) => {
  const a = iso(x, y), b = iso(x + w, y), c = iso(x + w, y + h), d = iso(x, y + h);
  return [a, b, c, d].map((p) => new Phaser.Math.Vector2(p.x, p.y));
};

/** Kodla üretilmiş izometrik dokuyu taban üst köşesi karo (x,y)'ye oturtur. */
export function placeIso(scene: Phaser.Scene, key: string, x: number, y: number) {
  const o = textureOrigin(scene, key);
  const p = iso(x, y);
  const img = scene.add.image(p.x, p.y, key).setOrigin(o?.x ?? 0.5, o?.y ?? 0);
  img.setDepth(depthOf(x, y, o?.fw ?? 1, o?.fd ?? 1));
  return img;
}

/** Ağaç gibi alttan hizalı dokuyu karo merkezine koyar. */
export function placeUpright(scene: Phaser.Scene, key: string, x: number, y: number, dx = 0.5, dy = 0.5) {
  const c = iso(x + dx, y + dy);
  return scene.add.image(c.x, c.y + 6, key).setOrigin(0.5, 1).setDepth(10 + c.y + HH);
}

/** İki parmakla yakınlaştırma + sürükleme + tekerlek; sınırlı kamera. */
export function setupCameraControls(scene: Phaser.Scene, opts: { min: number; max: number; bounds: Phaser.Geom.Rectangle; onDragChange: (d: boolean) => void }) {
  const cam = scene.cameras.main;
  const clamp = (z: number) => Phaser.Math.Clamp(z, opts.min, opts.max);
  cam.setBounds(opts.bounds.x, opts.bounds.y, opts.bounds.width, opts.bounds.height);
  scene.input.addPointer(1);
  let pinch = 0;
  let dragged = false;
  const canvas = scene.game.canvas;
  scene.input.on('pointerdown', () => { dragged = false; opts.onDragChange(false); });
  scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
    const a = scene.input.pointer1, b = scene.input.pointer2;
    if (a.isDown && b.isDown) {
      const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      if (pinch > 0) cam.setZoom(clamp(cam.zoom * (d / pinch)));
      pinch = d;
      dragged = true;
      opts.onDragChange(true);
      return;
    }
    pinch = 0;
    if (!p.isDown || (p.downElement && p.downElement !== canvas)) return;
    if (Math.abs(p.x - p.downX) + Math.abs(p.y - p.downY) > 6) { dragged = true; opts.onDragChange(true); }
    if (dragged) {
      cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
      cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
    }
  });
  scene.input.on('pointerup', () => { pinch = 0; });
  scene.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => cam.setZoom(clamp(cam.zoom * (dy > 0 ? 0.92 : 1.08))));
  scene.events.on('zoom', (delta: number) => cam.setZoom(clamp(cam.zoom + delta)));
  return clamp;
}

/**
 * Yalnızca kanvasın kendisine gelen ve açık pencere yokken yapılan tıklamalar dünyayı etkiler. Phaser bırakma
 * olaylarını pencere düzeyinde dinlediği için, arayüz pencerelerindeki tıklamalar aksi hâlde alttaki bölgeyi açardı.
 */
export function isWorldPointer(scene: Phaser.Scene, p: Phaser.Input.Pointer) {
  const canvas = scene.game.canvas;
  const target = (p.event as Event | undefined)?.target ?? null;
  if (target !== canvas || (p.downElement && p.downElement !== canvas)) return false;
  return !document.querySelector('[role=dialog]');
}
