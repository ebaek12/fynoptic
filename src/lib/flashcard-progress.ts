import migrationData from "../data/flashcard-progress-migration.json" with { type: "json" };

export interface FlashcardProgressMigration {
  vocabulary: Record<string, string>;
  calculations: Record<string, { fromUnit: string; toUnit: string }>;
}

/** Move mastery with unchanged cards; rewritten material has no migration alias. */
export function migrateFlashcardProgress<T extends { lastAt: number }>(
  answers: Record<string, T>,
  migration: FlashcardProgressMigration = migrationData,
): { answers: Record<string, T>; changed: boolean } {
  let result = answers;
  let changed = false;
  for (const [oldKey, record] of Object.entries(answers)) {
    let newKey = Object.hasOwn(migration.vocabulary, oldKey)
      ? migration.vocabulary[oldKey]
      : undefined;
    if (!newKey) {
      const separator = oldKey.indexOf("::");
      const unit = oldKey.slice(0, separator);
      const cardId = oldKey.slice(separator + 2);
      const family = cardId.match(/^drill-(.+)-\d{2}$/)?.[1];
      const route = family ? migration.calculations[family] : undefined;
      if (route && unit === route.fromUnit)
        newKey = `${route.toUnit}::${cardId}`;
    }
    if (!newKey || newKey === oldKey) continue;
    if (!changed) result = { ...answers };
    changed = true;
    const current = result[newKey];
    if (!current || record.lastAt > current.lastAt) result[newKey] = record;
    delete result[oldKey];
  }
  return { answers: result, changed };
}
