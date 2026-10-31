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
    this.scene.start('WorldScene');
  }
}
