// Full game state, and building a new game from a generated map.
//
// Round = every hero acts once, in a fixed alternating order (team A, team B,
// team A, ...). "Turn" in the rules means one hero's turn within a round.

import { HERO_STATS, STARTING_WEAPON, MANA, WEAPONS, type ClassId, type Element, type WeaponId } from './numbers.ts';
import type { GameMap, Pos, Terrain } from './mapgen.ts';
import { walkField } from './mapgen.ts';

export type StatusKind =
  | 'empower' | 'inspire' | 'marked' | 'huntBoost' | 'shattered' | 'chill' | 'pinned'
  | 'paralysis' | 'poison' | 'iceBlock' | 'fortify' | 'ward' | 'invisible';

export interface Status {
  kind: StatusKind;
  turns: number;        // counts down at the start of `clock`'s turn
  clock: number;        // hero id whose turn start ticks this down
  source: number;       // hero id that applied it
  amount?: number;
}

export interface Hero {
  id: number;
  player: number;
  team: number;
  cls: ClassId;
  archetype: string;
  element: Element;          // chosen before the game
  pos: Pos | null;           // null while dead
  hp: number;
  mana: number;
  weapon: WeaponId;
  weaponUpgraded: boolean;   // Blacksmith upgrade
  shield: 0 | 1 | 2;         // 0 none, 1 shield, 2 upgraded shield
  boots: null | 'plain' | Terrain; // boots, optionally upgraded to walk on a terrain
  inventory: { item: string; upgraded: boolean; terrain?: Terrain }[]; // spare gear (terrain: upgraded boots taken off)
  skills: Set<string>;
  statuses: Status[];
  deaths: number;
  respawnIn: number;         // rounds until respawn while dead
  eliminated: boolean;       // out of the game (death limit reached)
  elimDeaths: number;        // deaths that count toward elimination
  deathPos: Pos | null;      // for Resurrection (the body stays until respawn)
  diedAtTurn: number;        // g.turnCounter when the hero died
  surgeCd: number;
  // per-turn scratch
  actionsLeft: number;
  attacked: boolean;
  straightRun: number;       // tiles moved in a straight line this turn (Charge)
  startedOnRoad: boolean;
  engagedPaid: boolean;      // the engaged move penalty applies at most once per turn
  moved: boolean;
  rested: boolean;
}

/** One line of the start-of-turn income summary: where some gold and/or XP came from. */
export interface IncomeLine { label: string; xp: number; gold: number }

export interface Player {
  id: number;
  team: number;
  gold: number;
  xp: number;
  xpEarned: number;
  goldEarned: number;
  buildings: Set<string>;
  quests: Set<string>;
  npcKills: number;
  heroKills: number;
  skillsBought: number;
  scholarReady: boolean;
  stolenNext: number;        // gold stolen from this player's next income
  /** What the last start-of-turn income was made of (for the app's summary popup); `turn` = g.turnCounter then. Absent in old saves. */
  report?: { turn: number; lines: IncomeLine[] };
  /** Gold earned between turns (raiding a base), shown on the next summary. */
  carry?: IncomeLine[];
}

export interface LandmarkState {
  idx: number;
  owner: number | null;          // player id
  pending: { player: number; hero: number; decoy: Pos | null } | null; // decoy = thief's Body double (1 HP)
  road: number[];                // tile indices
  bossHp: number;                // lair boss
  bossRespawn: number;           // round when it comes back (0 = alive)
  chestAvailable: boolean;
}

export interface CampState { idx: number; hp: number; respawn: number } // respawn round, 0 = alive

export interface Zone { tiles: number[]; team: number; caster: number; damage: number } // Firewall

export interface GameLog { round: number; text: string }

export interface GameState {
  map: GameMap;
  round: number;
  order: number[];           // hero ids in turn order
  heroes: Hero[];
  players: Player[];
  landmarks: LandmarkState[];
  camps: CampState[];
  fog: Uint8Array[];         // per team: 1 = revealed
  zones: Zone[];
  winner: number | null;
  firstContactRound: number | null;
  log: GameLog[];
  /** What just happened, for the app to animate (the rules never read it). */
  events: GameEvent[];
  stats: {
    heroDamage: number[];    // per hero: damage dealt to enemy heroes
    healing: number[];       // per hero
    npcDamage: number[];
    kills: number[];
    deaths: number[];
    damageTaken: number[];
    deathsAtCap: number;     // deaths suffered while the respawn wait was already at its maximum
    deathsTotal: number;
  };
  fields: Map<string, Int16Array>; // cached walk fields
  eliminationDeaths: number;       // deaths that knock a player out (0 = never)
  turnCounter: number;             // hero turns taken so far (all heroes)
}

export interface HeroSetup { cls: ClassId; archetype: string; element: Element }

