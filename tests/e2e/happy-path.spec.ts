import { expect, test } from '@playwright/test';

// One pass through the things a person actually does: name yourself, mark a need,
// write a card, and see it in the list. Nothing here touches the network.
test('onboarding, a need, and a first card', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Setup' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('A name').fill('Ash');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
  await expect(page.getByText('Autonomy')).toBeVisible();

  // Mark one need, straight from the list
  await page.getByText('Autonomy').click();
  const first = page.getByText('choice', { exact: true });
  await expect(first).toBeVisible();

  // Write a card for someone new
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByPlaceholder('Or a new name…').fill('Robin');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When the kitchen light was still on at 2am');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Tired', { exact: true }).click();
  await page.getByText('weary', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Peace', { exact: true }).click();
  await page.getByText('ease', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('Would you be willing to…').fill('Would you be willing to switch it off before bed?');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Your words, assembled')).toBeVisible();
  await page.getByRole('button', { name: 'This is what I want to say' }).click();

  // The card is saved and opens on its own detail screen
  await expect(page.getByText('request · to Robin')).toBeVisible();
  await expect(page.getByText('Ready to share')).toBeVisible();

  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Robin').first()).toBeVisible();
  await expect(page.getByText('Mine · 1')).toBeVisible();
});

test('the data survives a reload', async ({ page }) => {
  await page.goto('/?demo');
  await expect(page.getByText('Autonomy')).toBeVisible();
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Mine · 4')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Mine · 4')).toBeVisible();
});

test('the introduction can be replayed from Settings, and walked backwards', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();
  await page.getByText('How Giraffy works').click();

  // it opens at the start, and Back walks all the way to the first page
  await expect(page.getByText('Giraffy', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('What shall we call you?')).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('Giraffy', { exact: true })).toBeVisible();

  // revisiting never re-runs setup: Done returns to Settings
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Erase all data')).toBeVisible();
});

test('a need can be thanked for, not only asked about', async ({ page }) => {
  await page.goto('/?demo#/need/connection/closeness');
  const row = page.locator('.card.list', { hasText: 'Dad' });

  // the request path is unchanged
  await row.getByRole('button', { name: 'Request' }).click();
  await expect(page.getByText('What happened?')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // and a met need can be thanked for, carrying the need into the card
  await page.goto('/?demo#/need/connection/closeness');
  await row.getByRole('button', { name: 'Gratitude' }).click();
  await expect(page.getByText('What did they do?')).toBeVisible();
  await page.getByPlaceholder('When I saw…').fill('When you called on Sunday and stayed on for an hour');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Grateful', { exact: true }).click();
  await page.getByText('touched', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // the need is already chosen, and a gratitude never asks for a request
  await expect(page.getByRole('button', { name: 'closeness' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Your words, assembled')).toBeVisible();
  await page.getByRole('button', { name: 'This is what I want to say' }).click();
  await expect(page.getByText('gratitude · to Dad')).toBeVisible();
});

test('the composer says what its coaching control does', async ({ page }) => {
  await page.goto('/?demo#/cards');
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();

  // it names the thing it controls, and its current state
  const toggle = page.getByRole('button', { name: 'coaching on' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.getByText('Coaching off for this card. Giraffy will not comment on your words.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'coaching off' })).toBeVisible();

  // and with coaching off, the nudge that would fire stays quiet
  await page.getByRole('button', { name: 'Myself' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When you always leave the kitchen a mess');
  await expect(page.getByText('generalizes', { exact: false })).toHaveCount(0);

  // switching it back on brings the nudge with it
  await page.getByRole('button', { name: 'coaching off' }).click();
  await expect(page.getByText('always')).toBeVisible();
});

test('the coaching control is absent when coaching is off everywhere', async ({ page }) => {
  await page.goto('/?demo#/settings');
  await page.locator('.chip', { hasText: 'On' }).click();  // Settings → Coaching
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await expect(page.getByRole('button', { name: /coaching/ })).toHaveCount(0);
});

// Marking a need has to show, on a device that has been opened before: the load path
// rebuilds needTiers, and anything it hands back has to stay reactive.
test('a need changes colour when it is marked, after a reload', async ({ page }) => {
  await page.goto('/?demo');
  await expect(page.getByText('Autonomy')).toBeVisible();
  // the second launch is the one that goes through the database
  await page.reload();
  await page.getByText('Autonomy').click();

  const row = page.locator('.need-rows > div', { hasText: 'spontaneity' }).first();
  const dot = row.locator('.dotbtn span').first();
  const before = await dot.evaluate((el) => getComputedStyle(el).backgroundColor);
  await dot.click();
  await expect.poll(() => dot.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);

  // and the need's own screen agrees: a tier it is not already on takes, and says when
  await page.getByText('spontaneity', { exact: true }).click();
  const met = page.getByRole('button', { name: 'Met', exact: true });
  await met.click();
  await expect(met).toHaveClass(/active/);
  await expect(page.getByText(/^changed /)).toBeVisible();
});
