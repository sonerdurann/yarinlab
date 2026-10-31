import Phaser from 'phaser';
import { MAP } from '../tiles/mapManifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }
  preload() {
    this.load.json(MAP.key, MAP.url);
  }
  create() {
    this.scene.start('WorldScene');
  }
}
