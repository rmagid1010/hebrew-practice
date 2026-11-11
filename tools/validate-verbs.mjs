// Checks every conjugation table for likely mistakes.
// Usage: node tools/validate-verbs.mjs        (exit code 1 if there are errors)
import { readFileSync } from 'node:fs';
import { checkVerb } from '../js/verbcheck.js';

const index = JSON.parse(readFileSync(new URL('../data/decks/index.json', import.meta.url)));
let errors = 0, warnings = 0, unreviewed = 0, verbs = 0;
for (const deck of index.filter((d) => d.kind === 'conjugation')) {
  const data = JSON.parse(readFileSync(new URL(`../data/decks/${deck.id}.json`, import.meta.url)));
  for (const v of data.verbs) {
    verbs++;
    const issues = checkVerb(v, data.binyanName);
    for (const i of issues) {
      if (i.where === 'review') { unreviewed++; continue; }
      if (i.level === 'error') errors++; else warnings++;
      console.log(`${i.level === 'error' ? 'ERROR' : 'warn '}  ${deck.id}/${v.id} [${i.where}] ${i.msg}`);
    }
  }
}
console.log(`\n${verbs} verbs checked: ${errors} error(s), ${warnings} warning(s), ${unreviewed} not yet reviewed by a native speaker.`);
process.exit(errors ? 1 : 0);
