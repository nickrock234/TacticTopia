// The phone's link to the game server (server/src/hub.ts): one WebSocket that reconnects by itself,
// the games this phone holds (game id + secret token, kept in localStorage), and what's on screen:
// the home list, a lobby, or a game (a RemoteSession).
//
// The server URL is baked into the build with VITE_SERVER_URL (like the dice game); without it, the
// dev default is port 8080 on the same machine that served the page.
// An invite link is the page with ?g=<game id>.

import type { ClientMsg, ServerMsg, GameSummary } from '../../../server/src/protocol.ts';
import type { Action } from '@engine/match.ts';
import { toJSON, fromJSON } from '@engine/serialize.ts';
import { RemoteSession } from '../game/remote.ts';

export const SERVER_URL: string = import.meta.env.VITE_SERVER_URL || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8080`;

export type Lobby = Extract<ServerMsg, { type: 'lobby' }>;
interface Saved { gameId: string; token: string }

const GAMES = 'tt.games', NAME = 'tt.name';
function read<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) as T : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } }

export const inviteLink = (gameId: string) => `${location.origin}${location.pathname}?g=${gameId}`;

export class Online {
  status: 'connecting' | 'open' | 'closed' = 'connecting';
  version = 0;
  games: GameSummary[] | null = null; // the home list (null until the server answers)
  gameId: string | null = null;       // the game on screen
  lobby: Lobby | null = null;
  session: RemoteSession | null = null;
  error: string | null = null;        // shown on the home / join screens
  private ws: WebSocket | null = null;
  private queue: ClientMsg[] = [];
  private listeners = new Set<() => void>();
  private retry = 0;

  constructor() { this.connect(); }

  subscribe(l: () => void) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  private changed() { this.version++; for (const l of this.listeners) l(); }

  get name(): string { return read(NAME, ''); }
  set name(n: string) { write(NAME, n.trim().slice(0, 16)); }
  private saved(): Saved[] { return read<Saved[]>(GAMES, []); }
  hasToken(gameId: string) { return !!this.tokenFor(gameId); }
  private tokenFor(gameId: string) { return this.saved().find(s => s.gameId === gameId)?.token ?? null; }
  private remember(gameId: string, token: string) { write(GAMES, [{ gameId, token }, ...this.saved().filter(s => s.gameId !== gameId)].slice(0, 30)); }
  forget(gameId: string) { write(GAMES, this.saved().filter(s => s.gameId !== gameId)); this.games = this.games?.filter(g => g.gameId !== gameId) ?? null; this.changed(); }

  // ---------- socket ----------
  private connect() {
    this.status = 'connecting';
    let ws: WebSocket;
    try { ws = new WebSocket(SERVER_URL); } catch { this.closed(); return; }
    this.ws = ws;
    ws.onopen = () => {
      this.status = 'open'; this.retry = 0;
      // (re)connected: back into the game on screen, then anything asked for while away
      const token = this.gameId && this.tokenFor(this.gameId);
      if (this.gameId && token) this.raw({ type: 'hello', gameId: this.gameId, token });
      const q = this.queue; this.queue = [];
      for (const m of q) if (m.type !== 'hello') this.raw(m);
      this.changed();
    };
    ws.onmessage = e => { try { this.receive(fromJSON<ServerMsg>(String(e.data))); } catch { /* ignore a bad message */ } };
    ws.onclose = () => { if (this.ws === ws) this.closed(); };
  }
  private closed() {
    this.ws = null; this.status = 'closed'; this.changed();
    setTimeout(() => this.connect(), Math.min(10000, 1000 * 2 ** this.retry++));
  }
  private raw(m: ClientMsg) { this.ws!.send(toJSON(m)); }
  /** Send now, or once connected (actions are never queued: the board may have changed). */
  private send(m: ClientMsg): boolean {
    if (this.status === 'open' && this.ws) { this.raw(m); return true; }
    if (m.type === 'list') this.queue = this.queue.filter(q => q.type !== 'list');
    if (m.type !== 'act') this.queue.push(m);
    return false;
  }

  private receive(m: ServerMsg) {
    switch (m.type) {
      case 'joined':
        this.remember(m.gameId, m.token);
        this.gameId = m.gameId; this.error = null;
        history.replaceState(null, '', `?g=${m.gameId}`);
        break;
      case 'lobby':
        if (m.gameId !== this.gameId) return;
        this.lobby = m; this.session = null;
        break;
      case 'state':
        if (m.gameId !== this.gameId) return;
        this.lobby = null;
        if (this.session) this.session.apply(m);
        else this.session = new RemoteSession(m, a => this.act(a));
        break;
      case 'list':
        this.games = m.games;
        break;
      case 'error':
        if (this.session) { this.session.flash(m.message); return; }
        // couldn't get into a game (gone, full, started without us): off it, and drop it from the list
        if (!this.lobby && this.gameId) {
          if (m.message === 'no such game' || m.message === 'not a player in this game') this.forget(this.gameId);
          this.gameId = null;
        }
        this.error = m.message;
        break;
    }
    this.changed();
  }

  // ---------- what the screens ask for ----------
  refresh() { this.send({ type: 'list', games: this.saved() }); }

  create(perTeam: number, title: string) {
    this.error = null;
    this.send({ type: 'create', name: this.name, perTeam, title });
  }

  /** Open a game: straight in if this phone holds it, else join it (a free seat) with our name. */
  open(gameId: string) {
    this.gameId = gameId; this.lobby = null; this.session = null; this.error = null;
    const token = this.tokenFor(gameId);
    if (token) { this.send({ type: 'hello', gameId, token }); history.replaceState(null, '', `?g=${gameId}`); }
    else this.send({ type: 'join', gameId, name: this.name });
    this.changed();
  }

  pick(p: { archetype?: string; seat?: number }) {
    const token = this.gameId && this.tokenFor(this.gameId);
    if (token) this.send({ type: 'pick', gameId: this.gameId!, token, ...p });
  }

  start() {
    const token = this.gameId && this.tokenFor(this.gameId);
    if (token) this.send({ type: 'start', gameId: this.gameId!, token });
  }

  private act(action: Action): boolean {
    const token = this.gameId && this.tokenFor(this.gameId);
    return !!token && this.send({ type: 'act', gameId: this.gameId!, token, action });
  }

  home() {
    this.gameId = null; this.lobby = null; this.session = null;
    history.replaceState(null, '', location.pathname);
    this.refresh();
    this.changed();
  }
}
