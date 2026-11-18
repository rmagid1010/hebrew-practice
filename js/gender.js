// Gender: noun cards with זֶה / זֹאת / אֵלֶּה, gendered versions of sentences, and an agreement checker.
// Pure module (no DOM, no storage) so tools/validate-gender.mjs can use it in Node.

import { stripNiqqud, checkAnswer, lenient } from './hebrew.js';

/* ------------------------------------------------------------------ */
/* Demonstratives                                                      */
/* ------------------------------------------------------------------ */

export const DEM = { m: 'זֶה', f: 'זֹאת', mp: 'אֵלֶּה', fp: 'אֵלֶּה' };
export const GENDER_NAME = { m: 'masculine', f: 'feminine', mp: 'masculine plural', fp: 'feminine plural' };
const DEM_PLAIN = { 'זה': 'm', 'זאת': 'f', 'זו': 'f', 'אלה': 'p', 'אלו': 'p' };

/* ------------------------------------------------------------------ */
/* Who is speaking / being spoken to                                   */
/* ------------------------------------------------------------------ */

const WHO = {
  m: ['♂', 'You’re a man'], f: ['♀', 'You’re a woman'],
  pm: ['♂♂', 'a group: men or mixed'], pf: ['♀♀', 'a group of women'],
  tm: ['→♂', 'talking to a man'], tf: ['→♀', 'talking to a woman'], tp: ['→♂♀', 'talking to a group'],
};
/** "f tm" → {speaker:'f', to:'m'} */
export function personaOf(w) {
  const p = {};
  for (const t of (w || '').split(/\s+/)) {
    if (t === 'm' || t === 'f') p.speaker = t;
    if (t === 'tm' || t === 'tf' || t === 'tp') p.to = t[1];
    if (t === 'pm' || t === 'pf') p.group = t === 'pm' ? 'mp' : 'fp';
  }
  return p;
}
/** Human label for a variant's `w`, e.g. "♀ You’re a woman · talking to a man". */
export function whoLabel(w) {
  return (w || '').split(/\s+/).filter((t) => WHO[t]).map((t) => `${WHO[t][0]} ${WHO[t][1]}`).join(' · ');
}
/** Short label for lists: "♀ → ♂". */
export function whoShort(w) {
  return (w || '').split(/\s+/).filter((t) => WHO[t]).map((t) => WHO[t][0]).join(' ');
}
export function whoClass(w) {
  const p = personaOf(w);
  if (/\bpf\b/.test(w || '')) return 'who-f';
  if (/\bpm\b/.test(w || '')) return 'who-m';
  return p.speaker ? `who-${p.speaker}` : p.to ? `who-t${p.to}` : '';
}

/* ------------------------------------------------------------------ */
/* Faces: the concrete version of an item shown in one review          */
/* ------------------------------------------------------------------ */

// Nouns you don't say "a" with in English.
const MASS = new Set(['coffee', 'tea', 'water', 'milk', 'bread', 'money', 'sugar', 'rice', 'salt', 'meat', 'chicken', 'fish', 'cheese', 'cottage cheese',
  'food', 'electricity', 'light', 'rent', 'cash', 'change', 'weather', 'sand', 'snow', 'rain', 'music', 'sports', 'internet', 'hummus', 'ice cream',
  'garbage', 'laundry', 'olive oil', 'sunscreen', 'tech industry', 'tahini', 'homework', 'patience', 'nerve', 'fever', 'flu', 'nausea', 'medicine',
  'shakshuka', 'fries', 'salad', 'free time', 'vacation', 'reception', 'heat', 'army reserve duty', 'work', 'delivery', 'wind', 'sun', 'Shabbat',
  'Saturday', 'Friday', 'WhatsApp', 'breakfast', 'lunch', 'dinner', 'football', 'Friday-night dinner', 'barbecue', 'chaos', 'nonsense', 'warranty',
  'family', 'body', 'salary', 'ER', 'summer', 'winter', 'spring', 'autumn', 'north', 'south', 'cinema', 'mess']);
