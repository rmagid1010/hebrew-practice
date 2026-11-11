// Entry point: hash router.
import * as decks from './decks.js';
import * as store from './store.js';
import { counts } from './session.js';
import { renderHome } from './views/home.js';
import { renderReview } from './views/review.js';
import { renderDecks } from './views/decks.js';
import { renderGrammarIndex, renderGrammarPage } from './views/grammar.js';
import { renderWords } from './views/words.js';
import { renderSettings } from './views/settings.js';
import { renderAdd } from './views/add.js';
import { renderVerbs, renderVerbCheck } from './views/verbs.js';
import { renderCourse, renderLesson } from './views/course.js';
import { loadCourse } from './course.js';
import { isVerbPage } from './views/grammar.js';

const app = document.getElementById('app');
let cleanup = null;

const routes = [
  [/^#?\/?$/, () => renderHome(app), 'home'],
  [/^#\/review(?:\/([\w-]+))?$/, (m) => renderReview(app, m[1] || null), 'review'],
  [/^#\/course$/, () => renderCourse(app), 'course'],
  [/^#\/course\/([\w-]+)$/, (m) => renderLesson(app, m[1]), 'course'],
  [/^#\/study(?:\/([\w-]+))?$/, (m) => renderReview(app, null, { course: true, lesson: m[1] || null }), 'course'],
  [/^#\/verbs\/learn\/([\w-]+)$/, (m) => renderGrammarPage(app, m[1]), 'verbs'],
  [/^#\/practice(?:\/([\w-]+))?$/, (m) => renderReview(app, m[1] || null, { practice: true }), 'verbs'],
  [/^#\/verbs$/, () => renderVerbs(app), 'verbs'],
  [/^#\/verbs\/check$/, () => renderVerbCheck(app), 'verbs'],
  [/^#\/decks$/, () => renderDecks(app), 'decks'],
  [/^#\/grammar$/, () => renderGrammarIndex(app), 'grammar'],
  [/^#\/grammar\/([\w-]+)$/, async (m) => {
    if (await isVerbPage(m[1])) { location.replace(`#/verbs/learn/${m[1]}`); return; }
    return renderGrammarPage(app, m[1]);
  }, 'grammar'],
  [/^#\/words(?:\/([\w-]+))?$/, (m) => renderWords(app, m[1] || null), 'words'],
  [/^#\/add$/, () => renderAdd(app), 'words'],
  [/^#\/settings$/, () => renderSettings(app), 'settings'],
];

async function route() {
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  const hash = location.hash || '#/';
  for (const [re, fn, nav] of routes) {
    const m = hash.match(re);
    if (m) {
      document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav));
      try {
        cleanup = await fn(m);
      } catch (err) {
        console.error(err);
        app.innerHTML = `<div class="card"><h2>Something went wrong</h2><p class="muted">${String(err.message || err)}</p></div>`;
      }
      updateBadge();
      return;
    }
  }
  location.hash = '#/';
}

export function updateBadge() {
  const b = document.getElementById('due-badge');
  if (!b) return;
  const c = counts();
  const n = c.due + c.learning;
  b.hidden = n === 0;
  b.textContent = n > 99 ? '99+' : String(n);
}

async function start() {
  try {
    await decks.loadAll();
    await loadCourse();
  } catch (err) {
    app.innerHTML = `<div class="card"><h2>Could not load lessons</h2><p class="muted">If you opened this file directly, serve the folder over HTTP instead (e.g. <code>python3 -m http.server</code>).</p><p class="muted small">${String(err)}</p></div>`;
    return;
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
  store.onChange(() => updateBadge());
  route();
}

start();
