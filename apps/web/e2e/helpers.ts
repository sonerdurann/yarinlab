import { expect, type Page } from '@playwright/test';

export const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

/** Yükleme bitene kadar bekler ve hikâye girişini geçer. */
export async function start(page: Page) {
  await page.goto('/');
  await expect(page.locator('.loading.done')).toBeAttached({ timeout: 45_000 });
  // Başlık ekranı -> yeni oyun -> karakter oluşturucu -> hikâye girişi
  const newGame = page.getByRole('button', { name: /Yeni oyuna başla/ });
  if (await newGame.isVisible()) {
    page.once('dialog', (d) => void d.accept());
    await newGame.click();
    const ready = page.getByRole('button', { name: /Hazırım/ });
    if (await ready.isVisible()) await ready.click();
  }
  const skip = page.getByRole('button', { name: 'Atla', exact: true });
  if (await skip.isVisible()) {
    await skip.click();
    await page.getByRole('button', { name: 'Başla', exact: true }).click();
  }
}

/** Açık karar penceresinde seçenek seçer, gerekçe yazar ve değerlendirir. */
export async function decide(page: Page, choiceIndex: number, reason: string) {
  const dialog = page.getByRole('dialog');
  await dialog.locator('label.choice').nth(choiceIndex).click();
  await dialog.locator('textarea').first().fill(reason);
  await page.getByRole('button', { name: /Kararımı dene/ }).click();
  await expect(dialog.locator('.star-result')).toBeVisible();
}

/** Alt dock'tan Görevler çekmecesini açar (bölge listesi ve görev merkezi). */
export async function openTasks(page: Page) {
  const btn = page.getByRole('navigation', { name: 'Oyun menüsü' }).getByRole('button', { name: /Görevler/ });
  if ((await btn.getAttribute('aria-pressed')) !== 'true') await btn.click();
  await expect(page.locator('.task-panel')).toBeVisible();
}
