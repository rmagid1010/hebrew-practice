// Rendering and checking for verb (conjugation) cards in the review screen.
import { checkAnswer, stripNiqqud } from '../hebrew.js';
import { answersFor, itemKey, getDeck } from '../decks.js';
import { BINYANIM, SHAPES, matchBinyan, rootLetters, skeleton, fillShape, withFinal } from '../verbcheck.js';
import * as IX from './interact.js';
import {
  PRONOUN, PERSON_EN, STAGES, clozeFrame, transformFrame, shapeFor, checkRoot, diagnose, registerNotes, githubIssueUrl,
} from '../verbs.js';
import * as store from '../store.js';
import { esc, he, heb, sayBtn } from '../ui.js';

const TENSE_EN = { inf: 'infinitive', present: 'present', past: 'past', future: 'future', imp: 'command' };
const FORMAT_LABEL = {
  direct: 'Conjugate', build: 'Build it from the root', cloze: 'Fill the gap', transform: 'Transform',
  root: 'Find the root', binyan: 'Name the binyan', shape: 'Binyan shape',
};

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

/** The binyan skeleton in Hebrew with numbered slots for the root letters: ל①②ו③ (right to left). */
export function shapeSlots(spell) {
  return `<span class="slots" lang="he" dir="rtl">${[...spell].map((ch) => (/[123]/.test(ch) ? `<span class="slot">${ch}</span>` : `<span class="fix">${esc(ch)}</span>`)).join('')}</span>`;
}
function shapeHint(item) {
  const s = shapeFor(item);
  if (!s) return '';
  return `<p class="shape-hint">Shape for ${esc(item.verb.binyanName)} ${esc(TENSE_EN[item.tense])} (${esc(s.form)}): <b class="say">${esc(s.say)}</b> · spelled ${shapeSlots(s.spell)}</p>`;
}

