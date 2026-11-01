import Phaser from 'phaser';

/**
 * Yarın Şehri kod sanatı (ekip yapımı, `team-owned`): tek ışık yönü (sol üst), tek palet, 2:1 izometrik geometri.
 * Kenney zemin karoları (132x66) ile aynı ölçekte binalar, doğa parçaları ve durum rozetleri üretir.
 * Her doku `docs/ASSET_INVENTORY.md` ve `public/assets/manifest.json` içinde kayıtlıdır.
 */
export const PAL = {
  green: 0x26b887, deep: 0x176b58, teal: 0x41c9d1, sun: 0xf6c453, sky: 0xa5ddf2, cloud: 0xf5f8f4,
  ink: 0x243447, coral: 0xef795e, leaf: 0x4dbe78, cream: 0xf3ead7, stone: 0xd9dfe3, wood: 0x9a6b47, glass: 0x9ee3ea,
  roofRed: 0xd9644c, white: 0xffffff,
} as const;

export const TILE_W = 132;
export const TILE_H = 66;
const HW = TILE_W / 2;
const HH = TILE_H / 2;

type G = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };
const V = (p: Pt) => new Phaser.Math.Vector2(p.x, p.y);
export const shade = (c: number, pct: number) =>
  pct >= 0 ? Phaser.Display.Color.ValueToColor(c).lighten(pct).color : Phaser.Display.Color.ValueToColor(c).darken(-pct).color;

/** Doku üzerinde izometrik çizim alanı: taban (fw x fd karo), üst köşe (cx, oy). */
export class IsoCanvas {
  readonly w: number;
  readonly h: number;
  readonly cx: number;
  readonly oy: number;
  constructor(readonly g: G, readonly fw: number, readonly fd: number, height: number, pad = 8) {
    this.cx = fd * HW + pad;
    this.w = (fw + fd) * HW + pad * 2;
    this.oy = height + pad;
    this.h = this.oy + (fw + fd) * HH + pad * 2;
  }
  /** u: x ekseni (0..fw), v: y ekseni (0..fd), z: yükseklik (px) */
  P(u: number, v: number, z = 0): Pt {
    return { x: this.cx + (u - v) * HW, y: this.oy + (u + v) * HH - z };
  }
  poly(color: number, pts: Pt[], alpha = 1) {
    this.g.fillStyle(color, alpha).fillPoints(pts.map(V), true);
  }
  line(color: number, a: Pt, b: Pt, width = 2, alpha = 1) {
    this.g.lineStyle(width, color, alpha).lineBetween(a.x, a.y, b.x, b.y);
  }
  /** Zemin üstü yatay dörtgen */
  flat(color: number, u0: number, v0: number, u1: number, v1: number, z = 0, alpha = 1) {
    this.poly(color, [this.P(u0, v0, z), this.P(u1, v0, z), this.P(u1, v1, z), this.P(u0, v1, z)], alpha);
  }
  /** Kutu: sol yüz (v1) ışıkta, sağ yüz (u1) gölgede, üst en açık. */
  box(u0: number, v0: number, u1: number, v1: number, z0: number, z1: number, top: number, side?: number) {
    const s = side ?? top;
    this.poly(shade(s, -8), [this.P(u0, v1, z0), this.P(u1, v1, z0), this.P(u1, v1, z1), this.P(u0, v1, z1)]);
    this.poly(shade(s, -22), [this.P(u1, v1, z0), this.P(u1, v0, z0), this.P(u1, v0, z1), this.P(u1, v1, z1)]);
    this.flat(top, u0, v0, u1, v1, z1);
  }
  /** Sol yüzde (v = sabit) pencere/kapı */
  winL(color: number, v: number, u0: number, u1: number, z0: number, z1: number, alpha = 1) {
    this.poly(color, [this.P(u0, v, z0), this.P(u1, v, z0), this.P(u1, v, z1), this.P(u0, v, z1)], alpha);
  }
  /** Sağ yüzde (u = sabit) pencere */
  winR(color: number, u: number, v0: number, v1: number, z0: number, z1: number, alpha = 1) {
    this.poly(color, [this.P(u, v0, z0), this.P(u, v1, z0), this.P(u, v1, z1), this.P(u, v0, z1)], alpha);
  }
  /** Taban gölgesi (ışık sol üstten: gölge sağ alta düşer) */
  shadow(u1: number, v1: number, len = 0.35) {
    this.poly(PAL.ink, [this.P(u1, 0), this.P(u1 + len, len * 0.6), this.P(u1 + len, v1 + len), this.P(len * 0.6, v1 + len), this.P(0, v1)], 0.16);
  }
}

