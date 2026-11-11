import { counts } from '../session.js';
import { visibleCatalog } from '../decks.js';
import * as store from '../store.js';
import { esc, he } from '../ui.js';

export function renderDecks(app) {
  const draw = () => {
    const st = store.get();
    const groups = [
      ['vocab', 'Vocabulary', 'Each word makes two cards: reading it (Hebrew → meaning) and writing it (English → Hebrew).'],
      ['sentences', 'Sentences', 'Whole phrases to read and write. Write the full sentence with your Hebrew keyboard.'],
      ['challenge', 'Challenge sentences', 'Longer sentences that combine words you already know. Each one unlocks once you have learnt every word it uses — keep studying the vocabulary decks to unlock more.'],
      ['cursive', 'Cursive (handwriting)', 'Read Hebrew handwriting: letters first, then words and phrases. Type what you read in print letters.'],
      ['forms', 'Grammar drills', 'Short forms you need to produce instantly: prepositions with endings, object pronouns, numbers.'],
    ];
    app.innerHTML = `
      <h1>Decks</h1>
      <div class="notice notice-info" style="margin-bottom:12px">Following the <a href="#/course">course</a>? It takes a little from each of these decks for you. You can still study any deck on its own here. Verb drills and verb explainers are in <a href="#/verbs">Verbs</a>.</div>
      <p class="muted">Switch decks on to add their new cards to your daily mix. Cards you've already started keep coming back for review either way.</p>
      ${groups.map(([kind, title, desc]) => {
        const list = visibleCatalog().filter((d) => (d.group || d.kind || 'vocab') === kind);
        if (!list.length) return '';
        return `<div class="section-title"><h2>${title}</h2></div><p class="muted small">${desc}</p>
          <div class="grid grid-2">${list.map((d) => deckCard(d, st)).join('')}</div>`;
      }).join('')}
    `;
  };

  function onChange(e) {
    const t = e.target.closest('[data-toggle]');
    if (!t) return;
    const st = store.get();
    const id = t.dataset.toggle;
    st.enabledDecks = t.checked ? [...new Set([...st.enabledDecks, id])] : st.enabledDecks.filter((x) => x !== id);
    store.save();
    draw();
  }
  app.addEventListener('change', onChange);
  draw();
  return () => app.removeEventListener('change', onChange);
}

function deckCard(d, st) {
  const c = counts(d.id);
  const on = st.enabledDecks.includes(d.id);
  const pct = c.total ? Math.round((c.seen / c.total) * 100) : 0;
  return `<div class="card deck ${on ? '' : 'disabled'}">
    <div class="deck-head">
      <div><div class="deck-title">${esc(d.title)}</div>${d.level ? `<span class="chip">${esc(d.level)}</span>` : ''}</div>
      ${d.he ? he(d.he, 'deck-he') : ''}
    </div>
    <p class="deck-desc">${esc(d.description || '')}</p>
    <div class="progress"><span style="width:${pct}%"></span></div>
    <div class="deck-stats">
      <span><b>${c.newAvail}</b> new</span>${c.locked ? `<span title="Unlock by learning the words these sentences use">🔒 <b>${c.locked}</b> locked</span>` : ''}<span><b>${c.learning}</b> learning</span><span><b>${c.due}</b> due</span><span><b>${c.mature}</b> solid</span>
    </div>
    <div class="row">
      <label class="toggle"><input type="checkbox" data-toggle="${esc(d.id)}" ${on ? 'checked' : ''}> In daily mix</label>
      <span class="spacer"></span>
      <a class="btn btn-sm" href="#/words/${esc(d.id)}">Browse</a>
      ${d.grammar ? `<a class="btn btn-sm" href="#/grammar/${esc(d.grammar)}">Explainer</a>` : ''}
      ${d.id === 'mine' ? '<a class="btn btn-sm" href="#/add">Add words</a>' : ''}
      <a class="btn btn-sm btn-primary" href="#/review/${esc(d.id)}">Study</a>
    </div>
  </div>`;
}
