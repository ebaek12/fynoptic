import { test, expect, type Page } from "@playwright/test";
import catalog from "../../src/data/flashcard-drill-catalog.json" with { type: "json" };
import taxonomy from "../../src/data/study-units.json" with { type: "json" };
import {
  calculationUnits,
  allFlashcardUnits,
  startOnCard,
  findShuffleSample,
  practiceBanks,
  isolatePracticeItem,
} from "./helpers/study-content";

const unit = "Financial Decisions";
const entry = catalog[unit];
const topic = (page: Page, name = unit) =>
  page
    .locator("#unit-list .study-topic")
    .filter({ has: page.getByText(name, { exact: true }) });
async function selectUnit(page: Page, mode: "mc" | "fitb" = "mc", name = unit) {
  await topic(page, name).click();
  await page.locator("#confirm-units").click();
  if (mode === "fitb")
    await page
      .locator("label.study-mode", { hasText: "Fill in the Blank" })
      .click();
}

for (const mode of ["mc", "fitb"] as const) {
  test(`calculations within an original unit load on demand and grade in ${mode} mode`, async ({
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
    await expect(page.locator("#unit-list .unit-name")).toHaveText(
      taxonomy.flashcards,
    );
    await selectUnit(page, mode);
    expect(downloads).toEqual([]);
    const card = await startOnCard(
      page,
      unit,
      (card) => card.kind === "calculation",
    );
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toContain(entry.path);
    await expect(page.locator("#stat-total")).toHaveText(
      String(allFlashcardUnits[unit]!.length),
    );
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
      ).toEqual([card.term, ...card.distractors!].sort());
      await page.getByRole("button", { name: card.term, exact: true }).click();
      await page.locator("#submit-btn").click();
    } else {
      await page.locator("#fitb-input").fill(String(card.numericAnswer!.value));
      await page.locator("#fitb-input").press("Enter");
    }
    await expect(page.locator("#stat-correct")).toHaveText("1");
    await expect(page.locator("#feedback")).toContainText(card.explanation!);
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("fynoptic.flashcards.v1")!).answers,
    );
    expect(saved[`${unit}::${card.id}`].correct).toBe(true);
    expect(saved["Banking::Bank"]).toEqual({
      correct: true,
      attempts: 1,
      lastAt: 1,
    });
    await page.reload();
    await expect(topic(page)).toContainText(
      `${allFlashcardUnits[unit]!.length} cards`,
    );
  });
}

test("failed calculation downloads can be retried without losing the original-unit selection", async ({
  page,
}) => {
  let attempts = 0;
  await page.route(`**${entry.path}`, (route) =>
    ++attempts === 1
      ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.continue(),
  );
  await page.goto("/flashcard");
  await selectUnit(page);
  await page.locator("#start-btn-big").click();
  await expect(page.locator(".toast-container")).toContainText(
    "Could not load these flashcards",
  );
  await expect(page.locator("#flashcard-setup")).not.toHaveAttribute("inert");
  await expect(page.locator("#start-btn-big")).toBeEnabled();
  await startOnCard(page, unit, (card) => card.kind === "calculation");
  expect(attempts).toBe(2);
});

test("calculation questions stay on the front after reversing vocabulary cards", async ({
  page,
}) => {
  await page.goto("/flashcard");
  await page.locator("#unit-banking").click();
  await page.locator("#confirm-units").click();
  await page.locator("#shuffle").uncheck();
  await page.locator("#start-btn-big").click();
  await page.locator("#mc-toggle-answer").click();
  await expect(page.locator("#mc-toggle-answer")).toHaveText(
    "Answer with Definition",
  );
  await page.locator("#end-btn").click();
  await page.locator("#summary-modal .modal-close").click();
  await page.locator("#clear-all").click();
  await selectUnit(page);
  const card = await startOnCard(
    page,
    unit,
    (card) => card.kind === "calculation",
  );
  await expect(page.locator("#def-side")).toHaveClass(/is-front/);
  await page.getByRole("button", { name: card.term, exact: true }).click();
  await page.locator("#submit-btn").click();
  await expect(page.locator("#stat-correct")).toHaveText("1");
});

test("all 6,611 cards are reachable through the original 12 units", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/flashcard");
  await expect(page.locator("#unit-list .study-topic")).toHaveCount(12);
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

test("long calculation cards keep the answer and navigation accessible on a small phone", async ({
  page,
}) => {
  const candidates = Object.entries(calculationUnits).flatMap(([name, cards]) =>
    cards.map((card) => ({ name, card })),
  );
  candidates.sort(
    (a, b) =>
      b.card.definition.length +
      b.card.explanation!.length -
      a.card.definition.length -
      a.card.explanation!.length,
  );
  const { name, card } = candidates.find(({ name, card }) =>
    findShuffleSample(
      allFlashcardUnits[name]!,
      (candidate) => candidate.id === card.id,
    ),
  )!;
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/flashcard");
  await selectUnit(page, "mc", name);
  await startOnCard(page, name, (candidate) => candidate.id === card.id);
  await page.getByRole("button", { name: card.term, exact: true }).click();
  await page.locator("#submit-btn").click();
  await expect(page.locator("#feedback")).toContainText(card.explanation!);
  await expect(page.locator("#next-btn")).toBeInViewport();
  const nextBounds = (await page.locator("#next-btn").boundingBox())!;
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
});

for (const bank of practiceBanks.slice(4)) {
  const [category, topics] = Object.entries(bank)[0]!;
  const [name, levels] = Object.entries(topics).find(
    ([, levels]) => Object.values(levels).flat().length > 0,
  )!;
  const question = Object.values(levels).flat()[0]!;
  test(`new ${category} calculations grade within an original category`, async ({
    page,
  }) => {
    await isolatePracticeItem(page, category, name, question);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/practice");
    await page.locator(".study-bank", { hasText: category }).click();
    await page.locator("#wiz-next-1").click();
    await page.locator(`#topics-list [data-value="${name}"]`).click();
    await page.locator("#start-btn").click();
    await expect(page.locator("#prompt")).toHaveText(question.question);
    await page
      .getByRole("button", { name: question.answer, exact: true })
      .click();
    await page.locator("#submit-btn").click();
    await expect(page.locator("#feedback")).toContainText("Correct!");
    await expect(page.locator("#feedback")).toContainText(
      question.explanation!,
    );
    await expect(page.locator("#next-btn")).toBeInViewport();
  });
}
