// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FlashcardView } from "../../src/components/flashcards/FlashcardView";
import { useFlashcardDeck } from "../../src/hooks/useFlashcardDeck";
import {
  Session as PracticeSession,
  type SessionProps,
} from "../../src/components/practice/Session";
import type { Session } from "../../src/hooks/usePracticeSession";
import { EndSessionModal } from "../../src/components/practice/EndSessionModal";

vi.mock("../../src/lib/toast", () => ({ showToast: vi.fn() }));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  HTMLElement.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function element<T extends HTMLElement = HTMLElement>(selector: string) {
  const result = container.querySelector<T>(selector);
  expect(result, selector).not.toBeNull();
  return result!;
}
function click(selector: string) {
  act(() => element(selector).click());
}

function mountDeck(mode: "mc" | "fitb") {
  function Harness() {
    const engine = useFlashcardDeck();
    return engine.active
      ? createElement(FlashcardView, {
          engine,
          shuffleDeck: false,
          onRequestResetProgress: engine.resetProgress,
          onRequestEndSession: engine.endSession,
        })
      : createElement(
          "button",
          {
            id: "start",
            onClick: () =>
              engine.buildDeck(["Banking"], {
                mode,
                shuffleDeck: false,
                mcAnswer: "term",
                fitbAnswer: "term",
              }),
          },
          "Start",
        );
  }
  act(() => root.render(createElement(Harness)));
  click("#start");
}

it("grades, reveals, navigates and resets through the redesigned flashcard controls", () => {
  mountDeck("mc");
  click('[data-value="Bank"]');
  expect(element("#stat-done").textContent).toBe("0");
  expect(element("#feedback").hidden).toBe(true);
  click("#submit-btn");
  expect(element("#stat-done").textContent).toBe("1");
  expect(element("#stat-correct").textContent).toBe("1");
  expect(element('[role="progressbar"]').getAttribute("aria-valuenow")).toBe(
    "2",
  );
  click(".fc-card");
  expect(element("#term-side").getAttribute("aria-hidden")).toBe("false");
  expect(element("#def-side").getAttribute("aria-hidden")).toBe("true");
  expect(
    [...container.querySelectorAll<HTMLButtonElement>(".mc-option")].every(
      (button) => button.disabled,
    ),
  ).toBe(true);
  click("#next-btn");
  expect(element("#crumbs-text").textContent).toBe("2 / 50");
  expect(element<HTMLButtonElement>(".fc-card").disabled).toBe(false);
  click("#prev-btn");
  expect(element<HTMLButtonElement>(".fc-card").disabled).toBe(true);
  click("#reset-progress");
  expect(element("#stat-done").textContent).toBe("0");
  expect(element("#stat-total").textContent).toBe("50");
  expect(element<HTMLButtonElement>(".mc-option").disabled).toBe(false);
  click("#restart-btn");
  expect(element("#crumbs-text").textContent).toBe("1 / 50");
  click("#end-btn");
  expect(container.querySelector("#fc-stage")).toBeNull();
});

it("allows changing a flashcard selection and only saves it after Check answer", () => {
  mountDeck("mc");
  expect(element<HTMLButtonElement>("#submit-btn").disabled).toBe(true);
  expect(element<HTMLButtonElement>("#next-btn").hidden).toBe(true);
  const readChoices = () =>
    [...container.querySelectorAll(".mc-option")].map((node) =>
      node.getAttribute("data-value"),
    );
  const choicesBefore = readChoices();
  const wrong = container.querySelector<HTMLButtonElement>(
    '.mc-option:not([data-value="Bank"])',
  )!;
  act(() => wrong.click());
  expect(wrong.getAttribute("aria-pressed")).toBe("true");
  expect(localStorage.getItem("fynoptic.flashcards.v1")).toBeNull();
  click('[data-value="Bank"]');
  expect(wrong.getAttribute("aria-pressed")).toBe("false");
  expect(readChoices()).toEqual(choicesBefore);
  act(() =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    ),
  );
  expect(element("#stat-done").textContent).toBe("1");
  expect(element("#stat-correct").textContent).toBe("1");
  expect(element<HTMLButtonElement>("#submit-btn").hidden).toBe(true);
  expect(element<HTMLButtonElement>("#next-btn").hidden).toBe(false);
  expect(document.activeElement).toBe(element("#next-btn"));
  click("#submit-btn");
  expect(element("#stat-streak").textContent).toBe("1");
  click("#next-btn");
  expect(container.querySelector('[aria-pressed="true"]')).toBeNull();
  expect(element<HTMLButtonElement>("#submit-btn").disabled).toBe(true);
});

