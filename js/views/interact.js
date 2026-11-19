// Interactive answer widgets for review cards: multiple choice, tap-the-tiles, letter boxes,
// and the זה/זאת/אלה picker. Each widget ends in a plain answer string that the normal checkers grade.
import { esc, heb } from '../ui.js';
import { stripNiqqud } from '../hebrew.js';
import { DEM } from '../gender.js';

/* ---------------- seeded helpers ---------------- */

export function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffle(arr, seed) {
  const r = rng(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const plain = (s) => stripNiqqud(s).replace(/[^א-ת ]/g, '').replace(/\s+/g, ' ').trim();
const FIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const unfinal = (s) => s.replace(/[ךםןףץ]/g, (c) => FIN[c]);

/** Keep options whose letters differ from each other (and from the answer). */
export function distinct(list, max) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const raw = String(x.he ?? x);
    const k = unfinal(plain(raw)) || raw.toLowerCase().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
    if (out.length >= max) break;
  }
  return out;
}

/* ---------------- builders ---------------- */

/** Multiple choice: answer + distractors, shuffled. */
export function choice(answer, distractors, seed, opts = {}) {
  const opts2 = distinct([{ he: answer, ok: true }, ...distractors.map((d) => ({ he: d.he ?? d, sub: d.sub, ok: false }))], opts.max || 4);
  return { kind: 'choice', options: shuffle(opts2, seed), title: opts.title || 'Pick the right one', latin: !!opts.latin };
}

/** Word tiles: the words of the answer plus a few distractor words, shuffled. */
export function wordTiles(answer, extraWords, seed) {
  const words = answer.split(/\s+/).filter(Boolean);
  const have = new Set(words.map((w) => unfinal(plain(w))));
  const extra = [];
  for (const w of extraWords) {
    const k = unfinal(plain(w));
    if (!k || have.has(k)) continue;
    have.add(k);
    extra.push(w);
    if (extra.length >= 4) break;
  }
  const tiles = shuffle([...words, ...extra], seed).map((t, i) => ({ t, i }));
  return { kind: 'tiles', unit: 'word', tiles, picked: [], title: 'Tap the words in order (right to left)' };
}

/** Letter tiles: the letters of a word (no niqqud) plus a couple of decoy letters. */
export function letterTiles(answer, decoyFrom, seed) {
  const letters = [...plain(answer).replace(/ /g, '')];
  const pool = [...letters];
  const decoys = [];
  for (const d of decoyFrom) {
    for (const ch of plain(d).replace(/ /g, '')) {
      const idx = pool.indexOf(ch);
      if (idx >= 0) pool.splice(idx, 1);
      else if (!decoys.includes(ch) && decoys.length < 2) decoys.push(ch);
    }
    if (decoys.length >= 2) break;
  }
  for (const ch of 'התיו') if (decoys.length < 2 && !letters.includes(ch)) decoys.push(ch);
  const tiles = shuffle([...letters, ...decoys], seed).map((t, i) => ({ t, i }));
  return { kind: 'tiles', unit: 'letter', tiles, picked: [], title: 'Tap the letters in order — there are a couple of extras' };
}

// Letters people mix up when spelling: each missing letter gets one look-alike / sound-alike decoy.
const CONFUSE = { 'ו': 'י', 'י': 'ו', 'א': 'ע', 'ע': 'א', 'ה': 'א', 'ח': 'כ', 'כ': 'ח', 'ך': 'ח', 'ק': 'כ', 'ת': 'ט', 'ט': 'ת', 'ס': 'ש', 'ש': 'ס',
  'ב': 'ו', 'מ': 'נ', 'ם': 'ן', 'נ': 'מ', 'ן': 'ם', 'פ': 'ב', 'ף': 'פ', 'צ': 'ס', 'ץ': 'צ', 'ל': 'ר', 'ר': 'ד', 'ד': 'ר', 'ג': 'ק', 'ז': 'ס' };
// How useful a letter is to blank out: vowel letters and sound-alikes are where spelling goes wrong.
const WORTH = { 'ו': 4, 'י': 4, 'א': 3, 'ע': 3, 'ה': 3, 'ח': 3, 'כ': 3, 'ך': 3, 'ק': 3, 'ת': 3, 'ט': 3, 'ס': 3, 'ש': 3 };

/**
 * Fill the missing letters: the word (no niqqud) with a few letters blanked out, and a bank of
 * those letters plus look-alike decoys.
 */
export function gaps(answer, seed) {
  const chars = [...plain(answer)];
  const idx = chars.map((ch, i) => i).filter((i) => chars[i] !== ' ');
  const n = idx.length <= 3 ? 1 : idx.length <= 7 ? 2 : 3;
  const r = rng(seed);
  const ranked = idx.map((i) => ({ i, w: (WORTH[chars[i]] || 1) + r() * 2.5 })).sort((a, b) => b.w - a.w).slice(0, n).map((x) => x.i).sort((a, b) => a - b);
  const want = ranked.map((i) => chars[i]);
  const parts = chars.map((ch, i) => (ch === ' ' ? { space: true } : ranked.includes(i) ? { slot: ranked.indexOf(i) } : { fixed: ch }));
  const decoys = [];
  for (const ch of want) {
    const d = CONFUSE[ch];
    if (d && !want.includes(d) && !decoys.includes(d)) decoys.push(d);
  }
  if (!decoys.length) decoys.push(want.includes('ה') ? 'א' : 'ה');
  const bank = shuffle([...want, ...decoys], seed).map((t, i) => ({ t, i }));
  return { kind: 'boxes', parts, n: want.length, want, bank, vals: Array(want.length).fill(''), used: Array(want.length).fill(null),
    title: `Fill in the missing letter${want.length > 1 ? 's' : ''}` };
}

