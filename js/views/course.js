// Course map (#/course) and lesson pages (#/course/:id).
import { lessonStatuses, getLesson, cardsOfLesson, lessonStats, currentLesson, UNLOCK_SHARE } from '../course.js';
import { cards, itemKey, lockInfo, itemByKey, isLocked } from '../decks.js';
import { State } from '../fsrs.js';
import * as store from '../store.js';
import { esc, he } from '../ui.js';
import { counts, newLeftToday } from '../session.js';

const pct = (s) => Math.round(s.share * 100);

export function renderCourse(app) {
  const list = lessonStatuses();
  const cur = currentLesson();
  const levels = ['A1', 'A2'];
  const c = counts();
  app.innerHTML = `
    <div class="row" style="margin-bottom:6px"><h1 style="margin:0">Course</h1><span class="spacer"></span>
      <a class="btn btn-primary" href="#/study">Study now</a></div>
    <p class="muted">24 lessons from first words (A1) to A2. Each lesson takes a little from several decks — words, verbs, sentences — then asks you to
      <b>write</b> something yourself. Sentences only unlock once you know their words, and every study session also brings back what's due from earlier
      lessons, so new material keeps revising the old. A lesson opens when ${Math.round(UNLOCK_SHARE * 100)}% of the one before is learnt.</p>
    <div class="notice notice-info" style="margin:12px 0 4px">Today: <b>${c.due + c.learning}</b> due · <b>${newLeftToday()}</b> new cards left (change in <a href="#/settings">Settings</a>).
      ${cur ? ` You're on <a href="#/course/${esc(cur.lesson.id)}">lesson ${list.findIndex((x) => x.lesson.id === cur.lesson.id) + 1}: ${esc(cur.lesson.title)}</a>.` : ''}</div>
    ${levels.map((lv) => `
      <div class="section-title"><h2>${lv === 'A1' ? 'A1 · Beginner' : 'A2 · Elementary'}</h2></div>
      <div class="lessons">
        ${list.filter((x) => x.lesson.level === lv).map((x) => lessonTile(x, list.indexOf(x) + 1, cur && x.lesson.id === cur.lesson.id)).join('')}
      </div>`).join('')}
  `;
}

function lessonTile(x, n, isCur) {
  const { lesson, stats, status } = x;
  const icon = { done: '✓', current: '▶', open: '○', locked: '🔒' }[status];
  return `<a class="lesson-tile ${status} ${isCur ? 'is-current' : ''}" href="#/course/${esc(lesson.id)}">
    <span class="lesson-n">${n}</span>
    <span class="lesson-body"><b>${esc(lesson.title)}</b> ${he(lesson.he, 'lesson-he')}
      <span class="progress"><span style="width:${pct(stats)}%"></span></span>
      <small>${status === 'locked' ? 'Locked' : `${stats.learnt}/${stats.total} learnt`}</small></span>
    <span class="lesson-icon">${icon}</span>
  </a>`;
}

const GROUPS = [
  ['words', 'Words & phrases', (c) => ['vocab'].includes(c.item.kind)],
  ['verbs', 'Verbs', (c) => c.item.kind === 'conj'],
  ['sentences', 'Sentences', (c) => c.item.kind === 'sentence'],
  ['write', 'Writing', (c) => c.item.kind === 'write'],
];

export function renderLesson(app, id) {
  const lesson = getLesson(id);
  if (!lesson) { app.innerHTML = '<div class="card"><h2>Lesson not found</h2><a href="#/course">Back to the course</a></div>'; return; }
  const all = lessonStatuses();
  const x = all.find((y) => y.lesson.id === id);
  const n = all.indexOf(x) + 1;
  const prev = all[n - 2], next = all[n];
  const st = store.get().cards;
  const ids = cardsOfLesson(id);
  const map = cards();
  // one row per item (an item can have reading + writing cards)
  const items = new Map();
  for (const cid of ids) {
    const c = map.get(cid);
    if (!c) continue;
    const k = itemKey(c.item);
    if (!items.has(k)) items.set(k, { item: c.item, cards: [] });
    items.get(k).cards.push(c);
  }
  const stats = lessonStats(id);

  const statusOf = (entry) => {
    const ss = entry.cards.map((c) => st[c.id]);
    if (ss.every((s) => s && s.state >= State.Review)) return ['done', '✓ learnt'];
    if (ss.some(Boolean)) return ['active', 'learning'];
    if (isLocked(entry.item)) {
      const lock = lockInfo(entry.item);
      if (lock?.missing.length) return ['locked', `🔒 needs ${lock.missing.map((k) => itemByKey(k)?.he).filter(Boolean).slice(0, 3).join(', ')}${lock.missing.length > 3 ? '…' : ''}`];
      return ['locked', '🔒 after the earlier verb stage'];
    }
    return ['new', 'new'];
  };
  const label = (it) => {
    if (it.kind === 'conj') {
      const v = it.verb;
      const what = it.sub === 'root' ? 'root' : it.sub === 'binyan' ? 'binyan' : it.sub === 'shape' ? `${it.binyan} ${it.tense} shape`
        : it.tense === 'inf' ? 'infinitive' : `${it.tense} · ${it.person}`;
      return `${he(it.sub === 'shape' ? '' : v.inf)} <span class="muted small">${esc(what)}</span>`;
    }
    if (it.kind === 'write') return `<span>${esc(it.en)}</span>`;
    return `${he(it.he)} <span class="muted small">${esc(it.en)}</span>`;
  };

  app.innerHTML = `<article class="article lesson-page">
    <p><a href="#/course" class="small">← Course</a></p>
    <h1>Lesson ${n}: ${esc(lesson.title)} <span class="he" lang="he">${esc(lesson.he)}</span></h1>
    <div class="row" style="margin-bottom:10px"><span class="chip">${esc(lesson.level)}</span>
      <span class="small muted">${stats.learnt}/${stats.total} cards learnt</span><span class="spacer"></span>
      ${x.unlocked ? `<a class="btn btn-primary" href="#/study/${esc(id)}">Study this lesson</a>` : `<span class="chip">🔒 Opens when ${Math.round(UNLOCK_SHARE * 100)}% of lesson ${n - 1} is learnt</span>`}</div>
    <div class="callout">${lesson.intro}</div>
    ${GROUPS.map(([key, title, test]) => {
      const rows = [...items.values()].filter((e) => test(e.cards[0]));
      if (!rows.length) return '';
      return `<h2>${title}</h2><table class="lesson-items"><tbody>${rows.map((e) => {
        const [cls, txt] = statusOf(e);
        return `<tr class="${cls}"><td>${label(e.item)}</td><td class="st">${txt}</td></tr>`;
      }).join('')}</tbody></table>`;
    }).join('')}
    <hr style="border:0;border-top:1px solid var(--border);margin:2em 0 1em">
    <div class="row">
      ${prev ? `<a class="btn btn-ghost" href="#/course/${esc(prev.lesson.id)}">← ${esc(prev.lesson.title)}</a>` : ''}
      <span class="spacer"></span>
      ${next ? `<a class="btn btn-ghost" href="#/course/${esc(next.lesson.id)}">${esc(next.lesson.title)} →</a>` : ''}
    </div>
  </article>`;
}
