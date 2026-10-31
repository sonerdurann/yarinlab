/** Uygulama içi kaynak ve lisans listesi (kılavuz §28, T10). docs/sources/SOURCES.md ile aynı içerik. */
export type SourceItem = { id: string; title: string; url: string; note?: string };

export const sources: SourceItem[] = [
  { id: 'K1', title: 'COP31 İklim Teknolojileri Creathonu Şartnamesi', url: 'https://mth.tc/cop31trcreathon' },
  { id: 'R5', title: 'Kenney License/Support (CC0, ticari kullanım)', url: 'https://kenney.nl/support' },
  { id: 'R7', title: 'Kenney Tilemaps Import Guide', url: 'https://kenney.nl/knowledge-base/game-assets-2d/importing-and-using-tilemaps' },
  { id: 'R8', title: 'Phaser Tilemap Editor Docs', url: 'https://docs.phaser.io/phaser-editor/scene-editor/game-objects/tilemap-object' },
  { id: 'R9', title: 'UNESCO Greening Curriculum', url: 'https://www.unesco.org/en/sustainable-development/education/greening-future/curriculum' },
  { id: 'R10', title: 'Create Phaser Game', url: 'https://phaser.io/tutorials/create-game-app' },
  { id: 'R11', title: 'UNEP Food Waste Index 2024', url: 'https://wedocs.unep.org/bitstream/handle/20.500.11822/45275/Food-Waste-Index-2024-key-messages.pdf', note: 'Küresel bağlam; ürünün kanıtlanmış etkisi olarak sunulmaz.' },
  { id: 'R12', title: 'Cloudflare Workers Secrets', url: 'https://developers.cloudflare.com/workers/configuration/environment-variables/' },
  { id: 'R13', title: 'Cloudflare Pages React', url: 'https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/' },
  { id: 'R14', title: 'Tiled Map Editor', url: 'https://www.mapeditor.org/' },
  { id: 'R15', title: 'Phaser 4 download (v4.2.1)', url: 'https://phaser.io/download' },
];

export type AssetLicense = { name: string; url: string; license: string; downloaded: string; used: boolean };

export const assetLicenses: AssetLicense[] = [
  { name: 'Kenney Isometric Tiles City', url: 'https://kenney.nl/assets/isometric-tiles-city', license: 'CC0', downloaded: '2026-10-31', used: false },
  { name: 'Kenney Isometric Tiles Buildings', url: 'https://kenney.nl/assets/isometric-tiles-buildings', license: 'CC0', downloaded: '2026-10-31', used: true },
  { name: 'Kenney Isometric Tiles Landscape', url: 'https://kenney.nl/assets/isometric-tiles-landscape', license: 'CC0', downloaded: '2026-10-31', used: true },
  { name: 'Kenney UI Pack', url: 'https://kenney.nl/assets/ui-pack', license: 'CC0', downloaded: '2026-10-31', used: false },
  { name: 'Ekip yapımı ağaç dokusu (BootScene)', url: '', license: 'team-owned', downloaded: '-', used: true },
];
