// Small rendering helpers shared by the views.
import * as store from './store.js';
import { stripNiqqud } from './hebrew.js';
import * as tts from './tts.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Hebrew text as displayed: with or without niqqud depending on settings. */
export function heb(text) {
  return store.settings().niqqud ? text : stripNiqqud(text);
}

/** <span class="he"> wrapper. */
export function he(text, cls = '') {
  return `<span class="he ${cls}" lang="he" dir="rtl">${esc(heb(text))}</span>`;
}

const SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';

export function sayBtn(text, label = 'Listen') {
  if (!tts.enabled()) return '';
  return `<button type="button" class="icon-btn" data-say="${esc(text)}" aria-label="${esc(label)}" title="${esc(label)}">${SPEAKER}</button>`;
}

export const REG_LABEL = { slang: 'slang', casual: 'casual', neutral: 'neutral', formal: 'formal' };
export function regChip(reg) {
  if (!reg) return '';
  return `<span class="chip chip-${esc(reg)}" title="Register: how formal it is">${esc(REG_LABEL[reg] || reg)}</span>`;
}

export function toast(msg, ms = 2200) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/** Global click handler for speaker buttons / speakable Hebrew. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-say]');
  if (btn) {
    e.preventDefault();
    tts.speak(btn.getAttribute('data-say'));
    return;
  }
  const cell = e.target.closest('.article td[lang="he"], .article [lang="he"].say');
  if (cell) {
    const copy = cell.cloneNode(true);
    copy.querySelectorAll('.tr').forEach((x) => x.remove());
    tts.speak(copy.textContent.trim());
  }
});

export function plural(n, word, pluralWord = word + 's') {
  return `${n} ${n === 1 ? word : pluralWord}`;
}
