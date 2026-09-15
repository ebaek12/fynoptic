// Zod schemas for the JSON files fetched at runtime in the browser
// (quiz.json, id-exercise.json, and the two practice question banks).
// These are the boundary-validation counterpart to src/types.ts.

import { z } from 'zod';
import type { IdExerciseItem, PracticeBank, QuizItem } from './types';

const quizItemSchema = z.object({
  id: z.string(),
  stem: z.string(),
  options: z.array(z.string()).min(2),
  answer_index: z.number().int().nonnegative(),
  rationale: z.string(),
}).refine(item => item.answer_index < item.options.length, { message: 'Answer index must refer to an option' });

const quizFileSchema = z.object({
  items: z.array(quizItemSchema).min(1),
});

export function parseQuiz(data: unknown): QuizItem[] {
  const result = quizFileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid quiz.json: ${result.error.message}`);
  }
  return result.data.items;
}

const idExerciseItemSchema = z.object({
  id: z.string(),
  vignette: z.string(),
  options: z.array(z.string()).min(2),
  answer_index: z.number().int().nonnegative(),
  countermove: z.string(),
  rationale: z.string(),
}).refine(item => item.answer_index < item.options.length, { message: 'Answer index must refer to an option' });

const idExerciseFileSchema = z.object({
  items: z.array(idExerciseItemSchema).min(1),
});

export function parseIdExercise(data: unknown): IdExerciseItem[] {
  const result = idExerciseFileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid id-exercise.json: ${result.error.message}`);
  }
  return result.data.items;
}

const practiceItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  choices: z.array(z.string()),
  answer: z.string(),
});

// subject -> unit -> difficulty -> items
const practiceBankFileSchema = z.record(
  z.string(),
  z.record(z.string(), z.record(z.string(), z.array(practiceItemSchema)))
);

function parsePracticeBank(data: unknown, filename: string): PracticeBank {
  const result = practiceBankFileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid ${filename}: ${result.error.message}`);
  }
  return result.data;
}

export function parseEconBank(data: unknown): PracticeBank {
  return parsePracticeBank(data, 'econ_grouped_by_module_unit_with_choices.json');
}

export function parsePfBank(data: unknown): PracticeBank {
  return parsePracticeBank(data, 'pf_bank_modules_1of6.json');
}
