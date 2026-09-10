import { expect, test, type Page } from "@playwright/test";

async function settledLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

async function expectCompactSetup(page: Page) {
  await page.locator(".study-heading h2").waitFor();
  await settledLayout(page);
  const gap = await page.evaluate(() => {
    const panel = document
      .querySelector(".study-panel")!
      .getBoundingClientRect();
    const heading = document
      .querySelector(".study-heading h2")!
      .getBoundingClientRect();
    return heading.top - panel.top;
  });
  // Catches the global section padding that previously added an extra 80px.
  expect(gap).toBeGreaterThanOrEqual(12);
  expect(gap).toBeLessThanOrEqual(24);
}

async function expectSessionInView(page: Page) {
  await settledLayout(page);
  const layout = await page.evaluate(() => {
    const header = document.querySelector(".header")!.getBoundingClientRect();
    const selectors = [
      ".study-session",
      ".session-progress",
      ".session-navigation",
      ".session-metrics",
    ];
    if (document.querySelector("#feedback:not([hidden])"))
      selectors.push("#feedback");
    return {
      height: innerHeight,
      width: innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      headerBottom: header.bottom,
      sessionHeight: document
        .querySelector(".study-session")!
        .getBoundingClientRect().height,
      sessionWidth: document
        .querySelector(".study-session")!
        .getBoundingClientRect().width,
      bounds: selectors.map((selector) => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return { selector, top: box.top, bottom: box.bottom };
      }),
    };
  });
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.width);
  // The session should use the available screen, not just stay below its limit.
  expect(layout.sessionHeight).toBeGreaterThanOrEqual(
    (layout.height - layout.headerBottom) * 0.9,
  );
  expect(layout.sessionWidth).toBeGreaterThanOrEqual(
    Math.min(1280, layout.width - 120),
  );
  for (const box of layout.bounds) {
    expect(box.top, `${box.selector} below the navbar`).toBeGreaterThanOrEqual(
      layout.headerBottom,
    );
    expect(box.bottom, `${box.selector} within the screen`).toBeLessThanOrEqual(
      layout.height - 8,
    );
  }
}

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 700 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    for (const mode of ["mc", "fitb"] as const) {
      test(`flashcard setup and ${mode} controls fit without page scrolling`, async ({
        page,
      }) => {
        await page.goto("/flashcard");
        await expectCompactSetup(page);
        await page.locator("#unit-list .study-topic").first().click();
        await page.locator("#confirm-units").click();
        await expectCompactSetup(page);
        if (mode === "fitb")
          await page
            .locator("label.study-mode", { hasText: "Fill in the Blank" })
            .click();
        await page.locator("#start-btn-big").click();
        await page.locator(".study-session").waitFor();
        await expectSessionInView(page);

        if (mode === "mc") {
          // Long definition choices must retain visible progress, feedback and navigation.
          await page.locator("#mc-toggle-answer").click();
          await page.locator(".mc-option").first().click();
          await page.locator("#submit-btn").click();
        } else {
          await page.locator("#fitb-input").fill("An incorrect answer");
          await page.locator("#fitb-input").press("Enter");
        }
        await expect(page.locator("#feedback")).toBeVisible();
        await expectSessionInView(page);
        await page.locator("#next-btn").click();
        await expectSessionInView(page);
        expect(
          await page
            .locator(".session-workspace")
            .evaluate((node) => node.scrollTop),
        ).toBe(0);
      });
    }

    test("practice setup, feedback and navigation fit without page scrolling", async ({
      page,
    }) => {
      await page.goto("/practice");
      await expectCompactSetup(page);
      await page.locator("#wiz-next-1").click();
      await expectCompactSetup(page);
      await page.locator("#topics-select-all").click();
      await page.locator("#start-btn").click();
      await page.locator(".study-session").waitFor();
      await expectSessionInView(page);
      await page.locator(".mc-option").first().click();
      await page.locator("#submit-btn").click();
      await expect(page.locator("#feedback")).toBeVisible();
      await expectSessionInView(page);
      await page.locator("#next-btn").click();
      await expectSessionInView(page);
      expect(
        await page
          .locator(".session-workspace")
          .evaluate((node) => node.scrollTop),
      ).toBe(0);
    });
  });
}
