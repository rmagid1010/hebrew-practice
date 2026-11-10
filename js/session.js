// Builds and runs a review session: what to show next, and recording answers.
import { Scheduler, State, newCard, dayKey } from './fsrs.js';
import * as store from './store.js';
import { cards, getCatalog, itemKey } from './decks.js';

const LEARN_AHEAD = 20 * 60 * 1000;

export function scheduler() {
  return new Scheduler({ retention: store.settings().retention });
}

export function cardState(id) {
  return store.get().cards[id] || null;
}

/** Counts for the dashboard / deck list. */
export function counts(deckFilter = null, now = Date.now()) {
  const st = store.get();
  const out = { due: 0, learning: 0, newAvail: 0, seen: 0, total: 0, mature: 0 };
  for (const c of cards().values()) {
    if (deckFilter && c.deck !== deckFilter) continue;
    out.total++;
    if (st.suspended[c.id]) continue;
    const s = st.cards[c.id];
    if (!s) { out.newAvail++; continue; }
    out.seen++;
    if (s.state === State.Review && s.s >= 21) out.mature++;
    if (s.due <= now) {
      if (s.state === State.Review) out.due++;
      else out.learning++;
    }
  }
  return out;
}

/** New cards still allowed today. With a deck, that deck gets its own allowance (like Anki). */
export function newLeftToday(now = Date.now(), deck = null) {
  return Math.max(0, store.settings().newPerDay - store.newDoneToday(now, deck));
}

export class Session {
  /** opts: { deck: id|null (null = all enabled decks), extraNew: n } */
  constructor(opts = {}) {
    this.opts = opts;
    this.answeredItems = new Set(); // items touched this session (bury siblings)
    this.learning = [];             // ids of cards in learning steps, re-shown this session
    this.history = [];              // for undo
    this.done = 0;
    this.build();
  }

  deckAllowed(deck) {
    if (this.opts.deck) return deck === this.opts.deck;
    return store.get().enabledDecks.includes(deck);
  }

  build(now = Date.now()) {
    const st = store.get();
    const reviews = [];
    const newByDeck = new Map();
    const itemsWithSeenCardToday = new Set();
    const today = dayKey(now);

    for (const c of cards().values()) {
      const s = st.cards[c.id];
      if (s && s.last && dayKey(s.last) === today) itemsWithSeenCardToday.add(itemKey(c.item));
    }

    for (const c of cards().values()) {
      if (st.suspended[c.id]) continue;
      const s = st.cards[c.id];
      if (s) {
        // Due cards from any deck you've started (even if later disabled) when studying "all".
        if (this.opts.deck && c.deck !== this.opts.deck) continue;
        if (s.state === State.Learning || s.state === State.Relearning) {
          this.learning.push(c.id);
        } else if (s.due <= now) {
          reviews.push(c);
        }
      } else if (this.deckAllowed(c.deck)) {
        if (!newByDeck.has(c.deck)) newByDeck.set(c.deck, []);
        newByDeck.get(c.deck).push(c);
      }
    }

    reviews.sort((a, b) => st.cards[a.id].due - st.cards[b.id].due);
    this.reviews = reviews.slice(0, store.settings().maxReviews);

    // New cards: round-robin across decks (in catalog order), one card per item per day.
    const limit = newLeftToday(now, this.opts.deck || null) + (this.opts.extraNew || 0);
    const order = getCatalog().map((d) => d.id).filter((id) => newByDeck.has(id));
    const picked = [];
    const usedItems = new Set(itemsWithSeenCardToday);
    const pointers = new Map(order.map((id) => [id, 0]));
    let progress = true;
    while (picked.length < limit && progress) {
      progress = false;
      for (const deck of order) {
        if (picked.length >= limit) break;
        const list = newByDeck.get(deck);
        let p = pointers.get(deck);
        while (p < list.length && usedItems.has(itemKey(list[p].item))) p++;
        if (p < list.length) {
          picked.push(list[p]);
          usedItems.add(itemKey(list[p].item));
          p++;
          progress = true;
        }
        pointers.set(deck, p);
      }
    }
    this.newCards = picked;

    // Interleave: one new card after every few reviews.
    const queue = [];
    const gap = picked.length ? Math.max(1, Math.floor(this.reviews.length / (picked.length + 1))) : 0;
    let ni = 0;
    this.reviews.forEach((r, i) => {
      queue.push(r.id);
      if (gap && (i + 1) % gap === 0 && ni < picked.length) queue.push(picked[ni++].id);
    });
    while (ni < picked.length) queue.push(picked[ni++].id);
    this.queue = queue;
  }

