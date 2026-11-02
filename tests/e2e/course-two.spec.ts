import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { readingSeconds, SUBSCRIPTION_FINAL, SUBSCRIPTION_LESSONS, SUBSCRIPTION_PREQUIZ } from '../../src/data/course-two';
import { initialSubscriptionProgress, SUBSCRIPTION_KEY, type SubscriptionProgress } from '../../src/lib/subscription-progress';

const courseOne = { preQuiz: { completed: true, score: 100, answers: Array(10).fill(0), correctness: Array(10).fill(true) }, m1: { video: true, article: true }, m2: { video: true, article: true, idExercise: true }, m3: { video: true, article: true, drillsChecked: false }, m4: { article: true, auditSubmitted: true, auditId: 'test-record' }, postQuiz: { completed: true, pass: true, score: 90, answers: [], correctness: [] } };

function readyState(completed = 0): SubscriptionProgress {
  const state = initialSubscriptionProgress();
  state.diagnostic = { answers: SUBSCRIPTION_PREQUIZ.map(q => q.answerIndex), submitted: true };
  for (let i = 0; i < completed; i++) {
    const lesson = SUBSCRIPTION_LESSONS[i]!;
    state.lessons[i] = { seconds: lesson.sections.map(readingSeconds), read: lesson.sections.length, fields: lesson.activity.fields.map(field => field.answer), activityPassed: true, answers: lesson.questions.map(q => q.answerIndex), checked: true };
  }
  return state;
}
async function seed(page: Page, state = initialSubscriptionProgress(), path = '/coursetwo') {
  await page.addInitScript(({ one, two, key }) => {
    if (sessionStorage.getItem('subscriptions-test-seeded')) return;
    localStorage.setItem('ff_dp_state', JSON.stringify(one));
    localStorage.setItem(key, JSON.stringify(two));
    sessionStorage.setItem('subscriptions-test-seeded', 'true');
  }, { one: courseOne, two: state, key: SUBSCRIPTION_KEY });
  await page.goto(path);
  await expect(page.locator('.course-main')).toHaveAttribute('aria-busy', 'false');
}
async function answerQuiz(page: Page, id: string, answers: number[]) {
  const root = page.locator(`#${id}-quiz-root`);
  for (let i = 0; i < answers.length; i++) {
    await root.locator(`input[value="${answers[i]}"]`).check();
    if (i < answers.length - 1) await root.getByRole('button', { name: 'Next question' }).click();
  }
  await page.locator(`#${id}-submit`).click();
}

test('course 2 checks prerequisites on direct URLs and the library accurately represents all 13 courses', async ({ page }) => {
  await page.goto('/coursetwo#certificate');
  await expect(page.getByRole('heading', { name: 'First, finish Course 1.' })).toBeVisible();
  await expect(page.locator('#certificate')).toHaveCount(0);
  await page.goto('/courses');
  await expect(page.locator('.library-card')).toHaveCount(13);
  await expect(page.locator('[data-course-id="subscriptions"]')).toContainText('Locked until Course 1 is complete');
  await expect(page.getByText('Coming soon', { exact: true })).toHaveCount(11);
  await page.evaluate(one => localStorage.setItem('ff_dp_state', JSON.stringify({ postQuiz: one.postQuiz, certificate: { issued: true } })), courseOne);
  await page.goto('/coursetwo#assessment');
  await expect(page.getByRole('heading', { name: 'First, finish Course 1.' })).toBeVisible();
  await page.evaluate(one => localStorage.setItem('ff_dp_state', JSON.stringify(one)), courseOne);
  await page.goto('/courses');
  await page.getByRole('link', { name: 'Open course Subscriptions & Memberships' }).click();
  await expect(page.locator('#subscription-pre-quiz-root')).toBeVisible();
});

