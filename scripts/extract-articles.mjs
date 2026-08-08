// Extracts articles from js/articles-data.js into src/articles/*.html + src/data/articles.ts
// Evaluates the source in a Node VM (with a `window` shim) so any template-literal
// interpolation in the source text is resolved exactly as it would be in the browser.
// Never runs the content through a markdown processor — content is raw HTML, written verbatim.
//
// js/articles-data.js has a preexisting bug: 327 pushed entries resolve to only 242
// unique ids. Since this is a live-site bug (articles.js does a `.find()` by id, so the
// second entry under a duplicate id is already unreachable in production), we do not
// touch js/articles-data.js — collisions are resolved here, in memory, before writing:
//   - Exact duplicates (same id, same title, same content, byte-for-byte) collapse to
//     one kept entry; the repeat(s) are skipped. Verified by exact string equality, not
//     just a hash or title/id match.
//   - Genuine collisions (same id, but different title and/or content) keep every
//     distinct variant. The first-seen variant keeps the original id; each subsequent
//     distinct variant gets the id suffixed with -2, -3, etc.
// `resolveCollisions` is exported so verify-articles.mjs can apply the identical policy
// independently, without the two scripts drifting apart.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

export const sourcePath = path.join(repoRoot, "js", "articles-data.js");
const articlesDir = path.join(repoRoot, "src", "articles");
const dataDir = path.join(repoRoot, "src", "data");
const dataTsPath = path.join(dataDir, "articles.ts");

export function truncate(str, n = 120) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

/** Fresh VM evaluation of js/articles-data.js. Returns window.ARTICLES. */
export function evaluateArticles(code, filename = sourcePath) {
  const ctx = createContext({ window: {} });
  runInContext(code, ctx, { filename });
  return ctx.window.ARTICLES;
}

/**
 * Resolves duplicate/colliding ids per the policy described above.
 * Input: the raw array of {id, title, content} as evaluated from the source (in order).
 * Output: { resolved, collapsed, suffixed }
 *   - resolved: final list of {id, title, content, originalIndex} in original source
 *     order (ordered by each kept variant's first-occurrence index).
 *   - collapsed: [{ id, keptIndex, skippedIndices }] — exact-duplicate groups collapsed.
 *   - suffixed: [{ originalId, newId, index }] — genuine collisions renamed.
 */
export function resolveCollisions(articles) {
  const groups = new Map(); // origId -> [{ title, content, indices: [] }]

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (!groups.has(a.id)) groups.set(a.id, []);
    const variants = groups.get(a.id);
    const variant = variants.find(
      (v) => v.title === a.title && v.content === a.content
    );
    if (variant) {
      variant.indices.push(i);
    } else {
      variants.push({ title: a.title, content: a.content, indices: [i] });
    }
  }

  const resolved = [];
  const collapsed = [];
  const suffixed = [];

  for (const [origId, variants] of groups) {
    variants.forEach((v, vi) => {
      const newId = vi === 0 ? origId : `${origId}-${vi + 1}`;
      if (vi > 0) {
        suffixed.push({ originalId: origId, newId, index: v.indices[0] });
      }
      if (v.indices.length > 1) {
        collapsed.push({
          id: newId,
          keptIndex: v.indices[0],
          skippedIndices: v.indices.slice(1),
        });
      }
      resolved.push({
        id: newId,
        title: v.title,
        content: v.content,
        originalIndex: v.indices[0],
      });
    });
  }

  resolved.sort((a, b) => a.originalIndex - b.originalIndex);

  return { resolved, collapsed, suffixed };
}

