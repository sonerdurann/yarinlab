import { expect, type Page } from '@playwright/test';

export const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

/** Yükleme bitene kadar bekler ve hikâye girişini geçer. */
export async function start(page: Page) {
  await page.goto('/');
  await expect(page.locator('.loading.done')).toBeAttached({ timeout: 20_000 });
  const begin = page.getByRole('button', { name: 'Başla', exact: true });
  if (await begin.isVisible()) await begin.click();
}

/** Açık karar penceresinde seçenek seçer, gerekçe yazar ve değerlendirir. */
export async function decide(page: Page, choiceIndex: number, reason: string) {
  const dialog = page.getByRole('dialog');
  await dialog.locator('label.choice').nth(choiceIndex).click();
  await dialog.locator('textarea').first().fill(reason);
  await page.getByRole('button', { name: 'Kararı değerlendir' }).click();
  await expect(dialog.getByText(/Karar puanı/)).toBeVisible();
}