export function makeTexture(scene: Phaser.Scene, key: string, fw: number, fd: number, height: number, draw: (c: IsoCanvas) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.add.graphics();
  const c = new IsoCanvas(g, fw, fd, height);
  draw(c);
  g.generateTexture(key, c.w, c.h);
  g.destroy();
  /** Doku içindeki taban üst köşesi: origin olarak kullanılır */
  scene.registry.set(`origin:${key}`, { x: c.cx / c.w, y: c.oy / c.h, fw, fd });
}

/** Dokunun taban üst köşesi (origin) ve taban boyutu. */
export const textureOrigin = (scene: Phaser.Scene, key: string): { x: number; y: number; fw: number; fd: number } | undefined =>
  scene.registry.get(`origin:${key}`);

type Roof = 'flat' | 'gable' | 'green' | 'dome' | 'saw';
export type BuildingSpec = {
  fw: number; fd: number; floors: number; floorH?: number;
  wall: number; roof: Roof; roofColor: number;
  /** pencere rengi; 'lit' ise sarı ışıklı */
  windows?: number; door?: number; inset?: number;
  solar?: boolean; tank?: boolean; awning?: number; sign?: number; antenna?: boolean; flag?: boolean;
  extra?: (c: IsoCanvas, top: number, inset: number) => void;
};

