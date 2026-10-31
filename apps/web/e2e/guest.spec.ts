import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { decide, start } from './helpers';

test.describe('misafir oyuncu', () => {
  test('görev zinciri, puan, gün döngüsü, inşa ve yeniden yükleme', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page);
    await page.getByRole('button', { name: /^Önerilen:/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Enerji Adası 1');
    await decide(page, 1, 'Gece güneş yok çünkü depolama ve rüzgâr gerekir; bütçeyi de düşündüm.');
    await expect(page.getByRole('region', { name: 'Yapay zekâ iklim öğretmeni' })).toBeVisible();
    await page.getByRole('button', { name: /Sonraki görev/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Enerji Adası 2');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Günü bitir' }).click();
    await expect(page.locator('.time-chip')).toContainText('Gün 2');

    await page.getByRole('button', { name: /İnşa$/ }).click();
    await page.getByRole('tab', { name: 'Enerji bölgesi' }).click();
    const kur = page.getByRole('dialog').getByRole('button', { name: 'Kur', exact: true }).first();
    await kur.click();
    await expect(page.getByRole('dialog')).toContainText('Bu bölgedeki yapılar');
    await page.keyboard.press('Escape');

    // Sayaç animasyonundan etkilenmemek için ekran okuyucunun okuduğu gerçek değer karşılaştırılır.
    const budgetValue = page.locator('.pills .pill').first().locator('.sr-only').last();
    const budget = await budgetValue.textContent();
    await page.reload();
    await expect(page.locator('.loading.done')).toBeAttached({ timeout: 20_000 });
    await expect(page.getByRole('dialog')).toContainText('Devam et');
    await page.getByRole('button', { name: /Devam et/ }).click();
    await expect(budgetValue).toHaveText(budget!);
    await expect(page.locator('.time-chip')).toContainText('Gün 2');
    expect(errors).toEqual([]);
  });

  test('klavye ile bölge listesi ve pencereler; Esc kapatır', async ({ page }) => {
    await start(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Bölge listesine geç' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#zones')).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Okul
    await expect(page.getByRole('dialog', { name: 'Okul kampüsü' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('erişilebilirlik: ana ekran ve karar penceresinde ciddi axe ihlali yok', async ({ page }) => {
    await start(page);
    const scan = async () => (await new AxeBuilder({ page: page as never }).exclude('canvas').withTags(['wcag2a', 'wcag2aa']).analyze()).violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(await scan(), JSON.stringify(await scan(), null, 1)).toEqual([]);
    await page.getByRole('button', { name: /^Önerilen:/ }).click();
    expect(await scan(), JSON.stringify(await scan(), null, 1)).toEqual([]);
  });

  test('tüm yedi modülün ilk görevi oynanabilir; Meclis kanıt kartları gösterir', async ({ page }) => {
    await start(page);
    const modules = ['Enerji Adası', 'Karbon Dedektifleri', 'KrizKenti', 'Son Tabak', 'Mavi Nöbet', 'Döngü Ustaları', 'Gelecek Meclisi'];
    for (const m of modules) {
      await page.locator('#zones').getByRole('button', { name: 'Okul', exact: true }).click();
      const school = page.getByRole('dialog', { name: 'Okul kampüsü' });
      await school.locator('li', { hasText: m }).getByRole('button', { name: 'Oyna' }).click();
      await expect(page.getByRole('dialog')).toContainText(`${m} 1`);
      if (m === 'Gelecek Meclisi') await expect(page.getByRole('dialog')).toContainText('Kanıt kartların');
      await decide(page, 1, 'Dengeyi korumak için çünkü veriye ve riske baktım.');
      await expect(page.getByRole('heading', { name: /^Sonuç/ })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    await expect(page.locator('.task-panel')).toContainText('7/35 görev tamamlandı');
  });
});
