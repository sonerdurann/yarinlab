import { expect, test } from '@playwright/test';
import { decide, start, uid } from './helpers';

test('öğretmen sınıf açar, öğrenci kodla katılır ve oynar, öğretmen raporu indirir', async ({ browser }) => {
  test.setTimeout(150_000);
  const id = uid();
  const teacher = await browser.newPage();
  await start(teacher);
  await teacher.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  await teacher.getByRole('button', { name: 'Öğretmen girişi / kaydı' }).click();
  await teacher.getByRole('tab', { name: 'Öğretmen kaydı' }).click();
  await teacher.getByLabel('Ad Soyad').fill('Test Öğretmen');
  await teacher.getByLabel('E-posta').fill(`e2e-${id}@okul.test`);
  await teacher.getByLabel('Parola').fill('sifre1234');
  await teacher.getByRole('button', { name: 'Kaydol' }).click();
  await teacher.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  await teacher.getByLabel('Yeni sınıf adı').fill('8-B');
  await teacher.getByRole('button', { name: 'Sınıf oluştur' }).click();
  const code = (await teacher.locator('.join-code strong').textContent())!.trim();

  // izin akışı tamamlanmadan öğrenci katılamaz
  const student = await browser.newPage();
  await start(student);
  const register = async () => {
    await student.getByRole('button', { name: 'Giriş', exact: true }).click();
    await student.getByRole('tab', { name: 'Öğrenci kaydı' }).click();
    await student.getByLabel(/Sınıf kodu/).fill(code);
    await student.getByLabel(/Takma ad/).fill(`Ece${id}`.slice(0, 16));
    await student.getByLabel('Parola').fill('abc123');
    await student.getByRole('button', { name: 'Kaydol' }).click();
  };
  await register();
  await expect(student.getByRole('alert')).toContainText('izin');
  await student.getByRole('dialog').getByRole('button', { name: 'Kapat' }).click();

  await teacher.getByRole('button', { name: /Okul yönetimi onayını/ }).click();
  await teacher.getByRole('button', { name: /Velileri bilgilendirdiğimi/ }).click();
  await expect(teacher.locator('.consent summary')).toContainText('✓ tamamlandı');

  await register();
  await expect(student.locator('.sync')).toContainText(/Kayıt|Kaydedildi/);
  await student.getByRole('button', { name: /^Önerilen:/ }).click();
  await decide(student, 2, 'Önce batarya çünkü kesinti riski ve bütçe dengesi önemli.');
  await expect(student.locator('.sync')).toContainText('Kaydedildi');

  await teacher.getByRole('tab', { name: 'İlerleme' }).click();
  await expect(teacher.getByRole('table').nth(1)).toContainText(`Ece${id}`.slice(0, 16));
  await teacher.getByRole('tab', { name: 'Raporlar ve öneriler' }).click();
  const [pdf] = await Promise.all([teacher.waitForEvent('download'), teacher.getByRole('link', { name: 'PDF indir' }).click()]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  const [csv] = await Promise.all([teacher.waitForEvent('download'), teacher.getByRole('link', { name: /CSV indir/ }).click()]);
  expect(csv.suggestedFilename()).toMatch(/\.csv$/);
  await teacher.getByRole('button', { name: 'Öneri oluştur' }).click();
  await expect(teacher.getByText('Etkinlik önerileri')).toBeVisible();
});

test('ağ kesintisinde ilerleme korunur ve bağlantı gelince gönderilir', async ({ page, context }) => {
  const id = uid();
  const api = context.request;
  await api.post('/api/auth/teacher/register', { data: { email: `off-${id}@okul.test`, password: 'sifre1234', displayName: 'Ağ Öğretmen' } });
  const cls = (await (await api.post('/api/classrooms', { data: { name: '6-D' } })).json()).classroom;
  for (const kind of ['SCHOOL_APPROVAL', 'PARENT_NOTICE']) await api.post(`/api/classrooms/${cls.id}/consent`, { data: { kind, confirm: true } });
  await api.post('/api/auth/logout', { data: {} });
  await api.post('/api/auth/student/register', { data: { classCode: cls.joinCode, nickname: `Ag${id}`.slice(0, 16), password: 'abc123' } });
  await start(page);
  await context.route('**/api/save', (r) => r.abort());
  await context.route('**/api/attempts', (r) => r.abort());
  await page.getByRole('button', { name: /^Önerilen:/ }).click();
  await decide(page, 0, 'Çevrim dışı karar çünkü test.');
  await expect(page.locator('.sync')).toContainText(/Çevrim dışı|hata/);
  await context.unroute('**/api/save');
  await context.unroute('**/api/attempts');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(async () => (await (await api.get('/api/attempts/mine')).json()).attempts.length).toBe(1);
  await expect.poll(async () => (await (await api.get('/api/save')).json()).save?.state.history.length).toBe(1);
});
