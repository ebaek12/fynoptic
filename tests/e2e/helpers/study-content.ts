import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";
import { FLASHCARD_UNITS } from "../../../src/data/flashcard-units";
import catalog from "../../../src/data/flashcard-drill-catalog.json" with { type: "json" };
import {
  mergePracticeBanks,
  PRACTICE_BANK_PATHS,
} from "../../../src/lib/practice-banks";
import type {
  Flashcard,
  FlashcardUnit,
  PracticeBank,
  PracticeItem,
} from "../../../src/types";

export const readJson = (path: string) =>
  JSON.parse(readFileSync(path.replace(/^\//, ""), "utf8"));
export const practiceBanks: PracticeBank[] = PRACTICE_BANK_PATHS.map(readJson);
export const combinedPractice = mergePracticeBanks(practiceBanks);
export const calculationUnits: FlashcardUnit = Object.fromEntries(
  Object.entries(catalog).map(([unit, entry]) => [unit, readJson(entry.path)]),
);
export const allFlashcardUnits: FlashcardUnit = Object.fromEntries(
  Object.entries(FLASHCARD_UNITS).map(([unit, cards]) => [
    unit,
    [...cards, ...calculationUnits[unit]!],
  ]),
);

export function findShuffleSample(
  cards: Flashcard[],
  accepts: (card: Flashcard) => boolean,
) {
  let chosen: { random: number; card: Flashcard } | undefined;
  for (let k = 1; k < 1000 && !chosen; k++) {
    const random = k / 1000;
    const indexes = cards.map((_, i) => i);
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(random * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j]!, indexes[i]!];
    }
    const card = cards[indexes[0]!]!;
    if (accepts(card)) chosen = { random, card };
  }
  return chosen;
}

/** Deterministically exercise an actual card from the combined unit. */
export async function startOnCard(
  page: Page,
  unit: string,
  accepts: (card: Flashcard) => boolean,
  cards = allFlashcardUnits[unit]!,
) {
  const chosen = findShuffleSample(cards, accepts);
  if (!chosen) throw new Error(`No deterministic sample in ${unit}`);
  await page.locator("#shuffle").check();
  await page.evaluate((random) => {
    const state = window as Window & { studyOriginalRandom?: () => number };
    state.studyOriginalRandom = Math.random;
    Math.random = () => random;
  }, chosen.random);
  try {
    await page.locator("#start-btn-big").click();
    await expect(page.locator("#def-text")).toHaveText(chosen.card.definition);
  } finally {
    await page.evaluate(() => {
      const state = window as Window & { studyOriginalRandom?: () => number };
      if (state.studyOriginalRandom) Math.random = state.studyOriginalRandom;
      delete state.studyOriginalRandom;
    });
  }
  return chosen.card;
}

/** Isolate one real authored item to test grading independently of random selection. */
export async function isolatePracticeItem(
  page: Page,
  category: string,
  topic: string,
  question: PracticeItem,
) {
  for (const [index, path] of PRACTICE_BANK_PATHS.entries()) {
    await page.route(`**${path}`, (route) =>
      route.fulfill({
        json: {
          [category]: {
            [topic]: {
              easy: [],
              medium: index === 0 ? [question] : [],
              hard: [],
            },
          },
        },
      }),
    );
  }
}
