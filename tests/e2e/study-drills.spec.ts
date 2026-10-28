import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import type { Flashcard, PracticeBank } from "../../src/types";

const read = (path: string) =>
  JSON.parse(readFileSync(resolve(path.replace(/^\//, "")), "utf8"));
const catalog: Record<string, { count: number; path: string }> = read(
  "src/data/flashcard-drill-catalog.json",
);
const [unit, entry] = Object.entries(catalog)[0]!;
const cards: Flashcard[] = read(entry.path);
const first = cards[0]!;
const topic = (page: Page, name = unit) =>
  page
    .locator("#unit-list .study-topic")
    .filter({ has: page.getByText(name, { exact: true }) });

async function selectDrills(
  page: Page,
  mode: "mc" | "fitb" = "mc",
  name = unit,
) {
  await topic(page, name).click();
  await page.locator("#confirm-units").click();
  await page.locator("#shuffle").uncheck();
  if (mode === "fitb")
    await page
      .locator("label.study-mode", { hasText: "Fill in the Blank" })
      .click();
}

for (const mode of ["mc", "fitb"] as const) {
  test(`calculation flashcards load only selected topics and grade in ${mode} mode`, async ({
    page,
  }) => {
    const downloads: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/data/flashcard-drills/"))
        downloads.push(request.url());
    });
    await page.addInitScript(() => {
      if (!localStorage.getItem("fynoptic.flashcards.v1"))
        localStorage.setItem(
          "fynoptic.flashcards.v1",
          JSON.stringify({
            answers: {
              "Banking::Bank": { correct: true, attempts: 1, lastAt: 1 },
            },
          }),
        );
    });
    await page.goto("/flashcard");
    await expect(page.locator("#unit-list .study-topic")).toHaveCount(62);
    await selectDrills(page, mode);
    expect(downloads).toEqual([]);
    await page.locator("#start-btn-big").click();
    await expect(page.locator("#def-text")).toHaveText(first.definition);
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toContain(entry.path);
    await expect(page.locator("#stat-total")).toHaveText(String(entry.count));
    await expect(page.locator("#mc-toggle-answer")).toHaveCount(0);
    if (mode === "mc") {
      await expect(page.locator(".mc-option")).toHaveCount(4);
      expect(
        (
          await page
            .locator(".mc-option")
            .evaluateAll((nodes) =>
              nodes.map((node) => node.getAttribute("data-value")),
            )
        ).sort(),
      ).toEqual([first.term, ...first.distractors!].sort());
      await page.getByRole("button", { name: first.term, exact: true }).click();
      await page.locator("#submit-btn").click();
    } else {
      await page
        .locator("#fitb-input")
        .fill(String(first.numericAnswer!.value));
      await page.locator("#fitb-input").press("Enter");
    }
    await expect(page.locator("#stat-correct")).toHaveText("1");
    await expect(page.locator("#feedback")).toContainText(first.explanation!);
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("fynoptic.flashcards.v1")!).answers,
    );
    expect(saved[`${unit}::${first.id}`].correct).toBe(true);
    expect(saved["Banking::Bank"]).toEqual({
      correct: true,
      attempts: 1,
      lastAt: 1,
    });
    await page.reload();
    await expect(topic(page)).toContainText("1% mastered");
    await expect(page.locator("#unit-banking")).toContainText("2% mastered");
  });
}

test("failed calculation downloads can be retried without losing the selection", async ({
  page,
}) => {
  let attempts = 0;
  await page.route(`**${entry.path}`, (route) =>
    ++attempts === 1
      ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.continue(),
  );
  await page.goto("/flashcard");
  await selectDrills(page);
  await page.locator("#start-btn-big").click();
  await expect(page.locator(".toast-container")).toContainText(
    "Could not load these flashcards",
  );
  await expect(page.locator("#flashcard-setup")).not.toHaveAttribute("inert");
  await expect(page.locator("#start-btn-big")).toBeEnabled();
  await page.locator("#start-btn-big").click();
  await expect(page.locator("#def-text")).toHaveText(first.definition);
  expect(attempts).toBe(2);
});

