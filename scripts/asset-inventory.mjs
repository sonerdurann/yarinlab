// docs/ASSET_INVENTORY.md dosyasını public/assets/manifest.json'dan üretir: node scripts/asset-inventory.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const m = JSON.parse(readFileSync(new URL('../apps/web/public/assets/manifest.json', import.meta.url), 'utf8'));
const cell = (v) => String(v ?? '—').replace(/\|/g, '/');
const anchor = (a) => (a ? (typeof a.x === 'number' ? `${a.x}, ${a.y}` : 'taban üst köşesi') : '—');
const groups = new Map();
for (const a of m.assets) {
  const g = a.category ?? (a.file ? 'kenney-atlas' : 'diger');
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push(a);
}
let out = `# Asset envanteri\n\nBu dosya \`apps/web/public/assets/manifest.json\` dosyasından üretilir (\`node scripts/asset-inventory.mjs\`). Toplam **${m.assets.length}** kayıt.\n\n`;
out += 'Lisanslar: `team-owned` = bu projede kodla üretildi (dosya yok, `generator` çalışma anında çizer). `CC0` = Kenney. Ayrıntı: `docs/licenses/licenses.md`.\n\n';
for (const [g, list] of groups) {
  out += `## ${g} (${list.length})\n\n| Kimlik | Açıklama | Taban (karo) | Pivot | Etkileşim | Kaynak | Lisans |\n|---|---|---|---|---|---|---|\n`;
  for (const a of list) out += `| \`${a.id}\` | ${cell(a.description)} | ${cell(a.tileFootprint?.join('×'))} | ${anchor(a.anchor)} | ${a.interactive ? 'evet' : 'hayır'} | ${cell(a.file ?? a.generator)} | ${cell(a.license)} |\n`;
  out += '\n';
}
writeFileSync(new URL('../docs/ASSET_INVENTORY.md', import.meta.url), out);
console.log('ASSET_INVENTORY.md yazıldı');
