#!/usr/bin/env bash
#
# Purge large media from fynoptic's git history.
#
# Measured effect (2026-08-07, at commit ab24e9c): 81.3 MB pack -> 8.1 MB.
#
# This rewrites every commit hash in the repository. Read
# docs/history-rewrite-checklist.md before running it. The script never
# pushes; it prepares a rewritten clone and prints what to do next.
#
# Usage:
#   scripts/purge-media-history.sh [--out DIR]
#
set -euo pipefail

REMOTE="https://github.com/ebaek12/fynoptic.git"
OUT="${HOME}/Code/fynoptic-rewritten"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

die()  { echo "ABORT: $*" >&2; exit 1; }
ok()   { echo "  ok    $*"; }
warn() { echo "  warn  $*"; }

echo "== preflight =="

command -v git-filter-repo >/dev/null \
  || die "git-filter-repo not installed. brew install git-filter-repo"
ok "git-filter-repo present"

[ -e "$OUT" ] && die "$OUT already exists. Remove it or pass --out DIR."
ok "output path $OUT is free"

# --- Guard 1: the videos must already be off the repo. ---------------------
# Purging *.mp4 deletes them from the working tree as well as from history.
# If any tracked file still points at a local mp4, the live site breaks.
echo
echo "== guard: are local videos still referenced? =="
TMPCHK="$(mktemp -d)"
trap 'rm -rf "$TMPCHK"' EXIT
git clone --quiet --depth 1 "$REMOTE" "$TMPCHK/probe"
# Match a path ending in .mp4 inside src=/href= or a CSS url(). The quote
# character sits between the "=" and the path, so it must be allowed through
# and then excluded from the path itself -- do not collapse these branches
# into one character class.
MP4_RE='(src|href)=["'"'"'][^"'"'"']*\.mp4|url\([^)]*\.mp4'
# .astro and .ts are in the list because the Astro rewrite landed after this
# script was written: src/pages/courseone.astro carries its own copies of the
# three <source src> tags, and missing them would let the purge run while the
# migrated site still points at local videos.
REFS="$(grep -rIlE --include='*.html' --include='*.css' --include='*.js' \
          --include='*.astro' --include='*.ts' \
          "$MP4_RE" "$TMPCHK/probe" 2>/dev/null || true)"
if [ -n "$REFS" ]; then
  echo
  echo "  These tracked files still reference a local .mp4:"
  echo "$REFS" | sed "s|$TMPCHK/probe/|    |"
  echo
  die "Move the videos to the CDN and update these references first.
       Purging now would ship broken video players on courseone.html."
fi
ok "no tracked file references a local .mp4"

# --- Guard 2: everything should be merged before the rewrite. --------------
echo
echo "== guard: unmerged work =="
# Check the LOCAL repo this script lives in, not just the remote. Work in
# progress sits on local branches and worktrees that never reach the remote,
# and those are exactly what a rewrite orphans.
SELF_REPO="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || true)"
STALE=""

if [ -n "$SELF_REPO" ]; then
  COMMON="$(git -C "$SELF_REPO" rev-parse --git-common-dir)"
  MAIN_WT="$(dirname "$COMMON")"
  for b in $(git -C "$MAIN_WT" for-each-ref --format='%(refname:short)' refs/heads); do
    [ "$b" = "main" ] && continue
    if [ -n "$(git -C "$MAIN_WT" rev-list --max-count=1 "main..$b" 2>/dev/null)" ]; then
      STALE="$STALE    branch  $b"$'\n'
    fi
  done
  EXTRA_WT="$(git -C "$MAIN_WT" worktree list --porcelain | grep '^worktree ' \
              | sed 's|^worktree ||' | grep -v "^$MAIN_WT\$" || true)"
  while IFS= read -r w; do
    [ -n "$w" ] && STALE="$STALE    worktree $w"$'\n'
  done <<< "$EXTRA_WT"
fi

REMOTE_BR="$(git ls-remote --heads "$REMOTE" | awk '{print $2}' \
             | sed 's|refs/heads/||' | grep -v '^main$' || true)"
[ -n "$REMOTE_BR" ] && STALE="$STALE$(echo "$REMOTE_BR" | sed 's/^/    remote  /')"$'\n'

if [ -n "$STALE" ]; then
  echo "  Work that a rewrite would orphan:"
  printf '%s' "$STALE"
  echo
  warn "Merge these into main and remove the worktrees first."
  read -r -p "  Continue anyway? [y/N] " reply
  [ "$reply" = "y" ] || die "stopped at your request"
else
  ok "no unmerged branches or extra worktrees"
fi

# --- Rewrite ---------------------------------------------------------------
echo
echo "== cloning a fresh mirror to rewrite =="
# filter-repo insists on a fresh clone so a botched run can never damage a
# working repo that has your only copy of something.
git clone --quiet "$REMOTE" "$OUT"
BEFORE="$(git -C "$OUT" count-objects -vH | awk '/size-pack/{print $2, $3}')"

echo
echo "== rewriting =="
# *.mp4          -- three course videos, ~70 MB. Lived at the repo root
#                   before commit 4ffedfa moved them into assets/video/, so
#                   this must match by glob, not by path.
# articles-data.js -- 13 stale revisions (~27 MB) at the old root path.
#                   js/articles-data.js was deleted along with the rest of the
#                   legacy site; its 6.1 MB is still in history and is NOT
#                   purged here. Add `--path js/articles-data.js` to reclaim
#                   it, but note that is one-way: the extracted articles under
#                   src/articles/ become the only surviving copy.
git -C "$OUT" filter-repo --force --invert-paths \
  --path-glob '*.mp4' \
  --path articles-data.js

git -C "$OUT" reflog expire --expire=now --all
git -C "$OUT" gc --prune=now --quiet
AFTER="$(git -C "$OUT" count-objects -vH | awk '/size-pack/{print $2, $3}')"

# --- Verify ----------------------------------------------------------------
echo
echo "== verify =="
LEFT="$(git -C "$OUT" rev-list --objects --all | grep -ci '\.mp4' || true)"
[ "$LEFT" = "0" ] || die "$LEFT mp4 blobs survived the rewrite"
ok "no mp4 blobs remain in history"

for f in index.html courseone.html assets/img/fynopticlogo.png; do
  git -C "$OUT" cat-file -e "HEAD:$f" 2>/dev/null \
    && ok "HEAD still has $f" \
    || die "HEAD lost $f -- do not push this"
done

echo
echo "  pack size: $BEFORE  ->  $AFTER"
echo "  commits:   $(git -C "$OUT" rev-list --count --all)"

cat <<EOF

== done, nothing pushed ==

Rewritten clone: $OUT

Next, by hand:
  1. Open $OUT and confirm the site works:
       cd "$OUT" && python3 -m http.server 8000
  2. Confirm every teammate has pushed. After the next step their old
     clones are unusable and must be re-cloned.
  3. Push the rewrite:
       git -C "$OUT" push --force --all origin
       git -C "$OUT" push --force --tags origin
  4. Tell everyone to re-clone. Do not let anyone push from an old clone --
     that reintroduces the deleted history.

GitHub does not reclaim the space immediately. Unreachable objects persist
until their own GC; contact GitHub Support if you need it reclaimed sooner.
EOF
