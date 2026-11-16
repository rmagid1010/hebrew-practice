// Checks gender content: noun genders, ♂/♀ versions, and that every Hebrew answer agrees with itself.
// Usage: node tools/validate-gender.mjs
import { readFileSync } from 'node:fs';
import { setLexicon, checkAgreement, facesOf, personaOf, whoLabel } from '../js/gender.js';
import { checkElements } from '../js/hebrew.js';

const R = new URL('../data/', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, R), 'utf8'));
setLexicon(read('agree.json'));
const index = read('decks/index.json');
const errors = [], warnings = [];
let nouns = 0, versions = 0, checked = 0;

for (const meta of index) {
  if (meta.kind === 'conjugation' || meta.kind === 'cursive') continue;
  const kind = meta.kind === 'sentences' ? 'sentence' : meta.kind === 'write' ? 'write' : 'vocab';
  for (const raw of read(`decks/${meta.id}.json`).items) {
    const it = { ...raw, kind, deck: meta.id };
    const where = `${meta.id}/${it.id}`;
    if (it.g) {
      nouns++;
      if (!['m', 'f', 'mp', 'fp'].includes(it.g)) errors.push(`${where}: bad gender "${it.g}"`);
    }
    for (const [h] of it.ex || []) { checked++; for (const e of checkAgreement(h)) errors.push(`${where} example "${h}": ${e.msg}`); }
    if (it.v?.length) {
      const faces = facesOf(it);
      versions += faces.length;
      const labels = new Set();
      for (const f of faces) {
        const persona = personaOf(f.w);
        if (f.w && !whoLabel(f.w)) errors.push(`${where}: unknown version code "${f.w}"`);
        if (labels.has(f.w + f.en)) errors.push(`${where}: two versions for "${f.w}"`);
        labels.add(f.w + f.en);
        const texts = kind === 'write' ? f.models || [] : [f.he, ...f.alt];
        for (const t of texts) {
          checked++;
          for (const e of checkAgreement(t, persona)) errors.push(`${where} [${f.w}] "${t}": ${e.msg}`);
          if (kind === 'write') {
            const miss = checkElements(t, it.elements || []).filter((r) => !r.ok).map((r) => r.label);
            if (miss.length) errors.push(`${where} [${f.w}] model "${t}" misses: ${miss.join(', ')}`);
          }
        }
      }
      if (kind === 'write' && !faces.every((f) => personaOf(f.w).speaker)) errors.push(`${where}: every writing version needs a writer gender (m / f)`);
    } else {
      // No versions: the Hebrew must not depend on who speaks or who listens.
      const texts = kind === 'write' ? it.models || [] : [it.he, ...(it.alt || [])];
      for (const t of texts) {
        checked++;
        if (!t) continue;
        for (const e of checkAgreement(t)) errors.push(`${where} "${t}": ${e.msg}`);
        if (checkAgreement(t, { speaker: 'f' }).length || checkAgreement(t, { speaker: 'm' }).length) errors.push(`${where} "${t}": depends on the speaker's gender — add ♂/♀ versions (tools/gender/variants.py)`);
        else if (checkAgreement(t, { to: 'f' }).length || checkAgreement(t, { to: 'm' }).length) errors.push(`${where} "${t}": depends on who is addressed — add versions (tools/gender/variants.py)`);
      }
      if (kind === 'write') errors.push(`${where}: writing task has no writer persona`);
    }
  }
}
for (const w of warnings) console.log('warning:', w);
for (const e of errors) console.log('ERROR:', e);
console.log(`${nouns} nouns with gender, ${versions} gendered versions, ${checked} Hebrew texts checked: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
