// Hebrew text utilities and answer checking.

// Niqqud + cantillation marks (but not maqaf U+05BE, which we treat as a hyphen).
const MARKS = /[֑-ׇֽֿׁׂׅׄ]/g;
const BIDI = /[‎‏‪-‮⁦-⁩]/g;
const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
export const PRONOUNS = ['אני', 'אתה', 'את', 'הוא', 'היא', 'אנחנו', 'אתם', 'אתן', 'הם', 'הן'];

export function stripNiqqud(s) {
  return (s || '').normalize('NFC').replace(MARKS, '');
}

export function hasHebrew(s) { return /[א-ת]/.test(s || ''); }

// Common words with two accepted spellings (plene / defective, slang variants).
const VARIANTS = {
  'הכל': 'הכול', 'והכל': 'והכול', 'שהכל': 'שהכול', 'בהכל': 'בהכול',
  'מאד': 'מאוד', 'יאלה': 'יאללה', 'ואלה': 'ואללה', 'סבבא': 'סבבה',
  'היתה': 'הייתה', 'שניה': 'שנייה', 'כח': 'כוח', 'תכנית': 'תוכנית', 'אתך': 'איתך',
  'אתו': 'איתו',
};

/** Light normalization: what "the same answer" means. */
export function normalize(s) {
  return normalizeChars(s).split(' ').map((w) => VARIANTS[w] || w).join(' ');
}

function normalizeChars(s) {
  return stripNiqqud(s)
    .replace(BIDI, '')
    .replace(/[׳'’‘`]/g, '׳')       // geresh variants → ׳
    .replace(/[״"“”]/g, '')          // gershayim / quotes → drop
    .replace(/[־\-–—_/]/g, ' ')      // maqaf, hyphens → space
    .replace(/[.,!?;:()\[\]{}…¿¡«»׀׃]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Lenient normalization: also ignores final-letter forms and geresh. */
export function lenient(s) {
  return normalize(s)
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/׳/g, '');
}

/** Very lenient: also ignores the vowel letters ו and י (plene vs defective spelling). */
function spellingLenient(s) {
  return lenient(s).replace(/[וי]/g, '');
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function tolerance(len) {
  if (len <= 3) return 0;
  if (len <= 7) return 1;
  if (len <= 15) return 2;
  return Math.floor(len / 7);
}

/**
 * Check a typed answer against one or more accepted answers.
 * mode: 'vocab' (default, forgiving), 'strict' (conjugation drills: one letter can change the form).
 * Returns { verdict: 'correct'|'almost'|'wrong', target, note }
 */
export function checkAnswer(input, answers, mode = 'vocab') {
  let typed = normalize(input);
  if (!typed) return { verdict: 'wrong', target: answers[0], note: '' };

  const scored = answers.map((ans) => {
    const t = normalize(ans);
    return { ans, t, dist: levenshtein(lenient(typed), lenient(t)) };
  });

  // In drills, allow the learner to include the pronoun ("אנחנו גמרנו").
  if (mode === 'strict') {
    const first = typed.split(' ')[0];
    if (PRONOUNS.includes(first) && !scored.some((x) => x.t.split(' ')[0] === first)) {
      typed = typed.split(' ').slice(1).join(' ');
    }
  }

  for (const x of scored) if (typed === x.t) return { verdict: 'correct', target: x.ans, note: '' };

  for (const x of scored) {
    if (lenient(typed) === lenient(x.t)) {
      const finalIssue = typed.replace(/׳/g, '') !== x.t.replace(/׳/g, '');
      return {
        verdict: 'almost', target: x.ans,
        note: finalIssue ? 'Check your final letters (ך ם ן ף ץ go only at the end of a word).'
                         : 'Watch the geresh (׳) — it changes the sound, e.g. ג׳ = "j".',
      };
    }
  }

  if (mode !== 'strict') {
    for (const x of scored) {
      if (spellingLenient(typed) === spellingLenient(x.t)) {
        return { verdict: 'almost', target: x.ans, note: 'Spelling: everyday Hebrew uses ו and י as vowel letters here.' };
      }
    }
    const best = scored.reduce((a, b) => (b.dist < a.dist ? b : a));
    if (best.dist <= tolerance(best.t.length)) {
      return { verdict: 'almost', target: best.ans, note: 'Close — a small typo or spelling slip.' };
    }
    return { verdict: 'wrong', target: best.ans, note: '' };
  }

  const best = scored.reduce((a, b) => (b.dist < a.dist ? b : a));
  return { verdict: 'wrong', target: best.ans, note: '' };
}

/**
 * Character diff between what was typed and the target (both niqqud-free).
 * Returns { typed: [{t, ok}], target: [{t, ok}] } where ok=false marks extra/missing chars.
 */
export function diff(input, target) {
  const A = normalize(input), B = normalize(stripNiqqud(target));
  // Sentences: compare word by word (easier to read). Words: letter by letter.
  const byWord = B.split(' ').length >= 3;
  const tok = (s) => (byWord ? s.split(/(\s+)/).filter(Boolean) : [...s]);
  const a = tok(A);
  const b = tok(B);
  const m = a.length, n = b.length;
  const L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ta = [], tb = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { ta.push({ t: a[i], ok: true }); tb.push({ t: b[j], ok: true }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { ta.push({ t: a[i], ok: false }); i++; }
    else { tb.push({ t: b[j], ok: false }); j++; }
  }
  while (i < m) ta.push({ t: a[i++], ok: false });
  while (j < n) tb.push({ t: b[j++], ok: false });
  return { typed: merge(ta), target: merge(tb) };
}

function merge(parts) {
  const out = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last && last.ok === p.ok) last.t += p.t;
    else out.push({ ...p });
  }
  return out;
}
