// The A1–A2 course: lessons that pull items from the decks, unlock in order, and feed the course session.
import * as store from './store.js';
import { cards, verbData, itemKey } from './decks.js';
import { lessonKeys } from './coursecore.js';

const UNLOCK_SHARE = 0.8; // next lesson opens when 80% of this one's cards are learnt

let course = null;
let lessonCards = null; // lessonId -> [cardId]

export async function loadCourse() {
  if (course) return course;
  course = await (await fetch('data/course.json')).json();
  return course;
}
export function getCourse() { return course; }
export function getLesson(id) { return course?.lessons.find((l) => l.id === id) || null; }

function buildIndex() {
  if (lessonCards) return lessonCards;
  lessonCards = new Map();
  const byItem = new Map();
  for (const c of cards().values()) {
    const k = itemKey(c.item);
    if (!byItem.has(k)) byItem.set(k, []);
    byItem.get(k).push(c.id);
  }
  const vd = verbData();
  const seen = new Set();
  for (const lesson of course.lessons) {
    const { keys } = lessonKeys(lesson, vd);
    const ids = [];
    for (const k of keys) {
      if (seen.has(k)) continue; // shared shape cards belong to the first lesson that uses them
      seen.add(k);
      ids.push(...(byItem.get(k) || []));
    }
    lessonCards.set(lesson.id, ids);
  }
  return lessonCards;
}
export function resetCourseIndex() { lessonCards = null; }

export function cardsOfLesson(id) { return buildIndex().get(id) || []; }

/** Progress for one lesson. learnt = graduated to review at least once. */
export function lessonStats(id) {
  const st = store.get().cards;
  const ids = cardsOfLesson(id);
  let learnt = 0, seen = 0;
  for (const c of ids) {
    const s = st[c];
    if (s) seen++;
    if (s && s.state >= 2) learnt++;
  }
  return { total: ids.length, learnt, seen, share: ids.length ? learnt / ids.length : 1 };
}

/** Lessons with their status: done / current / open / locked. */
export function lessonStatuses() {
  const out = [];
  let prevOk = true;
  for (const l of course.lessons) {
    const s = lessonStats(l.id);
    const unlocked = prevOk;
    const status = !unlocked ? 'locked' : s.learnt === s.total ? 'done' : s.seen ? 'current' : 'open';
    out.push({ lesson: l, stats: s, unlocked, status });
    prevOk = unlocked && s.share >= UNLOCK_SHARE;
  }
  return out;
}

/** The lesson you're on: the first unlocked one that still has cards you haven't seen. */
export function currentLesson() {
  const list = lessonStatuses().filter((x) => x.unlocked);
  return list.find((x) => x.stats.seen < x.stats.total) || list[list.length - 1];
}

/** New course cards in teaching order (earlier lessons first). Optionally just one lesson. */
export function courseNewCards(lessonId = null) {
  const st = store.get().cards;
  const out = [];
  for (const x of lessonStatuses()) {
    if (!x.unlocked) break;
    if (lessonId && x.lesson.id !== lessonId) continue;
    for (const id of cardsOfLesson(x.lesson.id)) if (!st[id]) out.push(id);
  }
  return out;
}

export function lessonOfCard(cardId) {
  for (const l of course.lessons) if (cardsOfLesson(l.id).includes(cardId)) return l;
  return null;
}

export { UNLOCK_SHARE };
