// Kenney destek paketlerinden kopyalanan dosyaları asset manifestine ekler (kılavuz §06). Bash ve PowerShell betikleri kullanır.
import fs from 'node:fs';
const p = 'apps/web/public/assets/manifest.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));
const add = (id, file, source, licenseFile) => { if (!m.assets.some((a) => a.id === id)) m.assets.push({ id, file, source, license: 'CC0', licenseFile, interactive: false }); };
const sounds = 'apps/web/public/assets/kenney/sounds';
if (fs.existsSync(sounds)) for (const f of fs.readdirSync(sounds).filter((x) => x.endsWith('.ogg')))
  add('kenney-sound-' + f.replace('.ogg', ''), '/assets/kenney/sounds/' + f, 'https://kenney.nl/assets/interface-sounds', '/assets/kenney/sounds/License.txt');
if (fs.existsSync('apps/web/public/assets/kenney/vehicles/License.txt')) add('kenney-vehicles', '/assets/kenney/vehicles/License.txt', 'https://kenney.nl/assets/isometric-tiles-vehicles', '/assets/kenney/vehicles/License.txt');
if (fs.existsSync('apps/web/public/assets/kenney/icons/License.txt')) add('kenney-icons', '/assets/kenney/icons/License.txt', 'https://kenney.nl/assets/game-icons', '/assets/kenney/icons/License.txt');
fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n');
console.log('Manifest guncellendi: ' + m.assets.length + ' kayit');
