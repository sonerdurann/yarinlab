# 001 – Teknoloji yığını ve kapsam kilidi (2026-10-31)

**Karar:** Phaser 4.2.1 (tam sürüm pin) + React + TypeScript + Vite; Tiled JSON harita; Kenney Isometric Tiles ailesi; önce yerel senaryolar, sonra güvenli sunucu üzerinden AI. P0 kapsamı dondurulur (1 derin kantin görevi).
**Gerekçe:** Kılavuz §01, §14, §26. Phaser 4.2.1 npm `latest`. React HUD erişilebilir form/metin için; Phaser görsel dünya için.
**Etki:** React ↔ Phaser iletişimi EventBus değil ortak store adapter. AI olmadan oyun bitebilir (fail-open).
**Geri çekilme:** Tiled uyumsuzsa sabit sprite tabanlı harita.
