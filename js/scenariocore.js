// Pure helpers for scenarios (no DOM / storage) — shared by the app and tools/validate-scenarios.mjs.

/** Fill {masculine|feminine} templates for the player's gender ('m' / 'f'). */
export function fill(text, g) {
  return (text || '').replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m, f) => (g === 'f' ? f : m));
}

/** Who the player is talking to on a turn: its `to`, or the last character who spoke before it. */
export function listenerOf(scenario, turnIndex) {
  const t = scenario.turns[turnIndex];
  if (t.to) return t.to;
  for (let i = turnIndex - 1; i >= 0; i--) if (scenario.turns[i].t === 'npc') return scenario.turns[i].who;
  return Object.keys(scenario.cast)[0];
}

/** Persona for the agreement checker on the player's turn. */
export function personaFor(scenario, turnIndex, g) {
  const who = scenario.cast[listenerOf(scenario, turnIndex)];
  return { speaker: g, to: who?.g || undefined };
}
