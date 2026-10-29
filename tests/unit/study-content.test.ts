import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARTICLE_META } from '../../src/data/articles';
import { BASE_FLASHCARD_UNITS, FLASHCARD_UNITS } from '../../src/data/flashcard-units';
import flashcardExpansion from '../../src/data/flashcard-expansion.json';
import { RACK_ITEMS } from '../../src/components/rack/rack-data';
import { buildDeck, buildMcOptions } from '../../src/hooks/useFlashcardDeck';
import { createSession, drawQuestion } from '../../src/hooks/usePracticeSession';
import { mergePracticeBanks, PRACTICE_BANK_PATHS } from '../../src/lib/practice-banks';
import { parsePracticeBank } from '../../src/schemas';
import { FLASHCARD_COUNTS } from '../../src/lib/flashcard-catalog';
import taxonomy from '../../src/data/study-units.json';
import type { PracticeBank, PracticeItem } from '../../src/types';

const canonical = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
const flatten = (bank: PracticeBank): PracticeItem[] => Object.values(bank)
  .flatMap(topics => Object.values(topics).flatMap(levels => Object.values(levels).flat()));
const banks = PRACTICE_BANK_PATHS.map(path => parsePracticeBank(
  JSON.parse(readFileSync(resolve(path.slice(1)), 'utf8')), path,
));
const baseQuestions = banks.slice(0, 2).flatMap(flatten);
const newQuestions = banks.slice(2).flatMap(flatten);
const combined = mergePracticeBanks(banks);

