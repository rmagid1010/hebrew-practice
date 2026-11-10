import * as store from '../store.js';
import { stripNiqqud } from '../hebrew.js';
import { esc, he } from '../ui.js';
import * as tts from '../tts.js';

let index = null;
async function loadIndex() {
  if (!index) index = await (await fetch('data/grammar/index.json')).json();
  return index;
}

export async function renderGrammarIndex(app) {
  const idx = await loadIndex();
  app.innerHTML = `
    <h1>Grammar explainers</h1>
    <p class="muted">Short, practical explanations focused on how Hebrew is actually spoken. Click any Hebrew word in a table to hear it.</p>
    ${idx.sections.map((s) => `
      <div class="section-title"><h2>${esc(s.title)}</h2></div>
      <div class="grid grid-2 grammar-list">
        ${s.pages.map((p) => `<a href="#/grammar/${esc(p.id)}"><div class="card">
          <h3>${esc(p.title)} ${p.he ? he(p.he) : ''}</h3>
          <p class="muted small" style="margin:0">${esc(p.summary)}</p>
        </div></a>`).join('')}
      </div>`).join('')}
  `;
}

export async function renderGrammarPage(app, id) {
  const idx = await loadIndex();
  const all = idx.sections.flatMap((s) => s.pages);
  const i = all.findIndex((p) => p.id === id);
  const page = all[i];
  if (!page) {
    app.innerHTML = '<div class="card"><h2>Page not found</h2><a href="#/grammar">Back to grammar</a></div>';
    return;
  }
  const html = await (await fetch(`data/grammar/${id}.html`)).text();
  const prev = all[i - 1], next = all[i + 1];
  app.innerHTML = `<article class="article">
    <p><a href="#/grammar" class="small">← All grammar</a></p>
    ${html}
    ${page.deck ? `<div class="practice-bar"><a class="btn btn-primary" href="#/review/${esc(page.deck)}">Practice: ${esc(page.deckTitle || 'drill this')}</a><a class="btn" href="#/words/${esc(page.deck)}">See the deck</a></div>` : ''}
    <hr style="border:0;border-top:1px solid var(--border);margin:2em 0 1em">
    <div class="row">
      ${prev ? `<a class="btn btn-ghost" href="#/grammar/${esc(prev.id)}">← ${esc(prev.title)}</a>` : ''}
      <span class="spacer"></span>
      ${next ? `<a class="btn btn-ghost" href="#/grammar/${esc(next.id)}">${esc(next.title)} →</a>` : ''}
    </div>
  </article>`;

  // Wrap tables for horizontal scrolling on phones.
  app.querySelectorAll('.article table').forEach((t) => {
    const w = document.createElement('div');
    w.className = 'table-wrap';
    t.replaceWith(w);
    w.appendChild(t);
  });
  // Respect the niqqud setting.
  if (!store.settings().niqqud) {
    const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
    const keep = (n) => n.parentElement?.closest('[data-keep-niqqud]');
    let n;
    while ((n = walker.nextNode())) if (!keep(n)) n.nodeValue = stripNiqqud(n.nodeValue);
  }
  // Speakable Hebrew spans inside paragraphs.
  if (tts.enabled()) app.querySelectorAll('.article p [lang="he"], .article li [lang="he"]').forEach((el) => el.classList.add('say'));
}
