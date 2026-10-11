// An online game as the game screen sees it: the same surface as the local Session (game/session.ts),
// but the state is whatever the server last sent this team (server/src/view.ts: fog hidden), and
// act() sends the action instead of applying it. Nothing is applied on the phone first: the server's
// answer is the next state.
//
// Animations: each state carries the events this team could see, numbered by `seq`. New ones are
// appended to one running list that the renderer reads as g.events, so it plays them exactly as it
// does offline. The history from before this phone looked (or a long absence) isn't replayed.

import type { GameState, Hero } from '@engine/state.ts';
import type { Pos } from '@engine/mapgen.ts';
import type { Action } from '@engine/match.ts';
import type { ServerMsg, SeqEvent, HeroView } from '../../../server/src/protocol.ts';
import type { GameSession, Listener } from './session.ts';

export type StateMsg = Extract<ServerMsg, { type: 'state' }>;

/** More new events than this in one state (the phone was away): skip them rather than play them all at once. */
const REPLAY_MAX = 40;

/** An enemy this team can't see right now: no position, but not dead. */
export const isHidden = (h: Hero) => !!(h as HeroView).hidden;

export class RemoteSession implements GameSession {
  g!: GameState;
  turnIndex = 0;
  over = false;
  version = 0;
  notice: string | null = null;
  private you = 0;
  private respawn: Pos[] | null = null;
  private puppetId: number | null = null;
  private names: (string | null)[] = [];
  private events: GameState['events'] = [];
  private lastSeq = -1;
  private listeners = new Set<Listener>();
  private noticeTimer = 0;
  private inFlight = false; // an action was sent and the server hasn't answered yet (no double taps)
  private send: (a: Action) => boolean;

  constructor(first: StateMsg, send: (a: Action) => boolean) {
    this.send = send;
    this.apply(first, true);
  }

  /** A new state from the server. */
  apply(s: StateMsg, initial = false) {
    const v = s.view;
    v.fields = new Map();
    this.inFlight = false;
    const fresh = (v.events as SeqEvent[]).filter(e => e.seq > this.lastSeq);
    if (!initial && fresh.length <= REPLAY_MAX) this.events.push(...fresh);
    if (fresh.length) this.lastSeq = fresh[fresh.length - 1].seq;
    v.events = this.events;
    this.g = v;
    this.you = s.you; this.turnIndex = s.turnIndex; this.over = s.over; this.respawn = s.respawnChoice; this.puppetId = s.puppet ?? null; this.names = s.names;
    this.changed();
  }

  /** The server refused something: say why for a moment. */
  flash(message: string) {
    this.notice = message;
    this.inFlight = false;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => { this.notice = null; this.changed(); }, 2500);
    this.changed();
  }

  subscribe(l: Listener) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  changed() { this.version++; for (const l of this.listeners) l(); }
  start() { /* the server runs the game */ }

  get current(): Hero { return this.g.heroes[this.g.order[this.turnIndex]]; }
  get humanHero(): Hero { return this.g.heroes[this.you]; }
  get isHumanTurn() { return !this.over && this.g.winner === null && this.current.id === this.you; }
  get respawnChoice(): Pos[] | null { return this.isHumanTurn ? this.respawn : null; }
  get puppet(): Hero | null { return this.isHumanTurn && this.puppetId !== null ? this.g.heroes[this.puppetId] : null; }
  nameOf(heroId: number) { return this.names[heroId] ?? null; }

  act(a: Action): string | null {
    if (!this.isHumanTurn) return 'not your turn';
    if (this.inFlight) return 'busy';
    if (!this.send(a)) { this.flash('Reconnecting…'); return 'offline'; }
    this.inFlight = true;
    return null;
  }
}