describe('expanded study content', () => {
  it('retains earlier questions and adds exactly 5,000 more practice drills', () => {
    expect(baseQuestions).toHaveLength(1286);
    expect(banks.slice(2, 4).flatMap(flatten)).toHaveLength(1000);
    expect(banks.slice(4).flatMap(flatten)).toHaveLength(5000);
    expect(newQuestions).toHaveLength(6000);
    expect(flatten(combined)).toHaveLength(7286);
    const allIds = flatten(combined).map(q => q.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    const prompts = new Set(baseQuestions.map(q => canonical(q.question)));
    for (const q of newQuestions) {
      expect(prompts.has(canonical(q.question)), q.id).toBe(false);
      prompts.add(canonical(q.question));
      expect(q.choices, q.id).toHaveLength(4);
      // Keep mathematical signs: +2% and -2% are different answers.
      expect(new Set(q.choices.map(choice => choice.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' '))).size, q.id).toBe(4);
      expect(q.choices.filter(choice => choice === q.answer), q.id).toHaveLength(1);
      expect(q.explanation?.trim(), q.id).toBeTruthy();
      for (const text of [q.question, ...q.choices, q.explanation!]) {
        expect(text, q.id).toBe(text.trim());
        expect(text, q.id).not.toMatch(/<\/?[a-z][^>]*>|\b(?:TODO|FIXME|lorem ipsum)\b/i);
      }
    }
  });

  it('can draw every added question once with its answer and explanation intact', () => {
    for (const bank of banks.slice(2)) {
      for (const [category, topics] of Object.entries(bank)) {
        const expected = flatten({ [category]: topics });
        expect(expected.length).toBeGreaterThan(0);
        const session = createSession(bank, {
          category, topics: Object.keys(topics), totalQuestions: expected.length,
          adaptive: true, adaptWindow: 10,
        })!;
        const originals = new Map(expected.map(q => [q.id, q]));
        const drawn: string[] = [];
        for (let i = 0; i < expected.length; i++) {
          const q = drawQuestion(session)!;
          drawn.push(q.id);
          expect(q.choices[q.answerIndex]).toBe(originals.get(q.id)!.answer);
          expect(q.explanation).toBe(originals.get(q.id)!.explanation);
        }
        expect(new Set(drawn).size).toBe(expected.length);
        expect(drawQuestion(session)).toBeNull();
      }
    }
  });

  it('adds 1,000 distinct flashcards while preserving existing progress identifiers', () => {
    const base = buildDeck(Object.keys(BASE_FLASHCARD_UNITS), BASE_FLASHCARD_UNITS);
    const added = buildDeck(Object.keys(flashcardExpansion), flashcardExpansion);
    const all = buildDeck(Object.keys(FLASHCARD_UNITS), FLASHCARD_UNITS);
    expect(base).toHaveLength(611);
    expect(added).toHaveLength(1000);
    expect(all).toHaveLength(1611);
    for (const [unit, cards] of Object.entries(BASE_FLASHCARD_UNITS)) {
      expect(FLASHCARD_UNITS[unit]!.slice(0, cards.length)).toEqual(cards);
    }
    expect(new Set(all.map(card => card.id)).size).toBe(all.length);
    expect(Object.keys(FLASHCARD_UNITS)).toEqual(taxonomy.flashcards);
    expect(Object.keys(flashcardExpansion).every(unit => unit in BASE_FLASHCARD_UNITS)).toBe(true);
    const terms = new Set(base.map(card => canonical(card.term)));
    const definitions = new Set(base.map(card => canonical(card.definition)));
    for (const card of added) {
      expect(terms.has(canonical(card.term)), card.term).toBe(false);
      expect(definitions.has(canonical(card.definition)), card.term).toBe(false);
      terms.add(canonical(card.term));
      definitions.add(canonical(card.definition));
      expect(card.term).toBe(card.term.trim());
      expect(card.definition).toBe(card.definition.trim());
      expect(card.term.length).toBeLessThanOrEqual(100);
      expect(card.definition.length).toBeGreaterThan(24);
      expect(card.definition.length).toBeLessThanOrEqual(600);
      expect(`${card.term} ${card.definition}`).not.toMatch(/<\/?[a-z][^>]*>|\b(?:TODO|FIXME|lorem ipsum)\b/i);
    }
  });

  it('supplies four distinct choices for every new flashcard in both answer directions', () => {
    for (const cards of Object.values(flashcardExpansion)) {
      for (const card of cards) {
        for (const answerWithTerm of [true, false]) {
          const choices = buildMcOptions(card, cards, answerWithTerm);
          expect(choices, card.term).toHaveLength(4);
          expect(new Set(choices).size, card.term).toBe(4);
          expect(choices).toContain(answerWithTerm ? card.term : card.definition);
        }
      }
    }
  });

  it('keeps the homepage library counts in sync with the content', () => {
    const rack = Object.fromEntries(RACK_ITEMS.map(item => [item.id, item]));
    expect(rack.articles!.statPrimary).toBe(`${ARTICLE_META.length.toLocaleString('en-US')} Articles`);
    expect(rack.practice!.statPrimary).toBe(`${flatten(combined).length.toLocaleString('en-US')} Questions`);
    expect(rack.practice!.statSecondary).toBe(`${Object.values(combined).reduce((n, topics) => n + Object.keys(topics).length, 0)} Topics`);
    expect(rack.flashcards!.statPrimary).toBe(`${Object.values(FLASHCARD_COUNTS).reduce((sum, count) => sum + count, 0).toLocaleString('en-US')} Cards`);
    expect(rack.flashcards!.statSecondary).toBe(`${Object.keys(FLASHCARD_COUNTS).length} Topics`);
  });

  it('uses only the original practice categories and flashcard units', () => {
    expect(Object.keys(combined)).toEqual(Object.keys(taxonomy.practice));
    for (const [category, topics] of Object.entries(taxonomy.practice)) {
      expect(Object.keys(combined[category]!)).toEqual(topics);
      for (const topic of topics) {
        const original = mergePracticeBanks(banks.slice(0, 2))[category]![topic]!;
        expect(Object.values(combined[category]![topic]!).flat().length)
          .toBeGreaterThan(Object.values(original).flat().length);
      }
    }
    expect(Object.keys(FLASHCARD_COUNTS)).toEqual(taxonomy.flashcards);
    expect(Object.values(FLASHCARD_COUNTS).reduce((sum, count) => sum + count, 0)).toBe(6611);
    expect(Object.values(FLASHCARD_COUNTS).every(count => count >= 250)).toBe(true);
  });
});
