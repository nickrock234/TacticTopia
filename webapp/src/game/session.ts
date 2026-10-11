// A local game in the browser: the human plays hero 0, bots play everyone else.
//
// It runs on the shared turn flow (engine/match.ts): every player action goes through act(), the same
// actions the online server accepts, so offline and online can't disagree. Bot turns are played one
// at a time with a pause between, so they can be watched.

import { generateMap } from '@engine/mapgen.ts';
import { newGame, type GameState, type Hero } from '@engine/state.ts';
import type { Pos } from '@engine/mapgen.ts';
import { ELIMINATION, MAP_SIZE } from '@engine/numbers.ts';
import { newMatch, beginTurn, stepAuto, applyAction, currentHero, matchOver, waitingForHuman, type Match, type Action, type Bot } from '@engine/match.ts';
import { botTurn, botRespawn, ARCHETYPES, ARCH } from '@sim/bots.ts';

export type Listener = () => void;

/** What the game screen needs from a game: a local one (Session) or an online one (game/remote.ts). */
export interface GameSession {
  readonly g: GameState;
  readonly turnIndex: number;
  readonly current: Hero;
  readonly humanHero: Hero;
  readonly isHumanTurn: boolean;
  readonly over: boolean;
  readonly respawnChoice: Pos[] | null;
  /** Telepuppet: the ally whose one action you're taking now (your next action is its), else null. */
  readonly puppet: Hero | null;
  readonly version: number;
  /** Online: why the server refused the last action, shown for a moment. */
  readonly notice: string | null;
  subscribe(l: Listener): () => void;
  changed(): void;
  start(): void;
  /** Do something (the actions the server accepts). Returns why not, or null if it went (online: sent). */
  act(a: Action): string | null;
  /** The person playing a hero (online), or null for a bot. */
  nameOf(heroId: number): string | null;
}
const BOT: Bot = { turn: botTurn, respawn: botRespawn };

export class Session implements GameSession {
  m: Match;
  human: number;
  private listeners = new Set<Listener>();
  version = 0;              // bumps on every change (React re-render key)
  readonly notice = null;

  constructor(seed = Date.now() % 100000, humanArchetype = 'Crusader', perTeam = 2, big = false) {
    let map = null;
    for (let s = seed; !map; s++) map = generateMap({ size: big ? 80 : MAP_SIZE[perTeam], teams: 2, perTeam, spread: big ? 2 : 1 }, s);
    const picks = [humanArchetype, ...Array.from({ length: perTeam * 2 - 1 }, (_, k) => k + 1).map(i => ARCHETYPES[(seed * 7 + i * 3) % ARCHETYPES.length].id)];
    // map.bases are ordered team 0 then team 1; the human is the first base.
    const g = newGame(map, map.bases.map((_, i) => { const a = ARCH[picks[i]]; return { cls: a.cls, archetype: a.id, element: a.element }; }));
    g.eliminationDeaths = perTeam >= 4 ? ELIMINATION.deaths4v4 : ELIMINATION.deathsUpTo3v3;
    this.human = 0;
    this.m = newMatch(g, [this.human]);
  }

  subscribe(l: Listener) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  nameOf(): string | null { return null; }
  changed() { this.version++; for (const l of this.listeners) l(); }

  get g(): GameState { return this.m.g; }
  get turnIndex() { return this.m.turnIndex; }
  get current(): Hero { return currentHero(this.m); }
  get humanHero(): Hero { return this.g.heroes[this.human]; }
  get isHumanTurn() { return this.current.id === this.human && this.g.winner === null; }
  get over() { return matchOver(this.m); }
  /** The human is coming back from death with more than one place to respawn. */
  get respawnChoice(): Pos[] | null { return this.isHumanTurn ? this.m.respawnChoice : null; }
  get puppet(): Hero | null { return this.isHumanTurn && this.m.puppet ? this.g.heroes[this.m.puppet.ally] : null; }

  /** Start the game: runs bot turns until it's the human's turn. */
  start(stepDelay = 450) { beginTurn(this.m, BOT); this.changed(); this.runBots(stepDelay); }

  /** The human does something (the same actions the server accepts). Returns why not, or null. */
  act(a: Action, stepDelay = 450): string | null {
    const err = applyAction(this.m, this.human, a, BOT);
    this.changed();
    if (!err && !waitingForHuman(this.m)) this.runBots(stepDelay); // the turn is over
    return err;
  }

  /** Play turns that need no person one at a time, with a pause between, so they can be watched. */
  private runBots(stepDelay: number) {
    const step = () => {
      if (this.over || waitingForHuman(this.m)) { this.changed(); return; }
      const wasAlive = !!this.current.pos;
      stepAuto(this.m, BOT);
      this.changed();
      setTimeout(step, wasAlive ? stepDelay : 60);
    };
    setTimeout(step, stepDelay);
  }
}
