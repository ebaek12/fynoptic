// Articles index: search, sort and paging over cards that are already in the
// DOM. Astro renders all 244 cards at build time, so this ships no article data
// to the browser — the legacy page shipped all 327 bodies (6.1 MB) just to draw
// a list. It also means the full list is present without JavaScript; this file
// only narrows what is already there.

import { track } from '../lib/track';

const PAGE_SIZE = 12;

type SortKey = 'featured' | 'az' | 'za' | 'short' | 'long';

interface Entry {
  el: HTMLElement;
  haystack: string;
  title: string;
  read: number;
  order: number;
}

const SORTS: Record<SortKey, (a: Entry, b: Entry) => number> = {
  featured: (a, b) => a.order - b.order,
  az: (a, b) => a.title.localeCompare(b.title),
  za: (a, b) => b.title.localeCompare(a.title),
  short: (a, b) => a.read - b.read || a.order - b.order,
  long: (a, b) => b.read - a.read || a.order - b.order,
};

function isSortKey(v: string): v is SortKey {
  return v in SORTS;
}

const debounce = <T extends unknown[]>(fn: (...a: T) => void, ms = 200) => {
  let t: ReturnType<typeof setTimeout>;
  return (...a: T): void => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};

export function initArticlesBrowser(): void {
  const gridEl = document.getElementById('articles-grid');
  if (!gridEl) return;
  // Capture the narrowed type in its own binding: the guard above does not
  // survive into the closures below, same as the other islands.
  const grid: HTMLElement = gridEl;

  const searchInput = document.querySelector<HTMLInputElement>('#search-input');
  const sortSelect = document.querySelector<HTMLSelectElement>('#sort-select');
  const resultCount = document.getElementById('result-count');
  const emptyState = document.getElementById('empty-state');
  const loadMoreBtn = document.querySelector<HTMLButtonElement>('#load-more');
  const clearBtn = document.querySelector<HTMLButtonElement>('#clear-filters');

  const entries: Entry[] = [...grid.querySelectorAll<HTMLElement>('.article-card')].map((el, i) => ({
    el,
    haystack: `${el.dataset.title ?? ''} ${el.dataset.blurb ?? ''}`.toLowerCase(),
    title: el.dataset.title ?? '',
    read: Number(el.dataset.read ?? '0'),
    order: i,
  }));

  let query = '';
  let sort: SortKey = 'featured';
  let visible = PAGE_SIZE;

  function matching(): Entry[] {
    const q = query.trim().toLowerCase();
    const list = q ? entries.filter((e) => e.haystack.includes(q)) : entries.slice();
    return list.sort(SORTS[sort]);
  }

  function render(): void {
    const list = matching();

    // Reordering: append in sorted order. Appending an existing node moves it,
    // so the grid ends up in list order without rebuilding any markup.
    for (const e of list) grid.appendChild(e.el);

    const shown = new Set(list.slice(0, visible));
    for (const e of entries) e.el.hidden = !shown.has(e);

    if (resultCount) {
      resultCount.textContent = `${list.length} ${list.length === 1 ? 'result' : 'results'}`;
    }
    if (emptyState) emptyState.hidden = list.length > 0;
    if (loadMoreBtn) loadMoreBtn.hidden = visible >= list.length;
  }

  const onSearch = debounce((value: string) => {
    query = value;
    visible = PAGE_SIZE;
    render();
    track('search_articles', { query: value, results: matching().length });
  });

  searchInput?.addEventListener('input', (e) => onSearch((e.target as HTMLInputElement).value));

  sortSelect?.addEventListener('change', () => {
    const v = sortSelect.value;
    sort = isSortKey(v) ? v : 'featured';
    visible = PAGE_SIZE;
    render();
  });

  loadMoreBtn?.addEventListener('click', () => {
    visible += PAGE_SIZE;
    render();
    // Move focus to the first newly revealed card so keyboard users are not
    // dropped back at the top of a list that just grew.
    matching()[visible - PAGE_SIZE]?.el.focus();
  });

  clearBtn?.addEventListener('click', () => {
    query = '';
    sort = 'featured';
    visible = PAGE_SIZE;
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'featured';
    render();
    searchInput?.focus();
  });

  // "/" jumps to search, matching the hint rendered next to the field.
  window.addEventListener('keydown', (e) => {
    const el = document.activeElement;
    const typing =
      el instanceof HTMLElement &&
      (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
    if (e.key === '/' && !typing && searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }
    if (typing) return;

    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
      const cards = entries.filter((x) => !x.el.hidden).map((x) => x.el);
      if (!cards.length) return;
      const current = cards.indexOf(document.activeElement as HTMLElement);
      const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      const next = current === -1 ? 0 : Math.min(Math.max(current + delta, 0), cards.length - 1);
      e.preventDefault();
      cards[next]?.focus();
    }
  });

  render();
}
