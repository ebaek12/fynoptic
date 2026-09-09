import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  "/",
  "/practice",
  "/flashcard",
  "/articles",
  "/about",
  "/courses",
  "/courseone",
  "/privacy",
  "/accessibility",
  "/articles/bnpl-real-rules",
];

for (const theme of ["light", "dark"]) {
  for (const width of [1440, 390]) {
    test(`page headings share one top gap at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (t) => localStorage.setItem("fynoptic-theme", t),
        theme,
      );
      await page.goto("/practice");
      const practiceHeading = await page.locator("main h1").evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          marginBottom: style.marginBottom,
        };
      });
      for (const path of pages) {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const gap = await page.evaluate(
          () =>
            document.querySelector("main h1")!.getBoundingClientRect().top -
            document.querySelector(".header")!.getBoundingClientRect().bottom,
        );
        expect(gap, path).toBeCloseTo(width > 720 ? 48 : 32, 0);
        const heading = await page.locator("main h1").evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            marginBottom: style.marginBottom,
          };
        });
        if (path !== '/') expect(heading, path).toEqual(practiceHeading);
      }
    });
  }
}

test("new visitors start in light mode and can keep a dark preference", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("#theme-btn")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#theme-btn").click();
  await page.goto("/articles");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
});

for (const [path, selector] of [
  ["/articles", ".controls"],
  ["/courseone", "#pre-quiz-root"],
  ["/practice", "#practice-wizard"],
  ["/courses", ".library-grid"],
]) {
  for (const width of [1440, 390]) {
    test(`${path} controls have readable light-mode colors at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path!);
      await expect(page.locator(selector!)).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (path === "/courseone")
        await page.locator("#pre-quiz-root input").first().check();
      await page
        .locator(selector!)
        .screenshot({ path: testInfo.outputPath("controls.png") });
      const result = await new AxeBuilder({ page })
        .include(selector!)
        .withRules(["color-contrast"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    });
  }
}

test("search placeholder remains readable in light mode", async ({ page }) => {
  await page.goto("/articles");
  const color = await page
    .locator("#search-input")
    .evaluate((el) => getComputedStyle(el, "::placeholder").color);
  expect(color).toBe("rgb(80, 96, 124)");
});
