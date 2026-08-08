// Domain types shared across the Astro site. Mirrors the shapes actually
// found in the legacy js/*.js files and data/*.json fixtures.

export interface Flashcard {
  term: string;
  definition: string;
}

/** Keyed by unit name, e.g. FLASHCARD_UNITS in js/flashcard_units_1_12.js */
export type FlashcardUnit = Record<string, Flashcard[]>;

export interface QuizItem {
  id: string;
  stem: string;
  options: string[];
  answer_index: number; // zero-based index into `options`
  rationale: string;
}

export interface PracticeItem {
  id: string;
  question: string;
  choices: string[];
  answer: string; // one of the strings in `choices`, not an index
}

export type PracticeDifficulty = 'easy' | 'medium' | 'hard';

/** subject -> unit -> difficulty -> items, e.g. econ_grouped_by_module_unit_with_choices.json */
export type PracticeBank = Record<string, Record<string, Record<PracticeDifficulty, PracticeItem[]>>>;

export interface IdExerciseItem {
  id: string;
  vignette: string;
  options: string[];
  answer_index: number; // zero-based index into `options`
  countermove: string;
  rationale: string;
}

export interface CourseModule {
  id: string;
  title: string;
  minutes: number;
}
