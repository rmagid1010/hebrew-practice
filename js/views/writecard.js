// Free-writing cards: an English situation, you write your own Hebrew, we check the key elements.
import { checkElements, stripNiqqud } from '../hebrew.js';
import { itemByKey } from '../decks.js';
import { checkAgreement, whoLabel, whoClass } from '../gender.js';
import { mixed, esc, he, heb, sayBtn } from '../ui.js';

export function promptHtml(c, face) {
  const item = c.item;
  const words = (item.req || []).map(itemByKey).filter(Boolean);
  return `<div class="write-prompt">
      ${face?.w ? `<div class="who-badge ${whoClass(face.w)}">${esc(whoLabel(face.w))}</div>` : ''}
      <div class="prompt-en">${esc(item.en)}</div>
      ${item.hint ? `<p class="prompt-hint">${esc(item.hint)}</p>` : ''}
      <p class="prompt-hint">Write it yourself in Hebrew — there's no single right answer${face?.w ? ', but every verb and adjective has to match who is speaking and who you\'re talking to' : ''}.</p>
      ${words.length ? `<details class="write-help"><summary>Stuck? Show words you could use</summary>
        <div class="write-words">${words.map((w) => `<span>${he(w.he)} <small>${esc(w.en)}</small></span>`).join('')}</div></details>` : ''}
    </div>`;
}

export function formHtml() {
  return `<form data-form="check" autocomplete="off">
      <textarea class="answer-input write-input" name="answer" lang="he" dir="rtl" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="כּוֹתְבִים כָּאן…" aria-label="Your answer in Hebrew"></textarea>
      <div class="input-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-act="idk">Show me an answer</button>
        <span class="kbd-hint"><kbd>Enter</kbd> to check · <kbd>Shift</kbd>+<kbd>Enter</kbd> new line</span>
        <button class="btn btn-primary" type="submit">Check</button>
      </div>
    </form>`;
}

/** → {verdict, target, note, results, gender, models} */
export function check(c, input, face) {
  const item = c.item;
  const results = checkElements(input || '', item.elements || []);
  const hits = results.filter((r) => r.ok).length;
  const n = results.length || 1;
  const gender = input.trim() ? checkAgreement(input, face?.persona || {}).map((e) => e.msg) : [];
  let verdict = !input.trim() ? 'wrong' : hits === n ? 'correct' : hits / n >= 0.5 ? 'almost' : 'wrong';
  if (gender.length) verdict = 'wrong';
  const note = !input.trim() ? '' : gender.length
    ? 'Fix the forms below — getting gender right is part of the answer.'
    : verdict === 'correct'
      ? 'All the key parts are there. Compare with the model answer for spelling and word order, then grade yourself.'
      : 'Some key parts are missing (or spelled differently). Check the list, compare with the model answer, and grade yourself honestly.';
  const models = face?.models || item.models;
  return { verdict, target: models[0], note, results, gender, models };
}

export function answeredHtml(c, verdict, typed) {
  const item = c.item;
  const titles = { correct: 'Looks good!', almost: 'Partly there', wrong: !typed.trim() ? 'Here are some answers' : verdict.gender?.length ? 'Gender mistake' : 'Missing key parts' };
  const list = (verdict.results || []).map((r) => `<li class="${r.ok ? 'ok' : 'miss'}">${r.ok ? '✓' : '✗'} <b>${esc(r.label)}</b>
      ${r.ok ? `— ${he(r.hit)}` : `— e.g. ${r.any.slice(0, 3).map((a) => he(a)).join(' / ')}`}</li>`).join('');
  return `
    ${typed.trim() ? `<div class="write-mine"><small>You wrote</small><div class="he" lang="he" dir="rtl">${esc(typed)}</div></div>` : ''}
    <div class="verdict ${verdict.verdict}">
      <div class="verdict-title">${titles[verdict.verdict]}</div>
      ${verdict.note ? `<div class="small">${mixed(verdict.note)}</div>` : ''}
      ${verdict.gender?.length ? `<ul class="gender-errors" dir="ltr">${verdict.gender.map((g) => `<li>⚥ ${mixed(g)}</li>`).join('')}</ul>` : ''}
      ${list ? `<ul class="elements">${list}</ul>` : ''}
    </div>
    <div class="reveal">
      <div class="small muted">Model answer${(verdict.models || item.models).length > 1 ? 's' : ''}</div>
      ${(verdict.models || item.models).map((m) => `<div class="model">${sayBtn(m)}<div class="he" lang="he" dir="rtl">${esc(heb(m))}</div>
        <div class="small muted he" dir="rtl">${esc(stripNiqqud(m))}</div></div>`).join('')}
      <p class="rate-hint">Your own answer can be different and still right. Grade how well you could say it.</p>
    </div>`;
}
