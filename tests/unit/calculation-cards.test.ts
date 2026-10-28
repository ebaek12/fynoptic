import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { checkCalculationAnswer } from "../../src/lib/flashcard-answer";
import {
  createFlashcardLoader,
  parseDrillCards,
} from "../../src/lib/flashcard-catalog";
import {
  buildDeck,
  buildMcOptions,
  unitProgress,
} from "../../src/hooks/useFlashcardDeck";
import drillCatalog from "../../src/data/flashcard-drill-catalog.json";
import type { Flashcard } from "../../src/types";

const card: Flashcard = {
  id: "drill-budget-example-01",
  kind: "calculation",
  term: "$1,200.00",
  definition: "What remains from $2,000 after $800 of expenses?",
  distractors: ["$800.00", "$2,000.00", "$2,800.00"],
  explanation: "Subtract expenses from income: $2,000 − $800 = $1,200.",
  numericAnswer: { value: 1200, unit: "USD" },
};

describe("calculation flashcards", () => {
  it.each([
    "1200",
    "1,200",
    "$1,200.00",
    "USD 1200",
    "1200 dollars",
    " 1200.0 ",
    "1.2e3",
  ])("accepts equivalent money formatting: %s", (input) => {
    expect(checkCalculationAnswer(input, card.numericAnswer!)).toBe(true);
  });
  it.each([
    "1200%",
    "1200 months",
    "1,20",
    "1200.01",
    "1200 + 0",
    "Infinity",
    "",
    "$1,200.001",
  ])(
    "rejects incorrect values, malformed numbers, and incompatible units: %s",
    (input) => {
      expect(checkCalculationAnswer(input, card.numericAnswer!)).toBe(false);
    },
  );
  it("handles percentages, negative values, fractions, and whole-unit answers without losing their meaning", () => {
    expect(checkCalculationAnswer("12.5%", { value: 12.5, unit: "%" })).toBe(
      true,
    );
    expect(checkCalculationAnswer("0.125", { value: 12.5, unit: "%" })).toBe(
      false,
    );
    expect(checkCalculationAnswer("$12.5", { value: 12.5, unit: "%" })).toBe(
      false,
    );
    expect(
      checkCalculationAnswer("-$50.25", { value: -50.25, unit: "USD" }),
    ).toBe(true);
    expect(
      checkCalculationAnswer("−50.25", { value: -50.25, unit: "USD" }),
    ).toBe(true);
    expect(checkCalculationAnswer(".5", { value: 0.5, unit: "" })).toBe(true);
    expect(
      checkCalculationAnswer("6 months", { value: 6, unit: "months" }),
    ).toBe(true);
    expect(
      checkCalculationAnswer("6 years", { value: 6, unit: "months" }),
    ).toBe(false);
    expect(
      checkCalculationAnswer("$18.50 per hour", {
        value: 18.5,
        unit: "USD per hour",
      }),
    ).toBe(true);
    expect(
      checkCalculationAnswer("18.5", { value: 18.5, unit: "USD per hour" }),
    ).toBe(true);
    expect(
      checkCalculationAnswer("$18.50 per month", {
        value: 18.5,
        unit: "USD per hour",
      }),
    ).toBe(false);
    expect(
      checkCalculationAnswer("1000000.01", { value: 1000000, unit: "USD" }),
    ).toBe(false);
  });

  it("keeps progress separate when two different exercises have the same answer", () => {
    const deck = buildDeck(["Budget"], {
      Budget: [
        card,
        {
          ...card,
          id: "drill-budget-example-02",
          definition: "A different calculation with the same result.",
        },
      ],
    });
    expect(deck.map((item) => item.id)).toEqual([
      "Budget::drill-budget-example-01",
      "Budget::drill-budget-example-02",
    ]);
    const answers = {
      [deck[0]!.id]: { correct: true, attempts: 1, lastAt: 1 },
    };
    expect(unitProgress(answers, "Budget", 2)).toEqual({
      done: 1,
      correct: 1,
      total: 2,
      pct: 50,
    });
  });

  it("uses authored mistakes rather than answers from unrelated cards", () => {
    const options = buildMcOptions(
      card,
      [{ term: "Bank", definition: "A financial institution" }],
      true,
    );
    expect(options.sort()).toEqual([card.term, ...card.distractors!].sort());
    expect(buildMcOptions(card, [], false).sort()).toEqual(options);
  });

  it("rejects corrupted or contradictory downloaded cards", () => {
    expect(parseDrillCards([card], 1)).toHaveLength(1);
    expect(() => parseDrillCards([card], 2)).toThrow();
    expect(() => parseDrillCards([card, card], 2)).toThrow();
    expect(() =>
      parseDrillCards(
        [{ ...card, numericAnswer: { value: 1300, unit: "USD" } }],
        1,
      ),
    ).toThrow();
    expect(() =>
      parseDrillCards(
        [{ ...card, distractors: [card.term, "$0.00", "$5.00"] }],
        1,
      ),
    ).toThrow();
  });
});

describe("topic-based flashcard loading", () => {
  const [unit, entry] = Object.entries(drillCatalog)[0]!;
  const data = JSON.parse(readFileSync(resolve(entry.path.slice(1)), "utf8"));

  it("loads only selected new topics, caches them, and leaves original topics local", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response(JSON.stringify(data)));
    const load = createFlashcardLoader(fetcher);
    const old = await load(["Banking"]);
    expect(old.Banking).toHaveLength(50);
    expect(fetcher).not.toHaveBeenCalled();
    const [first, second] = await Promise.all([load([unit]), load([unit])]);
    expect(first[unit]).toHaveLength(entry.count);
    expect(second).toEqual(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]![0]).toBe(entry.path);
  });

  it("allows retry after a failed request", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(data)));
    const load = createFlashcardLoader(fetcher);
    await expect(load([unit])).rejects.toThrow("HTTP 503");
    expect((await load([unit]))[unit]).toHaveLength(entry.count);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await expect(load(["Unknown topic"])).rejects.toThrow(
      "Unknown flashcard topic",
    );
  });
});
