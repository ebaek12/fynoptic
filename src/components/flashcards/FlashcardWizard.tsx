import { useEffect, useState } from "react";
import { FLASHCARD_UNITS } from "../../data/flashcard-units";
import {
  readStorage,
  unitProgress,
  type AnswerRecord,
} from "../../hooks/useFlashcardDeck";
import { showToast } from "../../lib/toast";
import { SelectionMark, SelectionTools, StudySetup } from "../study/StudySetup";

export type Mode = "mc" | "fitb";
export interface FlashcardWizardProps {
  allUnits: string[];
  unitsSelected: Set<string>;
  onUnitsSelectedChange: (next: Set<string>) => void;
  mode: Mode;
  onModeChange: (next: Mode) => void;
  shuffleDeck: boolean;
  onShuffleDeckChange: (next: boolean) => void;
  onStart: () => void;
}

export function FlashcardWizard({
  allUnits,
  unitsSelected,
  onUnitsSelectedChange,
  mode,
  onModeChange,
  shuffleDeck,
  onShuffleDeckChange,
  onStart,
}: FlashcardWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  useEffect(() => {
    setAnswers(readStorage().answers);
  }, []);

  function toggleUnit(unit: string) {
    const next = new Set(unitsSelected);
    if (next.has(unit)) next.delete(unit);
    else next.add(unit);
    onUnitsSelectedChange(next);
  }
  function confirmUnits() {
    if (!unitsSelected.size) {
      showToast("Select at least one unit to continue.");
      return;
    }
    setStep(2);
  }
  const count = unitsSelected.size;
  const cardCount = [...unitsSelected].reduce(
    (sum, unit) => sum + (FLASHCARD_UNITS[unit]?.length ?? 0),
    0,
  );

  return (
    <StudySetup
      id="flashcard-setup"
      step={step}
      labels={["Choose topics", "Choose a mode"]}
      title={
        step === 1
          ? "What would you like to review?"
          : "How do you want to learn?"
      }
      description={
        step === 1
          ? "Choose one topic or mix a few. You can always come back for more."
          : "Recognize the answer, or challenge yourself to recall it."
      }
      onBack={() => setStep(1)}
      summary={
        <>
          <strong>
            {count
              ? `${cardCount} cards in your deck`
              : "Your deck starts here"}
          </strong>
          <span>
            {count
              ? `${count} topic${count === 1 ? "" : "s"} selected · Progress saves automatically`
              : "Select a topic to get started."}
          </span>
        </>
      }
      actions={
        step === 1 ? (
          <button
            id="confirm-units"
            className="study-primary"
            type="button"
            onClick={confirmUnits}
          >
            Continue <span aria-hidden="true">→</span>
          </button>
        ) : (
          <>
            <button
              id="back-to-units"
              className="study-back"
              type="button"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              id="start-btn-big"
              className="study-primary"
              type="button"
              onClick={onStart}
            >
              Start Session <span aria-hidden="true">→</span>
            </button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div id="block-units">
          <SelectionTools
            selected={count}
            total={allUnits.length}
            onSelectAll={() => onUnitsSelectedChange(new Set(allUnits))}
            onClear={() => onUnitsSelectedChange(new Set())}
            allId="select-all"
            clearId="clear-all"
          />
          <div
            id="unit-list"
            className="study-topics"
            role="group"
            aria-label="Flashcard topics"
          >
            {allUnits.map((unit) => {
              const cards = FLASHCARD_UNITS[unit] ?? [];
              const progress = unitProgress(answers, unit, cards);
              const checked = unitsSelected.has(unit);
              return (
                <label
                  key={unit}
                  id={`unit-${unit.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className={`study-topic${checked ? " is-active" : ""}`}
                >
                  <input
                    className="study-input"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUnit(unit)}
                    aria-label={`${unit}, ${cards.length} cards, ${progress.pct}% mastered`}
                  />
                  <SelectionMark />
                  <span className="study-topic-copy">
                    <span className="unit-name">{unit}</span>
                    <span className="study-meta">
                      {cards.length} cards
                      {progress.pct > 0 && (
                        <span className="study-mastery">
                          {" "}
                          · {progress.pct}% mastered
                        </span>
                      )}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <div id="block-mode">
          <div
            className="study-modes"
            role="radiogroup"
            aria-label="Practice mode"
          >
            <label className={`study-mode${mode === "mc" ? " is-active" : ""}`}>
              <input
                className="study-input"
                type="radio"
                name="mode"
                value="mc"
                checked={mode === "mc"}
                onChange={() => onModeChange("mc")}
                aria-label="Multiple Choice"
              />
              <div className="study-mode-top">
                <span className="study-mode-kicker">A little guidance</span>
                <SelectionMark radio />
              </div>
              <strong>Multiple Choice</strong>
              <p>
                Read the prompt and pick the right answer from a set of options.
              </p>
              <span className="study-mode-note">
                Good for getting familiar with a topic.
              </span>
            </label>
            <label
              className={`study-mode${mode === "fitb" ? " is-active" : ""}`}
            >
              <input
                className="study-input"
                type="radio"
                name="mode"
                value="fitb"
                checked={mode === "fitb"}
                onChange={() => onModeChange("fitb")}
                aria-label="Fill in the Blank"
              />
              <div className="study-mode-top">
                <span className="study-mode-kicker">
                  A little more challenge
                </span>
                <SelectionMark radio />
              </div>
              <strong>Fill in the Blank</strong>
              <p>
                Read the prompt and type the answer from memory. Hints are there
                if you need them.
              </p>
              <span className="study-mode-note">
                Good for finding out what has stuck.
              </span>
            </label>
          </div>
          <label className="study-toggle-row" htmlFor="shuffle">
            <span>
              <strong>Shuffle deck</strong>
              <span>Mix up the order each time you start.</span>
            </span>
            <input
              id="shuffle"
              type="checkbox"
              checked={shuffleDeck}
              onChange={(e) => onShuffleDeckChange(e.target.checked)}
            />
          </label>
          <details className="study-details">
            <summary>
              Your selected topics <span>{count}</span>
            </summary>
            <ul>
              {[...unitsSelected].map((unit) => (
                <li key={unit}>{unit}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </StudySetup>
  );
}
