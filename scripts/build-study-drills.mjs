import {
  mkdir,
  readFile,
  writeFile,
  rename,
  unlink,
  readdir,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { families as cash } from "./study-drills/cash-families.mjs";
import { families as investing } from "./study-drills/investing-families.mjs";
import { families as economics } from "./study-drills/economics-families.mjs";
import {
  buildPractice,
  buildFlashcard,
} from "./study-drills/unit-overrides.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const families = [...cash, ...investing, ...economics];
const normalize = (value) =>
  value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
const taxonomy = await readJson("src/data/study-units.json");
const routing = await readJson("scripts/study-drills/unit-routing.json");
const vocabularyMigration = await readJson(
  "scripts/study-drills/vocabulary-migration.json",
);
const previousCatalog = await readJson("src/data/flashcard-drill-catalog.json");
assert(
  cash.length === 85 && investing.length === 85 && economics.length === 80,
  "Expected 85 + 85 + 80 exercise families",
);
assert(
  new Set(families.map((family) => family.id)).size === 250,
  "Family identifiers must be unique",
);

const originalFiles = [
  "pf_bank_modules_1of6.json",
  "econ_grouped_by_module_unit_with_choices.json",
  "practice-personal-finance-expansion.json",
  "practice-economics-expansion.json",
];
const previousPrompts = new Set();
for (const file of originalFiles) {
  const bank = JSON.parse(await readFile(resolve(root, "data", file), "utf8"));
  for (const topics of Object.values(bank))
    for (const levels of Object.values(topics)) {
      for (const question of Object.values(levels).flat())
        previousPrompts.add(normalize(question.question));
    }
}

const banks = Object.fromEntries(
  Object.entries(taxonomy.practice).map(([category, topics]) => [
    category,
    Object.fromEntries(
      topics.map((topic) => [topic, { easy: [], medium: [], hard: [] }]),
    ),
  ]),
);
const cards = Object.fromEntries(taxonomy.flashcards.map((unit) => [unit, []]));
const prompts = new Set(previousPrompts);
const flashcardPrompts = new Set(
  Object.values(await readJson("src/data/flashcard-expansion.json"))
    .flat()
    .map((card) => normalize(card.definition)),
);
const calculationMigration = {};
let generated = 0;

function validate(result, id) {
  const { question, answer, distractors, explanation, numericAnswer } = result;
  assert(Number.isFinite(numericAnswer?.value), `Missing finite answer: ${id}`);
  assert(
    [question, answer, explanation, ...distractors].every(
      (text) =>
        typeof text === "string" &&
        text.trim() === text &&
        text.length > 0 &&
        !/\b(?:undefined|NaN|Infinity|TODO|FIXME)\b/.test(text),
    ),
    `Invalid text: ${id}`,
  );
  assert(explanation.length >= 30, `Missing worked explanation: ${id}`);
  assert(
    distractors.length === 3 &&
      new Set([answer, ...distractors].map(normalize)).size === 4,
    `Ambiguous options: ${id}`,
  );
}

for (const family of families) {
  assert(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(family.id),
    `Unsafe family id: ${family.id}`,
  );
  const route = routing[family.id];
  assert(
    route && taxonomy.practice[route.category]?.includes(route.topic),
    `Unknown practice unit: ${family.id}`,
  );
  assert(
    taxonomy.flashcards.includes(route.flashcardUnit),
    `Unknown flashcard unit: ${family.id}`,
  );
  assert(
    ["easy", "medium", "hard"].includes(family.difficulty),
    `Unknown difficulty: ${family.id}`,
  );
  const topic = banks[route.category][route.topic];
  const unit = cards[route.flashcardUnit];
  if (!route.rewrittenFlashcards)
    calculationMigration[family.id] = {
      fromUnit: family.topic,
      toUnit: route.flashcardUnit,
    };
  for (let variant = 0; variant < 20; variant++) {
    const original = family.build(variant);
    const practice = buildPractice(family, variant, original);
    const flashcard = buildFlashcard(family, variant, original);
    assert(
      JSON.stringify(practice) ===
        JSON.stringify(buildPractice(family, variant, family.build(variant))),
      `Non-deterministic practice family: ${family.id}`,
    );
    assert(
      JSON.stringify(flashcard) ===
        JSON.stringify(buildFlashcard(family, variant, family.build(variant))),
      `Non-deterministic flashcard family: ${family.id}`,
    );
    const id = `drill-${family.id}-${String(variant + 1).padStart(2, "0")}`;
    validate(practice, `practice ${id}`);
    validate(flashcard, `flashcard ${id}`);
    const { question, answer, distractors, explanation } = practice;
    assert(
      !prompts.has(normalize(question)),
      `Repeated question: ${id}: ${question}`,
    );
    prompts.add(normalize(question));
    assert(
      !flashcardPrompts.has(normalize(flashcard.question)),
      `Repeated flashcard: ${id}`,
    );
    flashcardPrompts.add(normalize(flashcard.question));
    const choices = [...distractors];
    choices.splice(variant % 4, 0, answer);
    topic[family.difficulty].push({
      id,
      question,
      choices,
      answer,
      explanation,
      familyId: family.id,
    });
    unit.push({
      id,
      kind: "calculation",
      term: flashcard.answer,
      definition: flashcard.question,
      distractors: flashcard.distractors,
      explanation: flashcard.explanation,
      numericAnswer: flashcard.numericAnswer,
    });
    generated++;
  }
}
assert(generated === 5000, `Expected 5,000 exercises, found ${generated}`);
assert(
  Object.keys(cards).length === 12,
  "Expected the original 12 flashcard units",
);
assert(
  Object.keys(routing).length === families.length,
  "Every family needs exactly one routing record",
);

// Resolve every authoring input before updating any generated files.
const sources = {};
for (const name of ["cash", "investing", "economics"]) {
  sources[name] = JSON.parse(
    await readFile(
      resolve(root, `scripts/study-drills/${name}-sources.json`),
      "utf8",
    ),
  );
}

async function save(relative, data) {
  const path = resolve(root, relative);
  const serialized = JSON.stringify(data, null, 2) + "\n";
  if (checkOnly) {
    assert(
      (await readFile(path, "utf8")) === serialized,
      `Generated content is out of date: ${relative}`,
    );
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(`${path}.tmp`, serialized);
  await rename(`${path}.tmp`, path);
}
await save("data/practice-drills-personal-finance.json", {
  "Personal Finance": banks["Personal Finance"],
});
await save("data/practice-drills-economics.json", {
  Economics: banks.Economics,
});
const catalog = {};
for (const [topic, items] of Object.entries(cards)) {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const path = `data/flashcard-drills/${slug}.json`;
  await save(path, items);
  catalog[topic] = { count: items.length, path: `/${path}` };
}
await save("src/data/flashcard-drill-catalog.json", catalog);
await save("src/data/flashcard-progress-migration.json", {
  vocabulary: vocabularyMigration,
  calculations: calculationMigration,
});
await save("src/data/study-drill-manifest.json", {
  addedOn: "2026-10-27",
  practiceQuestions: generated,
  flashcards: generated,
  reorganizedOn: "2026-10-29",
  familyCount: families.length,
  variantsPerFamily: 20,
  description:
    "Worked calculations with hypothetical inputs, organized only under the original practice and flashcard units. Each family has 20 deterministic variants. Practice and flashcard contexts differ where needed to fit their respective curricula.",
  families: families.map(({ id, difficulty }) => ({
    id,
    difficulty,
    ...routing[id],
  })),
  sources,
});
// Remove the superseded generated unit files, never unrelated files.
const currentPaths = new Set(Object.values(catalog).map((entry) => entry.path));
for (const { path } of Object.values(previousCatalog)) {
  if (currentPaths.has(path)) continue;
  assert(
    /^\/data\/flashcard-drills\/[a-z0-9-]+\.json$/.test(path),
    `Unexpected old path: ${path}`,
  );
  assert(!checkOnly, `Superseded flashcard file: ${path}`);
  await unlink(resolve(root, path.slice(1)));
}
const actualFiles = (await readdir(resolve(root, "data/flashcard-drills")))
  .filter((name) => name.endsWith(".json"))
  .sort();
const expectedFiles = [...currentPaths]
  .map((path) => path.split("/").at(-1))
  .sort();
assert(
  JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
  "Flashcard data directory does not match the original unit catalog",
);
console.log(
  `Built ${generated} practice questions and ${generated} flashcards in the original units from ${families.length} exercise families.`,
);
