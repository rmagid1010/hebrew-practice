// Rendering and checking for verb (conjugation) cards in the review screen.
import { checkAnswer, stripNiqqud } from '../hebrew.js';
import { answersFor, itemKey } from '../decks.js';
import { BINYANIM, matchBinyan, shapeBlanks } from '../verbcheck.js';
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

function shapeHint(item) {
  const s = shapeFor(item);
  if (!s) return '';
  return `<p class="shape-hint">Shape for ${esc(item.verb.binyanName)} ${esc(TENSE_EN[item.tense])} (${esc(s.form)}): <b class="say">${esc(s.say)}</b> · spelled <span class="he" lang="he">${esc(shapeBlanks(s.spell))}</span></p>`;
}

export function promptHtml(c, format) {
  const item = c.item;
  const v = item.verb;
  const isNew = !store.get().cards[c.id];

  if (format === 'root') {
    return `<div class="conj-prompt"><div class="prompt-row"><span class="conj-verb">${he(v.inf)}</span></div>
      <div class="conj-verb-en">to ${esc(v.en)}</div>
      <p class="prompt-hint">Type its three root letters (e.g. for לִכְתּוֹב: כתב).</p></div>`;
  }
  if (format === 'binyan') {
    return `<div class="conj-prompt"><div class="prompt-row"><span class="conj-verb">${he(v.inf)}</span></div>
      <div class="conj-verb-en">to ${esc(v.en)}</div>
      <p class="prompt-hint">Which binyan is it? Type <i>pa'al, nif'al, pi'el, hif'il</i> or <i>hitpa'el</i> (Hebrew names work too).</p></div>`;
  }
  if (format === 'shape') {
    const s = item.shape;
    return `<div class="conj-prompt">
      <div class="shape-box"><div class="shape-title">${esc(item.binyan)} · ${esc(TENSE_EN[item.tense])}${item.slot ? ` · ${esc(PERSON_EN[item.slot])}` : ''}</div>
        <div class="shape-say">${esc(s.say)}</div><div class="he shape-spell" lang="he">${esc(shapeBlanks(s.spell))}</div>
        <div class="small muted">1 · 2 · 3 = the root letters</div></div>
      <p class="prompt-hint">Apply the shape to the root ${he(v.root)} (to ${esc(v.en)}).</p></div>`;
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
      ${isNew ? '<p class="prompt-hint">Type the infinitive (the "to …" form).</p>' : ''}</div>`;
  }
  return `<div class="conj-prompt">
    <div class="prompt-row"><span class="conj-verb">${he(v.inf)}</span></div>
    <div class="conj-verb-en">to ${esc(v.en)} · ${esc(v.binyanName)}</div>
    ${slotChips(item)}
    ${isNew && !v.weak ? shapeHint(item) : ''}
    ${isNew && v.weak ? `<p class="shape-hint">Weak root (${esc(v.weak)}) — this verb bends the usual shape. Learn it as it is.</p>` : ''}</div>`;
}

/** Check an answer for a verb card. Returns {verdict, target, note}. */
export function check(c, format, input) {
  const item = c.item;
  const v = item.verb;
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
    if (s && !v.weak) parts.push(`<p class="shape-hint">${esc(v.binyanName)} infinitive shape: <b class="say">${esc(s.say)}</b> · spelled <span class="he" lang="he">${esc(shapeBlanks(s.spell))}</span> → ${he(v.inf)}</p>`);
    if (v.weak) parts.push(`<p class="shape-hint">Weak root (${esc(v.weak)}): one root letter hides in some forms.</p>`);
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
