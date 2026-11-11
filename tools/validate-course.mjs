// Checks the course: every referenced item exists, and every sentence / writing task only builds on
// words taught in the same or an earlier lesson.   Usage: node tools/validate-course.mjs
import { readFileSync } from 'node:fs';
import { lessonKeys } from '../js/coursecore.js';
import { checkElements } from '../js/hebrew.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url)));
const index = read('decks/index.json');
const decks = {};
const verbData = {};
const allKeys = new Set();
for (const d of index) {
  const data = read(`decks/${d.id}.json`);
  decks[d.id] = data;
  if (d.kind === 'conjugation') {
    verbData[d.id] = data;
    for (const v of data.verbs) {
      allKeys.add(`${d.id}/${v.id}-inf`); allKeys.add(`${d.id}/${v.id}-root`); allKeys.add(`${d.id}/${v.id}-binyan`);
      for (const [t, forms] of Object.entries(v.forms)) for (const p of Object.keys(forms)) allKeys.add(`${d.id}/${v.id}-${t}-${p}`);
    }
    for (const t of ['inf', 'present', 'past', 'future']) allKeys.add(`${d.id}/shape-${t}`);
  } else for (const it of data.items) allKeys.add(`${d.id}/${it.id}`);
}
const itemOf = (key) => { const [d, id] = key.split('/'); return decks[d]?.items?.find((i) => i.id === id); };

const course = read('course.json');
let errors = 0, warnings = 0;
const taught = new Map(); // key -> lesson index
course.lessons.forEach((lesson, li) => {
  const { keys, errors: e } = lessonKeys(lesson, verbData);
  for (const msg of e) { errors++; console.log(`ERROR ${lesson.id}: ${msg}`); }
  for (const k of keys) {
    if (!allKeys.has(k)) { errors++; console.log(`ERROR ${lesson.id}: unknown item ${k}`); continue; }
    if (taught.has(k) && !k.includes('/shape-')) { warnings++; console.log(`warn  ${lesson.id}: ${k} already taught in lesson ${taught.get(k) + 1}`); }
    if (!taught.has(k)) taught.set(k, li);
  }
});
course.lessons.forEach((lesson, li) => {
  for (const k of [...(lesson.phrases || []), ...(lesson.write || [])]) {
    const it = itemOf(k);
    for (const r of it?.req || []) {
      if (!allKeys.has(r)) { errors++; console.log(`ERROR ${lesson.id}: ${k} needs unknown item ${r}`); }
      else if (!taught.has(r)) { errors++; console.log(`ERROR ${lesson.id}: ${k} needs ${r}, which no lesson teaches`); }
      else if (taught.get(r) > li) { errors++; console.log(`ERROR ${lesson.id}: ${k} needs ${r}, taught later in lesson ${taught.get(r) + 1}`); }
    }
  }
});
// Writing tasks: models must pass their own checklist; every word / verb stage of a lesson must be written in that
// lesson's tasks; tasks marked needsPrior must also use something from an earlier lesson.
let tasks = 0;
course.lessons.forEach((lesson, li) => {
  const covered = new Set();
  for (const k of lesson.write || []) {
    const t = itemOf(k);
    if (!t) continue;
    tasks++;
    const res = checkElements(t.models[0], t.elements || []);
    for (const r of res) if (!r.ok) { errors++; console.log(`ERROR ${lesson.id}: ${k} model answer doesn't contain "${r.label}" (${r.any.join(' / ')})`); }
    for (const c of t.covers || t.req || []) covered.add(c);
    if (t.needsPrior && li > 0 && !(t.covers || []).some((c) => taught.has(c) && taught.get(c) < li)) {
      errors++; console.log(`ERROR ${lesson.id}: ${k} doesn't reuse anything from an earlier lesson`);
    }
  }
  for (const k of lesson.items) if (!covered.has(k)) { errors++; console.log(`ERROR ${lesson.id}: word ${k} is not used in any writing task`); }
  for (const ref of lesson.verbs || []) {
    const [deckVerb, stage] = ref.split('@');
    const tense = ['present', 'past', 'future', 'imp'].includes(stage) ? stage : null;
    const ok = [...covered].some((c) => c.startsWith(deckVerb + '-') && (!tense || c.startsWith(`${deckVerb}-${tense}-`)));
    if (!ok) { errors++; console.log(`ERROR ${lesson.id}: verb stage ${ref} is not practised in any writing task`); }
  }
});

console.log(`\n${tasks} writing tasks checked.`);
console.log(`\n${course.lessons.length} lessons, ${taught.size} items taught: ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
