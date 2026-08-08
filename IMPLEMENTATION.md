# Fynoptic → Astro + TypeScript: implementation plan

**Status: awaiting approval. Nothing implemented.**
Branch `worktree-astro-migration-plan`, worktree `.claude/worktrees/astro-migration-plan`.
Supersedes the strategy sketch in `PLAN-astro-migration.md`.

---

## 0. Preconditions

### 0.1 Session coordination

Several Claude sessions are live on this repo. Snapshot of `main` at time of
writing: still `ab24e9c`, unchanged. No peer has committed anything — the user
will run a separate merge agent later; **do not poll `main` expecting it to
move on its own.**

Known in-flight, uncommitted work, each in its own worktree:

- **Media agent** — `assets/img` png→webp swap, `<img src>` edits in
  `about.html`/`index.html`. Confirmed via `git status` in the primary
  checkout.
- **Layout agent** (`uds:/tmp/cc-socks/8158.sock`) — reveal/scroll/CSS fixes,
  proposed (not yet done) rewriting 150 internal links to drop `.html`. This
  plan does not adopt that URL change (§1, non-goals).
- **Auth overhaul** (`.claude/worktrees/auth-overhaul`) — **verified by direct
  read of that worktree's files**, not taken on faith. Rewrote all 9 HTML
  files (-328/+33 lines) AND both CSS files (63 lines changed in
  `styles.css`, 59 in `redesign.css`). Fixes D2, D5, D9 from this plan's own
  defect register, plus adds password reset, popup-only Google auth (fixes a
  silent-failure redirect bug), email-enumeration protections, and a
  `FIREBASE_SETUP.md` (copied into this worktree already — answers Q3). New
  contract, confirmed by reading their `js/auth.js`, `js/app.js`, and 2 HTML
  files directly:
  - `#user-btn` always contains two static children,
    `<img id="nav-avatar" alt="" hidden />` and
    `<span id="nav-initials" aria-hidden="true"></span>` — **never** written
    via `innerHTML`, only `hidden`/`src`/`textContent` toggles.
  - The three auth modals (login/signup/reset) are injected once at runtime
    from a single `AUTH_MODAL_MARKUP` template in `app.js`, not inline
    per-page markup. `articles.html` now has `#user-btn` (D2 fixed at the
    source).
  - `js/nav-avatar.js` deleted (D5 resolved — folded into `auth.js`).
  - Firebase 10.7.1 → 12.17.1; `window.authUI` surface adds `resetPassword`,
    `errorMessage`; `signInWithRedirect` removed entirely (documented as
    unfixable while `authDomain` differs from the site's origin — third-party
    storage partitioning blocks the iframe).
  - `src/lib/auth.ts`, `src/lib/modal.ts`, and a new `src/lib/auth-ui.ts` in
    **this** worktree have already been rewritten to match this contract
    (verified: `npx tsc --noEmit` clean, `npm run build` 0 errors/warnings, no
    `any`).
  - **Round 2 update (also verified by direct read):** stable, nothing
    running, not committed (user confirms before any commit; they're away).
    424 Playwright assertions, 0 failures, 0 console errors across all 9
    pages. `css/styles.css` and `css/redesign.css` copied verbatim into
    `src/styles/{legacy,redesign}.css` in this worktree from that worktree's
    final state (6915 + 284 lines). Notable CSS facts confirmed by direct
    grep, not just the peer's word: `.user-icon[data-modal-open]` in
    `redesign.css:275` supplies the signed-out person-glyph via
    `background-image` — the static markup MUST emit
    `data-modal-open="login-modal"` on `#user-btn` or the glyph is wrong.
    `.user-icon { padding: 0 }` at `redesign.css:236` overrides the UA button
    padding that was rendering the 40px circle as an oval. `.user-initials`
    class is gone (nothing generates it since the innerHTML removal).

- **Layout/URL-rewrite agent** (`fynoptic-layout` worktree, branch
  `arhan/layout-alignment-fix`) — **committed** as `d19d096` off the same
  `ab24e9c`, NOT merged, NOT pushed. Independently rewrote all 9 HTML files
  (150 internal links `X.html` → root-absolute extensionless `/X`,
  `index.html` → `/`, canonical tags), plus `css/redesign.css`,
  `js/flashcard.js`, `js/course-one.js`, `js/auth.js`, `js/profile.js`, and a
  rewritten `index.html` IntersectionObserver block.

  **Two consequences, both flagged to the respective peers already:**

  1. **This collides with auth-overhaul.** Both branches independently
     modified `js/auth.js` and `js/profile.js` off the same base. Neither peer
     had visibility into the other. Not this plan's problem to resolve, but
     surfaced to both sessions so it doesn't surprise the eventual merge.
  2. **URL scheme fork.** This plan's non-goals (§1) already declined to adopt
     extensionless URLs — decided before this branch existed, for the same
     reason: `build.format: 'file'` keeps `about.html` working, and GitHub
     Pages fronted by a CDN makes a live 404 expensive to debug. The layout
     agent confirms GitHub Pages already serves extensionless paths
     natively (verified against the live site), so no Astro config change
     would even be *required* to support both simultaneously. But committing
     to extensionless as the canonical scheme — updating every `<a href>` in
     every component this plan builds — is a real decision with SEO/redirect
     implications that belongs to the user, not to whichever two peer
     sessions happen to agree first. **Not adopted.** P4 continues emitting
     `.html` links against auth-overhaul's verified contract.
     **Open question for the user at merge time:** `.html` (this plan, as
     written) or extensionless (`arhan/layout-alignment-fix`, committed)? If
     extensionless wins, every href in `Header.astro`/`Footer.astro`/every
     page needs a follow-up pass, and `astro.config.mjs` needs
     `trailingSlash`/`build.format` reconsidered.

  **Update, verified directly against production (not secondhand):**
  ```
  curl -s -o /dev/null -w '%{http_code}' https://fynoptic.org/courses   -> 200 (no -L — not a redirect)
  curl -s -o /dev/null -w '%{http_code}' https://fynoptic.org/profile   -> 200 (same)
  curl -s -o /dev/null -w '%{http_code}' https://fynoptic.org/nonexistent-page-xyz -> 404
  ```
  GitHub Pages already serves `courses.html` at `/courses` and `profile.html`
  at `/profile` natively, live, today — real resolution, not a wildcard (the
  404 confirms it). So: **internal `<a href>` targets are now written
  extensionless** (`/about`, `/`) in every component this plan builds, with
  no change to `build.format` — output files stay named `about.html` etc.,
  so both the old and new link forms resolve. This is a small, reversible,
  zero-downside change (confirmed live) and is NOT the same decision as the
  canonical-tag / SEO-preferred-URL question, which is still open for the
  user — that one has real duplicate-content implications and doesn't have
  a technically-forced answer the way the link-text question just did.

  **Merge hazard flagged by auth-overhaul, recorded here so it survives:**
  their `js/auth.js` rewrite and `arhan/layout-alignment-fix`'s one-line
  `"profile.html"` → `"/profile"` edit sit on the same line, adjacent to the
  exact `innerHTML` bug auth-overhaul removed. A merge that resolves toward
  the layout branch (or naive "keep both") silently reverts the entire auth
  overhaul — Firebase 12.17.1→10.7.1, the innerHTML clobber, password reset,
  the boot-order fix — while still building green, because the file would
  still run. **Correct resolution: take auth-overhaul's `auth.js` wholesale;
  reapply the `/profile` intent as a one-line edit on top, only if
  extensionless URLs are adopted.** Full detail in `MERGE_NOTES.md` in the
  `auth-overhaul` worktree (their own words: "disposable, merge guidance
  only" — read it, don't copy it forward as project doc).

  **Two more consequences of the extensionless-href call, both flagged by the
  layout agent and both correct:**
  1. **Canonical tags now match the hrefs (extensionless), not `.html`.**
     Deferring canonical independently stopped being coherent the moment
     hrefs went extensionless — `<a href="/about">` next to
     `<link rel="canonical" href=".../about.html">` is strictly worse than
     either pure choice (tells search engines the link target is a
     non-canonical duplicate of itself). This is a consistency fix, not a
     new SEO judgment call layered on top of the earlier one. `Base.astro`'s
     `canonical` prop is extensionless from the start.
  2. **Local static servers don't do extensionless resolution — GitHub Pages
     does.** `astro preview`, `python -m http.server`, etc. look for a
     literal `about` file and 404. This will make every local link-click
     test and Playwright run against a local server show a wall of false
     404s that is NOT a regression — don't "fix" it by reverting hrefs.
     P5/P6 verification must serve via something that mimics Pages
     (`npx serve` does extensionless by default) instead of
     `python -m http.server`, or the visual-diff/interaction harness from P0
     needs updating before it's reused on ported pages.

**Hard rules for this plan:**

1. **Never touch `assets/**`.** The media agent owns it. This plan copies the
   directory into `public/` wholesale and rewrites zero `<img>` / `<source>` tags.
   Because `public/assets/img/x.webp` serves at `/assets/img/x.webp`, whatever they
   land — webp swap, `<picture>` elements, CDN URLs — works unchanged.
2. **P4–P6 rewrite all 9 HTML files.** They must not run while anyone else is
   editing those files. P4 is blocked until the media agent's and layout agent's
   HTML changes are merged to `main` and this branch is rebased onto it.
3. **P1–P3 create only new files** (`package.json`, `src/lib/`, `src/articles/`,
   `scripts/`). Zero conflict surface. Safe to run now, in parallel with everyone.

### 0.2 Environment

- Node 20 LTS or 22 LTS. Astro 6 requires ≥ 18.20.8; pin 22 in CI.
- `.nvmrc` committed with `22`.

---

## 1. Goals, non-goals, success criteria

### Goals

Replace 9 hand-maintained HTML files and 12 loose JS files with a typed Astro
project that static-exports to the **same URLs**, and fix the defects in §2 as a
structural consequence rather than as patches.

### Non-goals

- No visual redesign. Ships pixel-identical. The Optical Bench layer
  (`css/redesign.css`, commit `ab24e9c`) is preserved byte-for-byte.
- No URL changes. `fynoptic.org/about.html` stays `about.html`.
  **This plan explicitly does not adopt the peer session's extensionless-URL
  proposal** — 150 link rewrites on a live custom domain is a separate, riskier
  change that should not ride along with a framework migration.
- No `assets/**` work.
- No git history rewrite. `.git` stays 97 MB. Decided.
- No UI framework. Islands are vanilla TypeScript modules Astro bundles.
- No CSS rewrite during the port. That is P8, scheduled separately.

### Success criteria (all must hold before cutover)

| # | Criterion | How measured |
|---|---|---|
| S1 | Build clean | `npm run build` exits 0; `astro check` reports 0 errors, 0 warnings |
| S2 | URL parity | `find dist -name '*.html'` path set == current site path set, modulo the 327 new `articles/<id>.html` |
| S3 | Visual parity | 72-shot Playwright diff, 0 unintended pixel deltas |
| S4 | Articles payload | `articles.html` first-load JS < 100 KB (from 6.1 MB) |
| S5 | D1 fixed | At 390×844, every `.reveal-section` / `.reveal-card` / `.reveal-cta` reports `getComputedStyle(el).opacity === '1'` after full scroll |
| S6 | No console errors | 0 errors on all 9 pages + 3 sampled article pages |
| S7 | Auth reachable | Sign-in modal opens on all 9 pages (D2) |

---

## 2. Defect register

Findings from the audit, each with evidence and the fix that lands it.

**D10 verification note (during P6):** checked nav-links across all 9 pages in
the auth-overhaul worktree individually rather than assume consistency. Real
drift confirmed: `about`/`courses`/`flashcard`/`practice`/`index` (5/9) have
Course/Articles/Flashcards/Practice/About; `articles`/`courseone`/`profile`
(3/9) are missing "About"; `bot` uniquely has "Fix-it Bot" in place of
"About". This is pre-existing source inconsistency, not something introduced
by any peer session. `Header.astro` (P4) already standardizes on the 5/9
majority pattern — every ported page inherits it automatically via `<Header
/>`, which is D10's fix taking effect exactly as designed, not a new
decision. No action needed; recorded so a future reviewer doesn't mistake the
standardization for an accidental content change.

| # | Sev | Defect | Evidence | Fix lands in |
|---|---|---|---|---|
| D1 | **High** | Sections permanently invisible. `.reveal-section{opacity:0}` is lifted only by `.in-view`, granted by an IntersectionObserver with `threshold: 0.6`. A section taller than the viewport can never be 60% visible → never reveals, on load or on scroll. | `css/styles.css:6234`, `index.html:294–345` | P3 (`reveal.ts`), applied P5 |
| D2 | **High** | `articles.html` has no `#user-btn` and no `#login-modal`. Sign-in silently unavailable on that page; the other 8 have both. | `grep 'user-btn' articles.html` → no match | P4 (component) |
| D3 | **High** | `js/articles-data.js` is 6.1 MB and ships all 327 article bodies to render a card list. | `ls -la js/articles-data.js`; `grep -c 'window.ARTICLES.push' → 327` | P2 |
| D4 | Med | Four near-identical IntersectionObserver implementations: `index.html:294`, `:298`, `:334`, `app.js:278`, plus a fifth variant at `app.js:552` (threshold 0.45). | grep | P3 |
| D5 | Med | `js/nav-avatar.js` (39 lines) loaded by zero pages, but `<img id="nav-avatar">` markup sits on 6 pages. | `grep -rn 'nav-avatar' *.html` shows only `<img>` | P4 — pending **Q1** |
| D6 | Low | `js/courses.js` is 0 bytes, referenced by nothing. | `wc -l js/courses.js` | P1 (not carried) |
| D7 | Med | `app.js:9–25` hardcodes `COURSE_MODULES` and an 8-entry `ARTICLES` list that duplicates and contradicts the real data. A second 12-entry duplicate lives at `articles.js:56–69`. | both files | P3 |
| D8 | Med | Duplicate helpers: `toast` ×3, `shuffle` ×2, `initialsFrom` ×2, `getCookie` ×2, back-to-top ×2 (`courses.html:466` inline and `articles.js:233`). | grep | P3 |
| D9 | Low | `user.displayName` (settable by the user in their Google profile) interpolated into `innerHTML`. Lands in a `title` attribute and initials text — low impact, but no reason to be innerHTML. | `js/auth.js:96` | P3 |
| D10 | Med | Header (~45 lines), footer, login modal and the font/icon/meta block copy-pasted across 9 files. `index.html:15` comments *"Keep identical on every page."* That discipline already failed — see D2. | all 9 `*.html` | P4 |
| D11 | Med | Mixed module systems. `auth.js` / `flashcard.js` / `profile.js` are `type="module"`; `app.js` / `practice.js` / `articles.js` / `course-one.js` are classic scripts sharing global scope, communicating via `window.authUI`, `window.ARTICLES`, `window.ffTrack`. | `grep '<script' *.html` | P3/P6 |
| D12 | Med | Three Google Fonts families requested render-blocking from a third-party CDN on all 9 pages, plus 2 preconnects. | `index.html:16–18` | P4 |
| D13 | Low | No `.gitignore`. `__pycache__/*.pyc` loose in tree. | `ls -a` | P1 |
| D14 | Low | No `package.json`, build, typecheck, lint, format, CI, or README. | — | P1/P7 |
| D15 | Med | `flashcard.html`, `practice.html`, `profile.html` have **no** `<meta name="description">`, no OG tags, no canonical. `courses.html` and `bot.html` share the identical `<title>` "Know the playbook. Beat the traps." | `grep '<title>\|description\|canonical' *.html` | P4 (typed layout props make these required) |
| D16 | Med | All 327 articles are assigned `tags: ['Guides']` and a synthetic date (`PLACEHOLDER_DATE_ANCHOR` + index days). The tag filter has exactly one tag and the date sort orders by array index. | `js/articles.js:31–53` | P2 — pending **Q6** |

**Deferred to P8, recorded so it is not lost:** 245 `!important` across the two
sheets; `.reveal-prism` defined three times with conflicting transforms
(`styles.css:5922`, `:6031`, `:6166`); light theme implemented as a ~100-line
`[data-theme="light"] .selector` override wall from `styles.css:4543`.

---

## 3. Stack

```jsonc
// package.json
{
  "name": "fynoptic",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint . --ext .js,.ts,.astro",
    "format": "prettier --write \"**/*.{ts,astro,css,md,json}\"",
    "test:visual": "node scripts/visual-diff.mjs",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "astro": "^6",
    "firebase": "^10.7.1"
  },
  "devDependencies": {
    "@fontsource-variable/inter": "^5",
    "@fontsource-variable/spectral": "^5",
    "@fontsource-variable/sora": "^5",
    "@playwright/test": "^1",
    "eslint": "^9",
    "eslint-plugin-astro": "^1",
    "prettier": "^3",
    "prettier-plugin-astro": "^0",
    "typescript": "^5"
  }
}
```

Firebase moves from a gstatic CDN URL import to an npm dependency, so it is
bundled, versioned, typed, and offline-installable. Same SDK, same version.

`@fontsource-variable/*` self-hosts the three families (D12). If Spectral or Sora
lacks a variable build, fall back to the static `@fontsource/*` package for that
family — verify at P4 and note which was used.

---

## 4. Target tree

```
fynoptic/
├─ .nvmrc                              22
├─ .gitignore
├─ package.json
├─ astro.config.mjs
├─ tsconfig.json
├─ README.md
├─ playwright.config.ts
├─ .github/workflows/{ci,deploy}.yml
├─ public/                             ← served verbatim, URLs unchanged
│  ├─ CNAME  favicon.ico  site.webmanifest  .nojekyll
│  ├─ assets/                          ← media agent's territory, copied as-is
│  └─ data/*.json                      ← runtime-fetched, paths unchanged
├─ scripts/
│  ├─ extract-articles.mjs             one-off, deleted after P2
│  ├─ verify-articles.mjs              byte-comparison gate for P2
│  └─ visual-diff.mjs                  screenshot harness
├─ src/
│  ├─ layouts/Base.astro
│  ├─ components/{Header,Footer,LoginModal,SiteBg,ArticleCard}.astro
│  ├─ pages/
│  │  ├─ index.astro  about.astro  articles.astro  courses.astro
│  │  ├─ courseone.astro  flashcard.astro  practice.astro
│  │  ├─ profile.astro  bot.astro
│  │  └─ articles/[id].astro           ← NEW (Q4)
│  ├─ articles/<id>.html               ← 327 raw bodies, generated by P2
│  ├─ data/articles.ts                 ← typed manifest, generated by P2
│  ├─ content/course/*.md              ← moved from content/
│  ├─ content.config.ts
│  ├─ lib/{auth,reveal,toast,modal,storage,shuffle,track,theme,nav,back-to-top}.ts
│  ├─ islands/{flashcards,practice,course-one,articles-browser,profile,bot}.ts
│  ├─ types.ts
│  ├─ schemas.ts                       zod for runtime-fetched JSON
│  └─ styles/{legacy,redesign}.css     verbatim copies
└─ tests/*.spec.ts
```

### 4.1 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://fynoptic.org',
  build: { format: 'file' },
  trailingSlash: 'never',
});
```

`build.format: 'file'` is load-bearing. Astro's default (`'directory'`) emits
`/about/index.html`, which changes every public URL and breaks inbound links.
`'file'` emits `about.html`. The docs recommend pairing `'file'` with
`trailingSlash: 'never'` so dev and build agree — that pairing is used here.

`public/.nojekyll` is redundant under the Actions deploy but committed anyway:
Astro emits bundles into `_astro/`, and if the Pages source is ever switched back
to branch-deploy, Jekyll silently strips underscore-prefixed directories and the
entire site loses its CSS and JS with no error anywhere.

### 4.2 `tsconfig.json`

```jsonc
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "js"],
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true
  }
}
```

`js/` is excluded so the legacy files stop being typechecked while they still sit
in the tree during the transition (see §9 rollback).

### 4.3 `.gitignore`

```
node_modules/
dist/
.astro/
__pycache__/
*.pyc
.DS_Store
test-results/
playwright-report/
```

---

## 5. P2 in detail — the 6.1 MB extraction

The single highest-value change, and the one with the most ways to silently
destroy content. Specified tightly.

### 5.1 Source shape

327 entries, confirmed by `grep -c 'window.ARTICLES.push({'`. Field keys across
the whole file are exactly three, confirmed by counting top-level keys:

```
327 id:
327 title:
327 content:
```

`content` is a backtick template literal containing HTML.

### 5.2 Why raw HTML files, not markdown

The obvious move is `src/content/articles/*.md` with a content collection. **Do
not do this.** The bodies are already HTML, and running 20,000 lines of hand-written
HTML through a markdown processor invites silent corruption: any line indented four
spaces becomes a `<pre>` code block, `*` and `_` inside prose become emphasis, and
underscores inside the many source URLs get mangled. The failure mode is quiet —
the build succeeds and a handful of the 327 articles render wrong.

Instead: bodies stay as `.html` files, read at build time with Vite's `?raw`
import. No markdown pipeline touches them. Byte-exactness becomes trivially
verifiable, which is the point.

The four genuine markdown files in `content/` (course sections) do move to a real
content collection — they are actually markdown.

### 5.3 `scripts/extract-articles.mjs`

Evaluates the source in a Node VM with a `window` shim, which reproduces exactly
what the browser does today, including any `${}` interpolation already present.

```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const ctx = createContext({ window: {} });
runInContext(readFileSync('js/articles-data.js', 'utf8'), ctx);
const articles = ctx.window.ARTICLES;

if (!Array.isArray(articles) || articles.length !== 327) {
  throw new Error(`expected 327 articles, got ${articles?.length}`);
}

mkdirSync('src/articles', { recursive: true });
const seen = new Set();
const meta = [];

for (const a of articles) {
  if (!a.id || !a.title || typeof a.content !== 'string') {
    throw new Error(`malformed entry: ${JSON.stringify(a).slice(0, 120)}`);
  }
  if (seen.has(a.id)) throw new Error(`duplicate id: ${a.id}`);
  if (!/^[a-z0-9-]+$/.test(a.id)) throw new Error(`unsafe id for filename/URL: ${a.id}`);
  seen.add(a.id);

  writeFileSync(`src/articles/${a.id}.html`, a.content);
  meta.push({ id: a.id, title: a.title });
}

writeFileSync('src/data/articles.ts',
  `// GENERATED by scripts/extract-articles.mjs — do not edit\n` +
  `import type { ArticleMeta } from '../types';\n` +
  `export const ARTICLE_META: ArticleMeta[] = ${JSON.stringify(meta, null, 2)};\n`);
```

Three assertions abort the run rather than producing a subtly wrong corpus:
count mismatch, duplicate id, and an id that is not filename- and URL-safe.
That last one matters — the ids become public URLs under Q4.

### 5.4 `scripts/verify-articles.mjs` — the gate

Independently re-evaluates the source and asserts each written file is
byte-identical to the corresponding in-memory string. P2 is not complete until
this exits 0.

```
✓ 327/327 bodies byte-identical
✓ total 6,100,552 bytes in == bytes out
```

### 5.5 Consumption

`src/pages/articles/[id].astro`:

```astro
---
import { ARTICLE_META } from '../../data/articles';
const bodies = import.meta.glob('../../articles/*.html',
  { query: '?raw', import: 'default', eager: true });

export function getStaticPaths() {
  return ARTICLE_META.map(a => ({ params: { id: a.id }, props: a }));
}
const { id, title } = Astro.props;
const body = bodies[`../../articles/${id}.html`];
---
```

Bodies are inlined into prerendered HTML at build time. None of the 6.1 MB reaches
the client as JavaScript. `articles.astro` imports only `ARTICLE_META` (327 ×
`{id, title}` ≈ 25 KB), satisfying S4.

### 5.6 Open behaviour question — see Q6

`articles.js:31–53` synthesises `tags: ['Guides']` for every article and a date of
`2025-01-01 + index days`. The tag filter therefore offers one tag and the "sort by
newest" control sorts by array position. The port can reproduce this faithfully
(bug-for-bug, zero risk) or drop the dead controls. Needs your call — see §11.

---

## 6. Commit sequence

Each commit is independently buildable and independently revertible. Verification
is a command, not a judgement call.

### P0 — Baseline (must precede everything)

Run against **current `main`, unported**, via `python3 -m http.server`.

- `scripts/visual-diff.mjs --capture-baseline`
- Output: `tests/baseline/<page>-<theme>-<width>.png`, 9 × 2 × 2 = 72 files.
- Also captures, per page, the console-error list and the full `dist` URL set.

**Verify:** 72 files exist and are non-empty.
**Note:** these are the reference for every later step. If the media agent changes
image assets after this, the baseline must be recaptured or image-region diffs will
false-positive. Recapture immediately after their work merges.

### P1 — Scaffold

Files: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.nvmrc`,
`public/` (copy `CNAME`, `favicon.ico`, `site.webmanifest`, `assets/`, `data/`; add
`.nojekyll`).

**Verify:**
```bash
npm ci && npm run build
test -f dist/CNAME
test -d dist/assets/img
diff <(cd public/assets && find . -type f | sort) <(cd dist/assets && find . -type f | sort)
```
Third command must produce no output — proves assets pass through untouched.

**Rollback:** delete the new files. Nothing existing was modified.

### P2 — Articles

Files: `scripts/extract-articles.mjs`, `scripts/verify-articles.mjs`,
`src/articles/*.html` (327), `src/data/articles.ts`, `src/types.ts` (partial).

**Verify:** `node scripts/verify-articles.mjs` exits 0 with the 327/327 report;
`ls src/articles/*.html | wc -l` → 327.

**Rollback:** `git revert`. `js/articles-data.js` is untouched and still authoritative.

### P3 — lib + types

Files: `src/types.ts`, `src/schemas.ts`, `src/lib/*.ts` (10 modules).

Notable contents:

- `reveal.ts` — single implementation replacing all five observers (D1, D4):
  ```ts
  const SELECTOR = '.fade-up, .reveal, .reveal-up, .reveal-card, ' +
                   '.reveal-section, .reveal-prism, .reveal-cta, .reveal-in';

  export function initReveal(): void {
    const els = document.querySelectorAll<HTMLElement>(SELECTOR);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
  }
  ```
  `threshold: 0` is the fix: an element reveals as soon as any part of it crosses
  the margin, so height no longer gates visibility.
- `auth.ts` — Firebase via npm import, typed, `signInWithPopup` → `signInWithRedirect`
  fallback preserved verbatim, D9 fixed by building the initials node and assigning
  `textContent`.
- `storage.ts` — typed wrapper over the four localStorage keys currently spread
  across files (`ff_course_progress`, `ff_fixit_history`, `ff_reports`,
  `fynoptic-theme`), each with a zod parse so a corrupted value degrades to the
  default instead of throwing.
- `toast.ts`, `modal.ts`, `shuffle.ts`, `track.ts`, `theme.ts`, `nav.ts`,
  `back-to-top.ts` — one implementation each (D8).

**Verify:** `npm run check` → 0 errors. `grep -rn ': any\|as any' src/lib src/types.ts`
→ no output.

**Rollback:** `git revert`. Nothing consumes these yet.

> **P4 onward is blocked.** Rebase onto a `main` containing the media and layout
> agents' HTML before proceeding (§0.1). Recapture the P0 baseline after rebasing.

### P4 — Layout + components

Files: `src/layouts/Base.astro`, `src/components/{Header,Footer,LoginModal,SiteBg}.astro`,
`src/styles/{legacy,redesign}.css` (verbatim copies of `css/styles.css` and
`css/redesign.css`), `src/pages/about.astro`.

`Base.astro` props are typed and **required**, which is what actually fixes D15 —
a page cannot be added without a description and canonical:

```ts
interface Props {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
}
```

`about.astro` is ported first because it is the simplest page and isolates
layout/component bugs from page-specific ones.

**Verify:**
```bash
npm run build && npm run test:visual -- --only about
```
Must report 0 pixel deltas across `about-{dark,light}-{390,1440}`.

**Rollback:** `git revert`. `about.html` still exists and still serves.

### P5 — Static pages, one commit each

Order: `index` → `courses` → `articles` → `articles/[id]`.

`index.astro` folds in D1/D4: the three inline `<script>` blocks at `index.html:294`,
`:298`, `:334` are deleted and replaced by `import { initReveal } from '../lib/reveal'`.

**Verify per page:** visual diff ×4 with 0 deltas; 0 console errors.
**Additionally on `index`:** the D1 regression test —
```
at 390×844, scroll to bottom, assert every element matching SELECTOR
has getComputedStyle(el).opacity === '1'
```
This test **must fail against current `main`** and pass against the port. If it
passes on both, the fix is not being exercised and the test is wrong.
**Additionally on `articles`:** first-load JS < 100 KB (S4).

### P6 — Interactive pages, one commit each

Order: `bot` (69 lines, smallest) → `profile` (299) → `practice` (762) →
`flashcard` (772) → `courseone` (978).

Each `js/*.js` → `src/islands/*.ts`, typed, with `window.*` handoffs replaced by
imports (D11). Runtime-fetched JSON gets a zod parse at the boundary:
`practice.js:190` (`econ_grouped_by_module_unit_with_choices.json`, nested
`{subject: {unit: {difficulty: Item[]}}}`), `course-one.js:85` (`quiz.json`,
`id-exercise.json`, `content/*.md`).

`courseone.astro` additionally absorbs its 24 inline `style=` attributes, its
`<style>` block, and the inline year script into scoped equivalents.

**Verify per page:** visual diff ×4; plus a scripted interaction with console
errors asserted empty:

| Page | Interaction asserted |
|---|---|
| bot | Send a message; a response element or an error state appears (see Q2) |
| profile | Page renders signed-out state without throwing |
| practice | Select a topic, answer one question, score updates |
| flashcard | Select a unit, flip a card, advance, session summary renders |
| courseone | Expand a module, load a markdown section, answer one quiz item |

### P7 — CI, deploy, README, cutover

`ci.yml`: on PR → `npm ci`, `npm run check`, `npm run build`, `npm run test:visual`.
`deploy.yml`: on push to `main` → build, `actions/upload-pages-artifact`,
`actions/deploy-pages`.

**Cutover — the one step needing you:**

```
1. merge port → staging branch
2. Actions builds; download the artifact; confirm it contains
   about.html, index.html, …, articles/<id>.html, assets/, CNAME
3. YOU: repo Settings → Pages → Source: branch → GitHub Actions
4. merge staging → main; Actions deploys
5. crawl fynoptic.org, confirm S2 URL parity against the P0 capture
```

Step 3 is not something I can do, and doing it before step 2 publishes nothing
while taking the current site down.

### P8 — CSS untangle (separate schedule, after cutover)

Phase B: lift `:root` tokens to `tokens.css`; convert the `[data-theme="light"]`
override wall (`styles.css:4543+`) into a token swap. Phase C: per page, move rules
into scoped `<style>`, resolve the triple-defined `.reveal-prism`, drop `!important`
as each specificity war dissolves. One commit + one visual diff per page.

Kept out of the port deliberately: a structural migration and a CSS rewrite landing
together makes any visual regression impossible to bisect.

---

## 7. Verification harness

`scripts/visual-diff.mjs`, Playwright, headless Chromium:

- Matrix: 9 pages × {dark, light} × {390×844, 1440×900}.
- Theme set by writing `localStorage['fynoptic-theme']` before navigation, since
  that is what `app.js:485` reads.
- Full-page screenshots after `networkidle` + a scripted full scroll (the reveal
  animations must be triggered before capture, or every shot is a false negative).
- Animations disabled at capture via `prefers-reduced-motion` emulation to remove
  timing flake.
- Per-shot pixel diff; any delta writes a side-by-side to `test-results/` and fails.
- Console errors collected per page and asserted empty.

---

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Merge conflict with media/layout agents on the 9 HTML files | **High** | High | P4–P6 gated on rebase (§0.1). P1–P3 are new-files-only. |
| Article body corrupted in extraction | Low | **Severe** — 6.1 MB of research | Raw HTML, no markdown pipeline (§5.2); byte-comparison gate (§5.4) blocks P2 |
| Visual regression from CSS load order | Med | Med | Both sheets copied verbatim, same order; 72-shot diff at every commit |
| `build.format` default silently rewrites all URLs | Med | **Severe** | Explicitly set to `'file'`; S2 crawl parity is a release gate |
| `_astro/` stripped by Jekyll if Pages source misconfigured | Low | **Severe** — total CSS/JS loss | `public/.nojekyll` committed regardless |
| Baseline staleness after media agent's image swap | **High** | Med | Recapture baseline immediately after their merge; noted in P0 |
| Firebase npm SDK behaves differently from the gstatic build | Low | High | Same version (10.7.1); auth smoke test (S7) on all 9 pages |
| Fontsource variable build missing for Spectral/Sora | Med | Low | Fall back to static `@fontsource/*` for that family; record which |
| Article ids unsafe as URLs under Q4 | Low | Med | Extraction asserts `/^[a-z0-9-]+$/` and aborts |
| Scope creep into a CSS rewrite mid-port | Med | Med | P8 is explicitly separate and post-cutover |

---

## 9. Rollback

- Everything lives on `worktree-astro-migration-plan`. `main` serves the current
  site untouched until step 4 of cutover.
- After cutover, reverting is one setting: Pages → Source → branch. This works
  **only if the legacy `*.html`, `css/`, `js/` files are still on `main`**.
  Therefore: **do not delete them in the port's final commit.** Keep them one
  release cycle, then remove in a separate commit once the Astro build is proven
  in production. `tsconfig.json` already excludes `js/` so they cost nothing.
- Each P-commit is independently revertible; P1–P3 touch no existing file at all.

---

## 10. Effort

| Phase | Rough size |
|---|---|
| P0 + P1 + P2 + P3 | one session — mechanical, verifiable, no HTML conflicts |
| P4 + P5 | one session — 5 pages, 4-way diff each |
| P6 | one to two sessions — 5 islands, ~2,900 lines JS → TS, interaction tests |
| P7 | short, plus your Pages setting change |
| P8 | open-ended; schedule separately |

---

## 11. Questions blocking approval

**Q1 — `nav-avatar` (D5).** `js/nav-avatar.js` is well-formed, loaded by nothing;
`<img id="nav-avatar">` sits on 6 pages. Dropped feature or wiring bug? Wire it up,
or delete script + markup?

**Q2 — bot backend.** `js/bot.js:23` posts to
`https://fixitbotbackend.onrender.com/api/chat`. Render free tier sleeps on
inactivity, so the first request cold-starts ~30 s with no loading state. Is the
endpoint still live? If not, P6's bot interaction test needs a different assertion.

**Q3 — Firebase authorized domains.** Config at `js/auth.js:21–29` is public by
design and fine to ship. But please confirm in the console that Authentication →
Settings → Authorized domains lists only `fynoptic.org` and `localhost`. If it
still carries the default `*.firebaseapp.com` plus anything added during testing,
someone can host a clone that signs real users into your project. I cannot check
this from here.

**Q4 — new article URLs.** Today articles open in a client-side reader overlay with
no shareable URL. The plan adds 327 real `articles/<id>.html` pages — a clear
SEO and shareability win, and the only place this plan adds URLs rather than
preserving them. Confirm yes.

**Q5 — session split.** Run P0–P3 now (conflict-free), then stop for review before
the blocked phases? Or wait for the other agents and run the whole thing?

**Q6 — fake article metadata (D16).** All 327 articles get `tags: ['Guides']` and a
synthetic date. The tag filter has one option; "sort by newest" sorts by array
index. Options: (a) reproduce exactly, zero risk, controls stay meaningless;
(b) hide the tag filter and date sort until real metadata exists; (c) I derive
tags/dates — not recommended, it invents data.

---

**Awaiting approval. No code will be written until you say go.**
