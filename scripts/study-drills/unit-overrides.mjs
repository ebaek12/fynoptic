import { practice } from "./practice-overrides.mjs";
import { flash } from "./flash-overrides.mjs";
export const rewrittenPracticeFamilies = Object.keys(practice);
export const rewrittenFlashcardFamilies = Object.keys(flash);
export function buildPractice(family, variant, original) {
  return (
    practice[typeof family === "string" ? family : family.id]?.(
      variant,
      original,
    ) ?? original
  );
}
export function buildFlashcard(family, variant, original) {
  return (
    flash[typeof family === "string" ? family : family.id]?.(
      variant,
      original,
    ) ?? original
  );
}
