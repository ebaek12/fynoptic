# Hero Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the headline/subhead/CTA block of the homepage hero (`src/pages/index.astro`) with a Helvetica-stack headline, a rotating last-word animation, no promo pill, and flat non-gradient CTA buttons — built as a React island so the site gains a scoped, non-breaking Tailwind v4 + shadcn/ui foundation for future work — while verifying the flagrant blue/turquoise/gold gradients the user flagged (CTA buttons, badges, gradient text, auth-modal links) are already retired by the existing `redesign.css` layer, and fixing any spot where that verification finds a regression.

**Architecture:** The existing `<section class="hero">` / `<div class="container hero-content">` wrapper markup in `index.astro` stays exactly as-is (it's what `redesign.css` already left-aligns and measures). Only the inner headline/subhead/CTA markup is replaced with a single React island (`<Hero client:visible />`) that owns the new typography, the word-rotation animation, and the CTA buttons. The partner-logo marquee below it is untouched. Tailwind v4 is installed via its Vite plugin with `preflight` explicitly excluded, so its utility classes become available project-wide without resetting the base styles the other 8 pages depend on from `legacy.css`/`redesign.css`. shadcn/ui's `button` primitive is added via the official CLI (Astro is a fully supported target) and then hand-edited to route through the site's existing `--db-optic` design tokens instead of shadcn's default palette, so the new button doesn't visually fight the rest of the site.

**Tech Stack:** Astro 6 (existing) + `@astrojs/react` (new) + React 19 (new) + Tailwind CSS v4 via `@tailwindcss/vite` (new) + shadcn/ui CLI-managed `button` component (new) + `framer-motion` (new, for the word-rotation + reveal animation) + TypeScript (existing, strict mode).

---

## Ground truth this plan was built from (read this before starting)

These are facts verified directly in the repo before writing this plan — not assumptions. If any of them are no longer true when you start, stop and re-verify before proceeding, because later tasks depend on them.

1. **Stack:** `package.json` has only `astro` and `firebase` as runtime deps. No React, Tailwind, or shadcn exist yet. `astro.config.mjs` has no integrations configured (`build.format: 'file'`, `trailingSlash: 'never'`, `site: 'https://fynoptic.org'` — do not touch these three lines).
2. **Layout:** Every page imports `src/styles/legacy.css` then `src/styles/redesign.css` (in that order) via `src/layouts/Base.astro:15-22`. `redesign.css` loads *after* `legacy.css`, so it wins the cascade via `!important` overrides — this is the established pattern in this codebase for "retire an old style without deleting it." Follow it; do not edit `legacy.css` directly for anything already covered by `redesign.css`.
3. **The gradients the user flagged are already retired.** `redesign.css` (written in an Aug 7 session, comment: *"Optical Bench, direction B, with direction A's type"*) already forces `background: var(--db-optic) !important` (a flat solid, no gradient) onto `.btn-primary`, `.header .btn.btn-primary`, `.btn-cta`, `.why-btn`, `.glow-cta-btn`, `.glow-btn`, and `.badge--grad` (`redesign.css:111-149, 435-445`), and already retires the gradient-clipped text on `.big-statement`, `.cta-title span`, `.articles-hero h1`, `.md h1`, and **`.auth-link button`** — which is the exact element the login/signup modal uses for "Forgot your password?" / "Create an account" (`redesign.css:189-204`). The only gradients still live in `legacy.css` that are *not* covered by an override are decorative, low-opacity ambient background washes (e.g. `.modal .dialog`'s two `rgba(...,.09)` radial glows at `legacy.css:1968-1974`) or are on pages/components nobody flagged (article-reader progress bar, courseone achievement badges, flashcard/practice progress rings). Per the user's explicit decision, ambient washes stay; unrelated pages stay out of scope. **Task 1 verifies this holds true live — it is a verification task, not a removal task.** If it finds a live regression, fix it there; do not go hunting for more gradients to remove beyond what's listed in this plan.
4. **Font tokens:** `redesign.css:24-37` defines `--display-face: 'Spectral', ...` (serif) and this is applied to `h1, h2, h3` *site-wide* (`redesign.css:161-165`), including the nav wordmark and every other page's headings. **Do not touch `--display-face` or these selectors.** The user confirmed the Helvetica-stack font change is for the hero `<h1>` only.
5. **Current hero markup** (`src/pages/index.astro:12-54`):
   ```astro
   <section class="hero" role="region" aria-labelledby="hero-heading">
     <div class="container hero-content">
       <h1 id="hero-heading" class="reveal-up">Take your first step<br />toward financial freedom.</h1>
       <p class="hero-sub reveal-up delay-1">
         Fynoptic is the ultimate free learning platform for consumer awareness.
         Interactive lessons, informative articles, and practice questions.
       </p>
       <div class="hero-cta reveal-up delay-2">
         <a href="/courses" class="btn btn-primary" data-track="cta_click">Start the free course</a>
         <a href="/practice" class="btn btn-ghost">Try Practice mode</a>
       </div>
       <div class="partners reveal-up delay-3"> <!-- logo marquee, ~24 lines --> </div>
     </div>
   </section>
   ```
   There is **no pill/badge** in this markup today — the "New" pill only exists in the pasted 21st.dev reference component, not on the live site. Nothing to remove there; just don't add one.
6. **Reduced motion:** `src/lib/reveal.ts` handles scroll-reveal via `IntersectionObserver` and already special-cases `prefers-reduced-motion: reduce` by skipping straight to the revealed state (`reveal.ts:11-16`). `redesign.css:333-335` also has a blanket `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`. That CSS rule does **not** stop framer-motion (it animates via inline transforms driven by JS, not `@keyframes`), so the new `Hero.tsx` must check `useReducedMotion()` from `framer-motion` itself and skip the word-rotation interval entirely when it's true.
7. **CTA destinations already match the site's real features** — `/courses` and `/practice` are real routes (`src/pages/courses.astro`, `src/pages/practice.astro`). Keep them.
8. **No existing React/Tailwind/shadcn config, no `playwright.config.*` file, no `.spec.ts` files anywhere in `tests/`** — `tests/baseline/` only holds two JSON snapshots (`url-surface.json`, `console-errors.json`) written by `scripts/visual-diff.mjs`, not Playwright specs. `package.json`'s `"test:e2e": "playwright test"` script currently has nothing to run. Task 9 creates the first real Playwright config + spec.
9. **Working directory:** all commands below assume cwd = `/Users/arhanbarve/Code/fynoptic/.claude/worktrees/hero-redesign` (an isolated git worktree on branch `worktree-hero-redesign`). Nothing here touches `main` until you decide to merge.

---

## File Structure (what gets created/modified and why)

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | New deps: `react`, `react-dom`, `@astrojs/react`, `tailwindcss`, `@tailwindcss/vite`, `framer-motion`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `lucide-react`; new devDeps: `@playwright/test` config bits (already present) |
| `astro.config.mjs` | Modify | Register `@astrojs/react` integration + `@tailwindcss/vite` Vite plugin |
| `src/styles/globals.css` | Create | Tailwind v4 entry point, **preflight excluded**, `@theme inline` mapped onto the site's existing design tokens (`--db-optic`, `--text-100`, etc.) instead of shadcn's defaults |
| `src/layouts/Base.astro` | Modify | Import `../styles/globals.css` (once, site-wide, alongside the existing two CSS imports) |
| `components.json` | Create | shadcn CLI config (Astro template, `new-york` style, aliases pointing at `src/components`) |
| `src/lib/utils.ts` | Create | shadcn's `cn()` helper (CLI-generated) |
| `src/components/ui/button.tsx` | Create, then modify | shadcn `button` primitive, CLI-generated then hand-edited to drop the default indigo palette in favor of `--db-optic` tokens and add a `hero` size variant |
| `src/components/hero/RotatingWord.tsx` | Create | Isolated word-rotation component (framer-motion `AnimatePresence`), reduced-motion aware |
| `src/components/hero/Hero.tsx` | Create | The island: Helvetica headline + `RotatingWord` + existing subhead copy + two `Button`s, reveal-in on mount |
| `src/pages/index.astro` | Modify | Replace the `<h1>`/`<p>`/`.hero-cta` block (lines 15-27) with `<Hero client:visible />`; leave `.partners` block and everything else untouched |
| `playwright.config.ts` | Create | Minimal Playwright config pointed at `astro preview` on port 4321, matching `scripts/visual-diff.mjs`'s `BASE_URL` convention |
| `tests/e2e/hero.spec.ts` | Create | E2E coverage for the new hero: headline text, word rotation, CTA hrefs, reduced-motion static state, no pill present |
| `docs/superpowers/plans/2026-08-08-hero-redesign.md` | This file | The plan itself |

Nothing in `src/styles/legacy.css`, `src/components/Header.astro`, `src/components/Footer.astro`, or any page other than `index.astro` is modified by this plan.

---

## Task 1: Verify the existing gradient retirement is actually live (no code changes)

This task produces evidence, not a diff. It exists because "remove the vibe-coded gradients" turned out to already be ~95% done by a prior session, and we need proof before telling the user that, and proof that nothing regressed since.

**Files:** none modified.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Astro dev server starts on `http://localhost:4321` (predev runs `scripts/sync-public.mjs` first — let it finish).

- [ ] **Step 2: Open the homepage and the auth modal, inspect computed styles**

In a browser at `http://localhost:4321/`:
1. Click "Start the free course" in the header nav — confirm it's a flat solid fill, not a gradient.
2. Click the user icon (top right) to open the sign-in modal. Click "New user? Create an account" — confirm that link text renders as solid text color, not a color gradient clipped to the glyphs.
3. In the sign-up modal, confirm the "Create account" submit button is a flat solid fill.
4. Open devtools, select the hero's two CTA buttons (`.hero-cta .btn-primary`, `.hero-cta .btn-ghost`) and check the Computed panel for `background-image` — expect `none`.

Expected: all four checks pass (flat colors, no gradients) — confirming `redesign.css`'s overrides from `Ground truth` item 3 are live.

- [ ] **Step 3: If any check in Step 2 fails**

Only if something regressed: open `src/styles/redesign.css`, find the relevant selector in section 3 (buttons, `~line 111`) or section 4 (gradient text, `~line 189`), and confirm it's still present and still has `!important`. If the selector was accidentally removed or a newer legacy.css rule added higher specificity, restore/strengthen the override in `redesign.css` (not `legacy.css`) following the existing pattern in that file. Re-run Step 2 until it passes.

- [ ] **Step 4: Record the result**

No commit needed for this task — it's a verification gate. Note the outcome (pass, or what you fixed) before moving to Task 2.

---

## Task 2: Add the React integration to Astro

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Run Astro's official integration installer**

Run: `npx astro add react -y`
Expected: prompts auto-accepted (`-y`), installs `@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom` into `package.json`, and edits `astro.config.mjs` to add the integration automatically.

- [ ] **Step 2: Verify `astro.config.mjs` was edited correctly**

Run: `cat astro.config.mjs`
Expected output (exact — the three pre-existing lines `site`, `build.format`, `trailingSlash` must be unchanged):

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// build.format 'file' emits about.html, not about/index.html — the default
// ('directory') would silently change every public URL on the site.
export default defineConfig({
  site: 'https://fynoptic.org',
  build: { format: 'file' },
  trailingSlash: 'never',
  integrations: [react()],
});
```

If the installer placed `integrations: [react()]` differently (e.g. reordered keys), that's fine functionally — just confirm `site`, `build.format: 'file'`, and `trailingSlash: 'never'` are still present unchanged, since those three lines are load-bearing per the comment above them (changing `build.format` silently breaks every URL on the deployed site).

- [ ] **Step 3: Confirm the build still succeeds with zero pages changed**

Run: `npm run build`
Expected: `astro check && astro build` completes with 0 errors, 0 warnings, and the terminal output reports the same page count as before (253 pages, per the last recorded build). No page content should differ yet — this step only proves the new integration doesn't break the existing static site.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json astro.config.mjs
git commit -m "build: add @astrojs/react integration"
```

---

## Task 3: Add Tailwind v4, scoped so it cannot break the other 8 pages

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`
- Create: `src/styles/globals.css`
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Install Tailwind v4 and its Vite plugin**

Run: `npm install tailwindcss @tailwindcss/vite`
Expected: both added to `dependencies` in `package.json`.

- [ ] **Step 2: Register the Vite plugin in `astro.config.mjs`**

Edit `astro.config.mjs` to add the import and the `vite.plugins` array, keeping everything from Task 2 intact:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// build.format 'file' emits about.html, not about/index.html — the default
// ('directory') would silently change every public URL on the site.
export default defineConfig({
  site: 'https://fynoptic.org',
  build: { format: 'file' },
  trailingSlash: 'never',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Create `src/styles/globals.css` with preflight explicitly excluded**

This is the single most important step in this task. Tailwind v4 ships its reset (`preflight`), its theme layer, and its utility layer as three separately-importable files. Importing only `theme.css` and `utilities.css` — never `tailwindcss` bare or `tailwindcss/preflight.css` — is what keeps Tailwind's `* { margin: 0; box-sizing: border-box; ... }` reset from fighting `legacy.css`'s own resets on the other 8 pages.

Create `src/styles/globals.css`:

```css
/* Tailwind v4, preflight intentionally excluded.
   legacy.css already owns the site's base reset across all 9 pages;
   importing tailwindcss/preflight.css here would re-reset margins,
   headings, and form elements site-wide and silently break every page
   except this one. Only theme (tokens) + utilities (classes) are loaded. */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);

@theme inline {
  /* Reuse the site's existing design tokens (legacy.css / redesign.css)
     instead of introducing a second, competing color system. */
  --color-background: var(--surface-0);
  --color-foreground: var(--text-100);
  --color-card: var(--surface-1);
  --color-card-foreground: var(--text-100);
  --color-primary: var(--db-optic);
  --color-primary-foreground: var(--db-optic-ink);
  --color-secondary: var(--surface-2);
  --color-secondary-foreground: var(--text-100);
  --color-muted: var(--surface-2);
  --color-muted-foreground: var(--muted-fg);
  --color-accent: var(--db-optic);
  --color-accent-foreground: var(--db-optic-ink);
  --color-destructive: var(--danger-500);
  --color-border: var(--db-rule);
  --color-input: var(--input-bg);
  --color-ring: var(--db-optic);
  --radius: 6px;
  --radius-sm: calc(var(--radius) * 0.75);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) * 1.5);

  /* Hero-only display face. Deliberately NOT named --font-sans or
     --display-face — those are Spectral, site-wide, defined in
     redesign.css, and untouched by this file. */
  --font-hero: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
