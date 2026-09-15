import { useEffect, useState } from 'react';
import { CourseQuiz } from './CourseQuiz';
import { showToast } from '../../lib/toast';
import { track } from '../../lib/track';
import { parseQuiz } from '../../schemas';
import type { PostQuizSubmission } from '../../hooks/useCourseState';
import type { PostQuizProps } from './CourseOne';

interface PostQuizItem {
  stem: string;
  options: string[];
  answerIndex: number;
  rationale: string;
}

export function PostQuiz({ state, locked, onAnswerChange, onSubmit, onRetake }: PostQuizProps) {
  const [items, setItems] = useState<PostQuizItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (locked || items !== null || loadFailed) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/quiz.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const parsed = parseQuiz(raw).map((item) => ({
          stem: item.stem,
          options: item.options,
          answerIndex: item.answer_index,
          rationale: item.rationale,
        }));
        if (!parsed.length) throw new Error("Empty quiz");
        if (!cancelled) setItems(parsed);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locked, items, loadFailed]);

  if (loadFailed) return <div className="course-load-state" role="alert"><h2 id="post-title">The quiz couldn’t load.</h2><p>Check your connection and try again. Your course progress is still here.</p><button className="course-button" onClick={() => setLoadFailed(false)}>Try loading again</button></div>;
  if (!items) return <div className="course-load-state" role="status"><h2 id="post-title">Final quiz</h2><p>Loading questions…</p></div>;

  const allAnswered = items !== null && items.every((_item, idx) => state.answers[idx] !== null && state.answers[idx] !== undefined);

  function handleSubmit(): void {
    if (state.completed || !items || !allAnswered) return;
    let correct = 0;
    const correctness = items.map((q, idx) => {
      const ok = state.answers[idx] === q.answerIndex;
      if (ok) correct += 1;
      return ok;
    });
    const total = items.length;
    const pct = Math.round((correct / total) * 100);
    const pass = pct >= 80;
    const result: PostQuizSubmission = { score: pct, answers: [...state.answers], correctness, pass };
    onSubmit(result);
    track('post_quiz_submit', { score: pct, pass });

    if (pass) {
      showToast('Assessment passed. Certificate unlocked.', 'success');
    } else {
      showToast('Score below 80%. You can retake the assessment.', 'error');
    }
  }

  function handleRetake(): void {
    onRetake();
    showToast('You can retake the assessment now.', 'info');
  }

  return <>
    <span className="course-eyebrow">Final quiz · {items.length} questions</span>
    <h2 id="post-title">Put it into practice.</h2>
    <p className="course-intro">Choose how you’d handle each situation. Score 80% to complete the course. You can review your answers before submitting and retry if you need to.</p>
    <CourseQuiz id="post" items={items} answers={state.answers} completed={state.completed} score={state.score} onAnswerChange={onAnswerChange} onSubmit={handleSubmit} onRetake={handleRetake} />
  </>;
}
