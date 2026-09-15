import { useEffect, useRef, useState } from 'react';
import { parseIdExercise } from '../../schemas';
import type { IdExerciseItem } from '../../types';
import { showToast } from '../../lib/toast';
import { track } from '../../lib/track';
import type { IdExerciseProps } from './CourseOne';

export function IdExercise({ locked, done, onComplete }: IdExerciseProps) {
  const [review, setReview] = useState(false);
  const [items, setItems] = useState<IdExerciseItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [choices, setChoices] = useState<Array<number | null>>([]);
  // Parallel to `items`: the choice each item was graded against on the
  // last submit, or null if that item has never been graded, or was
  // graded and then changed (see header comment). null => render no
  // correct/incorrect state for that item, matching the original's
  // untouched `.q-item` (no `correct`/`incorrect` class yet).
  const [graded, setGraded] = useState<Array<number | null>>([]);
  const [resultText, setResultText] = useState('');
  const [successLock, setSuccessLock] = useState(false);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Idempotent-loader pattern 2 (gate on real target state, not a latch):
  // only fetches while unlocked and not already loaded/errored, so
  // StrictMode's double-invoke is a harmless redundant fetch at worst.
  useEffect(() => {
    if (locked || items !== null || loadError) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/id-exercise.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('id-exercise.json not reachable');
        const raw = await res.json();
        const parsed = parseIdExercise(raw);
        if (!parsed.length) throw new Error('No items in id-exercise.json');
        if (cancelled) return;
        setItems(parsed);
        setChoices(parsed.map(item => done ? item.answer_index : null));
        setGraded(parsed.map(item => done ? item.answer_index : null));
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locked, items, loadError, done]);

  const canSubmit = items !== null && items.length > 0 && choices.length === items.length && choices.every((c) => c !== null);
  const submitDisabled = done || !canSubmit || successLock;

  function handleChoice(idx: number, value: number): void {
    if (done || successLock) return;
    setChoices((prev) => prev.map((c, i) => (i === idx ? value : c)));
    setGraded((prev) => prev.map((g, i) => (i === idx ? null : g)));
    setSuccessLock(false);
  }

  function handleSubmit(): void {
    if (!items || submitDisabled) return;
    let correct = 0;
    items.forEach((it, idx) => {
      if ((choices[idx] ?? null) === it.answer_index) correct++;
    });
    setGraded(choices.slice());

    const total = items.length;
    const allCorrect = correct === total;
    setResultText(allCorrect ? `All ${total}/${total} correct.` : `${total - correct} incorrect. Fix and check again.`);

    if (allCorrect) {
      setSuccessLock(true);
      track('id_exercise_complete', { items: total, correct });
      showToast('Identification exercise completed.', 'success');
      onComplete();
    } else {
      const firstBadIdx = items.findIndex((it, idx) => (choices[idx] ?? null) !== it.answer_index);
      if (firstBadIdx !== -1) {
        itemRefs.current[firstBadIdx]?.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.focus();
      }
    }
  }

  if (done && !review) return <div className="content-card"><h3>Pattern practice complete</h3><p>You’ve correctly identified all ten situations.</p><button className="course-button secondary" onClick={() => setReview(true)}>Review the examples</button></div>;
  return (
    <div className="content-card mt-1">
      <h3>Spot the pattern</h3>
      <p className="course-muted">Name the pattern in each situation. Check your answers, then correct any you missed.</p>
      <div id="id-ex-root" className="id-grid">
        {loadError && <div className="course-load-state" role="alert"><p>The examples couldn’t load. Check your connection and try again.</p><button className="course-button" onClick={() => setLoadError(false)}>Try loading again</button></div>}
        {!items && !loadError && <p role="status">Loading examples…</p>}
        {items?.map((it, idx) => {
          const gradedChoice = graded[idx] ?? null;
          const isGraded = gradedChoice !== null;
          const isCorrect = isGraded && gradedChoice === it.answer_index;
          return (
            <div
              key={it.id}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className={`q-item${isGraded ? (isCorrect ? ' correct' : ' incorrect') : ''}`}
            >
              <div className="q-title">{it.vignette}</div>
              <div className="q-options" role="radiogroup" aria-label={it.vignette}>
                {it.options.map((opt, i) => (
                  <label key={i} data-selected={choices[idx] === i}>
                    <input type="radio" name={`id${idx}`} value={i} disabled={done} checked={(choices[idx] ?? null) === i} onChange={() => handleChoice(idx, i)} />
                    {opt}
                  </label>
                ))}
              </div>
              <div className="result">
                {isGraded &&
                  (isCorrect ? (
                    <>
                      {`Correct. Recommended counter-move: ${it.countermove}`}
                      <div className="drawer">{`Rationale: ${it.rationale}`}</div>
                    </>
                  ) : (
                    'Incorrect - try again.'
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="gate">
        <button id="id-ex-submit" className="btn btn-primary" aria-disabled={submitDisabled} disabled={submitDisabled} onClick={handleSubmit}>
          Check answers
        </button>
        <span className="locknote">Answer all ten situations to check your work.</span>
      </div>
      <div id="id-ex-result" className="result" role="status">
        {resultText}
      </div>
    </div>
  );
}