/** Parametrik bina üretici: gövde, katlar, cephe pencereleri, kapı, çatı tipi, çatı ekleri, gölge. */
export function drawBuilding(c: IsoCanvas, s: BuildingSpec) {
  const fh = s.floorH ?? 30;
  const H = s.floors * fh;
  const i = s.inset ?? 0.12;
  const u0 = i, v0 = i, u1 = s.fw - i, v1 = s.fd - i;
  c.shadow(u1, v1);
  // kaide
  c.box(u0 - 0.04, v0 - 0.04, u1 + 0.04, v1 + 0.04, 0, 5, PAL.stone, shade(PAL.stone, -6));
  c.box(u0, v0, u1, v1, 5, H, shade(s.wall, 6), s.wall);
  // kat çizgileri
  for (let f = 1; f < s.floors; f++) {
    c.line(shade(s.wall, -30), c.P(u0, v1, f * fh), c.P(u1, v1, f * fh), 2, 0.5);
    c.line(shade(s.wall, -40), c.P(u1, v1, f * fh), c.P(u1, v0, f * fh), 2, 0.5);
  }
  // pencereler: her karo genişliğinde iki pencere
  if (s.windows !== undefined) {
    const w = s.windows;
    const segL = Math.max(1, Math.round((u1 - u0) * 2)), segR = Math.max(1, Math.round((v1 - v0) * 2));
    for (let f = 0; f < s.floors; f++) {
      const z0 = f * fh + 10, z1 = f * fh + fh - 7;
      for (let k = 0; k < segL; k++) {
        const a = u0 + ((u1 - u0) * k) / segL, b = u0 + ((u1 - u0) * (k + 1)) / segL;
        if (f === 0 && s.door !== undefined && k === Math.floor(segL / 2)) continue;
        c.winL(shade(w, -10), v1, a + 0.08, b - 0.08, z0, z1);
        c.winL(shade(w, 25), v1, a + 0.08, b - 0.08, z1 - 4, z1, 0.8);
      }
      for (let k = 0; k < segR; k++) {
        const a = v0 + ((v1 - v0) * k) / segR, b = v0 + ((v1 - v0) * (k + 1)) / segR;
        c.winR(shade(w, -30), u1, a + 0.08, b - 0.08, z0, z1);
      }
    }
  }
  if (s.door !== undefined) {
    const segL = Math.max(1, Math.round((u1 - u0) * 2));
    const k = Math.floor(segL / 2);
    const a = u0 + ((u1 - u0) * k) / segL, b = u0 + ((u1 - u0) * (k + 1)) / segL;
    c.winL(s.door, v1, a + 0.06, b - 0.06, 5, Math.min(fh - 2, 26));
    c.winL(shade(s.door, 30), v1, a + 0.06, b - 0.06, Math.min(fh - 2, 26) - 3, Math.min(fh - 2, 26));
  }
  if (s.awning !== undefined) {
    const z = Math.min(fh, 30);
    c.poly(s.awning, [c.P(u0, v1, z + 4), c.P(u1, v1, z + 4), c.P(u1, v1 + 0.25, z - 6), c.P(u0, v1 + 0.25, z - 6)]);
    for (let k = 0; k < 6; k++) {
      const a = u0 + ((u1 - u0) * k) / 6, b = u0 + ((u1 - u0) * (k + 0.5)) / 6;
      c.poly(PAL.white, [c.P(a, v1, z + 4), c.P(b, v1, z + 4), c.P(b, v1 + 0.25, z - 6), c.P(a, v1 + 0.25, z - 6)], 0.85);
    }
  }
  // çatı
  const rc = s.roofColor;
  if (s.roof === 'gable') {
    const rh = 18 + Math.min(s.fd, 2) * 8, m = (v0 + v1) / 2, o = 0.08;
    c.poly(shade(rc, -14), [c.P(u0 - o, v0 - o, H), c.P(u1 + o, v0 - o, H), c.P(u1 + o, m, H + rh), c.P(u0 - o, m, H + rh)]);
    c.poly(rc, [c.P(u0 - o, v1 + o, H - 2), c.P(u1 + o, v1 + o, H - 2), c.P(u1 + o, m, H + rh), c.P(u0 - o, m, H + rh)]);
    c.poly(shade(s.wall, -20), [c.P(u1, v0, H), c.P(u1, v1, H), c.P(u1, m, H + rh - 2)]);
    c.line(shade(rc, 25), c.P(u0 - o, m, H + rh), c.P(u1 + o, m, H + rh), 3);
  } else if (s.roof === 'saw') {
    const n = Math.max(2, Math.round((u1 - u0) * 2));
    for (let k = 0; k < n; k++) {
      const a = u0 + ((u1 - u0) * k) / n, b = u0 + ((u1 - u0) * (k + 1)) / n;
      c.poly(shade(rc, -10), [c.P(a, v1, H), c.P(a, v0, H), c.P(b, v0, H + 16), c.P(b, v1, H + 16)]);
      c.poly(PAL.glass, [c.P(b, v1, H), c.P(b, v0, H), c.P(b, v0, H + 16), c.P(b, v1, H + 16)], 0.9);
    }
  } else {
    // düz çatı + parapet
    c.box(u0, v0, u1, v1, H, H + 5, shade(s.wall, 12), shade(s.wall, -4));
    c.flat(s.roof === 'green' ? PAL.leaf : shade(rc, 0), u0 + 0.08, v0 + 0.08, u1 - 0.08, v1 - 0.08, H + 5);
    if (s.roof === 'green') {
      for (let k = 0; k < 7; k++) {
        const p = c.P(u0 + 0.2 + ((k * 0.37) % (u1 - u0 - 0.3)), v0 + 0.2 + ((k * 0.53) % (v1 - v0 - 0.3)), H + 8);
        c.g.fillStyle(k % 2 ? PAL.green : shade(PAL.leaf, 15), 1).fillCircle(p.x, p.y, 6);
      }
    }
    if (s.roof === 'dome') {
      const p = c.P((u0 + u1) / 2, (v0 + v1) / 2, H + 5);
      const r = Math.min(u1 - u0, v1 - v0) * HW * 0.42;
      c.g.fillStyle(shade(rc, -15), 1).fillEllipse(p.x, p.y, r * 2, r);
      c.g.fillStyle(rc, 1).slice(p.x, p.y, r, Math.PI, 0, false).fillPath();
      c.g.fillStyle(shade(rc, 25), 0.8).fillCircle(p.x - r * 0.35, p.y - r * 0.5, r * 0.22);
    }
  }
  const roofZ = s.roof === 'gable' ? H : H + 5;
  if (s.solar) {
    const n = Math.max(2, Math.round((u1 - u0) * 2));
    for (let k = 0; k < n; k++) {
      const a = u0 + 0.12 + ((u1 - u0 - 0.24) * k) / n, b = a + (u1 - u0 - 0.24) / n - 0.05;
      const vA = s.roof === 'gable' ? (v0 + v1) / 2 + 0.06 : v0 + 0.15, vB = s.roof === 'gable' ? v1 - 0.02 : v1 - 0.15;
      const zA = s.roof === 'gable' ? roofZ + 18 + Math.min(s.fd, 2) * 8 - 5 : roofZ + 9, zB = s.roof === 'gable' ? roofZ + 2 : roofZ + 3;
      c.poly(0x2f5f9e, [c.P(a, vA, zA), c.P(b, vA, zA), c.P(b, vB, zB), c.P(a, vB, zB)]);
      c.line(PAL.sky, c.P((a + b) / 2, vA, zA), c.P((a + b) / 2, vB, zB), 1, 0.8);
    }
  }
  if (s.tank) {
    const p = c.P(u1 + 0.02, v1 - 0.25, 0);
    c.g.fillStyle(shade(PAL.teal, -25), 1).fillRect(p.x - 9, p.y - 34, 18, 34);
    c.g.fillStyle(PAL.teal, 1).fillRect(p.x - 9, p.y - 34, 10, 34);
    c.g.fillStyle(shade(PAL.teal, 20), 1).fillEllipse(p.x, p.y - 34, 18, 8);
    c.g.fillStyle(PAL.sky, 1).fillRect(p.x - 6, p.y - 22, 3, 14);
  }
  if (s.antenna) {
    const p = c.P(u1 - 0.3, v0 + 0.3, roofZ + 5);
    c.line(PAL.ink, p, { x: p.x, y: p.y - 34 }, 3);
    c.g.fillStyle(PAL.coral, 1).fillCircle(p.x, p.y - 36, 4);
    c.g.lineStyle(2, PAL.teal, 0.9).strokeCircle(p.x, p.y - 22, 8);
  }
  if (s.flag) {
    const p = c.P(u0 + 0.15, v1 + 0.35, 0);
    c.line(PAL.ink, p, { x: p.x, y: p.y - H - 46 }, 3);
    c.poly(PAL.coral, [{ x: p.x, y: p.y - H - 46 }, { x: p.x + 26, y: p.y - H - 40 }, { x: p.x, y: p.y - H - 32 }]);
  }
  if (s.sign !== undefined) {
    const p = c.P((u0 + u1) / 2, v1, H - 4);
    c.g.fillStyle(s.sign, 1).fillRoundedRect(p.x - 20, p.y - 12, 40, 14, 5);
    c.g.fillStyle(PAL.white, 1).fillCircle(p.x - 10, p.y - 5, 3).fillCircle(p.x, p.y - 5, 3).fillCircle(p.x + 10, p.y - 5, 3);
  }
  s.extra?.(c, roofZ, i);
}

