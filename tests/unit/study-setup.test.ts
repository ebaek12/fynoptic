// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  FlashcardWizard,
  type Mode,
} from "../../src/components/flashcards/FlashcardWizard";
import { PracticeWizard } from "../../src/components/practice/PracticeWizard";
import { FLASHCARD_UNITS } from "../../src/data/flashcard-units";
import type { PracticeBank } from "../../src/types";

vi.mock("../../src/lib/toast", () => ({ showToast: vi.fn() }));
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
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

it("starts a flashcard session from the mode screen with the exact retained selection", () => {
  const start = vi.fn();
  function Harness() {
    const [units, setUnits] = useState(new Set<string>());
    const [mode, setMode] = useState<Mode>("mc");
    const [shuffle, setShuffle] = useState(true);
    return createElement(FlashcardWizard, {
      allUnits: ["Banking", "Financial Decisions"],
      unitsSelected: units,
      onUnitsSelectedChange: setUnits,
      mode,
      onModeChange: setMode,
      shuffleDeck: shuffle,
      onShuffleDeckChange: setShuffle,
      onStart: () => start({ units: [...units], mode, shuffle }),
    });
  }
  act(() => root.render(createElement(Harness)));
  click("#confirm-units");
  expect(element("#flashcard-setup").dataset.step).toBe("1");
  click("#unit-list input");
  expect(element(".study-summary").textContent).toContain(
    `${FLASHCARD_UNITS.Banking!.length} cards`,
  );
  click("#confirm-units");
  expect(container.querySelector("#block-units")).toBeNull();
  expect(document.activeElement).toBe(element("#flashcard-setup-heading"));
  click('input[value="fitb"]');
  click("#shuffle");
  click("#back-to-units");
  expect(element<HTMLInputElement>("#unit-list input").checked).toBe(true);
  click("#confirm-units");
  expect(element<HTMLInputElement>('input[value="fitb"]').checked).toBe(true);
  expect(element<HTMLInputElement>("#shuffle").checked).toBe(false);
  click("#start-btn-big");
  expect(start).toHaveBeenCalledExactlyOnceWith({
    units: ["Banking"],
    mode: "fitb",
    shuffle: false,
  });
});

const bank: PracticeBank = {
  "Personal Finance": {
    budgeting: { easy: [], medium: [], hard: [] },
    saving: { easy: [], medium: [], hard: [] },
  },
  Economics: { markets: { easy: [], medium: [], hard: [] } },
};

it("retains practice settings when returning from topics and starts without an extra confirmation", () => {
  const start = vi.fn();
  act(() =>
    root.render(
      createElement(PracticeWizard, {
        bank,
        categories: Object.keys(bank),
        onComplete: start,
      }),
    ),
  );
  click(".study-segments button"); // 10 questions
  click("#adaptive-toggle");
  click("#wiz-next-1");
  click("#start-btn");
  expect(start).not.toHaveBeenCalled();
  click("#topics-select-all");
  click("#wiz-back-2");
  expect(element<HTMLInputElement>("#adaptive-toggle").checked).toBe(false);
  expect(element(".study-segments button").getAttribute("aria-pressed")).toBe(
    "true",
  );
  click("#wiz-next-1");
  expect(element(".study-summary").textContent).toContain("2 topics selected");
  click("#start-btn");
  expect(start).toHaveBeenCalledExactlyOnceWith({
    category: "Personal Finance",
    topics: ["budgeting", "saving"],
    totalQuestions: 10,
    adaptive: false,
    adaptWindow: 10,
  });
});

it("clears only the topics when changing the practice subject", () => {
  const start = vi.fn();
  act(() =>
    root.render(
      createElement(PracticeWizard, {
        bank,
        categories: Object.keys(bank),
        onComplete: start,
      }),
    ),
  );
  click("#wiz-next-1");
  click("#topics-select-all");
  click("#wiz-back-2");
  click(".study-bank:last-child");
  click("#wiz-next-1");
  expect(container.querySelectorAll('[aria-checked="true"]')).toHaveLength(0);
  expect(element("#topics-list").textContent).toContain("Markets");
  click("#topics-select-all");
  click("#start-btn");
  expect(start).toHaveBeenCalledExactlyOnceWith({
    category: "Economics",
    topics: ["markets"],
    totalQuestions: 20,
    adaptive: true,
    adaptWindow: 10,
  });
});
