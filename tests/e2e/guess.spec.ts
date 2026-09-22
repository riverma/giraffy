import { expect, test } from '@playwright/test';

// Imagining someone else's card: written as them, addressed to you, theirs to correct.

/** A device that has never seen Giraffy, belonging to someone else. */
async function onboard(page: import('@playwright/test').Page, name: string, at = '/'): Promise<void> {
  await page.goto(at);
  await page.getByRole('button', { name: 'Setup' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('A name').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page.getByText('Autonomy')).toBeVisible();
}

test('a guess is written as them, and waits under Drafts', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  const received = () => page.getByText(/^Received · \d+$/).textContent();
  const receivedBefore = await received();
  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  await page.locator('.prow', { hasText: 'Sam' }).click();
  await page.getByRole('button', { name: 'Imagine their card' }).click();

  // the composer speaks about them, not about you
  await expect(page.getByText('You are writing as Sam')).toBeVisible();
  await expect(page.getByText('What might Sam say they saw or heard?')).toBeVisible();
  await page.getByPlaceholder('When I saw…').fill('When the dishes were still there in the morning');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('what might Sam have felt?')).toBeVisible();
  await page.getByText('Tired', { exact: true }).click();
  await page.getByText('weary', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText("Which of Sam's needs might not be met?")).toBeVisible();
  await page.getByText('Peace', { exact: true }).click();
  await page.getByText('ease', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('Would you be willing to…').fill('Would you be willing to rinse them before bed?');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'This is my guess at Sam' }).click();

  // saving offers to send it, and what would travel says whose card it is
  const body = await page.locator('.yaml pre').innerText();
  expect(body).toMatch(/^from: Sam$/m);
  expect(body).toMatch(/^status: draft$/m);
  await page.getByRole('button', { name: 'Close' }).click();

  // it is a card from Sam, to you, and still a draft
  await expect(page.getByText('request · from Sam')).toBeVisible();
  await expect(page.getByText("Still a guess, in Sam's words")).toBeVisible();
  await expect(page.getByText('Not from Sam until Sam sends it')).toBeVisible();

  // it sits under Drafts, and is in neither Mine nor Received
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Drafts · 1')).toBeVisible();
  await expect(page.getByText('Mine · 4')).toBeVisible();
  // a guess is in neither list: not a card of yours, and not one they have sent
  expect(await received()).toBe(receivedBefore);
});

test('a guess can be sent, and opens on their device as their own draft', async ({ page, browser }) => {
  await page.goto('/?demo');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('.tabbar .fab').click();
  await page.getByText('Imagine their card').click();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When the dishes were still there in the morning');
  await page.getByRole('button', { name: 'Close' }).click();

  // sending it is offered on the card itself
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Drafts · 1')).toBeVisible();
  await page.locator('.card.list', { hasText: 'still there in the morning' }).first().click();
  await page.getByRole('button', { name: 'Send it to Sam' }).click();
  await page.getByRole('button', { name: 'Copy as text' }).click();
  const sent = await page.evaluate(() => navigator.clipboard.readText());
  expect(sent).toMatch(/^from: Sam$/m);

  // now Sam, on a device that has never seen Giraffy
  // a context made by hand does not inherit baseURL from the config, so say where to go
  const origin = new URL(page.url()).origin;
  const theirs = await browser.newContext();
  const sam = await theirs.newPage();
  await onboard(sam, 'Sam', origin + '/');
  await sam.locator('.tabbar .fab').click();
  await sam.getByText('Import a card').click();
  await sam.locator('textarea').fill(sent);
  await sam.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(sam.getByText('wrote this as you')).toBeVisible();
  await sam.getByRole('button', { name: 'Take it as my draft' }).click();

  // it is Sam's own draft now, with the words in it
  await sam.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(sam.getByText('Drafts · 1')).toBeVisible();
  await sam.locator('.card.list', { hasText: 'still there in the morning' }).first().click();
  await expect(sam.getByPlaceholder('When I saw…')).toHaveValue('When the dishes were still there in the morning');
  await theirs.close();
});
