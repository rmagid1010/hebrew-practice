// Rendering and checking for verb (conjugation) cards in the review screen.
import { checkAnswer, stripNiqqud } from '../hebrew.js';
import { answersFor, itemKey, getDeck } from '../decks.js';
import { skeleton } from '../verbcheck.js';
import * as IX from './interact.js';
import {
  PRONOUN, PERSON_EN, STAGES, clozeFrame, transformFrame, diagnose, registerNotes, githubIssueUrl,
} from '../verbs.js';
import * as store from '../store.js';
import { esc, he, heb, sayBtn } from '../ui.js';

const TENSE_EN = { inf: 'infinitive', present: 'present', past: 'past', future: 'future', imp: 'command' };
const FORMAT_LABEL = { direct: 'Conjugate', cloze: 'Fill the gap', transform: 'Transform', meaning: 'What does it mean?' };

export function label(c, format) {
  return FORMAT_LABEL[format] || 'Conjugate';
}

function slotChips(item) {
  const chips = [`<div class="conj-slot"><small>tense</small><b>${esc(TENSE_EN[item.tense])}</b></div>`];
  if (item.slot && item.tense !== 'inf') {
    const pron = item.tense === 'imp' ? { ms: 'אַתָּה', fs: 'אַתְּ', mp: 'אַתֶּם' }[item.slot] : PRONOUN[item.slot];
    chips.push(`<div class="conj-slot"><small>${esc(PERSON_EN[item.person] || '')}</small>${he(pron)}</div>`);
  }
  return `<div class="conj-slots">${chips.join('')}</div>`;
}

const WHO = {
  present: { ms: 'he / a man', fs: 'she / a woman', mp: 'they (men or mixed)', fp: 'they (women)' },
  imp: { ms: 'to a man', fs: 'to a woman', mp: 'to a group' },
};
/** "you (f) · past · to write" — who, when and what, in English. */
export function meaningOf(item) {
  const v = item.verb;
  if (item.tense === 'inf') return `to ${v.en}`;
  const who = WHO[item.tense]?.[item.slot] || PERSON_EN[item.slot] || '';
  return `${who} · ${TENSE_EN[item.tense]} · to ${v.en}`;
}

export function promptHtml(c, format, ix = null) {
  const item = c.item;
  const v = item.verb;
  const isNew = !store.get().cards[c.id];

  if (format === 'meaning') {
    return `<div class="conj-prompt"><div class="prompt-row"><span class="conj-verb">${he(item.he)}</span>${sayBtn(item.he)}</div>
      <p class="prompt-hint">${item.tense === 'inf' ? 'Which verb is this?' : 'Who is doing it, when, and what does it mean?'}</p></div>`;
  }
  if (format === 'cloze') {
    const f = clozeFrame(item);
    return `<div class="conj-prompt">
      <div class="cloze he" lang="he" dir="rtl">${esc(heb(f.he)).replace('___', '<span class="blank">______</span>')} <span class="cloze-inf">(${esc(heb(v.inf))})</span></div>
      <div class="conj-verb-en">${esc(f.en)} — to ${esc(v.en)}</div></div>`;
  }
  if (format === 'transform') {
    const t = transformFrame(item);
    return `<div class="conj-prompt">
      <div class="transform"><div class="he" lang="he" dir="rtl">${esc(heb(t.from))}</div><div class="arrow">↓ ${esc(t.what)}</div>
        <div class="he" lang="he" dir="rtl">${esc(heb(t.to)).replace('___', '<span class="blank">______</span>')}</div></div>
      <div class="conj-verb-en">to ${esc(v.en)}</div></div>`;
  }
  // direct
  if (item.tense === 'inf') {
    return `<div class="conj-prompt"><div class="prompt-en">to ${esc(v.en)}</div>
      ${isNew && !ix ? '<p class="prompt-hint">Type the infinitive (the "to …" form).</p>' : ''}</div>`;
  }
  return `<div class="conj-prompt">
    <div class="prompt-row"><span class="conj-verb">${he(v.inf)}</span></div>
    <div class="conj-verb-en">to ${esc(v.en)}</div>
    ${slotChips(item)}
    ${isNew && v.weak ? '<p class="shape-hint">This verb is a little irregular — learn it as it is.</p>' : ''}</div>`;
}

/** Check an answer for a verb card. Returns {verdict, target, note}. */
export function check(c, format, input) {
  const item = c.item;
  if (!input.trim()) return { verdict: 'wrong', target: item.he, note: '' };
  const r = checkAnswer(input, answersFor(item), 'strict');
  if (r.verdict !== 'correct') {
    const d = diagnose(input, item);
    if (d) r.note = d + (r.note ? ' ' + r.note : '');
  }
  return r;
}

/* ---------------- interactive widgets for verb cards ---------------- */

const first = (f) => (Array.isArray(f) ? f[0] : f);

/** Other real forms of this verb (and, for infinitives, other verbs) to use as wrong options. */
function formDistractors(item, seed) {
  const v = item.verb;
  const accepted = new Set(answersFor(item).map((a) => skeleton(a)));
  const out = [];
  const push = (he, sub) => { if (he && !accepted.has(skeleton(he))) out.push({ he, sub }); };
  if (item.tense === 'inf') {
    const others = (getDeck(item.deck)?.items || []).filter((i) => i.tense === 'inf' && i.verb !== v).map((i) => i.he);
    for (const he of IX.shuffle(others, seed)) push(he);
    push(first(v.forms.present?.ms));
    push(first(v.forms.past?.['3ms']));
    return out;
  }
  const same = Object.entries(v.forms[item.tense] || {}).filter(([p]) => p !== item.slot).map(([, f]) => first(f));
  // Forms that differ only in gender or person come first: that's the point of the drill.
  for (const he of IX.shuffle(same, seed)) push(he);
  const slotOf = { present: 'ms', past: '3ms', future: '3ms', imp: 'ms' };
  for (const t of ['present', 'past', 'future', 'imp']) {
    if (t === item.tense) continue;
    push(first(v.forms[t]?.[item.slot] || v.forms[t]?.[slotOf[t]]));
  }
  push(v.inf);
  return out;
}

