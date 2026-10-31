import Phaser from 'phaser';
import { ATLASES, MAP } from '../tiles/mapManifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }
  preload() {
    this.load.json(MAP.key, MAP.url);
    for (const a of ATLASES) this.load.atlasXML(a.key, a.png, a.xml);
  }
  create() {
    this.makeTreeTexture();
    this.makeCustomTextures();
    this.scene.start('WorldScene');
  }

  /** Kenney paketinde ağaç yok; aynı palette düz gölgeli izometrik ağaç üretilir (özel asset, team-owned). */
  private makeTreeTexture() {
    const g = this.add.graphics();
    g.fillStyle(0x12263a, 0.14).fillEllipse(30, 70, 40, 14); // yumuşak gölge
    g.fillStyle(0x8a6a4a, 1).fillRect(27, 40, 6, 28); // gövde
    g.fillStyle(0x23885a, 1).fillCircle(30, 32, 22); // koyu taç
    g.fillStyle(0x2e9e6b, 1).fillCircle(26, 28, 17); // ışık alan taraf
    g.fillStyle(0x4fbf86, 1).fillCircle(22, 22, 8);
    g.generateTexture('tree', 60, 80);
    g.destroy();
  }

  /**
   * Özel izometrik parçalar (ekip yapımı, `team-owned`): Kenney paketlerinde olmayan güneş paneli, batarya,
   * rüzgâr türbini, ayrıştırma kutusu ve ekin sırası. Aynı 2:1 elmas (132x66), palet ve yumuşak gölge dili.
   */
  private makeCustomTextures() {
    const W = 132, H = 66;
    const P = (u: number, v: number, oy = 0) => ({ x: W / 2 + (u - v) * (W / 2), y: (u + v) * (H / 2) + oy });
    const quad = (g: Phaser.GameObjects.Graphics, c: number, pts: { x: number; y: number }[], a = 1) =>
      g.fillStyle(c, a).fillPoints(pts.map((p) => new Phaser.Math.Vector2(p.x, p.y)), true);
    /** u,v ∈ [0,1] taban dikdörtgeninde, yüksekliği h olan izometrik kutu */
    const box = (g: Phaser.GameObjects.Graphics, u0: number, v0: number, u1: number, v1: number, h: number, top: number, oy = 0) => {
      const base = (u: number, v: number) => P(u, v, oy), up = (u: number, v: number) => P(u, v, oy - h);
      const dark = Phaser.Display.Color.ValueToColor(top).darken(28).color;
      const mid = Phaser.Display.Color.ValueToColor(top).darken(14).color;
      quad(g, mid, [base(u0, v1), base(u1, v1), up(u1, v1), up(u0, v1)]); // sol yüz
      quad(g, dark, [base(u1, v1), base(u1, v0), up(u1, v0), up(u1, v1)]); // sağ yüz
      quad(g, top, [up(u0, v0), up(u1, v0), up(u1, v1), up(u0, v1)]); // üst
    };
    const make = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.add.graphics();
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // yumuşak yer gölgesi (bina tabanı)
    make('shadow', W, H, (g) => {
      g.fillStyle(0x12263a, 0.2).fillEllipse(W / 2, H / 2, 112, 50);
    });

    // ekin sırası: kahverengi zemin üstünde yeşil şeritler
    make('crop', W, H, (g) => {
      for (const [a, b] of [[0.08, 0.22], [0.36, 0.5], [0.64, 0.78]]) {
        quad(g, 0x5f9f45, [P(0.06, a), P(0.94, a), P(0.94, b), P(0.06, b)]);
        quad(g, 0x7cc15a, [P(0.06, a), P(0.94, a), P(0.94, a + (b - a) * 0.4), P(0.06, a + (b - a) * 0.4)]);
      }
    });

    // güneş paneli: eğik mavi levha + ızgara
    make('solar', W, 78, (g) => {
      const oy = 22;
      quad(g, 0x12263a, [P(0.14, 0.16, oy + 8), P(0.9, 0.16, oy + 8), P(0.9, 0.9, oy + 8), P(0.14, 0.9, oy + 8)], 0.14); // gölge
      box(g, 0.1, 0.1, 0.9, 0.9, 7, 0x3b82c4, oy);
      g.lineStyle(2, 0xa9d4f5, 0.9);
      for (const t of [0.367, 0.633]) {
        const a = P(0.1 + 0.8 * t, 0.1, oy - 7), b = P(0.1 + 0.8 * t, 0.9, oy - 7);
        g.lineBetween(a.x, a.y, b.x, b.y);
        const c = P(0.1, 0.1 + 0.8 * t, oy - 7), d = P(0.9, 0.1 + 0.8 * t, oy - 7);
        g.lineBetween(c.x, c.y, d.x, d.y);
      }
    });

    // batarya: altın/yeşil kutu + terminal
    make('battery', W, 96, (g) => {
      const oy = 44;
      quad(g, 0x12263a, [P(0.2, 0.26, oy + 6), P(0.82, 0.26, oy + 6), P(0.82, 0.88, oy + 6), P(0.2, 0.88, oy + 6)], 0.14);
      box(g, 0.18, 0.18, 0.8, 0.8, 34, 0xe8b73a, oy);
      box(g, 0.4, 0.4, 0.58, 0.58, 8, 0x2e9e6b, oy - 34);
    });

    // rüzgâr türbini: yalnızca direk + göbek (kanatlar ayrı, döner)
    make('turbine', 84, 150, (g) => {
      g.fillStyle(0x12263a, 0.14).fillEllipse(42, 140, 44, 14);
      g.fillStyle(0xe9edf2, 1).fillTriangle(38, 140, 46, 140, 42, 40);
      g.fillStyle(0xc5ccd6, 1).fillTriangle(42, 140, 46, 140, 42, 40);
    });
    make('blades', 80, 80, (g) => {
      g.fillStyle(0xf7f5ef, 1);
      for (const ang of [-90, 30, 150]) {
        const r = Phaser.Math.DegToRad(ang), n = Phaser.Math.DegToRad(ang + 90), l = 34;
        g.fillTriangle(40, 40, 40 + Math.cos(r) * l + Math.cos(n) * 4, 40 + Math.sin(r) * l + Math.sin(n) * 4, 40 + Math.cos(r) * l - Math.cos(n) * 4, 40 + Math.sin(r) * l - Math.sin(n) * 4);
      }
      g.fillStyle(0x4aa8d8, 1).fillCircle(40, 40, 5);
    });

    // ayrıştırma kutuları: mavi (kâğıt), yeşil (cam), sarı (plastik); koyu kapaklı
    make('bin', W, 84, (g) => {
      const oy = 52;
      quad(g, 0x12263a, [P(0.1, 0.3, oy + 5), P(0.92, 0.3, oy + 5), P(0.92, 0.74, oy + 5), P(0.1, 0.74, oy + 5)], 0.14);
      [[0.1, 0.34, 0x4aa8d8], [0.38, 0.62, 0x2e9e6b], [0.66, 0.9, 0xe8b73a]].forEach(([a, b, c]) => {
        box(g, a as number, 0.34, b as number, 0.7, 30, c as number, oy);
        box(g, (a as number) - 0.01, 0.33, (b as number) + 0.01, 0.71, 4, 0x2b3f55, oy - 30); // kapak
      });
    });
  }
}
