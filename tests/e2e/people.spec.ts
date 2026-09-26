import { expect, test } from '@playwright/test';

// Every card belongs to somebody. These are the three ways one used to belong to nobody.

test('a card to yourself lands under Myself', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  const myself = page.locator('.prow', { hasText: 'Myself' }).first();
  const before = await myself.innerText();

  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByRole('button', { name: 'Myself', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When I skipped lunch again');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Tired', { exact: true }).click();
  await page.getByText('weary', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Peace', { exact: true }).click();
  await page.getByText('ease', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('Would you be willing to…').fill('Would I be willing to stop?');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'This is what I want to say' }).click();

  // the demo already holds one card to Myself, spelled the other way, so this makes two
  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  await expect(myself).toContainText('2 open requests');
  expect(await myself.innerText()).not.toBe(before);

  await myself.click();
  await expect(page.getByText('skipped lunch')).toBeVisible();
});

test('a draft to a new name gives them a row, counted as a draft', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByPlaceholder('Or a new name…').fill('Wren');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When the kettle was left on');
  await page.getByRole('button', { name: 'Close' }).first().click();

  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  const wren = page.locator('.prow', { hasText: 'Wren' }).first();
  await expect(wren).toBeVisible();
  // a draft is not an open request: nothing has been sent to them
  await expect(wren).toContainText('1 draft');
  await expect(wren).not.toContainText('open request');

  await wren.click();
  await expect(page.getByText('Drafts · 1')).toBeVisible();
  await expect(page.getByText(/kettle was left on/i)).toBeVisible();
});

test('typing a name one letter at a time makes one person, not several', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByPlaceholder('Or a new name…').pressSequentially('Wren', { delay: 40 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();

  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  await expect(page.locator('.prow', { hasText: 'Wren' })).toHaveCount(1);
  for (const half of ['W', 'Wr', 'Wre']) {
    await expect(page.locator('.prow .ah-title-l', { hasText: new RegExp('^' + half + '$') })).toHaveCount(0);
  }
});

test('the summary step says who the card is for, and can change it', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Mine · 4')).toBeVisible();

  await page.locator('.tabbar .fab').click();
  await page.getByText('Write a new card').click();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('When I saw…').fill('When the rota went up without me');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Tired', { exact: true }).click();
  await page.getByText('weary', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Peace', { exact: true }).click();
  await page.getByText('ease', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('Would you be willing to…').fill('Would you be willing to ask?');
  await page.getByRole('button', { name: 'Continue' }).click();

  // add a second person from the last step
  await expect(page.getByText('This card is for')).toBeVisible();
  await page.getByRole('button', { name: 'Priya', exact: true }).click();
  await expect(page.getByText('2 cards will be written, one each for Sam and Priya.')).toBeVisible();
  await page.getByRole('button', { name: 'Write these 2 cards' }).click();

  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await expect(page.getByText('Mine · 6')).toBeVisible();
  await page.locator('.tabbar .tab', { hasText: 'People' }).click();
  await expect(page.locator('.prow', { hasText: 'Priya' }).first()).toContainText('1 open request');
});

test('editing a card offers no person picker, on either step', async ({ page }) => {
  await page.goto('/?demo');
  await page.locator('.tabbar .tab', { hasText: 'Cards' }).click();
  await page.locator('.card.list', { hasText: 'worked through lunch' }).first().click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();

  // step 0 no longer offers the chips, so a recipient only changes through the card screen
  await expect(page.getByText('Who is it about?')).toHaveCount(0);
  await page.getByRole('button', { name: 'See it so far' }).click();
  await expect(page.getByText('This card is for')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Keep these changes' })).toBeVisible();
});
