# Purging media from git history

The repo is 81 MB packed. Almost all of it is media that no longer needs to
be in git. Purging it takes the pack to about 8 MB.

Run `scripts/purge-media-history.sh`. **Read this first** — the rewrite
changes every commit hash in the repository and cannot be undone once
pushed.

## What gets purged

| Target | Size in history | Why |
|---|---|---|
| `*.mp4` | ~70 MB | Three course videos. Served from the CDN after the migration. |
| `articles-data.js` (root path) | ~27 MB across 13 revisions | Stale path. The live file is `js/articles-data.js` and is left alone. |

Measured on 2026-08-07 at commit `ab24e9c`: **81.3 MB → 8.1 MB**.

The videos must be matched by glob, not by path. They lived at the repo
root until commit `4ffedfa` moved them into `assets/video/`, so
`--path assets/video` catches only the later copies and saves just 3 MB.

## Prerequisites

Both are enforced by the script, which refuses to run otherwise.

1. **The videos are already on the CDN** — see `docs/cdn-setup.md` for the
   walkthrough. **Still outstanding.** Purging `*.mp4` removes them from the
   working tree as well as from history, so if `courseone.html` and
   `src/pages/courseone.astro` still point at `assets/video/*.mp4`, the rewrite
   ships six broken players. Migrate first, update the six `<source src>` tags,
   merge that.

2. **Every branch is merged. Done.** A rewrite orphans anything based on the old
   history. The five branches that were outstanding on `ab24e9c`
   (`image-compression`, `layout-alignment-fix`, `astro-migration-plan`,
   `auth-overhaul`, `history-rewrite-tooling`) are all merged into `main`.
   Delete the branches and remove the worktrees under `.claude/worktrees/`
   before rewriting, and confirm no other session is still working in them.

## Order of operations

1. Merge every outstanding branch into `main`. Push.
2. Migrate the videos to the CDN (`docs/cdn-setup.md`). Update `courseone.html`
   and `src/pages/courseone.astro`. Merge. Push.
3. Tell everyone with a clone to push whatever they have, then stop working.
4. Run `scripts/purge-media-history.sh`. It writes a rewritten clone to
   `~/Code/fynoptic-rewritten` and pushes nothing.
5. Serve that clone locally and click through the site.
6. Force-push (the script prints the exact commands).
7. Everyone deletes their old clone and re-clones.

Step 7 is not optional. A teammate who pushes from an old clone puts all
the deleted history straight back.

## Notes

- `brew install git-filter-repo` if it is missing.
- GitHub does not reclaim the space when you push. Unreachable objects sit
  on their servers until their own GC runs; open a support ticket if you
  need it reclaimed on a deadline.
- Anyone who forked the repo, and any open PR, keeps the old objects alive.
- After this, `js/articles-data.js` (5.8 MB) is most of what is left — 5.8
  of the 8.1 MB. Splitting it into per-article JSON is the next win, and
  unlike this one it needs no coordination.
