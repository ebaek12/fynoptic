import { test, expect } from '@playwright/test';

for (const width of [1440, 1920, 390, 320]) {
  for (const [path, panel] of [['/flashcard', '#flashcard-setup'], ['/practice', '#practice-wizard']]) {
    test(`${path} setup fits and is centered at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(path!);
      await expect(page.locator(panel!)).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: testInfo.outputPath('setup.png'), fullPage: true });
      const box = await page.locator(panel!).boundingBox();
      expect(box).not.toBeNull();
      expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(3);
      if (width >= 1440) expect(box!.width).toBeGreaterThanOrEqual(900);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
}

test('a stored light theme stays light throughout hydration', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fynoptic-theme', 'light');
    (window as any).__darkPaint = false;
    new MutationObserver(() => {
      if (document.body?.getAttribute('data-theme') === 'dark') (window as any).__darkPaint = true;
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
  await page.goto('/practice');
  await expect(page.locator('#wiz-next-1')).toBeVisible();
  await expect(page.locator('#theme-btn')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => (window as any).__darkPaint)).toBe(false);
});
