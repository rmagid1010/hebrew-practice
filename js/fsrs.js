// A compact implementation of FSRS-5 (Free Spaced Repetition Scheduler),
// the scheduling algorithm used by modern Anki.
// Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm

export const Rating = { Again: 1, Hard: 2, Good: 3, Easy: 4 };
export const State = { New: 0, Learning: 1, Review: 2, Relearning: 3 };

const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const ROLLOVER_HOUR = 4; // a new "study day" starts at 4am, like Anki

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function retrievability(elapsedDays, s) {
  return Math.pow(1 + (FACTOR * elapsedDays) / s, DECAY);
}

function initStability(g) { return Math.max(W[g - 1], 0.1); }
function initDifficulty(g) { return W[4] - Math.exp(W[5] * (g - 1)) + 1; }

function nextDifficulty(d, g) {
  const delta = -W[6] * (g - 3);
  const damped = d + (delta * (10 - d)) / 9;
  const reverted = W[7] * initDifficulty(4) + (1 - W[7]) * damped;
  return clamp(reverted, 1, 10);
}

function recallStability(d, s, r, g) {
  const hard = g === Rating.Hard ? W[15] : 1;
  const easy = g === Rating.Easy ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) *
    (Math.exp(W[10] * (1 - r)) - 1) * hard * easy);
}

function forgetStability(d, s, r) {
  const sf = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - r));
  return Math.min(sf, s / Math.exp(W[17] * W[18]));
}

function shortTermStability(s, g) {
  return s * Math.exp(W[17] * (g - 3 + W[18]));
}

/** Start of the study day containing `t` (ms). */
export function dayStart(t) {
  const d = new Date(t);
  d.setHours(ROLLOVER_HOUR, 0, 0, 0);
  if (d.getTime() > t) d.setDate(d.getDate() - 1);
  return d.getTime();
}

export function dayKey(t) {
  const d = new Date(dayStart(t));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function newCard() {
  return { state: State.New, due: 0, s: 0, d: 0, reps: 0, lapses: 0, step: 0, last: 0 };
}

export class Scheduler {
  constructor({ retention = 0.9, learningSteps = [1, 10], relearningSteps = [10], maxIvl = 36500, fuzz = true } = {}) {
    this.retention = retention;
    this.learningSteps = learningSteps; // minutes
    this.relearningSteps = relearningSteps;
    this.maxIvl = maxIvl;
    this.fuzz = fuzz;
  }

  interval(s, cardId = '') {
    let ivl = (s / FACTOR) * (Math.pow(this.retention, 1 / DECAY) - 1);
    ivl = clamp(Math.round(ivl), 1, this.maxIvl);
    if (this.fuzz && ivl >= 3) {
      // deterministic per-card fuzz so the preview equals the result
      let h = 0;
      for (const ch of cardId + ivl) h = (h * 31 + ch.charCodeAt(0)) | 0;
      const frac = ((h >>> 0) % 1000) / 1000; // 0..1
      const spread = Math.max(1, Math.round(ivl * 0.05));
      ivl = clamp(ivl - spread + Math.round(frac * 2 * spread), 2, this.maxIvl);
    }
    return ivl;
  }

  /** Return the next card state for a rating. Pure: does not mutate `card`. */
  next(card, rating, now = Date.now(), cardId = '') {
    const c = { ...card };
    const g = rating;
    const elapsedDays = c.last ? (now - c.last) / DAY : 0;

    // --- update memory state (stability / difficulty) ---
    if (c.state === State.New) {
      c.s = initStability(g);
      c.d = clamp(initDifficulty(g), 1, 10);
    } else {
      const r = retrievability(elapsedDays, c.s);
      c.d = nextDifficulty(c.d, g);
      if (elapsedDays < 1) c.s = shortTermStability(c.s, g);
      else if (g === Rating.Again) c.s = forgetStability(card.d, c.s, r);
      else c.s = recallStability(card.d, c.s, r, g);
      c.s = Math.max(c.s, 0.01);
    }

    // --- decide next state & due time ---
    const toReview = (ivlDays) => {
      c.state = State.Review;
      c.step = 0;
      c.due = dayStart(now) + ivlDays * DAY;
    };
    const toStep = (state, stepIdx, mins) => {
      c.state = state;
      c.step = stepIdx;
      c.due = now + mins * MIN;
    };

    if (c.state === State.New || c.state === State.Learning || c.state === State.Relearning) {
      const learnState = c.state === State.New ? State.Learning : c.state;
      const st = learnState === State.Relearning ? this.relearningSteps : this.learningSteps;
      const idx = c.state === State.New ? 0 : c.step;
      if (g === Rating.Again) {
        toStep(learnState, 0, st[0] ?? 1);
      } else if (g === Rating.Hard) {
        let mins;
        if (c.state === State.New || idx === 0) mins = st.length > 1 ? (st[0] + st[1]) / 2 : (st[0] ?? 1) * 1.5;
        else mins = st[idx] ?? st[st.length - 1];
        toStep(learnState, idx, mins);
      } else if (g === Rating.Good) {
        const nextIdx = c.state === State.New ? 1 : idx + 1;
        if (nextIdx < st.length) toStep(learnState, nextIdx, st[nextIdx]);
        else toReview(this.interval(c.s, cardId));
      } else {
        const good = this.interval(c.s, cardId);
        toReview(Math.max(good, 1));
      }
    } else {
      // Review
      if (g === Rating.Again) {
        c.lapses += 1;
        if (this.relearningSteps.length) toStep(State.Relearning, 0, this.relearningSteps[0]);
        else toReview(this.interval(c.s, cardId));
      } else {
        // compute all three so intervals stay ordered hard <= good < easy
        const r = retrievability(elapsedDays, card.s);
        const d0 = card.d;
        const sH = recallStability(d0, card.s, r, Rating.Hard);
        const sG = recallStability(d0, card.s, r, Rating.Good);
        const sE = recallStability(d0, card.s, r, Rating.Easy);
        let iH = this.interval(sH, cardId);
        let iG = this.interval(sG, cardId);
        let iE = this.interval(sE, cardId);
        iH = Math.min(iH, iG);
        iG = Math.max(iG, iH + 1);
        iE = Math.max(iE, iG + 1);
        toReview(g === Rating.Hard ? iH : g === Rating.Good ? iG : iE);
      }
    }
    c.reps += 1;
    c.last = now;
    return c;
  }

  /** Preview all four outcomes: {1: card, 2: card, 3: card, 4: card} */
  preview(card, now = Date.now(), cardId = '') {
    const out = {};
    for (const g of [1, 2, 3, 4]) out[g] = this.next(card, g, now, cardId);
    return out;
  }
}

/** Label for a previewed outcome: minutes for learning steps, days for reviews. */
export function previewLabel(card, now = Date.now()) {
  if (card.state === State.Review) {
    const days = Math.round((card.due - dayStart(now)) / DAY);
    if (days < 30) return `${days}d`;
    if (days < 365) return `${(days / 30).toFixed(days < 90 ? 1 : 0)}mo`;
    return `${(days / 365).toFixed(1)}y`;
  }
  return formatInterval(card.due, now);
}

/** Human-readable interval like "1m", "10m", "3d", "2mo". */
export function formatInterval(dueMs, now = Date.now()) {
  const diff = Math.max(0, dueMs - now);
  const mins = diff / MIN;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m`;
  const hours = mins / 60;
  if (hours < 20) return `${Math.round(hours)}h`;
  const days = Math.max(1, Math.round(diff / DAY));
  if (days < 30) return `${days}d`;
  if (days < 365) return `${(days / 30).toFixed(days < 90 ? 1 : 0)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