it("keeps typed answers, hints and the answer-target toggle functional", () => {
  mountDeck("fitb");
  expect(document.activeElement).toBe(element("#fitb-input"));
  click("#fitb-hint");
  expect(element("#feedback").textContent).toContain("Hint:");
  expect(element("#stat-done").textContent).toBe("0");
  element<HTMLInputElement>("#fitb-input").value = "Bank";
  act(() =>
    element("#fitb-form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
  expect(element("#feedback").textContent).toBe("Correct!");
  expect(element("#stat-correct").textContent).toBe("1");
  click("#mc-toggle-answer");
  expect(element("#mc-toggle-answer").textContent).toBe(
    "Answer with Definition",
  );
  click("#flip-btn");
  expect(element<HTMLInputElement>("#fitb-input").disabled).toBe(true);
  click("#next-btn");
  expect(element<HTMLInputElement>("#fitb-input").value).toBe("");
});

function practiceProps(): SessionProps {
  const question = {
    id: "q1",
    prompt: "Which account is used for everyday spending?",
    choices: ["Savings", "Checking", "Retirement", "Investment"],
    answerIndex: 1,
    explanation: "Checking accounts support everyday transactions.",
  };
  const session: Session = {
    category: "Personal Finance",
    topics: ["banking"],
    totalQuestions: 10,
    adaptWindow: 5,
    adaptive: true,
    asked: 0,
    correct: 0,
    streak: 0,
    history: [],
    byDiff: { easy: [], medium: [], hard: [] },
    current: question,
    currentDiff: "medium",
    currentIndex: 0,
    timeline: [
      {
        q: question,
        answered: false,
        chosenIdx: null,
        correct: null,
        eliminated: [],
      },
    ],
  };
  return {
    session,
    finishSummary: null,
    onSelectChoice: vi.fn(),
    onToggleEliminate: vi.fn(),
    onSubmit: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onRestart: vi.fn(),
    onRequestEndSession: vi.fn(),
    onFinish: vi.fn(),
  };
}

it("supports touch elimination, answer selection, keyboard submission and useful feedback", () => {
  const props = practiceProps();
  act(() => root.render(createElement(PracticeSession, props)));
  click(".session-eliminate");
  expect(props.onToggleEliminate).toHaveBeenCalledWith(0);
  click(".mc-option");
  expect(props.onSelectChoice).toHaveBeenCalledWith(0);
  expect(element<HTMLButtonElement>("#submit-btn").disabled).toBe(true);
  expect(element<HTMLButtonElement>("#submit-btn").hidden).toBe(false);
  expect(element<HTMLButtonElement>("#next-btn").hidden).toBe(true);
  props.session.timeline[0]!.chosenIdx = 0;
  act(() => root.render(createElement(PracticeSession, { ...props })));
  act(() =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    ),
  );
  expect(props.onSubmit).toHaveBeenCalledOnce();
  Object.assign(props.session.timeline[0]!, { answered: true, correct: false });
  props.session.asked = 1;
  act(() => root.render(createElement(PracticeSession, { ...props })));
  expect(element(".mc-option.is-correct").textContent).toContain("Checking");
  expect(element("#feedback").textContent).toContain(
    "Checking accounts support everyday transactions.",
  );
  expect(element<HTMLButtonElement>(".session-eliminate").disabled).toBe(true);
  expect(element<HTMLButtonElement>("#submit-btn").hidden).toBe(true);
  expect(element<HTMLButtonElement>("#next-btn").hidden).toBe(false);
  expect(document.activeElement).toBe(element("#next-btn"));
  click("#next-btn");
  expect(props.onNext).toHaveBeenCalledOnce();
  click("#end-session-btn");
  expect(props.onRequestEndSession).toHaveBeenCalledOnce();
});

it("keeps both restart and new-topic actions on the practice completion screen", () => {
  const props = practiceProps();
  act(() =>
    root.render(
      createElement(PracticeSession, {
        ...props,
        finishSummary: "8 out of 10 correct.",
      }),
    ),
  );
  expect(element("#finish-summary").textContent).toBe("8 out of 10 correct.");
  expect(document.activeElement).toBe(element("#stage-finish h2"));
  click("#restart-btn");
  click("#finish-reset-btn");
  expect(props.onRestart).toHaveBeenCalledOnce();
  expect(props.onFinish).toHaveBeenCalledOnce();
});

it("keeps the practice session running when dismissing its result preview", () => {
  const onOpenChange = vi.fn();
  const onEndSession = vi.fn();
  act(() =>
    root.render(
      createElement(EndSessionModal, {
        open: true,
        onOpenChange,
        onEndSession,
        stats: {
          answered: 4,
          total: 10,
          correct: 3,
          accuracyPct: 75,
          streak: 2,
          difficulty: "Medium",
          topicsLabel: "Banking",
        },
      }),
    ),
  );
  expect(document.getElementById("end-session-stats")?.textContent).toContain(
    "75%",
  );
  act(() => document.getElementById("keep-practicing")!.click());
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(onEndSession).not.toHaveBeenCalled();
  act(() => document.getElementById("end-session-end-btn")!.click());
  expect(onEndSession).toHaveBeenCalledOnce();
});
