// Game state ↔ JSON, for saving online games (and sending them over the wire).
// The state holds Sets (skills, buildings, quests) and Uint8Arrays (fog), which plain JSON can't
// keep: they're tagged on the way out and rebuilt on the way in. The walk-field cache is dropped
// (it rebuilds itself on demand).

import type { GameState } from './state.ts';

export function toJSON(value: unknown): string {
  return JSON.stringify(value, (key, v) => {
    if (key === 'fields' && v instanceof Map) return undefined;
    if (v instanceof Set) return { $set: [...v] };
    if (v instanceof Uint8Array) return { $u8: Array.from(v) };
    return v;
  });
}

export function fromJSON<T = unknown>(text: string): T {
  return JSON.parse(text, (_key, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('$set' in v) return new Set(v.$set);
      if ('$u8' in v) return Uint8Array.from(v.$u8);
    }
    return v;
  }) as T;
}

/** A game state read back from JSON, with its runtime-only parts restored. */
export function loadState(text: string): GameState {
  const g = fromJSON<GameState>(text);
  g.fields = new Map();
  return g;
}