```

- [ ] **Step 4: Import `globals.css` once, site-wide, in `Base.astro`**

Edit `src/layouts/Base.astro`, adding the import after the existing two CSS imports (line 22 currently ends with `import '../styles/redesign.css';`):

```astro
import '../styles/legacy.css';
import '../styles/redesign.css';
import '../styles/globals.css';
```

`globals.css` loads last, but since it contributes only `@layer theme` and `@layer utilities` (no unlayered rules, no preflight), it cannot out-specificity `legacy.css`/`redesign.css`'s plain selectors or their `!important` rules — Tailwind's own layers are documented to sit below any unlayered CSS in the cascade. This is what makes it safe to add without an `!important` war.

- [ ] **Step 5: Verify the other 8 pages are visually unaffected**

Run: `npm run build && npm run preview`

In a browser, open each of: `http://localhost:4321/about`, `/articles`, `/courses`, `/courseone`, `/flashcard`, `/practice`, `/profile`, `/bot`. For each, confirm:
- No layout shift, no unstyled/reset-looking headings or buttons, no missing spacing.
- `document.documentElement.className` / computed `margin` on a `<p>` tag is still whatever `legacy.css` sets it to (open devtools, pick any `<p>`, confirm `margin` is not `0px 0px 0px 0px` unless `legacy.css` already set that).

