import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const theme of ["light", "dark"]) {
  for (const width of [1440, 390]) {
    test(`account screens at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (t) => localStorage.setItem("fynoptic-theme", t),
        theme,
      );
      await page.goto("/");
      await page.locator("#user-btn").click();
      await page.screenshot({
        path: `/tmp/fynoptic-signin-${theme}-${width}.png`,
      });
      let result = await new AxeBuilder({ page })
        .include("#auth-modal")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      await page.getByRole("tab", { name: "Sign up" }).click();
      await page
        .locator("#signup-email")
        .fill(`design-${Date.now()}-${width}-${theme}@example.com`);
      await page.locator("#signup-password").fill("correct-password-123");
      await page.locator("#signup-confirm").fill("correct-password-123");
      await page.locator("#signup-submit").click();
      await expect(page.locator("#auth-modal")).toBeHidden();
      await page.goto("/profile");
      await expect(page.locator("#input-name")).toBeVisible();
      await page.locator("#input-name").fill("Taylor Morgan");
      await page.locator("#settings-submit").click();
      await expect(page.locator("#prof-name")).toHaveText("Taylor Morgan");
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `/tmp/fynoptic-profile-${theme}-${width}.png`,
        fullPage: true,
      });
      result = await new AxeBuilder({ page })
        .include(".account-page")
        .withTags(["wcag2a", "wcag2aa"])
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
      await page.goto("/courses");
      await page.screenshot({
        path: `/tmp/fynoptic-courses-${theme}-${width}.png`,
        fullPage: true,
      });
      await expect(page.locator(".library-card")).toHaveCount(8);
      await expect(page.locator(".library-card--locked")).toHaveCount(7);
      const heights = await page
        .locator(".library-card")
        .evaluateAll((cards) =>
          cards.map((card) => card.getBoundingClientRect().height),
        );
      if (width > 600)
        expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
      result = await new AxeBuilder({ page })
        .include(".course-library")
        .withTags(["wcag2a", "wcag2aa"])
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
      await page.goto("/practice");
      await expect(page.locator("#practice-wizard")).toBeVisible();
      await page.screenshot({
        path: `/tmp/fynoptic-practice-${theme}-${width}.png`,
      });
      expect(
        await page
          .locator(".practice-hero")
          .evaluate((el) => getComputedStyle(el, "::before").content),
      ).toBe("none");
    });
  }
}

test("passwords clear when the dialog closes and pending sign-in locks other methods", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#user-btn").click();
  await page.locator("#login-password").fill("temporary-password");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator("#user-btn").click();
  await expect(page.locator("#login-password")).toHaveValue("");
  await expect(page.locator("#login-password")).toHaveAttribute(
    "type",
    "password",
  );
  await page.route("**/accounts:signInWithPassword*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.locator("#login-email").fill("pending@example.com");
  await page.locator("#login-password").fill("correct-password-123");
  await page.locator("#login-submit").click();
  await expect(page.locator("#login-submit")).toBeDisabled();
  await expect(page.locator("#google-login")).toBeDisabled();
  await expect(page.getByRole("tab", { name: "Sign up" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Forgot your password?" }),
  ).toBeDisabled();
});
