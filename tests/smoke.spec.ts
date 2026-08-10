import { test, expect } from '@playwright/test';

test('demo login opens timetable and export modal', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/Portal Jadual Waktu Kuliah|Student Class Timetable Portal/i)).toBeVisible();
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await expect(page).toHaveURL(/\/login$/);

  await expect(page.getByRole('button', { name: /log masuk tanpa akaun|demo/i })).toBeVisible();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await expect(page).toHaveURL(/\/app$/);

  await expect(page.getByRole('button', { name: /open tools and export/i })).toBeVisible();
  await expect(page.getByText('USAS Class Timetable').first()).toBeVisible();

  await page.getByRole('button', { name: /open tools and export/i }).click();
  await expect(page.getByText(/eksport pdf & wallpaper|export pdf & wallpaper/i)).toBeVisible();

  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await expect(page.getByText(/muat turun jadual|download timetable/i)).toBeVisible();

  await expect(page.getByRole('button', { name: /^PDF$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^PNG$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^download$|^muat turun$/i })).toBeVisible();
});

test('png export flow downloads an image file', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();

  await page.getByRole('button', { name: /^PNG$/i }).click();
  await expect(page.getByRole('button', { name: /^PNG$/i })).toHaveAttribute('class', /bg/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^download$|^muat turun$/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename().toLowerCase()).toContain('.png');
});

test('unknown route shows branded 404 screen', async ({ page }) => {
  await page.goto('/does-not-exist');

  await expect(page.getByText(/page not found|halaman tidak dijumpai/i)).toBeVisible();
  await expect(page.getByText(/usas class timetable/i)).toBeVisible();
});