test("calculation cards keep the question first after reversing a vocabulary session", async ({
  page,
}) => {
  await page.goto("/flashcard");
  await page.locator("#unit-banking").click();
  await page.locator("#confirm-units").click();
  await page.locator("#start-btn-big").click();
  await page.locator("#mc-toggle-answer").click();
  await expect(page.locator("#mc-toggle-answer")).toHaveText(
    "Answer with Definition",
  );
  await page.locator("#end-btn").click();
  await page.locator("#summary-modal .modal-close").click();
  await page.locator("#clear-all").click();
  await selectDrills(page);
  await page.locator("#start-btn-big").click();
  await expect(page.locator("#def-side")).toHaveClass(/is-front/);
  await expect(page.locator("#def-text")).toHaveText(first.definition);
  await page.getByRole("button", { name: first.term, exact: true }).click();
  await page.locator("#submit-btn").click();
  await expect(page.locator("#stat-correct")).toHaveText("1");
});

test("all 6,611 cards can be loaded into one deck", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/flashcard");
  await page.locator("#select-all").click();
  await expect(page.locator("#flashcard-setup")).toContainText(
    "6611 cards in your deck",
  );
  await page.locator("#confirm-units").click();
  await page.locator("#start-btn-big").click();
  await expect(page.locator("#stat-total")).toHaveText("6611");
  await expect(page.locator("#def-text")).not.toBeEmpty();
  await page.locator(".mc-option").first().click();
  await page.locator("#submit-btn").click();
  await expect(page.locator("#stat-done")).toHaveText("1");
  await page.locator("#next-btn").click();
  await expect(page.locator("#submit-btn")).toBeDisabled();
  expect(errors).toEqual([]);
});

test("long calculation flashcards keep the answer and navigation accessible on a small phone", async ({
  page,
}) => {
  const all = Object.entries(catalog).flatMap(([name, item]) =>
    (read(item.path) as Flashcard[]).map((card) => ({ name, item, card })),
  );
  const { name, item, card } = all.sort(
    (a, b) =>
      b.card.definition.length +
      b.card.explanation!.length -
      a.card.definition.length -
      a.card.explanation!.length,
  )[0]!;
  const unitCards: Flashcard[] = read(item.path);
  await page.route(`**${item.path}`, (route) =>
    route.fulfill({
      json: [card, ...unitCards.filter((c) => c.id !== card.id)],
    }),
  );
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/flashcard");
  await selectDrills(page, "mc", name);
  await page.locator("#start-btn-big").click();
  await expect(page.locator("#def-text")).toHaveText(card.definition);
  await page.getByRole("button", { name: card.term, exact: true }).click();
  await page.locator("#submit-btn").click();
  await expect(page.locator("#feedback")).toContainText(card.explanation!);
  await expect(page.locator("#next-btn")).toBeInViewport();
  const nextBounds = (await page.locator('#next-btn').boundingBox())!;
  expect(nextBounds.x + nextBounds.width).toBeLessThanOrEqual(320);
  expect(
    (await page.locator(".session-workspace").boundingBox())!.height,
  ).toBeGreaterThan(60);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const solution = page.locator("#feedback p");
  await solution.focus();
  await solution.press("End");
  await expect
    .poll(() => solution.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0);
  await page.screenshot({
    path: "/tmp/fynoptic-study-5000/flashcard-small-phone.png",
    fullPage: true,
  });
});

for (const filename of ["personal-finance", "economics"]) {
  const path = `/data/practice-drills-${filename}.json`;
  const bank: PracticeBank = read(path);
  const [category, topics] = Object.entries(bank)[0]!;
  const [name, levels] = Object.entries(topics)[0]!;
  const items = Object.values(levels).flat();
  test(`new ${category} drills load, grade, and retain worked explanations`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/practice");
    await page.locator(".study-bank", { hasText: category }).click();
    await page.locator("#wiz-next-1").click();
    const selected = page.locator("#topics-list .study-topic", {
      hasText: name,
    });
    await expect(selected.locator(".topic-btn-count")).toHaveText(
      String(items.length),
    );
    await selected.click();
    await page.locator("#start-btn").click();
    const prompt = await page.locator("#prompt").innerText();
    const question = items.find((item) => item.question === prompt)!;
    expect(question).toBeDefined();
    await page
      .getByRole("button", { name: question.answer, exact: true })
      .click();
    await page.locator("#submit-btn").click();
    await expect(page.locator("#feedback")).toContainText("Correct!");
    await expect(page.locator("#feedback")).toContainText(
      question.explanation!,
    );
    await expect(page.locator("#next-btn")).toBeInViewport();
    await page.locator("#next-btn").click();
    await page.locator("#prev-btn").click();
    await expect(page.locator("#prompt")).toHaveText(question.question);
    await expect(page.locator("#feedback")).toContainText(
      question.explanation!,
    );
  });
}
