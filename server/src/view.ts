// What one team is allowed to see of a game (Nick, 2026-10-02: the server hides fog).
//
// A view is a copy of the game state with, for the other team:
//   - heroes it can't see right now: no position (and `hidden` set, so the app doesn't think they
//     died), no body marker;
//   - mana and the bag of every enemy hero (H9 hides mana; skills stay, because damage previews need
//     the defender's passives — the app doesn't list them);
//   - the other team's gold, XP and fog;
//   - terrain of tiles this team hasn't revealed (sent as plains; the app draws fog there anyway);
//   - events it couldn't see (anything happening only on its unrevealed tiles, and casts of
//     Invisibility, which would give the thief away);
//   - the server's text log.
// Events come with their sequence number (`seq`) so a phone that was away animates only what's new.

import type { GameState, GameEvent } from '../../engine/state.ts';
import type { SeqEvent, HeroView } from './protocol.ts';
import type { Pos } from '../../engine/mapgen.ts';
import { visibleTo } from '../../engine/rules.ts';
import { fromJSON, toJSON } from '../../engine/serialize.ts';

export type { SeqEvent, HeroView } from './protocol.ts';

/** Events kept in a view: the most recent ones (a phone that missed more just skips the animations). */
const EVENT_WINDOW = 300;

export function teamView(g: GameState, team: number): GameState {
  const v = fromJSON<GameState>(toJSON(g)); // deep copy (Sets and fog survive)
  v.fields = new Map();
  const seen = (p: Pos | null | undefined) => !!p && g.fog[team][p.y * g.map.w + p.x] === 1;

  v.heroes = v.heroes.map((h, i) => {
    const real = g.heroes[i];
    if (real.team === team) return h;
    const out: HeroView = { ...h, mana: 0, inventory: [] };
    if (real.pos && !visibleTo(g, real, team)) { out.pos = null; out.hidden = true; out.deathPos = null; } // no body drawn at an old death spot
    if (!real.pos && real.deathPos && !seen(real.deathPos)) out.deathPos = null;
    return out;
  });
  v.players = v.players.map(p => (p.team === team ? p : { ...p, gold: 0, xp: 0, xpEarned: 0, goldEarned: 0, stolenNext: 0, report: undefined, carry: [] }));
  v.fog = v.fog.map((f, t) => (t === team ? f : new Uint8Array(f.length)));
  v.map = { ...v.map, tiles: v.map.tiles.map((t, i) => (g.fog[team][i] ? t : 'plain')) };
  v.log = [];

  const visibleEvent = (e: GameEvent): boolean => {
    const hero = 'hero' in e ? g.heroes[e.hero] : null;
    const ours = hero?.team === team;
    if (e.t === 'cast' && e.spell === 'invisibility' && !ours) return false;
    if (ours) return true;
    switch (e.t) {
      case 'attack': return seen(e.from) || e.targets.some(seen);
      case 'cast': return seen(e.from) || seen(e.at) || (e.tiles ?? []).some(seen);
      case 'hit': case 'coin': return seen(e.pos);
      case 'counter': return seen(e.target);
      case 'npcAttack': return seen(e.npc) || seen(e.target);
      case 'respawn': return seen(e.pos);
      case 'reveal': return true;
      case 'burn': case 'surge': return !!hero?.pos && seen(hero.pos);
    }
  };
  const from = Math.max(0, g.events.length - EVENT_WINDOW);
  v.events = g.events.slice(from).map((e, i) => ({ ...e, seq: from + i } as SeqEvent)).filter(visibleEvent);
  return v;
}
