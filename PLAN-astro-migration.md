# Fynoptic — Astro + TypeScript migration plan

Status: **plan only, nothing implemented.**
Branch: `worktree-astro-migration-plan` (worktree at `.claude/worktrees/astro-migration-plan`).
Written 2026-08-07.

---

## 0. Coordination constraints (read first)

Four Claude sessions are active on this repo simultaneously. One of them owns
media optimisation and is, as of writing, mid-flight: `git status` on `main`
shows 13 deleted PNGs, 8 untracked `.webp` files, and modified `about.html`,
`index.html`, `assets/img/fynopticlogo.png`.

Consequences for this plan:

- **This plan does not touch `assets/**`, does not rewrite any `<img>`/`<source>`
  tag, and does not wire the `.webp` files.** That work belongs to the media agent.
- The Astro `public/` directory is laid out so that **every asset URL stays
  byte-identical** (`/assets/img/foo.webp`, `/assets/video/bar.mp4`). Whatever the
  media agent lands — webp swap, CDN URLs, `<picture>` elements — drops in
  unchanged, because the port copies markup rather than rewriting paths.
- **Blocking dependency:** the port rewrites all 9 HTML files into `.astro`
  components. If the media agent is still editing those HTML files, their diff is
  lost. The port must start from a `main` that already contains the media agent's
  HTML changes. See §7 for the ordering.

---

## 1. Goal and non-goals

**Goal.** Replace 9 hand-maintained HTML files + 12 loose JS files with an Astro
project in TypeScript, static-exported to the same URLs, fixing the content-blocking
bugs and the 6.1 MB article payload along the way.

**Non-goals.**

- No visual redesign. The migration ships pixel-identical to today. The Optical
  Bench layer (`css/redesign.css`) is preserved as-is.
- No change to any public URL. `fynoptic.org/about.html` stays `about.html`.
- No media/asset work (§0).
- No git history rewrite. `.git` stays 97 MB; that was decided against.
- No React/Vue/Svelte. Islands are vanilla TypeScript modules that Astro bundles.
  Adding a UI framework would be weight this site does not need.

**Success criteria.**

1. `npm run build` succeeds with `astro check` reporting 0 TypeScript errors.
2. A crawl of `dist/` yields the same URL set as the current site, no additions,
   no removals.
3. Playwright screenshot diff, per page × {dark, light} × {390px, 1440px}, shows
   no unintended visual change against a pre-migration baseline.
4. `articles.html` first-load JS transfer drops from ~6.1 MB to under 100 KB.
5. Every section on `index.html` is visible at 390×844 (currently some are not).

---

## 2. Confirmed defects this migration fixes

These are the audited findings the port resolves as a side effect of its structure.
Each gets a verification step in §6.

| # | Defect | Evidence | Fix |
|---|---|---|---|
| D1 | Sections permanently invisible. `.reveal-section{opacity:0}` is lifted only by `.in-view`, granted by an IntersectionObserver with `threshold: 0.6`. A section taller than the viewport can never be 60% visible, so it never reveals. | `css/styles.css:6234`, `index.html:294–345` | One shared `src/lib/reveal.ts` using `threshold: 0` + `rootMargin: '0px 0px -10% 0px'`, plus an unconditional reveal-all fallback when `IntersectionObserver` is absent or `prefers-reduced-motion: reduce`. |
| D2 | `articles.html` has no `#user-btn` and no `#login-modal`; the other 8 pages have both. Sign-in silently unavailable on that page. | `grep 'user-btn' articles.html` → no match | `Header.astro` / `LoginModal.astro` used by every page. Structurally impossible to omit one. |
| D3 | 6.1 MB `js/articles-data.js` ships every article body to render a card list. | `ls -la js/articles-data.js` | Astro content collection; bodies prerendered into per-article HTML, list page ships titles only. |
| D4 | Three near-identical inline IntersectionObserver blocks on `index.html`, plus a fourth pattern in `app.js`. | `index.html:294`, `:298`, `:334` | Collapsed into `reveal.ts` (same fix as D1). |
| D5 | `js/nav-avatar.js` (39 lines) is loaded by zero pages, but `<img id="nav-avatar">` markup exists on 6 pages. Dead script, dead markup. | `grep -rn 'nav-avatar' *.html` shows only `<img>`, never `<script>` | See open question Q1 — either wire it or delete both. |
| D6 | `js/courses.js` is 0 bytes and referenced by nothing. | `wc -l js/courses.js` → 0 | Not carried over. |
| D7 | `ARTICLES` and `COURSE_MODULES` in `app.js:9–25` are hardcoded stale duplicates of the real article/course data. | `js/app.js:9–25` vs `js/articles-data.js` | Deleted; both consumers read the typed collection. |
| D8 | `toast` defined 3×, `shuffle` 2×, `initialsFrom` 2×, `getCookie` 2× across files. | `grep -hoE '^\s*function [a-zA-Z0-9_]+' js/*.js \| sort \| uniq -c` | One implementation each in `src/lib/`. |
| D9 | `user.displayName` (attacker-influenceable via Google profile) interpolated into `innerHTML`. Low severity — it lands in a `title` attribute and initials — but there is no reason for it to be innerHTML. | `js/auth.js:96` | Build the node, assign `textContent`. |
| D10 | Header (~45 lines), footer, login modal, and the font/icon/meta block are copy-pasted across 9 files. `index.html:15` literally comments *"Keep identical on every page."* That discipline has already failed — see D2. | all 9 `*.html` | Components. |
| D11 | Mixed module systems: `auth.js`, `flashcard.js`, `profile.js` are `type="module"`; `app.js`, `practice.js`, `articles.js`, `course-one.js` are classic scripts sharing global scope, communicating via `window.authUI`, `window.ARTICLES`, `window.ffTrack`. | `grep '<script' *.html` | All ESM. `window.*` handoffs become imports. |
| D12 | Three render-blocking Google Fonts families requested from a third-party CDN on all 9 pages, plus 2 preconnects. | `index.html:16–18` | `@fontsource-variable/*`, self-hosted, `font-display: swap`, subset to latin. Removes a cross-origin dependency and a round trip. |
| D13 | No `.gitignore`. `__pycache__/*.pyc` and `.claude/` are loose in the tree. | `ls -a` | Add one. |
| D14 | No `package.json`, build, typecheck, lint, format, CI, or README. | — | §5. |

