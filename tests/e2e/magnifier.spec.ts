import { test, expect, type Page } from "@playwright/test";

async function scrollDive(page: Page, progress: number) {
  await page.locator(".magnifier-transition").evaluate((section, fraction) => {
    const pin = section.querySelector(".magnifier-pin")!;
    const start = scrollY + section.getBoundingClientRect().top;
    window.scrollTo({
      top: start + fraction * (section.clientHeight - pin.clientHeight),
      behavior: "instant",
    });
  }, progress);
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`magnifier fills the screen, reverses, and releases to learning at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(
      page.getByText("Scroll to see the bigger picture"),
    ).toHaveCount(0);
    await expect(page.locator(".magnifier-transition")).toHaveAttribute(
      "data-animated",
      "true",
    );
    const order = await page.evaluate(() => {
      const partners = document
        .querySelector(".partners")!
        .getBoundingClientRect();
      const transition = document
        .querySelector(".magnifier-transition")!
        .getBoundingClientRect();
      const learning = document
        .querySelector("#learning")!
        .getBoundingClientRect();
      const pin = document.querySelector(".magnifier-pin")!;
      return (
        partners.bottom <= transition.top &&
        Math.abs(transition.bottom - pin.clientHeight - learning.top) < 1
      );
    });
    expect(order).toBe(true);

    await scrollDive(page, 0);
    const lens = page.locator(".magnifier-lens");
    const initial = (await lens.boundingBox())!.width;
    await scrollDive(page, 0.5);
    await expect
      .poll(async () => (await lens.boundingBox())!.width)
      .toBeGreaterThan(initial * 1.4);
    expect((await page.locator(".magnifier-pin").boundingBox())!.y).toBeCloseTo(
      0,
      0,
    );
    await expect(page.locator(".magnifier-portal")).toHaveCSS(
      "visibility",
      "visible",
    );
    const header = page.locator('header[role="banner"]');
    await expect(header).toHaveCount(1);
    await expect(header).toHaveAttribute("data-magnifying", "true");
    const smallNavWidth = (await header.boundingBox())!.width;
    expect(smallNavWidth).toBeLessThan(viewport.width * 0.6);
    await expect(header).toHaveCSS("opacity", "1");
    const courseLink = page.locator('#learning a[href="/courses"]');
    const finePrintWidth = await courseLink.evaluate(
      (el) => el.getBoundingClientRect().width,
    );
    await page.screenshot({
      path: `/tmp/fynoptic-magnifier-mid-${viewport.width}.png`,
    });

    await scrollDive(page, 0.99);
    await expect
      .poll(() =>
        page
          .locator(".magnifier-content")
          .evaluate(
            (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
          ),
      )
      .toBeGreaterThan(0.97);
    const beforeLanding = await page.locator("#rack-heading").evaluate((el) => {
      const content = document.querySelector(".magnifier-content")!;
      const scale = new DOMMatrixReadOnly(getComputedStyle(content).transform)
        .a;
      return {
        // Remove just the intended zoom to detect a position jump at docking.
        y:
          (el.getBoundingClientRect().y - innerHeight / 2) / scale +
          innerHeight / 2,
        documentHeight: document.documentElement.scrollHeight,
      };
    });
    const navBeforeLanding = await header.evaluate((el) => {
      const scale = new DOMMatrixReadOnly(getComputedStyle(el).transform).a;
      const bounds = el.getBoundingClientRect();
      return {
        x: (bounds.x - innerWidth / 2) / scale + innerWidth / 2,
        y: (bounds.y - innerHeight / 2) / scale + innerHeight / 2,
      };
    });

    await scrollDive(page, 1);
    // The last pixel must also dock: native scroll and fractional layout
    // bounds do not necessarily round to the same endpoint.
    await page.evaluate(() => scrollBy({ top: -1, behavior: "instant" }));
    // All four viewport corners must be INSIDE the opaque circular lens,
    // not just inside the larger SVG rectangle or its ring.
    await expect
      .poll(async () =>
        lens.evaluate((el) => {
          const bounds = el.getBoundingClientRect();
          const cx = bounds.x + bounds.width / 2;
          const cy = bounds.y + bounds.height / 2;
          return [
            [0, 0],
            [innerWidth, 0],
            [0, innerHeight],
            [innerWidth, innerHeight],
          ].every(
            ([x, y]) => Math.hypot(x! - cx, y! - cy) < bounds.width / 2 - 2,
          );
        }),
      )
      .toBe(true);
    await expect(page.locator(".magnifier-experience")).toHaveAttribute(
      "data-phase",
      "complete",
    );
    await expect(page.locator(".magnifier-content")).toHaveCSS(
      "transform",
      "none",
    );
    await expect(header).not.toHaveAttribute("data-magnifying", "true");
    await expect(header).toHaveCSS("opacity", "1");
    await expect(header).not.toHaveAttribute("inert");
    const fullNav = (await header.boundingBox())!;
    expect(Math.abs(fullNav.x - navBeforeLanding.x)).toBeLessThan(2);
    expect(Math.abs(fullNav.y - navBeforeLanding.y)).toBeLessThan(2);
    expect(
      Math.abs(
        (await page.locator("#rack-heading").boundingBox())!.y -
          beforeLanding.y,
      ),
    ).toBeLessThan(2);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBe(beforeLanding.documentHeight);
    await expect(
      page.getByRole("link", { name: "Explore Courses", exact: true }),
    ).toBeInViewport();
    expect(
      await courseLink.evaluate((el) => el.getBoundingClientRect().width),
    ).toBeGreaterThan(finePrintWidth * 1.5);
    expect(
      await page
        .locator(".magnifier-portal")
        .evaluate((el) => el.hasAttribute("inert")),
    ).toBe(false);
    const handoffPaint = await page.evaluate(() => {
      const lens = getComputedStyle(document.querySelector(".magnifier-lens")!);
      const learning = getComputedStyle(document.querySelector("#learning")!);
      return {
        lens: lens.fill,
        nextSection: learning.backgroundColor,
        opacity: lens.fillOpacity,
      };
    });
    expect(handoffPaint.lens).toBe(handoffPaint.nextSection);
    expect(handoffPaint.opacity).toBe("1");
    await page.screenshot({
      path: `/tmp/fynoptic-magnifier-full-${viewport.width}.png`,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);

    // The revealed section is already live at the end, without another scroll
    // to find it or a second copy of the heading/controls being swapped in.
    await expect(page.locator("#rack-heading")).toHaveCount(1);
    await page
      .getByRole(viewport.width < 900 ? "tab" : "button", {
        name: "Practice",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("link", { name: "Explore Practice", exact: true }),
    ).toBeInViewport();

    await scrollDive(page, 0);
    await expect
      .poll(async () => (await lens.boundingBox())!.width)
      .toBeLessThan(initial + 2);
    await page.screenshot({
      path: `/tmp/fynoptic-magnifier-start-${viewport.width}.png`,
    });
    // Partner logos now link to their official sites. The skip link follows
    // the last real partner; the duplicated marquee links stay out of Tab order.
    await page.locator('.partner-set:not([aria-hidden]) a').last().focus();
    await page.keyboard.press("Tab");
    await expect(page.locator(".magnifier-skip")).toBeFocused();
    await expect(page.locator(".magnifier-skip")).toHaveCSS("opacity", "1");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#learning$/);
    await expect(
      page.getByRole("link", {
        name: viewport.width < 900 ? "Explore Practice" : "Explore Courses",
        exact: true,
      }),
    ).toBeInViewport();
    expect(errors).toEqual([]);
  });
}

test("reduced motion removes zoom and the long scroll runway, including a live preference change", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".magnifier-transition")).toHaveAttribute(
    "data-animated",
    "true",
  );
  await scrollDive(page, 0.8);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 2400);
  await expect(page.locator(".magnifier-experience")).toHaveAttribute(
    "data-settling",
    "true",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".magnifier-experience")).not.toHaveAttribute(
    "data-settling",
  );
  await expect(page.locator(".magnifier-transition")).not.toHaveAttribute(
    "data-animated",
    "true",
  );
  expect(
    await page
      .locator(".magnifier-transition")
      .evaluate((el) => el.clientHeight <= innerHeight),
  ).toBe(true);
  await expect(page.locator(".magnifier-pin")).toHaveCSS(
    "position",
    "relative",
  );
  await expect(page.locator("[data-rack-track]")).toHaveCount(0);
  await expect(page.locator('#learning [role="tab"]')).toHaveCount(4);
  await expect(page.locator('header[role="banner"]')).not.toHaveAttribute(
    "inert",
  );
  await expect(page.locator('header[role="banner"]')).not.toHaveAttribute(
    "data-magnifying",
    "true",
  );
  await page.locator("#learning").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("link", { name: "Explore Courses", exact: true }),
  ).toBeVisible();
});

test("without JavaScript the illustration and learning content stay in normal flow", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL!);
  await expect(page.locator(".magnifier-pin")).toHaveCSS(
    "position",
    "relative",
  );
  expect(
    await page
      .locator(".magnifier-transition")
      .evaluate((el) => el.clientHeight <= innerHeight),
  ).toBe(true);
  await expect(
    page.getByRole("link", { name: "Explore Courses", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("fast wheel momentum lands on Courses briefly, then lets scrolling continue", async ({
  page,
}) => {
  await page.goto("/");
  const experience = page.locator(".magnifier-experience");
  await expect(experience).toHaveAttribute("data-animated", "true");
  // A single large fling from the carousel must not skip the whole intro.
  await scrollDive(page, -0.1);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 2800);
  await expect(experience).toHaveAttribute("data-settling", "true");
  const landingY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 1400);
  expect(await page.evaluate(() => scrollY)).toBe(landingY);
  await expect(experience).toHaveAttribute("data-phase", "complete");
  await expect(
    page.getByRole("link", { name: "Explore Courses", exact: true }),
  ).toBeInViewport();
  await expect(page.locator(".magnifier-content")).toHaveCSS(
    "transform",
    "none",
  );
  await expect(experience).not.toHaveAttribute("data-settling");
  await page.mouse.wheel(0, 650);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(landingY + 300);
});

test("the landing yields immediately to reverse scrolling and keyboard navigation", async ({
  page,
}) => {
  await page.goto("/");
  const experience = page.locator(".magnifier-experience");
  await expect(experience).toHaveAttribute("data-animated", "true");
  await scrollDive(page, 0.8);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 2000);
  await expect(experience).toHaveAttribute("data-settling", "true");
  const landingY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -300);
  await expect(experience).not.toHaveAttribute("data-settling");
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeLessThan(landingY - 100);

  // Returning above the whole intro arms one new landing; End can always leave.
  await scrollDive(page, -0.1);
  await expect(experience).toHaveAttribute("data-phase", "before");
  await scrollDive(page, 0.8);
  await page.mouse.wheel(0, 2000);
  await expect(experience).toHaveAttribute("data-settling", "true");
  await page.keyboard.press("End");
  await expect(experience).not.toHaveAttribute("data-settling");
  await expect(page.locator("footer")).toBeInViewport();
});

test("a mobile swipe lands on the first learning panel and releases without a scroll lock", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL!);
  const experience = page.locator(".magnifier-experience");
  await expect(experience).toHaveAttribute("data-animated", "true");
  await scrollDive(page, 0.9);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 720 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 190, y: 620 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 190, y: 150 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(experience).toHaveAttribute("data-settling", "true");
  await expect(experience).toHaveAttribute("data-phase", "complete");
  await expect(
    page.getByRole("link", { name: "Explore Courses", exact: true }),
  ).toBeInViewport();
  await expect(experience).not.toHaveAttribute("data-settling");
  const landingY = await page.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 720 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 190, y: 250 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(landingY + 100);
  await context.close();
});
