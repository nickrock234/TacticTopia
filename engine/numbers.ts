// Every tunable number in the game, in one place.
// 2026-09-30: every class's movement cut by 1 (map simulation: contact came too fast).
//
// Note on `vision`: fog is Polytopia-style. Once a tile is revealed it stays
// revealed for the whole team, and enemies on revealed tiles are visible. So
// vision radius only sets how fast a hero explores; it never limits attack range.
//
// Tags:  [C] confirmed by Nick   [G] guess, to be tuned by simulation
// Sources: design doc "Starting numbers", Skills by Class.md (rulings ✎),
// Combat Rules.md. When a sim changes a number, change it HERE only.

export type ClassId = 'knight' | 'barbarian' | 'archer' | 'mage' | 'thief';
export type Element = 'fire' | 'water' | 'earth';

export const CLASSES: ClassId[] = ['knight', 'barbarian', 'archer', 'mage', 'thief'];

// Movement [C] 2026-10-01: +1 for every class again (was cut by 1 on 2026-09-30), with maps 28/36/42.
export const HERO_STATS: Record<ClassId, { hp: number; move: number; mana: number; vision: number }> = {
  knight:    { hp: 22, move: 3, mana: 3, vision: 3 }, // move [C] 3
  barbarian: { hp: 14, move: 4, mana: 3, vision: 3 }, // move [C] 4; HP [C] 14 (was 20, then 16), 2026-09-30: glass cannon
  archer:    { hp: 16, move: 4, mana: 3, vision: 3 }, // move [C] 4
  mage:      { hp: 15, move: 3, mana: 6, vision: 3 }, // move [C] 3; mana [C] 6 (was 8): Staff makes 8 = Teleport exactly
  thief:     { hp: 15, move: 5, mana: 4, vision: 4 }, // move [C] 5; vision [C] 4 (was 3): the fog line caps exploring at vision per move
};

/** Map side by team size [C] 2026-10-01 (was 24/32/36): grown with the +1 movement (sim r13c). */
export const MAP_SIZE: Record<number, number> = { 2: 28, 3: 36, 4: 42 };

export const RESPAWN = {
  // [C] 2026-09-30: 'oneRound' = the body stays and the hero respawns on their first turn
  // after one full round of play since the death (every death the same). 'escalating' =
  // the old rule: wait +perDeath rounds per death, capped at max.
  mode: 'oneRound' as 'oneRound' | 'escalating',
  perDeath: 1,
  max: 3,
};

export const ELIMINATION = {
  deathsUpTo3v3: 2,  // [C] 2026-09-30 (testing): a player is out on their 2nd death in 2v2/3v3
  deaths4v4: 2,      // [C] ... and in 4v4 too (was 3rd death), 2026-09-30
  enabled: true,
  resurrectionErases: false, // testing: a death undone by Resurrection doesn't count toward elimination
};
export const ENGAGED = {
  movePenalty: 2,   // [C] 2026-09-30: a move action that starts next to an enemy hero moves 2 less
};
export const TURN_LIMIT = 40; // [C] at the limit, the team with the most kills wins

export const MANA = {
  regenPerTurn: 1,  // [C] passive, every hero. Fallback variant to test: 0
  restAmount: 3,    // [G] resting costs an action
  restWithAttack: true, // [C] 2026-09-30 (Nick, later): rest and attack can share a turn, in either order
  restHeal: 2,      // [C] resting also heals a little (amount [G]); the knight stays the big healer
  deepRestBonus: 2, // [G]
  shrineRegen: 1,   // [C] Faith tier 1
  templeMaxMana: 2, // [C] Faith tier 3
};

export type WeaponId =
  | 'sword' | 'flail' | 'greataxe' | 'spear' | 'bow' | 'crossbow'
  | 'staff' | 'orb' | 'dagger' | 'knives';

export interface Weapon {
  id: WeaponId;
  owner: ClassId;
  damage: number;
  hits: number;        // crossbow fires 2 arrows
  range: number;       // 1 = melee (adjacent, diagonals count)
  twoHanded: boolean;  // can't hold a shield
  allAdjacent?: boolean; // flail
  bonusMana?: number;  // staff
  spellRange?: number; // orb
}

