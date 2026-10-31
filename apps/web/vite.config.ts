import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001', '/healthz': 'http://localhost:3001' } },
  build: {
    chunkSizeWarningLimit: 1500,
    // Phaser ayrı parça: arayüz ve yükleme ekranı önce gelir, oyun motoru sonradan indirilir.
    rollupOptions: { output: { manualChunks: (id: string) => (id.includes('node_modules/phaser') ? 'phaser' : undefined) } },
  },
  test: { include: ['src/tests/**/*.test.ts'] },
});
