# Fynoptic

Static site, built with [Astro](https://astro.build) + TypeScript, deployed to
GitHub Pages at [fynoptic.org](https://fynoptic.org).

## Migration status

This repo is mid-migration from plain HTML/CSS/JS to Astro. See
`IMPLEMENTATION.md` for the full plan, defect register, and phase-by-phase
build order. The legacy `*.html`, `css/`, `js/` files at the repo root remain
live and unported until cutover — do not delete them until the Astro build has
run in production for one release cycle (see `IMPLEMENTATION.md` §9).

**Before cutover, two things must happen.** Switch the Pages source to GitHub
Actions (`.github/workflows/deploy.yml` is already in place but does nothing
while Pages is set to deploy from a branch), and build
`src/islands/articles-browser.ts` — without it `/articles` renders an empty
grid. That island is blocked on question Q6 in `IMPLEMENTATION.md` §11.

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
public/       served verbatim at the same URL — assets, data, favicon, CNAME
src/pages/    one file per route; build.format:'file' keeps /about.html etc.
src/layouts/  Base.astro — head, fonts, icons, theme
src/components/  Header, Footer, LoginModal, SiteBg
src/lib/      shared typed helpers (auth, reveal, modal, storage, ...)
src/islands/  page-specific interactive TypeScript
src/articles/ 244 article bodies, extracted from js/articles-data.js
src/data/     typed manifests (e.g. article metadata)
src/types.ts  src/schemas.ts   shared types + zod validation for runtime JSON
```

## Deploy

`GitHub Actions` builds and deploys `dist/` on every push to `main`
(`.github/workflows/deploy.yml`). **This requires the repo's Pages source to be
set to "GitHub Actions"** (Settings → Pages) — it is not yet switched over from
branch-deploy. See `IMPLEMENTATION.md` §6 for the cutover sequence; flipping
this setting before the Actions build is verified will take the live site down.

## Testing

`npm run test:visual` runs the Playwright screenshot-diff harness
(`scripts/visual-diff.mjs`) against the baseline in `tests/baseline/`.
