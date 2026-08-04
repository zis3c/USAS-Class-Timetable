import { test, expect } from '@playwright/test';

test('demo login opens timetable and export modal', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/Portal Jadual Waktu Kuliah/i)).toBeVisible();
  await page.getByRole('button', { name: /log masuk/i }).first().click();
  await expect(page).toHaveURL(/\/login$/);

  await expect(page.getByRole('button', { name: /log masuk tanpa akaun/i })).toBeVisible();
  await page.getByRole('button', { name: /log masuk tanpa akaun/i }).click();
  await expect(page).toHaveURL(/\/app$/);

  await expect(page.getByRole('button', { name: /open tools and export/i })).toBeVisible();
  await expect(page.getByText('USAS Class Timetable')).toBeVisible();

  await page.getByRole('button', { name: /open tools and export/i }).click();
  await expect(page.getByText(/eksport pdf & wallpaper/i)).toBeVisible();

  await page.getByRole('button', { name: /eksport pdf & wallpaper/i }).click();
  await expect(page.getByText(/muat turun jadual sebagai pdf atau kertas dinding/i)).toBeVisible();

  await expect(page.getByRole('button', { name: /^PDF$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^PNG$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /muat turun pdf/i })).toBeVisible();
});

test('png export flow downloads an image file', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper/i }).click();

  await page.getByRole('button', { name: /^PNG$/i }).click();
  await expect(page.getByRole('button', { name: /^PNG$/i })).toHaveAttribute('class', /bg/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /muat turun pdf/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename().toLowerCase()).toContain('.png');
});
