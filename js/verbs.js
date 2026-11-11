// Verb course: stages, unlock rules and test formats for conjugation decks.
import * as store from './store.js';
import { SHAPES, SHAPE_SLOT, fillShape, withFinal, skeleton } from './verbcheck.js';
import { stripNiqqud } from './hebrew.js';

export const STAGES = [
  { n: 1, key: 'meaning', label: 'Meaning', short: 'Inf.' },
  { n: 2, key: 'binyan', label: 'Root & binyan', short: 'Binyan' },
  { n: 3, key: 'present', label: 'Present', short: 'Pres.' },
  { n: 4, key: 'past', label: 'Past', short: 'Past' },
  { n: 5, key: 'future', label: 'Future', short: 'Fut.' },
  { n: 6, key: 'imp', label: 'Commands', short: 'Cmd.' },
];
export const TENSE_STAGE = { inf: 1, present: 3, past: 4, future: 5, imp: 6 };

export const PRONOUN = {
  '1s': 'אֲנִי', '2ms': 'אַתָּה', '2fs': 'אַתְּ', '3ms': 'הוּא', '3fs': 'הִיא', '1p': 'אֲנַחְנוּ', '2mp': 'אַתֶּם', '3p': 'הֵם',
  ms: 'הוּא', fs: 'הִיא', mp: 'הֵם', fp: 'הֵן',
};
export const PERSON_EN = {
  '1s': 'I', '2ms': 'you (m)', '2fs': 'you (f)', '3ms': 'he', '3fs': 'she', '1p': 'we', '2mp': 'you (pl)', '3p': 'they',
  ms: 'he (m. sing.)', fs: 'she (f. sing.)', mp: 'they (m. pl.)', fp: 'they (f. pl.)',
  'imp-ms': 'to a man', 'imp-fs': 'to a woman', 'imp-mp': 'to a group',
};
const TIME_WORD = { present: ['עַכְשָׁיו', 'now'], past: ['אֶתְמוֹל', 'yesterday'], future: ['מָחָר', 'tomorrow'] };
const IMP_CALL = { ms: ['דָּנִי', 'Dani'], fs: ['מִיכַל', 'Michal'], mp: ['חֶבְרֶ׳ה', 'guys'] };

// Which earlier form a "transform" card starts from.
const TRANSFORM_FROM = {
  present: { fs: ['present', 'ms'], mp: ['present', 'ms'], fp: ['present', 'fs'], ms: ['present', 'mp'] },
  past: { '1s': ['present', 'ms'], '2ms': ['present', 'ms'], '2fs': ['present', 'fs'], '3ms': ['present', 'ms'], '3fs': ['present', 'fs'], '1p': ['present', 'mp'], '2mp': ['present', 'mp'], '3p': ['present', 'mp'] },
  future: { '1s': ['past', '1s'], '2ms': ['past', '2ms'], '2fs': ['past', '2fs'], '3ms': ['past', '3ms'], '3fs': ['past', '3fs'], '1p': ['past', '1p'], '2mp': ['past', '2mp'], '3p': ['past', '3p'] },
};

/* ---------------- building the items for a conjugation deck ---------------- */

const PERSONS = { present: ['ms', 'fs', 'mp', 'fp'], past: ['1s', '2ms', '2fs', '3ms', '3fs', '1p', '2mp', '3p'], future: ['1s', '2ms', '2fs', '3ms', '3fs', '1p', '2mp', '3p'], imp: ['ms', 'fs', 'mp'] };

function first(f) { return Array.isArray(f) ? f[0] : f; }
function rest(f) { return Array.isArray(f) ? f.slice(1) : []; }

/** Turn a verb deck into an ordered list of items: stage by stage, verb by verb. */
export function expandVerbDeck(meta, data) {
  const binyan = data.binyanName;
  for (const v of data.verbs) { v.binyanName = binyan; v.deck = meta.id; }
  const regular = data.verbs.filter((v) => !v.weak);
  const model = regular[0] || data.verbs[0];
  const items = [];
  const base = { kind: 'conj', deck: meta.id };

  // Stage 1 — meaning: produce the infinitive.
  for (const v of data.verbs) items.push({ ...base, id: `${v.id}-inf`, sub: 'form', stage: 1, verb: v, tense: 'inf', person: null, he: v.inf, alt: [], en: `to ${v.en}` });

  // Stage 2 — root & binyan, plus the binyan's infinitive shape.
  items.push(sigItem(base, 'inf', model, binyan));
  for (const v of data.verbs) {
    items.push({ ...base, id: `${v.id}-root`, sub: 'root', stage: 2, verb: v, he: v.root, alt: [], en: `root of to ${v.en}` });
    items.push({ ...base, id: `${v.id}-binyan`, sub: 'binyan', stage: 2, verb: v, he: binyan, alt: [], en: `binyan of to ${v.en}` });
  }

  // Stages 3–6 — present, past, future, commands (each opens with its shape card).
  for (const tense of ['present', 'past', 'future', 'imp']) {
    if (tense !== 'imp') items.push(sigItem(base, tense, model, binyan));
    for (const v of data.verbs) {
      const forms = v.forms[tense];
      if (!forms) continue;
      for (const p of PERSONS[tense]) {
        if (!forms[p]) continue;
        items.push({
          ...base, id: `${v.id}-${tense}-${p}`, sub: 'form', stage: TENSE_STAGE[tense], verb: v, tense,
          person: tense === 'imp' ? `imp-${p}` : p, slot: p, he: first(forms[p]), alt: rest(forms[p]), en: v.en,
        });
      }
    }
  }
  return items;
}

