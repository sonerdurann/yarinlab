import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { decide, openTasks, start } from './helpers';

test.describe('misafir oyuncu', () => {
  test('görev zinciri, puan, gün döngüsü, inşa ve yeniden yükleme', async ({ page }) => {
    test.setTimeout(120_000);
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
    await expect(page.getByRole('dialog')).toContainText(/devam et/i);
    await page.getByRole('button', { name: /devam et/i }).click();
    await expect(budgetValue).toHaveText(budget!);
    await expect(page.locator('.time-chip')).toContainText('Gün 2');
    expect(errors).toEqual([]);
  });

  test('harita: bölgeye tıklayınca bilgi kartı; kampüs geliştirilir; kıyıya geçilir ve geri dönülür', async ({ page }) => {
    await start(page);
    await openTasks(page);
    await page.locator('#zones').getByRole('button', { name: 'Kıyı kapısı', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Mavi Nöbet 1');
    await page.keyboard.press('Escape');
    // Bilgi kartı: önce kanvasta kampüse tıklanır; dokunmatikte/ekran boyutuna göre isabet etmezse klavye listesiyle açılır.
    await page.getByRole('navigation', { name: 'Oyun menüsü' }).getByRole('button', { name: /Harita/ }).click();
    const card = page.locator('.inspect-card');
    const zoneBtn = page.getByRole('button', { name: 'Okul kampüsü bilgi kartı' });
    await zoneBtn.focus();
    await page.keyboard.press('Enter');
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading')).toHaveText('Okul kampüsü');
    await card.getByRole('button', { name: /Geliştir/ }).click();
    await expect(card.getByLabel('Seviye 2/4')).toBeVisible();
    await card.getByRole('button', { name: 'Kartı kapat' }).click();
    await page.getByRole('button', { name: /Sel riski/ }).click();
    await expect(page.getByRole('button', { name: /Sel riski/ })).toHaveAttribute('aria-pressed', 'true');
    // kıyı haritasına geçiş ve dönüş
    await page.getByRole('button', { name: 'Kıyı kapısı bilgi kartı' }).focus();
    await page.keyboard.press('Enter');
    await card.getByRole('button', { name: /Kıyıya git/ }).click();
    await page.getByRole('button', { name: /Su altı/ }).click();
    await expect(page.getByRole('button', { name: /Su altı/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Şehre dön/ }).click();
    await expect(page.locator('.minimap')).toBeVisible();
  });

  test('harita tıklaması: kampüse tıklayınca (fare veya dokunma) bilgi kartı açılır; sürükleme kart açmaz', async ({ page }, info) => {
    await start(page);
    // Dock'taki Harita kamerayı kampüse ortalar; kanvasın ortası kampüs binasının tabanıdır.
    await page.getByRole('navigation', { name: 'Oyun menüsü' }).getByRole('button', { name: /Harita/ }).click();
    await page.waitForTimeout(1500);
    const box = (await page.locator('.world canvas').boundingBox())!;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    // sürükleme: kart açılmamalı
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 80, cy + 30, { steps: 6 });
    await page.mouse.up();
    await expect(page.locator('.inspect-card')).toHaveCount(0);
    await page.getByRole('navigation', { name: 'Oyun menüsü' }).getByRole('button', { name: /Harita/ }).click();
    await page.waitForTimeout(1500);
    if (info.project.use.hasTouch) await page.touchscreen.tap(cx, cy);
    else await page.mouse.click(cx, cy);
    await expect(page.locator('.inspect-card').getByRole('heading')).toHaveText('Okul kampüsü');
  });

  test('karakter ve rehber: avatar kaydedilir, Yarı ipucu verir', async ({ page }) => {
    await start(page);
    await page.getByRole('button', { name: /Yarı'ya sor/ }).click();
    const guide = page.getByRole('region', { name: 'Yapay zekâ rehberi Yarı' });
    await guide.getByRole('button', { name: 'İpucu iste' }).click();
    await expect(guide).toContainText('İpucu');
    await guide.getByRole('button', { name: 'Rehberi kapat' }).click();
    await page.getByRole('button', { name: 'Ana menü' }).click();
    await page.getByRole('button', { name: /Karakterim/ }).click();
    await page.getByLabel(/Takma ad/).fill('GüneşAvcısı');
    await page.getByRole('button', { name: /Hazırım/ }).click();
    await expect(page.locator('.title-player')).toContainText('GüneşAvcısı');
  });

  test('klavye ile bölge listesi ve pencereler; Esc kapatır', async ({ page }) => {
    await start(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Bölge listesine geç' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#zones')).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Okul kampüsü
    await expect(page.getByRole('dialog', { name: 'Okul kampüsü' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('erişilebilirlik: ana ekran ve karar penceresinde ciddi axe ihlali yok', async ({ page }) => {
    await start(page);
    // Açılış/geçiş animasyonları bitmeden ölçülen renkler yarı saydam karışım olur; önce sonlu animasyonlar beklenir.
    const settle = () => page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
    const scan = async () => { await settle(); return scanNow(); };
    const scanNow = async () => (await new AxeBuilder({ page: page as never }).exclude('canvas').withTags(['wcag2a', 'wcag2aa']).analyze()).violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(await scan(), JSON.stringify(await scan(), null, 1)).toEqual([]);
    await page.getByRole('button', { name: /^Önerilen:/ }).click();
    expect(await scan(), JSON.stringify(await scan(), null, 1)).toEqual([]);
  });

  test('tüm yedi modülün ilk görevi oynanabilir; Meclis kanıt kartları gösterir', async ({ page }) => {
    test.setTimeout(180_000);
    await start(page);
    const modules = ['Enerji Adası', 'Karbon Dedektifleri', 'KrizKenti', 'Son Tabak', 'Mavi Nöbet', 'Döngü Ustaları', 'Gelecek Meclisi'];
    for (const m of modules) {
      await openTasks(page);
      await page.locator('#zones').getByRole('button', { name: 'Okul kampüsü', exact: true }).click();
      const school = page.getByRole('dialog', { name: 'Okul kampüsü' });
      await school.locator('li', { hasText: m }).getByRole('button', { name: 'Oyna' }).click();
      await expect(page.getByRole('dialog')).toContainText(`${m} 1`);
      if (m === 'Gelecek Meclisi') await expect(page.getByRole('dialog')).toContainText('Kanıt kartların');
      await decide(page, 1, 'Dengeyi korumak için çünkü veriye ve riske baktım.');
      await expect(page.getByRole('heading', { name: /^Sonuç/ })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    await openTasks(page);
    await expect(page.locator('.task-panel')).toContainText('7/35 görev tamamlandı');
  });
});
