import { useEffect, type CSSProperties } from 'react';
import type { Session } from '@/hooks/usePracticeSession';

export interface SessionProps {
  /** The live engine session. Mount this component only once one exists. */
  session: Session;
  /** Non-null once the session has ended naturally; renders the finish screen instead of the question view. */
  finishSummary: string | null;
  onSelectChoice: (idx: number) => void;
  onToggleEliminate: (idx: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrev: () => void;
  /** Finish screen's "Restart" button — same category/topics/settings, a fresh pool. */
  onRestart: () => void;
  /** Mid-session "End Session" button. Opens the confirmation modal (owned elsewhere) — this component never ends the session itself. */
  onRequestEndSession: () => void;
  /** Finish screen's "Reset" button — the session already ended naturally, so this just hands control back to setup (no confirmation needed). */
  onFinish: () => void;
}

function niceTopic(slug: string): string {
  return slug.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function topicChipLabel(topics: string[]): string {
  if (!topics.length) return '—';
  if (topics.length === 1) return niceTopic(topics[0]!);
  return `${niceTopic(topics[0]!)} +${topics.length - 1}`;
}

function diffLabel(diff: string | null): string {
  return diff ? diff[0]!.toUpperCase() + diff.slice(1) : '—';
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Session({
  session,
  finishSummary,
  onSelectChoice,
  onToggleEliminate,
  onSubmit,
  onNext,
  onPrev,
  onRestart,
  onRequestEndSession,
  onFinish,
}: SessionProps) {
  const entry = session.timeline[session.currentIndex] ?? null;
  const q = entry?.q ?? session.current;
  const questionVisible = !finishSummary;
  const submitEnabled = !!entry && entry.chosenIdx !== null && !entry.answered;

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stage = document.getElementById('stage');
      if (!stage) return;
      try {
        stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        const rect = stage.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const target = rect.top + scrollTop + rect.height / 2 - window.innerHeight / 2;
        window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      }
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once on mount, matching the original's one-shot post-start scroll.
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.defaultPrevented || e.target instanceof Element && e.target.closest('input, textarea, select, a, [contenteditable="true"], [role="dialog"], [role="alertdialog"], button:not(.mc-option)')) return;
      if (e.key === 'Enter' && questionVisible && submitEnabled) {
        e.preventDefault();
        onSubmit();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [questionVisible, submitEnabled, onSubmit]);

  const pct = session.totalQuestions ? Math.round((100 * session.asked) / session.totalQuestions) : 0;

  return (
    <>
      <div className="card progress-card">
        <div className="pc-progress" aria-hidden="true">
          <span className="pc-progress-fill" id="pc-progress-fill" style={{ '--p': `${pct}%` } as CSSProperties} />
        </div>
        <div className="pc-stats" id="pc-stats" aria-live="polite" style={{ marginTop: '.5rem' }}>
          <span>
            <strong id="stat-answered">{session.asked}</strong>/<span id="stat-total">{session.totalQuestions}</span>{' '}
            answered
          </span>
          <span className="sep">•</span>
          <span>
            Correct: <strong id="stat-correct">{session.correct}</strong>
          </span>
          <span className="sep">•</span>
          <span>
            Streak: <strong id="stat-streak">{session.streak}</strong>
          </span>
          <span className="sep">•</span>
          <span>
            Difficulty: <strong id="stat-diff">{diffLabel(session.currentDiff)}</strong>
          </span>
        </div>
      </div>

      <div className="card stage" id="stage">
        <div id="stage-qwrap" className={cx(!questionVisible && 'hide')}>
          {q && entry && (
            <>
              <div className="stage-top">
                <span className="chip" id="chip-category">
                  {session.category || '—'}
                </span>
                <span className="chip" id="chip-topic">
                  {topicChipLabel(session.topics)}
                </span>
                <span className="chip" id="chip-diff">
                  {diffLabel(session.currentDiff)}
                </span>
              </div>

              <p className="prompt-label">Question</p>
              <div id="prompt" className="prompt-text">
                {q.prompt}
              </div>

              <div id="mc-area" className="mc-area">
                {q.choices.map((choice, idx) => {
                  const selected = entry.chosenIdx === idx;
                  const eliminated = entry.eliminated.includes(idx);
                  const isAnswerIdx = idx === q.answerIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={cx(
                        'mc-option',
                        selected && 'is-selected',
                        eliminated && 'is-eliminated',
                        entry.answered && isAnswerIdx && 'is-correct',
                        entry.answered && selected && !isAnswerIdx && 'is-wrong',
                      )}
                      data-index={idx}
                      disabled={entry.answered}
                      onClick={(e) => {
                        if (e.altKey || e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                          onToggleEliminate(idx);
                          return;
                        }
                        onSelectChoice(idx);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onToggleEliminate(idx);
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              <div id="feedback" className={cx('feedback', entry.answered && (entry.correct ? 'ok' : 'bad'))} hidden={!entry.answered}>
                {entry.answered ? (entry.correct ? 'Correct!' : 'Not quite.') : null}
              </div>

              <div className="q-actions">
                <button id="prev-btn" className="btn btn-ghost" onClick={onPrev} disabled={session.currentIndex <= 0}>
                  Prev
                </button>
                <button id="next-btn" className="btn btn-ghost" onClick={onNext} disabled={!entry.answered}>
                  Next
                </button>
                <button id="submit-btn" className="btn btn-primary" onClick={onSubmit} disabled={!submitEnabled}>
                  Submit
                </button>
                <button id="end-session-btn" className="btn btn-ghost" onClick={onRequestEndSession}>
                  End Session
                </button>
              </div>
            </>
          )}
        </div>

        <div id="stage-finish" className={cx(questionVisible && 'hide')}>
          <h3>Session complete</h3>
          <p id="finish-summary" className="muted">
            {finishSummary}
          </p>
          <div className="finish-actions">
            <button id="restart-btn" className="btn btn-primary" onClick={onRestart}>
              Restart
            </button>
            <button id="finish-reset-btn" className="btn btn-ghost" onClick={onFinish}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
