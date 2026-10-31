import { buildApp } from './app.js';
import { prisma } from './db.js';

const app = await buildApp({ logger: true });
await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
app.log.info({ ai: app.ai.providerName }, 'YarınLab sunucusu hazır');

// Düzgün kapanma: açık istekler biter, veri tabanı bağlantısı kapanır.
for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.once(sig, async () => {
    app.log.info({ sig }, 'kapanıyor');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