export function promptHtml(c, format, ix = null) {
  const item = c.item;
  const v = item.verb;
  const isNew = !store.get().cards[c.id];

  if (format === 'root') {
    return `<div class="conj-prompt"><div class="prompt-row"><span class="conj-verb">${he(v.inf)}</span></div>
      <div class="conj-verb-en">to ${esc(v.en)}</div>
      <p class="prompt-hint">Which three letters are its root? Prefixes like ל / לה / להת and the vowel letters ו / י are not part of it.</p></div>`;
  }
  if (format === 'binyan') {
    return `<div class="conj-prompt"><div class="prompt-row"><span class="conj-verb">${he(v.inf)}</span></div>
      <div class="conj-verb-en">to ${esc(v.en)} · root ${he(v.root)}</div>
      <p class="prompt-hint">Which binyan (verb pattern) is it? Compare the start and the vowels with each pattern.</p></div>`;
  }
  if (format === 'shape') {
    return `<div class="conj-prompt">
      <div class="shape-title">${esc(item.binyan)} · ${esc(TENSE_EN[item.tense])}${item.slot ? ` · ${esc(PERSON_EN[item.slot])}` : ''}</div>
      <div class="prompt-row"><span class="conj-verb">${he(v.root)}</span></div>
      <div class="conj-verb-en">root of “to ${esc(v.en)}”</div>
      <p class="prompt-hint">The grey letters belong to the ${esc(item.binyan)} pattern. Put the root letters into the numbered boxes — box 1 gets the first root letter (the rightmost).</p></div>`;
  }
  if (format === 'build') {
    return `<div class="conj-prompt">
      <div class="prompt-row"><span class="conj-verb">${he(v.root)}</span></div>
      <div class="conj-verb-en">root · ${esc(v.binyanName)} · <span class="muted">(to ${esc(v.en)})</span></div>
      ${slotChips(item)}
      <p class="prompt-hint">No infinitive this time — build the form from the root and the binyan's shape.</p></div>`;
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
      <div class="conj-verb-en">to ${esc(v.en)} · ${esc(v.binyanName)}</div></div>`;
  }
  // direct
  if (item.tense === 'inf') {
    return `<div class="conj-prompt"><div class="prompt-en">to ${esc(v.en)}</div>
      <div class="conj-verb-en">${esc(v.binyanName)}${isNew ? '' : ` · root ${he(v.root)}`}</div>
      ${isNew && !ix ? '<p class="prompt-hint">Type the infinitive (the "to …" form).</p>' : ''}</div>`;
  }
  return `<div class="conj-prompt">
    <div class="prompt-row"><span class="conj-verb">${he(v.inf)}</span></div>
    <div class="conj-verb-en">to ${esc(v.en)} · ${esc(v.binyanName)}</div>
    ${slotChips(item)}
    ${isNew && !v.weak ? shapeHint(item) : ''}
    ${isNew && v.weak ? `<p class="shape-hint">Weak root (${esc(v.weak)}) — this verb bends the usual shape. Learn it as it is.</p>` : ''}</div>`;
}

/** Check an answer for a verb card. Returns {verdict, target, note}. */
export function check(c, format, input, ix = null) {
  const item = c.item;
  const v = item.verb;
  if (format === 'shape' && ix?.kind === 'boxes') return checkShape(item, ix);
  if (!input.trim()) return { verdict: 'wrong', target: item.he, note: '' };
  if (format === 'root') {
    return checkRoot(input, v.root)
      ? { verdict: 'correct', target: v.root, note: '' }
      : { verdict: 'wrong', target: v.root, note: 'Root letters only — drop prefixes like ל/ה/מ and vowel letters like ו/י.' };
  }
  if (format === 'binyan') {
    const got = matchBinyan(input);
    return got === v.binyanName
      ? { verdict: 'correct', target: v.binyanName, note: '' }
      : { verdict: 'wrong', target: v.binyanName, note: got ? `${got} is a different pattern.` : 'Type one of: pa\'al, nif\'al, pi\'el, hif\'il, hitpa\'el.' };
  }
  const r = checkAnswer(input, answersFor(item), 'strict');
  if (r.verdict !== 'correct') {
    const d = diagnose(input, item);
    if (d) r.note = d + (r.note ? ' ' + r.note : '');
  }
  return r;
}

/** The letters that belong in a letter-box card's boxes (the root, in order). */
export function boxTarget(c) {
  return rootLetters(c.item.verb.root);
}

function checkShape(item, ix) {
  const root = rootLetters(item.verb.root);
  const got = ix.vals.map((x) => skeleton(x));
  const lettersOk = root.every((l, i) => got[i] === l);
  const soundOk = !ix.sound || ix.soundPick === ix.sound.answer;
  const built = withFinal(fillShape(item.shape.spell, item.verb.root, item.binyan));
  const notes = [];
  if (!lettersOk) {
    notes.push(`The root is ${root.join('־')}: box 1 = ${root[0]}, box 2 = ${root[1]}, box 3 = ${root[2]}.`);
  }
  if (!soundOk) notes.push(`It sounds like ${ix.sound.options[ix.sound.answer]}${ix.soundPick !== null ? `, not ${ix.sound.options[ix.soundPick]}` : ''}.`);
  return {
    verdict: lettersOk && soundOk ? 'correct' : lettersOk ? 'almost' : 'wrong',
    target: item.he, note: notes.join(' ') + (lettersOk ? ` Spelled ${built}.` : ''),
  };
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

/** The binyan's pronunciation patterns for one tense (for "how does it sound?"). */
function soundChoice(binyan, tense, seed) {
  const all = [...new Set(Object.values(SHAPES).map((b) => b[tense]?.say).filter(Boolean))];
  const answer = SHAPES[binyan][tense].say;
  const opts = IX.shuffle([answer, ...IX.shuffle(all.filter((x) => x !== answer), seed).slice(0, 3)], seed + 7);
  return { options: opts, answer: opts.indexOf(answer) };
}

/**
 * The interactive widget for a verb card, or null to type freely.
 * reps: how many times the card has been answered; scaffold: choose → build → type.
 */
export function interaction(c, format, { reps = 0, scaffold = true, practice = false } = {}) {
  const item = c.item;
  const v = item.verb;
  const seed = IX.hash(`${c.id}:${reps}`);
  if (format === 'shape') {
    const parts = [...item.shape.spell].map((ch) => (/[123]/.test(ch) ? { slot: Number(ch) - 1 } : { fixed: ch }));
    const root = rootLetters(v.root);
    return IX.boxes(parts, 3, reps < 3 ? IX.shuffle(root, seed) : null, {
      title: `Build the ${item.binyan} ${TENSE_EN[item.tense]} of ${root.join('־')}`, sound: soundChoice(item.binyan, item.tense, seed),
    });
  }
  if (format === 'root') {
    let bank = null;
    if (reps < 3) {
      bank = [...stripNiqqud(v.inf).replace(/[^א-ת]/g, '')];
      if (v.weak) for (const ch of 'הוינ') if (!bank.includes(ch)) bank.push(ch);
    }
    return IX.boxes([{ slot: 0 }, { slot: 1 }, { slot: 2 }], 3, bank, {
      title: bank ? `Tap the 3 root letters, in order${v.weak ? ' (a weak root hides a letter — the extra tiles at the end can help)' : ''}` : 'Type the 3 root letters, one per box',
    });
  }
  if (format === 'binyan') {
    const names = ["pa'al", "nif'al", "pi'el", "hif'il", "hitpa'el"];
    const ix = IX.choice(v.binyanName, names.filter((n) => n !== v.binyanName).map((n) => ({ he: n, sub: `${BINYANIM[n].he} · ${SHAPES[n].inf.say}` })), seed, { max: 5, latin: true, title: 'Which pattern?' });
    for (const o of ix.options) if (o.ok) o.sub = `${BINYANIM[o.he].he} · ${SHAPES[o.he].inf.say}`;
    ix.options.sort((a, b) => names.indexOf(a.he) - names.indexOf(b.he));
    return ix;
  }
  if (!scaffold || practice || reps >= 2) return null;
  const distractors = formDistractors(item, seed);
  if (reps === 0 || /\s/.test(stripNiqqud(item.he).trim())) {
    return IX.choice(item.he, distractors, seed, { title: item.tense === 'inf' ? 'Pick the right infinitive' : 'Pick the right form — watch the person and gender' });
  }
  const ix = IX.letterTiles(item.he, distractors.map((d) => d.he), seed);
  ix.title = 'Build it from the letters — there are a couple of extras';
  return ix;
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
  if (format === 'root' || format === 'binyan') {
    const b = BINYANIM[v.binyanName];
    parts.push(`<div class="answer-he">${he(v.root)}</div>`);
    parts.push(`<p class="answer-plain">root ${he(v.root)} · binyan <b>${esc(v.binyanName)}</b> ${b ? he(b.he) : ''}</p>`);
    const s = shapeFor({ ...item, tense: 'inf' });
    if (s && !v.weak) parts.push(`<p class="shape-hint">${esc(v.binyanName)} infinitive shape: <b class="say">${esc(s.say)}</b> · spelled ${shapeSlots(s.spell)} → ${he(v.inf)}</p>`);
    if (v.weak) parts.push(`<p class="shape-hint">Weak root (${esc(v.weak)}): one root letter hides in some forms.</p>`);
  } else if (format === 'shape') {
    const s = item.shape;
    parts.push(`<div class="prompt-row"><div class="answer-he">${he(item.he)}</div>${sayBtn(item.he)}</div>`);
    parts.push(`<p class="shape-hint">Every regular ${esc(item.binyan)} ${esc(TENSE_EN[item.tense])} sounds like <b class="say">${esc(s.say)}</b> and is spelled ${shapeSlots(s.spell)}</p>`);
  } else {
    const target = verdict?.target || item.he;
    parts.push(`<div class="prompt-row"><div class="answer-he">${he(target)}</div>${sayBtn(target)}</div>`);
    if (store.settings().niqqud) parts.push(`<p class="answer-plain">spelled ${he(stripNiqqud(target))}</p>`);
    const others = answersFor(item).filter((a) => stripNiqqud(a) !== stripNiqqud(target));
    if (others.length) parts.push(`<p class="answer-plain">also accepted: ${others.map((o) => he(o)).join(' · ')}</p>`);
    const s = shapeFor(item);
    if (s && !v.weak && item.tense !== 'inf') parts.push(`<p class="shape-hint">${esc(v.binyanName)} ${esc(TENSE_EN[item.tense])} shape (${esc(s.form)}): <b class="say">${esc(s.say)}</b> · ${he(s.filled)}</p>`);
    for (const n of registerNotes(item)) parts.push(`<div class="note register">${esc(heb(n))}</div>`);
    parts.push(tenseTable(item));
  }
  if (v.weak) parts.push(`<div class="note">${esc(heb(v.note || `Weak root (${v.weak}).`))}</div>`);
  else if (v.note && format !== 'root' && format !== 'binyan') parts.push(`<div class="note">${esc(heb(v.note))}</div>`);

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
