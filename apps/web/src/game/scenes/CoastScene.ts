import Phaser from 'phaser';
import { BUILD_SLOTS, buildingDef } from '@yarinlab/shared';
import { gameStore } from '../../state/gameStore';
import { cityOf } from '../../state/city';
import { isReducedMotion as reducedMotion, settingsStore } from '../../state/settingsStore';
import { textureOrigin } from '../art/isoArt';
import { GROUND_FRAMES, WATER_DROP } from '../tiles/mapManifest';
import { depthOf, diamond, HH, isWorldPointer, iso, placeIso, placeUpright, setupCameraControls, toTile } from './iso';

import { COAST_N, coastGround, PIER, STATION } from '../tiles/coast';
export { COAST_N, coastGround, PIER, STATION };

const CREATURE_ZONE = { x0: 12, x1: 22, y0: 8, y1: 22 };

export class CoastScene extends Phaser.Scene {
  private dragged = false;
  private ambient: Phaser.Tweens.Tween[] = [];
  private placed = new Map<string, { img: Phaser.GameObjects.Image; level: number }>();
  private marks = new Map<string, Phaser.GameObjects.Image>();
  private under?: Phaser.GameObjects.Graphics;
  private creatures: Phaser.GameObjects.Image[] = [];
  private litter: Phaser.GameObjects.Image[] = [];
  private grass: Phaser.GameObjects.Image[] = [];
  private station?: Phaser.GameObjects.Image;
  private glow?: Phaser.GameObjects.Graphics;

