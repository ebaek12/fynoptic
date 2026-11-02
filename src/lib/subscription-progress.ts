import { readingSeconds, SUBSCRIPTION_FINAL, SUBSCRIPTION_LESSONS, SUBSCRIPTION_PREQUIZ } from '../data/course-two';
import type { CourseQuestion } from '../components/course/CourseQuiz';
import type { CourseState } from './progress';

export const SUBSCRIPTION_KEY = 'ff_subscriptions_v1';
export interface LessonProgress {
  seconds: number[];
  read: number;
  fields: string[];
  activityPassed: boolean;
  answers: (number | null)[];
  checked: boolean;
}
export interface SubscriptionProgress {
  version: 1;
  diagnostic: { answers: (number | null)[]; submitted: boolean };
  lessons: LessonProgress[];
  final: { answers: (number | null)[]; submitted: boolean; attempts: number };
  certificate: { name: string; date: string; id: string } | null;
}
export function courseOneComplete(state: CourseState): boolean {
  return state.preQuiz.completed && state.m1.video && state.m1.article && state.m2.video && state.m2.article && state.m2.idExercise
    && state.m3.video && state.m3.article && state.m4.article && state.m4.auditSubmitted
    && state.postQuiz.completed && state.postQuiz.pass && state.postQuiz.score >= 80;
}
export function initialSubscriptionProgress(): SubscriptionProgress {
  return {
    version: 1, diagnostic: { answers: [], submitted: false },
    lessons: SUBSCRIPTION_LESSONS.map(lesson => ({ seconds: lesson.sections.map(() => 0), read: 0, fields: [], activityPassed: false, answers: [], checked: false })),
    final: { answers: [], submitted: false, attempts: 0 }, certificate: null,
  };
}
export function allAnswered(items: readonly CourseQuestion[], answers: readonly (number | null)[]): boolean {
  return items.every((q, i) => Number.isInteger(answers[i]) && answers[i]! >= 0 && answers[i]! < q.options.length);
}
export function quizScore(items: readonly CourseQuestion[], answers: readonly (number | null)[]): number {
  return Math.round(items.filter((q, i) => answers[i] === q.answerIndex).length / items.length * 100);
}
export function fieldCorrect(lesson: number, field: number, value: string): boolean {
  const item = SUBSCRIPTION_LESSONS[lesson]?.activity.fields[field];
  if (!item || !value.trim()) return false;
  return item.type === 'number' ? Number.isFinite(Number(value)) && Math.abs(Number(value) - Number(item.answer)) < 0.005 : value === item.answer;
}
export function lessonComplete(state: SubscriptionProgress, index: number): boolean {
  const progress = state.lessons[index];
  const lesson = SUBSCRIPTION_LESSONS[index];
  return !!progress && !!lesson && progress.read === lesson.sections.length && progress.activityPassed
    && lesson.activity.fields.every((_, i) => fieldCorrect(index, i, progress.fields[i] ?? ''))
    && progress.checked && allAnswered(lesson.questions, progress.answers) && quizScore(lesson.questions, progress.answers) === 100;
}
export function finalPassed(state: SubscriptionProgress): boolean {
  return state.diagnostic.submitted && SUBSCRIPTION_LESSONS.every((_, i) => lessonComplete(state, i))
    && state.final.submitted && allAnswered(SUBSCRIPTION_FINAL, state.final.answers) && quizScore(SUBSCRIPTION_FINAL, state.final.answers) >= 80;
}
/** Step 0: diagnostic, 1–6: lessons, 7: final assessment, 8: completion. */
export function subscriptionStep(state: SubscriptionProgress): number {
  if (!state.diagnostic.submitted) return 0;
  const first = SUBSCRIPTION_LESSONS.findIndex((_, i) => !lessonComplete(state, i));
  if (first !== -1) return first + 1;
  return finalPassed(state) ? 8 : 7;
}
export type SubscriptionAction =
  | { type: 'diagnostic-answer' | 'final-answer'; index: number; value: number }
  | { type: 'diagnostic-submit' | 'final-submit' | 'final-retry' }
  | { type: 'tick' | 'read'; lesson: number; section: number }
  | { type: 'field'; lesson: number; index: number; value: string }
  | { type: 'check-activity' | 'check-lesson'; lesson: number }
  | { type: 'lesson-answer'; lesson: number; index: number; value: number }
  | { type: 'certificate'; name: string; date: string; id: string };

