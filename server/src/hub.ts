// The game server's logic, without any networking (index.ts wires it to WebSockets; tests call it
// directly). Lobby → start → play:
//   create   a host opens a game (2v2 / 3v3 / 4v4) and gets seat 0 and a secret token
//   join     a friend opens the invite link, enters a name, takes a free seat (a token of their own)
//   pick     change hero (archetype) or move to another free seat, before the start
//   start    the host starts; seats nobody took are played by bots
//   hello    a phone (re)connects with its token: gets the lobby or its team's view of the game
//   act      a player's action (engine/match.ts); bots then play until a person is up; saved; every
//            connected phone gets its own team's view
//   list     the home screen: a phone's saved games (id + token) → title, mode, round, whose turn
// Bot turns are played one at a time with a pause between (stepDelay), each one sent to the phones,
// so they can be watched; a game loaded after a restart picks its bots back up.
// All messages are JSON written with engine/serialize.ts (Sets and fog survive).

import { randomBytes } from 'node:crypto';
import { generateMap } from '../../engine/mapgen.ts';
import { newGame } from '../../engine/state.ts';
import { ELIMINATION, MAP_SIZE } from '../../engine/numbers.ts';
import { newMatch, beginTurn, stepAuto, applyAction, matchOver, currentHero, waitingForHuman, type Match, type Bot } from '../../engine/match.ts';
import { toJSON, fromJSON } from '../../engine/serialize.ts';
import { ARCHETYPES, ARCH } from '../../sim/bots.ts';
import { teamView } from './view.ts';
import type { ClientMsg, ServerMsg, GameSummary } from './protocol.ts';

export interface Seat { team: number; name: string | null; token: string | null; archetype: string | null }
export interface Game { id: string; title: string; perTeam: number; created: number; seats: Seat[]; host: number; match: Match | null }

export type { ClientMsg, ServerMsg, LobbySeat, GameSummary } from './protocol.ts';

export interface Conn { send: (m: ServerMsg) => void; gameId?: string; seat?: number }
export interface StoreLike { save(id: string, text: string): void; load(id: string): string | null }

const NAME_MAX = 16;
const cleanName = (s: unknown) => (typeof s === 'string' ? s.trim().slice(0, NAME_MAX) : '') || 'Player';

export class Hub {
  private games = new Map<string, Game>();
  private conns = new Map<string, Set<Conn>>();
  private store: StoreLike; private bot: Bot; private seedOf: () => number; private stepDelay: number;
  private stepping = new Set<string>(); // games whose bots are mid-way through their turns
  /** stepDelay: ms between bot turns (0 = all at once, for tests). */
  constructor(store: StoreLike, bot: Bot, seedOf = () => Math.floor(Math.random() * 1e9), stepDelay = 0) {
    this.store = store; this.bot = bot; this.seedOf = seedOf; this.stepDelay = stepDelay;
  }

