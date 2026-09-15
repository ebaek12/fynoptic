import { test, expect, type Page } from '@playwright/test';

// Phase 7 gate (implementation plan, "Rack focus section"): the
// courses→articles→flashcards→practice scroll-focus section. RackFocus.tsx
// renders three modes — the pinned rack track (default, ≥900px, motion
// allowed), and a static tab set for reduced-motion and narrow (<900px)
// viewports. This section is scoped by `[aria-labelledby="rack-heading"]` to
// avoid colliding with the hero's own `role="tab"` checkout ticket
// (Ticket.tsx), which also lives on '/'.

const RACK_SECTION = 'section[aria-labelledby="rack-heading"]';

/**
 * Land at the learning section after its magnifier introduction.
 */
async function hydrateTrack(page: Page) {
  await page.goto('/');
  await revealLearning(page);
  await page.waitForSelector('[data-rack-track]', { timeout: 8000 });
}

async function revealLearning(page: Page) {
  await expect(page.locator('.magnifier-transition')).toHaveAttribute('data-animated', 'true');
  await page.locator('#learning').evaluate((el) => window.scrollTo({
    top: Math.ceil(scrollY + el.getBoundingClientRect().top),
    behavior: 'instant',
  }));
  await expect(page.locator('.magnifier-experience')).toHaveAttribute('data-phase', 'complete');
}

/**
 * Sets scroll position to a given fraction (0..1) of the pinned track's
 * scrollable range, mirroring RackFocus's own `useTrackProgress` /
 * `scrollToItem` math, starting only at the panel's centred sticky position.
 *
 * The denominator used to be `trackHeight - viewportHeight`, matching what
 * the component did at the time. That was the bug: the pinned block is
 * shorter than the viewport (it starts below the fixed header), so dividing
 * by the viewport made progress saturate before the track released and left
 * dead scroll at the bottom of the section. The component now divides by the
 * distance the pinned block can actually travel, and this helper follows it —
 * measured off the sticky element rather than hardcoded, so it can't drift
 * from the component's own sizing again.
 */
async function scrollToTrackFraction(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const track = document.querySelector('[data-rack-track]') as HTMLElement | null;
    if (!track) return;
    const pin = track.firstElementChild as HTMLElement | null;
    const pinTop = pin ? parseFloat(getComputedStyle(pin).top) : 0;
    const rect = track.getBoundingClientRect();
    const pinStartDoc = window.scrollY + rect.top - pinTop;
    const pinH = pin?.offsetHeight ?? window.innerHeight;
    const denom = Math.max(1, track.offsetHeight - pinH);
    window.scrollTo({ top: pinStartDoc + f * denom, behavior: 'instant' });
  }, fraction);
  // rAF-throttled progress update (useTrackProgress) plus one paint.
  await page.waitForTimeout(150);
}

/** Reads each name button's computed opacity and derives its defocus amount `d`. RackTrack sets `opacity = 1 - d * 0.5`, so `d = 2 * (1 - opacity)`. */
async function readNameDefocus(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-rack-name]'));
    return buttons.map((b) => 2 * (1 - parseFloat(getComputedStyle(b).opacity)));
  });
}

for (const height of [700, 900, 1200]) {
  test(`panel reaches the centre before cycling and stays centred at ${height}px tall`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height });
    await hydrateTrack(page);
    const approach = await page.locator('[data-rack-track]').evaluate(track => {
      const pin = track.firstElementChild as HTMLElement;
      const top = parseFloat(getComputedStyle(pin).top);
      return { distance: pin.getBoundingClientRect().top - top, start: scrollY + track.getBoundingClientRect().top - top };
    });
    expect(approach.distance).toBeGreaterThan(30);
    expect((await readNameDefocus(page))[0]).toBe(0);
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), approach.start - 12);
    expect((await readNameDefocus(page))[0]).toBe(0);
    for (const fraction of [0, 0.35, 0.7, 1]) {
      await scrollToTrackFraction(page, fraction);
      const alignment = await page.locator('[data-rack-stage]').evaluate(stage => {
        const bounds = stage.getBoundingClientRect();
        const headerHeight = document.querySelector('header[role="banner"]')!.getBoundingClientRect().height;
        return { centre: bounds.top + bounds.height / 2, target: (innerHeight + headerHeight) / 2 };
      });
      expect(Math.abs(alignment.centre - alignment.target)).toBeLessThan(2);
    }
    await page.screenshot({ path: `/tmp/fynoptic-centred-rack-${height}.png` });
  });
}

