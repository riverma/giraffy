import { expect, test } from '@playwright/test';

// Day and Night are the person's choice, made in Settings, kept across reloads, and never
// made for them: not by the hour, and not by the system's colour scheme.

test('Night is chosen in Settings and stays chosen', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?demo');
  // the system prefers dark, and Giraffy still starts in Day
  await expect(page.locator('html')).toHaveClass(/ahimsa-day/);

  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();
  await page.getByRole('button', { name: 'Night', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/ahimsa-night/);
  await expect(page.getByRole('button', { name: 'Night', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.ah-screen')!).backgroundColor);
  expect(bg).not.toBe('rgb(231, 231, 228)');

  await page.waitForTimeout(500); // the pref is written a moment after the tap
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/ahimsa-night/);

  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();
  await page.getByRole('button', { name: 'Day', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/ahimsa-day/);
});
