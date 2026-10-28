import type { PracticeBank, PracticeDifficulty } from '../types';

export const PRACTICE_BANK_PATHS = [
  '/data/pf_bank_modules_1of6.json',
  '/data/econ_grouped_by_module_unit_with_choices.json',
  '/data/practice-personal-finance-expansion.json',
  '/data/practice-economics-expansion.json',
  '/data/practice-drills-personal-finance.json',
  '/data/practice-drills-economics.json',
] as const;

/** Combine additions without replacing existing subjects, topics, or questions. */
export function mergePracticeBanks(banks: (PracticeBank | null)[]): PracticeBank {
  const merged: PracticeBank = {};
  for (const bank of banks) {
    for (const [subject, topics] of Object.entries(bank ?? {})) {
      const target = merged[subject] ??= {};
      for (const [topic, difficulties] of Object.entries(topics)) {
        const questions = target[topic] ??= { easy: [], medium: [], hard: [] };
        for (const difficulty of ['easy', 'medium', 'hard'] as PracticeDifficulty[]) {
          questions[difficulty].push(...difficulties[difficulty]);
        }
      }
    }
  }
  return merged;
}