// All weapon numbers [C]. Two-handed only where the doc says so.
export const WEAPONS: Record<WeaponId, Weapon> = {
  sword:    { id: 'sword',    owner: 'knight',    damage: 5, hits: 1, range: 1, twoHanded: false },
  flail:    { id: 'flail',    owner: 'knight',    damage: 4, hits: 1, range: 1, twoHanded: false, allAdjacent: true },
  greataxe: { id: 'greataxe', owner: 'barbarian', damage: 7, hits: 1, range: 1, twoHanded: true },
  spear:    { id: 'spear',    owner: 'barbarian', damage: 5, hits: 1, range: 2, twoHanded: true },
  bow:      { id: 'bow',      owner: 'archer',    damage: 3, hits: 1, range: 4, twoHanded: false }, // range 4: a barbarian (move 4 + 1) can reach the archer for one turn, then can't catch up (Nick, 2026-10-01)
  crossbow: { id: 'crossbow', owner: 'archer',    damage: 3, hits: 2, range: 3, twoHanded: false },
  staff:    { id: 'staff',    owner: 'mage',      damage: 2, hits: 1, range: 1, twoHanded: false, bonusMana: 2 },
  orb:      { id: 'orb',      owner: 'mage',      damage: 1, hits: 1, range: 1, twoHanded: false, spellRange: 1 },
  dagger:   { id: 'dagger',   owner: 'thief',     damage: 4, hits: 1, range: 1, twoHanded: false },
  knives:   { id: 'knives',   owner: 'thief',     damage: 3, hits: 1, range: 2, twoHanded: false },
};

export const STARTING_WEAPON: Record<ClassId, WeaponId> = {
  knight: 'sword', barbarian: 'greataxe', archer: 'bow', mage: 'staff', thief: 'dagger',
};

export const GEAR = {
  shieldBlock: 1,         // [G]
  shieldUpgradedBlock: 2, // [G]
  blacksmithDamage: 1,    // [C] mage weapons: trait +1 instead
  refineryBonus: 1,       // [C] weapons and shields +1
};

// XP costs [C] 2026-09-30: raised ~1.5x so the economy lands the doc's pacing
// (was 10 / 20 / 45, hybrids 35).
export const XP_COST = {
  elementPassive: 15,
  elementSpell: 30,
  hybrid: 60,
  classNode1: 15,
  classNode2: 30,
  capstone: 60,
};

export const COMBAT = {
  minDamagePerHit: 1,  // [C]
  terrainReduction: 1, // [C]
};

// Damage-relevant skill numbers. Mana costs and effects per Skills by Class.md.
export const SKILL = {
  mageBolt:     { mana: 2, range: 3, damage: 5 },        // [C] mage starting spell
  holyStrike:   { mana: 2, bonus: 2, healOnHit: 1 },     // [C] ✎
  heavyStrike:  { mana: 2, bonus: 3 },                   // [C] ✎
  charge:       { mana: 2, perTile: 1, max: 3 },         // [G]
  smite:        { mana: 3, damage: 6 },                  // [G] cross 2
  selfHeal:     { mana: 2, heal: 4 },                    // [G]
  crossHeal:    { mana: 3, heal: 3 },                    // [G]
  resurrection: { mana: 3, range: 4 },                   // [C] ✎ range 4 (was 2), 2026-09-30
  doubleStrike: { mana: 2 },                             // [G]
  vengeance:    { bonus: 2, threshold: 0.75 },           // [C] +2 (was +3) at or below 75% HP, 2026-09-30
  intimidate:   { reduction: 1 },                        // [G]
  inspire:      { mana: 3, bonus: 2, turns: 2 },         // [G]
  pinningShot:  { mana: 2 },                             // [G]
  arrowRain:    { mana: 3 },                             // [G]
  huntersMark:  { mana: 3, bonus: 2, turns: 2 },         // [G] free action ✎
  empower:      { mana: 2, attack: 1, block: 1, turns: 2 }, // [C] +1/+1
  cleanse:      { mana: 2 },                             // [G]
  teleport:     { mana: 8 },                             // [C] ✎
  manaSurge:    { amount: 3, every: 3 },                 // [C] every 3 turns (was 2), 2026-09-30
  invisibility: { mana: 2, turns: 2, noEnemyWithin: 2 }, // [G] ✎
  ambush:       { bonus: 3 },                            // [G]
  fireball:     { mana: 3, range: 3, damage: 3 },        // [C]
  firewall:     { mana: 3, range: 3, damage: 2 },        // [C] ✎ ticks: end of caster turn + enter/start
  tidalWave:    { mana: 3, damage: 2, push: 2 },         // [G]
  quake:        { mana: 3, damage: [5, 3, 1] },          // [C]
  iceBlock:     { mana: 2 },                             // [G]
  fortify:      { mana: 3 },                             // [G]
  stoneskin:    { block: 1 },                            // [C]
  flaming:      { bonus: 1 },                            // [C]
  burningAura:  { damage: 1 },                           // [C]
  lightning:    { mana: 3, range: 3, damage: 3 },        // [G] + paralysis
  poison:       { mana: 3, range: 3, damage: 1, perTurn: 2 }, // [G]
  nature:       { mana: 3, range: 3, damage: 4 },        // [G] heal half, round up
  monastery:    { spellBonus: 2 },                       // [C] +2 (was +1), 2026-09-30
};
