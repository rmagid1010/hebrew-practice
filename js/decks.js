// Loads deck content and turns items into reviewable cards.
import * as store from './store.js';

let catalog = null;          // [{id, title, ...meta}]
const decks = new Map();     // id -> {meta, items}
let allCards = null;         // cardId -> card descriptor

const PERSONS = {
  '1s': ['אֲנִי', 'I'], '2ms': ['אַתָּה', 'you (m)'], '2fs': ['אַתְּ', 'you (f)'],
  '3ms': ['הוּא', 'he'], '3fs': ['הִיא', 'she'], '1p': ['אֲנַחְנוּ', 'we'],
  '2mp': ['אַתֶּם', 'you (pl)'], '3p': ['הֵם', 'they'],
  ms: ['הוּא', 'he / m. singular'], fs: ['הִיא', 'she / f. singular'],
  mp: ['הֵם', 'they / m. plural'], fp: ['הֵן', 'they / f. plural'],
  'imp-ms': ['אַתָּה', 'to a man'], 'imp-fs': ['אַתְּ', 'to a woman'], 'imp-mp': ['אַתֶּם', 'to a group'],
};
const TENSE_LABEL = { present: 'present', past: 'past', future: 'future', imp: 'command', inf: 'infinitive' };
const TENSE_ORDER = ['inf', 'present', 'past', 'future', 'imp'];

export async function loadAll() {
  if (catalog) return;
  catalog = await (await fetch('data/decks/index.json')).json();
  await Promise.all(catalog.map(async (meta) => {
    const data = await (await fetch(`data/decks/${meta.id}.json`)).json();
    decks.set(meta.id, { meta, items: expand(meta, data) });
  }));
  catalog.push({ id: 'mine', title: 'My Words', he: 'הַמִּילִּים שֶׁלִּי', kind: 'vocab', description: 'Words and phrases you added yourself.' });
  rebuildCustom();
}

export function rebuildCustom() {
  const meta = catalog.find((d) => d.id === 'mine');
  decks.set('mine', { meta, items: store.get().custom.map((it) => ({ ...it, deck: 'mine', kind: 'vocab' })) });
  allCards = null;
}

function expand(meta, data) {
  if (meta.kind === 'conjugation') {
    const items = [];
    for (const v of data.verbs) v.binyanName = v.binyanName || data.binyanName || '';
    // order: all infinitives, then present, past, future, commands — verb by verb within each tense
    for (const tense of TENSE_ORDER) {
      for (const v of data.verbs) {
        if (tense === 'inf') {
          items.push({ id: `${v.id}-inf`, kind: 'conj', deck: meta.id, verb: v, tense, person: null, he: v.inf, en: `to ${v.en}` });
          continue;
        }
        const forms = v.forms[tense] || {};
        for (const [p, he] of Object.entries(forms)) {
          const person = tense === 'imp' ? `imp-${p}` : p;
          items.push({ id: `${v.id}-${tense}-${p}`, kind: 'conj', deck: meta.id, verb: v, tense, person, he: Array.isArray(he) ? he[0] : he, alt: Array.isArray(he) ? he.slice(1) : [], en: `${v.en}` });
        }
      }
    }
    return items;
  }
  return data.items.map((it) => ({ ...it, deck: meta.id, kind: meta.kind === 'sentences' ? 'sentence' : 'vocab' }));
}

export function getCatalog() { return catalog; }
export function getDeck(id) { return decks.get(id); }
export function itemKey(item) { return `${item.deck}/${item.id}`; }

/** The card types an item produces. r = read (Hebrew→meaning), w = write (English→Hebrew). */
function typesFor(item) {
  if (item.kind === 'conj') return ['w'];
  return ['r', 'w'];
}

export function cards() {
  if (allCards) return allCards;
  allCards = new Map();
  for (const meta of catalog) {
    const d = decks.get(meta.id);
    if (!d) continue;
    for (const item of d.items) {
      for (const type of typesFor(item)) {
        const id = `${itemKey(item)}:${type}`;
        allCards.set(id, { id, type, item, deck: meta.id });
      }
    }
  }
  return allCards;
}

export function personLabel(p) { return PERSONS[p] || ['', p]; }
export function tenseLabel(t) { return TENSE_LABEL[t] || t; }

/** Accepted answers for a write card. */
export function answersFor(item) {
  return [item.he, ...(item.alt || [])];
}
