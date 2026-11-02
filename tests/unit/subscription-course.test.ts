import { describe, expect, it } from 'vitest';
import { readingSeconds, SUBSCRIPTION_FINAL, SUBSCRIPTION_LESSONS, SUBSCRIPTION_PREQUIZ } from '../../src/data/course-two';
import { courseOneComplete, fieldCorrect, finalPassed, initialSubscriptionProgress, lessonComplete, parseSubscriptionProgress, quizScore, reduceSubscription, subscriptionStep, type SubscriptionProgress } from '../../src/lib/subscription-progress';
import { defaultCourseState } from '../../src/lib/progress';

function completeLessons(): SubscriptionProgress {
  let state = initialSubscriptionProgress();
  SUBSCRIPTION_PREQUIZ.forEach((_, i) => { state = reduceSubscription(state, { type: 'diagnostic-answer', index: i, value: 0 }, true); });
  state = reduceSubscription(state, { type: 'diagnostic-submit' }, true);
  SUBSCRIPTION_LESSONS.forEach((lesson, i) => {
    lesson.sections.forEach((section, j) => {
      for (let tick = 0; tick < readingSeconds(section); tick++) state = reduceSubscription(state, { type: 'tick', lesson: i, section: j }, true);
      state = reduceSubscription(state, { type: 'read', lesson: i, section: j }, true);
    });
    lesson.activity.fields.forEach((field, j) => { state = reduceSubscription(state, { type: 'field', lesson: i, index: j, value: field.answer }, true); });
    state = reduceSubscription(state, { type: 'check-activity', lesson: i }, true);
    lesson.questions.forEach((q, j) => { state = reduceSubscription(state, { type: 'lesson-answer', lesson: i, index: j, value: q.answerIndex }, true); });
    state = reduceSubscription(state, { type: 'check-lesson', lesson: i }, true);
  });
  return state;
}

describe('subscription curriculum', () => {
  it('provides a complete sixty-minute path with substantial original readings and valid questions', () => {
    expect(3 + SUBSCRIPTION_LESSONS.reduce((total, lesson) => total + lesson.minutes, 0) + 8).toBe(60);
    expect(SUBSCRIPTION_LESSONS).toHaveLength(6);
    const words = SUBSCRIPTION_LESSONS.flatMap(lesson => lesson.sections.flatMap(section => section.paragraphs)).join(' ').split(/\s+/).length;
    expect(words).toBeGreaterThan(5000);
    for (const lesson of SUBSCRIPTION_LESSONS) {
      expect(lesson.sections).toHaveLength(4);
      expect(lesson.questions).toHaveLength(2);
      expect(lesson.activity.fields.length).toBeGreaterThanOrEqual(3);
    }
    const questions = [...SUBSCRIPTION_PREQUIZ, ...SUBSCRIPTION_FINAL, ...SUBSCRIPTION_LESSONS.flatMap(lesson => lesson.questions)];
    expect(new Set(questions.map(q => q.stem)).size).toBe(questions.length);
    questions.forEach(q => { expect(q.options[q.answerIndex]).toBeTruthy(); expect(q.rationale).toBeTruthy(); });
  });
  it('checks independent arithmetic including numeric formatting and empty input', () => {
    expect(fieldCorrect(0, 0, String(2 * 2 + 10 * 12 + 18))).toBe(true);
    expect(fieldCorrect(0, 0, '142.00')).toBe(true);
    expect(fieldCorrect(0, 1, String(12 * 12))).toBe(true);
    expect(fieldCorrect(2, 1, String(96 / 12))).toBe(true);
    expect(fieldCorrect(5, 2, String(12 * 12 + 120))).toBe(true);
    expect(fieldCorrect(0, 0, '')).toBe(false);
    expect(fieldCorrect(0, 0, 'NaN')).toBe(false);
    expect(fieldCorrect(0, 0, '143')).toBe(false);
  });
});

