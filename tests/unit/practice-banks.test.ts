import { describe, expect, it } from 'vitest';
import { mergePracticeBanks } from '../../src/lib/practice-banks';
import { parsePracticeBank } from '../../src/schemas';
import type { PracticeBank, PracticeItem } from '../../src/types';

const item: PracticeItem = {
  id: 'example', question: 'What does a budget compare?',
  choices: ['Income and expenses', 'Only investment prices'],
  answer: 'Income and expenses', explanation: 'A budget compares money coming in with planned uses.',
};
const bank = (items: PracticeItem[]): PracticeBank => ({
  'Personal Finance': { Budgeting: { easy: items, medium: [], hard: [] } },
});

describe('practice bank loading', () => {
  it('combines subjects and shared topics without discarding or mutating earlier questions', () => {
    const base = bank([item]);
    const extra = bank([{ ...item, id: 'additional' }]);
    const economics: PracticeBank = { Economics: { Trade: { easy: [], medium: [item], hard: [] } } };
    const result = mergePracticeBanks([base, null, extra, economics]);
    expect(result['Personal Finance']!.Budgeting!.easy.map(q => q.id)).toEqual(['example', 'additional']);
    expect(result.Economics!.Trade!.medium).toEqual([item]);
    expect(base['Personal Finance']!.Budgeting!.easy).toHaveLength(1);
    expect(extra['Personal Finance']!.Budgeting!.easy).toHaveLength(1);
    result['Personal Finance']!.Budgeting!.easy.pop();
    expect(extra['Personal Finance']!.Budgeting!.easy).toHaveLength(1);
  });

  it('keeps explanations through boundary validation', () => {
    const result = parsePracticeBank(bank([item]), 'test');
    expect(result['Personal Finance']!.Budgeting!.easy[0]!.explanation).toBe(item.explanation);
  });

  it.each([
    { ...item, answer: 'Not an option' },
    { ...item, choices: ['Same', 'Same'], answer: 'Same' },
    { ...item, choices: ['Income and expenses', ''] },
    { ...item, explanation: '   ' },
  ])('rejects an unusable question instead of silently grading it', (invalid) => {
    expect(() => parsePracticeBank(bank([invalid]), 'test')).toThrow('Invalid test');
  });

  it('requires every difficulty bucket used by the session engine', () => {
    expect(() => parsePracticeBank({ Subject: { Topic: { easy: [item] } } }, 'test')).toThrow();
  });
});
