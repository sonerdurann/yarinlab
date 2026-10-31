import { defineConfig, devices } from '@playwright/test';

/** Uçtan uca testler: üretim derlemesi Fastify sunucusundan (gerçek PostgreSQL ile) sunulur. */
const PORT = Number(process.env.E2E_PORT ?? 3100);
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../test-results/e2e-html' }]],
  outputDir: '../../test-results/e2e',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', screenshot: 'only-on-failure', locale: 'tr-TR' },
  projects: [
    { name: 'masaustu', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: false } },
    // Birincil hedef çözünürlük (prompt §13): yalnızca misafir oyuncu senaryoları
    { name: 'genis', testMatch: /guest\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: {
    command: `npm run build --workspace @yarinlab/web && PORT=${PORT} npm run start --workspace @yarinlab/server`,
    cwd: '../..',
    url: `http://localhost:${PORT}/healthz`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
