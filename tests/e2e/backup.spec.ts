import { expect, test } from '@playwright/test';

// Backups. The folder picker itself is a browser dialog Playwright cannot drive, so these
// check what Giraffy offers and says, which is where the design lives.

test('setup ends by asking where a copy should live', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Setup' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('A name').fill('Ash');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Keep a copy somewhere.')).toBeVisible();
  // this is Chrome, which can keep a folder up to date
  await expect(page.getByRole('button', { name: 'Choose a folder' })).toBeVisible();

  // and it is skippable: the check-in still follows
  await page.getByRole('button', { name: 'Start the check-in' }).click();
  await expect(page).toHaveURL(/#\/checkin$/);
  await expect(page.getByText('Autonomy Need')).toBeVisible();
});

test('settings offers the folder, and says what it would do', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();

  await expect(page.getByText('Backups that keep themselves')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose a folder' })).toBeVisible();
  await expect(page.getByText('Pick a folder once')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back up now' })).toBeVisible();
});

// The real write path, with a real directory handle. The folder picker is a dialog
// Playwright cannot open, so the test hands the app the origin's private folder instead:
// the same FileSystemDirectoryHandle the picker would return, with the same methods.
test('a chosen folder gets the file, and keeps getting it', async ({ page }) => {
  await page.addInitScript(() => {
    window.showDirectoryPicker = () => navigator.storage.getDirectory();
  });
  await page.goto('/?demo');

  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();
  await page.getByRole('button', { name: 'Choose a folder' }).click();
  await expect(page.getByText('Backups go to')).toBeVisible();

  const read = (name: string) =>
    page.evaluate(async (n) => {
      const dir = await navigator.storage.getDirectory();
      try {
        const file = await dir.getFileHandle(n);
        return await (await file.getFile()).text();
      } catch {
        return null;
      }
    }, name);

  const first = await read('giraffy-backup.gnvc.yaml');
  expect(first).toContain('giraffy-backup: "1"');
  expect(first).not.toContain('Robin');

  // a change, and the app going away: the same file is brought up to date
  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByPlaceholder('A name').fill('Robin');
  await page.getByRole('button', { name: 'Add them' }).click();
  await page.evaluate(() => {
    // what the browser does when the app is put away, which is when Giraffy writes
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => read('giraffy-backup.gnvc.yaml')).toContain('Robin');

  // and a backup taken by hand sits beside it, under its own date
  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();
  await page.getByRole('button', { name: 'Back up now' }).click();
  const dated = 'giraffy-backup-' + new Date().toISOString().slice(0, 10) + '.gnvc.yaml';
  await expect.poll(() => read(dated)).toContain('giraffy-backup: "1"');
});

test('restoring is its own screen, about the whole app rather than one card', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();
  await page.getByRole('button', { name: 'Restore from a backup' }).click();

  await expect(page).toHaveURL(/#\/restore$/);
  await expect(page.getByText('A Giraffy backup is the whole app in one file')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open a backup file' })).toBeVisible();
  // the card samples belong to the card screen, not here
  await expect(page.getByRole('button', { name: 'Try a sample request card' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Try a backup of this device' }).click();
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByText('A Giraffy backup', { exact: true })).toBeVisible();
  await expect(page.getByText('everything the app holds')).toBeVisible();
  await expect(page.getByText(/What is here now \(/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore everything' })).toBeVisible();

  // and the card screen is still itself
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await page.getByRole('button', { name: 'Import' }).click();
  await expect(page).toHaveURL(/#\/import$/);
  await expect(page.getByRole('button', { name: 'Try a sample request card' })).toBeVisible();
});

test('settings ends with the version it is running', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();

  const version = page.locator('.ver');
  await expect(version).toContainText(/^Giraffy \d+\.\d+\.\d+/);
  await expect(version).toContainText('AGPL-3.0');

  // and it really is the last thing on the page, below Start over
  const order = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.scroll > *')];
    return { last: nodes[nodes.length - 1].className, count: nodes.length };
  });
  expect(order.last).toContain('ver');
});
