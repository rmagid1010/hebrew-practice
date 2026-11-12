// Items the learner said they already know by starting the course at a later lesson (Settings → Course).
// They count as learnt for unlocking sentences, writing tasks and verb stages, but keep no review schedule.
let assumed = new Set();
export function setAssumed(keys) { assumed = new Set(keys); }
/** Accepts an item key ("deck/id") or a card id ("deck/id:w"). */
export function isAssumed(key) { return assumed.size > 0 && assumed.has(key.split(':')[0]); }