export function newGame(map: GameMap, setups: HeroSetup[]): GameState {
  // setups[i] belongs to map.bases[i]
  const heroes: Hero[] = map.bases.map((b, i) => {
    const s = setups[i];
    const weapon = STARTING_WEAPON[s.cls];
    const maxMana = HERO_STATS[s.cls].mana + (WEAPONS[weapon].bonusMana ?? 0);
    return {
      id: i, player: i, team: b.team, cls: s.cls, archetype: s.archetype, element: s.element,
      pos: { x: b.x, y: b.y }, hp: HERO_STATS[s.cls].hp, mana: maxMana,
      // Knight perk (Nick, 2026-09-30): starts with a shield; everyone else buys one.
      weapon, weaponUpgraded: false, shield: s.cls === 'knight' ? 1 : 0, boots: null, inventory: [],
      skills: new Set(), statuses: [], deaths: 0, respawnIn: 0, eliminated: false, elimDeaths: 0, deathPos: null, diedAtTurn: 0, surgeCd: 0,
      actionsLeft: 0, attacked: false, straightRun: 0, startedOnRoad: false, engagedPaid: false, moved: false, rested: false,
    };
  });
  const players: Player[] = map.bases.map((b, i) => ({
    id: i, team: b.team, gold: 0, xp: 0, xpEarned: 0, goldEarned: 0,
    buildings: new Set(setups[i].cls === 'archer' ? ['dummy'] : []),
    quests: new Set(), npcKills: 0, heroKills: 0, skillsBought: 0, scholarReady: false, stolenNext: 0,
  }));
  // Turn order alternates teams: A1, B1, A2, B2, ...
  const teams = [0, 1].map(t => heroes.filter(h => h.team === t).map(h => h.id));
  const order: number[] = [];
  for (let i = 0; i < Math.max(teams[0].length, teams[1].length); i++) {
    if (teams[0][i] !== undefined) order.push(teams[0][i]);
    if (teams[1][i] !== undefined) order.push(teams[1][i]);
  }
  const n = map.w * map.h;
  const fog = [new Uint8Array(n), new Uint8Array(n)];
  const g: GameState = {
    map, round: 1, order, heroes, players,
    landmarks: map.landmarks.map((l, idx) => ({ idx, owner: null, pending: null, road: [], bossHp: l.bonus === 'lair' ? 25 : 0, bossRespawn: 0, chestAvailable: true })),
    camps: map.camps.map((c, idx) => ({ idx, hp: c.kind === 'weak' ? 5 : 10, respawn: 0 })),
    fog, zones: [], winner: null, firstContactRound: null, log: [], events: [],
    stats: { heroDamage: heroes.map(() => 0), healing: heroes.map(() => 0), npcDamage: heroes.map(() => 0), kills: heroes.map(() => 0), deaths: heroes.map(() => 0), damageTaken: heroes.map(() => 0), deathsAtCap: 0, deathsTotal: 0 },
    fields: new Map(),
    eliminationDeaths: 0,
    turnCounter: 0,
  };
  for (const h of heroes) reveal(g, h.team, h.pos!, HERO_STATS[h.cls].vision);
  return g;
}

export const idx = (g: GameState, p: Pos) => p.y * g.map.w + p.x;
export const posOf = (g: GameState, i: number): Pos => ({ x: i % g.map.w, y: (i / g.map.w) | 0 });

export function reveal(g: GameState, team: number, p: Pos, r: number) {
  for (let y = Math.max(0, p.y - r); y <= Math.min(g.map.h - 1, p.y + r); y++)
    for (let x = Math.max(0, p.x - r); x <= Math.min(g.map.w - 1, p.x + r); x++) g.fog[team][y * g.map.w + x] = 1;
}

/** Cached plains-only walking distances from a tile (for bots' long-range planning). */
export function field(g: GameState, p: Pos): Int16Array {
  const key = `${p.x},${p.y}`;
  let f = g.fields.get(key);
  if (!f) { f = walkField(g.map, p); g.fields.set(key, f); }
  return f;
}

export const maxHp = (g: GameState, h: Hero) => HERO_STATS[h.cls].hp + (g.players[h.player].quests.has('conqueror') ? 2 : 0);
export function maxManaOf(g: GameState, h: Hero): number {
  let m = HERO_STATS[h.cls].mana;
  if (h.weapon === 'staff') m += (WEAPONS.staff.bonusMana ?? 0) + (h.weaponUpgraded ? 1 : 0);
  if (g.players[h.player].buildings.has('temple')) m += MANA.templeMaxMana;
  return m;
}
export const hasStatus = (h: Hero, k: StatusKind) => h.statuses.some(s => s.kind === k);
export const statusAmount = (h: Hero, k: StatusKind) => h.statuses.filter(s => s.kind === k).reduce((a, s) => a + (s.amount ?? 1), 0);

export function log(g: GameState, text: string) { g.log.push({ round: g.round, text }); }

/** Events for the app's animations: recorded by the rules, never read by them. */
export type GameEvent =
  | { t: 'attack'; hero: number; opt: string; from: Pos; targets: Pos[]; fromInvis: boolean } // opt: AttackOpt
  | { t: 'hit'; pos: Pos; kind: 'block' | 'chip' }                                  // a weapon hit reduced by defences
  | { t: 'cast'; hero: number; spell: string; from: Pos; at?: Pos; tiles?: Pos[] }  // spell: Spell; tiles for Firewall / Tidal wave
  | { t: 'counter'; hero: number; target: Pos }                                     // Counterattack by `hero`
  | { t: 'burn'; hero: number }                                                     // Burning aura hurt this attacker
  | { t: 'coin'; pos: Pos }                                                         // gold taken (Pickpocket)
  | { t: 'npcAttack'; npc: Pos; target: Pos }                                       // a monster struck back
  | { t: 'surge'; hero: number }                                                    // Mana surge
  | { t: 'respawn'; hero: number; pos: Pos }
  | { t: 'reveal'; hero: number; by: number };                                      // an invisible thief bumped into