/** זה / זאת / אלה buttons + type the noun. */
export function dem() {
  return { kind: 'dem', pick: null, title: 'Pick זֶה / זֹאת / אֵלֶּה, then type the noun' };
}

/* ---------------- rendering ---------------- */

const disp = (s) => esc(heb(s));

export function askHtml(ix) {
  if (ix.kind === 'choice') {
    return `<div class="ix ix-choice"><div class="ix-title">${esc(ix.title)}</div>
      <div class="choices">${ix.options.map((o, i) => `<button type="button" class="choice-btn" data-choice="${i}"><kbd>${i + 1}</kbd>
        ${ix.latin ? `<span>${esc(o.he)}</span>` : `<span class="he" lang="he" dir="rtl">${disp(o.he)}</span>`}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>
      <div class="input-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="idk">I don't know</button><span class="kbd-hint">Click or press <kbd>1</kbd>–<kbd>${ix.options.length}</kbd></span></div></div>`;
  }
  if (ix.kind === 'tiles') {
    const used = new Set(ix.picked);
    const line = ix.picked.map((ti, k) => `<button type="button" class="tile placed" data-unpick="${k}" lang="he">${ix.unit === 'word' ? disp(ix.tiles[ti].t) : esc(ix.tiles[ti].t)}</button>`).join('');
    return `<div class="ix ix-tiles unit-${ix.unit}"><div class="ix-title">${esc(ix.title)}</div>
      <div class="tile-line" dir="rtl" lang="he">${line || '<span class="tile-ghost">…</span>'}</div>
      <div class="tile-bank" dir="rtl" lang="he">${ix.tiles.map((x, ti) => `<button type="button" class="tile ${used.has(ti) ? 'used' : ''}" data-pick="${ti}" ${used.has(ti) ? 'disabled' : ''}>${ix.unit === 'word' ? disp(x.t) : esc(x.t)}</button>`).join('')}</div>
      <div class="input-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="idk">I don't know</button>
        <span class="kbd-hint">${ix.unit === 'letter' ? 'Tap, or type the letters · ' : ''}<kbd>⌫</kbd> undo · <kbd>Enter</kbd> check</span>
        <button type="button" class="btn btn-primary" data-act="ix-check" ${ix.picked.length ? '' : 'disabled'}>Check</button></div></div>`;
  }
  if (ix.kind === 'boxes') {
    const row = ix.parts.map((p) => (p.space ? '<span class="box-space"></span>' : p.fixed !== undefined
      ? `<span class="box-fixed">${esc(p.fixed)}</span>`
      : `<input class="box-in" data-box="${p.slot}" maxlength="2" value="${esc(ix.vals[p.slot])}" lang="he" dir="rtl" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="missing letter">`)).join('');
    const bankUsed = new Set(ix.used.filter((u) => u !== null));
    const bank = ix.bank ? `<div class="tile-bank" dir="rtl" lang="he">${ix.bank.map((x, bi) => `<button type="button" class="tile ${bankUsed.has(bi) ? 'used' : ''}" data-bank="${bi}" ${bankUsed.has(bi) ? 'disabled' : ''}>${esc(x.t)}</button>`).join('')}</div>` : '';
    return `<div class="ix ix-boxes"><div class="ix-title">${esc(ix.title)}</div>
      <div class="box-row" dir="rtl">${row}</div>${bank}
      <div class="input-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="idk">I don't know</button>
        <span class="kbd-hint">Tap a letter or type it · <kbd>Enter</kbd> check</span>
        <button type="button" class="btn btn-primary" data-act="ix-check">Check</button></div></div>`;
  }
  if (ix.kind === 'dem') {
    return `<div class="ix ix-dem"><div class="ix-title">${esc(ix.title)}</div>
      <form data-form="check" autocomplete="off" class="dem-form">
        <div class="dem-row" dir="rtl">
          <div class="seg dem-pick">${['m', 'f', 'mp'].map((g) => `<button type="button" class="seg-btn ${ix.pick === g ? 'on' : ''}" data-dem="${g}" lang="he">${disp(DEM[g])}</button>`).join('')}</div>
          <input class="answer-input" name="answer" lang="he" dir="rtl" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="…and the noun" aria-label="The noun in Hebrew">
        </div>
        <div class="input-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="idk">I don't know</button>
          <span class="kbd-hint">Click one, type the noun, <kbd>Enter</kbd></span><button class="btn btn-primary" type="submit">Check</button></div>
      </form></div>`;
  }
  return '';
}

