import { expect, test, type Page } from '@playwright/test';

// Seeing the card before it is finished, and showing it to someone while it still is not.

/** A device that has never seen Giraffy, belonging to someone else. */
async function onboard(page: Page, name: string, at = '/'): Promise<void> {
  await page.goto(at);
  await page.getByRole('button', { name: 'Setup' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('A name').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page.getByText('Autonomy')).toBeVisible();
}

test('the assembled sentence can be read before the card is finished', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByPlaceholder('Or a new name…').fill('Robin');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When the rota went up without me');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Tired', { exact: true }).click();
  await page.getByText('weary', { exact: true }).click();

  // straight to the end, with the needs and the request still unwritten
  await page.getByRole('button', { name: 'See it so far' }).click();
  const summary = page.locator('textarea.synth');
  await expect(summary).toHaveValue(/the rota went up without me/);
  await expect(summary).toHaveValue(/weary/);
  await expect(page.getByText(/Still to write: a need and a request/)).toBeVisible();
  // it cannot be finished yet, but it can be sent
  await expect(page.getByRole('button', { name: 'This is what I want to say' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Send it as it is' })).toBeEnabled();

  // going back and writing more updates the assembly rather than freezing it
  await page.getByRole('button', { name: 'needs', exact: true }).click();
  await page.getByText('Peace', { exact: true }).click();
  await page.getByText('ease', { exact: true }).first().click();
  await page.getByRole('button', { name: 'See it so far' }).click();
  await expect(summary).toHaveValue(/ease/);
  await expect(page.getByText(/Still to write: a request/)).toBeVisible();
});

test('a half-written card goes to someone, who adds to it and sends it back', async ({ page, browser }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?demo');

  // Maya writes as far as the feelings, then sends it
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByPlaceholder('Or a new name…').fill('Robin');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When the rota went up without me');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Tired', { exact: true }).click();
  await page.getByText('weary', { exact: true }).click();
  await page.getByRole('button', { name: 'See it so far' }).click();
  await page.getByRole('button', { name: 'Send it as it is' }).click();
  await page.getByRole('button', { name: 'Copy as text' }).click();
  const sent = await page.evaluate(() => navigator.clipboard.readText());
  expect(sent).toMatch(/^status: draft$/m);
  expect(sent).toMatch(/^from: Maya$/m);

  // it is still hers, still a draft, and not counted among her finished cards
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Drafts · 1')).toBeVisible();
  await expect(page.getByText('Mine · 4')).toBeVisible();

  // Robin reads it on his own device: it is Maya's draft, not a guess about him
  const origin = new URL(page.url()).origin;
  // a context made by hand inherits neither baseURL nor permissions
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const robin = await ctx.newPage();
  await onboard(robin, 'Robin', origin + '/');
  await robin.locator('.tabbar .fab').click();
  await robin.getByText('Import a card').click();
  await robin.locator('textarea').fill(sent);
  await robin.getByRole('button', { name: 'Preview', exact: true }).click();
  await robin.getByRole('button', { name: /Add to Received|Take it as my draft|Keep it as it is/ }).first().click();

  await robin.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await robin.locator('.card.list', { hasText: 'the rota went up' }).first().click();
  await expect(robin.getByText('Still a draft, shared by Maya')).toBeVisible();
  await expect(robin.getByRole('button', { name: 'Send it back to Maya' })).toBeVisible();

  // he adds the need he thinks is underneath, and sends it back
  await robin.getByRole('button', { name: 'Add to it' }).click();
  // the composer says whose words these are, and that his additions travel back
  await expect(robin.getByText(/Maya wrote this and shared it/)).toBeVisible();
  await robin.getByRole('button', { name: 'See it so far' }).click();
  await robin.getByRole('button', { name: 'Send it back to Maya' }).click();
  await robin.getByRole('button', { name: 'Copy as text' }).click();
  const returned = await robin.evaluate(() => navigator.clipboard.readText());
  expect(returned).toMatch(/^from: Maya$/m);
  await ctx.close();
});
