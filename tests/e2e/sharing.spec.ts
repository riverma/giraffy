import { expect, test } from '@playwright/test';

// What the app puts on the clipboard has to be what the app at the other end can read.
// A line of prose above the card used to make that untrue.

test('what is copied is the card and nothing above it', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await page.locator('.card.list', { hasText: 'worked through lunch' }).first().click();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await page.getByRole('button', { name: 'Copy as text' }).click();

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  // the first line is the card's own comment header, not a message about it
  expect(copied.split('\n')[0]).toMatch(/^#/);
  expect(copied).not.toContain('I took some time to put this into words');
  expect(copied).toContain('gnvc:');
});

test('the share sheet offers a file, and keeps the note beside the card', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await page.locator('.card.list', { hasText: 'worked through lunch' }).first().click();
  await page.getByRole('button', { name: 'Share', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Save the file' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy as text' })).toBeVisible();
  await expect(page.getByText('Exactly this, and nothing above it')).toBeVisible();
  // the note is offered beside the card, and is not in what gets sent
  await expect(page.getByText('A note to send with it')).toBeVisible();
  await expect(page.locator('.yaml pre')).not.toContainText('I took some time');
  await expect(page.locator('.yaml pre')).toContainText('gnvc:');
});

test('a card pasted in with a note above it still reads', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await page.locator('.card.list', { hasText: 'worked through lunch' }).first().click();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const body = await page.locator('.yaml pre').innerText();
  await page.getByRole('button', { name: 'Close' }).click();

  // a card from someone else, sent the way older versions sent them
  const theirs = body
    .replace(/^from: .*$/m, 'from: Robin')
    .replace(/^to: .*$/m, 'to: Maya')
    .replace(/^id: .*$/m, 'id: robin-0001');
  await page.locator('.tabbar .fab').click();
  await page.getByText('Import a card').click();
  await page.locator('textarea').fill('I took some time to put this into words with care, using Giraffy.\n\n' + theirs);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  // it reads, and offers to take it in
  await expect(page.getByRole('button', { name: 'Add to Received' })).toBeVisible();
  await expect(page.getByText('could not be read')).toHaveCount(0);
});

test('something that is not a card at all is still refused', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .fab').click();
  await page.getByText('Import a card').click();
  await page.locator('textarea').fill('Hello, thinking of you today.');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add to Received' })).toHaveCount(0);
});