/** After answering a multiple-choice card: show what was right and what was picked. */
export function choiceResultHtml(ix, pickedIdx) {
  return `<div class="ix ix-choice done"><div class="choices">${ix.options.map((o, i) => `<div class="choice-btn ${o.ok ? 'right' : i === pickedIdx ? 'wrong' : ''}">
    ${ix.latin ? `<span>${esc(o.he)}</span>` : `<span class="he" lang="he" dir="rtl">${disp(o.he)}</span>`}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}${o.ok ? ' ✓' : i === pickedIdx ? ' ✗' : ''}</div>`).join('')}</div></div>`;
}

/** After answering a fill-the-letters card: the word with your letters marked right or wrong. */
export function boxesResultHtml(ix) {
  const cell = (p) => {
    if (p.space) return '<span class="box-space"></span>';
    if (p.fixed !== undefined) return `<span class="box-fixed">${esc(p.fixed)}</span>`;
    const got = ix.vals[p.slot];
    const ok = unfinal(got) === unfinal(ix.want[p.slot]);
    return ok ? `<span class="box-root ok">${esc(ix.want[p.slot])}</span>`
      : `<span class="box-root bad"><s>${esc(got || '·')}</s><b>${esc(ix.want[p.slot])}</b></span>`;
  };
  return `<div class="ix ix-boxes done"><div class="box-row" dir="rtl">${ix.parts.map(cell).join('')}</div></div>`;
}

/** The answer string a widget currently holds. */
export function answerOf(ix, root) {
  if (ix.kind === 'tiles') return ix.picked.map((ti) => ix.tiles[ti].t).join(ix.unit === 'word' ? ' ' : '');
  if (ix.kind === 'boxes') return ix.parts.map((p) => (p.space ? ' ' : p.fixed !== undefined ? p.fixed : ix.vals[p.slot] || '')).join('');
  if (ix.kind === 'dem') {
    const typed = (root?.querySelector('.answer-input')?.value || '').trim();
    if (!ix.pick) return typed;
    const first = stripNiqqud(typed.split(/\s+/)[0] || '');
    if (['זה', 'זאת', 'זו', 'אלה', 'אלו'].includes(first)) return typed;
    return typed ? `${stripNiqqud(DEM[ix.pick])} ${typed}` : '';
  }
  return '';
}

/**
 * Handle a click inside a widget. Returns 'render' if the widget changed, {answer, picked} for a choice,
 * or null if the click wasn't for the widget.
 */
export function onClick(ix, t) {
  if (ix.kind === 'choice' && t.dataset.choice !== undefined) {
    const i = Number(t.dataset.choice);
    return { answer: ix.options[i].he, picked: i };
  }
  if (ix.kind === 'tiles') {
    if (t.dataset.pick !== undefined) { ix.picked.push(Number(t.dataset.pick)); return 'render'; }
    if (t.dataset.unpick !== undefined) { ix.picked.splice(Number(t.dataset.unpick), 1); return 'render'; }
  }
  if (ix.kind === 'boxes') {
    if (t.dataset.bank !== undefined) {
      const bi = Number(t.dataset.bank);
      const k = ix.vals.findIndex((v) => !v);
      if (k < 0) return null;
      ix.vals[k] = ix.bank[bi].t;
      ix.used[k] = bi;
      return 'render';
    }
  }
  if (ix.kind === 'dem' && t.dataset.dem) { ix.pick = t.dataset.dem; return 'dem'; }
  return null;
}

/** Typing into a letter box: keep one Hebrew letter, then jump to the next box (leftwards in RTL). */
export function onBoxInput(ix, input, root) {
  const k = Number(input.dataset.box);
  const ch = [...stripNiqqud(input.value).replace(/[^א-ת]/g, '')].pop() || '';
  input.value = ch;
  ix.vals[k] = ch;
  ix.used[k] = null;
  if (ch) root.querySelector(`[data-box="${k + 1}"]`)?.focus();
}

/** Backspace on an empty box clears the one before it. */
export function onBoxKey(ix, input, e, root) {
  const k = Number(input.dataset.box);
  if (e.key === 'Backspace' && !input.value && k > 0) {
    ix.vals[k - 1] = '';
    ix.used[k - 1] = null;
    const prev = root.querySelector(`[data-box="${k - 1}"]`);
    if (prev) { prev.value = ''; prev.focus(); }
    e.preventDefault();
    return true;
  }
  return false;
}

/** Keyboard on a tile widget: a Hebrew letter picks a matching tile; Backspace undoes. */
export function onTileKey(ix, e) {
  if (e.key === 'Backspace') { if (ix.picked.length) { ix.picked.pop(); return true; } return false; }
  if (ix.unit !== 'letter') return false;
  const ch = e.key;
  if (!/^[א-ת]$/.test(ch)) return false;
  const used = new Set(ix.picked);
  let ti = ix.tiles.findIndex((x, i) => !used.has(i) && x.t === ch);
  if (ti < 0) ti = ix.tiles.findIndex((x, i) => !used.has(i) && unfinal(x.t) === unfinal(ch));
  if (ti < 0) return false;
  ix.picked.push(ti);
  return true;
}