**Deferred, not fixed by this plan** (recorded so they are not lost):
CSS has 245 `!important` declarations and `.reveal-prism` is defined three separate
times with conflicting transforms (`styles.css:5922`, `:6031`, `:6166`). Untangling
that is §4 Phase C, explicitly after the port lands.

---

## 3. Target structure

```
fynoptic/
├─ astro.config.mjs
├─ tsconfig.json                    # extends astro/tsconfigs/strict
├─ package.json
├─ .gitignore
├─ README.md
├─ .github/workflows/
│   ├─ ci.yml                       # build + astro check on PR
│   └─ deploy.yml                   # build + deploy to Pages
├─ public/                          # served verbatim at the same URLs
│   ├─ CNAME
│   ├─ favicon.ico
│   ├─ site.webmanifest
│   ├─ .nojekyll
│   ├─ assets/                      # ← media agent's territory, untouched
│   └─ data/                        # runtime-fetched JSON, paths unchanged
├─ src/
│   ├─ layouts/
│   │   └─ Base.astro               # <head>, fonts, icons, theme attr, SiteBg, Header, Footer, LoginModal
│   ├─ components/
│   │   ├─ Header.astro
│   │   ├─ Footer.astro
│   │   ├─ LoginModal.astro
│   │   ├─ SiteBg.astro
│   │   └─ ArticleCard.astro
│   ├─ pages/                       # one per current HTML file, same names
│   │   ├─ index.astro
│   │   ├─ about.astro
│   │   ├─ articles.astro
│   │   ├─ articles/[slug].astro    # NEW: real per-article pages
│   │   ├─ courses.astro
│   │   ├─ courseone.astro
│   │   ├─ flashcard.astro
│   │   ├─ practice.astro
│   │   ├─ profile.astro
│   │   └─ bot.astro
│   ├─ content/
│   │   ├─ config.ts                # zod schemas for collections
│   │   ├─ articles/*.md            # ← generated from articles-data.js
│   │   └─ course/*.md              # ← moved from content/
│   ├─ lib/                         # shared, typed, one implementation each
│   │   ├─ auth.ts                  # Firebase, typed
│   │   ├─ reveal.ts                # D1, D4
│   │   ├─ toast.ts                 # D8
│   │   ├─ modal.ts
│   │   ├─ storage.ts               # typed localStorage wrapper
│   │   ├─ shuffle.ts
│   │   └─ track.ts
│   ├─ islands/                     # page-scoped behaviour, TS
│   │   ├─ flashcards.ts
│   │   ├─ practice.ts
│   │   ├─ course-one.ts
│   │   ├─ articles-browser.ts
│   │   ├─ profile.ts
│   │   └─ bot.ts
│   ├─ types.ts                     # Flashcard, QuizItem, Article, CourseModule…
│   └─ styles/
│       ├─ legacy.css               # styles.css verbatim, Phase A
│       └─ redesign.css             # verbatim, Phase A
└─ scripts/
    └─ extract-articles.mjs         # one-off, deleted after use
```

