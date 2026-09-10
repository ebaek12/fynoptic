import { test, expect, type Page } from "@playwright/test";

for (const category of ["Personal Finance", "Economics"]) {
  test(`${category} distributes correct answers and preserves each question's shuffled order`, async ({
    page,
  }) => {
    // A repeatable random stream keeps the test independent of chance.
    await page.addInitScript(() => {
      let seed = 9271;
      Math.random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    });
    await page.goto("/practice");
    await page.locator(".study-bank", { hasText: category }).click();
    await page
      .getByRole("group", { name: "Questions", exact: true })
      .getByRole("button", { name: "10", exact: true })
      .click();
    await page.locator("#wiz-next-1").click();
    await page.locator("#topics-select-all").click();
    await page.locator("#start-btn").click();
    const positions = new Set<string>();
    let firstOrder: string[] = [];
    let firstAnswer = "";
    for (let question = 0; question < 10; question++) {
      const options = page.locator(".mc-option");
      if (!question)
        firstOrder = await options
          .locator(".session-answer-copy")
          .allTextContents();
      await options.first().click();
      await page.locator("#submit-btn").click();
      const correct = page.locator(".mc-option.is-correct");
      positions.add((await correct.getAttribute("data-index"))!);
      if (!question) firstAnswer = (await correct.textContent())!;
      if (question === 1) {
        await page.locator("#prev-btn").click();
        expect(
          await options.locator(".session-answer-copy").allTextContents(),
        ).toEqual(firstOrder);
        await expect(correct).toHaveText(firstAnswer);
        await page.locator("#next-btn").click();
      }
      await page.locator("#next-btn").click();
    }
    expect(positions.size).toBeGreaterThan(1);
    await expect(page.locator("#finish-summary")).toContainText("out of 10");
  });
}

// Characterization of <Practice /> (src/components/practice/Practice.tsx),
// the Phase 10d React conversion of the old islands/practice.ts vanilla
// wizard. Behavioral contract preserved from the pre-conversion spec;
// selectors updated where the DOM structure changed:
//   - The wizard (and its #reset-btn) now fully unmounts once a session
//     starts, instead of gaining an `is-hidden` class while staying in the
//     DOM — Practice.tsx swaps <PracticeWizard> for <Session> rather than
//     hiding one behind the other.
//   - The end-session modal is a Radix Dialog (Modal.tsx): its close button
//     is `.modal-close` (no more `#end-session-close`), and stats live under
//     `#end-session-stats` (kept as an id for continuity with the old
//     markup) rather than being asserted via a synthetic dispatchEvent to
//     route around a z-index bug — Radix's dialog now stacks correctly, so
//     a plain click works.

async function goToStep2(page: Page, questionCount?: string): Promise<void> {
  await page.goto("/practice");
  // The wizard only mounts once both question banks have loaded (Practice.tsx
  // shows "Loading questions…" until then), so by the time #wiz-next-1
  // exists, #topics-list is already populated for the default category —
  // no separate wait for topic buttons is needed.
  await page.locator("#wiz-next-1").waitFor();
  if (questionCount)
    await page
      .getByRole("group", { name: "Questions", exact: true })
      .getByRole("button", { name: questionCount, exact: true })
      .click();
  await page.locator("#wiz-next-1").click();
  await page.locator("#topics-list .study-topic").first().waitFor();
}

async function selectAllUnitsAndStart(
  page: Page,
  questionCount = "10",
): Promise<void> {
  await goToStep2(page, questionCount);
  await page.locator("#topics-select-all").click();
  await page.locator("#start-btn").click();
  await expect(page.locator("#stage-qwrap")).toBeVisible();
}

test("session settings and topics are the only two setup steps", async ({
  page,
}) => {
  await page.goto("/practice");
  const wizard = page.locator("#practice-wizard");
  await page.locator("#wiz-next-1").waitFor();
  await expect(wizard).toHaveAttribute("data-step", "1");

  await page.locator("#wiz-next-1").click();
  await expect(wizard).toHaveAttribute("data-step", "2");
  await expect(page.locator("#step-2")).toBeVisible();

  await page.locator("#wiz-back-2").click();
  await expect(wizard).toHaveAttribute("data-step", "1");
  await expect(page.locator("#step-1")).toBeVisible();

  await page.locator("#wiz-next-1").click();
  await expect(page.locator("#practice-wizard-heading")).toBeFocused();
  await page.locator("#topics-select-all").click();
  await expect(page.locator(".study-summary")).toContainText(
    "6 topics selected",
  );
  await page.locator("#start-btn").click();
  await expect(page.locator("#stage-qwrap")).toBeVisible();
  await expect(wizard).toHaveCount(0);
});

