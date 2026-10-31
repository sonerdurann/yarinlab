# 011 · Sunucu, veri tabanı ve monorepo (31 Ekim 2026)
**Karar:** P0'daki yalnızca istemci + Cloudflare taslağı yerine npm workspaces monorepo: `apps/web` (Phaser+React), `apps/server` (Fastify+Prisma+PostgreSQL), `packages/shared` (simülasyon, içerik, AI doğrulama).
**Gerekçe:** Gerçek öğrenci hesapları, öğretmen yetkisi, sunucuya kayıt ve raporlar kalıcı veri ve sunucu tarafı yetki gerektirir. Kılavuz §14 “MVP yerel, sonrası güvenli veritabanı” yolunu öngörür.
**Etki:** Klasör yapısı (§15) `apps/web/src` altında korunur. Cloudflare Pages statik yayını misafir modu için mümkündür (DEPLOY.md).