/** "table" → "this is a table"; plural nouns → "these are …". */
export function thisIs(en, g) {
  const first = en.split(' / ')[0];
  if (g === 'mp' || g === 'fp') return `these are ${en}`;
  const bare = first.replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(a|an|the)\s+/i, '').trim().split(' — ')[0];
  if (/^(the|a|an)\s/i.test(first) || /^[A-Z]/.test(first) && !MASS.has(bare)) return `this is ${en}`;
  if (MASS.has(bare) || MASS.has(bare.split(' ')[0]) || /^[\d]/.test(first)) return `this is ${en}`;
  const word = first.replace(/^\(.*?\)\s*/, '');
  return `this is ${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${en}`;
}

/** All versions of an item a card can show. Each: {he, alt, en, w, hint, noun?: g, nounHe}. */
export function facesOf(item) {
  if (item.g && item.kind === 'vocab') {
    const base = { he: `${DEM[item.g]} ${item.he}`, alt: (item.alt || []).map((a) => `${stripNiqqud(DEM[item.g])} ${a}`), en: item.this || thisIs(item.en, item.g), noun: item.g, nounHe: item.he };
    if (!item.fem) return [base];
    return [{ ...base, w: '' }, { he: `${DEM.f} ${item.fem.he}`, alt: [], en: thisIs(item.fem.en, 'f'), noun: 'f', nounHe: item.fem.he, w: '' }];
  }
  if (item.v?.length) {
    return item.v.map((x) => {
      const persona = personaOf(x.w);
      // Without its own alternatives a version keeps the item's alternatives that fit it.
      const alt = x.alt || (item.alt || []).filter((a) => !checkAgreement(a, persona).length);
      return { he: x.he || item.he, alt, en: x.en || item.en, w: x.w || '', hint: x.hint ?? null, models: x.models || item.models || null };
    });
  }
  return [{ he: item.he, alt: item.alt || [], en: item.en, hint: item.hint, models: item.models || null }];
}

