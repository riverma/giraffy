import { expect, test } from '@playwright/test';

// Drafts you can leave and come back to, and lists you can add to and take from.
// Everything here goes through the real database, the real service worker build.

test('a draft waits in Cards, and can be picked back up and finished', async ({ page }) => {
  await page.goto('/?demo');

  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByPlaceholder('Or a new name…').fill('Robin');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When the kitchen light was still on at 2am');
  await page.getByRole('button', { name: 'Close' }).click();

  // it is in Cards, under Drafts, and not counted among the finished cards
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Drafts · 1')).toBeVisible();
  await expect(page.getByText('Mine · 4')).toBeVisible();

  // and it survives closing the app
  await page.reload();
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Drafts · 1')).toBeVisible();

  // the + button offers it back, on the step it was left on
  await page.locator('.tabbar .fab').click();
  await page.locator('.draftrow', { hasText: 'When the kitchen light was still on at 2am' }).click();
  await expect(page.getByPlaceholder('When I saw…')).toHaveValue('When the kitchen light was still on at 2am');

  // finishing it turns the draft into the card
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Tired', { exact: true }).click();
  await page.getByText('weary', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Peace', { exact: true }).click();
  await page.getByText('ease', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('Would you be willing to…').fill('Would you be willing to switch it off before bed?');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'This is what I want to say' }).click();

  await expect(page.getByText('request · to Robin')).toBeVisible();
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Mine · 5')).toBeVisible();
  await expect(page.getByText('Drafts · 1')).toHaveCount(0);
});

test('opening the composer and changing your mind leaves nothing behind', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  const steps = page.locator('.iconbtn.count');
  const before = (await steps.count()) ? await steps.innerText() : '0';

  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await expect(page.getByText('A new card')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Drafts ·')).toHaveCount(0);
  const after = (await steps.count()) ? await steps.innerText() : '0';
  expect(after).toBe(before);
});

test('a draft can be discarded from the Cards list, and undo brings it back', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByPlaceholder('Or a new name…').fill('Robin');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When the rota went up without me');
  await page.getByRole('button', { name: 'Close' }).click();

  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('.card.list', { hasText: 'When the rota went up without me' }).getByRole('button', { name: 'Discard', exact: true }).click();
  await page.getByRole('button', { name: 'Discard it' }).click();
  await expect(page.getByText('Drafts ·')).toHaveCount(0);

  await page.getByRole('button', { name: 'Undo' }).first().click();
  await expect(page.getByText('Drafts · 1')).toBeVisible();
});

test('a person can be added and removed, and their cards stay', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'People' }).click();

  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByPlaceholder('A name').fill('Robin');
  await page.getByRole('button', { name: 'Add them' }).click();
  await expect(page.locator('.prow', { hasText: 'Robin' })).toBeVisible();

  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('.prow', { hasText: 'Sam' }).getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('Remove Sam?')).toBeVisible();
  await page.getByRole('button', { name: 'Remove them' }).click();
  await expect(page.locator('.prow', { hasText: 'Sam' })).toHaveCount(0);

  // the cards written with them are untouched
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Mine · 4')).toBeVisible();

  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  await page.getByRole('button', { name: 'Undo' }).first().click();
  await expect(page.locator('.prow', { hasText: 'Sam' })).toBeVisible();
});

test('a need of your own shows up everywhere, and a hidden one drops out', async ({ page }) => {
  await page.goto('/?demo');
  await expect(page.getByText('47 of 103 looked at')).toBeVisible();

  // add one under Play
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('.card.list', { hasText: 'Play' }).first().click();
  await page.getByRole('button', { name: '+ a need under Play' }).click();
  await page.getByPlaceholder('being consulted').fill('kite flying');
  await page.getByRole('button', { name: 'Add it' }).click();
  await expect(page.getByText('kite flying', { exact: true })).toBeVisible();
  await expect(page.getByText('47 of 104 looked at')).toBeVisible();

  // it is offered in the composer like any other need
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByPlaceholder('Or a new name…').fill('Robin');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When we went out to the long field');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Tired', { exact: true }).click();
  await page.getByText('weary', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('.card.list.fam', { hasText: 'Play' }).click();
  await expect(page.locator('.chip', { hasText: 'kite flying' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // hide a need that ships, and show it again from Settings
  await page.locator('.tabbar .tab', { hasText: 'Needs' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('.card.list', { hasText: 'Autonomy' }).first().click();
  await page.locator('.need-rows > div', { hasText: 'choice' }).first().getByRole('button', { name: 'Hide', exact: true }).click();
  await page.getByRole('button', { name: 'Hide it' }).click();
  // choice was one of the needs marked in the sample, so both counts come down by one
  await expect(page.getByText('46 of 103 looked at')).toBeVisible();
  await expect(page.getByText('choice', { exact: true })).toHaveCount(0);

  await page.locator('.tabbar .tab', { hasText: 'Settings' }).click();
  await page.getByRole('button', { name: 'choice · show again' }).click();
  await page.locator('.tabbar .tab', { hasText: 'Needs' }).click();
  await expect(page.getByText('47 of 104 looked at')).toBeVisible();
});

test('a person can be renamed from the People tab, on their cards too', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'People' }).click();

  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('.prow', { hasText: 'Sam' }).getByRole('button', { name: 'Rename', exact: true }).click();
  await page.getByPlaceholder('A name').fill('Sameera');
  await page.getByRole('button', { name: 'Rename them' }).click();
  await expect(page.locator('.prow', { hasText: 'Sameera' })).toBeVisible();
  await expect(page.locator('.prow', { hasText: 'Sam', has: page.locator('.ah-title-l') })).toHaveCount(1);

  // the cards they are on carry the new name
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await page.locator('.card.list', { hasText: 'dishes from last night' }).first().click();
  await expect(page.getByText('to Sameera')).toBeVisible();

  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  await page.getByRole('button', { name: 'Undo' }).first().click();
  await expect(page.locator('.prow', { hasText: 'Sameera' })).toHaveCount(0);
});

test('a card written for one person can be pointed at another', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await page.locator('.card.list', { hasText: 'worked through lunch' }).first().click();
  await expect(page.getByText('request · to Myself')).toBeVisible();

  await page.getByRole('button', { name: 'Change who it is for' }).click();
  await expect(page.getByText('Who is this card for?')).toBeVisible();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();

  // the card is the same card, for someone else
  await expect(page.getByText('request · to Sam')).toBeVisible();
  await expect(page.locator('.ah-pull-quote', { hasText: 'worked through lunch' })).toBeVisible();

  // and it is undoable
  await page.getByRole('button', { name: 'Undo' }).first().click();
  await expect(page.getByText('request · to Myself')).toBeVisible();
});