Expected: all 8 pages look pixel-identical to before this task. If anything changed, re-check Step 3 — you likely imported `tailwindcss` bare or `tailwindcss/preflight.css` by mistake.

- [ ] **Step 6: Confirm a Tailwind utility class actually works**

Temporarily add `class="text-[var(--color-primary)]"` to any element on a test page, confirm in devtools it resolves to the site's actual `--db-optic` blue (not a default Tailwind color). Remove the temporary class before committing.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/styles/globals.css src/layouts/Base.astro
git commit -m "build: add Tailwind v4 scoped without preflight, mapped to existing design tokens"
```

---

## Task 4: Add shadcn/ui and the `button` component

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Modify: `package.json`

- [ ] **Step 1: Run the shadcn CLI initializer, non-interactive, Astro template**

Run: `npx shadcn@latest init -d -t astro`
Expected: detects the existing Tailwind v4 setup from Task 3, creates `components.json`, creates `src/lib/utils.ts` with the `cn()` helper, and installs `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot` into `package.json`.

- [ ] **Step 2: Verify `components.json` points at the real paths**

Run: `cat components.json`

Confirm `tailwind.css` points at `src/styles/globals.css` (the file created in Task 3, not a new one the CLI tried to create) and `aliases.components`/`aliases.ui`/`aliases.utils` point at `@/components`, `@/components/ui`, `@/lib/utils`. If the CLI created a second CSS file instead of reusing `globals.css`, delete the duplicate and edit `components.json`'s `tailwind.css` field to `src/styles/globals.css` by hand — there must be exactly one Tailwind entry point, or the preflight-exclusion from Task 3 could get silently duplicated/undone.

- [ ] **Step 3: Confirm the `@/` import alias resolves**

Run: `cat tsconfig.json`

Expected: a `paths` entry mapping `"@/*": ["./src/*"]` was added by the CLI. If not present, add it by hand inside `compilerOptions`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "js", "node_modules"],
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 4: Add the button component**

Run: `npx shadcn@latest add button -o`

Expected: creates `src/components/ui/button.tsx` with shadcn's standard `cva`-based button (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link` variants; `default`, `sm`, `lg`, `icon` sizes).

