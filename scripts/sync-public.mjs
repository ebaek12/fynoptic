// Mirrors the static assets the legacy site serves straight from the repo root
// into public/, where Astro picks them up and copies them into dist/.
//
// These files could now live in public/ directly — the legacy .html pages that
// referenced them by root-relative path are gone. Moving them is a `git mv` of
// ~77 MB, which would double the repo's pack size until history is purged, so
// they stay at the root and are mirrored at build time and git-ignored instead.
// Fold this step away once scripts/purge-media-history.sh has run.
//
// CNAME is deliberately absent: it was GitHub Pages' custom-domain mechanism,
// and the site is served by Vercel now, which reads the domain from the project
// rather than from a file in the build.
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const MIRRORED = ['assets', 'content', 'data', 'favicon.ico', 'site.webmanifest'];

await mkdir(publicDir, { recursive: true });

for (const entry of MIRRORED) {
  const from = join(root, entry);
  if (!existsSync(from)) {
    throw new Error(`sync-public: missing source ${entry} at repo root`);
  }
  const to = join(publicDir, entry);
  // Remove first so a deletion at the root propagates instead of leaving a
  // stale file behind in dist/.
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
}

console.log(`sync-public: mirrored ${MIRRORED.join(', ')} into public/`);
