// Mirrors the static assets the legacy site serves straight from the repo root
// into public/, where Astro picks them up and copies them into dist/.
//
// These files cannot simply live in public/ instead: GitHub Pages currently
// serves the legacy .html pages from the repo root, and those pages reference
// assets/, content/ and data/ by root-relative path. Committing a second copy
// under public/ would add ~77 MB of byte-identical duplicates to a repository
// we are actively trying to shrink, so the copies are generated at build time
// and git-ignored instead.
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const MIRRORED = ['assets', 'content', 'data', 'favicon.ico', 'site.webmanifest', 'CNAME'];

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