/** Bina, gölge ve doğa dokularının tamamını üretir (BootScene). */
export function generateArt(scene: Phaser.Scene) {
  /** Doku yüksekliği: gövde + çatı + ekler (boş üst pay bırakmaz; rozetler binanın hemen üstünde durur). */
  const headroom = (s: BuildingSpec) => (s.roof === 'gable' ? 22 + Math.min(s.fd, 2) * 8 : s.roof === 'dome' ? Math.min(s.fw, s.fd) * 30 : s.roof === 'saw' ? 20 : 10)
    + (s.antenna ? 44 : 0) + (s.flag ? 0 : 0);
  const B = (key: string, s: BuildingSpec, height?: number) => {
    const body = s.floors * (s.floorH ?? 30);
    const h = height ?? Math.max(body + headroom(s), s.flag ? body + 50 : 0, s.tank ? 40 : 0);
    makeTexture(scene, key, s.fw, s.fd, h, (c) => drawBuilding(c, s));
  };

  // ---- Okul kampüsü: 4 seviye (prompt §3). Seviye görselleri simülasyon etkileriyle aynıdır.
  const campus = (lvl: number): BuildingSpec => ({
    fw: 3, fd: 2, floors: 2, floorH: 32, wall: PAL.cream, roof: lvl >= 4 ? 'green' : 'gable', roofColor: PAL.coral,
    windows: PAL.glass, door: PAL.deep, flag: true, solar: lvl >= 3, tank: lvl >= 2, antenna: lvl >= 4,
    extra: (c) => {
      if (lvl >= 2) {
        // okul bahçesi: önde yeşil yatak ve çiçekler
        c.flat(PAL.wood, 0.2, 2.05, 1.4, 2.45, 0);
        c.flat(PAL.leaf, 0.25, 2.1, 1.35, 2.4, 3);
        for (let k = 0; k < 5; k++) { const p = c.P(0.35 + k * 0.22, 2.25, 6); c.g.fillStyle(k % 2 ? PAL.sun : PAL.coral, 1).fillCircle(p.x, p.y, 3); }
      }
      if (lvl >= 4) {
        // iklim laboratuvarı kubbesi (sağ kanat üstü)
        const p = c.P(2.3, 0.6, 78);
        c.g.fillStyle(shade(PAL.teal, -15), 1).fillEllipse(p.x, p.y, 44, 20);
        c.g.fillStyle(PAL.glass, 0.95).slice(p.x, p.y, 22, Math.PI, 0, false).fillPath();
        c.g.lineStyle(2, PAL.white, 0.7).strokeEllipse(p.x, p.y - 8, 26, 10);
      }
    },
  });
  for (let l = 1; l <= 4; l++) B(`campus-${l}`, campus(l), 118);

  B('canteen', { fw: 2, fd: 2, floors: 1, floorH: 40, wall: PAL.sun, roof: 'flat', roofColor: shade(PAL.sun, -20), windows: PAL.glass, door: PAL.deep, awning: PAL.coral, sign: PAL.green });
  B('monitor', { fw: 2, fd: 2, floors: 2, floorH: 34, wall: PAL.white, roof: 'flat', roofColor: PAL.stone, windows: PAL.teal, door: PAL.deep, solar: true, antenna: true });
  B('townhall', { fw: 2, fd: 2, floors: 3, floorH: 30, wall: 0xe9e2d0, roof: 'dome', roofColor: PAL.teal, windows: PAL.glass, door: PAL.deep, flag: true });
  B('barn', { fw: 2, fd: 2, floors: 1, floorH: 46, wall: PAL.coral, roof: 'gable', roofColor: PAL.ink, door: PAL.white, windows: PAL.cream });
  B('recycle', { fw: 2, fd: 2, floors: 1, floorH: 42, wall: PAL.leaf, roof: 'saw', roofColor: PAL.deep, windows: PAL.glass, door: PAL.ink, sign: PAL.deep });
  // Kıyı kapısı: deniz feneri (kıyı haritasına geçiş)
  makeTexture(scene, 'lighthouse', 1, 1, 170, (c) => {
    c.shadow(0.9, 0.9, 0.5);
    c.box(0.1, 0.1, 0.9, 0.9, 0, 8, PAL.stone);
    const p = c.P(0.5, 0.5, 8);
    for (let k = 0; k < 5; k++) {
      c.g.fillStyle(k % 2 ? PAL.coral : PAL.white, 1).fillRect(p.x - 14 + k, p.y - (k + 1) * 24, 28 - 2 * k, 24);
      c.g.fillStyle(PAL.ink, 0.12).fillRect(p.x + 4, p.y - (k + 1) * 24, 10 - k, 24);
    }
    c.g.fillStyle(PAL.sun, 1).fillRect(p.x - 10, p.y - 140, 20, 16);
    c.g.fillStyle(PAL.ink, 1).fillTriangle(p.x - 14, p.y - 140, p.x + 14, p.y - 140, p.x, p.y - 156);
  });
  B('station', { fw: 2, fd: 2, floors: 1, floorH: 36, wall: PAL.white, roof: 'flat', roofColor: PAL.teal, windows: PAL.teal, door: PAL.deep, antenna: true, solar: true,
    extra: (c) => { for (const [u, v] of [[0.2, 1.9], [1.9, 1.9], [1.9, 0.2]]) { const a = c.P(u, v, 0); c.line(PAL.wood, a, { x: a.x, y: a.y + 12 }, 4); } } });

  // ---- İnşa edilen yapılar (1 karo)
  B('annex', { fw: 1, fd: 1, floors: 1, floorH: 34, wall: PAL.white, roof: 'flat', roofColor: PAL.stone, windows: PAL.sun, door: PAL.deep });
  B('lab', { fw: 1, fd: 1, floors: 2, floorH: 26, wall: PAL.white, roof: 'dome', roofColor: PAL.teal, windows: PAL.glass, door: PAL.deep });
  B('repairshop', { fw: 1, fd: 1, floors: 1, floorH: 36, wall: PAL.sun, roof: 'gable', roofColor: PAL.deep, windows: PAL.glass, door: PAL.ink, sign: PAL.coral });
  B('waterplant', { fw: 1, fd: 1, floors: 1, floorH: 28, wall: PAL.stone, roof: 'flat', roofColor: PAL.teal, windows: PAL.teal, tank: true });
  makeTexture(scene, 'busstop', 1, 1, 70, (c) => {
    c.shadow(0.9, 0.9);
    c.flat(PAL.stone, 0.05, 0.05, 0.95, 0.95, 0);
    for (const [u, v] of [[0.2, 0.3], [0.8, 0.3]]) c.box(u - 0.03, v - 0.03, u + 0.03, v + 0.03, 0, 40, PAL.ink);
    c.winL(PAL.glass, 0.33, 0.2, 0.8, 4, 38, 0.6);
    c.box(0.12, 0.15, 0.88, 0.5, 40, 45, PAL.deep);
    c.box(0.3, 0.6, 0.7, 0.75, 0, 9, PAL.wood);
    const s = c.P(0.9, 0.9, 0);
    c.line(PAL.ink, s, { x: s.x, y: s.y - 46 }, 3);
    c.g.fillStyle(PAL.green, 1).fillCircle(s.x, s.y - 50, 9);
    // elektrikli otobüs
    c.box(0.15, 0.7, 0.95, 1.0, 6, 26, PAL.green, PAL.green);
    c.winL(PAL.glass, 1.0, 0.2, 0.9, 14, 23);
  });

  // ---- Konutlar ve dükkânlar (dekor; çeşitlilik için varyantlar)
  const houseWalls = [PAL.cream, 0xf2d6c5, 0xd9eef0];
  const houseRoofs = [PAL.coral, PAL.deep, PAL.ink];
  houseWalls.forEach((w, k) => B(`house-${k}`, { fw: 1, fd: 1, floors: k === 1 ? 2 : 1, floorH: 30, wall: w, roof: 'gable', roofColor: houseRoofs[k], windows: PAL.glass, door: PAL.wood, solar: k === 2 }));
  [PAL.coral, PAL.teal, PAL.sun].forEach((a, k) => B(`shop-${k}`, { fw: 1, fd: 1, floors: 1, floorH: 34, wall: k === 2 ? PAL.white : PAL.cream, roof: 'flat', roofColor: PAL.stone, windows: PAL.glass, door: PAL.ink, awning: a }));
  [0xdfe6ea, PAL.cream, 0xe8f3ee].forEach((w, k) => B(`apartment-${k}`, { fw: 1, fd: 1, floors: 4, floorH: 26, wall: w, roof: k === 0 ? 'green' : 'flat', roofColor: PAL.stone, windows: PAL.glass, solar: k === 1 }));
  B('silo', { fw: 1, fd: 1, floors: 1, floorH: 10, wall: PAL.stone, roof: 'flat', roofColor: PAL.stone,
    extra: (c) => { const p = c.P(0.5, 0.5, 0); c.g.fillStyle(shade(PAL.stone, -20), 1).fillRect(p.x - 18, p.y - 80, 36, 76); c.g.fillStyle(PAL.white, 1).fillRect(p.x - 18, p.y - 80, 18, 76); c.g.fillStyle(PAL.coral, 1).slice(p.x, p.y - 80, 18, Math.PI, 0, false).fillPath(); } });

  // ---- Doğa: ağaç, çam, meyve ağacı, çalı, çiçek, kaya, bank, lamba, saha
  const tree = (key: string, crown: number, light: number, fruit = false) => {
    const g = scene.add.graphics();
    g.fillStyle(PAL.ink, 0.16).fillEllipse(36, 82, 46, 14);
    g.fillStyle(PAL.wood, 1).fillRect(33, 48, 7, 34);
    g.fillStyle(shade(crown, -18), 1).fillCircle(37, 40, 24);
    g.fillStyle(crown, 1).fillCircle(32, 34, 20);
    g.fillStyle(light, 1).fillCircle(26, 26, 9);
    if (fruit) for (const [x, y] of [[24, 40], [40, 30], [44, 46], [32, 50], [30, 22]]) g.fillStyle(PAL.coral, 1).fillCircle(x, y, 3.5);
    g.generateTexture(key, 72, 90);
    g.destroy();
  };
  tree('tree', PAL.green, shade(PAL.leaf, 25));
  tree('tree-b', PAL.leaf, shade(PAL.leaf, 35));
  tree('fruit', PAL.green, shade(PAL.leaf, 30), true);
  {
    const g = scene.add.graphics();
    g.fillStyle(PAL.ink, 0.16).fillEllipse(30, 92, 40, 12);
    g.fillStyle(PAL.wood, 1).fillRect(27, 76, 6, 16);
    for (let k = 0; k < 3; k++) g.fillStyle(shade(PAL.deep, k * 10), 1).fillTriangle(30, 8 + k * 20, 6 + k * 2, 50 + k * 14, 54 - k * 2, 50 + k * 14);
    g.generateTexture('pine', 60, 100);
    g.destroy();
  }
  makeTexture(scene, 'bush', 1, 1, 20, (c) => {
    for (const [u, v, r, col] of [[0.4, 0.45, 13, PAL.green], [0.6, 0.55, 11, PAL.leaf], [0.45, 0.65, 9, shade(PAL.leaf, 15)]] as const) {
      const p = c.P(u, v, 8); c.g.fillStyle(col, 1).fillCircle(p.x, p.y, r);
    }
  });
  makeTexture(scene, 'flowers', 1, 1, 12, (c) => {
    c.flat(shade(PAL.leaf, -5), 0.2, 0.2, 0.8, 0.8, 0, 0.9);
    for (let k = 0; k < 9; k++) { const p = c.P(0.28 + (k % 3) * 0.22, 0.28 + Math.floor(k / 3) * 0.22, 4); c.g.fillStyle([PAL.coral, PAL.sun, PAL.white][k % 3], 1).fillCircle(p.x, p.y, 4); }
  });
  makeTexture(scene, 'rock', 1, 1, 26, (c) => {
    const p = c.P(0.5, 0.5, 0);
    c.g.fillStyle(PAL.ink, 0.15).fillEllipse(p.x + 6, p.y + 4, 50, 16);
    c.g.fillStyle(0x9aa7b0, 1).fillEllipse(p.x, p.y - 8, 44, 26);
    c.g.fillStyle(0xc4ccd2, 1).fillEllipse(p.x - 6, p.y - 13, 24, 12);
  });
  makeTexture(scene, 'bench', 1, 1, 24, (c) => {
    c.box(0.3, 0.45, 0.75, 0.6, 8, 11, PAL.wood);
    c.box(0.3, 0.38, 0.75, 0.43, 11, 22, shade(PAL.wood, -10));
    for (const u of [0.33, 0.72]) c.box(u - 0.02, 0.48, u + 0.02, 0.57, 0, 8, PAL.ink);
  });
  makeTexture(scene, 'lamp', 1, 1, 70, (c) => {
    const p = c.P(0.5, 0.5, 0);
    c.line(PAL.ink, p, { x: p.x, y: p.y - 60 }, 3);
    c.g.fillStyle(PAL.sun, 1).fillCircle(p.x, p.y - 62, 6);
    c.g.fillStyle(PAL.sun, 0.25).fillCircle(p.x, p.y - 62, 12);
  });
  makeTexture(scene, 'pylon', 1, 1, 110, (c) => {
    const p = c.P(0.5, 0.5, 0);
    c.g.lineStyle(3, 0x7d8a96, 1).lineBetween(p.x - 14, p.y, p.x, p.y - 100).lineBetween(p.x + 14, p.y, p.x, p.y - 100)
      .lineBetween(p.x - 24, p.y - 70, p.x + 24, p.y - 70).lineBetween(p.x - 18, p.y - 50, p.x + 18, p.y - 50).lineBetween(p.x - 9, p.y - 30, p.x + 9, p.y - 60);
  });
  makeTexture(scene, 'court', 2, 2, 8, (c) => {
    c.flat(PAL.green, 0.1, 0.1, 1.9, 1.9, 1);
    c.g.lineStyle(2, PAL.white, 0.9).strokePoints([c.P(0.2, 0.2, 2), c.P(1.8, 0.2, 2), c.P(1.8, 1.8, 2), c.P(0.2, 1.8, 2)].map(V), true);
    c.line(PAL.white, c.P(1, 0.2, 2), c.P(1, 1.8, 2), 2, 0.9);
    const m = c.P(1, 1, 2);
    c.g.lineStyle(2, PAL.white, 0.9).strokeEllipse(m.x, m.y, 50, 25);
  });

  // ---- Durum rozetleri ve efektler
  const icon = (key: string, draw: (g: G) => void, w = 44, h = 52) => { const g = scene.add.graphics(); draw(g); g.generateTexture(key, w, h); g.destroy(); };
  icon('badge-up', (g) => {
    g.fillStyle(PAL.ink, 0.2).fillCircle(23, 25, 19);
    g.fillStyle(PAL.green, 1).fillCircle(22, 22, 19);
    g.lineStyle(3, PAL.white, 1).strokeCircle(22, 22, 19);
    g.fillStyle(PAL.white, 1).fillTriangle(22, 9, 33, 22, 11, 22).fillRect(17, 21, 10, 12);
  });
  icon('badge-warn', (g) => {
    g.fillStyle(PAL.ink, 0.2).fillRoundedRect(4, 6, 38, 34, 12);
    g.fillStyle(PAL.white, 1).fillRoundedRect(2, 2, 38, 34, 12).fillTriangle(14, 34, 26, 34, 20, 46);
    g.lineStyle(3, PAL.coral, 1).strokeRoundedRect(2, 2, 38, 34, 12);
    g.fillStyle(PAL.coral, 1).fillRect(18, 9, 5, 15).fillCircle(20.5, 29, 3);
  });
  icon('scaffold', (g) => {
    g.lineStyle(3, PAL.sun, 1);
    for (let x = 6; x <= 90; x += 28) g.lineBetween(x, 10, x, 110);
    for (let y = 20; y <= 110; y += 30) g.lineBetween(4, y, 92, y);
    g.lineStyle(2, PAL.wood, 1).lineBetween(6, 110, 90, 20);
  }, 96, 116);
  icon('dust', (g) => { g.fillStyle(0xe8e1d4, 0.9).fillCircle(10, 10, 9); g.fillStyle(PAL.white, 0.7).fillCircle(7, 7, 4); }, 20, 20);
  icon('spark', (g) => { g.fillStyle(PAL.sun, 1).fillTriangle(10, 0, 13, 10, 7, 10).fillTriangle(10, 20, 13, 10, 7, 10).fillTriangle(0, 10, 10, 7, 10, 13).fillTriangle(20, 10, 10, 7, 10, 13); }, 20, 20);
  icon('bird', (g) => { g.lineStyle(3, PAL.ink, 0.8).beginPath().arc(8, 10, 7, Math.PI * 1.1, Math.PI * 1.9).strokePath().beginPath().arc(22, 10, 7, Math.PI * 1.1, Math.PI * 1.9).strokePath(); }, 30, 14);
  icon('student', (g) => {
    g.fillStyle(PAL.ink, 0.18).fillEllipse(9, 33, 14, 5);
    g.fillStyle(PAL.ink, 1).fillRect(5, 22, 3, 10).fillRect(10, 22, 3, 10);
    g.fillStyle(PAL.white, 1).fillRoundedRect(3, 11, 12, 13, 4);
    g.fillStyle(0xe0ac7e, 1).fillCircle(9, 7, 5);
    g.fillStyle(PAL.ink, 1).fillRect(4, 2, 10, 4);
  }, 18, 36);

  // ---- Kıyı: iskele tahtası, şamandıra, balık, kaplumbağa, deniz çayırı, saz
  makeTexture(scene, 'plank', 1, 1, 10, (c) => {
    for (const [u, v] of [[0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]]) { const a = c.P(u, v, 0); c.line(shade(PAL.wood, -30), a, { x: a.x, y: a.y + 14 }, 4); }
    c.box(0.05, 0.1, 0.95, 0.9, 0, 6, PAL.wood);
    for (let k = 1; k < 5; k++) c.line(shade(PAL.wood, -25), c.P(k * 0.19 + 0.05, 0.1, 6), c.P(k * 0.19 + 0.05, 0.9, 6), 1.5, 0.8);
  });
  icon('buoy', (g) => { g.fillStyle(PAL.white, 1).fillEllipse(12, 20, 20, 10); g.fillStyle(PAL.coral, 1).fillRect(7, 6, 10, 14); g.fillStyle(PAL.sun, 1).fillCircle(12, 5, 4); }, 24, 26);
  icon('fish', (g) => { g.fillStyle(PAL.sun, 1).fillEllipse(14, 8, 22, 11).fillTriangle(24, 8, 32, 2, 32, 14); g.fillStyle(PAL.ink, 1).fillCircle(8, 7, 1.6); }, 34, 16);
  icon('turtle', (g) => {
    g.fillStyle(shade(PAL.leaf, -10), 1).fillEllipse(8, 8, 8, 5).fillEllipse(8, 22, 8, 5).fillEllipse(30, 8, 8, 5).fillEllipse(30, 22, 8, 5).fillCircle(37, 15, 5);
    g.fillStyle(PAL.deep, 1).fillEllipse(19, 15, 28, 20); g.fillStyle(PAL.green, 1).fillEllipse(19, 15, 18, 12);
  }, 44, 30);
  icon('seagrass', (g) => { g.lineStyle(3, PAL.leaf, 0.9); for (let k = 0; k < 5; k++) g.beginPath().moveTo(6 + k * 6, 40).lineTo(4 + k * 6 + (k % 2) * 6, 10 + (k % 3) * 6).strokePath(); }, 40, 42);
  icon('litter', (g) => { g.fillStyle(PAL.white, 0.9).fillRect(2, 4, 10, 6); g.fillStyle(PAL.coral, 0.9).fillCircle(18, 8, 4); }, 24, 14);
  icon('reed', (g) => { g.lineStyle(2, 0x7a9b4a, 1); for (let k = 0; k < 6; k++) g.lineBetween(4 + k * 4, 30, 2 + k * 5, 4 + (k % 3) * 4); g.fillStyle(PAL.wood, 1).fillRect(9, 3, 3, 8).fillRect(19, 6, 3, 8); }, 32, 32);
  icon('boat', (g) => {
    g.fillStyle(PAL.ink, 0.18).fillEllipse(34, 44, 56, 10);
    g.fillStyle(PAL.coral, 1).fillTriangle(6, 30, 62, 30, 52, 42).fillTriangle(6, 30, 16, 42, 52, 42);
    g.fillStyle(PAL.white, 1).fillRect(10, 26, 50, 5);
    g.fillStyle(PAL.cloud, 1).fillRect(26, 14, 16, 12);
    g.fillStyle(PAL.teal, 1).fillRect(29, 17, 10, 5);
    g.lineStyle(2, PAL.ink, 1).lineBetween(46, 26, 46, 4);
  }, 68, 50);
}