test('fresh progress blocks later hashes, preserves diagnostic answers, and requires real reading time', async ({ page }) => {
  await page.clock.install();
  await seed(page, initialSubscriptionProgress(), '/coursetwo#assessment');
  await expect(page).toHaveURL(/#start$/);
  await expect(page.locator('.course-outline').getByRole('button', { name: /Final assessment/ })).toBeDisabled();
  await page.locator('#subscription-pre-quiz-root input[value="1"]').check();
  await page.reload();
  await expect(page.locator('#subscription-pre-quiz-root input[value="1"]')).toBeChecked();
  await answerQuiz(page, 'subscription-pre', SUBSCRIPTION_PREQUIZ.map(q => q.answerIndex));
  await page.getByRole('button', { name: 'Continue to module 1' }).click();
  await expect(page.getByRole('button', { name: /Part 2:/ })).toBeDisabled();
  await page.locator('[data-reading-end]').scrollIntoViewIfNeeded();
  const finish = page.getByRole('button', { name: 'Complete part & continue' });
  await expect(finish).toBeDisabled();
  await page.clock.runFor(5000);
  await page.reload();
  await expect(page.locator('.course-main')).toBeVisible();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SUBSCRIPTION_KEY);
  expect(saved.lessons[0].seconds[0]).toBeGreaterThanOrEqual(5);
  await page.locator('[data-reading-end]').scrollIntoViewIfNeeded();
  // A background tab may not earn reading progress.
  await page.evaluate(() => Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }));
  await page.clock.runFor(10_000);
  const hidden = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).lessons[0].seconds[0], SUBSCRIPTION_KEY);
  expect(hidden).toBe(saved.lessons[0].seconds[0]);
  await page.evaluate(() => Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }));
  await page.clock.runFor(readingSeconds(SUBSCRIPTION_LESSONS[0]!.sections[0]!) * 1000);
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(page.locator('.course-reading-title')).toHaveText('Make a six-line offer card');
  await expect(page.locator('#activity-1')).toHaveCount(0);
});

