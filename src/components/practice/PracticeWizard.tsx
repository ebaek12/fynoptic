import { useEffect, useMemo, useState } from "react";
import { showToast } from "../../lib/toast";
import type { PracticeBank } from "@/types";
import { SelectionMark, SelectionTools, StudySetup } from "../study/StudySetup";

export interface WizardSelection {
  category: string;
  topics: string[];
  totalQuestions: number;
  adaptWindow: number;
  adaptive: boolean;
}
export interface PracticeWizardProps {
  bank: PracticeBank;
  categories: string[];
  onComplete: (selection: WizardSelection) => void;
}
const QUESTION_COUNTS = [10, 20, 30, 40, 50];
const ADAPT_WINDOWS = [5, 10, 15, 20];
const niceTopic = (topic: string) =>
  topic.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function PracticeWizard({
  bank,
  categories,
  onComplete,
}: PracticeWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState(categories[0] ?? "");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [adaptive, setAdaptive] = useState(true);
  const [adaptWindow, setAdaptWindow] = useState(10);
  const topics = useMemo(
    () => Object.keys(bank[category] ?? {}).sort(),
    [bank, category],
  );
  const topicCounts = useMemo(
    () =>
      Object.fromEntries(
        topics.map((topic) => [
          topic,
          Object.values(bank[category]?.[topic] ?? {}).reduce(
            (sum, items) => sum + items.length,
            0,
          ),
        ]),
      ),
    [bank, category, topics],
  );
  const drawingFrom = [...selectedTopics].reduce(
    (sum, topic) => sum + (topicCounts[topic] ?? 0),
    0,
  );
  useEffect(() => {
    document.body.setAttribute("data-cat", category);
  }, [category]);

  function changeCategory(next: string) {
    if (next === category) return;
    setCategory(next);
    setSelectedTopics(new Set());
  }
  function toggleTopic(topic: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }
  function handleStart() {
    if (!selectedTopics.size) {
      showToast("Please select at least one unit.");
      return;
    }
    onComplete({
      category,
      topics: [...selectedTopics],
      totalQuestions,
      adaptWindow,
      adaptive,
    });
  }

  return (
    <StudySetup
      id="practice-wizard"
      step={step}
      labels={["Build your session", "Choose topics"]}
      title={
        step === 1 ? "Set up your practice." : "What do you want to work on?"
      }
      description={
        step === 1
          ? "Choose a subject and how many questions you want to answer."
          : `Choose a few topics from ${category}, or give everything a go.`
      }
      onBack={() => setStep(1)}
      summary={
        <>
          <strong>
            {totalQuestions} questions · {category}
          </strong>
          <span>
            {step === 1
              ? adaptive
                ? "Difficulty adapts as you go."
                : "Practice without automatic difficulty changes."
              : `${selectedTopics.size} topic${selectedTopics.size === 1 ? "" : "s"} selected${drawingFrom ? ` · ${drawingFrom} questions available` : ""}`}
          </span>
        </>
      }
      actions={
        step === 1 ? (
          <button
            id="wiz-next-1"
            className="study-primary"
            type="button"
            onClick={() => setStep(2)}
          >
            Choose topics <span aria-hidden="true">→</span>
          </button>
        ) : (
          <>
            <button
              id="wiz-back-2"
              className="study-back"
              type="button"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              id="start-btn"
              className="study-primary"
              type="button"
              onClick={handleStart}
            >
              Start Practice <span aria-hidden="true">→</span>
            </button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div id="step-1" className="study-settings">
          <fieldset className="study-field">
            <legend>Subject</legend>
            <div className="study-banks">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`study-bank${c === category ? " is-selected" : ""}`}
                  aria-pressed={c === category}
                  onClick={() => changeCategory(c)}
                >
                  <span>
                    <strong>{c}</strong>
                    <span>
                      {c === "Personal Finance"
                        ? "Everyday decisions about your money."
                        : "How markets and the economy work."}
                    </span>
                  </span>
                  <SelectionMark radio />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="study-preferences">
            <fieldset className="study-field">
              <legend>Questions</legend>
              <div
                className="study-segments"
                role="group"
                aria-label="Questions"
              >
                {QUESTION_COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={n === totalQuestions}
                    onClick={() => setTotalQuestions(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="study-help">
                You can finish the session whenever you need to.
              </p>
            </fieldset>
            <div className="study-adaptive">
              <label className="study-toggle-row" htmlFor="adaptive-toggle">
                <span>
                  <strong>Adaptive mode</strong>
                  <span>Difficulty adjusts to your recent answers.</span>
                </span>
                <input
                  id="adaptive-toggle"
                  type="checkbox"
                  checked={adaptive}
                  onChange={(e) => setAdaptive(e.target.checked)}
                />
              </label>
              <details className="study-details">
                <summary>Difficulty settings</summary>
                <fieldset
                  id="adapt-every-field"
                  className="study-field"
                  disabled={!adaptive}
                >
                  <legend>Adjust difficulty every</legend>
                  <div
                    className="study-segments"
                    role="group"
                    aria-label="Adjust difficulty every"
                  >
                    {ADAPT_WINDOWS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={!adaptive}
                        aria-pressed={n === adaptWindow}
                        onClick={() => setAdaptWindow(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="study-help">
                    {adaptive
                      ? "questions"
                      : "Turn on adaptive mode to adjust this."}
                  </p>
                </fieldset>
              </details>
            </div>
          </div>
        </div>
      ) : (
        <div id="step-2">
          <SelectionTools
            selected={selectedTopics.size}
            total={topics.length}
            onSelectAll={() => setSelectedTopics(new Set(topics))}
            onClear={() => setSelectedTopics(new Set())}
            allId="topics-select-all"
            clearId="topics-clear"
          />
          <div
            id="topics-list"
            className="study-topics"
            aria-label="Topics"
            role="group"
          >
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                className={`study-topic${selectedTopics.has(topic) ? " is-selected" : ""}`}
                data-value={topic}
                role="checkbox"
                aria-checked={selectedTopics.has(topic)}
                onClick={() => toggleTopic(topic)}
              >
                <SelectionMark />
                <span className="study-topic-copy">
                  <span>{niceTopic(topic)}</span>
                  <span className="study-meta">
                    <span className="topic-btn-count">
                      {topicCounts[topic] ?? 0}
                    </span>{" "}
                    questions
                  </span>
                </span>
              </button>
            ))}
            {!topics.length && <p>No topics available for this subject.</p>}
          </div>
        </div>
      )}
    </StudySetup>
  );
}
