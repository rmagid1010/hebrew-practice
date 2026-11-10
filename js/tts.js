// Hebrew text-to-speech using the browser's built-in voices.
import * as store from './store.js';
import { stripNiqqud } from './hebrew.js';

let voice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  voice = voices.find((v) => /^(he|iw)([-_]|$)/i.test(v.lang)) || null;
  return voice;
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function supported() {
  return 'speechSynthesis' in window;
}

export function hasHebrewVoice() {
  return !!(voice || pickVoice());
}

export function enabled() {
  return supported() && store.settings().audio;
}

export function speak(text) {
  if (!enabled() || !text) return;
  speechSynthesis.cancel();
  // Most voices read unpointed text more naturally than text with niqqud.
  const u = new SpeechSynthesisUtterance(stripNiqqud(text));
  u.lang = 'he-IL';
  if (voice || pickVoice()) u.voice = voice;
  u.rate = store.settings().rate || 0.9;
  speechSynthesis.speak(u);
}

export function stop() {
  if (supported()) speechSynthesis.cancel();
}
