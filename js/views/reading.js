// Reading Hebrew (#/reading): the alphabet & vowels, cursive, and reading practice in one place.
import { getDeck } from '../decks.js';
import { counts } from '../session.js';
import * as store from '../store.js';
import { esc, he } from '../ui.js';
import { loadIndex } from './grammar.js';

const PRACTICE = [
  ['cursive-letters', 'Recognise all 27 handwritten letter shapes — see a letter, type its print form.'],
  ['cursive-words', 'Notes, signs, shopping lists and messages in handwriting. Read them, type them in print.'],
  ['basics', 'The first words of the course — good for reading practice with and without vowels.'],
];

export async function renderReading(app) {
  const idx = await loadIndex();
  const pages = idx.sections.filter((s) => s.area === 'reading').flatMap((s) => s.pages);

  const draw = () => {
    const s = store.settings();
    app.innerHTML = `
      <h1>Reading Hebrew <span class="he muted" lang="he">קְרִיאָה</span></h1>
      <p class="lead muted">Hebrew is written right to left, mostly without vowels, and by hand in a cursive script that looks quite different from print.
        Start with the alphabet, then learn to read handwriting — and practise both here.</p>

      <div class="section-title"><h2>Learn</h2></div>
      <div class="grid grid-2 grammar-list">
        ${pages.map((p) => `<a href="#/reading/learn/${esc(p.id)}"><div class="card reading-card">
          <div class="reading-glyph ${p.id === 'cursive' ? 'cursive' : 'he'}" lang="he">${p.id === 'cursive' ? 'אבג' : 'אָבָּא'}</div>
          <h3>${esc(p.title)}</h3><p class="muted small" style="margin:0">${esc(p.summary)}</p></div></a>`).join('')}
      </div>

      <div class="section-title"><h2>Practise</h2><span class="small muted">spaced repetition, like every other deck</span></div>
      <div class="grid grid-2">
        ${PRACTICE.map(([id, desc]) => {
          const d = getDeck(id);
          if (!d) return '';
          const c = counts(id);
          return `<div class="card deck">
            <div class="deck-head"><div class="deck-title">${esc(d.meta.title)}</div>${d.meta.he ? he(d.meta.he, 'deck-he') : ''}</div>
            <p class="deck-desc">${esc(desc)}</p>
            <div class="deck-stats"><span><b>${c.seen}</b>/${c.total} started</span><span><b>${c.due + c.learning}</b> due</span><span><b>${c.newAvail}</b> new</span></div>
            <div class="row"><span class="spacer"></span><a class="btn btn-sm" href="#/words/${esc(id)}">Browse</a><a class="btn btn-sm btn-primary" href="#/review/${esc(id)}">Study</a></div>
          </div>`;
        }).join('')}
      </div>

      <div class="section-title"><h2>Reading options</h2><span class="small muted">apply to every card on the site</span></div>
      <section class="card">
        <label class="switch"><span>Show vowel points (niqqud)<div class="field-hint">Turn off when you're ready to read like Israelis do. You never need to type them.</div></span>
          <input type="checkbox" data-set="niqqud" ${s.niqqud ? 'checked' : ''}></label>
        <label class="switch"><span>Show reading cards in cursive<div class="field-hint">Every "Read it" card appears handwritten. You can flip a single card with the ✍ button or the C key.</div></span>
          <input type="checkbox" data-set="cursiveReading" ${s.cursiveReading ? 'checked' : ''}></label>
      </section>

      <div class="notice notice-info" style="margin-top:16px">Typing with a Hebrew keyboard? The final letters and the geresh are covered at the end of
        <a href="#/reading/learn/reading">Alphabet, vowels &amp; spelling</a>.</div>`;
  };

  function onChange(e) {
    const t = e.target.closest('[data-set]');
    if (!t) return;
    store.setSetting(t.dataset.set, t.checked);
    draw();
  }
  app.addEventListener('change', onChange);
  draw();
  return () => app.removeEventListener('change', onChange);
}
