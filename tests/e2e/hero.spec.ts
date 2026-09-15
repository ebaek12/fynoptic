import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The shadcn Button (`asChild`) merges `data-slot="button"` onto the
// rendered <a> (see src/components/ui/button.tsx + the legacy.css commit
// that keys off this same attribute). The homepage header nav also has an
// `<a href="/courses">Start the Free Course</a>` (desktop AND mobile menu
// copies, in src/components/shell/Nav.tsx), so `a[href="/courses"]` alone is
// ambiguous in strict mode. Scoping to `[data-slot="button"]` selects only
// the hero's shadcn-rendered CTA.
const PRIMARY_CTA_SELECTOR = 'a[data-slot="button"][href="/courses"]';

test.describe("homepage hero", () => {
  test("renders the headline with a rotating word and correct CTAs", async ({
    page,
  }) => {
    await page.goto("/");

    const heading = page.locator("#hero-heading");
    await expect(heading).toContainText("Learn the skills to");

    // No promo pill/badge above the headline. The original 21st.dev
    // reference component had an "Anouncing our latest..." pill, but that
    // text was never actually present on this site (confirmed in Task 1's
    // ground-truth findings), so asserting its absence tests nothing real.
    // Instead, guard against ever reintroducing a pill/badge element in the
    // hero region, using the class patterns this codebase already uses for
    // pills/badges elsewhere (.badge, .pill-toggle, etc.) — this matches
    // Task 10's manual checklist item "No pill/badge above the headline."
    await expect(
      page.locator(
        'section.hero [class*="pill"], section.hero [class*="badge"]',
      ),
    ).toHaveCount(0);

    const primaryCta = page.locator(PRIMARY_CTA_SELECTOR, {
      hasText: "Start the Free Course",
    });
    const secondaryCta = page.locator('a[href="/practice"]', {
      hasText: "Try Practice Mode",
    });
    await expect(primaryCta).toBeVisible();
    await expect(secondaryCta).toBeVisible();
  });

  test("headline renders in the Helvetica stack, not the sitewide Spectral display face", async ({
    page,
  }) => {
    // This session hit three separate cascade bugs getting this one property
    // right (redesign.css's sitewide `h1 { font-family: var(--display-face)
    // !important }` beats a plain inline style; the fix landed as a Tailwind
    // `!`-important utility instead). Guard the actual computed value so a
    // future cascade/layer change can't silently regress it back to Spectral.
    await page.goto("/");
    const fontFamily = await page
      .locator("#hero-heading")
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily).toContain("Helvetica");
  });

  test("subhead renders in Inter, not the display face", async ({ page }) => {
    // Phase 3 gate: the hero subhead is body copy, not a heading, so it
    // should never pick up --display-face/--editorial-face regardless of
    // which font backs those tokens.
    await page.goto("/");
    const fontFamily = await page
      .locator(".home-hero-description")
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily).toContain("Inter");
  });

  test("subhead uses the muted-foreground token, not a stale legacy color", async ({
    page,
  }) => {
    // The subhead used to carry the legacy `.hero-sub` classname, whose
    // unlayered `!important` color rule silently beat this Tailwind
    // `text-muted-foreground` utility the same way the headline's utilities
    // were beaten before they got the `!` treatment. Fixed by dropping the
    // legacy class instead. Guard the real computed value so it can't
    // silently regress back to the old --text-300 color.
    await page.goto("/");
    const color = await page
      .locator(".home-hero-description")
      .evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(80, 96, 124)"); // Light-mode --muted-fg (#50607C)
  });

  test("rotates through all five words, exactly one visible at a time", async ({
    page,
  }) => {
    // Rewritten for the odometer rewrite (Phase 6, F11): the old locator did
    // `page.locator('#hero-heading span').filter(...).first()`, which read
    // DOM presence rather than rendered visibility. That was already
    // fragile — it happened to work because the live word's span preceded
    // the odometer's other spans in document order — but the odometer now
    // measures every word from a set of `aria-hidden`, `invisible` clone
    // spans that stay mounted at all times (so widths can be measured
    // without a layout flash), so a DOM-presence check on '#hero-heading
    // span' would trivially find text for every word simultaneously and
    // prove nothing. This asserts the actual guarantee: at any instant, at
    // most one span whose own text is a candidate word is *visible*
    // (`:visible` — Playwright's pseudo-class, which honors
    // `visibility: hidden`, i.e. Tailwind's `invisible` utility on the
    // clones). The `hasNot: locator('span')` filter keeps only leaf
    // word-spans, excluding the odometer's own wrapping container (which
    // also carries the live word's text as a descendant and would
    // otherwise double-count alongside its inner span).
    await page.goto("/");
    const words = ["scam", "setup", "lie", "con", "trap"];
    const seen = new Set<string>();
    const wordRegex = new RegExp(`^(${words.join("|")})$`);

    const visibleWordSpans = page
      .locator("#hero-heading span:visible")
      .filter({ hasText: wordRegex })
      .filter({ hasNot: page.locator("span") });

    // Same widened polling cadence as before (see the flakiness note this
    // test used to carry): a fixed cadence timed to the 2200ms rotation
    // boundary was flaky under Playwright's parallel workers. One full
    // 5-word, 2200ms cycle is 11s; the margin above that was widened again
    // (14s -> 17s) after Phase 7 wired RackFocus onto this same page — it's
    // a heavier island (framer-motion + a rAF-driven scroll listener), and
    // this test's own page paying for its hydration/paint work under the
    // full suite's ~9 concurrent workers made it slip a cycle at 14s
    // occasionally.
    const deadline = Date.now() + 17_000;
    while (Date.now() < deadline && seen.size < words.length) {
      const visibleTexts = await visibleWordSpans.allTextContents();

      // Never more than one word actually visible — the odometer's
      // AnimatePresence briefly has zero mounted (mode="wait", between an
      // exit finishing and the next entrance starting), but never two.
      expect(visibleTexts.length).toBeLessThanOrEqual(1);

      if (visibleTexts.length === 1) {
        seen.add(visibleTexts[0]!.trim());
      }
      await page.waitForTimeout(300);
    }

    for (const word of words) {
      expect(seen.has(word)).toBe(true);
    }
  });

  for (const width of [1440, 390]) {
    test(`animated words stay intact beside the period at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const words = ["scam", "setup", "lie", "con", "trap"];
      const seen = new Set<string>();
      const deadline = Date.now() + 15_000;

      while (Date.now() < deadline && seen.size < words.length) {
        const sample = await page
          .locator(".rotating-word-frame")
          .evaluateAll((frames) => {
            const frame = frames[0];
            if (!frame || Number(getComputedStyle(frame).opacity) < 0.99)
              return null;
            const text = frame.querySelector(".rotating-word-text")!;
            const suffix = frame.querySelector(".rotating-word-suffix")!;
            const style = getComputedStyle(text);
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d")!;
            context.font = style.font;
            const word = text.textContent!;
            const wordInkRight =
              text.getBoundingClientRect().left +
              context.measureText(word).actualBoundingBoxRight;
            const suffixInkLeft =
              suffix.getBoundingClientRect().left -
              context.measureText(".").actualBoundingBoxLeft;
            return {
              word,
              inkGap: suffixInkLeft - wordInkRight,
              fontSize: parseFloat(style.fontSize),
              fits: frame.getBoundingClientRect().right >= wordInkRight,
            };
          });
        if (sample && words.includes(sample.word)) {
          expect(sample.fits, sample.word).toBe(true);
          expect(sample.inkGap, sample.word).toBeGreaterThanOrEqual(0);
          expect(sample.inkGap, sample.word).toBeLessThan(
            sample.fontSize * 0.2,
          );
          if (
            !seen.has(sample.word) &&
            ["setup", "lie"].includes(sample.word)
          ) {
            await page.locator("#hero-heading").screenshot({
              path: `/tmp/fynoptic-word-${sample.word}-${width}.png`,
            });
          }
          seen.add(sample.word);
        }
        await page.waitForTimeout(100);
      }
      expect([...seen].sort()).toEqual([...words].sort());
    });
  }

  test("freezes on the first word when prefers-reduced-motion is set", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForTimeout(3000); // longer than one rotation interval
    await expect(page.locator("#hero-heading")).toContainText("scam");
  });

  test("CTA buttons have no gradient background", async ({ page }) => {
    await page.goto("/");
    const primaryCta = page.locator(PRIMARY_CTA_SELECTOR, {
      hasText: "Start the Free Course",
    });
    const backgroundImage = await primaryCta.evaluate(
      (el) => getComputedStyle(el).backgroundImage,
    );
    expect(backgroundImage).toBe("none");
  });
});

test("hero content is visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL!);
  await expect(page.locator("#hero-heading")).toBeVisible();
  await expect(page.locator(".home-hero-description")).toBeVisible();
  await expect(page.locator('[data-metric="students"] dd')).toHaveAttribute(
    "aria-label",
    "110,000+",
  );
  await expect(page.locator('[data-metric="students"] dt')).toHaveText(
    "students reached",
  );
  await expect(page.locator(".home-final-cta a")).toHaveAttribute(
    "href",
    "/courses",
  );
  await context.close();
});

for (const theme of ["light", "dark"]) {
  for (const width of [1440, 1024, 768, 390]) {
    test(`hero layout in ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (t) => localStorage.setItem("fynoptic-theme", t),
        theme,
      );
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('[id^="ticket-tab-"]')).toHaveCount(0);
      await expect(page.locator(".home-hero-community")).toHaveCount(0);
      await expect(page.locator('[data-metric="students"] dd')).toHaveAttribute(
        "aria-label",
        "110,000+",
      );
      await expect(
        page.locator('[data-metric="curricula"] dd'),
      ).toHaveAttribute("aria-label", "5");
      await expect(
        page
          .locator(".home-hero")
          .getByRole("img", { name: "Invesco", exact: true }),
      ).toHaveCount(1);
      const heading = await page.locator("#hero-heading").boundingBox();
      const details = await page.locator(".home-hero-details").boundingBox();
      const partners = await page.locator(".partners").boundingBox();
      const illustration = await page
        .locator(".scam-illustration")
        .boundingBox();
      expect(details!.y).toBeGreaterThan(heading!.y + heading!.height);
      expect(illustration!.y).toBeGreaterThan(heading!.y + heading!.height);
      expect(illustration!.x).toBeGreaterThanOrEqual(heading!.x);
      expect(illustration!.x + illustration!.width).toBeLessThanOrEqual(
        heading!.x + heading!.width + 1,
      );
      expect(partners!.y).toBeGreaterThan(details!.y + details!.height);
      expect(partners!.width).toBeCloseTo(heading!.width, 0);
      if (width === 1440) {
        const size = await page
          .locator("#hero-heading")
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(size).toBeGreaterThan(100);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: `/tmp/fynoptic-new-hero-${theme}-${width}.png`,
      });
      const audit = await new AxeBuilder({ page })
        .include(".home-hero")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    });
  }
}

