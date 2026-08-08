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
public/       served verbatim at the same URL — assets, data, favicon
src/pages/    one file per route; build.format:'file' keeps /about.html etc.
src/layouts/  Base.astro — head, fonts, icons, theme
src/components/  Header, Footer, SiteBg (auth modals are injected by lib/auth-ui)
src/lib/      shared typed helpers (auth, reveal, modal, storage, ...)
src/islands/  page-specific interactive TypeScript
src/articles/ 244 article bodies; the js/articles-data.js they came from is
              deleted, so these are the source of truth now
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
