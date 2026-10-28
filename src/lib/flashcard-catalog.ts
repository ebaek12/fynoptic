import { z } from "zod";
import { FLASHCARD_UNITS } from "../data/flashcard-units";
import drillCatalog from "../data/flashcard-drill-catalog.json";
import type { Flashcard, FlashcardUnit } from "../types";
import { checkCalculationAnswer } from "./flashcard-answer";

export const FLASHCARD_COUNTS: Record<string, number> = {
  ...Object.fromEntries(
    Object.entries(FLASHCARD_UNITS).map(([unit, cards]) => [
      unit,
      cards.length,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(drillCatalog).map(([unit, entry]) => [unit, entry.count]),
  ),
};

const drillCardSchema = z
  .object({
    id: z.string().regex(/^drill-[a-z0-9-]+-\d{2}$/),
    kind: z.literal("calculation"),
    term: z.string().trim().min(1),
    definition: z.string().trim().min(1),
    distractors: z.array(z.string().trim().min(1)).length(3),
    explanation: z.string().trim().min(1),
    numericAnswer: z.object({ value: z.number().finite(), unit: z.string() }),
  })
  .refine(
    (card) => new Set([card.term, ...card.distractors]).size === 4,
    "Answers must be distinct",
  )
  .refine(
    (card) => checkCalculationAnswer(card.term, card.numericAnswer),
    "Displayed and numeric answers must agree",
  );

export function parseDrillCards(
  data: unknown,
  expectedCount: number,
): Flashcard[] {
  const cards = z.array(drillCardSchema).length(expectedCount).parse(data);
  if (new Set(cards.map((card) => card.id)).size !== cards.length)
    throw new Error("Duplicate flashcard identifiers");
  return cards;
}

/** Fetch selected drill topics only; failed requests can be retried. */
export function createFlashcardLoader(
  fetcher: typeof fetch = (...args) => fetch(...args),
) {
  const pending = new Map<string, Promise<Flashcard[]>>();
  const catalog: Record<string, { count: number; path: string }> = drillCatalog;
  return async function load(units: string[]): Promise<FlashcardUnit> {
    const entries = await Promise.all(
      units.map(async (unit) => {
        if (FLASHCARD_UNITS[unit])
          return [unit, FLASHCARD_UNITS[unit]!] as const;
        const entry = catalog[unit];
        if (!entry) throw new Error(`Unknown flashcard topic: ${unit}`);
        if (!pending.has(unit)) {
          const request = (async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15_000);
            try {
              const response = await fetcher(entry.path, {
                signal: controller.signal,
              });
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              return parseDrillCards(await response.json(), entry.count);
            } finally {
              clearTimeout(timeout);
            }
          })().catch((error) => {
            pending.delete(unit);
            throw error;
          });
          pending.set(unit, request);
        }
        return [unit, await pending.get(unit)!] as const;
      }),
    );
    return Object.fromEntries(entries);
  };
}

export const loadFlashcardUnits = createFlashcardLoader();