### Critical Astro configuration

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://fynoptic.org',
  build: { format: 'file' },   // ← emits about.html, NOT about/index.html
  trailingSlash: 'never',
});
```

`build.format: 'file'` is the load-bearing setting. Astro's default emits
`/about/index.html`, which would change every public URL on the site and break
inbound links. `'file'` preserves `about.html` exactly.

`public/.nojekyll` is required if Pages ever deploys from a branch: Astro emits
its bundles into `_astro/`, and Jekyll strips underscore-prefixed directories.
With the Actions deploy in §5 it is redundant, but it costs nothing and prevents
a silent, total CSS/JS failure if the Pages source is ever switched back.

---

## 4. Build order

Every step ends in a verifiable state. Steps 1–3 are independent of the media
agent; step 4 onward is not (§0).

### Step 1 — Scaffold, no page ported yet

Create `package.json`, `astro.config.mjs`, `tsconfig.json` (strict), `.gitignore`,
`public/` with `CNAME`/`favicon.ico`/`site.webmanifest`/`.nojekyll`, and symlink-free
copies of `assets/` and `data/` into `public/`.

*Verify:* `npm run build` produces an empty-but-valid `dist/` containing `CNAME`
and `assets/`. No page output yet.

### Step 2 — Extract articles from the 6.1 MB blob

`scripts/extract-articles.mjs` runs `js/articles-data.js` in a Node VM with a
`window` shim, reads the accumulated `window.ARTICLES`, and writes one
`src/content/articles/<id>.md` per entry with typed frontmatter
(`id, title, tags, blurb, date?`) and the existing HTML body preserved verbatim
inside the markdown.

The bodies are already HTML, so they pass through markdown untouched. No content
is rewritten, reflowed, or "cleaned" — the risk of silently mangling 20,000 lines
of researched copy is not worth it.

*Verify:* file count equals `window.ARTICLES.length`; a byte-comparison script
confirms every extracted body is identical to its source string; total extracted
bytes ≈ 6.1 MB.

### Step 3 — `src/lib/` and `src/types.ts`

Port the 12 JS files' shared helpers into typed modules. Deduplicate D8. Write
`types.ts` covering `Flashcard`, `FlashcardUnit`, `QuizItem`, `PracticeItem`,
`Article`, `CourseModule`. Add zod schemas for the runtime-fetched
`data/*.json` so `practice.ts` and `course-one.ts` validate rather than assume
(`practice.js:190` and `course-one.js:85` currently trust the payload shape).

*Verify:* `astro check` clean. `src/lib/` has zero `any`.

### Step 4 — Layout and components *(needs media agent's HTML landed)*

`Base.astro` + `Header` + `Footer` + `LoginModal` + `SiteBg`, extracted from the
current markup verbatim. `legacy.css` and `redesign.css` imported globally, in
that order, unmodified.

*Verify:* render `about.astro` (the simplest page) through the new layout.
Screenshot diff against the live `about.html` at 4 viewport/theme combinations.
Expect zero pixel difference.

### Step 5 — Port static pages

`about`, `index`, `courses`, `articles` (list), `articles/[slug]` (new).
`index.astro` picks up the D1/D4 reveal fix.

*Verify per page:* screenshot diff × 4. `index.astro` additionally verified at
390×844 with every section confirmed visible — this is the D1 regression test and
it should **fail against the current site and pass against the port**.
`articles.astro` verified for first-load JS transfer size under 100 KB.

### Step 6 — Port interactive pages

`flashcard`, `practice`, `courseone`, `profile`, `bot`. Each `js/*.js` becomes an
island under `src/islands/`, typed, with its `window.*` handoffs replaced by
imports (D11).

`courseone.astro` carries 24 inline `style=` attributes and a `<style>` block;
these move into a scoped `<style>` in the `.astro` file.

*Verify per page:* screenshot diff × 4, plus a scripted interaction pass —
flip a card, answer a practice question, advance a course module, open the bot,
load the profile — with console errors asserted empty.

### Step 7 — CSS Phases B and C *(after the port is merged, one page at a time)*

- **Phase B:** lift `:root` tokens into `src/styles/tokens.css`. Convert the
  ~100-line `[data-theme="light"] .selector` override wall (`styles.css:4543+`)
  into a token swap. Expected to delete a large share of the 245 `!important`.
- **Phase C:** per page, move that page's rules out of `legacy.css` into the
  `.astro` file's scoped `<style>`, resolving the triple-defined `.reveal-prism`
  and dropping `!important` as each specificity war disappears.

Each page's Phase C move is its own commit with its own screenshot diff. This is
deliberately not part of the port — mixing a structural migration with a CSS
rewrite makes any visual regression impossible to bisect.

---

## 5. Tooling and deploy

**`package.json` scripts:** `dev`, `build`, `preview`, `check` (`astro check`),
`lint` (eslint + eslint-plugin-astro), `format` (prettier + prettier-plugin-astro).

**`.gitignore`:** `node_modules/`, `dist/`, `.astro/`, `__pycache__/`, `*.pyc`,
`.DS_Store`.

**CI** (`ci.yml`): on PR — `npm ci && npm run check && npm run build`.

**Deploy** (`deploy.yml`): on push to `main` — build, upload `dist/`,
`actions/deploy-pages`.

> **Infra change requiring your action:** GitHub Pages is currently set to deploy
> from a branch. It must be switched to **Source: GitHub Actions** in repo
> Settings → Pages. Until that switch, the Actions deploy will build successfully
> and publish nothing. This is the one step I cannot do from here, and doing it
> too early takes the live site down. Sequence: merge the port to a staging
> branch → confirm the Actions build artifact is correct → flip the setting →
> merge to `main`.

---

## 6. Verification

Baseline first: before any porting, capture Playwright screenshots of all 9 live
pages × {dark, light} × {390×844, 1440×900} = 72 images, committed to the branch
as the reference set. Every step in §4 diffs against it.

Additional gates:

- `astro check` — 0 errors, enforced in CI.
- URL parity: crawl `dist/` and diff the path set against a crawl of the current
  site. Any addition other than `articles/<slug>.html` is a bug.
- Payload: `articles.html` first-load JS < 100 KB (from ~6.1 MB).
- D1 regression: at 390×844, assert `getComputedStyle(el).opacity === '1'` for
  every `.reveal-section`, `.reveal-card`, `.reveal-cta` after a full scroll.
- Console: zero errors on every page, asserted.
- Auth smoke test: sign-in modal opens on all 9 pages (D2 regression).

---

## 7. Ordering against the other sessions

```
media agent finishes assets/ + HTML img rewrites
        │
        ▼
merge agent lands that on main
        │
        ▼
this branch rebases on main          ← port must start here, not before
        │
        ▼
Steps 4–6 (port reads the CURRENT HTML)
        │
        ▼
staging branch → verify Actions artifact → flip Pages source → main
```

Steps 1–3 touch only new files (`package.json`, `src/lib/`, `src/content/`,
`scripts/`) and can proceed now in parallel with the media agent with no conflict
risk. Steps 4–6 rewrite the 9 HTML files and must not run concurrently with anyone
else editing them.

---

## 8. Rollback

The port lives entirely on `worktree-astro-migration-plan`. `main` keeps serving
the current static site until the Pages source is flipped, and flipping it back to
branch-deploy restores the old site in one setting change — the original HTML files
are still in git history and, until the port's final commit deletes them, still on
`main`. Recommend keeping the legacy `*.html` files in the tree for one release
cycle after cutover rather than deleting them in the same commit.

---

## 9. Open questions

- **Q1 — `nav-avatar` (D5):** `js/nav-avatar.js` exists, is well-formed, and is
  loaded by nothing, while `<img id="nav-avatar">` sits on 6 pages. Was this a
  feature you dropped, or a wiring bug? Wire it up, or delete script + markup?
- **Q2 — `bot.js` backend:** `js/bot.js:23` posts to
  `https://fixitbotbackend.onrender.com/api/chat`. Free-tier Render sleeps after
  inactivity, so first request cold-starts for ~30s with no loading state in the
  UI. Out of scope for the port, but worth a spinner at minimum. Confirm this
  endpoint is still live before I port the island around it.
- **Q3 — Firebase authorized domains:** the config in `js/auth.js:21–29` is public
  by design and fine to ship. But please confirm in the Firebase console that
  Authentication → Settings → Authorized domains is restricted to `fynoptic.org`
  (+ `localhost`). If it still allows the default `*.firebaseapp.com` and any
  domain added during testing, someone can host a clone that signs users into your
  project. I cannot check this from here.
- **Q4 — article URLs:** `articles/[slug].html` is a new URL space; today articles
  render in a client-side reader overlay with no shareable URL. Adding real pages
  is a clear SEO/shareability win, but confirm you want it — it is the one place
  this plan adds URLs rather than preserving them.
- **Q5 — effort:** Steps 1–3 are roughly a session. Steps 4–6 are the bulk —
  9 pages × (port + 4-way screenshot diff + interaction test). Step 7 is open-ended
  and should be scheduled separately. Want the port split across multiple sessions
  with review gates, or run straight through?
```
