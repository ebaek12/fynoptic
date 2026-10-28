# Fynoptic

Static site, built with [Astro](https://astro.build) + TypeScript, deployed to
Vercel at [fynoptic.org](https://fynoptic.org).

## Migration status

The Astro port is live. `fynoptic.org` serves `dist/` from Vercel; the apex A
record at GoDaddy points to `76.76.21.21`. See `IMPLEMENTATION.md` for the
original plan, defect register, and phase-by-phase build order.

The legacy `*.html`, `css/` and `js/` files at the repo root are gone. They were
removed once the Astro build was serving production; the rollback path is the
git history and the `pre-merge-backup-20260807` tag, not a second copy in the
working tree. Deleting them changed `dist/` by nothing — the output was
byte-identical before and after.

Their 78 MB is still in history, so the repo is ~81 MB packed until
`scripts/purge-media-history.sh` runs.

GitHub Pages is gone: no `deploy.yml`, no `CNAME`. Pages' custom-domain
mechanism was that file; Vercel reads the domain from the project instead.
`ci.yml` still runs `npm run check` and `npm run build` on every push and PR.

`www.fynoptic.org` is attached to the Vercel project and redirects to the apex
via the `redirects` rule in `vercel.json`.

**`vercel.json` is load-bearing.** Every internal link on the site is
extensionless (`/courses`, not `/courses.html`) while `build.format: 'file'`
emits `courses.html`, so `cleanUrls` is what connects the two. Without it every
route except `/` returns 404. It also settles the one genuinely ambiguous path,
**`/articles`** — the build emits both `articles.html` (the index) and
`articles/` (the 1,444 detail pages), and which one wins is the host's choice, not
ours. Vercel serves the index, which is correct. Re-check it after any change to
routing config or `build.format`.

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm run check     # astro check — typecheck
npm run build     # check + static build to dist/
npm run preview   # serve dist/ locally
```

Node ≥ 22 required (see `.nvmrc`).

## Structure

```
public/       served verbatim at the same URL — assets, data, favicon
src/pages/    one file per route; build.format:'file' keeps /about.html etc.
src/layouts/  Base.astro — head, fonts, icons, theme
src/components/  Header, Footer, SiteBg (auth modals are injected by lib/auth-ui)
src/lib/      shared typed helpers (auth, reveal, modal, storage, ...)
src/islands/  page-specific interactive TypeScript
src/articles/ 1,444 article bodies; the source of truth for the article library
src/data/     typed manifests (e.g. article metadata)
src/types.ts  src/schemas.ts   shared types + zod validation for runtime JSON
```

Article bodies and `src/data/articles.ts` are the catalog's source of truth.
The 200-guide expansion is recorded in `src/data/article-expansion.json`, with
source URLs and publication or review dates. These guides combine original
introductions with attributed U.S. government educational text; their source
notes identify the material and link to the original guidance. They are stored
locally and do not fetch article text at runtime. Catalog integrity tests check
route/file alignment, unique additions, length, attribution, and safe HTML;
browser tests cover all new routes, search, pagination, and read tracking.

The following 1,000-guide expansion is recorded in
`src/data/article-expansion-1000.json`. It covers detailed tax questions,
consumer protections, Social Security, workplace pay and benefits, investing,
and Medicare costs and coverage. These are attributed adaptations of public
domain federal guidance, with source editions retained for dated rules and
examples. Whole guides and coherent sections were selected for distinct topics;
overlapping material and excerpts dependent on missing charts were excluded.
Each entry records its source URLs, word count, and reviewed HTML checksum.
The articles remain within the existing library's approximately 900–4,500-word
range. Catalog pagination avoids moving every card when loading another page,
and source notes are excluded from search-preview blurbs.

The study library contains 7,286 practice questions and 6,611 flashcards. The first
1,000-question expansion lives in `data/practice-personal-finance-expansion.json`
and `data/practice-economics-expansion.json`; the loader combines these with the
original banks without replacing topics. New practice questions include answer
explanations. The 1,000 new flashcards are in `src/data/flashcard-expansion.json`,
appended to the original units so existing saved progress keeps its identifiers.
Source references are recorded in `src/data/study-expansion-sources.json`.
Content tests check counts, uniqueness, answer validity, and session coverage.
The course catalog has one available course and twelve clearly marked placeholders.

The next expansion adds 5,000 worked calculation drills and 5,000 matching
question-and-answer flashcards: 250 exercise families with 20 distinct input
cases each. Their hypothetical assumptions and worked calculations appear in
the prompts and explanations. Recipes and references live in
`scripts/study-drills/`; `src/data/study-drill-manifest.json` records the families.
Run `npm run generate:study-drills` after editing recipes, and
`npm run check:study-drills` to verify the committed output is current.
Practice banks are stored in `data/practice-drills-*.json`. Calculation
flashcards are split into 30 files under `data/flashcard-drills/` and fetched
only for selected topics; the initial screen uses a small count/path catalog.
Stable card IDs preserve separate progress when numeric answers repeat, and
typed answers accept equivalent numeric formatting while checking units.

## Deploy

Vercel builds and deploys on every push to `main` — project `fynoptic` under
the `fynoptic` team. It runs `npm run build` (which syncs `public/` first, then
runs `astro check && astro build`) and serves `dist/`.

Do not rely on Vercel's framework auto-detection. The project was created with
preset `Other` and output directory `public`, which is wrong for Astro, so
`framework`, `buildCommand`, `outputDirectory` and `installCommand` are pinned
in `vercel.json`. Those override the dashboard settings, which means the repo
describes its own build and a fresh project link cannot silently mis-deploy.

The Git integration is also load-bearing and easy to lose: transferring the
repo between GitHub owners **silently disconnects it**, and pushes then land on
`main` with no deploy and no error anywhere. That happened during the
`ebaek12` → `arhanbarve` transfer. If a change is on `main` but not live, check
`vercel ls` first — a production deployment older than the commit means the
hook is gone. Reconnect with `vercel git connect <repo-url>`.

`IMPLEMENTATION.md` §6 describes a GitHub Pages cutover that was never taken —
the site moved to Vercel instead. Read it as history, not as instructions.

## Testing

`npm run test:visual` runs the Playwright screenshot-diff harness
(`scripts/visual-diff.mjs`) against the baseline in `tests/baseline/`. Start
`npm run preview` first — the harness screenshots a running server, and only
`--capture-baseline` is implemented so far; the diff half is still a stub.