test("reduced motion displays all six logos without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".logo-track")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".logo-card:visible")).toHaveCount(6);
  for (const logo of await page.locator(".logo-card:visible").all()) {
    await logo.scrollIntoViewIfNeeded();
    await expect(logo).toBeInViewport();
  }
});

test("magnifying glass responds to scroll without shifting the heading or illustration", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const lens = page.locator(".scan-lens");
  await expect(lens).toHaveAttribute("transform", "translate(0 0)");
  const headingBefore = await page.locator("#hero-heading").boundingBox();
  const illustrationBefore = await page
    .locator(".scam-illustration")
    .boundingBox();
  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(lens).not.toHaveAttribute("transform", "translate(0 0)");
  const headingAfter = await page.locator("#hero-heading").boundingBox();
  const illustrationAfter = await page
    .locator(".scam-illustration")
    .boundingBox();
  expect(headingAfter!.height).toBeCloseTo(headingBefore!.height, 0);
  expect(headingAfter!.y + 200).toBeCloseTo(headingBefore!.y, 0);
  expect(illustrationAfter!.y + 200).toBeCloseTo(illustrationBefore!.y, 0);
  await page
    .locator(".scam-illustration")
    .screenshot({ path: "/tmp/fynoptic-scan-scrolled.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(lens).toHaveAttribute("transform", "translate(0 0)");
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect(lens).toHaveAttribute("transform", "translate(0 0)");
});
