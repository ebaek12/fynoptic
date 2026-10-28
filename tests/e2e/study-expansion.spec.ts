import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect } from '@playwright/test';
import { PRACTICE_BANK_PATHS } from '../../src/lib/practice-banks';
import type { PracticeBank, FlashcardUnit } from '../../src/types';

const readBank = (path: string): PracticeBank => JSON.parse(readFileSync(resolve(path.slice(1)), 'utf8'));
const additions = PRACTICE_BANK_PATHS.slice(2, 4).map(readBank);
const flashcards: FlashcardUnit = JSON.parse(readFileSync(resolve('src/data/flashcard-expansion.json'), 'utf8'));

test('the deployed data files include all 7,286 practice questions', async ({ request }) => {
  let count = 0;
  for (const path of PRACTICE_BANK_PATHS) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    const bank: PracticeBank = await response.json();
    const questions = Object.values(bank).flatMap(topics =>
      Object.values(topics).flatMap(levels => Object.values(levels).flat()));
    if (path.includes('expansion')) {
      expect(questions).toHaveLength(500);
      expect(questions.every(q => q.explanation && q.choices.includes(q.answer))).toBe(true);
    }
    count += questions.length;
  }
  expect(count).toBe(7286);
});

for (const bank of additions) {
  const [category, topics] = Object.entries(bank)[0]!;
  const [topic, levels] = Object.entries(topics)[0]!;
  const items = Object.values(levels).flat();
  test(`new ${category} questions grade correctly and retain explanations on review`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/practice');
    await page.locator('.study-bank', { hasText: category }).click();
    await page.locator('#wiz-next-1').click();
    const chip = page.locator('#topics-list .study-topic', { hasText: topic });
    await expect(chip.locator('.topic-btn-count')).toHaveText('50');
    await chip.click();
    await page.locator('#start-btn').click();
    const prompt = await page.locator('#prompt').innerText();
    const question = items.find(item => item.question === prompt)!;
    expect(question).toBeDefined();
    await page.getByRole('button', { name: question.answer, exact: true }).click();
    await page.locator('#submit-btn').click();
    await expect(page.locator('#feedback')).toContainText('Correct!');
    await expect(page.locator('#feedback')).toContainText(question.explanation!);
    await expect(page.locator('#next-btn')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.locator('#next-btn').click();
    await page.locator('#prev-btn').click();
    await expect(page.locator('#prompt')).toHaveText(question.question);
    await expect(page.locator('#feedback')).toContainText(question.explanation!);
  });
}

for (const mode of ['mc', 'fitb'] as const) {
  const [unit, cards] = Object.entries(flashcards)[mode === 'mc' ? 0 : Object.keys(flashcards).length - 1]!;
  const card = cards[0]!;
  test(`new flashcards work in ${mode} mode and keep old saved progress`, async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('fynoptic.flashcards.v1')) {
        localStorage.setItem('fynoptic.flashcards.v1', JSON.stringify({ answers: {
          'Banking::Bank': { correct: true, attempts: 1, lastAt: 1 },
        } }));
      }
    });
    await page.goto('/flashcard');
    await expect(page.locator('#unit-list .study-topic')).toHaveCount(62);
    const topic = page.locator('#unit-list .study-topic').filter({ has: page.getByText(unit, { exact: true }) });
    await topic.click();
    await page.locator('#confirm-units').click();
    await page.locator('#shuffle').uncheck();
    if (mode === 'fitb') await page.locator('label.study-mode', { hasText: 'Fill in the Blank' }).click();
    await page.locator('#start-btn-big').click();
    await expect(page.locator('#def-text')).toHaveText(card.definition);
    if (mode === 'mc') {
      await page.getByRole('button', { name: card.term, exact: true }).click();
      await page.locator('#submit-btn').click();
    } else {
      await page.locator('#fitb-input').fill(card.term);
      await page.locator('#fitb-input').press('Enter');
    }
    await expect(page.locator('#stat-correct')).toHaveText('1');
    const answers = await page.evaluate(() => JSON.parse(localStorage.getItem('fynoptic.flashcards.v1')!).answers);
    expect(answers[`${unit}::${card.term}`].correct).toBe(true);
    expect(answers['Banking::Bank']).toEqual({ correct: true, attempts: 1, lastAt: 1 });
    await page.reload();
    await expect(topic).toContainText('2% mastered');
    await expect(page.locator('#unit-banking')).toContainText('2% mastered');
  });
}

test('a failed expansion request still leaves the original bank usable', async ({ page }) => {
  await page.route('**/data/practice-personal-finance-expansion.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/practice');
  await expect(page.locator('.toast-container')).toContainText('Some practice questions could not load');
  await page.locator('#wiz-next-1').click();
  await expect(page.locator('#topics-list .study-topic')).toHaveCount(26);
  await page.locator('#topics-select-all').click();
  await page.locator('#start-btn').click();
  await expect(page.locator('#prompt')).not.toBeEmpty();
  await page.locator('.mc-option').first().click();
  await page.locator('#submit-btn').click();
  await expect(page.locator('#feedback')).toBeVisible();
});

test('long practice explanations keep navigation usable on a small phone', async ({ page }) => {
  const economics = additions.find(bank => bank.Economics)!;
  const items = Object.values(economics.Economics!).flatMap(levels => Object.values(levels).flat());
  const longest = [...items].sort((a, b) =>
    (b.answer.length + (b.explanation?.length ?? 0)) - (a.answer.length + (a.explanation?.length ?? 0)))[0]!;
  await page.route('**/data/practice-economics-expansion.json', route => route.fulfill({ json: {
    Economics: { 'Explanation review': { easy: [], medium: [longest], hard: [] } },
  } }));
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/practice');
  await page.locator('.study-bank', { hasText: 'Economics' }).click();
  await page.locator('#wiz-next-1').click();
  await page.locator('#topics-list .study-topic', { hasText: 'Explanation Review' }).click();
  await page.locator('#start-btn').click();
  await page.getByRole('button', { name: longest.choices.find(choice => choice !== longest.answer)!, exact: true }).click();
  await page.locator('#submit-btn').click();
  await expect(page.locator('#feedback')).toContainText(longest.explanation!);
  await expect(page.locator('#next-btn')).toBeInViewport();
  const bounds = await page.locator('.session-workspace').boundingBox();
  expect(bounds!.height).toBeGreaterThan(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