test("advancing from step 2 with no units selected shows a toast and does not advance", async ({
  page,
}) => {
  await goToStep2(page);
  await page.locator("#start-btn").click();
  await expect(page.locator(".toast-container .toast")).toHaveText(
    "Please select at least one unit.",
  );
  await expect(page.locator("#practice-wizard")).toHaveAttribute(
    "data-step",
    "2",
  );
});

test("changing category clears the topic selection", async ({ page }) => {
  await goToStep2(page);
  const firstChip = page.locator("#topics-list .study-topic").first();
  await firstChip.click();
  await expect(firstChip).toHaveClass(/is-selected/);

  await page.locator("#wiz-back-2").click();
  await page.locator(".study-bank", { hasText: "Economics" }).click();
  await page.locator("#wiz-next-1").click();

  const chips = page.locator("#topics-list .study-topic.is-selected");
  await expect(chips).toHaveCount(0);
});

test("changing category updates body[data-cat] (legacy.css hook, I3)", async ({
  page,
}) => {
  await page.goto("/practice");
  await page.locator("#wiz-next-1").waitFor();
  await expect(page.locator("body")).toHaveAttribute(
    "data-cat",
    "Personal Finance",
  );
  await page.locator(".study-bank", { hasText: "Economics" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-cat", "Economics");
});

// Design-fixes batch, commit 8 (2026-08-09): step 1's bank cards are new
// visible UI in front of the hidden #category <select> — clicking one must
// drive the same handleCategoryChange() the select does.
test("clicking a bank card selects it and updates body[data-cat] (I3)", async ({
  page,
}) => {
  await page.goto("/practice");
  await page.locator("#wiz-next-1").waitFor();
  await expect(page.locator("body")).toHaveAttribute(
    "data-cat",
    "Personal Finance",
  );

  const econCard = page.locator(".study-bank", { hasText: "Economics" });
  await econCard.click();
  await expect(econCard).toHaveClass(/is-selected/);
  await expect(page.locator("body")).toHaveAttribute("data-cat", "Economics");
});

// Each topic chip gains a trailing count (§7.4). Personal Finance's 6 topics
// sum to 390 questions across its three difficulty buckets (§7.1) — summing
// the rendered counts is a stronger check than just "some number renders".
test("topic chips show per-topic question counts", async ({ page }) => {
  await goToStep2(page);
  const counts = await page
    .locator("#topics-list .topic-btn-count")
    .allTextContents();
  expect(counts).toHaveLength(6); // Personal Finance is the default category
  const sum = counts.reduce((total, c) => total + Number(c), 0);
  expect(sum).toBe(390);
});

// §7.4: role="checkbox" now pairs with aria-checked, not the mismatched
// aria-pressed it shipped with.
test('.study-topic pairs role="checkbox" with aria-checked, not aria-pressed', async ({
  page,
}) => {
  await goToStep2(page);
  const chip = page.locator("#topics-list .study-topic").first();
  await expect(chip).toHaveAttribute("role", "checkbox");
  await expect(chip).toHaveAttribute("aria-checked", "false");
  expect(await chip.getAttribute("aria-pressed")).toBeNull();

  await chip.click();
  await expect(chip).toHaveAttribute("aria-checked", "true");
  expect(await chip.getAttribute("aria-pressed")).toBeNull();
});

test("setup shows only available actions", async ({ page }) => {
  await goToStep2(page);
  await page.locator("#topics-select-all").click();
  await page.locator("#start-btn").click();
  await expect(page.locator("#reset-btn")).toHaveCount(0);
});

test("a session runs: right-click and Alt-click eliminate a choice, Enter submits", async ({
  page,
}) => {
  await selectAllUnitsAndStart(page);

  const options = page.locator(".mc-option");
  await expect(options.first()).toBeVisible();

  // Right-click (contextmenu) toggles elimination without selecting.
  await options.nth(1).click({ button: "right" });
  await expect(options.nth(1)).toHaveClass(/is-eliminated/);
  await expect(page.locator("#submit-btn")).toBeDisabled();

  // Alt-click also eliminates (does not select).
  await options.nth(2).click({ modifiers: ["Alt"] });
  await expect(options.nth(2)).toHaveClass(/is-eliminated/);
  await expect(page.locator("#submit-btn")).toBeDisabled();

  // A normal click selects and overrides any elimination on that option.
  await options.first().click();
  await expect(options.first()).toHaveClass(/is-selected/);
  await expect(page.locator("#submit-btn")).toBeEnabled();

  // Enter submits while a question is on screen and a choice is selected.
  await page.keyboard.press("Enter");
  await expect(page.locator("#feedback")).toBeVisible();
  await expect(page.locator("#next-btn")).toBeEnabled();
  await expect(page.locator("#submit-btn")).toBeDisabled();
});

test("prev/next navigation restores prior answers and eliminations", async ({
  page,
}) => {
  await selectAllUnitsAndStart(page);

  const q1Prompt = await page.locator("#prompt").textContent();
  await page.locator(".mc-option").nth(3).click({ button: "right" }); // eliminate one
  await page.locator(".mc-option").first().click(); // select first
  await page.locator("#submit-btn").click();
  await expect(page.locator("#feedback")).toBeVisible();

  await page.locator("#next-btn").click();
  const q2Prompt = await page.locator("#prompt").textContent();
  expect(q2Prompt).not.toBe(q1Prompt);

  await page.locator("#prev-btn").click();
  await expect(page.locator("#prompt")).toHaveText(q1Prompt ?? "");
  await expect(page.locator(".mc-option").first()).toHaveClass(/is-selected/);
  await expect(page.locator(".mc-option").nth(3)).toHaveClass(/is-eliminated/);
  await expect(page.locator("#feedback")).toBeVisible();
});

test("completing the session shows the finish summary", async ({ page }) => {
  await selectAllUnitsAndStart(page, "10");

  for (let i = 0; i < 10; i++) {
    await page.locator(".mc-option").first().click();
    await page.locator("#submit-btn").click();
    if (i < 9) {
      await page.locator("#next-btn").click();
    }
  }
  await page.locator("#next-btn").click();

  await expect(page.locator("#stage-finish")).toBeVisible();
  await expect(page.locator("#finish-summary")).toContainText("out of 10");
});

test("end-session modal: × and Escape are dismiss-only (O7) — the session keeps running", async ({
  page,
}) => {
  await selectAllUnitsAndStart(page);

  await page.locator("#end-session-btn").click();
  const modal = page.locator("#end-session-modal");
  await expect(modal).toBeVisible();
  await expect(page.locator("#end-session-stats")).not.toBeEmpty();

  // Escape (Radix's built-in Dialog behavior) just closes the modal.
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(page.locator("#stage-qwrap")).toBeVisible(); // session still running

  await page.locator("#end-session-btn").click();
  await expect(modal).toBeVisible();
  await modal.locator(".modal-close").click();
  await expect(modal).toBeHidden();

  // O7 (deliberate behavior change from the old destructive ×): closing via
  // × leaves the session running. The wizard (and its step-3 #reset-btn) is
  // fully unmounted while a session is active — Practice.tsx renders
  // <Session> in its place rather than hiding the wizard behind a class —
  // so it must not be in the DOM at all here.
  await expect(page.locator("#practice-wizard")).toHaveCount(0);
  await expect(page.locator("#stage-qwrap")).toBeVisible();
});

test('end-session modal: the explicit "End Session" button is the only thing that resets the session', async ({
  page,
}) => {
  await selectAllUnitsAndStart(page);

  await page.locator("#end-session-btn").click();
  const modal = page.locator("#end-session-modal");
  await expect(modal).toBeVisible();

  await page.locator("#end-session-end-btn").click();
  await expect(modal).toBeHidden();

  // Only the destructive button ends the session: back to the wizard, session cleared.
  await expect(page.locator("#practice-wizard")).toBeVisible();
  await expect(page.locator("#practice-wizard")).toHaveAttribute(
    "data-step",
    "1",
  );
});

test("Enter in a dialog does not submit the practice answer behind it", async ({
  page,
}) => {
  await selectAllUnitsAndStart(page);
  await page.locator(".mc-option").first().click();
  await page.locator("#user-btn").click();
  await page.locator("#login-email").fill("unfinished@example.com");
  await page.locator("#login-email").press("Enter");
  await page.keyboard.press("Escape");
  await expect(page.locator("#feedback")).toBeHidden();
  await expect(page.locator("#submit-btn")).toBeEnabled();
});

test("adaptive mode is keyboard accessible", async ({ page }) => {
  await page.goto("/practice");
  const toggle = page.locator("#adaptive-toggle");
  await expect(toggle).toBeChecked();
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await expect(
    page.locator("#adapt-every-field button").first(),
  ).toBeDisabled();
});
