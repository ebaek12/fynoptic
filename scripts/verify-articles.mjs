// Independent gate: re-evaluates js/articles-data.js from scratch (fresh VM run,
// no shared state with extract-articles.mjs's in-memory results) and confirms every
// src/articles/<id>.html file on disk is byte-identical to the freshly-evaluated content.
//
// Reuses resolveCollisions()/validateResolved() from extract-articles.mjs so the two
// scripts can't drift apart on the duplicate-id collision policy (see the comment
// block at the top of extract-articles.mjs for what that policy is and why it exists).
// Importing extract-articles.mjs does NOT re-run its extraction/writes — that logic is
// guarded to only run when the file is executed directly, not when imported.

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sourcePath,
  evaluateArticles,
  resolveCollisions,
  validateResolved,
} from "./extract-articles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const articlesDir = path.join(repoRoot, "src", "articles");

const code = readFileSync(sourcePath, "utf8");
const articles = evaluateArticles(code);

if (!Array.isArray(articles) || articles.length !== 327) {
  console.error(
    `FAIL: expected 327 entries from fresh VM evaluation, got ${
      Array.isArray(articles) ? articles.length : typeof articles
    }`
  );
  process.exit(1);
}

const { resolved, collapsed, suffixed } = resolveCollisions(articles);
validateResolved(resolved);

function sha256(str) {
  return createHash("sha256").update(str, "utf8").digest("hex");
}

let verifiedCount = 0;
let mismatches = [];
let missing = [];
let bytesCompared = 0;
let bytesInSourceAllEntries = 0;
let bytesInResolvedEntries = 0;

for (const a of articles) {
  bytesInSourceAllEntries += Buffer.byteLength(a.content, "utf8");
}

for (const a of resolved) {
  bytesInResolvedEntries += Buffer.byteLength(a.content, "utf8");

  const filePath = path.join(articlesDir, `${a.id}.html`);
  if (!existsSync(filePath)) {
    missing.push(a.id);
    continue;
  }

  const onDisk = readFileSync(filePath, "utf8");

  // Fast pre-check via hash before the exact comparison (optimization only).
  const hashesMatch = sha256(onDisk) === sha256(a.content);
  const exactMatch = onDisk === a.content;

  if (!hashesMatch || !exactMatch) {
    mismatches.push(a.id);
    continue;
  }

  bytesCompared += Buffer.byteLength(onDisk, "utf8");
  verifiedCount++;
}

console.log(`Source entries evaluated: ${articles.length}`);
console.log(
  `Exact-duplicate groups collapsed: ${collapsed.length} -> ${JSON.stringify(
    collapsed.map((c) => c.id)
  )}`
);
console.log(
  `Genuine collisions resolved by suffixing: ${suffixed.length} -> ${JSON.stringify(
    suffixed.map((s) => `${s.originalId} -> ${s.newId}`)
  )}`
);
console.log(`Expected files after resolution: ${resolved.length}`);
console.log(`Verified: ${verifiedCount}/${resolved.length}`);
console.log(`Missing files: ${missing.length}${missing.length ? " -> " + missing.join(", ") : ""}`);
console.log(`Mismatched files: ${mismatches.length}${mismatches.length ? " -> " + mismatches.join(", ") : ""}`);
console.log(`Bytes compared (on-disk, verified files): ${bytesCompared}`);
console.log(`Bytes in resolved content fields (post-collapse, ${resolved.length} entries): ${bytesInResolvedEntries}`);
console.log(`Bytes in raw source content fields (all ${articles.length} entries, pre-collapse): ${bytesInSourceAllEntries}`);

const delta = bytesInResolvedEntries - bytesCompared;
if (delta !== 0) {
  console.log(
    `Byte delta vs resolved total: ${delta} (expected to be non-zero only if some files are missing/mismatched; ` +
      `a delta with zero missing/mismatched would indicate an encoding issue such as ` +
      `template-literal escape sequences resolving differently between runs)`
  );
}

if (missing.length > 0 || mismatches.length > 0) {
  console.error(
    `FAIL: ${missing.length} missing, ${mismatches.length} mismatched out of ${resolved.length}.`
  );
  process.exit(1);
}

console.log(`${verifiedCount}/${resolved.length} byte-identical`);
process.exit(0);
