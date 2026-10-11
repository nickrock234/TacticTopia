// Home-base buildings, landmarks, NPC rewards and quests: the income side of the game.
// Tags as in numbers.ts: [C] confirmed, [G] guess.
//
// Building effects are GLOBAL: they apply wherever the hero is (e.g. Apothecary
// heals +1 HP per turn anywhere, Shrine gives +1 mana anywhere).

export interface Building {
  id: string;
  name: string;
  branch: string;
  tier: 1 | 2 | 3;
  cost: number;            // gold
  xp: number;              // XP per turn (every building gives at least 1 [C])
  gold: number;            // gold per turn
  requires?: string;       // previous tier
  note?: string;
}

// Tier costs [C] 2026-09-30: 12 / 24 / 48 (was 8 / 16 / 32). Market 9 (was 6).
// Training dummy 6 [C] 2026-10-01 (was 2): base income + the turn-one NPC's 4 gold, so a hero who
// kills that NPC on turn one can buy it then; the thief, who can't, has to wait.
// XP buildings' "+1 XP" is their main output, not on top (Library = 3 XP total) [G].
export const BUILDINGS: Building[] = [
  { id: 'forge', name: 'Forge', branch: 'Smithing', tier: 1, cost: 12, xp: 1, gold: 3, note: 'enables Blacksmith upgrades' }, // +3g +1xp (Nick, 2026-10-03: every gold building +1; was +2)
  { id: 'armory', name: 'Armory', branch: 'Smithing', tier: 2, cost: 24, xp: 1, gold: 0, requires: 'forge', note: 'crafting' },
  { id: 'refinery', name: 'Refinery', branch: 'Smithing', tier: 3, cost: 48, xp: 1, gold: 0, requires: 'armory', note: 'weapons and shields +1' },
  { id: 'library', name: 'Library', branch: 'Learning', tier: 1, cost: 12, xp: 3, gold: 0 },                              // [C] +3 XP
  { id: 'monastery', name: 'Monastery', branch: 'Learning', tier: 2, cost: 24, xp: 1, gold: 0, requires: 'library', note: 'spells +2' },
  { id: 'dummy', name: 'Training dummy', branch: 'Training', tier: 1, cost: 6, xp: 1, gold: 0 },                          // [C] +1 XP
  { id: 'sparring', name: 'Sparring ring', branch: 'Training', tier: 2, cost: 24, xp: 2, gold: 0, requires: 'dummy' },   // [C] +2 XP
  { id: 'arena', name: 'Arena', branch: 'Training', tier: 3, cost: 48, xp: 1, gold: 0, requires: 'sparring', note: 'NPC rewards +50%' },
  { id: 'shrine', name: 'Shrine', branch: 'Faith', tier: 1, cost: 12, xp: 1, gold: 0, note: '+1 mana per turn' },
  { id: 'apothecary', name: 'Apothecary', branch: 'Faith', tier: 2, cost: 24, xp: 1, gold: 0, requires: 'shrine', note: '+1 HP per turn' },
  { id: 'temple', name: 'Temple', branch: 'Faith', tier: 3, cost: 48, xp: 1, gold: 0, requires: 'apothecary', note: '+2 max mana' },
  { id: 'market', name: 'Market', branch: 'Trade', tier: 1, cost: 9, xp: 1, gold: 2 },                                   // +2g +1xp (Nick, 2026-10-03: +1 on every gold building; was +1g)
  { id: 'trade2', name: 'Bank', branch: 'Trade', tier: 2, cost: 24, xp: 1, gold: 3, requires: 'market' },       // +3 gold (Nick, 2026-10-03: +1; was +2)
  { id: 'trade3', name: 'Guildhall', branch: 'Trade', tier: 3, cost: 48, xp: 1, gold: 0, requires: 'trade2', note: 'all gold purchases 33% off' },
  { id: 'stables', name: 'Stables', branch: 'Territory', tier: 1, cost: 12, xp: 1, gold: 0, note: '+1 move on roads' },
  { id: 'territory2', name: 'City hall', branch: 'Territory', tier: 2, cost: 24, xp: 1, gold: 0, requires: 'stables', note: '+1 income per landmark' },
  { id: 'territory3', name: 'Fortress', branch: 'Territory', tier: 3, cost: 48, xp: 1, gold: 0, requires: 'territory2', note: '+1 damage and block in territory' },
];
export const BUILDING = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));

export const ECON = {
  baseXp: 3,                 // [C]
  baseGold: 2,               // [G]
  landmarkXp: 2,             // [C] as an example
  territory2PerLandmarkGold: 1, // [G] "+1 income per landmark" read as +1 gold
  goldMineGold: 3,           // [G] undefined in the doc
  tradeDiscount: 1 / 3,      // [C]
  arenaBonus: 0.5,           // [C]
  items: { merchant: 7, crafted: 10, blacksmithUpgrade: 8, boots: 6, bootsUpgrade: 8 }, // [G]
  sellRate: 0.5,             // [C] 2026-09-30: half of (merchant price + upgrade); chest items come upgraded
  bagSize: 5,                // [C] 2026-10-01: spare items a hero can carry (equipped gear doesn't count)
};

export const NPC = {
  weak: { hp: 5, dmg: 2, xp: 2, gold: 4 },     // [G] (5 HP confirmed); gold [C] 4 (was 6)
  medium: { hp: 10, dmg: 3, xp: 5, gold: 6 },  // [G]; gold [C] 6 (was 8)
  lair: { hp: 25, dmg: 5, xp: 10, gold: 15 },  // [G] + a random pre-upgraded item for your team [C]
  respawnTurns: 5,                              // [G] weak + medium camps
  lairRespawnTurns: 8,                          // [C] 2026-09-30
};

export const QUESTS = {
  explorer: { xp: 15 },                       // [C]
  hunter: { kills: 5, goldPerKill: 1 },       // [C]
  builder: { buildings: 5, xpPerTurn: 1 },    // [C]
  treasurer: { hold: 30, goldPerTurn: 2 },    // [C]
  scholar: { skills: 5 },                     // [C] next skill half price
  firstBlood: { gold: 10 },                   // [C]
};
