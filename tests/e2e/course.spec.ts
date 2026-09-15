import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';

const pre = { completed: true, score: 100, answers: Array(10).fill(0), correctness: Array(10).fill(true) };
const lessons = { preQuiz: pre, m1: { video: true, article: true }, m2: { video: true, article: true, idExercise: true }, m3: { video: true, article: true, drillsChecked: false }, m4: { article: true, auditSubmitted: true, auditId: 'seed' } };
async function seed(page: Page, state: object, hash = '') {
  await page.addInitScript(state => { if (!sessionStorage.getItem('course-seeded')) { localStorage.setItem('ff_dp_state', JSON.stringify(state)); sessionStorage.setItem('course-seeded', 'yes'); } }, state);
  await page.goto(`/courseone${hash}`);
  await expect(page.locator('.course-main')).toHaveAttribute('aria-busy', 'false');
}
async function answerQuiz(page: Page, id: string, answers: number[]) {
  for (let i = 0; i < answers.length; i++) {
    await page.locator(`#${id}-quiz-root input[value="${answers[i]}"]`).check();
    if (i < answers.length - 1) await page.getByRole('button', { name: 'Next question' }).click();
  }
  await page.locator(`#${id}-submit`).click();
}
async function answers(page: Page, path = '/data/quiz.json') {
  return page.evaluate(async path => (await (await fetch(path)).json()).items.map((item: {answer_index: number}) => item.answer_index) as number[], path);
}
async function continueTo(page: Page, name: string) {
  await page.getByRole('button', { name: `Continue to ${name}`, exact: false }).click();
}
async function readLesson(page: Page, unit: number) {
  if (unit < 4) {
    const section = page.locator(`#module-${unit}`);
    await section.getByText('Prefer to read? Open the video notes').click();
    await section.getByRole('button', { name: 'I’ve read the video notes' }).click();
  }
  const section = page.locator(`#module-${unit}`);
  await section.locator('.course-article-end').scrollIntoViewIfNeeded();
  await section.getByRole('button', { name: 'Mark article as read', exact: true }).click();
}
async function audit(page: Page) {
  await page.locator('[name="merchant"]').fill('Example Shop');
  await page.locator('[name="action"]').selectOption('cancel');
  await page.locator('[name="date"]').fill('2026-09-14T12:00');
  await page.locator('[name="channel"]').selectOption('email');
  await page.locator('[name="saw"]').fill('The page offered a pause instead of cancellation.');
  await page.locator('[name="patterns"][value="Interface interference"]').check();
  await page.locator('[name="evidence"][value="confirmation"]').check();
  await page.getByRole('button', { name: 'Save evidence record' }).click();
}

test('complete Course One through the real lessons, exercises, audit and final quiz', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/courses');
  await page.getByRole('link', { name: 'Open course Dark Patterns: How to Spot Them' }).click();
  await expect(page.getByRole('button', { name: /Foundations/ })).toBeDisabled();
  await answerQuiz(page, 'pre', Array(10).fill(0));
  await expect(page.locator('#pre-result')).toContainText('starting point');
  await continueTo(page, 'foundations');
  await readLesson(page, 1);
  await continueTo(page, 'spot the pattern');
  await readLesson(page, 2);
  const key = await answers(page, '/data/id-exercise.json');
  const items = page.locator('#id-ex-root .q-item');
  for (let i = 0; i < key.length; i++) await items.nth(i).locator(`input[value="${key[i]}"]`).check();
  await page.getByRole('button', { name: 'Check answers', exact: true }).click();
  await expect(page.getByText('Pattern practice complete')).toBeVisible();
  await continueTo(page, 'push back');
  await readLesson(page, 3);
  await continueTo(page, 'keep the evidence');
  await readLesson(page, 4);
  await audit(page);
  await expect(page.locator('#audit-output')).toContainText('Example Shop');
  await continueTo(page, 'final quiz');
  await answerQuiz(page, 'post', await answers(page));
  await expect(page.locator('#post-result')).toContainText('Assessment passed');
  await continueTo(page, 'your certificate');
  await expect(page.locator('#certificate')).toBeVisible();
  await expect(page.locator('.course-outline-heading')).toContainText('100% complete');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ff_dp_state')!));
  expect(stored.postQuiz.pass).toBe(true);
  expect(stored.m4.auditSubmitted).toBe(true);
  expect(errors).toEqual([]);
});

