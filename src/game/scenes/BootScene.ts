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
}
