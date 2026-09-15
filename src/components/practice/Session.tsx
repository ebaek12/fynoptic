import { useEffect, useRef } from "react";
import type { Session } from "@/hooks/usePracticeSession";
import { AnswerChoice } from "../study/AnswerChoice";
import { useStudySessionViewport } from "../../hooks/useStudySessionViewport";

export interface SessionProps {
  session: Session;
  finishSummary: string | null;
  onSelectChoice: (idx: number) => void;
  onToggleEliminate: (idx: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRestart: () => void;
  onRequestEndSession: () => void;
  onFinish: () => void;
}
function niceTopic(slug: string) {
  return slug.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function diffLabel(diff: string | null) {
  return diff ? diff[0]!.toUpperCase() + diff.slice(1) : " - ";
}
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
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
  const submitEnabled = Boolean(
    entry && entry.chosenIdx !== null && !entry.answered,
  );
  const sessionRef = useStudySessionViewport(
    finishSummary ? "finished" : q?.id,
  );
  const promptRef = useRef<HTMLHeadingElement>(null);
  const finishRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const previousAnswer = useRef({
    index: session.currentIndex,
    answered: Boolean(entry?.answered),
  });
  const topic =
    session.topics.length === 1
      ? niceTopic(session.topics[0]!)
      : `${niceTopic(session.topics[0] ?? "")} +${session.topics.length - 1}`;
  const pct = session.totalQuestions
    ? Math.round((100 * session.asked) / session.totalQuestions)
    : 0;

  useEffect(() => {
    if (finishSummary) finishRef.current?.focus({ preventScroll: true });
  }, [finishSummary]);
  useEffect(() => {
    if (
      previousAnswer.current.index === session.currentIndex &&
      !previousAnswer.current.answered &&
      entry?.answered
    ) {
      nextRef.current?.focus({ preventScroll: true });
    }
    previousAnswer.current = {
      index: session.currentIndex,
      answered: Boolean(entry?.answered),
    };
  }, [session.currentIndex, entry?.answered]);
  useEffect(() => {
    promptRef.current?.focus({ preventScroll: true });
  }, [session.currentIndex]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        (event.target instanceof Element &&
          event.target.closest(
            'input, textarea, select, a, [contenteditable="true"], [role="dialog"], [role="alertdialog"], button:not(.mc-option)',
          ))
      )
        return;
      if (event.key === "Enter" && questionVisible && submitEnabled) {
        event.preventDefault();
        onSubmit();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [questionVisible, submitEnabled, onSubmit]);

  return (
    <section
      className="study-session"
      ref={sessionRef}
      aria-label="Practice session"
    >
      <div className="session-toolbar">
        <div>
          <span className="session-eyebrow" id="chip-category">
            {session.category}
          </span>
          <strong
            id="chip-topic"
            title={session.topics.map(niceTopic).join(", ")}
          >
            {topic}
          </strong>
        </div>
        <button
          id="end-session-btn"
          className="session-text-button"
          type="button"
          onClick={onRequestEndSession}
        >
          End Session
        </button>
      </div>
      <div className="session-progress">
        <div className="session-progress-label">
          <span>Session progress</span>
          <span>
            <strong id="stat-answered">{session.asked}</strong> /{" "}
            <strong id="stat-total">{session.totalQuestions}</strong> answered
          </span>
        </div>
        <div
          className="session-progress-track"
          role="progressbar"
          aria-label="Session progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <span id="pc-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div
        className="session-paper"
        id="stage"
        data-answered={Boolean(entry?.answered)}
      >
        {questionVisible ? (
          <div id="stage-qwrap">
            {q && entry && (
              <>
                <div className="session-paper-top">
                  <span>
                    Question {session.currentIndex + 1} /{" "}
                    {session.totalQuestions}
                  </span>
                  <span id="chip-diff">{diffLabel(session.currentDiff)}</span>
                </div>
                <div className="session-workspace">
                  <div className="practice-question-panel">
                    <h2
                      id="prompt"
                      className="session-question"
                      ref={promptRef}
                      tabIndex={-1}
                    >
                      {q.prompt}
                    </h2>
                  </div>
                  <div className="session-answer-area">
                    <div className="session-answer-heading">
                      <span>Choose an answer</span>
                      <span className="session-help">
                        Use × to rule one out.
                      </span>
                    </div>
                    <div
                      id="mc-area"
                      className="session-answers"
                      role="group"
                      aria-label="Answer choices"
                    >
                      {q.choices.map((choice, index) => {
                        const selected = entry.chosenIdx === index;
                        const eliminated = entry.eliminated.includes(index);
                        const correct =
                          entry.answered && index === q.answerIndex;
                        const wrong = entry.answered && selected && !correct;
                        return (
                          <div className="session-choice-row" key={index}>
                            <AnswerChoice
                              index={index}
                              className={cx(
                                selected && "is-selected",
                                eliminated && "is-eliminated",
                                correct && "is-correct",
                                wrong && "is-wrong",
                              )}
                              state={
                                correct
                                  ? "correct"
                                  : wrong
                                    ? "wrong"
                                    : selected
                                      ? "selected"
                                      : undefined
                              }
                              data-index={index}
                              aria-pressed={selected}
                              disabled={entry.answered}
                              onClick={(event) => {
                                if (
                                  event.altKey ||
                                  event.ctrlKey ||
                                  event.metaKey
                                ) {
                                  event.preventDefault();
                                  onToggleEliminate(index);
                                } else onSelectChoice(index);
                              }}
                              onContextMenu={(event) => {
                                event.preventDefault();
                                onToggleEliminate(index);
                              }}
                            >
                              {choice}
                            </AnswerChoice>
                            <button
                              className="session-eliminate"
                              type="button"
                              aria-label={`${eliminated ? "Restore" : "Cross out"} answer ${String.fromCharCode(65 + index)}`}
                              aria-pressed={eliminated}
                              title={
                                eliminated
                                  ? "Restore answer"
                                  : "Cross out answer"
                              }
                              disabled={entry.answered}
                              onClick={() => onToggleEliminate(index)}
                            >
                              <span aria-hidden="true">
                                {eliminated ? "↶" : "×"}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="session-feedback-slot">
                  <div
                    id="feedback"
                    className={cx(
                      "session-feedback",
                      entry.correct ? "ok" : "bad",
                    )}
                    role="status"
                    hidden={!entry.answered}
                  >
                    {entry.answered && (
                      <>
                        <strong>
                          {entry.correct ? "Correct!" : "Not quite."}
                        </strong>
                        {!entry.correct && (
                          <> The answer is {q.choices[q.answerIndex]}.</>
                        )}
                        {q.explanation && <p>{q.explanation}</p>}
                      </>
                    )}
                  </div>
                </div>
                <div className="session-navigation">
                  <button
                    id="prev-btn"
                    className="session-secondary"
                    type="button"
                    onClick={onPrev}
                    disabled={session.currentIndex <= 0}
                  >
                    ← Previous
                  </button>
                  <div className="session-forward-actions">
                    <button
                      id="submit-btn"
                      className="session-primary"
                      type="button"
                      onClick={onSubmit}
                      disabled={!submitEnabled}
                      hidden={entry.answered}
                    >
                      Check answer
                    </button>
                    <button
                      id="next-btn"
                      ref={nextRef}
                      className="session-primary"
                      type="button"
                      onClick={onNext}
                      disabled={!entry.answered}
                      hidden={!entry.answered}
                    >
                      {entry.answered &&
                      session.asked >= session.totalQuestions &&
                      session.currentIndex === session.timeline.length - 1
                        ? "See results"
                        : "Next"}{" "}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div id="stage-finish" className="session-finish">
            <span className="session-eyebrow">Your results</span>
            <h2 ref={finishRef} tabIndex={-1}>
              Session complete
            </h2>
            <p id="finish-summary">{finishSummary}</p>
            <div className="session-finish-actions">
              <button
                id="restart-btn"
                className="session-primary"
                type="button"
                onClick={onRestart}
              >
                Practice again
              </button>
              <button
                id="finish-reset-btn"
                className="session-secondary"
                type="button"
                onClick={onFinish}
              >
                Choose new topics
              </button>
            </div>
          </div>
        )}
      </div>
      <dl className="session-metrics" id="pc-stats">
        <div>
          <dt>Correct</dt>
          <dd id="stat-correct">{session.correct}</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd id="stat-streak">{session.streak}</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd id="stat-diff">{diffLabel(session.currentDiff)}</dd>
        </div>
      </dl>
    </section>
  );
}