/** Validates (post-resolution) id format/uniqueness and required fields. Throws on failure. */
export function validateResolved(resolved) {
  const idPattern = /^[a-z0-9-]+$/;
  const seenIds = new Map();

  for (let i = 0; i < resolved.length; i++) {
    const a = resolved[i];

    if (typeof a.id !== "string" || a.id.length === 0) {
      throw new Error(
        `Resolved entry at index ${i} has invalid/missing id: ${truncate(
          JSON.stringify(a)
        )}`
      );
    }
    if (typeof a.title !== "string" || a.title.length === 0) {
      throw new Error(
        `Resolved entry at index ${i} (id="${a.id}") has invalid/missing title: ${truncate(
          JSON.stringify(a)
        )}`
      );
    }
    if (typeof a.content !== "string") {
      throw new Error(
        `Resolved entry at index ${i} (id="${a.id}") has non-string content: ${truncate(
          JSON.stringify(a)
        )}`
      );
    }
    if (!idPattern.test(a.id)) {
      throw new Error(
        `Resolved entry at index ${i} has an id with unsafe characters for a URL segment: "${a.id}"`
      );
    }
    if (seenIds.has(a.id)) {
      const firstIdx = seenIds.get(a.id);
      throw new Error(
        `Duplicate id "${a.id}" survived collision resolution, found at resolved indices ${firstIdx} and ${i}. ` +
          `This should be impossible — collision resolution has a bug.`
      );
    }
    seenIds.set(a.id, i);
  }
}

function main() {
  const code = readFileSync(sourcePath, "utf8");
  const articles = evaluateArticles(code);

  if (!Array.isArray(articles) || articles.length !== 327) {
    throw new Error(
      `Expected window.ARTICLES to be an array of exactly 327 entries, got ${
        Array.isArray(articles) ? `array of ${articles.length}` : typeof articles
      }`
    );
  }

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (!a || typeof a !== "object") {
      throw new Error(`Entry at index ${i} is not an object: ${truncate(JSON.stringify(a))}`);
    }
    if (typeof a.id !== "string" || a.id.length === 0) {
      throw new Error(`Entry at index ${i} has invalid/missing id: ${truncate(JSON.stringify(a))}`);
    }
    if (typeof a.title !== "string" || a.title.length === 0) {
      throw new Error(
        `Entry at index ${i} (id="${a.id}") has invalid/missing title: ${truncate(JSON.stringify(a))}`
      );
    }
    if (typeof a.content !== "string") {
      throw new Error(
        `Entry at index ${i} (id="${a.id}") has non-string content: ${truncate(JSON.stringify(a))}`
      );
    }
  }

  const { resolved, collapsed, suffixed } = resolveCollisions(articles);
  validateResolved(resolved);

  mkdirSync(articlesDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });

  let totalBytes = 0;
  const metaEntries = [];

  for (const a of resolved) {
    const filePath = path.join(articlesDir, `${a.id}.html`);
    writeFileSync(filePath, a.content, "utf8");
    totalBytes += Buffer.byteLength(a.content, "utf8");
    metaEntries.push({ id: a.id, title: a.title });
  }

  const tsLines = [];
  tsLines.push("// GENERATED by scripts/extract-articles.mjs — do not edit by hand");
  tsLines.push("export interface ArticleMeta {");
  tsLines.push("  id: string;");
  tsLines.push("  title: string;");
  tsLines.push("}");
  tsLines.push("");
  tsLines.push("export const ARTICLE_META: ArticleMeta[] = [");
  for (const m of metaEntries) {
    tsLines.push(`  { id: ${JSON.stringify(m.id)}, title: ${JSON.stringify(m.title)} },`);
  }
  tsLines.push("];");
  tsLines.push("");

  writeFileSync(dataTsPath, tsLines.join("\n"), "utf8");

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
  console.log(`Final files written: ${resolved.length}`);
  console.log(`Total bytes written to src/articles/*.html: ${totalBytes}`);
  console.log(`Wrote src/data/articles.ts with ${metaEntries.length} ArticleMeta entries.`);
}

// Only run the extraction (with its file-writing side effects) when this file is
// executed directly — importing it (e.g. from verify-articles.mjs) to reuse
// resolveCollisions() must not trigger a write.
if (process.argv[1] === __filename) {
  main();
}