test.describe('rack focus section — pinned track', () => {
  test('focus position sampled at 11 scroll fractions is monotonic 0->3 with dwell plateaus at each integer', async ({
    page,
  }) => {
    await hydrateTrack(page);

    const samples: { focusIndex: number; d: number }[] = [];
    for (let i = 0; i <= 10; i++) {
      const fraction = i / 10;
      await scrollToTrackFraction(page, fraction);
      const ds = await readNameDefocus(page);
      const minD = Math.min(...ds);
      samples.push({ focusIndex: ds.indexOf(minD), d: minD });
    }

    // Monotonic, non-decreasing.
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!.focusIndex).toBeGreaterThanOrEqual(samples[i - 1]!.focusIndex);
    }
    expect(samples[0]!.focusIndex).toBe(0);
    expect(samples[samples.length - 1]!.focusIndex).toBe(3);

    // Dwell plateaus: every one of the 4 items is fully in focus (d ~ 0,
    // i.e. dwellEase at rest) at some sampled fraction, not just crossed
    // through mid-transition.
    const fullyFocused = new Set(samples.filter((s) => s.d < 0.05).map((s) => s.focusIndex));
    expect(fullyFocused).toEqual(new Set([0, 1, 2, 3]));
  });

  test('click-to-jump lands inside the dwell plateau for every item', async ({ page }) => {
    await hydrateTrack(page);
    const names = page.locator(RACK_SECTION).locator('[data-rack-name]');
    await expect(names).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      await names.nth(i).click();
      await page.waitForTimeout(700); // smooth-scroll settle
      const ds = await readNameDefocus(page);
      expect(ds[i]).toBeLessThan(0.05);
    }
  });

  test('keyboard traverses names, forward, backward, and wrapping', async ({ page }) => {
    await hydrateTrack(page);
    const names = page.locator(RACK_SECTION).locator('[data-rack-name]');

    await names.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(700);
    await expect(names.nth(1)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    await expect(names.nth(2)).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(700);
    await expect(names.nth(1)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(700);
    await expect(names.nth(0)).toBeFocused();

    // Wraps at the ends.
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(700);
    await expect(names.nth(3)).toBeFocused();
  });

  test('at most 2 panels are ever mounted, and exactly 1 while dwelling', async ({ page }) => {
    await hydrateTrack(page);

    const fractions = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    for (const fraction of fractions) {
      await scrollToTrackFraction(page, fraction);
      const counts = await page.evaluate(() => ({
        names: document.querySelectorAll('[data-rack-name]').length,
        panels: document.querySelectorAll('[data-rack-panel]').length,
      }));
      expect(counts.names).toBe(4);
      expect(counts.panels).toBeLessThanOrEqual(2);
    }

    // 0.05 sits well inside item 0's dwell plateau (mathematically, focus
    // stays exactly 0 for any overall progress <= 0.1 with 3 segments) —
    // comfortably clear of the segment boundary at fraction 0 itself, where
    // real-world scroll/rAF rounding can tip `crossFrac` a hair above zero
    // and mount a second, all-but-invisible panel. Confirms the "only the
    // low panel exists while dwelling" claim without being sensitive to that
    // rounding. Polled (rather than a single fixed wait) because the
    // rAF-throttled progress update can lag further behind under the full
    // suite's ~9 concurrent workers than it does running this file alone.
    await scrollToTrackFraction(page, 0.05);
    await expect
      .poll(() => page.evaluate(() => document.querySelectorAll('[data-rack-panel]').length), {
        timeout: 5000,
      })
      .toBe(1);
  });

  test('pin releases after Practice and the footer is reachable', async ({ page }) => {
    await hydrateTrack(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toBeInViewport();
  });
});

const destinations = ['/courses', '/articles', '/flashcard', '/practice'];

for (const mode of ['reduced', 'save-data', 'no-js'] as const) {
  test(`${mode}: all four resource cards remain readable and navigate`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
      javaScriptEnabled: mode !== 'no-js',
    });
    await context.addInitScript((mode) => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 });
      Object.defineProperty(navigator, 'deviceMemory', { value: 4 });
      Object.defineProperty(navigator, 'connection', { value: Object.assign(new EventTarget(), { saveData: mode === 'save-data' }) });
    }, mode);
    const page = await context.newPage();
    if (mode === 'reduced') {
      const session = await context.newCDPSession(page);
      await session.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    }
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const href of destinations) {
      await page.goto(`${test.info().project.use.baseURL}/`);
      await expect(page.locator('.magnifier-transition')).toBeHidden();
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
      await page.emulateMedia({ reducedMotion: 'reduce' });
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
  await page.locator('#learning a[href="/courses"]').click();
  await expect(page).toHaveURL(/\/courses$/);
});