  remaining(now = Date.now()) {
    const st = store.get();
    const learningDue = this.learning.filter((id) => st.cards[id] && st.cards[id].due <= now + LEARN_AHEAD).length;
    return {
      newLeft: this.queue.filter((id) => !st.cards[id]).length,
      reviewLeft: this.queue.filter((id) => st.cards[id]).length,
      learning: learningDue,
    };
  }

  /** Pick the next card id, or null when finished. */
  next(now = Date.now()) {
    const st = store.get();
    const learnDue = this.learning
      .filter((id) => st.cards[id] && st.cards[id].due <= now)
      .sort((a, b) => st.cards[a].due - st.cards[b].due);
    if (learnDue.length) return learnDue[0];

    while (this.queue.length) {
      const id = this.queue[0];
      const c = cards().get(id);
      // bury: don't show the sibling of an item already answered this session
      if (c && this.answeredItems.has(itemKey(c.item)) && !st.cards[id]) {
        this.queue.shift();
        continue;
      }
      return id;
    }

    const ahead = this.learning
      .filter((id) => st.cards[id] && st.cards[id].due <= now + LEARN_AHEAD)
      .sort((a, b) => st.cards[a].due - st.cards[b].due);
    // Avoid showing the card you just answered again straight away, if anything else is waiting.
    if (ahead.length > 1 && ahead[0] === this.lastId) return ahead[1];
    return ahead[0] || null;
  }

  answer(id, rating, verdict = null, now = Date.now()) {
    const st = store.get();
    const before = st.cards[id] ? { ...st.cards[id] } : null;
    const wasNew = !before;
    const nextCard = scheduler().next(before || newCard(), rating, now, id);
    st.cards[id] = nextCard;
    st.log.push([now, id, rating, verdict]);
    if (wasNew) store.bumpNewDone(1, now, cards().get(id)?.deck);

    const qi = this.queue.indexOf(id);
    if (qi >= 0) this.queue.splice(qi, 1);
    const li = this.learning.indexOf(id);
    if (li >= 0) this.learning.splice(li, 1);
    if (nextCard.state === State.Learning || nextCard.state === State.Relearning) this.learning.push(id);

    const c = cards().get(id);
    if (c) this.answeredItems.add(itemKey(c.item));
    this.lastId = id;
    this.history.push({ id, before, qi, li, wasNew });
    this.done++;
    store.save();
    return nextCard;
  }

  canUndo() { return this.history.length > 0; }

  undo() {
    const h = this.history.pop();
    if (!h) return null;
    const st = store.get();
    if (h.before) st.cards[h.id] = h.before; else delete st.cards[h.id];
    st.log.pop();
    if (h.wasNew) store.bumpNewDone(-1, Date.now(), cards().get(h.id)?.deck);
    const li = this.learning.indexOf(h.id);
    if (li >= 0) this.learning.splice(li, 1);
    if (h.li >= 0) this.learning.splice(h.li, 0, h.id);
    if (h.qi >= 0) this.queue.splice(h.qi, 0, h.id);
    const c = cards().get(h.id);
    if (c) this.answeredItems.delete(itemKey(c.item));
    this.done--;
    store.save();
    return h.id;
  }
}

/** Reviews per day for the last n days (for the heatmap). */
export function dailyCounts(days = 84, now = Date.now()) {
  const map = new Map();
  for (const [ts] of store.get().log) {
    const k = dayKey(ts);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(now - i * 86400000);
    out.push([k, map.get(k) || 0]);
  }
  return out;
}

export function streak(now = Date.now()) {
  const days = new Set(store.get().log.map(([ts]) => dayKey(ts)));
  let n = 0;
  let t = now;
  if (!days.has(dayKey(t))) t -= 86400000; // today not done yet: streak still alive from yesterday
  while (days.has(dayKey(t))) { n++; t -= 86400000; }
  return n;
}

/** Share of review-state answers (not learning) answered without "Again" over last 30 days. */
export function retention30(now = Date.now()) {
  const since = now - 30 * 86400000;
  let n = 0, ok = 0;
  for (const [ts, , rating] of store.get().log) {
    if (ts < since) continue;
    n++;
    if (rating > 1) ok++;
  }
  return n ? ok / n : null;
}
