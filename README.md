# Fynoptic

Static site, built with [Astro](https://astro.build) + TypeScript, deployed to
Vercel at [fynoptic.org](https://fynoptic.org).

## Migration status

The Astro port is live. `fynoptic.org` serves `dist/` from Vercel; the apex A
record at GoDaddy points to `76.76.21.21`. See `IMPLEMENTATION.md` for the
original plan, defect register, and phase-by-phase build order.

The legacy `*.html`, `css/`, `js/` files at the repo root are no longer served.
They stay as the rollback path until the Astro build has run in production for
one release cycle (`IMPLEMENTATION.md` §9), then get removed in their own
commit. `tsconfig.json` already excludes `js/`, so they cost nothing.

GitHub Pages is gone: no `deploy.yml`, no `CNAME`. Pages' custom-domain
mechanism was that file; Vercel reads the domain from the project instead.
`ci.yml` still runs `npm run check` and `npm run build` on every push and PR.

**`vercel.json` is load-bearing.** Every internal link on the site is
extensionless (`/courses`, not `/courses.html`) while `build.format: 'file'`
emits `courses.html`, so `cleanUrls` is what connects the two. Without it every
route except `/` returns 404. It also settles the one genuinely ambiguous path,
**`/articles`** — the build emits both `articles.html` (the index) and
`articles/` (the 244 detail pages), and which one wins is the host's choice, not
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
public/       served verbatim at the same URL — assets, data, favicon, CNAME
src/pages/    one file per route; build.format:'file' keeps /about.html etc.
src/layouts/  Base.astro — head, fonts, icons, theme
src/components/  Header, Footer, SiteBg (auth modals are injected by lib/auth-ui)
src/lib/      shared typed helpers (auth, reveal, modal, storage, ...)
src/islands/  page-specific interactive TypeScript
src/articles/ 244 article bodies, extracted from js/articles-data.js
src/data/     typed manifests (e.g. article metadata)
src/types.ts  src/schemas.ts   shared types + zod validation for runtime JSON
```

## Deploy

Vercel builds and deploys on every push to `main` — project `fynoptic` under
the `fynoptic` team. It auto-detects Astro, runs `npm run build` (which syncs
`public/` first, then runs `astro check && astro build`) and serves `dist/`.
Routing config is `vercel.json`; see the note under Migration status before
changing it.

`IMPLEMENTATION.md` §6 describes a GitHub Pages cutover that was never taken —
the site moved to Vercel instead. Read it as history, not as instructions.

## Testing

`npm run test:visual` runs the Playwright screenshot-diff harness
(`scripts/visual-diff.mjs`) against the baseline in `tests/baseline/`.
