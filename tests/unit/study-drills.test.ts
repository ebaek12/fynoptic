import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import catalog from "../../src/data/flashcard-drill-catalog.json";
import manifest from "../../src/data/study-drill-manifest.json";
import { FLASHCARD_UNITS } from "../../src/data/flashcard-units";
import { buildDeck } from "../../src/hooks/useFlashcardDeck";
import { parseDrillCards } from "../../src/lib/flashcard-catalog";
import { checkCalculationAnswer } from "../../src/lib/flashcard-answer";
import { parsePracticeBank } from "../../src/schemas";

const units = Object.fromEntries(
  Object.entries(catalog).map(([unit, entry]) => [
    unit,
    parseDrillCards(
      JSON.parse(readFileSync(resolve(entry.path.slice(1)), "utf8")),
      entry.count,
    ),
  ]),
);
const banks = ["personal-finance", "economics"].map((subject) =>
  parsePracticeBank(
    JSON.parse(
      readFileSync(resolve(`data/practice-drills-${subject}.json`), "utf8"),
    ),
    subject,
  ),
);
const questions = banks.flatMap((bank) =>
  Object.values(bank).flatMap((topics) =>
    Object.values(topics).flatMap((levels) => Object.values(levels).flat()),
  ),
);

describe("5,000-item drill expansion", () => {
  it("adds exactly 5,000 usable items to each mode across 250 distinct families", () => {
    expect(manifest.familyCount).toBe(250);
    expect(manifest.variantsPerFamily).toBe(20);
    expect(manifest.families).toHaveLength(250);
    expect(new Set(manifest.families.map((family) => family.id)).size).toBe(
      250,
    );
    expect(questions).toHaveLength(5000);
    expect(Object.keys(units)).toHaveLength(30);
    const deck = buildDeck(Object.keys(units), units);
    expect(deck).toHaveLength(5000);
    expect(new Set(deck.map((card) => card.id)).size).toBe(5000);
    expect(new Set(deck.map((card) => card.definition)).size).toBe(5000);
    const combined = { ...FLASHCARD_UNITS, ...units };
    expect(buildDeck(Object.keys(combined), combined)).toHaveLength(6611);
    expect(Object.keys(units).some((unit) => unit in FLASHCARD_UNITS)).toBe(
      false,
    );
    const counts = new Map<string, number>();
    for (const question of questions)
      counts.set(question.familyId!, (counts.get(question.familyId!) ?? 0) + 1);
    expect([...counts.values()]).toEqual(Array(250).fill(20));
  });

  it("keeps practice answers and flashcard solutions consistent for all 5,000 exercises", () => {
    const byId = new Map(questions.map((question) => [question.id, question]));
    const positions = [0, 0, 0, 0];
    for (const card of Object.values(units).flat()) {
      const question = byId.get(card.id!)!;
      expect(question, card.id).toBeDefined();
      expect(card.definition).toBe(question.question);
      expect(card.term).toBe(question.answer);
      expect(card.explanation).toBe(question.explanation);
      expect([card.term, ...card.distractors!].sort()).toEqual(
        [...question.choices].sort(),
      );
      expect(
        checkCalculationAnswer(card.term, card.numericAnswer!),
        card.id,
      ).toBe(true);
      expect(
        checkCalculationAnswer(
          String(card.numericAnswer!.value),
          card.numericAnswer!,
        ),
        card.id,
      ).toBe(true);
      for (const wrong of card.distractors!)
        expect(
          checkCalculationAnswer(wrong, card.numericAnswer!),
          `${card.id}: ${wrong}`,
        ).toBe(false);
      const position = question.choices.indexOf(question.answer);
      positions[position] = positions[position]! + 1;
    }
    expect(positions).toEqual([1250, 1250, 1250, 1250]);
  });
});
