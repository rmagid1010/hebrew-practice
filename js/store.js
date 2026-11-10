// Persistent progress, stored in this browser's localStorage.
import { dayKey } from './fsrs.js';

const KEY = 'hebrew-practice:v1';

export const DEFAULT_SETTINGS = {
  newPerDay: 10,
  maxReviews: 200,
  niqqud: true,        // show vowel points on Hebrew prompts & answers
  audio: true,         // text-to-speech buttons
  autoplay: false,     // speak Hebrew automatically when shown
  rate: 0.9,           // speech rate
  retention: 0.9,      // FSRS target retention
  theme: 'auto',
};

function blank() {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    cards: {},          // cardId -> FSRS card
    suspended: {},      // cardId -> true
    flagged: {},        // itemKey -> note
    enabledDecks: ['street', 'smalltalk'],
    custom: [],         // user-added vocab items
    log: [],            // [timestamp, cardId, rating, verdict]
    newDone: {},        // dayKey -> number of new cards introduced
    created: Date.now(),
  };
}

let state = load();
let saveTimer = null;
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const s = JSON.parse(raw);
    const b = blank();
    return { ...b, ...s, settings: { ...b.settings, ...(s.settings || {}) } };
  } catch {
    return blank();
  }
}

export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('Could not save progress', e); }
  }, 150);
  listeners.forEach((fn) => fn(state));
}

export function flushSave() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
window.addEventListener('beforeunload', flushSave);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });

export function get() { return state; }
export function settings() { return state.settings; }
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setSetting(k, v) { state.settings[k] = v; save(); }

/** New cards introduced today — overall, or for one deck. */
export function newDoneToday(now = Date.now(), deck = null) {
  const k = deck ? `${dayKey(now)}|${deck}` : dayKey(now);
  return state.newDone[k] || 0;
}
export function bumpNewDone(delta = 1, now = Date.now(), deck = null) {
  const keys = [dayKey(now)];
  if (deck) keys.push(`${dayKey(now)}|${deck}`);
  for (const k of keys) state.newDone[k] = Math.max(0, (state.newDone[k] || 0) + delta);
  // keep the map small: drop entries older than ~2 weeks
  const cutoff = dayKey(now - 14 * 86400000);
  for (const k of Object.keys(state.newDone)) if (k.slice(0, 10) < cutoff) delete state.newDone[k];
}

export function exportJSON() {
  return JSON.stringify({ ...state, exported: new Date().toISOString() }, null, 1);
}

export function importJSON(text) {
  const s = JSON.parse(text);
  if (!s || typeof s !== 'object' || !s.cards) throw new Error('This does not look like a Hebrew Practice backup.');
  const b = blank();
  state = { ...b, ...s, settings: { ...b.settings, ...(s.settings || {}) } };
  delete state.exported;
  flushSave();
  listeners.forEach((fn) => fn(state));
}

export function resetAll() {
  state = blank();
  flushSave();
  listeners.forEach((fn) => fn(state));
}
