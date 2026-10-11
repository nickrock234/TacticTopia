// The messages between the app and the game server (types only, so the web app can import them
// without pulling in the server). hub.ts handles them; webapp/src/net/online.ts sends them.

import type { GameState, GameEvent, Hero } from '../../engine/state.ts';
import type { Pos } from '../../engine/mapgen.ts';
import type { Action } from '../../engine/match.ts';

export type ClientMsg =
  | { type: 'create'; name: string; perTeam: number; archetype?: string; title?: string }
  | { type: 'join'; gameId: string; name: string; seat?: number; archetype?: string }
  | { type: 'hello'; gameId: string; token: string }
  | { type: 'pick'; gameId: string; token: string; archetype?: string; seat?: number }
  | { type: 'start'; gameId: string; token: string }
  | { type: 'act'; gameId: string; token: string; action: Action }
  | { type: 'list'; games: { gameId: string; token: string }[] };

export interface LobbySeat { team: number; name: string | null; archetype: string | null; open: boolean }
/** One game on the home screen. turn: whose turn by seat (null in the lobby or once it's over). */
export interface GameSummary { gameId: string; title: string; perTeam: number; started: boolean; over: boolean; round: number; you: number; turn: number | null; turnName: string | null; winner: number | null; team: number }
export type ServerMsg =
  | { type: 'joined'; gameId: string; token: string; seat: number }
  | { type: 'lobby'; gameId: string; title: string; perTeam: number; seats: LobbySeat[]; you: number; host: boolean; hostSeat: number }
  | { type: 'list'; games: GameSummary[] }
  | { type: 'state'; gameId: string; you: number; turnIndex: number; respawnChoice: Pos[] | null; over: boolean; puppet: number | null;
      names: (string | null)[]; view: GameState }
  | { type: 'error'; message: string };

/** An event in a team view, with its place in the game's full event list. */
export type SeqEvent = GameEvent & { seq: number };
/** A hero in a team view: an enemy that team can't see has no position and `hidden` set (not dead). */
export type HeroView = Hero & { hidden?: boolean };
