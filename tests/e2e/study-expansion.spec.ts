import { test, expect } from "@playwright/test";
import { PRACTICE_BANK_PATHS } from "../../src/lib/practice-banks";
import { BASE_FLASHCARD_UNITS } from "../../src/data/flashcard-units";
import flashcards from "../../src/data/flashcard-expansion.json" with { type: "json" };
import taxonomy from "../../src/data/study-units.json" with { type: "json" };
import migration from "../../src/data/flashcard-progress-migration.json" with { type: "json" };
import { FLASHCARD_COUNTS } from "../../src/lib/flashcard-catalog";
import {
  practiceBanks,
  combinedPractice,
  startOnCard,
  isolatePracticeItem,
} from "./helpers/study-content";
import type { PracticeBank } from "../../src/types";

const flatten = (bank: PracticeBank) =>
  Object.values(bank).flatMap((topics) =>
    Object.values(topics).flatMap((levels) => Object.values(levels).flat()),
  );
const additions = practiceBanks.slice(2, 4);

test("published data retains all 7,286 questions and matches the consolidated content", async ({
  request,
}) => {
  let count = 0;
  for (const [index, path] of PRACTICE_BANK_PATHS.entries()) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    const bank = await response.json();
    expect(bank, path).toEqual(practiceBanks[index]);
    count += flatten(bank).length;
  }
  expect(count).toBe(7286);
});

for (const [category, topics] of Object.entries(taxonomy.practice)) {
  test(`${category} shows exactly its original categories with expanded question counts`, async ({
    page,
  }) => {
    await page.goto("/practice");
    await page.locator(".study-bank", { hasText: category }).click();
    await page.locator("#wiz-next-1").click();
    const chips = page.locator("#topics-list .study-topic");
    await expect(chips).toHaveCount(topics.length);
    expect(
      await chips.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-value")),
      ),
    ).toEqual([...topics].sort());
    for (const topic of topics) {
      const count = Object.values(combinedPractice[category]![topic]!).flat()
        .length;
      await expect(
        page.locator(`#topics-list [data-value="${topic}"] .topic-btn-count`),
      ).toHaveText(String(count));
    }
  });
}

for (const bank of additions) {
  const [category, topics] = Object.entries(bank)[0]!;
  const [topic, levels] = Object.entries(topics).find(
    ([, levels]) => Object.values(levels).flat().length > 0,
  )!;
  const question = Object.values(levels).flat()[0]!;
  test(`reassigned ${category} material grades correctly and retains explanations`, async ({
    page,
  }) => {
    await isolatePracticeItem(page, category, topic, question);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/practice");
    await page.locator(".study-bank", { hasText: category }).click();
    await page.locator("#wiz-next-1").click();
    await page.locator(`#topics-list [data-value="${topic}"]`).click();
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

for (const mode of ["mc", "fitb"] as const) {
  const unit = mode === "mc" ? "Financial Decisions" : "Investing Basics";
  const addedTerms = new Set(flashcards[unit].map((card) => card.term));
  test(`added vocabulary lives within an original unit and works in ${mode} mode`, async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "fynoptic.flashcards.v1",
        JSON.stringify({
          answers: {
            "Banking::Bank": { correct: true, attempts: 1, lastAt: 1 },
          },
        }),
      ),
    );
    await page.goto("/flashcard");
    await expect(page.locator("#unit-list .unit-name")).toHaveText(
      taxonomy.flashcards,
    );
    const topic = page
      .locator("#unit-list .study-topic")
      .filter({ has: page.getByText(unit, { exact: true }) });
    await topic.click();
    await page.locator("#confirm-units").click();
    if (mode === "fitb")
      await page
        .locator("label.study-mode", { hasText: "Fill in the Blank" })
        .click();
    const card = await startOnCard(
      page,
      unit,
      (card) => !card.kind && addedTerms.has(card.term),
    );
    if (mode === "mc") {
      await page.getByRole("button", { name: card.term, exact: true }).click();
      await page.locator("#submit-btn").click();
    } else {
      await page.locator("#fitb-input").fill(card.term);
      await page.locator("#fitb-input").press("Enter");
    }
    await expect(page.locator("#stat-correct")).toHaveText("1");
    const answers = await page.evaluate(
      () => JSON.parse(localStorage.getItem("fynoptic.flashcards.v1")!).answers,
    );
    expect(answers[`${unit}::${card.term}`].correct).toBe(true);
    expect(answers["Banking::Bank"]).toEqual({
      correct: true,
      attempts: 1,
      lastAt: 1,
    });
    await page.reload();
    await expect(topic).toContainText(`${FLASHCARD_COUNTS[unit]} cards`);
    expect(BASE_FLASHCARD_UNITS[unit]!.length).toBeGreaterThan(0);
  });
}

