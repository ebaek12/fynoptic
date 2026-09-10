import { useEffect, useRef, type FormEvent } from "react";
import type { UseFlashcardDeckResult } from "@/hooks/useFlashcardDeck";
import { FlashcardCard } from "./FlashcardCard";
import { AnswerChoice } from "../study/AnswerChoice";
import { useStudySessionViewport } from "../../hooks/useStudySessionViewport";

export interface FlashcardViewProps {
  engine: UseFlashcardDeckResult;
  shuffleDeck: boolean;
  onRequestResetProgress: () => void;
  onRequestEndSession: () => void;
}
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function FlashcardView({
  engine,
  shuffleDeck,
  onRequestResetProgress,
  onRequestEndSession,
}: FlashcardViewProps) {
  const {
    current,
    mode,
    mcAnswer,
    fitbAnswer,
    isFront,
    locked,
    mcOptions,
    selectedMc,
    feedback,
    stats,
    crumbs,
    progressPct,
    accuracyPct,
  } = engine;
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useStudySessionViewport(current?.id);
  const stageRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const isMc = mode === "mc";
  const answerTarget = isMc ? mcAnswer : fitbAnswer;
  const mcFeedback = feedback?.kind === "mc" ? feedback : null;
  const fitbFeedback = feedback?.kind === "fitb" ? feedback : null;
  const hintFeedback = feedback?.kind === "hint" ? feedback : null;
  const hasAnswer = locked || Boolean(feedback && feedback.kind !== "hint");

  useEffect(() => {
    if (mcFeedback) nextRef.current?.focus({ preventScroll: true });
  }, [mcFeedback]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key !== "Enter" ||
        event.defaultPrevented ||
        !isMc ||
        hasAnswer ||
        selectedMc === null ||
        (event.target instanceof Element &&
          event.target.closest(
            'input, textarea, select, a, [contenteditable="true"], [role="dialog"], [role="alertdialog"], button:not(.mc-option)',
          ))
      )
        return;
      event.preventDefault();
      engine.submitMc();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMc, hasAnswer, selectedMc, engine]);

  useEffect(() => {
    if (mode === "mc") stageRef.current?.focus({ preventScroll: true });
    // Focus the study surface only when starting a session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    if (!locked) inputRef.current.focus({ preventScroll: true });
    // Only reset a typed answer when moving to another card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    engine.submitFitb(inputRef.current?.value ?? "");
  }

  return (
    <section
      className="study-session"
      ref={sessionRef}
      aria-label="Flashcard session"
    >
      <div className="session-toolbar">
        <div>
          <span className="session-eyebrow">
            {isMc ? "Multiple choice" : "Fill in the blank"}
          </span>
          <strong>{current?.unit}</strong>
        </div>
        <button
          id="end-btn"
          className="session-text-button"
          type="button"
          onClick={onRequestEndSession}
        >
          End Session
        </button>
      </div>
      <div id="block-progress" className="session-progress">
        <div className="session-progress-label">
          <span>Deck progress</span>
          <span>
            <strong id="stat-done">{stats.done}</strong> /{" "}
            <strong id="stat-total">{stats.total}</strong> completed
          </span>
        </div>
        <div
          className="session-progress-track"
          role="progressbar"
          aria-label="Deck progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
        >
          <span id="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
      <div
        id="fc-stage"
        ref={stageRef}
        tabIndex={-1}
        className="session-paper"
        data-answered={hasAnswer}
      >
        <div className="session-paper-top">
          <span>Flashcard</span>
          <span id="crumbs-text">{crumbs}</span>
        </div>
        <div className="session-workspace">
          {current && (
            <FlashcardCard
              term={current.term}
              definition={current.definition}
              isFront={isFront}
              revealed={locked}
              onReveal={engine.flip}
            />
          )}
          <div id="answer-area" className="session-answer-area">
            <div className="session-answer-heading">
              <span>{isMc ? "Choose an answer" : "Type your answer"}</span>
              <button
                id="mc-toggle-answer"
                className="session-text-button"
                type="button"
                onClick={engine.toggleAnswerTarget}
              >
                Answer with {answerTarget === "term" ? "Term" : "Definition"}
              </button>
            </div>
            {isMc ? (
              <div
                id="mc-area"
                className={cx("session-answers", locked && "is-locked")}
                role="group"
                aria-label="Multiple choice options"
              >
                {mcOptions.map((option, index) => {
                  const selected = option === selectedMc;
                  const correct =
                    mcFeedback !== null && option === mcFeedback.correctValue;
                  const wrong =
                    mcFeedback !== null &&
                    option === mcFeedback.chosenValue &&
                    !mcFeedback.correct;
                  return (
                    <AnswerChoice
                      key={option}
                      index={index}
                      className={cx(
                        correct && "is-correct",
                        wrong && "is-wrong",
                        selected && "is-selected",
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
                      data-value={option}
                      aria-pressed={selected}
                      disabled={Boolean(mcFeedback) || locked}
                      onClick={() => engine.selectMc(option)}
                    >
                      {option}
                    </AnswerChoice>
                  );
                })}
              </div>
            ) : (
              <form
                id="fitb-form"
                className="session-type-answer"
                onSubmit={submit}
              >
                <label htmlFor="fitb-input" className="sr-only">
                  Type your answer
                </label>
                <input
                  id="fitb-input"
                  ref={inputRef}
                  type="text"
                  placeholder={
                    answerTarget === "term"
                      ? "Type the term…"
                      : "Type the definition…"
                  }
                  autoComplete="off"
                  disabled={locked}
                />
                <button
                  className="session-primary"
                  type="submit"
                  disabled={locked}
                >
                  Check
                </button>
                <button
                  className="session-text-button"
                  type="button"
                  id="fitb-hint"
                  disabled={locked}
                  onClick={engine.showHint}
                >
                  Hint
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="session-feedback-slot">
          <div
            id="feedback"
            className={cx(
              "session-feedback",
              feedback &&
                (feedback.kind === "hint" || feedback.correct ? "ok" : "bad"),
            )}
            role="status"
            hidden={!feedback && !locked}
          >
            {mcFeedback &&
              (mcFeedback.correct ? (
                "Correct!"
              ) : (
                <>
                  Not quite. The answer is{" "}
                  <strong>{mcFeedback.correctValue}</strong>.
                </>
              ))}
            {fitbFeedback &&
              (fitbFeedback.correct ? (
                "Correct!"
              ) : (
                <>
                  Answer: <strong>{fitbFeedback.target}</strong>.
                </>
              ))}
            {hintFeedback && (
              <>
                Hint: <strong>{hintFeedback.hint}</strong>
              </>
            )}
            {locked &&
              !feedback &&
              "Answer revealed. Move to the next card when you’re ready."}
          </div>
        </div>
        <div className="session-navigation">
          <button
            id="prev-btn"
            className="session-secondary"
            type="button"
            onClick={engine.prev}
          >
            ← Previous
          </button>
          <button
            id="flip-btn"
            className="session-text-button"
            type="button"
            onClick={engine.flip}
            disabled={locked}
            aria-disabled={locked}
          >
            Reveal answer
          </button>
          <div className="session-forward-actions">
            {isMc && (
              <button
                id="submit-btn"
                className="session-primary"
                type="button"
                onClick={engine.submitMc}
                disabled={selectedMc === null}
                hidden={hasAnswer}
              >
                Check answer
              </button>
            )}
            <button
              id="next-btn"
              ref={nextRef}
              className="session-primary"
              type="button"
              onClick={engine.next}
              hidden={isMc && !hasAnswer}
            >
              Next <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
      <div className="session-underbar">
        <dl className="session-metrics">
          <div>
            <dt>Correct</dt>
            <dd id="stat-correct">{stats.correct}</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd id="stat-acc">{accuracyPct}%</dd>
          </div>
          <div>
            <dt>Streak</dt>
            <dd id="stat-streak">{stats.streak}</dd>
          </div>
        </dl>
        <div className="session-secondary-actions">
          <button
            id="restart-btn"
            className="session-text-button"
            type="button"
            onClick={() => engine.restart(shuffleDeck)}
          >
            Restart deck
          </button>
          <button
            id="reset-progress"
            className="session-text-button"
            type="button"
            onClick={onRequestResetProgress}
          >
            Reset saved progress
          </button>
        </div>
      </div>
    </section>
  );
}
