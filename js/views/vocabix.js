// Which interactive widget a word / sentence card uses this time.
// New cards start with recognition (choose), then building (tiles / זה-זאת-אלה), then free typing.
import { getDeck } from '../decks.js';
import { stripNiqqud } from '../hebrew.js';
import { DEM, facesOf } from '../gender.js';
import * as IX from './interact.js';

const words = (s) => stripNiqqud(s).trim().split(/\s+/).filter(Boolean).length;

/** A few other items from the same deck, closest in length first. */
function neighbours(item, face, seed, n = 6) {
  const items = (getDeck(item.deck)?.items || []).filter((i) => i !== item && i.he && i.kind === item.kind);
  const len = stripNiqqud(face.he).length;
  const ranked = IX.shuffle(items, seed).map((i) => ({ i, f: facesOf(i)[0] }))
    .sort((a, b) => Math.abs(stripNiqqud(a.f.he).length - len) - Math.abs(stripNiqqud(b.f.he).length - len));
  return ranked.slice(0, n).map((x) => x.f);
}

/** Versions of this item that would be wrong for the face shown (the gender / person traps). */
function otherVersions(item, face) {
  const ok = new Set([face.he, ...(face.alt || [])].map((x) => stripNiqqud(x)));
  return facesOf(item).filter((f) => !ok.has(stripNiqqud(f.he)));
}

export function vocabInteraction(c, face, reps) {
  const item = c.item;
  if (!face || c.type === 'p' || c.type === 'c') return null;
  const seed = IX.hash(`${c.id}:${reps}`);

  if (c.type === 'r') {
    if (reps > 0) return null;
    const others = neighbours(item, face, seed, 8).map((f) => ({ he: f.en }));
    return IX.choice(face.en, others.filter((o) => o.he !== face.en), seed, { latin: true, title: 'Pick the meaning' });
  }

  if (face.noun) {
    if (reps === 0) {
      const wrongDem = ['m', 'f', 'mp'].filter((g) => DEM[g] !== DEM[face.noun]).map((g) => ({ he: `${DEM[g]} ${face.nounHe}` }));
      const other = neighbours(item, face, seed, 3).filter((f) => f.noun).slice(0, 1);
      return IX.choice(face.he, [...wrongDem, ...other], seed, { title: 'Pick the right one — זֶה, זֹאת or אֵלֶּה?' });
    }
    return reps <= 2 ? IX.dem() : null;
  }

  const versions = otherVersions(item, face);
  if (words(face.he) >= 3 && reps <= 1) {
    const extra = [];
    for (const v of versions) extra.push(...v.he.split(/\s+/));
    for (const f of neighbours(item, face, seed, 2)) extra.push(...IX.shuffle(f.he.split(/\s+/), seed).slice(0, 1));
    const ix = IX.wordTiles(face.he, extra, seed);
    if (versions.length) ix.title = 'Tap the words in order (right to left) — some extras are the wrong gender';
    return ix;
  }
  if (reps === 0) {
    const trap = versions.map((f) => ({ he: f.he }));
    return IX.choice(face.he, [...trap, ...neighbours(item, face, seed, 4)], seed, { title: trap.length ? 'Pick the right one — watch who is speaking' : 'Pick the right one' });
  }
  return null;
}