test('prequiz saves choices, restores them on reload, and supports keyboard navigation', async ({ page }) => {
  await seed(page, {});
  await expect(page.getByRole('button', { name: 'Next question' })).toBeDisabled();
  const radios = page.locator('#pre-quiz-root input');
  await radios.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeChecked();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.locator('#pre-quiz-root input').nth(2).check();
  await page.reload();
  await expect(page.locator('#pre-quiz-root input').nth(1)).toBeChecked();
  await page.getByRole('button', { name: 'Question 2, answered', exact: true }).click();
  await expect(page.locator('#pre-quiz-root input').nth(2)).toBeChecked();
  await expect(page.locator('#pre-question')).toBeFocused();
});

test('article failure is recoverable and never counts as reading the lesson', async ({ page }) => {
  await page.route('**/content/01-foundations.md', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await seed(page, { preQuiz: pre });
  await expect(page.getByText('This lesson couldn’t load.')).toBeVisible();
  await expect(page.locator('#m1-mark-read')).toBeDisabled();
  await page.unroute('**/content/01-foundations.md');
  await page.getByRole('button', { name: 'Try loading again' }).click();
  await expect(page.locator('#md-01')).not.toBeEmpty();
  await expect(page.locator('#m1-mark-read')).toBeDisabled();
  await page.locator('.course-article-end').first().scrollIntoViewIfNeeded();
  await page.locator('#m1-mark-read').click();
  await page.reload();
  await expect(page.locator('#m1-mark-read')).toHaveText('Article completed');
  await expect(page.locator('#m1-mark-read')).toBeDisabled();
});

test('videos expose controls, finish once, and retain completion after reloading', async ({ page }) => {
  await seed(page, { preQuiz: pre });
  const video = page.locator('#m1-video');
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).toHaveAttribute('preload', 'none');
  await video.evaluate((video: HTMLVideoElement) => { video.dispatchEvent(new Event('ended')); video.dispatchEvent(new Event('ended')); });
  await expect(page.locator('.course-activity-label').first()).toContainText('Complete');
  await page.reload();
  await expect(page.locator('.course-activity-label').first()).toContainText('Complete');
});

test('video errors offer a retry and text alternative', async ({ page }) => {
  await seed(page, { preQuiz: pre });
  await page.locator('#m1-video').evaluate(video => video.dispatchEvent(new Event('error')));
  await expect(page.getByRole('button', { name: 'Retry video' })).toBeVisible();
  await page.getByText('Prefer to read? Open the video notes').click();
  await page.getByRole('button', { name: 'I’ve read the video notes' }).click();
  await expect(page.locator('.course-activity-label').first()).toContainText('Complete');
});