/** Wrong meanings for "what does it mean?": other people / tenses of this verb, and the same form of other verbs. */
function meaningDistractors(item, seed) {
  const own = skeleton(item.he);
  const deckItems = (getDeck(item.deck)?.items || []).filter((i) => i.sub === 'form' && skeleton(i.he) !== own);
  if (item.tense === 'inf') return IX.shuffle(deckItems.filter((i) => i.tense === 'inf'), seed).map((i) => ({ he: meaningOf(i) }));
  const sameVerb = IX.shuffle(deckItems.filter((i) => i.verb === item.verb && i.tense !== 'inf'), seed);
  // Prefer the same tense (person / gender traps), then the same person in another tense.
  sameVerb.sort((a, b) => (b.tense === item.tense) - (a.tense === item.tense) || (b.slot === item.slot) - (a.slot === item.slot));
  const otherVerb = IX.shuffle(deckItems.filter((i) => i.verb !== item.verb && i.tense === item.tense && i.slot === item.slot), seed);
  return [...sameVerb.slice(0, 2), ...otherVerb.slice(0, 1), ...sameVerb.slice(2)].map((i) => ({ he: meaningOf(i) }));
}

/**
 * The interactive widget for a verb card, or null to type freely.
 * New forms: choose (reps 0) → letter tiles (1) → fill the missing letters (2) → type.
 */
export function interaction(c, format, { reps = 0, scaffold = true, practice = false } = {}) {
  const item = c.item;
  const seed = IX.hash(`${c.id}:${reps}`);
  if (format === 'meaning') return IX.choice(meaningOf(item), meaningDistractors(item, seed), seed, { latin: true, title: 'Pick the meaning' });
  if (!scaffold || practice || reps >= 3) return null;
  const distractors = formDistractors(item, seed);
  if (reps === 0 || /\s/.test(stripNiqqud(item.he).trim())) {
    return IX.choice(item.he, distractors, seed, { title: item.tense === 'inf' ? 'Pick the right infinitive' : 'Pick the right form — watch the person and gender' });
  }
  if (reps === 1) {
    const ix = IX.letterTiles(item.he, distractors.map((d) => d.he), seed);
    ix.title = 'Spell it from the letters — there are a couple of extras';
    return ix;
  }
  return IX.gaps(item.he, seed);
}

function tenseTable(item) {
  const v = item.verb;
  const tense = item.tense;
  if (!['present', 'past', 'future', 'imp'].includes(tense)) return '';
  const forms = v.forms[tense] || {};
  const rows = Object.entries(forms).map(([p, f]) => {
    const main = Array.isArray(f) ? f[0] : f;
    const pron = tense === 'imp' ? PERSON_EN[`imp-${p}`] : `${PERSON_EN[p]}`;
    const cur = p === item.slot ? ' class="cur"' : '';
    return `<tr${cur}><td>${esc(pron)}</td><td lang="he" class="he">${esc(heb(main))}</td></tr>`;
  }).join('');
  return `<details class="tense-table"${store.get().cards[`${itemKey(item)}:w`] ? '' : ' open'}><summary>Whole ${esc(TENSE_EN[tense])} of ${esc(heb(v.inf))}</summary><table>${rows}</table></details>`;
}

export function revealHtml(c, format, verdict, typed) {
  const item = c.item;
  const v = item.verb;
  const parts = [];
  const target = verdict?.target || item.he;
  parts.push(`<div class="prompt-row"><div class="answer-he">${he(target)}</div>${sayBtn(target)}</div>`);
  parts.push(`<p class="answer-plain">${esc(meaningOf(item))}${store.settings().niqqud ? ` · spelled ${he(stripNiqqud(target))}` : ''}</p>`);
  const others = answersFor(item).filter((a) => stripNiqqud(a) !== stripNiqqud(target));
  if (others.length) parts.push(`<p class="answer-plain">also accepted: ${others.map((o) => he(o)).join(' · ')}</p>`);
  for (const n of registerNotes(item)) parts.push(`<div class="note register">${esc(heb(n))}</div>`);
  parts.push(tenseTable(item));
  if (v.note) parts.push(`<div class="note">${esc(heb(v.note))}</div>`);

  const reviewed = v.review?.status === 'checked';
  const flagged = !!store.get().flagged[itemKey(item)];
  parts.push(`<div class="verb-trust">
    ${reviewed ? `<span class="chip chip-casual" title="${esc(v.review.by || '')}">✓ checked by a native speaker</span>` : '<span class="chip" title="These tables passed the automatic checks but no native speaker has signed them off yet">⚠ not yet checked by a native speaker</span>'}
    <span class="spacer"></span>
    <button type="button" class="btn btn-ghost btn-sm" data-act="flag-verb" data-typed="${esc(typed || '')}">${flagged ? '⚑ Flagged' : '⚐ This looks wrong'}</button>
    <a class="btn btn-ghost btn-sm" href="${esc(githubIssueUrl(item, typed))}" target="_blank" rel="noopener">Report on GitHub</a>
  </div>`);
  return `<div class="reveal">${parts.join('')}</div>`;
}

export function stageLabel(item) {
  const s = STAGES.find((x) => x.n === item.stage);
  return s ? `Stage ${s.n}: ${s.label}` : '';
}
