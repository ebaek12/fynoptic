import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { families as cash } from './study-drills/cash-families.mjs';
import { families as investing } from './study-drills/investing-families.mjs';
import { families as economics } from './study-drills/economics-families.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const families = [...cash, ...investing, ...economics];
const normalize = value => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(cash.length === 85 && investing.length === 85 && economics.length === 80, 'Expected 85 + 85 + 80 exercise families');
assert(new Set(families.map(family => family.id)).size === 250, 'Family identifiers must be unique');

const originalFiles = ['pf_bank_modules_1of6.json', 'econ_grouped_by_module_unit_with_choices.json', 'practice-personal-finance-expansion.json', 'practice-economics-expansion.json'];
const previousPrompts = new Set();
for (const file of originalFiles) {
  const bank = JSON.parse(await readFile(resolve(root, 'data', file), 'utf8'));
  for (const topics of Object.values(bank)) for (const levels of Object.values(topics)) {
    for (const question of Object.values(levels).flat()) previousPrompts.add(normalize(question.question));
  }
}

const banks = { 'Personal Finance': {}, Economics: {} };
const cards = {};
const prompts = new Set(previousPrompts);
let generated = 0;
for (const family of families) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(family.id), `Unsafe family id: ${family.id}`);
  assert(family.category in banks, `Unknown category: ${family.category}`);
  assert(['easy', 'medium', 'hard'].includes(family.difficulty), `Unknown difficulty: ${family.id}`);
  const topic = banks[family.category][family.topic] ??= { easy: [], medium: [], hard: [] };
  const unit = cards[family.topic] ??= [];
  for (let variant = 0; variant < 20; variant++) {
    const result = family.build(variant);
    assert(JSON.stringify(result) === JSON.stringify(family.build(variant)), `Non-deterministic family: ${family.id}`);
    const { question, answer, distractors, explanation, numericAnswer } = result;
    const id = `drill-${family.id}-${String(variant + 1).padStart(2, '0')}`;
    assert(!prompts.has(normalize(question)), `Repeated question: ${id}: ${question}`);
    prompts.add(normalize(question));
    assert(Number.isFinite(numericAnswer?.value), `Missing finite answer: ${id}`);
    assert([question, answer, explanation, ...distractors].every(text => typeof text === 'string' && text.trim() === text && text.length > 0 && !/\b(?:undefined|NaN|Infinity|TODO|FIXME)\b/.test(text)), `Invalid text: ${id}`);
    assert(explanation.length >= 30, `Missing worked explanation: ${id}`);
    assert(distractors.length === 3 && new Set([answer, ...distractors].map(normalize)).size === 4, `Ambiguous options: ${id}`);
    const choices = [...distractors];
    choices.splice(variant % 4, 0, answer);
    topic[family.difficulty].push({ id, question, choices, answer, explanation, familyId: family.id });
    unit.push({ id, kind: 'calculation', term: answer, definition: question, distractors, explanation, numericAnswer });
    generated++;
  }
}
assert(generated === 5000, `Expected 5,000 exercises, found ${generated}`);
assert(Object.keys(cards).length === 30, 'Expected 30 drill topics');

// Resolve every authoring input before updating any generated files.
const sources = {};
for (const name of ['cash', 'investing', 'economics']) {
  sources[name] = JSON.parse(await readFile(resolve(root, `scripts/study-drills/${name}-sources.json`), 'utf8'));
}

async function save(relative, data) {
  const path = resolve(root, relative);
  const serialized = JSON.stringify(data, null, 2) + '\n';
  if (checkOnly) {
    assert(await readFile(path, 'utf8') === serialized, `Generated content is out of date: ${relative}`);
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(`${path}.tmp`, serialized);
  await rename(`${path}.tmp`, path);
}
await save('data/practice-drills-personal-finance.json', { 'Personal Finance': banks['Personal Finance'] });
await save('data/practice-drills-economics.json', { Economics: banks.Economics });
const catalog = {};
for (const [topic, items] of Object.entries(cards)) {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const path = `data/flashcard-drills/${slug}.json`;
  await save(path, items);
  catalog[topic] = { count: items.length, path: `/${path}` };
}
await save('src/data/flashcard-drill-catalog.json', catalog);
await save('src/data/study-drill-manifest.json', {
  addedOn: '2026-10-27', practiceQuestions: generated, flashcards: generated,
  familyCount: families.length, variantsPerFamily: 20,
  description: 'Worked calculation drills with hypothetical inputs. Each exercise family has 20 deterministic input variants, available as a practice question and a matching question-and-answer flashcard.',
  families: families.map(({ id, category, topic, difficulty }) => ({ id, category, topic, difficulty })),
  sources,
});
console.log(`Built ${generated} practice questions and ${generated} flashcards across ${Object.keys(cards).length} topics from ${families.length} exercise families.`);