function sigItem(base, tense, model, binyan) {
  const slot = SHAPE_SLOT[tense];
  const form = tense === 'inf' ? model.inf : first(model.forms[tense][slot]);
  return {
    ...base, id: `shape-${tense}`, sub: 'shape', stage: TENSE_STAGE[tense] === 1 ? 2 : TENSE_STAGE[tense],
    verb: model, tense, person: slot, slot, he: form, alt: [], en: `${binyan} ${tense === 'inf' ? 'infinitive' : tense} shape`,
    shape: SHAPES[binyan]?.[tense], binyan,
  };
}

/* ---------------- progress & unlocking ---------------- */

let cache = null;
store.onChange(() => { cache = null; });

/** "Proven": graduated to review AND survived at least one later review (or the fast setting is on). */
export function proven(cardId) {
  const c = store.get().cards[cardId];
  if (!c || c.state !== 2) return false;
  return store.settings().verbUnlock === 'fast' ? true : (c.rv || 0) >= 1;
}
export function learnt(cardId) {
  const c = store.get().cards[cardId];
  return !!(c && c.state >= 2);
}

const cardIdOf = (item) => `${item.deck}/${item.id}:w`;

/** Per verb: which stage it's on, and per-stage progress. */
export function verbProgress(deckItems, verb) {
  const mine = deckItems.filter((i) => i.verb === verb && i.sub !== 'shape');
  const shapes = deckItems.filter((i) => i.sub === 'shape');
  const stages = STAGES.map((s) => {
    const items = [...shapes.filter((i) => i.stage === s.n), ...mine.filter((i) => i.stage === s.n)];
    const done = items.filter((i) => proven(cardIdOf(i))).length;
    const started = items.filter((i) => store.get().cards[cardIdOf(i)]).length;
    return { ...s, items, total: items.length, done, started };
  }).filter((s) => s.total > 0);
  const current = stages.find((s) => s.done < s.total)?.n ?? 99;
  return { stages, current };
}

function computeCache(getDeckItems) {
  const verbStage = new Map();   // verb object -> current stage
  const deckMax = new Map();     // deck -> highest current stage among its verbs
  for (const [deckId, items] of getDeckItems()) {
    const verbs = [...new Set(items.map((i) => i.verb))];
    let max = 0;
    for (const v of verbs) {
      const cur = verbProgress(items, v).current;
      verbStage.set(v, cur);
      max = Math.max(max, cur);
    }
    deckMax.set(deckId, max);
  }
  return { verbStage, deckMax };
}

/** Is this conjugation item still locked? */
export function verbItemLocked(item, getDeckItems) {
  if (!cache) cache = computeCache(getDeckItems);
  if (item.sub === 'shape') return item.stage > (cache.deckMax.get(item.deck) || 1);
  return item.stage > (cache.verbStage.get(item.verb) || 1);
}

/* ---------------- test formats ---------------- */

