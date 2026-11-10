import { getCatalog, getDeck, itemKey } from '../decks.js';
import { stripNiqqud } from '../hebrew.js';
import { State, formatInterval } from '../fsrs.js';
import * as store from '../store.js';
import { esc, he, heb, sayBtn, regChip, toast } from '../ui.js';

const FLAG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/></svg>';

export function renderWords(app, deckId) {
  const state = { q: '', deck: deckId || '', reg: '', flaggedOnly: false };

  app.innerHTML = `
    <div class="row" style="margin-bottom:8px"><h1 style="margin:0">Words &amp; phrases</h1><span class="spacer"></span><a class="btn btn-sm" href="#/add">+ Add your own</a></div>
    <p class="muted">Search in Hebrew or English. Use the flag to mark anything that looks wrong or unnatural — flagged items are listed in Settings.</p>
    <div class="filters">
      <input type="search" id="q" placeholder="Search… חיפוש" aria-label="Search">
      <select id="deck" aria-label="Deck"><option value="">All decks</option>${getCatalog().map((d) => `<option value="${esc(d.id)}" ${d.id === deckId ? 'selected' : ''}>${esc(d.title)}</option>`).join('')}</select>
      <select id="reg" aria-label="Register"><option value="">Any register</option><option value="slang">Slang</option><option value="casual">Casual</option><option value="neutral">Neutral</option><option value="formal">Formal</option><option value="flagged">Flagged only</option></select>
    </div>
    <div id="list"></div>`;

  const list = app.querySelector('#list');

  function status(item) {
    const st = store.get();
    const key = itemKey(item);
    const cs = ['r', 'w'].map((t) => st.cards[`${key}:${t}`]).filter(Boolean);
    if (!cs.length) return '<span class="status-new">new</span>';
    const now = Date.now();
    if (cs.some((c) => c.state === State.Learning || c.state === State.Relearning)) return '<span class="status-learning">learning</span>';
    const due = Math.min(...cs.map((c) => c.due));
    if (due <= now) return '<span class="status-due">due now</span>';
    return `<span>next in ${formatInterval(due, now)}</span>`;
  }

  function draw() {
    const q = stripNiqqud(state.q.trim().toLowerCase());
    const st = store.get();
    const decks = state.deck ? [getDeck(state.deck)] : getCatalog().map((d) => getDeck(d.id));
    let rows = [];
    for (const d of decks) {
      if (!d) continue;
      for (const item of d.items) {
        if (state.reg === 'flagged' && !st.flagged[itemKey(item)]) continue;
        if (state.reg && state.reg !== 'flagged' && item.reg !== state.reg) continue;
        if (q) {
          const hay = (stripNiqqud(item.he) + ' ' + (item.alt || []).join(' ') + ' ' + item.en + ' ' + (item.note || '')).toLowerCase();
          if (!hay.includes(q)) continue;
        }
        rows.push(item);
      }
    }
    const total = rows.length;
    rows = rows.slice(0, 300);
    list.innerHTML = rows.length ? `<p class="small muted">${total} item${total === 1 ? '' : 's'}${total > 300 ? ' (showing 300)' : ''}</p>` + rows.map((item) => {
      const key = itemKey(item);
      const flagged = !!st.flagged[key];
      const extra = item.note || item.ex?.length || item.alt?.length;
      const label = item.kind === 'conj' ? `${item.en} · ${item.tense}${item.person ? ' · ' + item.person : ''}` : item.en;
      return `<div class="word">
        <div class="word-he">${he(item.he)}</div>
        <div><div class="word-en">${esc(label)}</div>
          <div class="word-sub">${regChip(item.reg)}${status(item)}${state.deck ? '' : `<span>· ${esc(getDeck(item.deck)?.meta.title || '')}</span>`}</div></div>
        <div class="word-actions">${sayBtn(item.he)}
          <button class="icon-btn ${flagged ? 'flagged' : ''}" data-flag="${esc(key)}" title="${flagged ? 'Unflag' : 'Flag as wrong / unnatural'}" aria-label="Flag">${FLAG}</button>
        </div>
        ${extra ? `<details><summary>details</summary>
          ${item.alt?.length ? `<p class="small">Also accepted: ${item.alt.map((a) => he(a)).join(' · ')}</p>` : ''}
          ${item.note ? `<div class="note">${esc(heb(item.note))}</div>` : ''}
          ${item.ex?.length ? `<div class="examples">${item.ex.map(([h, e]) => `<div class="example">${sayBtn(h)}<div class="he" lang="he" dir="rtl">${esc(heb(h))}</div><div class="en">${esc(e)}</div></div>`).join('')}</div>` : ''}
        </details>` : ''}
      </div>`;
    }).join('') : '<p class="empty">Nothing matches.</p>';
  }

  const qEl = app.querySelector('#q');
  qEl.addEventListener('input', () => { state.q = qEl.value; draw(); });
  app.querySelector('#deck').addEventListener('change', (e) => { state.deck = e.target.value; draw(); });
  app.querySelector('#reg').addEventListener('change', (e) => { state.reg = e.target.value; draw(); });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-flag]');
    if (!b) return;
    const st = store.get();
    const k = b.dataset.flag;
    if (st.flagged[k]) { delete st.flagged[k]; toast('Unflagged'); }
    else { st.flagged[k] = Date.now(); toast('Flagged — see Settings for the list'); }
    store.save();
    draw();
  });
  draw();
}
