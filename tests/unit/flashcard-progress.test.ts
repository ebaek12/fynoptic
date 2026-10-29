// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  migrateFlashcardProgress,
  type FlashcardProgressMigration,
} from "../../src/lib/flashcard-progress";

const migration: FlashcardProgressMigration = {
  vocabulary: {
    "Banking Operations::Account reconciliation":
      "Banking::Account reconciliation",
  },
  calculations: {
    "account-fee": { fromUnit: "Bank Account Cost Drills", toUnit: "Banking" },
  },
};
const record = (lastAt: number, correct = true) => ({
  correct,
  attempts: 2,
  lastAt,
});

describe("flashcard progress when units are consolidated", () => {
  it("moves unchanged vocabulary and calculation cards while retaining original progress", () => {
    const old = {
      "Banking::Bank": record(1),
      "Banking Operations::Account reconciliation": record(2),
      "Bank Account Cost Drills::drill-account-fee-01": record(3),
      "Statistics Drills::drill-rewritten-example-01": record(4),
    };
    const result = migrateFlashcardProgress(old, migration);
    expect(result.changed).toBe(true);
    expect(result.answers).toEqual({
      "Banking::Bank": record(1),
      "Banking::Account reconciliation": record(2),
      "Banking::drill-account-fee-01": record(3),
      // Unrelated old progress is retained but does not count toward rewritten cards.
      "Statistics Drills::drill-rewritten-example-01": record(4),
    });
    expect(old["Banking Operations::Account reconciliation"]).toEqual(
      record(2),
    );
    expect(migrateFlashcardProgress(result.answers, migration)).toEqual({
      answers: result.answers,
      changed: false,
    });
  });

  it("keeps the latest result when old and consolidated keys both exist", () => {
    const newer = migrateFlashcardProgress(
      {
        "Banking Operations::Account reconciliation": record(5),
        "Banking::Account reconciliation": record(8, false),
      },
      migration,
    );
    expect(newer.answers["Banking::Account reconciliation"]).toEqual(
      record(8, false),
    );
    const older = migrateFlashcardProgress(
      {
        "Banking Operations::Account reconciliation": record(9),
        "Banking::Account reconciliation": record(8, false),
      },
      migration,
    );
    expect(older.answers["Banking::Account reconciliation"]).toEqual(record(9));
  });

  it("does not attribute a similarly named exercise from the wrong unit", () => {
    const old = { "Unrelated::drill-account-fee-01": record(1) };
    expect(migrateFlashcardProgress(old, migration)).toEqual({
      answers: old,
      changed: false,
    });
  });
});
