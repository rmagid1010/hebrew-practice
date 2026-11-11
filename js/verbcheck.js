// Binyan "signature shapes" and an automatic checker for conjugation tables.
// Pure module (no DOM, no storage) so it runs both in the browser and in Node (tools/validate-verbs.mjs).
import { stripNiqqud } from './hebrew.js';

const FINAL_TO_REGULAR = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const REGULAR_TO_FINAL = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
const MARKS = /[֑-ׇ]/;

/** Letters only, final forms turned into regular ones (for comparing skeletons). */
export function skeleton(s) {
  return stripNiqqud(s).replace(/[^א-ת]/g, '').replace(/[ךםןףץ]/g, (c) => FINAL_TO_REGULAR[c]);
}

export function rootLetters(root) {
  return skeleton(root).split('');
}

/** Apply final-letter forms to a plain letter string. */
export function withFinal(s) {
  if (!s) return s;
  const last = s[s.length - 1];
  return REGULAR_TO_FINAL[last] ? s.slice(0, -1) + REGULAR_TO_FINAL[last] : s;
}

export const BINYANIM = {
  "pa'al": { key: 'paal', he: 'פָּעַל', aliases: ['paal', 'pa al', 'pa\'al', 'qal', 'kal', 'פעל', 'קל'] },
  "nif'al": { key: 'nifal', he: 'נִפְעַל', aliases: ['nifal', 'niphal', 'nif al', 'נפעל'] },
  "pi'el": { key: 'piel', he: 'פִּיעֵל', aliases: ['piel', 'pi el', 'פיעל', 'פעל דגוש'] },
  "pu'al": { key: 'pual', he: 'פּוּעַל', aliases: ['pual', 'pu al', 'פועל'] },
  "hif'il": { key: 'hifil', he: 'הִפְעִיל', aliases: ['hifil', 'hiphil', 'hif il', 'הפעיל'] },
  "huf'al": { key: 'hufal', he: 'הוּפְעַל', aliases: ['hufal', 'hofal', 'huf al', 'הופעל', 'הפעל'] },
  "hitpa'el": { key: 'hitpael', he: 'הִתְפַּעֵל', aliases: ['hitpael', 'hitpa el', 'התפעל'] },
};

