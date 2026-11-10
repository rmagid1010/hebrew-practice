import { counts, newLeftToday, dailyCounts, streak, retention30 } from '../session.js';
import { getCatalog } from '../decks.js';
import * as store from '../store.js';
import { esc, he } from '../ui.js';
import { dayKey } from '../fsrs.js';

export function renderHome(app) {
  const st = store.get();
  const c = counts();
  const newAvailEnabled = getCatalog()
    .filter((d) => st.enabledDecks.includes(d.id))
    .reduce((n, d) => n + counts(d.id).newAvail, 0);
  const newToday = Math.min(newLeftToday(), newAvailEnabled);
  const total = c.due + c.learning + newToday;
  const today = dayKey(Date.now());
  const doneToday = st.log.filter(([ts]) => dayKey(ts) === today).length;
  const ret = retention30();
  const itemsKnown = new Set(Object.keys(st.cards).map((id) => id.split(':')[0])).size;
  const first = st.log.length === 0;

  const heat = dailyCounts(7 * 16);
  const max = Math.max(1, ...heat.map(([, n]) => n));
  // pad so the first column starts on Sunday
  const firstDow = new Date(heat[0][0] + 'T12:00').getDay();
  const cells = Array(firstDow).fill('<i style="visibility:hidden"></i>')
    .concat(heat.map(([k, n]) => `<i data-l="${n ? Math.min(4, Math.ceil((n / max) * 4)) : 0}" title="${k}: ${n} review${n === 1 ? '' : 's'}"></i>`));

  const lastExport = st.lastExport || 0;
  const needBackup = st.log.length > 30 && Date.now() - lastExport > 7 * 86400000;

  const enabled = getCatalog().filter((d) => st.enabledDecks.includes(d.id));

  app.innerHTML = `
    ${first ? `<div class="notice notice-info" style="margin-bottom:16px">
      <b>Welcome!</b> Each day you'll get reviews (cards you've seen) plus a few new cards from the decks you've switched on.
      Start with <b>Street Essentials</b>, and read <a href="#/grammar/reading">Reading Hebrew</a> and <a href="#/grammar/binyanim">What are binyanim?</a> when you have 10 minutes.
    </div>` : ''}
    <section class="card hero">
      <div>
        <h1>${total ? 'Ready when you are' : 'All caught up'} ${he(total ? 'יַאלְלָה, מַתְחִילִים' : 'יֵשׁ! סִיַּמְנוּ', 'muted')}</h1>
        <p class="muted" style="margin:0">${total ? 'Reviews first, then new cards mixed in.' : 'Nothing is due. Learn extra cards from a deck, or read a grammar page.'}</p>
        <div class="hero-counts">
          <div class="count new"><b>${newToday}</b><span>new today</span></div>
          <div class="count learn"><b>${c.learning}</b><span>learning</span></div>
          <div class="count due"><b>${c.due}</b><span>to review</span></div>
        </div>
      </div>
      <a class="btn btn-primary btn-lg" href="#/review">${total ? 'Start review' : 'Open review'}</a>
    </section>

    ${needBackup ? `<div class="notice" style="margin-top:16px">Your progress is only stored in this browser. <a href="#/settings">Download a backup</a> so you don't lose it.</div>` : ''}

    <div class="grid grid-4" style="margin-top:16px">
      <div class="card stat"><b>${streak()}</b><span>day streak</span></div>
      <div class="card stat"><b>${doneToday}</b><span>answers today</span></div>
      <div class="card stat"><b>${ret === null ? '—' : Math.round(ret * 100) + '%'}</b><span>remembered (30 days)</span></div>
      <div class="card stat"><b>${itemsKnown}</b><span>words &amp; phrases started</span></div>
    </div>

    <div class="section-title"><h2>Activity</h2><span class="small muted">last 16 weeks</span></div>
    <div class="card"><div class="heatmap" aria-label="Reviews per day">${cells.join('')}</div></div>

    <div class="section-title"><h2>In your daily mix</h2><a class="small" href="#/decks">Manage decks →</a></div>
    <div class="grid grid-2">
      ${enabled.map((d) => deckMini(d)).join('') || '<p class="muted">No decks switched on. <a href="#/decks">Pick some</a>.</p>'}
    </div>

    <div class="section-title"><h2>Grammar</h2><a class="small" href="#/grammar">All explainers →</a></div>
    <div class="grid grid-2 grammar-list">
      ${[
        ['reading', 'Reading Hebrew', 'Letters, vowels, final forms and full spelling.'],
        ['binyanim', 'What are binyanim?', 'The seven verb patterns, and why roots matter.'],
        ['cursive', 'Reading cursive', 'The handwritten alphabet, with practice notes.'],
        ['spoken', 'How people actually talk', 'The gap between the textbook and the street.'],
      ].map(([id, t, s]) => `<a href="#/grammar/${id}"><div class="card"><h3>${esc(t)}</h3><p class="muted small" style="margin:0">${s.replace(/[֐-׿][֐-׿ ]*[֐-׿]/g, (m) => he(m))}</p></div></a>`).join('')}
    </div>
  `;
}

function deckMini(d) {
  const c = counts(d.id);
  const pct = c.total ? Math.round((c.seen / c.total) * 100) : 0;
  return `<div class="card deck">
    <div class="deck-head"><div><div class="deck-title">${esc(d.title)}</div></div>${d.he ? he(d.he, 'deck-he') : ''}</div>
    <div class="progress" title="${pct}% started"><span style="width:${pct}%"></span></div>
    <div class="deck-stats"><span><b>${c.seen}</b>/${c.total} cards started</span><span><b>${c.due + c.learning}</b> due</span>
    <span class="spacer"></span><a href="#/review/${esc(d.id)}">Study →</a></div>
  </div>`;
}
