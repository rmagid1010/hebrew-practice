// Loads deck content and turns items into reviewable cards.
import * as store from './store.js';
import { expandVerbDeck, verbItemLocked } from './verbs.js';

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
  if (meta.kind === 'conjugation') return expandVerbDeck(meta, data);
  const kind = meta.kind === 'sentences' ? 'sentence' : meta.kind === 'cursive' ? 'cursive' : 'vocab';
  return data.items.map((it) => ({ ...it, deck: meta.id, kind, types: it.types || meta.types }));
}

export function getCatalog() { return catalog; }
export function getDeck(id) { return decks.get(id); }
export function itemKey(item) { return `${item.deck}/${item.id}`; }

/**
 * The card types an item produces.
 * r = read (Hebrew → meaning), w = write (English → Hebrew), c = read cursive (type it in print).
 */
export function typesFor(item) {
  if (item.kind === 'conj') return ['w'];
  if (item.kind === 'cursive') return ['c'];
  return item.types || ['r', 'w'];
}

/** An item counts as "learnt" once any of its cards has graduated to review. */
export function isLearnt(key) {
  const st = store.get().cards;
  for (const t of ['r', 'w', 'c']) {
    const c = st[`${key}:${t}`];
    if (c && c.state >= 2) return true;
  }
  return false;
}

/** Items with `req` stay locked until every required item is learnt. */
export function lockInfo(item) {
  if (!item.req?.length) return null;
  const missing = item.req.filter((k) => !isLearnt(k));
  return { total: item.req.length, missing };
}
function verbDecks() {
  return catalog.filter((d) => d.kind === 'conjugation').map((d) => [d.id, decks.get(d.id)?.items || []]);
}

export function isLocked(item) {
  if (item.kind === 'conj') return verbItemLocked(item, verbDecks);
  const info = lockInfo(item);
  return !!(info && info.missing.length);
}

/** Look up an item by its key ("deck/id"). */
export function itemByKey(key) {
  const [deck, id] = key.split('/');
  return decks.get(deck)?.items.find((i) => i.id === id) || null;
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