/** All transitions enforce prerequisites, independently of disabled controls or URL hashes. */
export function reduceSubscription(state: SubscriptionProgress, action: SubscriptionAction, prerequisite: boolean): SubscriptionProgress {
  if (!prerequisite) return state;
  const step = subscriptionStep(state);
  const next = structuredClone(state);
  if (action.type === 'diagnostic-answer' || action.type === 'final-answer') {
    const diagnostic = action.type === 'diagnostic-answer';
    if (!diagnostic && step < 7) return state;
    const target = diagnostic ? next.diagnostic : next.final;
    const items = diagnostic ? SUBSCRIPTION_PREQUIZ : SUBSCRIPTION_FINAL;
    if (target.submitted || !items[action.index] || !Number.isInteger(action.value) || action.value < 0 || action.value >= items[action.index]!.options.length) return state;
    target.answers[action.index] = action.value;
  } else if (action.type === 'diagnostic-submit') {
    if (!allAnswered(SUBSCRIPTION_PREQUIZ, state.diagnostic.answers)) return state;
    next.diagnostic.submitted = true;
  } else if (action.type === 'final-submit') {
    if (step < 7 || state.final.submitted || !allAnswered(SUBSCRIPTION_FINAL, state.final.answers)) return state;
    next.final.submitted = true;
    next.final.attempts++;
  } else if (action.type === 'final-retry') {
    if (step !== 7 || !state.final.submitted) return state;
    next.final = { answers: [], submitted: false, attempts: state.final.attempts };
  } else if (action.type === 'certificate') {
    if (!finalPassed(state) || state.certificate || !action.name.trim()) return state;
    next.certificate = { name: action.name.trim().slice(0, 100), date: action.date, id: action.id };
  } else {
    if (!('lesson' in action) || !Number.isInteger(action.lesson) || action.lesson < 0 || action.lesson >= SUBSCRIPTION_LESSONS.length || action.lesson + 1 > step || lessonComplete(state, action.lesson)) return state;
    const lesson = SUBSCRIPTION_LESSONS[action.lesson]!;
    const progress = next.lessons[action.lesson]!;
    if (action.type === 'tick' || action.type === 'read') {
      if (action.section !== progress.read || !lesson.sections[action.section]) return state;
      const required = readingSeconds(lesson.sections[action.section]!);
      if (action.type === 'tick') {
        if (progress.seconds[action.section]! >= required) return state;
        progress.seconds[action.section] = Math.min(required, progress.seconds[action.section]! + 1);
      }
      else {
        if (progress.seconds[action.section]! < required) return state;
        progress.read++;
      }
    } else if (action.type === 'field') {
      if (progress.read < lesson.sections.length || progress.activityPassed || !lesson.activity.fields[action.index]) return state;
      progress.fields[action.index] = action.value.slice(0, 150);
    } else if (action.type === 'check-activity') {
      if (progress.read < lesson.sections.length) return state;
      progress.activityPassed = lesson.activity.fields.every((_, i) => fieldCorrect(action.lesson, i, progress.fields[i] ?? ''));
    } else if (action.type === 'lesson-answer') {
      if (!progress.activityPassed || !lesson.questions[action.index] || !Number.isInteger(action.value) || action.value < 0 || action.value >= lesson.questions[action.index]!.options.length) return state;
      progress.answers[action.index] = action.value;
      progress.checked = false;
    } else if (action.type === 'check-lesson') {
      if (!progress.activityPassed || !allAnswered(lesson.questions, progress.answers)) return state;
      progress.checked = true;
    }
  }
  return next;
}

/** Restore only structurally valid, sequential evidence; never trust a stored percentage or pass flag. */
export function parseSubscriptionProgress(raw: string | null): SubscriptionProgress {
  const next = initialSubscriptionProgress();
  if (!raw) return next;
  try {
    const source = JSON.parse(raw);
    if (!source || source.version !== 1) return next;
    const answers = (value: unknown, items: readonly CourseQuestion[]) => Array.isArray(value) ? items.slice(0, value.length).map((q, i) => Number.isInteger(value[i]) && value[i] >= 0 && value[i] < q.options.length ? value[i] as number : null) : [];
    next.diagnostic.answers = answers(source.diagnostic?.answers, SUBSCRIPTION_PREQUIZ);
    next.diagnostic.submitted = source.diagnostic?.submitted === true && allAnswered(SUBSCRIPTION_PREQUIZ, next.diagnostic.answers);
    if (!next.diagnostic.submitted) return next;
    for (let i = 0; i < SUBSCRIPTION_LESSONS.length; i++) {
      const lesson = SUBSCRIPTION_LESSONS[i]!;
      const saved = source.lessons?.[i];
      const progress = next.lessons[i]!;
      if (!saved || (i > 0 && !lessonComplete(next, i - 1))) break;
      for (let j = 0; j < lesson.sections.length; j++) {
        if (j > progress.read) break;
        const seconds = saved.seconds?.[j];
        progress.seconds[j] = typeof seconds === 'number' && Number.isFinite(seconds) ? Math.max(0, Math.min(readingSeconds(lesson.sections[j]!), Math.floor(seconds))) : 0;
        if (Number.isInteger(saved.read) && saved.read > j && progress.seconds[j]! >= readingSeconds(lesson.sections[j]!)) progress.read++;
      }
      if (progress.read < lesson.sections.length) continue;
      progress.fields = lesson.activity.fields.map((_, j) => typeof saved.fields?.[j] === 'string' ? saved.fields[j].slice(0, 150) : '');
      progress.activityPassed = saved.activityPassed === true && lesson.activity.fields.every((_, j) => fieldCorrect(i, j, progress.fields[j]!));
      if (!progress.activityPassed) continue;
      progress.answers = answers(saved.answers, lesson.questions);
      progress.checked = saved.checked === true && allAnswered(lesson.questions, progress.answers);
    }
    if (SUBSCRIPTION_LESSONS.every((_, i) => lessonComplete(next, i))) {
      next.final.answers = answers(source.final?.answers, SUBSCRIPTION_FINAL);
      next.final.submitted = source.final?.submitted === true && allAnswered(SUBSCRIPTION_FINAL, next.final.answers);
      next.final.attempts = Number.isSafeInteger(source.final?.attempts) && source.final.attempts >= 0 ? source.final.attempts : 0;
    }
    const cert = source.certificate;
    if (finalPassed(next) && cert && typeof cert.name === 'string' && typeof cert.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cert.date)) {
      next.certificate = { name: cert.name.slice(0, 100), date: cert.date, id: cert.id.slice(0, 100) };
    }
    return next;
  } catch { return next; }
}