test('complete every course 2 reading, case, knowledge check, final assessment, workbook, and certificate', async ({ page }) => {
  test.setTimeout(240_000);
  await page.clock.install();
  await seed(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await answerQuiz(page, 'subscription-pre', [0, 0, 0, 0]);
  await page.getByRole('button', { name: 'Continue to module 1' }).click();
  for (let i = 0; i < SUBSCRIPTION_LESSONS.length; i++) {
    const lesson = SUBSCRIPTION_LESSONS[i]!;
    for (let j = 0; j < lesson.sections.length; j++) {
      await expect(page.locator('.course-reading-title')).toHaveText(lesson.sections[j]!.title);
      await page.locator('[data-reading-end]').scrollIntoViewIfNeeded();
      await page.clock.runFor((readingSeconds(lesson.sections[j]!) + 1) * 1000);
      const finish = page.getByRole('button', { name: j === 3 ? 'Finish reading' : 'Complete part & continue' });
      await expect(finish, `Module ${i + 1}, part ${j + 1}: ${await page.locator('.course-reading-gate').innerText()}`).toBeEnabled();
      await finish.click();
    }
    for (let j = 0; j < lesson.activity.fields.length; j++) {
      const field = lesson.activity.fields[j]!;
      const control = page.getByLabel(field.label, { exact: true });
      if (field.type === 'select') await control.selectOption(field.answer);
      else await control.fill(field.answer);
    }
    if (i === 0) {
      await page.getByLabel(lesson.activity.fields[0]!.label, { exact: true }).fill('140');
      await page.getByRole('button', { name: 'Check my work' }).click();
      await expect(page.locator('.course-check-panel')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Continue to module 2' })).toBeDisabled();
      await page.getByLabel(lesson.activity.fields[0]!.label, { exact: true }).fill('142');
    }
    await page.getByRole('button', { name: 'Check my work' }).click();
    for (let j = 0; j < lesson.questions.length; j++) await page.locator(`input[name="check-${i}-${j}"][value="${lesson.questions[j]!.answerIndex}"]`).check();
    if (i === 0) {
      await page.locator('input[name="check-0-0"][value="0"]').check();
      await page.getByRole('button', { name: 'Check understanding' }).click();
      await expect(page.getByRole('button', { name: 'Continue to module 2' })).toBeDisabled();
      await page.locator(`input[name="check-0-0"][value="${lesson.questions[0]!.answerIndex}"]`).check();
    }
    await page.getByRole('button', { name: 'Check understanding' }).click();
    await page.getByRole('button', { name: i === 5 ? 'Continue to final assessment' : `Continue to module ${i + 2}` }).click();
  }
  await answerQuiz(page, 'subscription-final', SUBSCRIPTION_FINAL.map(q => (q.answerIndex + 1) % q.options.length));
  await expect(page.getByRole('button', { name: 'Continue to your certificate' })).toBeDisabled();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await answerQuiz(page, 'subscription-final', SUBSCRIPTION_FINAL.map(q => q.answerIndex));
  await expect(page.locator('#subscription-final-result')).toContainText('100%');
  await page.getByRole('button', { name: 'Continue to your certificate' }).click();
  await expect(page.locator('.course-outline-heading')).toContainText('100% complete');
  await page.getByLabel('Name on your certificate').fill('Course Test Learner');
  await page.evaluate(() => { window.print = () => { document.body.dataset.printRequested = 'true'; }; });
  await page.getByRole('button', { name: 'Print or save certificate' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-print-requested', 'true');
  await expect(page.locator('.certificate-sheet')).toContainText('Course Test Learner');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download workbook (.txt)' }).click();
  const workbook = await downloadPromise;
  expect(workbook.suggestedFilename()).toBe('Fynoptic-Subscription-Workbook.txt');
  expect(await readFile((await workbook.path())!, 'utf8')).toContain('Projected annual cost after GameBox is cancelled ($): 264');
  await page.reload();
  await expect(page.locator('#certificate')).toBeVisible();
  await expect(page.getByLabel('Name on your certificate')).toHaveValue('Course Test Learner');
  expect(errors).toEqual([]);
});

test('malformed future progress is discarded, and locked content stays unmounted', async ({ page }) => {
  const state = readyState(6);
  state.lessons[1]!.seconds[0] = 0;
  state.final = { answers: SUBSCRIPTION_FINAL.map(q => q.answerIndex), submitted: true, attempts: 1 };
  await seed(page, state, '/coursetwo#certificate');
  await expect(page).toHaveURL(/#lesson-2$/);
  await expect(page.locator('#certificate')).toHaveCount(0);
  await expect(page.locator('#subscription-final-quiz-root')).toHaveCount(0);
  await expect(page.locator('.course-outline').getByRole('button', { name: /Choose a plan worth keeping/ })).toBeDisabled();
});

test('storage failures are visible without crashing the learning session', async ({ page }) => {
  await seed(page, readyState());
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
  await expect(page.getByRole('alert')).toContainText('Browser storage is unavailable');
  await expect(page.locator('.course-reading-title')).toBeVisible();
});

for (const theme of ['light', 'dark']) for (const width of [390, 768, 1366]) {
  test(`course 2 readings, activities, assessment, and award are accessible at ${width}px in ${theme}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(theme => localStorage.setItem('fynoptic-theme', theme), theme);
    const state = readyState(6);
    state.final = { answers: SUBSCRIPTION_FINAL.map(q => q.answerIndex), submitted: true, attempts: 1 };
    state.certificate = { name: 'Course Test Learner', date: '2026-11-01', id: 'FYN-SM-TEST' };
    await seed(page, state, '/coursetwo#lesson-1');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('body')).toHaveAttribute('data-theme', theme);
    for (const title of ['Read the real offer', 'Cancel all the way through', 'Build your subscription system', 'Final assessment', 'Your certificate']) {
      await page.locator('.course-outline').getByRole('button', { name: new RegExp(title) }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const violations = (await new AxeBuilder({ page }).include('.course-workspace').withTags(['wcag2a', 'wcag2aa']).analyze()).violations;
      expect(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    }
    await page.screenshot({ path: `/tmp/fynoptic-course2-${width}-${theme}-certificate.png`, fullPage: true });
    await page.locator('.course-outline').getByRole('button', { name: /Read the real offer/ }).click();
    await page.locator('.course-reading-tabs').getByRole('button', { name: /Part 1:/ }).click();
    await page.screenshot({ path: `/tmp/fynoptic-course2-${width}-${theme}-lesson.png`, fullPage: true });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/fynoptic-course2-${width}-${theme}-hero.png` });
    if (width === 1366 && theme === 'light') {
      await page.locator('.course-outline').getByRole('button', { name: /Your certificate/ }).click();
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('.certificate-sheet')).toBeVisible();
      await expect(page.locator('.course-heading')).toBeHidden();
      await expect(page.locator('.course-sources')).toBeHidden();
      await page.screenshot({ path: '/tmp/fynoptic-course2-print.png', fullPage: true });
    }
  });
}