  constructor() {
    super('CoastScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x7fcbe0);
    this.drawGround();
    this.drawProps();
    this.glow = this.add.graphics().setDepth(4);
    this.under = this.add.graphics().setDepth(3).setVisible(false);
    this.drawUnderwater();
    const left = iso(0, COAST_N).x, right = iso(COAST_N, 0).x, bottom = iso(COAST_N, COAST_N).y;
    const clamp = setupCameraControls(this, {
      min: 0.6, max: 1.6, bounds: new Phaser.Geom.Rectangle(left - 200, -300, right - left + 400, bottom + 500),
      onDragChange: (d) => (this.dragged = d),
    });
    const c = iso(9, 9);
    this.cameras.main.setZoom(clamp(this.scale.width < 700 ? 0.65 : 0.9)).centerOn(c.x, c.y);
    this.cameras.main.fadeIn(reducedMotion() ? 0 : 260, 165, 221, 242);
    this.addPointer();
    this.sync();
    const unsub = gameStore.subscribe(() => this.sync());
    this.events.once('shutdown', unsub);
    const applyMotion = () => this.ambient.forEach((t) => (reducedMotion() ? t.pause() : t.resume()));
    applyMotion();
    this.events.once('shutdown', settingsStore.subscribe(applyMotion));
    // Şehre dönüş (kamera solması)
    const unsubView = gameStore.subscribe(() => {
      if (gameStore.get().mapView === 'world' && this.scene.isActive()) {
        const go = () => { this.scene.sleep(); this.scene.wake('WorldScene'); };
        if (reducedMotion()) go(); else { this.cameras.main.fadeOut(260, 165, 221, 242); this.cameras.main.once('camerafadeoutcomplete', go); }
      }
    });
    this.events.once('shutdown', unsubView);
    this.events.on('wake', () => { this.cameras.main.fadeIn(reducedMotion() ? 0 : 260, 165, 221, 242); this.scale.updateBounds(); });
  }

  private drawGround() {
    for (let y = 0; y < COAST_N; y++) {
      for (let x = 0; x < COAST_N; x++) {
        const g = coastGround(x, y);
        const p = iso(x, y);
        const def = g === 'grass' ? GROUND_FRAMES[1] : g === 'sand' ? GROUND_FRAMES[5] : GROUND_FRAMES[3];
        const img = this.add.image(p.x, p.y + (g === 'shallow' || g === 'deep' ? WATER_DROP : 0), def.atlas, def.frame).setOrigin(0.5, 0).setScale(1.015).setDepth(0);
        if (g === 'shallow') img.setTint(0xcff3f6);
        if (g === 'shallow' || g === 'deep') this.ambient.push(this.tweens.add({ targets: img, alpha: 0.88, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: ((x + y) % 9) * 180 }));
      }
    }
  }

  private drawProps() {
    this.station = placeIso(this, 'station', STATION.x, STATION.y);
    for (const [x, y] of PIER) placeIso(this, 'plank', x, y).setDepth(depthOf(x, y) - 30);
    for (const [x, y] of [[1, 12], [2, 13], [0, 14], [13, 0]] as const) placeIso(this, 'rock', x, y);
    for (const [x, y] of [[2, 1], [0, 4], [1, 7], [7, 1], [3, 8]] as const) placeUpright(this, (x + y) % 2 ? 'pine' : 'tree', x, y);
    for (const [x, y] of [[6, 10], [8, 8], [10, 6], [3, 13], [13, 3]] as const) placeUpright(this, 'reed', x, y);
    // koruma alanı şamandıraları (sığ-derin sınırı)
    for (const [x, y] of [[14, 6], [16, 8], [18, 10], [20, 12], [12, 8], [10, 10], [8, 12]] as const) {
      const c = iso(x + 0.5, y + 0.5);
      const b = this.add.image(c.x, c.y, 'buoy').setDepth(depthOf(x, y));
      this.ambient.push(this.tweens.add({ targets: b, y: c.y - 5, duration: 1300 + (x % 3) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    }
  }

  /** Su altı inceleme katmanı: yarı saydam kesit, canlılar, deniz çayırı ve atık (göstergelerden). */
  private drawUnderwater() {
    const g = this.under!;
    for (let y = 0; y < COAST_N; y++) for (let x = 0; x < COAST_N; x++) {
      const t = coastGround(x, y);
      if (t === 'deep' || t === 'shallow') g.fillStyle(t === 'deep' ? 0x0f3b57 : 0x1d6f86, 0.42).fillPoints(diamond(x, y), true);
    }
    const rnd = new Phaser.Math.RandomDataGenerator(['coast']);
    for (let k = 0; k < 16; k++) {
      const x = rnd.between(10, 20), y = rnd.between(16 - x + 2 > 0 ? 16 - x + 2 : 0, 20);
      if (coastGround(x, y) === 'grass' || coastGround(x, y) === 'sand') continue;
      const c = iso(x + 0.5, y + 0.5);
      this.grass.push(this.add.image(c.x, c.y, 'seagrass').setOrigin(0.5, 1).setDepth(4).setVisible(false));
    }
    for (let k = 0; k < 14; k++) {
      const x = rnd.between(CREATURE_ZONE.x0, CREATURE_ZONE.x1), y = rnd.between(CREATURE_ZONE.y0, CREATURE_ZONE.y1);
      const c = iso(x + 0.5, y + 0.5);
      this.litter.push(this.add.image(c.x, c.y, 'litter').setDepth(4).setVisible(false).setAngle(rnd.between(0, 90)));
    }
    const swim = (key: string, from: [number, number], to: [number, number], dur: number) => {
      const a = iso(...from), b = iso(...to);
      const img = this.add.image(a.x, a.y, key).setDepth(6).setVisible(false).setFlipX(b.x > a.x);
      this.ambient.push(this.tweens.add({ targets: img, x: b.x, y: b.y, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => img.setFlipX(!img.flipX) }));
      this.creatures.push(img);
    };
    swim('fish', [14, 10], [20, 8], 7000);
    swim('fish', [12, 16], [18, 18], 8000);
    swim('fish', [16, 12], [21, 14], 6000);
    swim('turtle', [11, 14], [17, 20], 14000);
    swim('fish', [18, 15], [13, 20], 9000);
  }

  private sync() {
    const st = gameStore.get();
    const city = cityOf(st);
    const ind = city.indicators;
    const underOn = st.mapLayer === 'under';
    this.under?.setVisible(underOn);
    // Canlılar her zaman biraz görünür (yüzeyde), su altı açıkken tam görünür.
    this.creatures.forEach((c, k) => c.setVisible(underOn || k < 2).setAlpha(underOn ? 1 : 0.55));
    const habitat = city.effective.habitatCare;
    this.grass.forEach((g, k) => g.setVisible(underOn && k < Math.round((habitat / 100) * this.grass.length) + 2));
    const litter = Math.round((ind.coastalRisk / 100) * this.litter.length);
    this.litter.forEach((l, k) => l.setVisible(k < litter));
    // Kıyı yapıları (sulak alan, atık tutucu)
    const coastSlots = BUILD_SLOTS.filter((s) => s.map === 'coast');
    const ids = new Set(st.sim.buildings.map((b) => b.id));
    for (const [id, v] of this.placed) if (!ids.has(id)) { v.img.destroy(); this.placed.delete(id); }
    for (const b of st.sim.buildings) {
      const s = coastSlots.find((x) => x.id === b.slot);
      const def = buildingDef(b.type);
      if (!s || !def) continue;
      const cur = this.placed.get(b.id);
      if (cur && cur.level === b.level) continue;
      cur?.img.destroy();
      const p = iso(s.x, s.y);
      const img = textureOrigin(this, def.sprite) ? placeIso(this, def.sprite, s.x, s.y) : this.add.image(p.x, p.y, def.sprite).setOrigin(0.5, 0.25).setDepth(depthOf(s.x, s.y));
      img.setScale(0.9 + b.level * 0.05);
      this.placed.set(b.id, { img, level: b.level });
    }
    const taken = new Set(st.sim.buildings.map((b) => b.slot));
    for (const s of coastSlots) {
      let m = this.marks.get(s.id);
      if (!m) { const p = iso(s.x, s.y); m = this.add.image(p.x, p.y, 'slot').setOrigin(0.5, 0).setDepth(2).setAlpha(0.85); this.marks.set(s.id, m); }
      m.setVisible(!taken.has(s.id));
    }
  }

  private addPointer() {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown || !isWorldPointer(this, p)) return;
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      const on = !!this.station?.getBounds().contains(w.x, w.y);
      this.glow?.clear();
      if (on) this.glow?.lineStyle(4, 0xf6c453, 0.9).strokePoints(diamond(STATION.x - 0.25, STATION.y - 0.25, STATION.fw + 0.5, STATION.fd + 0.5), true);
      this.input.setDefaultCursor(on ? 'pointer' : 'default');
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.dragged || !isWorldPointer(this, p)) return;
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      if (this.station?.getBounds().contains(w.x, w.y)) return gameStore.inspectTarget({ kind: 'zone', id: 'ocean' });
      const t = toTile(w.x, w.y);
      const slot = BUILD_SLOTS.find((s) => s.map === 'coast' && Math.floor(t.x) === s.x && Math.floor(t.y) === s.y);
      if (slot) {
        const b = gameStore.get().sim.buildings.find((x) => x.slot === slot.id);
        gameStore.inspectTarget(b ? { kind: 'building', id: b.id } : { kind: 'slot', id: slot.id });
      } else gameStore.inspectTarget(null);
    });
    void HH;
  }
}
