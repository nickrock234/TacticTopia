// A game being played turn by turn: whose turn it is, round upkeep, respawn choices, and the one
// list of actions a player can send. Used the same way by the offline app and the server, so the
// two can't disagree about the rules.
//
// playRound() (turn.ts) runs a whole round at once for the simulations; a Match runs one hero at a
// time so a person can take their turn. Bot logic isn't imported here (it lives in sim/): the caller
// passes it in.

import type { GameState, Hero } from './state.ts';
import type { Pos, Terrain } from './mapgen.ts';
import { TURN_LIMIT } from './numbers.ts';
import { NPC } from './economy.ts';
import { startTurn, endTurn, respawnOptions, dueToRespawn, type RespawnPicker } from './turn.ts';
import {
  blocker, move, attack, cast, doublecast, rest, manaSurge, huntersMark, placeDecoy, launder, curePoison,
  learn, buyBuilding, buyItem, upgrade, sellItem, equipItem, giveItem, endCutIn,
  type AttackOpt, type Target, type Spell, type CastArgs, type CutInSaved,
} from './rules.ts';

export interface Match {
  g: GameState;
  turnIndex: number;            // position in g.order
  humans: number[];             // hero ids a person controls (the rest are bots)
  respawnChoice: Pos[] | null;  // a person's hero is back with more than one place to appear: waiting for the pick
  /** Telepuppet cast by a person: they now take the ally's one action (or skip it with 'end'). */
  puppet?: { ally: number; saved: CutInSaved } | null;
}

export interface Bot { turn: (g: GameState, h: Hero) => void; respawn: RespawnPicker }

export function newMatch(g: GameState, humans: number[]): Match {
  return { g, turnIndex: 0, humans, respawnChoice: null, puppet: null };
}

export const currentHero = (m: Match): Hero => m.g.heroes[m.g.order[m.turnIndex]];
export const isHuman = (m: Match, heroId: number) => m.humans.includes(heroId);
export const matchOver = (m: Match) => m.g.winner !== null || m.g.round > TURN_LIMIT;

/** Start the turn at turnIndex: round upkeep first (monsters and lair bosses come back), then the
 *  hero's start of turn. A person's hero with more than one respawn option waits for their pick. */
export function beginTurn(m: Match, bot: Bot) {
  const g = m.g;
  if (m.turnIndex === 0) {
    for (const c of g.camps) if (c.respawn !== 0 && c.respawn <= g.round && !blocker(g, g.map.camps[c.idx])) { c.respawn = 0; c.hp = NPC[g.map.camps[c.idx].kind].hp; }
    for (const l of g.landmarks) if (g.map.landmarks[l.idx].bonus === 'lair' && l.bossRespawn !== 0 && l.bossRespawn <= g.round && !blocker(g, g.map.landmarks[l.idx])) { l.bossRespawn = 0; l.bossHp = NPC.lair.hp; }
  }
  const h = currentHero(m);
  if (isHuman(m, h.id) && dueToRespawn(g, h) && respawnOptions(g, h).length > 1) { m.respawnChoice = respawnOptions(g, h); return; }
  startTurn(g, h, bot.respawn);
}

/** End the current hero's turn and move to the next one (the next round after the last hero). */
export function finishTurn(m: Match) {
  endTurn(m.g, currentHero(m));
  m.turnIndex++;
  if (m.turnIndex >= m.g.order.length) { m.turnIndex = 0; m.g.round++; }
}

/** Is it a person's move right now (their hero is up and alive, or picking a respawn)? A person ends
 *  their own turn, even with no actions left (they may still shop). */
export function waitingForHuman(m: Match): boolean {
  if (matchOver(m)) return false;
  const h = currentHero(m);
  return isHuman(m, h.id) && (!!m.respawnChoice || !!h.pos);
}

/** Play one turn that needs no person: a bot's turn, or skipping a person's dead hero. Returns false when it's a person's move or the game is over. */
export function stepAuto(m: Match, bot: Bot): boolean {
  if (matchOver(m) || waitingForHuman(m)) return false;
  const h = currentHero(m);
  if (!isHuman(m, h.id) && h.pos && h.actionsLeft > 0) bot.turn(m.g, h);
  finishTurn(m);
  if (!matchOver(m)) beginTurn(m, bot);
  return true;
}

/** Start a new match: begin the first turn and play bots until a person is up. */
export function startMatch(m: Match, bot: Bot) {
  beginTurn(m, bot);
  while (stepAuto(m, bot)) { /* bots and skipped turns */ }
}

// =====================================================================
// Actions: everything a player can send
// =====================================================================

