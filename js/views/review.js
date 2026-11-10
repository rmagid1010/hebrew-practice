import { Session, scheduler, newLeftToday } from '../session.js';
import { cards, answersFor, personLabel, tenseLabel, getDeck } from '../decks.js';
import { checkAnswer, diff, stripNiqqud } from '../hebrew.js';
import { previewLabel, newCard, State } from '../fsrs.js';
import * as store from '../store.js';
import * as tts from '../tts.js';
import { esc, he, heb, sayBtn, regChip } from '../ui.js';
import { updateBadge } from '../app.js';

const RATING_NAMES = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };
const RATING_CLASS = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };
const VERDICT_RATING = { correct: 3, almost: 2, wrong: 1 };

export function renderReview(app, deckId, opts = {}) {
  const session = new Session({ deck: deckId, extraNew: opts.extraNew || 0 });
  let current = null;     // card id
  let phase = 'ask';      // 'ask' | 'answered'
  let suggested = 3;
  let verdict = null;
  let waitTimer = null;

  const deckTitle = deckId ? getDeck(deckId)?.meta.title : null;

  function show() {
    clearTimeout(waitTimer);
    current = session.next();
    phase = 'ask';
    verdict = null;
    if (!current) return finished();
    const c = cards().get(current);
    const st = store.get().cards[current];
    // If the next card is a learning card that isn't due yet, it was picked via "learn ahead". Fine.
    render(c, st);
  }

  function header() {
    const r = session.remaining();
    const cur = current ? store.get().cards[current] : null;
    const curKind = !cur ? 'n' : (cur.state === State.Learning || cur.state === State.Relearning) ? 'l' : 'r';
    const fmt = (n, k) => (k === curKind ? `<u>${n}</u>` : String(n));
    return `<div class="review-top">
      <a class="btn btn-ghost btn-sm" href="#/">← Home</a>
      ${deckTitle ? `<span class="chip">${esc(deckTitle)}</span>` : ''}
      <span class="spacer"></span>
      <div class="review-counts" title="New · Learning · Review">
        <span class="n">${fmt(r.newLeft, 'n')}</span><span class="l">${fmt(r.learning, 'l')}</span><span class="r">${fmt(r.reviewLeft, 'r')}</span>
      </div>
      <button class="btn btn-ghost btn-sm" data-act="undo" ${session.canUndo() ? '' : 'disabled'} title="Undo last answer (Z)">↶ Undo</button>
    </div>`;
  }

  function metaRow(c) {
    const item = c.item;
    const label = c.type === 'r' ? 'Read it' : item.kind === 'conj' ? 'Conjugate' : 'Write it in Hebrew';
    const st = store.get().cards[c.id];
    const isNew = !st;
    return `<div class="flash-meta">
      <span class="chip">${label}</span>
      ${isNew ? '<span class="chip chip-casual">new</span>' : ''}
      ${regChip(item.reg)}
      <span class="spacer"></span>
      <span class="small muted">${esc(getDeck(c.deck)?.meta.title || '')}</span>
    </div>`;
  }

  function promptHtml(c) {
    const item = c.item;
    if (item.kind === 'conj') {
      const v = item.verb;
      const [pHe, pEn] = item.person ? personLabel(item.person) : ['', ''];
      const slots = [`<div class="conj-slot"><small>tense</small><b>${esc(tenseLabel(item.tense))}</b></div>`];
      if (item.person) slots.push(`<div class="conj-slot"><small>${esc(pEn)}</small>${he(pHe)}</div>`);
      return `<div class="conj-prompt">
        ${item.tense === 'inf'
          ? `<div class="prompt-en">to ${esc(v.en)}</div><div class="conj-verb-en">${esc(v.binyanName)} · root ${he(v.root)}</div>`
          : `<div class="prompt-row"><span class="conj-verb">${he(v.inf)}</span></div><div class="conj-verb-en">to ${esc(v.en)} · ${esc(v.binyanName)}</div>`}
        <div class="conj-slots">${slots.join('')}</div>
      </div>`;
    }
    if (c.type === 'r') {
      const long = stripNiqqud(item.he).length > 14;
      return `<div class="prompt-row"><div class="prompt-he ${long ? 'long' : ''}">${he(item.he)}</div>${sayBtn(item.he)}</div>
        <p class="prompt-hint">Read it out loud. What does it mean?</p>`;
    }
    return `<div class="prompt-en">${esc(item.en)}</div>
      ${item.hint ? `<p class="prompt-hint">${esc(item.hint)}</p>` : '<p class="prompt-hint">&nbsp;</p>'}`;
  }

  function revealHtml(c) {
    const item = c.item;
    const parts = [];
    if (c.type === 'r') {
      parts.push(`<div class="answer-en">${esc(item.en)}</div>`);
      if (item.hint) parts.push(`<p class="answer-plain">${esc(item.hint)}</p>`);
    } else {
      const target = verdict?.target || item.he;
      parts.push(`<div class="prompt-row"><div class="answer-he">${he(target)}</div>${sayBtn(target)}</div>`);
      if (store.settings().niqqud) parts.push(`<p class="answer-plain">spelled ${he(stripNiqqud(target))}</p>`);
      const others = answersFor(item).filter((a) => stripNiqqud(a) !== stripNiqqud(target));
      if (others.length) parts.push(`<p class="answer-plain">also accepted: ${others.map((o) => he(o)).join(' · ')}</p>`);
      if (item.kind === 'conj' && item.verb.note) parts.push(`<div class="note">${esc(heb(item.verb.note))}</div>`);
    }
    if (item.note) parts.push(`<div class="note">${esc(heb(item.note))}</div>`);
    if (item.ex?.length) {
      parts.push(`<div class="examples">${item.ex.map(([h, e]) => `<div class="example">${sayBtn(h)}<div class="he" lang="he" dir="rtl">${esc(heb(h))}</div><div class="en">${esc(e)}</div></div>`).join('')}</div>`);
    }
    return `<div class="reveal">${parts.join('')}</div>`;
  }

  function ratingsHtml(c) {
    const st = store.get().cards[c.id] || newCard();
    const now = Date.now();
    const prev = scheduler().preview(st, now, c.id);
    const btns = [1, 2, 3, 4].map((g) => `<button class="rate ${RATING_CLASS[g]} ${g === suggested ? 'suggested' : ''}" data-rate="${g}">
        ${RATING_NAMES[g]}<small>${previewLabel(prev[g], now)}</small></button>`).join('');
    const hint = c.type === 'r'
      ? 'Be honest: <kbd>1</kbd> forgot · <kbd>2</kbd> struggled · <kbd>3</kbd> got it · <kbd>4</kbd> instant'
      : `<kbd>Enter</kbd> accepts the suggestion · <kbd>1</kbd>–<kbd>4</kbd> to override`;
    return `<div class="ratings">${btns}</div><p class="rate-hint">${hint}</p>`;
  }

  function verdictHtml(input, c) {
    if (!verdict) return '';
    const titles = { correct: 'Correct!', almost: 'Almost', wrong: input.trim() ? 'Not quite' : "Here's the answer" };
    let body = '';
    if (input.trim() && verdict.verdict !== 'correct') {
      const d = diff(input, verdict.target);
      const typed = d.typed.map((p) => (p.ok ? esc(p.t) : `<span class="x">${esc(p.t)}</span>`)).join('');
      const target = d.target.map((p) => (p.ok ? esc(p.t) : `<span class="m">${esc(p.t)}</span>`)).join('');
      body = `<div class="diff-line"><span>You wrote</span><span class="diff" lang="he">${typed}</span></div>
              <div class="diff-line"><span>Correct</span><span class="diff" lang="he">${target}</span></div>`;
    }
    void c;
    return `<div class="verdict ${verdict.verdict}">
      <div class="verdict-title">${titles[verdict.verdict]}</div>
      ${verdict.note ? `<div class="small">${esc(verdict.note)}</div>` : ''}
      ${body}
    </div>`;
  }

  function render(c, _st, inputValue = '') {
    const write = c.type === 'w';
    let body = '';
    if (phase === 'ask') {
      body = write
        ? `<form data-form="check" autocomplete="off">
            <input class="answer-input" name="answer" lang="he" dir="rtl" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="הקלד כאן…" aria-label="Your answer in Hebrew">
            <div class="input-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-act="idk">I don't know</button>
              <span class="kbd-hint">Type with your Hebrew keyboard, then <kbd>Enter</kbd></span>
              <button class="btn btn-primary" type="submit">Check</button>
            </div>
          </form>`
        : `<div class="row" style="justify-content:center"><button class="btn btn-primary btn-lg" data-act="show">Show answer</button></div>
           <p class="rate-hint"><kbd>Space</kbd> or <kbd>Enter</kbd></p>`;
    } else {
      body = (write
        ? `<input class="answer-input ${verdict?.verdict || ''}" value="${esc(inputValue)}" lang="he" dir="rtl" disabled aria-label="Your answer">${verdictHtml(inputValue, c)}`
        : '') + revealHtml(c) + ratingsHtml(c);
    }
    app.innerHTML = `${header()}<div class="card flash">${metaRow(c)}${promptHtml(c)}${body}</div>`;
    if (phase === 'ask') {
      if (write) app.querySelector('.answer-input').focus();
      if (!write && store.settings().autoplay) tts.speak(c.item.he);
    } else if (write && store.settings().autoplay) {
      tts.speak(verdict?.target || c.item.he);
    }
  }

  function check(input) {
    const c = cards().get(current);
    const mode = c.item.kind === 'conj' ? 'strict' : 'vocab';
    verdict = input.trim() ? checkAnswer(input, answersFor(c.item), mode) : { verdict: 'wrong', target: c.item.he, note: '' };
    suggested = VERDICT_RATING[verdict.verdict];
    phase = 'answered';
    render(c, null, input);
  }

  function reveal() {
    const c = cards().get(current);
    phase = 'answered';
    suggested = 3;
    render(c);
  }

  function rate(g) {
    if (phase !== 'answered' || !current) return;
    session.answer(current, g, verdict?.verdict || null);
    updateBadge();
    show();
  }

  function finished() {
    const st = store.get();
    const now = Date.now();
    const learningLater = session.learning.filter((id) => st.cards[id]).map((id) => st.cards[id].due).sort((a, b) => a - b);
    const newLeft = newLeftToday(Date.now(), deckId);
    const nextIn = learningLater.length ? Math.ceil((learningLater[0] - now) / 60000) : null;
    app.innerHTML = `<div class="card done">
      <div class="big">${session.done ? '🎉' : '☕'}</div>
      <h1>${session.done ? 'כָּל הַכָּבוֹד!' : 'Nothing due right now'}</h1>
      <p class="muted">${session.done ? `You answered ${session.done} card${session.done === 1 ? '' : 's'} this session.` : 'All caught up. Come back later, or learn something new.'}</p>
      ${nextIn ? `<p>${learningLater.length} card${learningLater.length === 1 ? '' : 's'} in learning will be back in about ${nextIn} min.</p>` : ''}
      <div class="row" style="justify-content:center">
        <a class="btn" href="#/">Home</a>
        <button class="btn btn-primary" data-act="more">Learn 5 more new cards</button>
      </div>
      ${newLeft === 0 ? '<p class="small muted" style="margin-top:14px">You hit today\'s new-card limit. Extra new cards mean more reviews tomorrow.</p>' : ''}
    </div>`;
    if (nextIn) waitTimer = setTimeout(() => { if (session.next()) show(); }, Math.max(5000, learningLater[0] - now - 20 * 60000 + 1000));
  }

  function onClick(e) {
    const t = e.target.closest('[data-act], [data-rate]');
    if (!t || !app.contains(t)) return;
    if (t.dataset.rate) return rate(Number(t.dataset.rate));
    const act = t.dataset.act;
    if (act === 'show') reveal();
    else if (act === 'idk') check('');
    else if (act === 'undo') { if (session.undo()) { updateBadge(); show(); } }
    else if (act === 'more') {
      const more = new Session({ deck: deckId, extraNew: (opts.extraNew || 0) + 5 });
      Object.assign(session, { queue: more.queue, newCards: more.newCards, opts: more.opts });
      show();
    }
  }

  function onSubmit(e) {
    const f = e.target.closest('[data-form="check"]');
    if (!f) return;
    e.preventDefault();
    check(f.answer.value);
  }

  function onKey(e) {
    if (e.target.matches('input, textarea, select') && !e.target.disabled) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (phase === 'ask' && current && cards().get(current).type === 'r' && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault(); reveal(); return;
    }
    if (phase === 'answered') {
      if (['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); rate(Number(e.key)); return; }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rate(suggested); return; }
    }
    if ((e.key === 'z' || e.key === 'ז') && session.canUndo()) { if (session.undo()) { updateBadge(); show(); } }
    if ((e.key === 'r' || e.key === 'ר') && current) { const c = cards().get(current); if (phase === 'answered' || c.type === 'r') tts.speak(c.item.he); }
  }

  app.addEventListener('click', onClick);
  app.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onKey);
  show();

  return () => {
    clearTimeout(waitTimer);
    tts.stop();
    app.removeEventListener('click', onClick);
    app.removeEventListener('submit', onSubmit);
    document.removeEventListener('keydown', onKey);
  };
}