test('final quiz failure locks answers; retaking clears them; 80% passes', async ({ page }) => {
  await seed(page, lessons);
  const key = await answers(page);
  await answerQuiz(page, 'post', key.map(answer => (answer + 1) % 4));
  await expect(page.locator('#post-result')).toContainText('80%');
  await expect(page.locator('#post-quiz-root input').first()).toBeDisabled();
  await expect(page.getByRole('button', { name: /Your certificate/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('#post-result')).toHaveCount(0);
  await expect(page.locator('#post-quiz-root input:checked')).toHaveCount(0);
  await answerQuiz(page, 'post', key.map((answer, i) => i < Math.ceil(key.length * .8) ? answer : (answer + 1) % 4));
  await expect(page.locator('#post-result')).toContainText('Assessment passed');
  await continueTo(page, 'your certificate');
  await expect(page.locator('#certificate')).toBeVisible();
});

test('final quiz retries failed loading', async ({ page }) => {
  await page.route('**/data/quiz.json', route => route.fulfill({ status: 503 }));
  await seed(page, lessons);
  await expect(page.getByText('The quiz couldn’t load.')).toBeVisible();
  await page.unroute('**/data/quiz.json');
  await page.getByRole('button', { name: 'Try loading again' }).click();
  await expect(page.locator('#post-quiz-root input')).toHaveCount(4);
});

test('evidence records restore after reloading and require a pattern', async ({ page }) => {
  await seed(page, { ...lessons, m4: { article: false, auditSubmitted: false, auditId: null } });
  await audit(page);
  await page.reload();
  await expect(page.locator('#audit-output')).toContainText('Example Shop');
  await expect(page.locator('#audit-form')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ff_risk_audits')!).length)).toBe(1);
});

test('certificate prints only the certificate and downloads a branded badge', async ({ page }) => {
  await seed(page, { ...lessons, postQuiz: { completed: true, pass: true, score: 90, answers: [], correctness: [] } });
  await page.locator('#certificate-name').fill('Alex Rivera');
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Print or save certificate' }).click();
  await expect(page.locator('#cert-name')).toHaveText('Alex Rivera');
  await expect(page.locator('#cert-score')).toHaveText('90%');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#certificate-sheet')).toBeVisible();
  await expect(page.locator('.course-outline')).toBeHidden();
  await expect(page.locator('.course-heading')).toBeHidden();
  await expect(page.locator('#pre-quiz')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Badge (PNG)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Fynoptic_Dark-Pattern-Spotter.png');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const png = PNG.sync.read(Buffer.concat(chunks));
  expect(png.width).toBe(512);
  const center = (256 * png.width + 256) * 4;
  expect(png.data[center + 3]).toBe(255);
  expect([...png.data].some((value, index) => index % 4 === 0 && value < 100)).toBe(true);
});

for (const theme of ['light', 'dark']) for (const width of [390, 768, 1366]) {
  test(`course layouts and accessibility at ${width}px in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(theme => localStorage.setItem('fynoptic-theme', theme), theme);
    await seed(page, { ...lessons, postQuiz: { completed: true, pass: true, score: 90, answers: [], correctness: [] } });
    for (const name of ['Prequiz', 'Foundations', 'Spot the pattern', 'Push back', 'Keep the evidence', 'Final quiz', 'Your certificate']) {
      await page.locator('.course-outline').getByRole('button', { name: new RegExp(name) }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (name === 'Keep the evidence') {
        const rows = await page.locator('#audit-form').evaluate(form => Array.from(form.children).map(child => ({ top: child.getBoundingClientRect().top, bottom: child.getBoundingClientRect().bottom })));
        for (let i = 1; i < rows.length; i++) expect(rows[i]!.top).toBeGreaterThanOrEqual(rows[i - 1]!.bottom);
      }
      const violations = (await new AxeBuilder({page}).include('.course-workspace').withTags(['wcag2a', 'wcag2aa']).analyze()).violations;
      expect(violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)}))).toEqual([]);
      await page.screenshot({ path: `/tmp/fynoptic-course-${width}-${theme}-${name.replaceAll(' ', '-')}.png` });
    }
  });
}


test('identification mistakes do not unlock the next lesson and can be corrected', async ({ page }) => {
  await seed(page, { preQuiz: pre, m1: lessons.m1, m2: { video: true, article: true, idExercise: false } });
  const key = await answers(page, '/data/id-exercise.json');
  const items = page.locator('#id-ex-root .q-item');
  for (let i = 0; i < key.length; i++) await items.nth(i).locator(`input[value="${(key[i]! + 1) % 4}"]`).check();
  await page.getByRole('button', { name: 'Check answers', exact: true }).click();
  await expect(page.locator('#id-ex-result')).toContainText('incorrect');
  await expect(page.getByRole('button', { name: 'Continue to push back' })).toBeDisabled();
  for (let i = 0; i < key.length; i++) await items.nth(i).locator(`input[value="${key[i]}"]`).check();
  await page.getByRole('button', { name: 'Check answers', exact: true }).click();
  await page.reload();
  await page.locator('.course-outline').getByRole('button', { name: /Spot the pattern/ }).click();
  await expect(page.getByText('Pattern practice complete')).toBeVisible();
});

test('course readings have working contents links and contain no draft placeholders', async ({ page }) => {
  await seed(page, lessons, '#module-2');
  await expect(page.locator('#md-02 .course-reading-title')).toBeVisible();
  await page.locator('#md-02').getByText('In this lesson', { exact: true }).click();
  await page.locator('#md-02 .article-toc').getByRole('link', { name: 'Misdirection' }).click();
  await expect(page).toHaveURL(/#lesson-02-misdirection$/);
  await expect(page.locator('#lesson-02-misdirection')).toBeInViewport();
  await page.reload();
  await expect(page.locator('#module-2')).toBeVisible();
  await expect(page.locator('#lesson-02-misdirection')).toBeInViewport();
  await expect(page.locator('#md-02')).not.toContainText('repeat for');
  await expect(page.locator('main h1')).toHaveCount(1);
});


test('the actual lesson video plays, pauses, and supports playback controls', async ({ page }) => {
  await seed(page, { preQuiz: pre });
  const video = page.locator('#m1-video');
  await video.evaluate((video: HTMLVideoElement) => video.play());
  await expect.poll(() => video.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(.2);
  await video.evaluate((video: HTMLVideoElement) => { video.pause(); video.playbackRate = 1.5; });
  expect(await video.evaluate((video: HTMLVideoElement) => ({ paused: video.paused, rate: video.playbackRate, error: video.error }))).toEqual({ paused: true, rate: 1.5, error: null });
});

test('prequiz works with a throttled CPU and does not preload lesson videos', async ({ page, context }) => {
  const requests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()); });
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await page.setViewportSize({ width: 1366, height: 768 });
  await seed(page, {});
  await page.locator('#pre-quiz-root input').first().check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await expect(page.locator('.course-quiz-meta')).toContainText('Question 2 of 10');
  expect(requests).toEqual([]);
});

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  for (const quiz of ['pre', 'post'] as const) {
    test(`${quiz} quiz keeps the scroll position when changing questions at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await seed(page, quiz === 'post' ? lessons : {});
      const root = page.locator(`#${quiz}-quiz-root`);
      await expect(root).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const next = root.getByRole('button', { name: 'Next question' });
      const previous = root.getByRole('button', { name: 'Previous', exact: true });
      const changeQuestion = async (button: typeof next, question: number) => {
        await button.scrollIntoViewIfNeeded();
        const before = await page.evaluate(() => ({ x: scrollX, y: scrollY, hash: location.hash }));
        await button.click();
        await expect(root.locator('.course-quiz-meta')).toContainText(`Question ${question} of`);
        await expect(page.locator(`#${quiz}-question`)).toBeFocused();
        // Include the next paint and native scroll anchoring, not just the click handler.
        await page.waitForTimeout(150);
        const after = await page.evaluate(() => ({ x: scrollX, y: scrollY, hash: location.hash }));
        expect(after.hash).toBe(before.hash);
        expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
        expect(after.x).toBe(before.x);
      };
      const questionCount = await root.locator('.course-question-jumps button').count();
      for (let question = 2; question <= questionCount; question++) {
        await root.locator('input[type="radio"]').first().check();
        await changeQuestion(next, question);
      }
      await changeQuestion(previous, questionCount - 1);
      await changeQuestion(root.getByRole('button', { name: 'Question 1, answered', exact: true }), 1);
    });
  }
}