  handle(conn: Conn, msg: ClientMsg) {
    try {
      switch (msg.type) {
        case 'create': return this.create(conn, msg);
        case 'join': return this.join(conn, msg);
        case 'hello': return this.hello(conn, msg);
        case 'pick': return this.pick(conn, msg);
        case 'start': return this.start(conn, msg);
        case 'act': return this.act(conn, msg);
        case 'list': return this.list(conn, msg);
        default: return conn.send({ type: 'error', message: 'unknown message' });
      }
    } catch (e) {
      conn.send({ type: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }

  disconnect(conn: Conn) { if (conn.gameId) this.conns.get(conn.gameId)?.delete(conn); }

  // ---------- lobby ----------
  private create(conn: Conn, msg: Extract<ClientMsg, { type: 'create' }>) {
    const perTeam = [2, 3, 4].includes(msg.perTeam) ? msg.perTeam : 2;
    let id = '';
    do id = randomBytes(4).toString('hex'); while (this.games.has(id) || this.store.load(id));
    const seats: Seat[] = Array.from({ length: perTeam * 2 }, (_, i) => ({ team: i < perTeam ? 0 : 1, name: null, token: null, archetype: null }));
    const title = (typeof msg.title === 'string' ? msg.title.trim().slice(0, 24) : '') || `${cleanName(msg.name)}'s game`;
    const game: Game = { id, title, perTeam, created: Date.now(), seats, host: 0, match: null };
    this.games.set(id, game);
    this.takeSeat(conn, game, 0, msg.name, msg.archetype);
  }

  private join(conn: Conn, msg: Extract<ClientMsg, { type: 'join' }>) {
    const game = this.game(msg.gameId);
    if (game.match) throw new Error('this game has already started');
    let seat = msg.seat ?? -1;
    if (seat < 0 || !game.seats[seat] || game.seats[seat].token) {
      // the first free seat on the team with fewer people
      const people = (t: number) => game.seats.filter(s => s.team === t && s.token).length;
      const free = game.seats.map((s, i) => ({ s, i })).filter(x => !x.s.token).sort((a, b) => people(a.s.team) - people(b.s.team) || a.i - b.i);
      if (!free.length) throw new Error('this game is full');
      seat = free[0].i;
    }
    this.takeSeat(conn, game, seat, msg.name, msg.archetype);
  }

  private takeSeat(conn: Conn, game: Game, seat: number, name: string, archetype?: string) {
    const token = randomBytes(16).toString('hex');
    game.seats[seat] = { ...game.seats[seat], name: cleanName(name), token, archetype: archetype && ARCH[archetype] ? archetype : null };
    this.attach(conn, game, seat);
    this.save(game);
    conn.send({ type: 'joined', gameId: game.id, token, seat });
    this.broadcast(game);
  }

  private hello(conn: Conn, msg: Extract<ClientMsg, { type: 'hello' }>) {
    const game = this.game(msg.gameId);
    const seat = this.seatOf(game, msg.token);
    this.attach(conn, game, seat);
    this.sendTo(conn, game);
  }

  private pick(conn: Conn, msg: Extract<ClientMsg, { type: 'pick' }>) {
    const game = this.game(msg.gameId);
    if (game.match) throw new Error('this game has already started');
    let seat = this.seatOf(game, msg.token);
    if (msg.seat !== undefined && msg.seat !== seat) {
      const to = game.seats[msg.seat];
      if (!to || to.token) throw new Error('that seat is taken');
      game.seats[msg.seat] = { ...to, name: game.seats[seat].name, token: game.seats[seat].token, archetype: game.seats[seat].archetype };
      game.seats[seat] = { ...game.seats[seat], name: null, token: null, archetype: null };
      if (game.host === seat) game.host = msg.seat;
      seat = msg.seat;
      conn.seat = seat;
    }
    if (msg.archetype !== undefined) game.seats[seat].archetype = ARCH[msg.archetype] ? msg.archetype : null;
    this.save(game);
    this.broadcast(game);
  }

  private start(conn: Conn, msg: Extract<ClientMsg, { type: 'start' }>) {
    const game = this.game(msg.gameId);
    if (game.match) throw new Error('this game has already started');
    if (this.seatOf(game, msg.token) !== game.host) throw new Error('only the host can start');
    const seed = this.seedOf();
    let map = null;
    for (let s = seed; !map; s++) map = generateMap({ size: MAP_SIZE[game.perTeam], teams: 2, perTeam: game.perTeam }, s);
    // bots (and people who didn't pick) get a hero by the seed
    const picks = game.seats.map((s, i) => s.archetype ?? ARCHETYPES[(seed + i * 7) % ARCHETYPES.length].id);
    const g = newGame(map, map.bases.map((_, i) => { const a = ARCH[picks[i]]; return { cls: a.cls, archetype: a.id, element: a.element }; }));
    g.eliminationDeaths = game.perTeam >= 4 ? ELIMINATION.deaths4v4 : ELIMINATION.deathsUpTo3v3;
    game.seats.forEach((s, i) => { s.archetype = picks[i]; });
    game.match = newMatch(g, game.seats.map((s, i) => (s.token ? i : -1)).filter(i => i >= 0));
    beginTurn(game.match, this.bot);
    this.save(game);
    this.broadcast(game);
    this.runBots(game);
  }

  // ---------- play ----------
  private act(conn: Conn, msg: Extract<ClientMsg, { type: 'act' }>) {
    const game = this.game(msg.gameId);
    if (!game.match) throw new Error('the game has not started');
    const seat = this.seatOf(game, msg.token);
    const err = applyAction(game.match, seat, msg.action, this.bot);
    if (err) { conn.send({ type: 'error', message: err }); return; }
    this.save(game);
    this.broadcast(game);
    this.runBots(game);
  }

  /** Bots (and turns nobody can take) until a person is up: all at once, or one at a time with a
   *  pause between so phones can watch (a dead hero's skipped turn barely pauses). */
  private runBots(game: Game) {
    const m = game.match;
    if (!m || this.stepping.has(game.id)) return;
    if (!this.stepDelay) {
      let any = false;
      while (stepAuto(m, this.bot)) any = true;
      if (any) { this.save(game); this.broadcast(game); }
      return;
    }
    if (matchOver(m) || waitingForHuman(m)) return;
    this.stepping.add(game.id);
    const step = () => {
      const alive = !!currentHero(m).pos;
      if (!stepAuto(m, this.bot)) { this.stepping.delete(game.id); return; }
      this.save(game);
      this.broadcast(game);
      if (matchOver(m) || waitingForHuman(m)) { this.stepping.delete(game.id); return; }
      setTimeout(step, alive ? this.stepDelay : 60);
    };
    setTimeout(step, this.stepDelay);
  }

  private list(conn: Conn, msg: Extract<ClientMsg, { type: 'list' }>) {
    const games: GameSummary[] = [];
    for (const { gameId, token } of (Array.isArray(msg.games) ? msg.games : []).slice(0, 50)) {
      let game: Game;
      try { game = this.game(gameId); } catch { continue; }
      const you = game.seats.findIndex(s => s.token && s.token === token);
      if (you < 0) continue;
      const m = game.match, over = !!m && matchOver(m), turn = m && !over ? currentHero(m).id : null;
      games.push({ gameId, title: game.title ?? 'Game', perTeam: game.perTeam, started: !!m, over, round: m?.g.round ?? 0, you,
        turn, turnName: turn === null ? null : game.seats[turn].token ? game.seats[turn].name : null, winner: m?.g.winner ?? null, team: game.seats[you].team });
    }
    conn.send({ type: 'list', games });
  }

  /** Whose turn it is, by seat (for notifications later). */
  waitingOn(gameId: string): number | null {
    const m = this.games.get(gameId)?.match;
    return m && !matchOver(m) ? currentHero(m).id : null;
  }

  // ---------- plumbing ----------
  private game(id: string): Game {
    let game = this.games.get(id);
    if (!game) {
      const text = this.store.load(id);
      if (!text) throw new Error('no such game');
      game = fromJSON<Game>(text);
      if (game.match) game.match.g.fields = new Map();
      this.games.set(id, game);
      this.runBots(game); // a restart may have stopped it mid-way through the bots' turns
    }
    return game;
  }

  private seatOf(game: Game, token: string): number {
    const seat = game.seats.findIndex(s => s.token && s.token === token);
    if (seat < 0) throw new Error('not a player in this game');
    return seat;
  }

  private attach(conn: Conn, game: Game, seat: number) {
    if (conn.gameId && conn.gameId !== game.id) this.conns.get(conn.gameId)?.delete(conn);
    conn.gameId = game.id; conn.seat = seat;
    if (!this.conns.has(game.id)) this.conns.set(game.id, new Set());
    this.conns.get(game.id)!.add(conn);
  }

  private save(game: Game) { this.store.save(game.id, toJSON(game)); }

  private broadcast(game: Game) { for (const c of this.conns.get(game.id) ?? []) this.sendTo(c, game); }

  private sendTo(conn: Conn, game: Game) {
    const seat = conn.seat ?? -1;
    if (!game.match) {
      conn.send({ type: 'lobby', gameId: game.id, title: game.title ?? 'Game', perTeam: game.perTeam, you: seat, host: seat === game.host, hostSeat: game.host,
        seats: game.seats.map(s => ({ team: s.team, name: s.name, archetype: s.archetype, open: !s.token })) });
      return;
    }
    const m = game.match, team = game.seats[seat].team;
    conn.send({ type: 'state', gameId: game.id, you: seat, turnIndex: m.turnIndex, over: matchOver(m),
      respawnChoice: currentHero(m).id === seat ? m.respawnChoice : null, puppet: currentHero(m).id === seat ? m.puppet?.ally ?? null : null,
      names: game.seats.map(s => (s.token ? s.name : null)), view: teamView(m.g, team) });
  }
}
