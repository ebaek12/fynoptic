// Fisher-Yates shuffle, deduplicating the equivalent copies in
// js/flashcard.js (shuffle) and js/practice.js (shuffle). Unlike both
// originals, this does not mutate its input.

export function shuffle<T>(arr: readonly T[]): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