function hash(s) {
  let h = 2166136261;
  for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Which face a card shows this time: rotates with each review so every version comes up. */
export function pickFace(card, reps = 0, random = false) {
  const faces = facesOf(card.item);
  const i = faces.length === 1 ? 0 : random ? Math.floor(Math.random() * faces.length) : (hash(card.id) + reps) % faces.length;
  return { ...faces[i], index: i, count: faces.length, persona: personaOf(faces[i].w) };
}

/* ------------------------------------------------------------------ */
/* Agreement checker                                                   */
/* ------------------------------------------------------------------ */

let LEX = null;
const G4 = ['ms', 'fs', 'mp', 'fp'];
/** Load the lexicon (data/agree.json). */
export function setLexicon(data) {
  const nouns = new Map(Object.entries(data.nouns));
  let maxWords = 1;
  for (const k of nouns.keys()) maxWords = Math.max(maxWords, k.split(' ').length);
  const forms = new Map(); // word -> [{row, g, kind}]
  const add = (rows, kind) => rows.forEach((row) => row.forEach((alts, gi) => alts.forEach((w) => {
    if (!forms.has(w)) forms.set(w, []);
    forms.get(w).push({ row, g: G4[gi], kind });
  })));
  add(data.adj, 'adj');
  add(data.verbs, 'verb');
  const imp = new Map();
  for (const [m, f] of data.imp) { m.forEach((w) => imp.set(w, { g: 'm', pair: f[0] })); f.forEach((w) => imp.set(w, { g: 'f', pair: m[0] })); }
  const people = new Map();
  for (const [m, f] of data.people) { people.set(m, { g: 'ms', pair: f }); people.set(f, { g: 'fs', pair: m }); }
  LEX = { nouns, maxWords, forms, imp, people };
}
export function hasLexicon() { return !!LEX; }

const SKIP = new Set(['לא', 'מאוד', 'מאד', 'ממש', 'כבר', 'עדיינ', 'גמ', 'הכי', 'בדיוק', 'עוד', 'נורא', 'קצת', 'די', 'תמיד', 'לפעמימ',
  'באמת', 'בינתיימ', 'כל', 'ככ', 'מדי', 'יותר', 'פחות', 'רק', 'עכשיו', 'היומ', 'שוב', 'כנראה', 'לגמרי', 'בכלל', 'סתמ', 'פשוט', 'כאילו',
  'אולי', 'ברצינות', 'ממש', 'טיפה', 'כזה', 'כזאת', 'כאלה', 'הרבה', 'אף', 'פעמ', 'מתמיד', 'דווקא', 'בטח', 'לגמרי', 'מספיק', 'נורמלי']);
const POSS = new Set(['שלי', 'שלכ', 'שלו', 'שלה', 'שלנו', 'שלכמ', 'שלכנ', 'שלהמ', 'שלהנ']);
const PRON = { 'אני': 'I', 'אתה': 'ms', 'את': 'fs', 'הוא': 'ms', 'היא': 'fs', 'אנחנו': 'p', 'אתמ': 'mp', 'אתנ': 'fp', 'המ': 'mp', 'הנ': 'fp' };
const CLAUSE_PREFIX = ['וכש', 'כש', 'ש', 'ו'];
const PREP_PREFIX = ['ו', 'ב', 'ל', 'מ', 'כ', 'ש'];

const FINAL = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
/** Put final letters back on words (the checker compares without them). */
const finals = (s) => s.replace(/[כמנפצ](?=$|[^\u05D0-\u05EA\u05F3'])/g, (c) => FINAL[c]);
const key = (s) => lenient(s).replace(/"/g, '');
const fit = (g, want) => want === 'p' ? g === 'mp' || g === 'fp' : g === want;
const genderOfNoun = (g) => (g === 'm' ? 'ms' : g === 'f' ? 'fs' : g);
const NAME = { ms: 'masculine', fs: 'feminine', mp: 'masculine plural', fp: 'feminine plural', p: 'plural' };

function stripClause(t) {
  for (const p of CLAUSE_PREFIX) if (t.startsWith(p) && t.length > p.length + 1 && PRON[t.slice(p.length)]) return t.slice(p.length);
  return t;
}
/** A modifier (adjective / present verb), possibly with ה (to match a definite noun). */
function modifierAt(t, definite) {
  const w = definite && t.startsWith('ה') ? t.slice(1) : t;
  const f = LEX.forms.get(w);
  return f ? { word: w, forms: f } : null;
}
/** Longest noun starting at token i, allowing ה and preposition prefixes on the first word. */
function nounAt(toks, i) {
  for (let n = Math.min(LEX.maxWords, toks.length - i); n >= 1; n--) {
    const words = toks.slice(i, i + n);
    const first = words[0];
    const tries = [[first, false, false]];
    if (first.startsWith('ה')) tries.push([first.slice(1), true, false]);
    for (const p of PREP_PREFIX) {
      if (!first.startsWith(p) || first.length <= p.length + 1) continue;
      const rest = first.slice(p.length);
      tries.push([rest, false, true]);
      if (rest.startsWith('ה')) tries.push([rest.slice(1), true, true]);
      if (p !== 'ו' && p !== 'ש') tries.push([rest, true, true]); // בַּדִּירָה = ב + ה (hidden)
    }
    for (const [w, def, prep] of tries) {
      const k = [w, ...words.slice(1)].join(' ');
      const g = LEX.nouns.get(k);
      if (g) return { g, len: n, definite: def, prep, text: words.join(' ') };
    }
  }
  return null;
}
function rightForm(row, want) {
  const gi = want === 'p' ? 2 : G4.indexOf(want);
  return row[gi][0];
}
function agrees(forms, want) { return forms.some((f) => fit(f.g, want)); }

/**
 * Check gender/number agreement in a Hebrew text.
 * persona: {speaker:'m'|'f', to:'m'|'f'|'p'} — who is writing and who they're talking to (both optional).
 * → [{msg}] — empty when nothing is wrong.
 */
export function checkAgreement(text, persona = {}) {
  if (!LEX || !text) return [];
  const errors = [];
  const seen = new Set();
  const err = (raw) => { const msg = finals(raw); if (!seen.has(msg)) { seen.add(msg); errors.push({ msg }); } };
  const clauses = stripNiqqud(text).split(/[.,!?;:\n—–()]+/);
  for (const clause of clauses) {
    const toks = key(clause).split(' ').filter(Boolean);
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      const next = (j) => { while (j < toks.length && (SKIP.has(toks[j]) || POSS.has(toks[j]))) j++; return j; };

      // 1. זה / זאת / אלה + noun (also הזה / הזאת / האלה after a noun — handled in 3)
      if (DEM_PLAIN[t] && i + 1 < toks.length) {
        const j = next(i + 1);
        const n = j < toks.length ? nounAt(toks, j) : null;
        if (n && !n.prep && toks[i - 1] !== 'את' && (j === i + 1 || toks[i + 1] === 'לא')) {
          const want = DEM_PLAIN[t];
          const ok = want === 'p' ? n.g === 'mp' || n.g === 'fp' : n.g === want;
          if (!ok) err(`${t} ${n.text}: ${n.text} is ${GENDER_NAME[n.g]}, so use ${stripNiqqud(DEM[n.g])}.`);
        }
      }

      // 2. Pronoun + present verb / adjective / person noun
      const pr = stripClause(t);
      if (PRON[pr] && i + 1 < toks.length) {
        let want = PRON[pr];
        if (want === 'I') want = persona.speaker === 'm' ? 'ms' : persona.speaker === 'f' ? 'fs' : null;
        if (want === 'p' && persona.group) want = persona.group; // "we" in a version about a group of men / of women
        const j = pr === 'את' ? (toks[i + 1] === 'לא' ? i + 2 : i + 1) : next(i + 1); // accusative את: look only at the very next word
        const w = toks[j];
        const m = w && LEX.forms.get(w);
        const person = w && LEX.people.get(w);
        if (pr === 'את' && !m && !person) { /* accusative את, not "you" */ } else {
          if (persona.to && (pr === 'אתה' || pr === 'את') && (m || person)) {
            if (persona.to === 'p') err(`${pr}: you're talking to a group, so use אתם (or אתן for women).`);
            else if (pr === 'אתה' && persona.to === 'f') err(`אתה: you're talking to a woman, so use את.`);
            else if (pr === 'את' && persona.to === 'm') err(`את: you're talking to a man, so use אתה.`);
          }
          if (want && m && !agrees(m, want)) {
            const fix = rightForm(m[0].row, want);
            err(pr === 'אני'
              ? `אני ${w}: you're ${persona.speaker === 'f' ? 'a woman' : 'a man'} here, so it's אני ${fix}.`
              : `${pr} ${w}: ${pr} needs the ${NAME[want]} form — ${fix}.`);
          }
          if ((want === 'ms' || want === 'fs') && person && person.g !== want) {
            err(pr === 'אני' ? `אני ${w}: you're ${persona.speaker === 'f' ? 'a woman' : 'a man'} here, so it's אני ${person.pair}.` : `${pr} ${w}: use ${person.pair}.`);
          }
        }
      }

      // 3. Noun + adjective (or subject noun + present verb)
      const n = nounAt(toks, i);
      if (n) {
        // after another noun this one may be the second half of a construct (כּוֹס קָפֶה גְּדוֹלָה) — don't guess
        const prev = toks[i - 1];
        const prevNoun = !!prev && (nounAt(toks, i - 1)?.len === 1 || (prev.endsWith('ת') && !LEX.forms.has(prev) && !DEM_PLAIN[prev] && prev !== 'את' && !PRON[prev]));
        let j = next(i + n.len);
        const w = toks[j];
        if (w && !prevNoun) {
          // הדירה הזאת
          const dm = n.definite && w.startsWith('ה') ? DEM_PLAIN[w.slice(1)] : null;
          if (dm) {
            const ok = dm === 'p' ? n.g === 'mp' || n.g === 'fp' : n.g === dm;
            if (!ok) err(`${n.text} ${w}: ${n.text} is ${GENDER_NAME[n.g]}, so use ה${stripNiqqud(DEM[n.g])}.`);
            j = next(j + 1);
          }
          const w2 = toks[j];
          const mod = w2 && modifierAt(w2, n.definite);
          if (mod) {
            const usable = n.prep ? mod.forms.filter((f) => f.kind === 'adj') : mod.forms;
            const want = genderOfNoun(n.g);
            if (usable.length && !agrees(usable, want)) {
              err(`${n.text} ${w2}: ${n.text} is ${GENDER_NAME[n.g]}, so it's ${n.definite && w2.startsWith('ה') ? 'ה' : ''}${rightForm(usable[0].row, want)}.`);
            }
          }
        }
        i += n.len - 1;
      }

      // 4. Commands and "you will…" forms
      const cmd = LEX.imp.get(t.startsWith('ו') && LEX.imp.has(t.slice(1)) ? t.slice(1) : t);
      if (cmd && persona.to) {
        const prev = toks[i - 1];
        const third = prev === 'היא' || prev === 'הוא' || (prev && LEX.nouns.has(prev));
        if (!third) {
          if (persona.to === 'p') err(`${t}: you're talking to a group, so use the plural (…ו).`);
          else if (cmd.g !== persona.to) err(`${t}: you're talking to ${persona.to === 'f' ? 'a woman' : 'a man'}, so it's ${cmd.pair}.`);
        }
      }
    }
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Checking an answer against a face                                   */
/* ------------------------------------------------------------------ */

/**
 * Check a typed answer for a vocab/sentence card that may have gender versions.
 * → {verdict, target, note, gender: [msgs]}
 */
export function checkFace(face, others, input, mode = 'vocab') {
  const answers = [face.he, ...(face.alt || [])];
  if (!input.trim()) return { verdict: 'wrong', target: face.he, note: '', gender: [] };
  const r = checkAnswer(input, answers, mode);
  const notes = [];
  let verdict = r.verdict;

  if (face.noun) {
    const first = key(input).split(' ')[0];
    const g = DEM_PLAIN[first];
    const right = stripNiqqud(DEM[face.noun]);
    const plainNoun = stripNiqqud(face.nounHe);
    if (!g) {
      notes.push(`Start with ${right}: ${plainNoun} is ${GENDER_NAME[face.noun]}.`);
      verdict = 'wrong';
    } else if (g !== (face.noun.endsWith('p') ? 'p' : face.noun)) {
      notes.push(`${first} is wrong here: ${plainNoun} is ${GENDER_NAME[face.noun]}, so it's ${right} ${plainNoun}.`);
      verdict = 'wrong';
    }
  }

  if (verdict !== 'correct') {
    for (const o of others || []) {
      if (o === face) continue;
      const m = checkAnswer(input, [o.he, ...(o.alt || [])], mode);
      if (m.verdict === 'correct' && (o.w || o.noun)) {
        notes.push(o.w ? `That's the version for “${whoLabel(o.w)}”. This card asks for “${whoLabel(face.w) || 'the other version'}”.`
          : `That's ${stripNiqqud(o.he)} — this card asks for ${stripNiqqud(face.he)}.`);
        verdict = 'wrong';
        break;
      }
    }
  }

  const gender = checkAgreement(input, face.persona || {}).map((e) => e.msg);
  if (gender.length && verdict !== 'wrong') verdict = 'wrong';
  return { ...r, verdict, target: r.verdict === 'correct' && verdict === 'correct' ? r.target : face.he, note: [r.verdict === 'correct' || verdict !== r.verdict ? '' : r.note, ...notes].filter(Boolean).join(' '), gender };
}
