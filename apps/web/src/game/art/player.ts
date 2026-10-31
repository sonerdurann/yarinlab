import Phaser from 'phaser';
import { HAIR_COLOR, OUTFIT, SKIN, type AvatarLook } from '../../state/profile';

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color;

/**
 * Oyuncu karakteri dokusu (haritada yürüyen avatar): karakter oluşturucudaki ten, saç, kıyafet ve aksesuar
 * seçimleriyle çizilir. İki kare: 0 = duruş, 1 = adım. Pivot ayak altı (0.5, 1).
 */
export function makePlayerTextures(scene: Phaser.Scene, look: AvatarLook) {
  const skin = hex(SKIN[look.skin]), hair = hex(HAIR_COLOR[look.hairColor]), outfit = hex(OUTFIT[look.outfit]);
  const ink = 0x243447;
  for (const step of [0, 1]) {
    const key = `player-${step}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const g = scene.add.graphics();
    g.fillStyle(ink, 0.18).fillEllipse(16, 55, 22, 7);
    // bacaklar (adımda açılır)
    g.fillStyle(ink, 1).fillRoundedRect(step ? 9 : 11, 40, 5, 14, 2).fillRoundedRect(step ? 18 : 16, 40, 5, 14, 2);
    // gövde + kollar
    g.fillStyle(outfit, 1).fillRoundedRect(8, 26, 16, 17, 6);
    g.fillStyle(Phaser.Display.Color.ValueToColor(outfit).darken(15).color, 1).fillRoundedRect(step ? 3 : 5, 28, 5, 12, 2).fillRoundedRect(step ? 24 : 22, 28, 5, 12, 2);
    g.fillStyle(skin, 1).fillCircle(step ? 5 : 7, 41, 2.6).fillCircle(step ? 27 : 25, 41, 2.6);
    // baş
    g.fillStyle(skin, 1).fillCircle(16, 17, 10);
    // saç (model bazlı basit silüet)
    g.fillStyle(hair, 1);
    if (look.hair === 3) for (const dx of [-7, -2, 3, 8]) g.fillCircle(16 + dx * 0.9, 9, 5);
    else g.slice(16, 15, 10.5, Math.PI, 0, false).fillPath();
    if (look.hair === 2) g.fillTriangle(25, 12, 31, 22, 24, 22);
    if (look.hair === 4) g.fillCircle(6, 22, 3).fillCircle(26, 22, 3);
    if (look.hair === 1) g.fillRect(6, 13, 3, 9).fillRect(23, 13, 3, 9);
    // yüz
    g.fillStyle(ink, 1).fillCircle(12.5, 18, 1.4).fillCircle(19.5, 18, 1.4);
    g.lineStyle(1.4, ink, 1).beginPath().arc(16, 20.5, 3, 0.2, Math.PI - 0.2).strokePath();
    if (look.acc === 'glasses') g.lineStyle(1.2, ink, 1).strokeCircle(12.5, 18, 2.8).strokeCircle(19.5, 18, 2.8);
    if (look.acc === 'cap') g.fillStyle(0xef795e, 1).fillRect(6, 6, 20, 5).fillRect(20, 9, 10, 3);
    if (look.acc === 'headband') g.fillStyle(0xf6c453, 1).fillRect(6, 9, 20, 3);
    g.generateTexture(key, 32, 60);
    g.destroy();
  }
}
