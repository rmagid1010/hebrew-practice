// Checks scenarios: every model reply passes its own checklist and gender agreement, as a man and as a woman,
// and every character line agrees too. Usage: node tools/validate-scenarios.mjs
import { readFileSync } from 'node:fs';
import { setLexicon, checkAgreement } from '../js/gender.js';
import { checkElements } from '../js/hebrew.js';
import { fill, personaFor } from '../js/scenariocore.js';

const R = new URL('../data/', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, R), 'utf8'));
setLexicon(read('agree.json'));
const lessons = new Set(read('course.json').lessons.map((l) => l.id));
const { scenarios } = read('scenarios.json');
const errors = [];
const used = new Set();
let turns = 0;
for (const s of scenarios) {
  if (!lessons.has(s.lesson)) errors.push(`${s.id}: unknown lesson ${s.lesson}`);
  if (used.has(s.lesson)) errors.push(`${s.id}: lesson ${s.lesson} already has a scenario`);
  used.add(s.lesson);
  if (/[{}]/.test(s.title + s.he)) errors.push(`${s.id}: no templates in titles`);
  s.turns.forEach((t, i) => {
    const where = `${s.id} turn ${i + 1}`;
    for (const g of ['m', 'f']) {
      if (t.t === 'npc') {
        if (!s.cast[t.who]) errors.push(`${where}: unknown character "${t.who}"`);
        const line = fill(t.he, g);
        if (/[{}|]/.test(line)) errors.push(`${where}: broken template "${t.he}"`);
        for (const e of checkAgreement(line, { speaker: s.cast[t.who]?.g, to: g })) errors.push(`${where} [${g}] "${line}": ${e.msg}`);
      }
      if (t.t === 'you') {
        if (g === 'm') turns++;
        if (t.to && !s.cast[t.to]) errors.push(`${where}: unknown listener "${t.to}"`);
        const model = fill(t.model, g);
        if (/[{}|]/.test(model)) errors.push(`${where}: broken template "${t.model}"`);
        const persona = personaFor(s, i, g);
        for (const e of checkAgreement(model, persona)) errors.push(`${where} [${g}] model "${model}": ${e.msg}`);
        const miss = checkElements(model, t.elements).filter((r) => !r.ok).map((r) => r.label);
        if (miss.length) errors.push(`${where} [${g}] model "${model}" misses: ${miss.join(', ')}`);
      }
    }
  });
}
for (const id of lessons) if (!used.has(id)) errors.push(`lesson ${id} has no scenario`);
for (const e of errors) console.log('ERROR:', e);
console.log(`${scenarios.length} scenarios, ${turns} turns checked as ♂ and ♀: ${errors.length} error(s).`);
process.exit(errors.length ? 1 : 0);