/** Normalize a typed binyan name; returns the canonical name or null. */
export function matchBinyan(input) {
  const raw = (input || '').trim();
  const latin = raw.toLowerCase().replace(/[’'`ʼ\-\s]/g, '');
  const heb = stripNiqqud(raw).replace(/[^א-ת]/g, '');
  for (const [name, b] of Object.entries(BINYANIM)) {
    for (const a of b.aliases) {
      if (/[א-ת]/.test(a)) { if (heb && heb === a) return name; }
      else if (latin === a.replace(/[’'`\-\s]/g, '')) return name;
    }
    if (latin === b.key) return name;
  }
  return null;
}

/**
 * Signature shapes per binyan and tense.
 *  say:  how it sounds, with 1-2-3 standing for the root letters
 *  spell: how it's written in modern full spelling (ktiv male), 1-2-3 = root letters
 *  form: which person the shape is shown for
 */
export const SHAPES = {
  "pa'al": {
    inf: { say: 'li·12o3', spell: 'ל12ו3', form: 'infinitive' },
    present: { say: '1o·2e3', spell: '1ו23', form: 'he / m. sing.' },
    past: { say: '1a·2a3', spell: '123', form: 'he' },
    future: { say: 'yi·12o3', spell: 'י12ו3', form: 'he' },
  },
  "nif'al": {
    inf: { say: 'lehi·1a·2e3', spell: 'להי123', form: 'infinitive' },
    present: { say: 'ni·12a3', spell: 'נ123', form: 'he / m. sing.' },
    past: { say: 'ni·12a3', spell: 'נ123', form: 'he' },
    future: { say: 'yi·1a·2e3', spell: 'יי123', form: 'he' },
  },
  "pi'el": {
    inf: { say: 'le·1a·2e3', spell: 'ל123', form: 'infinitive' },
    present: { say: 'me·1a·2e3', spell: 'מ123', form: 'he / m. sing.' },
    past: { say: '1i·2e3', spell: '1י23', form: 'he' },
    future: { say: 'ye·1a·2e3', spell: 'י123', form: 'he' },
  },
  "hif'il": {
    inf: { say: 'leha·12i3', spell: 'לה12י3', form: 'infinitive' },
    present: { say: 'ma·12i3', spell: 'מ12י3', form: 'he / m. sing.' },
    past: { say: 'hi·12i3', spell: 'ה12י3', form: 'he' },
    future: { say: 'ya·12i3', spell: 'י12י3', form: 'he' },
  },
  "hitpa'el": {
    inf: { say: 'lehit·1a·2e3', spell: 'להת123', form: 'infinitive' },
    present: { say: 'mit·1a·2e3', spell: 'מת123', form: 'he / m. sing.' },
    past: { say: 'hit·1a·2e3', spell: 'הת123', form: 'he' },
    future: { say: 'yit·1a·2e3', spell: 'ית123', form: 'he' },
  },
};

/** Which form of a verb the shape is shown on. */
export const SHAPE_SLOT = { inf: null, present: 'ms', past: '3ms', future: '3ms' };

/** Fill a spelling skeleton with root letters (handles hitpa'el's ת swap). */
export function fillShape(spell, root, binyan) {
  const [a, b, c] = rootLetters(root);
  let s = spell.replace('1', a).replace('2', b).replace('3', c);
  if (binyan === "hitpa'el" && 'סשצז'.includes(a)) {
    const t = a === 'צ' ? 'ט' : a === 'ז' ? 'ד' : 'ת';
    s = s.replace('ת' + a, a + t);
  }
  return s;
}

/** Shape skeleton with blanks, for display: "מ _ _ _". */
export function shapeBlanks(spell) {
  return spell.replace(/[123]/g, '_');
}

const PERSON_SUFFIX = {
  past: { '1s': ['תי'], '2ms': ['ת'], '2fs': ['ת'], '3fs': ['ה'], '1p': ['נו'], '2mp': ['תמ'], '3p': ['ו'] },
  future: {
    '1s': { pre: 'א' }, '2ms': { pre: 'ת' }, '2fs': { pre: 'ת', suf: 'י' }, '3ms': { pre: 'י' },
    '3fs': { pre: 'ת' }, '1p': { pre: 'נ' }, '2mp': { pre: 'ת', suf: 'ו' }, '3p': { pre: 'י', suf: 'ו' },
  },
  present: { mp: ['ימ'], fp: ['ות'], fs: ['ת', 'ה'] },
};

const WEAK_SKIP = { 'ל״ה': [2], 'ע״ו': [1], 'ע״י': [1], 'פ״נ': [0], 'פ״י': [0] };

function isSubsequence(needle, hay) {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
}

/**
 * Check one verb. Returns a list of { level: 'error'|'warn', where, msg }.
 * Errors are things that are almost certainly wrong; warnings need a human look.
 */
export function checkVerb(v, binyan) {
  const out = [];
  const add = (level, where, msg) => out.push({ level, where, msg });
  const root = rootLetters(v.root || '');
  if (root.length !== 3) add('warn', 'root', `Root "${v.root}" does not have 3 letters — check it, and the shape tests that use it.`);
  const skip = WEAK_SKIP[v.weak] || [];
  const coreRoot = root.filter((_, i) => !skip.includes(i));

  const all = [['inf', 'inf', v.inf]];
  for (const [tense, forms] of Object.entries(v.forms || {})) {
    for (const [p, f] of Object.entries(forms)) all.push([tense, p, Array.isArray(f) ? f[0] : f, Array.isArray(f) ? f.slice(1) : []]);
  }

  for (const [tense, p, main, alts = []] of all) {
    const where = `${tense}${p !== 'inf' ? ' ' + p : ''}`;
    if (!main) { add('error', where, 'Missing form.'); continue; }
    if (!MARKS.test(main)) add('error', where, `"${main}" has no vowel points — every main form should be pointed.`);
    const plain = stripNiqqud(main);
    if (/[^א-ת׳ ]/.test(plain)) add('error', where, `"${main}" contains unexpected characters.`);
    for (const word of plain.split(' ')) {
      if (/[ךםןףץ]./.test(word)) add('error', where, `"${main}": a final letter (ך ם ן ף ץ) appears in the middle of a word.`);
      if (/[כמנפצ]$/.test(word)) add('error', where, `"${main}": word ends with כ/מ/נ/פ/צ instead of its final form.`);
    }
    for (const a of alts) {
      if (MARKS.test(a)) add('warn', where, `Accepted alternative "${a}" is pointed — alternatives are usually plain spellings.`);
    }
    const sk = skeleton(main);
    if (coreRoot.length && !isSubsequence(coreRoot, sk)) {
      add(v.weak ? 'warn' : 'error', where, `"${main}": root letters ${coreRoot.join('־')} don't all appear in order.`);
    }
    // person markers
    if (tense === 'past' && PERSON_SUFFIX.past[p]) {
      const ok = PERSON_SUFFIX.past[p].some((s) => sk.endsWith(s)) || (p === '1p' && sk.endsWith('נו'));
      if (!ok) add('error', where, `"${main}": past "${p}" should end in ${PERSON_SUFFIX.past[p].join(' / ')}.`);
    }
    if (tense === 'future' && PERSON_SUFFIX.future[p]) {
      const { pre, suf } = PERSON_SUFFIX.future[p];
      if (!sk.startsWith(pre)) add('error', where, `"${main}": future "${p}" should start with ${pre}.`);
      if (suf && !sk.endsWith(suf)) add('error', where, `"${main}": future "${p}" should end with ${suf}.`);
    }
    if (tense === 'present' && PERSON_SUFFIX.present[p]) {
      if (!PERSON_SUFFIX.present[p].some((s) => sk.endsWith(s))) add('error', where, `"${main}": present "${p}" should end in ${PERSON_SUFFIX.present[p].join(' / ')}.`);
    }
  }

  // Agreement: future "you (m)" and "she" are identical.
  const fut = v.forms?.future;
  if (fut?.['2ms'] && fut?.['3fs']) {
    const a = Array.isArray(fut['2ms']) ? fut['2ms'][0] : fut['2ms'];
    const b = Array.isArray(fut['3fs']) ? fut['3fs'][0] : fut['3fs'];
    if (a !== b) add('error', 'future', `"you (m)" (${a}) and "she" (${b}) should be identical.`);
  }

  // Binyan signature shape — only meaningful for regular (strong) roots.
  const shapes = SHAPES[binyan];
  if (shapes && !v.weak && root.length === 3) {
    for (const tense of ['inf', 'present', 'past', 'future']) {
      const slot = SHAPE_SLOT[tense];
      const form = tense === 'inf' ? v.inf : v.forms?.[tense]?.[slot];
      if (!form) continue;
      const main = Array.isArray(form) ? form[0] : form;
      const expected = skeleton(fillShape(shapes[tense].spell, v.root, binyan));
      if (skeleton(main) !== expected) add('warn', `${tense}${slot ? ' ' + slot : ''}`, `"${main}" doesn't match the ${binyan} ${tense} shape (${withFinal(expected)}). Fine if the verb has a guttural or is irregular — otherwise check it, or mark the verb as weak.`);
    }
  }
  if (!v.review || v.review.status !== 'checked') add('warn', 'review', 'Not yet checked by a native speaker or teacher.');
  return out;
}
