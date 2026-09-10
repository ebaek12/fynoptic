// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import SpotTheRedFlag from "../../src/components/home/SpotTheRedFlag";

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(SpotTheRedFlag)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const choice = (id: string) =>
  container.querySelector<HTMLButtonElement>(`[data-choice="${id}"]`)!;
const status = () => container.querySelector('[role="status"]')!.textContent;
const click = async (button: HTMLButtonElement) =>
  act(async () => button.click());

describe("Spot the Red Flag demo", () => {
  it("starts unanswered and never links the simulated scam address", () => {
    expect(status()).toBe("");
    expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    expect(container.querySelector('a[href*="usps-redelivery"]')).toBeNull();
    expect(container.querySelector(".rf-url")!.closest("a")).toBeNull();
  });

  it("gives useful feedback for both alternative choices, then reveals the URL lesson", async () => {
    await click(choice("package"));
    expect(status()).toContain(
      "A package notification alone doesn’t prove it’s a scam",
    );
    expect(container.querySelector('[data-solved="true"]')).toBeNull();

    await click(choice("fee"));
    expect(status()).toContain("The fee is a red flag, too.");
    expect(status()).toContain("USPS redelivery is free.");
    expect(choice("package").getAttribute("aria-pressed")).toBe("false");

    await click(choice("url"));
    expect(status()).toContain("Exactly. The address gives it away.");
    expect(status()).toContain("Open usps.com yourself");
    expect(container.querySelector('[data-solved="true"]')).not.toBeNull();
    expect(choice("url").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
    expect(container.querySelector(".rf-continue")!.getAttribute("href")).toBe(
      "/practice",
    );
  });

  it("restarts without leaving stale feedback and returns keyboard focus to the choices", async () => {
    await click(choice("url"));
    await click(container.querySelector<HTMLButtonElement>(".rf-reset")!);
    expect(status()).toBe("");
    expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    expect(container.querySelector(".rf-continue")).toBeNull();
    expect(
      container.querySelector(".rf-feedback")!.getAttribute("data-open"),
    ).toBe("false");
    expect(document.activeElement).toBe(choice("fee"));
  });

  it("lets keyboard focus inspect the corresponding message detail without selecting an answer", async () => {
    await act(async () => choice("url").focus());
    expect(container.querySelector("section")!.dataset.inspecting).toBe("url");
    expect(status()).toBe("");
    await act(async () => choice("url").blur());
    expect(
      container.querySelector("section")!.dataset.inspecting,
    ).toBeUndefined();
  });

  it("keeps keyboard focus in the active answer slot on narrow screens", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    await act(async () => choice("package").focus());
    await click(choice("package"));
    const retry = container.querySelector<HTMLButtonElement>(".rf-reset")!;
    expect(document.activeElement).toBe(retry);
    expect(status()).toContain("A package notification alone doesn’t prove");
    await click(retry);
    expect(document.activeElement).toBe(choice("fee"));
    expect(status()).toBe("");
  });
});