export type Action =
  | { t: 'move'; to: Pos }
  | { t: 'attack'; target: Target; opt?: AttackOpt }
  | { t: 'cast'; spell: Spell; args: CastArgs }
  | { t: 'doublecast'; s1: Spell; a1: CastArgs; s2: Spell; a2: CastArgs }
  | { t: 'rest' } | { t: 'surge' } | { t: 'mark'; hero: number } | { t: 'decoy' }
  | { t: 'launder'; gold: number } | { t: 'cure' }
  | { t: 'learn'; id: string } | { t: 'build'; id: string }
  | { t: 'buy'; item: 'shield' | 'boots' | 'weapon2' } | { t: 'upgrade'; what: 'weapon' | 'shield' | 'boots'; terrain?: Terrain }
  | { t: 'sell'; index: number } | { t: 'equip'; index: number } | { t: 'give'; to: number; index: number }
  | { t: 'respawn'; pos: Pos }
  | { t: 'end' };

/**
 * Apply one action for `heroId`. Returns null if it happened, or why not. Everything happens on that
 * hero's own turn. `end` finishes the turn and begins the next (the caller then plays bots with
 * stepAuto). Telepuppet cast by a person waits for them to take the ally's action (m.puppet): the next
 * action is the ally's ('end' skips it).
 */
export function applyAction(m: Match, heroId: number, a: Action, bot: Bot): string | null {
  const g = m.g, h = g.heroes[heroId];
  if (!h) return 'no such hero';
  if (matchOver(m)) return 'the game is over';
  if (currentHero(m).id !== heroId) return 'not your turn';
  if (m.puppet) return puppetAction(m, a, bot);
  if (m.respawnChoice) {
    if (a.t !== 'respawn') return 'pick where to respawn first';
    if (!m.respawnChoice.some(p => p.x === a.pos.x && p.y === a.pos.y)) return 'not a respawn option';
    m.respawnChoice = null;
    startTurn(g, h, () => a.pos);
    return null;
  }
  // a person's Telepuppet: they pick the ally's action next; a bot's is played by the bot
  const cutIn = isHuman(m, heroId)
    ? (ally: Hero, saved: CutInSaved) => { m.puppet = { ally: ally.id, saved }; return 'later' as const; }
    : (ally: Hero) => bot.turn(g, ally);
  return perform(m, h, a, bot, cutIn);
}

/** The ally's one action under Telepuppet: anything but moving, shopping or ending its turn; 'end' skips it. */
const PUPPET_OK: Action['t'][] = ['attack', 'cast', 'doublecast', 'rest', 'surge', 'mark', 'cure'];
function puppetAction(m: Match, a: Action, bot: Bot): string | null {
  const p = m.puppet!, ally = m.g.heroes[p.ally];
  const done = () => { endCutIn(ally, p.saved); m.puppet = null; };
  if (a.t === 'end') { done(); return null; }
  if (!PUPPET_OK.includes(a.t)) return 'the puppet can only act';
  const err = perform(m, ally, a, bot, o => bot.turn(m.g, o));
  if (!err && (!ally.pos || ally.actionsLeft <= 0)) done();
  return err;
}

function perform(m: Match, h: Hero, a: Action, bot: Bot, cutIn: (ally: Hero, saved: CutInSaved) => void | 'later'): string | null {
  const g = m.g;
  const ok = (done: boolean, why: string) => (done ? null : why);
  switch (a.t) {
    case 'move': return ok(move(g, h, a.to), "can't move there");
    case 'attack': return ok(attack(g, h, a.target, a.opt ?? 'weapon'), "can't attack that");
    case 'cast': return ok(cast(g, h, a.spell, a.args, { onTeleport: cutIn }), "can't cast that");
    case 'doublecast': return ok(doublecast(g, h, a.s1, a.a1, a.s2, a.a2), "can't doublecast that");
    case 'rest': return ok(rest(g, h), "can't rest");
    case 'surge': return ok(manaSurge(g, h), "can't surge");
    case 'mark': return ok(huntersMark(g, h, a.hero), "can't mark that");
    case 'decoy': return ok(placeDecoy(g, h), "can't leave a Body double here");
    case 'launder': return ok(launder(g, h, a.gold), "can't launder that");
    case 'cure': return ok(curePoison(g, h), "can't cure");
    case 'learn': return ok(learn(g, h, a.id), "can't learn that");
    case 'build': return ok(buyBuilding(g, h.player, a.id), "can't build that");
    case 'buy': return ok(buyItem(g, h, a.item), "can't buy that");
    case 'upgrade': return ok(upgrade(g, h, a.what, a.terrain), "can't upgrade that");
    case 'sell': return ok(sellItem(g, h, a.index), "can't sell that");
    case 'equip': return ok(equipItem(g, h, a.index), "can't equip that");
    case 'give': return ok(giveItem(g, h, g.heroes[a.to], a.index), "can't give that");
    case 'respawn': return 'nothing to respawn';
    case 'end':
      finishTurn(m);
      if (!matchOver(m)) beginTurn(m, bot);
      return null;
  }
}
