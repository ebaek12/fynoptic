import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { COURSE_CATALOG, COURSE_ONE_LOCK_MESSAGE, outlineHref } from '../../src/data/course-catalog';
import { defaultCourseState } from '../../src/lib/progress';

const completedCourseOne = {
  ...defaultCourseState,
  preQuiz: { ...defaultCourseState.preQuiz, completed: true },
  m1: { video: true, article: true },
  m2: { video: true, article: true, idExercise: true },
  m3: { video: true, article: true, drillsChecked: false },
  m4: { article: true, auditSubmitted: true, auditId: 'outline-test' },
  postQuiz: { ...defaultCourseState.postQuiz, completed: true, pass: true, score: 80 },
};

async function setProgress(page: Page, state: unknown) {
  await page.evaluate(state => {
    localStorage.setItem('ff_dp_state', JSON.stringify(state));
    window.dispatchEvent(new Event('focus'));
  }, state);
}

for (const course of COURSE_CATALOG) {
  test(`course ${course.number} has a complete, distinct public outline`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(outlineHref(course));
    expect(response?.status()).toBe(200);
    await expect(page.locator('.course-outline-access')).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(course.headline);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(course.accent);
    await expect(page.locator('.course-module-outline > li')).toHaveCount(course.number === 1 ? 4 : 6);
    for (let i = 0; i < course.modules.length; i++) {
      const module = page.locator('.course-module-outline > li').nth(i);
      await expect(module.getByRole('heading')).toHaveText(course.modules[i]!.title);
      await expect(module).toContainText(course.modules[i]!.description);
      await expect(module.locator('.course-outline-practice')).toContainText(course.modules[i]!.practice);
    }
    await expect(page.locator('.course-outline-finish')).toContainText(course.assessment);
    if (course.number > 1) {
      await expect(page.getByText(COURSE_ONE_LOCK_MESSAGE, { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Continue Course 1 →', exact: true })).toHaveAttribute('href', '/courseone');
      await expect(page.getByRole('link', { name: /^Open Course/ })).toHaveCount(0);
    } else {
      await expect(page.getByRole('link', { name: 'Open Course 1 →', exact: true })).toHaveAttribute('href', '/courseone');
    }
    if (!course.ready) await expect(page.locator('.course-intro')).toContainText('full learning activities are being prepared');
    const browse = page.getByRole('navigation', { name: 'Explore course outlines' });
    await expect(browse.getByRole('link').first()).toHaveAttribute('href', course.number === 1 ? '/courses' : outlineHref(COURSE_CATALOG[course.number - 2]!));
    await expect(browse.getByRole('link').last()).toHaveAttribute('href', course.number === 13 ? '/courses' : outlineHref(COURSE_CATALOG[course.number]!));
    expect(errors).toEqual([]);
  });
}

test('all later courses require the full Course 1 prerequisite, and respond to progress from another tab', async ({ page, context }) => {
  await page.goto('/courses');
  await expect(page.locator('#catalog')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByText(COURSE_ONE_LOCK_MESSAGE, { exact: true })).toHaveCount(12);
  await expect(page.getByRole('link', { name: /^Open course/ })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /^View course outline:/ })).toHaveCount(13);
  for (const course of COURSE_CATALOG) {
    await expect(page.getByRole('link', { name: `View course outline: ${course.title}`, exact: true })).toHaveAttribute('href', outlineHref(course));
  }
  // A passing final alone, or all lessons with a failing final, must not unlock any later course.
  await setProgress(page, { postQuiz: completedCourseOne.postQuiz });
  await expect(page.getByText(COURSE_ONE_LOCK_MESSAGE, { exact: true })).toHaveCount(12);
  await setProgress(page, { ...completedCourseOne, postQuiz: { ...completedCourseOne.postQuiz, score: 70 } });
  await expect(page.getByText(COURSE_ONE_LOCK_MESSAGE, { exact: true })).toHaveCount(12);
  const otherTab = await context.newPage();
  await otherTab.goto('/courses/subscriptions');
  await expect(otherTab.locator('.course-outline-access')).toHaveAttribute('aria-busy', 'false');
  await setProgress(otherTab, completedCourseOne);
  await expect(page.getByText(COURSE_ONE_LOCK_MESSAGE, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open course Subscriptions & Memberships', exact: true })).toBeVisible();
  await expect(page.getByText('Course 1 complete', { exact: true })).toHaveCount(11);
  await expect(page.getByText('Explore the outline. Full lessons are being prepared.', { exact: true })).toHaveCount(11);
  await expect(otherTab.getByRole('link', { name: 'Open Course 2 →', exact: true })).toHaveAttribute('href', '/coursetwo');
  await otherTab.goto('/courses/credit-borrowing#course-syllabus');
  await expect(otherTab.getByRole('heading', { name: 'Your foundation is complete.' })).toBeVisible();
  await expect(otherTab.getByText('The complete outline is available below. The full lessons and assessment are still being prepared.')).toBeVisible();
  await expect(otherTab.getByRole('link', { name: /^Open Course/ })).toHaveCount(0);
  await setProgress(page, defaultCourseState);
  await expect(otherTab.getByText(COURSE_ONE_LOCK_MESSAGE, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(COURSE_ONE_LOCK_MESSAGE, { exact: true })).toHaveCount(12);
});

for (const theme of ['light', 'dark']) for (const width of [390, 1366]) {
  test(`catalog and long course outline are accessible at ${width}px in ${theme}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(theme => localStorage.setItem('fynoptic-theme', theme), theme);
    for (const path of ['/courses', '/courses/ad-transparency']) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const hydrated = page.locator(path === '/courses' ? '#catalog' : '.course-outline-access');
      await expect(hydrated).toHaveAttribute('aria-busy', 'false');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const violations = (await new AxeBuilder({ page }).include('#main').withTags(['wcag2a', 'wcag2aa']).analyze()).violations;
      expect(violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
      await page.screenshot({ path: `/tmp/fynoptic-${path === '/courses' ? 'catalog' : 'outline'}-${width}-${theme}.png`, fullPage: true });
    }
  });
}

test('course outlines remain readable with JavaScript disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/courses/housing-rental-costs');
  await expect(page.locator('.course-module-outline > li')).toHaveCount(6);
  await expect(page.locator('.course-outline-status')).toHaveText(COURSE_ONE_LOCK_MESSAGE);
  await expect(page.getByRole('link', { name: 'Continue Course 1 →', exact: true })).toHaveAttribute('href', '/courseone');
  await context.close();
});