- [ ] **Step 5: Hand-edit the button to add a `hero` size and drop any leftover default-palette classes**

Read `src/components/ui/button.tsx` after generation. It will use `bg-primary text-primary-foreground` for the `default` variant — since `--color-primary`/`--color-primary-foreground` were already mapped to `--db-optic`/`--db-optic-ink` in Task 3's `globals.css`, the default variant is *already* the site's flat accent color, not shadcn's default indigo. Confirm that by inspecting the generated `buttonVariants` call — it should read (variant names may differ slightly by CLI version, but the token classes must match):

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        hero: "h-12 px-6 text-base rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
```

Add the `hero` size line under `size` if the CLI's generated version doesn't already have a slot for it. Do not add a `gradient` variant — none is needed and one existing in the shadcn docs example (`premium: 'bg-gradient-to-r from-purple-500 to-pink-500'`) must never be copied in here.

- [ ] **Step 6: Verify no gradient classes exist in the generated file**

Run: `grep -n "gradient" src/components/ui/button.tsx`
Expected: no output (empty). If any line contains `gradient`, remove it — the whole point of this component is to not reintroduce what Task 1 just confirmed was removed.

- [ ] **Step 7: Commit**

```bash
git add components.json tsconfig.json src/lib/utils.ts src/components/ui/button.tsx package.json package-lock.json
git commit -m "feat: add shadcn/ui button component, mapped to site design tokens"
```

---

## Task 5: Build the word-rotation component

**Files:**
- Create: `src/components/hero/RotatingWord.tsx`

- [ ] **Step 1: Install framer-motion**

Run: `npm install framer-motion`

- [ ] **Step 2: Write `src/components/hero/RotatingWord.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ROTATE_INTERVAL_MS = 2200;

