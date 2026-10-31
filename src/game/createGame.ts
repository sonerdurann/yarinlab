import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';

export function createGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#eaf3f7',
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene: [BootScene, WorldScene],
  });
  // Yalnızca geliştirmede: tarayıcıdan kabul testi için sahne erişimi.
  if (import.meta.env.DEV) (window as unknown as { __yarinlab?: Phaser.Game }).__yarinlab = game;
  return game;
}
