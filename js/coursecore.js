// Pure helpers for the course (no DOM, no storage) — shared by the app and tools/validate-course.mjs.

const PERSONS = {
  present: ['ms', 'fs', 'mp', 'fp'],
  past: ['1s', '2ms', '2fs', '3ms', '3fs', '1p', '2mp', '3p'],
  future: ['1s', '2ms', '2fs', '3ms', '3fs', '1p', '2mp', '3p'],
  imp: ['ms', 'fs', 'mp'],
};

/**
 * Expand a verb reference like "paal/katav@present" into item keys of the verb deck.
 * Stages: @inf, @binyan (root, binyan + the infinitive shape), @present, @past, @future, @imp.
 */
export function expandVerbRef(ref, verbDeckData) {
  const [deckVerb, stage] = ref.split('@');
  const [deck, verbId] = deckVerb.split('/');
  const v = verbDeckData?.verbs?.find((x) => x.id === verbId);
  if (!v) return { error: `Unknown verb "${deckVerb}"` };
  const k = (id) => `${deck}/${id}`;
  switch (stage) {
    case 'inf': return { keys: [k(`${verbId}-inf`)] };
    case 'binyan': return { keys: [k('shape-inf'), k(`${verbId}-root`), k(`${verbId}-binyan`)] };
    case 'present': case 'past': case 'future': case 'imp': {
      const forms = v.forms?.[stage];
      if (!forms) return { error: `${deckVerb} has no ${stage} forms` };
      const keys = stage === 'imp' ? [] : [k(`shape-${stage}`)];
      for (const p of PERSONS[stage]) if (forms[p]) keys.push(k(`${verbId}-${stage}-${p}`));
      return { keys };
    }
    default: return { error: `Unknown stage "${stage}" in ${ref}` };
  }
}

/** All item keys a lesson introduces, in teaching order (words, verbs, sentences, writing). */
export function lessonKeys(lesson, verbData) {
  const out = [];
  const errors = [];
  for (const k of lesson.items) out.push(k);
  for (const ref of lesson.verbs || []) {
    const r = expandVerbRef(ref, verbData[ref.split('/')[0]]);
    if (r.error) errors.push(r.error); else out.push(...r.keys);
  }
  for (const k of lesson.phrases || []) out.push(k);
  for (const k of lesson.write || []) out.push(k);
  return { keys: out, errors };
}