for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`normal motion keeps the original carousel running at ${viewport.width}px, even with low hardware estimates`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 });
      Object.defineProperty(navigator, 'deviceMemory', { value: 2 });
    });
    await page.goto('/');
    await expect(page.locator('.partners')).toHaveAttribute('data-motion', 'full');
    const track = page.locator('.logo-track');
    await expect(track).toHaveCSS('animation-name', 'logo-scroll');
    await expect(page.locator('.partner-set')).toHaveCount(2);
    const start = await track.evaluate(el => getComputedStyle(el).transform);
    await expect.poll(() => track.evaluate(el => getComputedStyle(el).transform)).not.toBe(start);
    await expect(page.locator('.magnifier-transition')).toHaveAttribute('data-animated', 'true');
    if (viewport.width >= 900) await expect(page.locator('[data-rack-track]')).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.partners')).toHaveAttribute('data-motion', 'reduced');
    await expect(track).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.logo-card:visible')).toHaveCount(6);
    await expect(page.locator('.learning-card')).toHaveCount(4);
    await expect(page.locator('[data-rack-track]')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('.partners')).toHaveAttribute('data-motion', 'full');
    await expect(track).toHaveCSS('animation-name', 'logo-scroll');
  });
}

test('the original carousel pauses for mouse and keyboard interaction', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.partners')).toHaveAttribute('data-motion', 'full');
  await page.locator('.logo-ticker').hover();
  await expect(page.locator('.logo-track')).toHaveCSS('animation-play-state', 'paused');
  await page.mouse.move(0, 0);
  await page.locator('.partner-set:not([aria-hidden]) a').first().focus();
  await expect(page.locator('.logo-track')).toHaveCSS('animation-play-state', 'paused');
});

for (const [index, href] of destinations.entries()) {
  test(`the whole animated resource card navigates to ${href}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await hydrateTrack(page);
    await page.locator('[data-rack-name]').nth(index).click();
    const card = page.locator('[data-rack-card]');
    await expect(card).toHaveAttribute('href', href);
    await expect(page.locator('[data-rack-panel]')).toHaveCSS('opacity', '1');
    await card.locator('p').click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
}

for (const viewport of [{ width: 900, height: 700 }, { width: 1366, height: 768 }]) {
  test(`the restored rack has room below navigation and fits at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await hydrateTrack(page);
    const heading = (await page.locator('#rack-heading').boundingBox())!;
    const nav = (await page.locator('header[role="banner"]').boundingBox())!;
    expect(heading.y - nav.y - nav.height).toBeGreaterThanOrEqual(32);
    const card = (await page.locator('[data-rack-card]').boundingBox())!;
    expect(card.y + card.height).toBeLessThanOrEqual(viewport.height - 32);
    expect(card.x + card.width).toBeLessThanOrEqual(viewport.width - 32);
  });
}
