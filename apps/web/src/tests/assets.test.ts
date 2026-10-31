import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { BUILDINGS } from '@yarinlab/shared';
import manifest from '../../public/assets/manifest.json';

const pub = path.resolve(__dirname, '../../public');
const boot = readFileSync(path.resolve(__dirname, '../game/scenes/BootScene.ts'), 'utf8');

describe('asset manifesti (kılavuz §06)', () => {
  const ids = new Set(manifest.assets.map((a) => a.id));
  it('her kayıtta lisans ve kaynak var; dosyalı kayıtlar diskte mevcut', () => {
    for (const a of manifest.assets) {
      expect(a.license, a.id).toBeTruthy();
      expect(a.source, a.id).toBeTruthy();
      if (a.file) expect(existsSync(path.join(pub, a.file)), a.file).toBe(true);
      if ('licenseFile' in a && a.licenseFile) expect(existsSync(path.join(pub, a.licenseFile as string))).toBe(true);
    }
  });
  it('yapıların kullandığı her doku manifestte ve BootScene içinde üretiliyor', () => {
    for (const b of BUILDINGS) {
      if (b.sprite.startsWith('building:')) continue;
      expect(ids.has(b.sprite), b.sprite).toBe(true);
      expect(boot.includes(`'${b.sprite}'`), b.sprite).toBe(true);
    }
  });
  it('kodla üretilen her doku manifestte kayıtlı', () => {
    const generated = [...boot.matchAll(/make\('([a-z]+)'/g)].map((m) => m[1]);
    for (const k of generated) expect(ids.has(k), k).toBe(true);
  });
});
