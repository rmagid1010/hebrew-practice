import { counts, newLeftToday, dailyCounts, streak, retention30 } from '../session.js';
import { getCatalog, cards, isLocked } from '../decks.js';
import { currentLesson, lessonStatuses, courseNewCards, UNLOCK_SHARE } from '../course.js';
import * as store from '../store.js';
import { esc, he } from '../ui.js';
import { dayKey } from '../fsrs.js';

export function renderHome(app) {
  const st = store.get();
  const c = counts();
  const newAvailEnabled = getCatalog()
    .filter((d) => st.enabledDecks.includes(d.id))
    .reduce((n, d) => n + counts(d.id).newAvail, 0);
  const courseNew = courseNewCards().filter((id) => { const cc = cards().get(id); return cc && !isLocked(cc.item); }).length;
  const newToday = Math.min(newLeftToday(), courseNew);
  void newAvailEnabled;
  const lessons = lessonStatuses();
  const cur = currentLesson();
  const curN = lessons.findIndex((x) => x.lesson.id === cur.lesson.id) + 1;
  const doneLessons = lessons.filter((x) => x.status === 'done').length;
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
      <b>Welcome!</b> Press <b>Continue course</b> and the site takes you through A1 and A2 step by step: a few new words, verbs and sentences each day,
      your reviews mixed in, and short writing tasks. Read <a href="#/grammar/reading">Reading Hebrew</a> when you have 10 minutes.
    </div>` : ''}
    <section class="card hero course-hero">
      <div>
        <div class="small muted">Course · ${esc(cur.lesson.level)} · lesson ${curN} of ${lessons.length}</div>
        <h1>${esc(cur.lesson.title)} ${he(cur.lesson.he, 'muted')}</h1>
        <div class="progress" style="max-width:420px" title="${cur.stats.learnt}/${cur.stats.total} cards learnt"><span style="width:${Math.round(cur.stats.share * 100)}%"></span></div>
        <p class="muted small" style="margin:6px 0 0">${cur.stats.learnt}/${cur.stats.total} cards learnt in this lesson · next lesson opens at ${Math.round(UNLOCK_SHARE * 100)}% · ${doneLessons} lesson${doneLessons === 1 ? '' : 's'} complete</p>
        <div class="hero-counts">
          <div class="count new"><b>${newToday}</b><span>new today</span></div>
          <div class="count learn"><b>${c.learning}</b><span>learning</span></div>
          <div class="count due"><b>${c.due}</b><span>to review</span></div>
        </div>
      </div>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="#/study">${total ? 'Continue course' : 'Open course session'}</a>
        <a class="btn" href="#/course/${esc(cur.lesson.id)}">Lesson notes</a>
        <a class="btn btn-ghost btn-sm" href="#/review">Reviews &amp; my decks only</a>
      </div>
    </section>

    ${needBackup ? `<div class="notice" style="margin-top:16px">Your progress is only stored in this browser. <a href="#/settings">Download a backup</a> so you don't lose it.</div>` : ''}

    <div class="grid grid-4" style="margin-top:16px">
      <div class="card stat"><b>${streak()}</b><span>day streak</span></div>
      <div class="card stat"><b>${doneToday}</b><span>answers today</span></div>
      <div class="card stat"><b>${ret === null ? '—' : Math.round(ret * 100) + '%'}</b><span>remembered (30 days)</span></div>
      <div class="card stat"><b>${itemsKnown}</b><span>words &amp; phrases started</span></div>
    </div>

    <div class="section-title"><h2>Reading Hebrew</h2><a class="small" href="#/reading">Open reading →</a></div>
    <div class="grid grid-2 reading-home">
      <a href="#/reading/learn/reading" class="tile-link"><div class="card reading-card"><div class="reading-glyph he" lang="he">אָבָּא</div>
        <h3>Alphabet, vowels &amp; spelling</h3><p class="muted small" style="margin:0">Letters, final forms, niqqud, the b/v k/ch p/f dot, full spelling — and typing on a Hebrew keyboard.</p></div></a>
      <a href="#/reading/learn/cursive" class="tile-link"><div class="card reading-card"><div class="reading-glyph cursive" lang="he">אבג</div>
        <h3>Reading cursive</h3><p class="muted small" style="margin:0">The handwritten alphabet, letters that look nothing like print, and practice notes.</p></div></a>
      ${['cursive-letters', 'cursive-words'].map((id) => { const cc = counts(id); const d = getCatalog().find((x) => x.id === id); return d ? `<div class="card deck"><div class="deck-head"><div class="deck-title">${esc(d.title)}</div></div>
        <div class="deck-stats"><span><b>${cc.seen}</b>/${cc.total} started</span><span><b>${cc.due + cc.learning}</b> due</span><span class="spacer"></span><a href="#/review/${esc(id)}">Practise →</a></div></div>` : ''; }).join('')}
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
        ['#/verbs/learn/binyanim', 'What are binyanim?', 'The seven verb patterns, and why roots matter.'],
        ['#/grammar/spoken', 'How people actually talk', 'The gap between the textbook and the street.'],
        ['#/grammar/adjectives', 'Adjectives & comparisons', 'Agreement, word order, this/that, more/most/too.'],
        ['#/grammar/prepositions', 'Prepositions with endings', 'לי, שלי, איתי, אצלי, אותי — and which verbs take which.'],
      ].map(([href, t, s]) => `<a href="${href}"><div class="card"><h3>${esc(t)}</h3><p class="muted small" style="margin:0">${s.replace(/[֐-׿][֐-׿ ]*[֐-׿]/g, (m) => he(m))}</p></div></a>`).join('')}
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
