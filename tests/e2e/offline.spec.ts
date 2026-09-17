import { expect, test } from '@playwright/test';

// Giraffy's promise is that it keeps working with the radio off (spec §7).
// The service worker precaches everything, so a cold offline load must still boot.
test('boots and navigates with the network off', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null && navigator.serviceWorker?.controller !== undefined, null, { timeout: 20_000 });
  // give the precache a moment to settle before pulling the plug
  await page.waitForTimeout(1500);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Giraffy', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page.getByText('Autonomy')).toBeVisible();

  // a deep route, cold, still offline
  await page.goto('/#/settings');
  await expect(page.getByText('Erase all data')).toBeVisible();

  await context.setOffline(false);
});

// A link that was truncated or mangled in a chat app must not stop the app from starting.
test('a malformed link still opens the app', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?demo#/card/%');
  // it boots, and lands somewhere real rather than on a blank page
  await expect(page.locator('.tabbar')).toBeVisible();
  await expect(page.getByText('Cards', { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

// The page says it cannot reach the network at all; this proves the browser agrees.
test('the page forbids itself from connecting anywhere', async ({ page }) => {
  await page.goto('/?demo');
  await expect(page.getByText('Autonomy')).toBeVisible();
  const blocked = await page.evaluate(async () => {
    try {
      await fetch('https://example.com/beacon', { method: 'POST', body: 'x' });
      return 'allowed';
    } catch (e) {
      return (e as Error).name;
    }
  });
  expect(blocked).not.toBe('allowed');
});

// An installed app keeps running its old version until every window of it is closed. The
// bar is how someone testing finds out a fix has arrived without knowing to do that.
test('the app registers a worker that can bring an update in', async ({ page }) => {
  await page.goto('/?demo');
  await expect(page.getByText('Autonomy')).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg && !!navigator.serviceWorker.controller;
  })).toBe(true);
  // nothing is waiting on a fresh install, so the bar stays out of the way
  await expect(page.getByText('A new version of Giraffy is ready.')).toHaveCount(0);
});
