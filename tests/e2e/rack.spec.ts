import { test, expect } from '@playwright/test';

const destinations = ['/courses', '/articles', '/flashcard', '/practice'];

for (const mode of ['desktop', 'chromebook', 'mobile', 'reduced', 'save-data', 'throttled', 'no-js'] as const) {
  test(`${mode}: all four resource cards remain readable and navigate`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: mode === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 768 },
      reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
      javaScriptEnabled: mode !== 'no-js',
    });
    await context.addInitScript((mode) => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: mode === 'chromebook' ? 2 : 8 });
      Object.defineProperty(navigator, 'deviceMemory', { value: mode === 'chromebook' ? 4 : 8 });
      Object.defineProperty(navigator, 'connection', { value: Object.assign(new EventTarget(), { saveData: mode === 'save-data' }) });
    }, mode);
    const page = await context.newPage();
    if (mode === 'throttled') {
      const session = await context.newCDPSession(page);
      await session.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    }
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const href of destinations) {
      await page.goto(`${test.info().project.use.baseURL}/`);
      if (mode === 'desktop' || mode === 'throttled') {
        await expect(page.locator('.magnifier-transition')).toHaveAttribute('data-animated', 'true');
        await page.locator('#learning').evaluate(el => window.scrollTo({ top: Math.ceil(scrollY + el.getBoundingClientRect().top), behavior: 'instant' }));
        await expect(page.locator('.magnifier-experience')).toHaveAttribute('data-phase', 'complete');
      } else {
        await expect(page.locator('.magnifier-transition')).toBeHidden();
      }
      const cards = page.locator('.learning-card');
      await expect(cards).toHaveCount(4);
      const card = page.locator(`.learning-card[href="${href}"]`);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      await expect(card).toHaveCSS('filter', 'none');
      await expect(card).toHaveCSS('opacity', '1');
      // Click the body of the card, not just its action label.
      await card.locator('p').click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('keyboard can open each card without switching tabs', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const cards = page.locator('.learning-card');
  await cards.first().focus();
  for (let i = 0; i < 4; i++) {
    await expect(cards.nth(i)).toBeFocused();
    if (i < 3) await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/practice$/);
});

for (const theme of ['light', 'dark']) {
  for (const route of ['/', '/about']) {
    test(`${route} ${theme}: partner artwork has explicit plates without filters`, async ({ page }) => {
      await page.addInitScript(theme => localStorage.setItem('fynoptic-theme', theme), theme);
      await page.goto(route);
      await page.addStyleTag({ content: '* { filter: none !important; animation: none !important; }' });
      const plates = page.locator('[data-logo-plate]:visible');
      await expect(plates).toHaveCount(route === '/' ? 12 : 6);
      for (const plate of await plates.all()) {
        const dark = await plate.getAttribute('data-logo-plate') === 'dark';
        await expect(plate).toHaveCSS('background-color', dark ? 'rgb(18, 23, 31)' : 'rgb(255, 255, 255)');
        await plate.scrollIntoViewIfNeeded();
        await expect.poll(() => plate.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        await expect(plate.locator('img')).toHaveCSS('filter', 'none');
      }
    });
  }
}

test('changing to reduced motion mid-animation releases links and navigation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 });
    Object.defineProperty(navigator, 'deviceMemory', { value: 8 });
  });
  await page.goto('/');
  await expect(page.locator('.magnifier-transition')).toHaveAttribute('data-animated', 'true');
  await page.locator('.magnifier-transition').evaluate(el => window.scrollTo(0, scrollY + el.getBoundingClientRect().top + 300));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.magnifier-transition')).toBeHidden();
  await expect(page.locator('.magnifier-portal')).not.toHaveAttribute('inert');
  await expect(page.locator('header')).not.toHaveAttribute('inert');
  await page.locator('.learning-card[href="/articles"]').click();
  await expect(page).toHaveURL(/\/articles$/);
});

test('suspended animation frames cannot hide or disable the destination', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 });
    Object.defineProperty(navigator, 'deviceMemory', { value: 8 });
  });
  await page.goto('/');
  await expect(page.locator('.magnifier-transition')).toHaveAttribute('data-animated', 'true');
  await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const learning = document.querySelector('#learning')!;
    window.scrollTo({ top: Math.ceil(scrollY + learning.getBoundingClientRect().top), behavior: 'instant' });
  });
  await expect(page.locator('.magnifier-content')).toHaveCSS('opacity', '1');
  await expect(page.locator('.magnifier-portal')).not.toHaveAttribute('inert');
  await expect(page.locator('header')).not.toHaveAttribute('inert');
  await page.locator('.learning-card[href="/courses"]').click();
  await expect(page).toHaveURL(/\/courses$/);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 900, height: 700 },
]) {
  test(`scroll focus keeps the heading and all cards within ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 4 });
      Object.defineProperty(navigator, 'deviceMemory', { value: 8 });
    });
    await page.goto('/');
    await expect(page.locator('.magnifier-transition')).toHaveAttribute('data-animated', 'true');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#learning').evaluate(el => window.scrollTo({ top: Math.ceil(scrollY + el.getBoundingClientRect().top), behavior: 'instant' }));
    await expect(page.locator('.magnifier-content')).toHaveCSS('transform', 'none');
    await expect(page.locator('.learning-resources')).toHaveAttribute('data-scroll-focus', 'true');
    const stage = page.locator('.learning-stage');
    const initialY = (await stage.boundingBox())!.y;
    for (let index = 0; index < 4; index++) {
      await page.locator('.learning-track').evaluate((el, index) => {
        const stage = el.firstElementChild as HTMLElement;
        window.scrollTo({
          top: Math.ceil(scrollY + el.getBoundingClientRect().top - parseFloat(getComputedStyle(stage).top) + index / 3 * (el.clientHeight - stage.clientHeight)),
          behavior: 'instant',
        });
      }, index);
      await expect(page.locator('.learning-card').nth(index)).toHaveAttribute('data-focused', 'true');
      const bounds = (await stage.boundingBox())!;
      expect(Math.abs(bounds.y - initialY)).toBeLessThan(2);
      const nav = (await page.locator('header[role="banner"]').boundingBox())!;
      expect(bounds.y - nav.y - nav.height).toBeGreaterThanOrEqual(32);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 30);
      for (const card of await page.locator('.learning-card').all()) {
        const box = (await card.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(40);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 40);
        await expect(card).toBeInViewport({ ratio: 0.999 });
      }
    }
    // Scrolling updates focus but does not change the destination of other cards.
    await page.locator('.learning-card[href="/articles"]').click();
    await expect(page).toHaveURL(/\/articles$/);
  });
}

test('enlarged text releases pinning instead of clipping cards', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 });
    Object.defineProperty(navigator, 'deviceMemory', { value: 8 });
  });
  await page.goto('/');
  await expect(page.locator('.learning-resources')).toHaveAttribute('data-scroll-focus', 'true');
  await page.addStyleTag({ content: '.learning-card p { font-size: 32px !important; }' });
  await expect(page.locator('.learning-resources')).toHaveAttribute('data-scroll-focus', 'false');
  await expect(page.locator('.learning-stage')).toHaveCSS('position', 'static');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.learning-card[href="/practice"]').click();
  await expect(page).toHaveURL(/\/practice$/);
});