describe('progression enforcement', () => {
  it('requires all course one work, not just a certificate or quiz pass flag', () => {
    const state = structuredClone(defaultCourseState);
    state.postQuiz = { ...state.postQuiz, completed: true, pass: true, score: 100 };
    state.certificate.issued = true;
    expect(courseOneComplete(state)).toBe(false);
    state.preQuiz.completed = true;
    state.m1 = { video: true, article: true };
    state.m2 = { video: true, article: true, idExercise: true };
    state.m3 = { video: true, article: true, drillsChecked: false };
    state.m4 = { article: true, auditSubmitted: true, auditId: 'record' };
    expect(courseOneComplete(state)).toBe(true);
    state.postQuiz.score = 79;
    expect(courseOneComplete(state)).toBe(false);
  });
  it('rejects out-of-order transitions and answers when prerequisites are missing', () => {
    const state = initialSubscriptionProgress();
    expect(reduceSubscription(state, { type: 'diagnostic-answer', index: 0, value: 1 }, false)).toBe(state);
    expect(reduceSubscription(state, { type: 'diagnostic-submit' }, true)).toBe(state);
    expect(reduceSubscription(state, { type: 'read', lesson: 0, section: 0 }, true)).toBe(state);
    expect(reduceSubscription(state, { type: 'field', lesson: 5, index: 0, value: '30' }, true)).toBe(state);
    expect(reduceSubscription(state, { type: 'final-answer', index: 0, value: 0 }, true)).toBe(state);
    expect(reduceSubscription(state, { type: 'certificate', name: 'Learner', date: '2026-11-01', id: 'fake' }, true)).toBe(state);
  });
  it('requires active reading, all case answers, and every knowledge check', () => {
    let state = initialSubscriptionProgress();
    state.diagnostic = { answers: SUBSCRIPTION_PREQUIZ.map(() => 0), submitted: true };
    expect(subscriptionStep(state)).toBe(1);
    expect(reduceSubscription(state, { type: 'read', lesson: 0, section: 0 }, true)).toBe(state);
    expect(reduceSubscription(state, { type: 'tick', lesson: 0, section: 1 }, true)).toBe(state);
    expect(reduceSubscription(state, { type: 'field', lesson: 0, index: 0, value: '142' }, true)).toBe(state);
    state.lessons[0]!.read = 4;
    state.lessons[0]!.fields = ['141', '144', 'How often she pays'];
    state = reduceSubscription(state, { type: 'check-activity', lesson: 0 }, true);
    expect(state.lessons[0]!.activityPassed).toBe(false);
    expect(reduceSubscription(state, { type: 'lesson-answer', lesson: 0, index: 0, value: 2 }, true)).toBe(state);
    state = reduceSubscription(state, { type: 'field', lesson: 0, index: 0, value: '142' }, true);
    state = reduceSubscription(state, { type: 'check-activity', lesson: 0 }, true);
    state = reduceSubscription(state, { type: 'lesson-answer', lesson: 0, index: 0, value: 0 }, true);
    state = reduceSubscription(state, { type: 'lesson-answer', lesson: 0, index: 1, value: 2 }, true);
    state = reduceSubscription(state, { type: 'check-lesson', lesson: 0 }, true);
    expect(lessonComplete(state, 0)).toBe(false);
    state = reduceSubscription(state, { type: 'lesson-answer', lesson: 0, index: 0, value: 2 }, true);
    state = reduceSubscription(state, { type: 'check-lesson', lesson: 0 }, true);
    expect(lessonComplete(state, 0)).toBe(true);
    expect(subscriptionStep(state)).toBe(2);
  });
  it('completes the path, persists evidence, enforces final retries and certificate eligibility', () => {
    let state = completeLessons();
    expect(subscriptionStep(state)).toBe(7);
    expect(parseSubscriptionProgress(JSON.stringify(state))).toEqual(state);
    expect(reduceSubscription(state, { type: 'final-submit' }, true)).toBe(state);
    SUBSCRIPTION_FINAL.forEach((q, i) => { state = reduceSubscription(state, { type: 'final-answer', index: i, value: (q.answerIndex + 1) % q.options.length }, true); });
    state = reduceSubscription(state, { type: 'final-submit' }, true);
    expect(finalPassed(state)).toBe(false);
    expect(state.final.attempts).toBe(1);
    state = reduceSubscription(state, { type: 'final-retry' }, true);
    expect(state.final.answers).toEqual([]);
    SUBSCRIPTION_FINAL.forEach((q, i) => { state = reduceSubscription(state, { type: 'final-answer', index: i, value: i < 10 ? q.answerIndex : (q.answerIndex + 1) % q.options.length }, true); });
    state = reduceSubscription(state, { type: 'final-submit' }, true);
    expect(quizScore(SUBSCRIPTION_FINAL, state.final.answers)).toBe(83);
    expect(finalPassed(state)).toBe(true);
    state = reduceSubscription(state, { type: 'certificate', name: '  Test Learner  ', date: '2026-11-01', id: 'FYN-SM-TEST' }, true);
    expect(state.certificate?.name).toBe('Test Learner');
    expect(parseSubscriptionProgress(JSON.stringify(state))).toEqual(state);
    expect(reduceSubscription(state, { type: 'final-retry' }, true)).toBe(state);
  });
  it('recovers from corrupt or nonsequential stored data without unlocking future work', () => {
    for (const raw of [null, 'bad json', '{}', 'null', '[]', '{"version":2}']) expect(subscriptionStep(parseSubscriptionProgress(raw))).toBe(0);
    const state = completeLessons();
    state.lessons[2]!.seconds[0] = 0;
    state.final = { answers: SUBSCRIPTION_FINAL.map(q => q.answerIndex), submitted: true, attempts: 1 };
    state.certificate = { name: 'Invalid', date: '2026-11-01', id: 'invalid' };
    const restored = parseSubscriptionProgress(JSON.stringify(state));
    expect(subscriptionStep(restored)).toBe(3);
    expect(restored.lessons[3]!.read).toBe(0);
    expect(restored.final.submitted).toBe(false);
    expect(restored.certificate).toBe(null);
  });
});