test("mastery follows moved cards into the original unit without resetting old progress", async ({
  page,
}) => {
  const aliases = Object.entries(migration.vocabulary)
    .filter(([, destination]) => destination.startsWith("Banking::"))
    .slice(0, 10);
  const answers = Object.fromEntries(
    aliases.map(([old]) => [old, { correct: true, attempts: 2, lastAt: 2 }]),
  );
  answers["Banking::Bank"] = { correct: true, attempts: 1, lastAt: 1 };
  await page.addInitScript((answers) => {
    if (!localStorage.getItem("fynoptic.flashcards.v1"))
      localStorage.setItem(
        "fynoptic.flashcards.v1",
        JSON.stringify({ answers }),
      );
  }, answers);
  await page.goto("/flashcard");
  const expectedPct = Math.round(
    ((aliases.length + 1) / FLASHCARD_COUNTS.Banking!) * 100,
  );
  await expect(page.locator("#unit-banking")).toContainText(
    `${expectedPct}% mastered`,
  );
  const migrated = await page.evaluate(
    () => JSON.parse(localStorage.getItem("fynoptic.flashcards.v1")!).answers,
  );
  for (const [old, current] of aliases) {
    expect(migrated[old]).toBeUndefined();
    expect(migrated[current]).toEqual({
      correct: true,
      attempts: 2,
      lastAt: 2,
    });
  }
  expect(migrated["Banking::Bank"]).toEqual(answers["Banking::Bank"]);
  await page.reload();
  await expect(page.locator("#unit-banking")).toContainText(
    `${expectedPct}% mastered`,
  );
});

test("a failed expansion request leaves the original categories and remaining questions usable", async ({
  page,
}) => {
  await page.route(
    "**/data/practice-personal-finance-expansion.json",
    (route) => route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/practice");
  await expect(page.locator(".toast-container")).toContainText(
    "Some practice questions could not load",
  );
  await page.locator("#wiz-next-1").click();
  await expect(page.locator("#topics-list .study-topic")).toHaveCount(6);
  await page.locator("#topics-select-all").click();
  await page.locator("#start-btn").click();
  await expect(page.locator("#prompt")).not.toBeEmpty();
  await page.locator(".mc-option").first().click();
  await page.locator("#submit-btn").click();
  await expect(page.locator("#feedback")).toBeVisible();
});

test("long practice explanations remain usable on a small phone", async ({
  page,
}) => {
  const candidates = additions.flatMap((bank) =>
    Object.entries(bank).flatMap(([category, topics]) =>
      Object.entries(topics).flatMap(([topic, levels]) =>
        Object.values(levels)
          .flat()
          .map((question) => ({ category, topic, question })),
      ),
    ),
  );
  const { category, topic, question } = candidates.sort(
    (a, b) =>
      b.question.explanation!.length +
      b.question.answer.length -
      (a.question.explanation!.length + a.question.answer.length),
  )[0]!;
  await isolatePracticeItem(page, category, topic, question);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/practice");
  await page.locator(".study-bank", { hasText: category }).click();
  await page.locator("#wiz-next-1").click();
  await page.locator(`#topics-list [data-value="${topic}"]`).click();
  await page.locator("#start-btn").click();
  await page
    .getByRole("button", {
      name: question.choices.find((choice) => choice !== question.answer)!,
      exact: true,
    })
    .click();
  await page.locator("#submit-btn").click();
  await expect(page.locator("#feedback")).toContainText(question.explanation!);
  await expect(page.locator("#next-btn")).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});
