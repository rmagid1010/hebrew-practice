// Free-writing cards: an English situation, you write your own Hebrew, we check the key elements.
import { checkElements, stripNiqqud } from '../hebrew.js';
import { itemByKey } from '../decks.js';
import { esc, he, heb, sayBtn } from '../ui.js';

export function promptHtml(c) {
  const item = c.item;
  const words = (item.req || []).map(itemByKey).filter(Boolean);
  return `<div class="write-prompt">
      <div class="prompt-en">${esc(item.en)}</div>
      ${item.hint ? `<p class="prompt-hint">${esc(item.hint)}</p>` : ''}
      <p class="prompt-hint">Write it yourself in Hebrew — there's no single right answer.</p>
      ${words.length ? `<details class="write-help"><summary>Stuck? Show words you could use</summary>
        <div class="write-words">${words.map((w) => `<span>${he(w.he)} <small>${esc(w.en)}</small></span>`).join('')}</div></details>` : ''}
    </div>`;
}

export function formHtml() {
  return `<form data-form="check" autocomplete="off">
      <textarea class="answer-input write-input" name="answer" lang="he" dir="rtl" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="כתוב כאן…" aria-label="Your answer in Hebrew"></textarea>
      <div class="input-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-act="idk">Show me an answer</button>
        <span class="kbd-hint"><kbd>Enter</kbd> to check · <kbd>Shift</kbd>+<kbd>Enter</kbd> new line</span>
        <button class="btn btn-primary" type="submit">Check</button>
      </div>
    </form>`;
}

/** → {verdict, target, note, results} */
export function check(c, input) {
  const item = c.item;
  const results = checkElements(input || '', item.elements || []);
  const hits = results.filter((r) => r.ok).length;
  const n = results.length || 1;
  const verdict = !input.trim() ? 'wrong' : hits === n ? 'correct' : hits / n >= 0.5 ? 'almost' : 'wrong';
  const note = !input.trim() ? '' : verdict === 'correct'
    ? 'All the key parts are there. Compare with the model answer for spelling and word order, then grade yourself.'
    : 'Some key parts are missing (or spelled differently). Check the list, compare with the model answer, and grade yourself honestly.';
  return { verdict, target: item.he, note, results };
}

export function answeredHtml(c, verdict, typed) {
  const item = c.item;
  const titles = { correct: 'Looks good!', almost: 'Partly there', wrong: typed.trim() ? 'Missing key parts' : 'Here are some answers' };
  const list = (verdict.results || []).map((r) => `<li class="${r.ok ? 'ok' : 'miss'}">${r.ok ? '✓' : '✗'} <b>${esc(r.label)}</b>
      ${r.ok ? `— ${he(r.hit)}` : `— e.g. ${r.any.slice(0, 3).map((a) => he(a)).join(' / ')}`}</li>`).join('');
  return `
    ${typed.trim() ? `<div class="write-mine"><small>You wrote</small><div class="he" lang="he" dir="rtl">${esc(typed)}</div></div>` : ''}
    <div class="verdict ${verdict.verdict}">
      <div class="verdict-title">${titles[verdict.verdict]}</div>
      ${verdict.note ? `<div class="small">${esc(verdict.note)}</div>` : ''}
      ${list ? `<ul class="elements">${list}</ul>` : ''}
    </div>
    <div class="reveal">
      <div class="small muted">Model answer${item.models.length > 1 ? 's' : ''}</div>
      ${item.models.map((m) => `<div class="model">${sayBtn(m)}<div class="he" lang="he" dir="rtl">${esc(heb(m))}</div>
        <div class="small muted he" dir="rtl">${esc(stripNiqqud(m))}</div></div>`).join('')}
      <p class="rate-hint">Your own answer can be different and still right. Grade how well you could say it.</p>
    </div>`;
}