function hash(s) {
  let h = 2166136261;
  for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Choose how to test a verb card this time.
 * New cards are taught directly (with the shape shown); reviews rotate between formats.
 */
export function pickFormat(card, opts = {}) {
  const item = card.item;
  if (item.sub !== 'form') return item.sub;
  const st = store.get().cards[card.id];
  if (!st && !opts.practice) return 'direct';
  const v = item.verb;
  const rootKnown = learnt(`${item.deck}/${v.id}-root:w`) && learnt(`${item.deck}/${v.id}-binyan:w`);
  const formats = ['direct', 'cloze'];
  if (!v.weak && rootKnown && SHAPES[v.binyanName]) formats.push('build');
  if (transformSource(item)) formats.push('transform');
  if (item.tense === 'inf') return rootKnown && !v.weak ? (hash(card.id + (st?.reps || 0)) % 2 ? 'build' : 'direct') : 'direct';
  const seed = opts.practice ? Math.floor(Math.random() * 1e9) : hash(card.id + ':' + (st?.reps || 0));
  return formats[seed % formats.length];
}

/** The earlier form this card can be transformed from (only if you've learnt it). */
export function transformSource(item) {
  const map = TRANSFORM_FROM[item.tense];
  if (!map || !map[item.slot]) return null;
  const [tense, slot] = map[item.slot];
  const f = item.verb.forms?.[tense]?.[slot];
  if (!f) return null;
  const id = `${item.deck}/${item.verb.id}-${tense}-${slot}:w`;
  if (!learnt(id)) return null;
  return { tense, slot, he: first(f) };
}

export function clozeFrame(item) {
  if (item.tense === 'inf') return { he: 'אֲנִי רוֹצֶה ___', en: 'I want to ___' };
  if (item.tense === 'imp') {
    const [n, e] = IMP_CALL[item.slot];
    return { he: `${n}, ___!`, en: `${e}, ___! (a request)` };
  }
  const [w, we] = TIME_WORD[item.tense];
  return { he: `${w} ${PRONOUN[item.slot]} ___`, en: `${we[0].toUpperCase() + we.slice(1)} ${PERSON_EN[item.slot].replace(/ \(.*\)/, '')} ___` };
}

export function transformFrame(item) {
  const src = transformSource(item);
  if (!src) return null;
  const tw = (t) => TIME_WORD[t]?.[0] || '';
  const from = item.tense === 'present'
    ? `${PRONOUN[src.slot]} ${src.he}`
    : `${tw(src.tense)} ${PRONOUN[item.tense === 'past' ? item.slot : src.slot]} ${src.he}`;
  const to = item.tense === 'present' ? `${PRONOUN[item.slot]} ___` : `${tw(item.tense)} ${PRONOUN[item.slot]} ___`;
  const what = item.tense === 'present' ? `change to: ${PERSON_EN[item.slot]}` : `change to the ${item.tense}`;
  return { from, to, what };
}

/** Shape of this card's tense in its binyan, filled with the verb's root (for teaching). */
export function shapeFor(item) {
  const v = item.verb;
  const tense = item.tense === 'imp' ? null : item.tense;
  const shape = tense && SHAPES[v.binyanName]?.[tense];
  if (!shape) return null;
  return { ...shape, filled: withFinal(fillShape(shape.spell, v.root, v.binyanName)) };
}

/* ---------------- answer checking helpers ---------------- */

export function checkRoot(input, root) {
  const typed = skeleton(input).replace(/[שׂשׁ]/g, 'ש');
  const want = skeleton(root);
  return typed === want;
}

/** If the typed answer is a different real form of the same verb, say which one. */
export function diagnose(input, item) {
  const typed = skeleton(input);
  if (!typed || !item.verb) return null;
  const v = item.verb;
  // The colloquial י- prefix for "I will…".
  if (item.tense === 'future' && item.slot === '1s') {
    const yi = v.forms.future?.['3ms'];
    if (yi && skeleton(first(yi)) === typed) {
      return 'That\'s the colloquial "אני י…" form — extremely common in speech, but the standard "I will" starts with א.';
    }
  }
  const labels = [];
  if (skeleton(v.inf) === typed) labels.push('the infinitive');
  for (const [tense, forms] of Object.entries(v.forms)) {
    for (const [p, f] of Object.entries(forms)) {
      if (tense === item.tense && p === item.slot) continue;
      for (const x of [first(f), ...rest(f)]) {
        if (skeleton(x) === typed) {
          labels.push(`the ${tense === 'imp' ? 'command' : tense} "${PERSON_EN[tense === 'imp' ? `imp-${p}` : p]}" form`);
          break;
        }
      }
    }
  }
  if (!labels.length) return null;
  return `You wrote ${[...new Set(labels)].slice(0, 2).join(' / ')} of this verb — right verb, wrong slot.`;
}

/** Literary / textbook-only forms worth knowing about for this card. */
export function registerNotes(item) {
  const notes = [];
  if (item.tense === 'imp' && item.alt?.length) {
    notes.push(`Textbook command: ${item.he} · What people say: ${item.alt[0]}`);
  }
  if (item.tense === 'past' && item.slot === '2mp' && /ם$/.test(stripNiqqud(item.he))) {
    notes.push(`Literary feminine (אַתֶּן): ${item.he.replace(/ם$/, 'ן')} — in speech everyone uses ${item.he}.`);
  }
  if (item.tense === 'future' && (item.slot === '2mp' || item.slot === '3p')) {
    notes.push('There are also literary feminine plural futures (…נָה), but they are practically never spoken.');
  }
  return notes;
}

export function githubIssueUrl(item, typed = '') {
  const v = item.verb;
  const title = `Check conjugation: ${stripNiqqud(v.inf)} (${v.binyanName}) ${item.tense || item.sub || ''} ${item.slot || ''}`.trim();
  const body = [
    `Verb: ${v.inf} — to ${v.en} (${v.binyanName}, root ${v.root})`,
    `Card: ${item.deck}/${item.id}`,
    `Form shown as correct: ${item.he}${item.alt?.length ? ` (also accepted: ${item.alt.join(', ')})` : ''}`,
    typed ? `What I typed: ${typed}` : '',
    '',
    'What looks wrong:',
    '',
  ].filter((l) => l !== null).join('\n');
  return `https://github.com/rmagid1010/hebrew-practice/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=content`;
}