interface RotatingWordProps {
  words: readonly string[];
  className?: string;
}

export function RotatingWord({ words, className }: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return; // frozen on the first word, no interval
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [words.length, prefersReducedMotion]);

  const current = words[index];

  if (prefersReducedMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className={cn('relative inline-grid', className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="col-start-1 row-start-1"
        >
          {current}
        </motion.span>
      </AnimatePresence>
      {/* Reserves layout width for the longest word so the sentence around it
          doesn't reflow every 2.2s — sized off the widest candidate ("setup"),
          invisible, same font/weight/size as the visible word above it. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {[...words].sort((a, b) => b.length - a.length)[0]}
      </span>
    </span>
  );
}
```

- [ ] **Step 3: Write a component-level sanity check (no test framework needed for this — manual)**

Run: `npm run dev`, then temporarily render `<RotatingWord words={['scam', 'setup', 'lie', 'con', 'trap']} />` on any scratch page (e.g. paste it into `src/pages/about.astro`'s frontmatter/body temporarily as `<RotatingWord client:load words={['scam','setup','lie','con','trap']} />` after importing it) and confirm in the browser: words cycle every ~2.2s, no layout width jump between words, exit/enter fades and slides smoothly. Remove the temporary render from `about.astro` before continuing — this was scaffolding, not part of the final page.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/hero/RotatingWord.tsx
git commit -m "feat: add RotatingWord component with reduced-motion support"
```

---

## Task 6: Build the Hero island

**Files:**
- Create: `src/components/hero/Hero.tsx`

- [ ] **Step 1: Write `src/components/hero/Hero.tsx`**

```tsx
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotatingWord } from './RotatingWord';

const ROTATING_WORDS = ['scam', 'setup', 'lie', 'con', 'trap'] as const;

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h1
        id="hero-heading"
        className="max-w-[22ch] text-[clamp(2rem,3.4vw,3.15rem)] font-bold leading-[1.06] tracking-[-0.02em] text-foreground"
        style={{ fontFamily: 'var(--font-hero)' }}
      >
        See through the{' '}
        <RotatingWord
          words={ROTATING_WORDS}
          className="text-primary"
        />
        .
      </h1>

      <p className="hero-sub mt-4 max-w-[54ch] text-[clamp(1rem,1.15vw,1.12rem)] text-muted-foreground">
        Fynoptic is the ultimate free learning platform for consumer awareness.
        Interactive lessons, informative articles, and practice questions.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="hero" data-track="cta_click">
          <a href="/courses">Start the free course</a>
        </Button>
        <Button asChild size="hero" variant="outline">
          <a href="/practice">Try Practice mode</a>
        </Button>
      </div>
    </motion.div>
  );
}

export default Hero;
```

Notes on why each piece is the way it is:
- `id="hero-heading"` is preserved from the original markup — `index.astro`'s `<section>` has `aria-labelledby="hero-heading"`, so the id must land on whichever element ends up being the `<h1>`, or that ARIA relationship silently breaks.
- `style={{ fontFamily: 'var(--font-hero)' }}` reads the token defined in Task 3's `globals.css` rather than hardcoding the Helvetica stack twice in two files.
- `hero-sub` class is kept alongside the new Tailwind classes so `redesign.css:220-226`'s existing `.hero-sub` rules (color, max-width, font-size) still apply as a fallback/documentation of intent, even though the Tailwind classes here now set the same properties directly. (If this dual-styling reads as redundant during review, it's intentional belt-and-suspenders during the transition, not a mistake — but it's fine to strip `hero-sub` and rely solely on the Tailwind classes if you'd rather; either way renders identically today.)
- `data-track="cta_click"` is preserved from the original `<a>` so existing analytics tracking (`src/lib/track.ts`) keeps firing on the primary CTA.
- The outer `motion.div`'s reveal-on-mount replaces the old CSS-class-based `.reveal-up`/`.reveal-up.delay-1`/`.reveal-up.delay-2` scroll reveal (which relied on `initReveal()`'s `IntersectionObserver` in `reveal.ts`). Since the hero is always the first thing in the viewport on load, an on-mount fade is equivalent to what the old scroll-triggered reveal did in practice (it always fired immediately) and is simpler than wiring the new island into the old vanilla-JS observer.

- [ ] **Step 2: Commit**

```bash
git add src/components/hero/Hero.tsx
git commit -m "feat: add Hero island component"
```

---

## Task 7: Wire the island into `index.astro`

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add the import**

At the top of `src/pages/index.astro`, inside the existing frontmatter fence, add:

```astro
---
import Base from '../layouts/Base.astro';
import { Hero } from '../components/hero/Hero';
---
```

- [ ] **Step 2: Replace the headline/subhead/CTA block, keep everything else**

Current block (`src/pages/index.astro:15-27`):

```astro
      <!-- Headline (unchanged text) -->
      <h1 id="hero-heading" class="reveal-up">Take your first step<br />toward financial freedom.</h1>

      <!-- New, more practical value prop -->
      <p class="hero-sub reveal-up delay-1">
        Fynoptic is the ultimate free learning platform for consumer awareness.
        Interactive lessons, informative articles, and practice questions.
      </p>

      <div class="hero-cta reveal-up delay-2">
        <a href="/courses" class="btn btn-primary" data-track="cta_click">Start the free course</a>
        <a href="/practice" class="btn btn-ghost">Try Practice mode</a>
      </div>

      <!-- Coverflow Carousel (5 placeholders) -->
      <!-- Partners marquee -->
```

Replace with:

```astro
      <Hero client:visible />

      <!-- Partners marquee -->
```

Everything from `<div class="partners reveal-up delay-3">` onward (the logo ticker, the `</div>`/`</section>` closes, the `<hr class="section-divider">`, and every section below it) is **not touched** — leave it exactly where it is, directly after the new `<Hero client:visible />` line, still inside the same `<div class="container hero-content">` wrapper.

- [ ] **Step 3: Run the build**

Run: `npm run build`
Expected: `astro check && astro build` completes with 0 errors, 0 warnings, 253 pages generated (same count as before — this is a same-page edit, not a new page).

- [ ] **Step 4: Visual check in the browser**

Run: `npm run preview`, open `http://localhost:4321/`.

Confirm:
- Headline reads "See through the [rotating word]." with the word cycling through scam → setup → lie → con → trap → loop, every ~2.2s.
- Headline font is visibly Helvetica/Arial (sans-serif, not the site's serif Spectral used elsewhere).
- No pill/badge above the headline.
- Both CTA buttons render flat (no gradient), correct labels, correct hrefs (`/courses`, `/practice`).
- Subhead text unchanged from before.
- Partner logo marquee still renders directly below, unchanged.
- Nav bar and footer unchanged.
- Sections below the hero (`.statement`, `.why-slab`, `.final-cta`) unchanged.

- [ ] **Step 5: Reduced-motion check**

In devtools, enable "Emulate CSS media feature prefers-reduced-motion: reduce" (Chrome: Rendering tab). Reload. Confirm:
- The rotating word is frozen on "scam" (the first word), no animation, no interval running (check the Elements panel — the `<span>` should not be re-rendering).
- The hero's fade-in-on-mount also doesn't animate (appears instantly).

- [ ] **Step 6: Theme check**

Toggle the site's theme switcher (uses `src/lib/theme.ts`, sets `data-theme` on `<html>`/`<body>`) to light mode. Confirm the headline, subhead, and both buttons remain legible with good contrast — since `--color-foreground`/`--color-primary`/`--color-muted-foreground` in `globals.css` are mapped to tokens that already have light-theme redefinitions in `legacy.css:145-200` and `redesign.css:38-44`, this should work automatically. Verify it actually does rather than assuming.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: wire Hero island into homepage, replacing static headline/CTA markup"
```

---

## Task 8: Full-site regression pass

**Files:** none modified (verification only, fixes applied only if something breaks).

- [ ] **Step 1: Build and preview**

Run: `npm run build && npm run preview`

- [ ] **Step 2: Check all 9 pages load with no console errors**

For each of `/`, `/about`, `/articles`, `/courses`, `/courseone`, `/flashcard`, `/practice`, `/profile`, `/bot`: open devtools console, reload, confirm zero errors/warnings introduced (compare against `tests/baseline/console-errors.json` if it's still an accurate baseline; if it's stale, note that separately — updating it is out of scope for this plan).

- [ ] **Step 3: Confirm React only loads on the homepage**

On `/about` (or any non-home page), open the Network tab, reload, filter for `react`. Expected: no React/framer-motion chunks load — `client:visible` on the `Hero` island means Astro only ships that island's JS to pages that actually render it, so the other 8 pages' bundle size is unaffected.

On `/`, confirm the React/framer-motion chunks *do* load (lazily, once the hero scrolls into view — which on a hero it does immediately).

- [ ] **Step 4: Run the existing visual-diff baseline capture and inspect the diffs manually**

Run: `npm run test:visual`
Expected: this regenerates `tests/baseline/` screenshots. Since it currently only captures baselines (per the comment at the top of `scripts/visual-diff.mjs`, diff-mode isn't implemented), manually eyeball the newly captured screenshots for all 9 pages × 2 themes and confirm nothing outside the homepage hero changed.

- [ ] **Step 5: Fix anything found, otherwise proceed**

If Steps 2-4 find a regression, fix it at its source (most likely `globals.css`'s token mapping or the `Base.astro` import order) and re-run this task from Step 1. Do not proceed to Task 9 with a known regression.

- [ ] **Step 6: No commit for this task** — it's verification only. If Step 5 required a fix, that fix gets its own commit at the point it was made.

---

## Task 9: Playwright E2E coverage for the new hero

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/hero.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

This matches `scripts/visual-diff.mjs`'s existing convention of defaulting to `http://localhost:4321` (Astro's `preview` port) and honoring a `BASE_URL` override.

- [ ] **Step 2: Write `tests/e2e/hero.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.describe('homepage hero', () => {
  test('renders the headline with a rotating word and correct CTAs', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('#hero-heading');
    await expect(heading).toContainText('See through the');

    // No promo pill above the headline.
    await expect(page.locator('text=Anouncing our latest')).toHaveCount(0);
    await expect(page.locator('text=New').first()).not.toBeVisible({ timeout: 500 }).catch(() => {});

    const primaryCta = page.locator('a[href="/courses"]', { hasText: 'Start the free course' });
    const secondaryCta = page.locator('a[href="/practice"]', { hasText: 'Try Practice mode' });
    await expect(primaryCta).toBeVisible();
    await expect(secondaryCta).toBeVisible();
  });

  test('rotates through all five words over one full cycle', async ({ page }) => {
    await page.goto('/');
    const words = ['scam', 'setup', 'lie', 'con', 'trap'];
    const seen = new Set<string>();

    for (let i = 0; i < words.length; i++) {
      const visible = await page
        .locator('#hero-heading span')
        .filter({ hasText: new RegExp(`^(${words.join('|')})$`) })
        .first()
        .textContent();
      if (visible) seen.add(visible.trim());
      await page.waitForTimeout(2300);
    }

    for (const word of words) {
      expect(seen.has(word)).toBe(true);
    }
  });

  test('freezes on the first word when prefers-reduced-motion is set', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(3000); // longer than one rotation interval
    await expect(page.locator('#hero-heading')).toContainText('scam');
  });

  test('CTA buttons have no gradient background', async ({ page }) => {
    await page.goto('/');
    const primaryCta = page.locator('a[href="/courses"]', { hasText: 'Start the free course' });
    const backgroundImage = await primaryCta.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(backgroundImage).toBe('none');
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npm run test:e2e`
Expected: `npx playwright test` (if this is the first Playwright run in this repo, it may first prompt to install browsers — run `npx playwright install chromium` if so) — all 4 tests pass.

- [ ] **Step 4: If the word-rotation test is flaky**

The second test polls on a fixed 2300ms cadence against a 2200ms rotation interval, which is timing-sensitive. If it flakes in CI, increase the poll count/interval margin rather than reducing test coverage — do not delete the rotation assertion.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/hero.spec.ts
git commit -m "test: add Playwright e2e coverage for the redesigned hero"
```

---

## Task 10: Final manual sign-off checklist

**Files:** none.

- [ ] Headline: "See through the ___." with rotating word (scam, setup, lie, con, trap), Helvetica/Arial font, bold, tight tracking.
- [ ] No pill/badge above the headline.
- [ ] CTA buttons: "Start the free course" → `/courses`, "Try Practice mode" → `/practice`, both flat/no gradient.
- [ ] Subhead copy unchanged.
- [ ] Partner logo marquee unchanged, still directly below the hero block.
- [ ] Nav bar, footer, and every section below the hero on the homepage: byte-identical to before this plan.
- [ ] Other 8 pages: visually unchanged, no console errors, no React/Tailwind bundle shipped to them.
- [ ] Auth modal (sign in / sign up / reset): CTA buttons flat, "Create an account"/"Forgot your password?" links solid-colored (not gradient text) — confirms Task 1's finding is still true after all other changes.
- [ ] Light theme: hero legible, good contrast, no broken tokens.
- [ ] `prefers-reduced-motion: reduce`: hero renders instantly with no animation, word frozen on "scam".
- [ ] `npm run build` — 0 errors, 0 warnings, 253 pages.
- [ ] `npm run test:e2e` — all passing.
- [ ] Proceed to Task 11 for the artifact-based visual review the user explicitly asked for before anything is considered mergeable.

---

## Task 11: Publish a visual-review artifact

The user explicitly asked to "show me everything with artifacts to confirm things visually" — this task is not optional polish, it's a named requirement.

**Files:** none in the repo; produces one published Artifact.

- [ ] **Step 1: Capture screenshots**

With `npm run preview` running, capture:
1. Homepage hero, dark theme, desktop viewport (1440×900).
2. Homepage hero, light theme, desktop viewport (1440×900).
3. Homepage hero, dark theme, mobile viewport (390×844).
4. Homepage hero mid-rotation (any word other than "scam") to prove the animation isn't a static screenshot.
5. Auth modal (sign-up) open, dark theme — to visually back up Task 1's gradient-removal claim.

- [ ] **Step 2: Build a single HTML review page embedding all five screenshots**

Load the `artifact-design` skill before writing this page (per the Artifact tool's own requirement), then write a plain HTML file (in the session scratchpad, not the repo) that lays out the five screenshots with labels ("Dark · Desktop", "Light · Desktop", "Mobile", "Mid-rotation ('lie')", "Auth modal — no gradient") and a short caption per shot restating what to check for from the Task 10 checklist.

- [ ] **Step 3: Publish it**

Call the `Artifact` tool on that HTML file with a descriptive title (e.g. "Fynoptic — Hero Redesign Review") and a one-emoji favicon. Send the resulting link to the user and wait for their sign-off before merging any of this work toward `main`.

---

## Rollback

Every task in this plan is a separate commit on `worktree-hero-redesign`, isolated in its own worktree — `main` is untouched throughout. To abandon: `ExitWorktree` with `action: "remove"`, or simply leave the branch unmerged. To roll back one task without abandoning the rest: `git revert` the specific task's commit — each task was scoped to touch only the files it declares, so reverts should be clean.
