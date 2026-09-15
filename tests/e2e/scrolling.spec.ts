import { expect, test, type Page } from '@playwright/test';

// A list you cannot scroll is a list you cannot read. These drive the compositor with a
// real finger rather than a scrollTop, because that is where the two differ.

async function swipeUp(page: Page): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  const box = await page.locator('.screen .scroll').boundingBox();
  if (!box) throw new Error('no scroll region on this screen');
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height * 0.75);
  const point = (ty: number) => ({ x, y: ty, radiusX: 12, radiusY: 12, force: 1, id: 1 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(y)] });
  for (let i = 1; i <= 12; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(y - (240 * i) / 12)] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(600);
  return page.evaluate(() => document.querySelector('.screen .scroll')!.scrollTop);
}

test('the needs list moves under a finger once an area is open', async ({ page }) => {
  await page.goto('/?demo');
  await page.getByText('Autonomy').click();
  const room = await page.evaluate(() => {
    const s = document.querySelector('.screen .scroll')!;
    return s.scrollHeight - s.clientHeight;
  });
  expect(room).toBeGreaterThan(100);
  expect(await swipeUp(page)).toBeGreaterThan(50);
});

test('every tab scrolls the region inside the screen, not the page', async ({ page }) => {
  await page.goto('/?demo');
  for (const tab of ['Cards', 'People', 'Settings']) {
    await page.locator('.tabbar .tab', { hasText: tab }).click();
    await page.waitForTimeout(300);
    const room = await page.evaluate(() => {
      const s = document.querySelector('.screen .scroll')!;
      return s.scrollHeight - s.clientHeight;
    });
    if (room > 100) expect(await swipeUp(page), tab).toBeGreaterThan(50);
    // the frame itself never scrolls: everything happens inside a screen
    expect(await page.evaluate(() => document.scrollingElement!.scrollTop), tab).toBe(0);
  }
});

test('the scroll region is allowed to be shorter than what is in it', async ({ page }) => {
  await page.goto('/?demo');
  await page.getByText('Autonomy').waitFor();
  const css = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.screen .scroll')!);
    return { minHeight: s.minHeight, overflowY: s.overflowY };
  });
  expect(css.minHeight).toBe('0px');
  expect(css.overflowY).toBe('auto');
});

test('tapping a need twice is not a zoom gesture', async ({ page }) => {
  await page.goto('/?demo');
  await page.getByText('Autonomy').click();
  const dot = page.locator('.need-rows > div', { hasText: 'spontaneity' }).first().locator('.dotbtn');
  await expect(dot).toHaveCSS('touch-action', 'manipulation');
  await expect(page.locator('.tabbar .tab').first()).toHaveCSS('touch-action', 'manipulation');
});
