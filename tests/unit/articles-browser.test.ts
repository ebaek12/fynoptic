// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ArticlesBrowser } from "../../src/components/articles/ArticlesBrowser";

let root: Root;
let container: HTMLDivElement;
const visible = () => [
  ...document.querySelectorAll<HTMLAnchorElement>(
    ".article-card:not([hidden])",
  ),
];
const button = (id: string) => document.getElementById(id) as HTMLButtonElement;
const click = async (id: string) => act(async () => button(id).click());

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  localStorage.clear();
  document.body.innerHTML = `
    <button id="nav-test">Navigation</button>
    <div id="controls-sentinel"></div>
    <div class="controls"><input id="search-input" /><select id="sort-select"><option value="featured">Featured</option><option value="az">A–Z</option><option value="short">Shortest</option></select><button id="unread-toggle" aria-pressed="false">Unread only</button></div>
    <div id="result-count"></div><div id="articles-grid">${Array.from({ length: 16 }, (_, i) => `<a class="article-card" href="/articles/guide-${i}" data-title="${i === 0 ? "Zebra" : i === 1 ? "Alpha" : `Guide ${i}`}" data-blurb="${i === 5 ? "Overdraft fees explained" : "A practical guide"}" data-read="${16 - i}">Article ${i}</a>`).join("")}</div>
    <div id="empty-state" hidden><button id="clear-filters">Clear</button></div><button id="load-more">Load more</button>`;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(ArticlesBrowser)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

async function search(query: string, settle = true) {
  await act(async () => {
    const input = document.getElementById("search-input") as HTMLInputElement;
    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    if (settle) vi.advanceTimersByTime(201);
  });
}

describe("article library interactions", () => {
  it("pages the articles and moves focus to the newly revealed rows", async () => {
    expect(visible()).toHaveLength(12);
    await click("load-more");
    expect(visible()).toHaveLength(16);
    expect(document.activeElement).toBe(visible()[12]);
    expect(button("load-more").hidden).toBe(true);
  });

  it("searches summaries and cancels a pending search when filters are cleared", async () => {
    await search("overdraft");
    expect(visible().map((el) => el.getAttribute("href"))).toEqual([
      "/articles/guide-5",
    ]);
    await search("no-such-article");
    expect(button("empty-state").hidden).toBe(false);
    await search("overdraft", false);
    await click("clear-filters");
    await act(async () => {
      vi.advanceTimersByTime(201);
    });
    expect(visible()).toHaveLength(12);
    expect(document.getElementById("result-count")?.textContent).toBe(
      "16 results",
    );
  });

  it("sorts from real titles and read times", async () => {
    const select = document.getElementById("sort-select") as HTMLSelectElement;
    await act(async () => {
      select.value = "az";
      select.dispatchEvent(new Event("change"));
    });
    expect(visible()[0]?.dataset.title).toBe("Alpha");
    await act(async () => {
      select.value = "short";
      select.dispatchEvent(new Event("change"));
    });
    expect(visible()[0]?.dataset.read).toBe("1");
  });

  it("refreshes read state when returning to the library and filters it correctly", async () => {
    await act(async () => {
      localStorage.setItem("ff_articles_read", JSON.stringify(["guide-0"]));
      window.dispatchEvent(new Event("pageshow"));
    });
    const read = document.querySelector(".article-card")!;
    expect(read.classList.contains("is-read")).toBe(true);
    await click("unread-toggle");
    expect(button("unread-toggle").getAttribute("aria-pressed")).toBe("true");
    expect(read.hasAttribute("hidden")).toBe(true);
    expect(document.getElementById("result-count")?.textContent).toBe(
      "15 results",
    );
  });

  it("keeps arrow keys in the navigation, while supporting row navigation and slash search", async () => {
    button("nav-test").focus();
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    });
    expect(document.activeElement).toBe(button("nav-test"));
    visible()[0]?.focus();
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    });
    expect(document.activeElement).toBe(visible()[1]);
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
    });
    expect(document.activeElement).toBe(
      document.getElementById("search-input"),
    );
  });
});
