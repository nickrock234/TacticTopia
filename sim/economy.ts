// Layer 2: economy curves. One player's income over 30 turns, for a few hero
// activity profiles (what the hero does on the map) and build orders (what the
// base buys). No map yet, so activities are hand-written schedules.
//
// Run:  node sim/economy.ts   → writes sim/reports/economy.md
//
// Questions:
//   1. When does each combat "stage" (30 / 60 / 100 / 160 / 260 XP) actually arrive?
//   2. Does the design hit its pacing target (~300 XP by turn 30, capstones ~turn 20-24)?
//   3. Can a fragile hero afford shield + Stoneskin before a Double strike / Double dagger
//      diver (85 XP) shows up?
//   4. Where does income come from, and does "growth funds growth" hold?

import { writeFileSync, mkdirSync } from 'node:fs';
import { BUILDING, ECON, NPC, QUESTS } from '../engine/economy.ts';
import { Report } from './lib.ts';
import { XP_COST } from '../engine/numbers.ts';

type NpcKind = 'weak' | 'medium' | 'lair';
type LandmarkKind = 'element' | 'element+merchant' | 'element+lair' | 'mine' | 'fountain';

interface Profile {
  id: string;
  desc: string;
  kills: Record<number, NpcKind>;
  claims: Record<number, LandmarkKind>; // landmark income starts the turn after
  explorerTurn?: number;
}

function every(start: number, step: number, until: number, kinds: NpcKind[]): Record<number, NpcKind> {
  const out: Record<number, NpcKind> = {};
  let i = 0;
  for (let t = start; t <= until; t += step) out[t] = kinds[i++ % kinds.length];
  return out;
}

export const PROFILES: Profile[] = [
  {
    id: 'Farmer',
    desc: 'Hunts NPC camps near home: a kill every 2 turns (weak, weak, medium), claims a lair on turn 10 and kills its boss on turn 14, one element landmark on turn 18.',
    kills: { ...every(1, 2, 29, ['weak', 'weak', 'medium']), 14: 'lair' },
    claims: { 10: 'element+lair', 18: 'element' },
  },
  {
    id: 'Balanced',
    desc: 'Kills on turns 1, 3 and 6, then every 3 turns; claims landmarks on turns 5 (element + merchant), 9 (element), 14 (gold mine), 20 (element). Explorer quest on turn 18.',
    kills: { 1: 'weak', 3: 'weak', 6: 'medium', ...every(9, 3, 30, ['weak', 'medium']) },
    claims: { 5: 'element+merchant', 9: 'element', 14: 'mine', 20: 'element' },
    explorerTurn: 18,
  },
  {
    id: 'Claimer',
    desc: 'Races for landmarks: claims on turns 3, 6 (element + merchant), 9 (gold mine), 12, 16 (element + lair); kills on turn 1, then every 6 turns. Explorer quest on turn 15.',
    kills: { 1: 'weak', ...every(7, 6, 30, ['weak', 'medium']) },
    claims: { 3: 'element', 6: 'element+merchant', 9: 'mine', 12: 'element', 16: 'element+lair' },
    explorerTurn: 15,
  },
];

// Gold build orders. 'shield' = buy a shield: 7 at an owned merchant, else crafted
// for 10 once the Armory exists (the order must include forge + armory for that).
export const ORDERS: Record<string, string[]> = {
  'XP first': ['library', 'dummy', 'market', 'sparring', 'forge', 'monastery', 'trade2', 'shrine', 'stables', 'armory', 'arena', 'trade3', 'refinery', 'apothecary', 'territory2', 'temple', 'territory3'],
  'Gold first': ['market', 'forge', 'trade2', 'library', 'dummy', 'trade3', 'sparring', 'monastery', 'armory', 'arena', 'refinery', 'shrine', 'stables', 'territory2', 'apothecary', 'temple', 'territory3'],
  'Balanced': ['dummy', 'library', 'forge', 'market', 'sparring', 'trade2', 'monastery', 'armory', 'shrine', 'stables', 'arena', 'trade3', 'refinery', 'territory2', 'apothecary', 'temple', 'territory3'],
  'Shield first': ['forge', 'shield', 'library', 'dummy', 'market', 'sparring', 'trade2', 'armory', 'monastery', 'arena', 'trade3', 'refinery', 'shrine', 'stables', 'territory2', 'apothecary', 'temple', 'territory3'],
};

// XP is spent on skills in this cost sequence (a typical build: cheap nodes first,
// capstones later). Scholar makes the skill after the 5th cost half.
const { classNode1: n1, classNode2: n2, capstone: cap3, hybrid: hy } = XP_COST;
const SKILL_COSTS = [n1, n1, n2, n2, n1, n2, cap3, n2, hy, n1, n2, cap3, n2, n1, n2, cap3];

interface Run {
  xpByTurn: number[];   // cumulative XP earned, index = turn
  goldByTurn: number[]; // cumulative gold earned
  bought: { turn: number; id: string }[];
  shieldTurn: number | null;
  income15: Record<string, { xp: number; gold: number }>;
  skillsByTurn: number[];
}

export function simulate(p: Profile, order: string[], opts: { archer?: boolean } = {}): Run {
  let gold = 0, xpTotal = 0, goldTotal = 0, xpBank = 0;
  const owned = new Set<string>(opts.archer ? ['dummy'] : []);
  const landmarks: LandmarkKind[] = [];
  let kills = 0, treasurer = false, builderDone = false, skillIdx = 0, skillsBought = 0;
  let queue = order.filter(id => !owned.has(id));
  let shieldTurn: number | null = null;
  const run: Run = { xpByTurn: [0], goldByTurn: [0], bought: [], shieldTurn: null, income15: {}, skillsByTurn: [0] };
  const disc = () => (owned.has('trade3') ? 1 - ECON.tradeDiscount : 1);
  const price = (c: number) => Math.ceil(c * disc());

  for (let t = 1; t <= 30; t++) {
    // --- income at the start of the turn ---
    const src: Record<string, { xp: number; gold: number }> = {
      base: { xp: ECON.baseXp, gold: ECON.baseGold },
      buildings: { xp: 0, gold: 0 },
      landmarks: { xp: landmarks.length * ECON.landmarkXp, gold: landmarks.filter(l => l === 'mine').length * ECON.goldMineGold + (owned.has('territory2') ? landmarks.length * ECON.territory2PerLandmarkGold : 0) },
      quests: { xp: builderDone ? QUESTS.builder.xpPerTurn : 0, gold: treasurer ? QUESTS.treasurer.goldPerTurn : 0 },
      npcs: { xp: 0, gold: 0 },
    };
    for (const id of owned) { src.buildings.xp += BUILDING[id].xp; src.buildings.gold += BUILDING[id].gold; }

    // --- the hero's activity this turn ---
    const k = p.kills[t];
    if (k) {
      const r = NPC[k];
      const mult = owned.has('arena') ? 1 + ECON.arenaBonus : 1;
      kills++;
      src.npcs.xp += Math.floor(r.xp * mult);
      src.npcs.gold += Math.floor(r.gold * mult) + (kills > QUESTS.hunter.kills ? QUESTS.hunter.goldPerKill : 0);
    }
    if (p.explorerTurn === t) src.quests.xp += QUESTS.explorer.xp;
    if (p.claims[t]) landmarks.push(p.claims[t]);

    let dxp = 0, dgold = 0;
    for (const s of Object.values(src)) { dxp += s.xp; dgold += s.gold; }
    if (t === 15) run.income15 = src;
    gold += dgold; goldTotal += dgold; xpTotal += dxp; xpBank += dxp;
    if (gold >= QUESTS.treasurer.hold) treasurer = true;

    // --- spend gold down the build order ---
    let progress = true;
    while (progress && queue.length) {
      progress = false;
      const next = queue[0];
      if (next === 'shield') {
        const merchant = landmarks.some(l => l.includes('merchant'));
        const cost = merchant ? ECON.items.merchant : owned.has('armory') ? ECON.items.crafted : null;
        if (cost === null) {
          // No way to get a shield yet: skip ahead, keep the shield first in line.
          const i = queue.findIndex(id => id !== 'shield' && (!BUILDING[id].requires || owned.has(BUILDING[id].requires!)));
          const alt = queue[i];
          if (alt && (alt === 'armory' || !queue.includes('armory') || owned.has('forge')) && gold >= price(BUILDING[alt].cost)) {
            gold -= price(BUILDING[alt].cost); owned.add(alt); run.bought.push({ turn: t, id: alt });
            queue.splice(i, 1); progress = true;
          }
          continue;
        }
        if (gold >= price(cost)) { gold -= price(cost); shieldTurn = t; run.bought.push({ turn: t, id: 'shield' }); queue.shift(); progress = true; }
        continue;
      }
      const b = BUILDING[next];
      if (b.requires && !owned.has(b.requires)) { queue.push(queue.shift()!); continue; }
      if (gold >= price(b.cost)) {
        gold -= price(b.cost); owned.add(next); run.bought.push({ turn: t, id: next });
        queue.shift(); progress = true;
      }
    }
    if (!builderDone && owned.size >= QUESTS.builder.buildings) builderDone = true;

    // --- spend XP on skills ---
    while (skillIdx < SKILL_COSTS.length) {
      let c = SKILL_COSTS[skillIdx];
      if (skillsBought === QUESTS.scholar.skills) c = Math.ceil(c / 2);
      if (xpBank < c) break;
      xpBank -= c; skillIdx++; skillsBought++;
    }
    run.xpByTurn.push(xpTotal);
    run.goldByTurn.push(goldTotal);
    run.skillsByTurn.push(skillsBought);
  }
  run.shieldTurn = shieldTurn;
  return run;
}

const firstTurn = (arr: number[], v: number) => { const i = arr.findIndex(x => x >= v); return i < 0 ? '—' : `${i}`; };

// ---------------------------------------------------------------------

if (import.meta.main) {
const R = new Report();
const say = R.say;
say('# Layer 2 — Economy curves');
say();
say(`Generated ${new Date().toISOString().slice(0, 10)} from \`engine/economy.ts\`. One player, 30 turns, no fights and no deaths (so these are upper bounds on income). The map isn't simulated yet, so what the hero does each turn is a hand-written schedule.`);
say();
say('**Hero activity profiles:**');
say();
PROFILES.forEach(p => say(`- **${p.id}:** ${p.desc}`));
say();
say('**Build orders** (gold is spent down the list as soon as the next item is affordable):');
say();
Object.entries(ORDERS).forEach(([k, v]) => say(`- **${k}:** ${v.map(id => (id === 'shield' ? 'SHIELD' : BUILDING[id].name)).join(' → ')}`));
say();
say('Assumptions marked as guesses in `engine/economy.ts`: base gold 2/turn, gold mine +3 gold/turn, Territory tier 2 = +1 gold per landmark, Library 3 XP total (not 3 + 1). Mana fountain is left out because its bonus ("reduces upgrade costs") has no number yet.');
say();

const runs: { p: Profile; order: string; r: Run }[] = [];
for (const p of PROFILES) for (const order of Object.keys(ORDERS)) runs.push({ p, order, r: simulate(p, ORDERS[order]) });

say('## 1. Total XP earned by turn');
say();
R.table(['Profile', 'Build order', 'T5', 'T10', 'T15', 'T20', 'T25', 'T30', 'Gold earned by T30', 'Buildings by T30'],
  runs.map(({ p, order, r }) => [p.id, order, ...[5, 10, 15, 20, 25, 30].map(t => r.xpByTurn[t]), r.goldByTurn[30], r.bought.filter(b => b.id !== 'shield').length]));

say('## 2. When do the combat stages arrive?');
say();
say('Turn on which total XP earned first reaches each combat-stage budget from `combat-matrix.md`. 120 XP = a barbarian with Double strike + Flaming weapon, or a thief with Double dagger + Flaming weapon: the first one-shot threats to fragile heroes. The design doc pacing target (its "two elements, a hybrid, the first two nodes of both lines and a capstone" build around turns 20–24) is the 390 XP Endgame budget at current costs.');
say();
R.table(['Profile', 'Build order', '45 (Early)', '90 (Early-mid)', '120 (dive threat)', '150 (Mid)', '240 (Late)', '390 (Endgame)', '450'],
  runs.map(({ p, order, r }) => [p.id, order, ...[45, 90, 120, 150, 240, 390, 450].map(v => firstTurn(r.xpByTurn, v))]));

say('## 3. Defense race in turns');
say();
say('A fragile hero on the **Shield first** build order, with Stoneskin as their first skill (15 XP), against a diver on the same activity profile with the **XP first** order (the fastest way to 120 XP). "Protected" = has a shield and Stoneskin. The shield comes from a merchant landmark (7 gold) if the profile has claimed one, else it is crafted at the Armory (10 gold).');
say();
R.table(['Profile', 'Diver reaches 120 XP', 'Fragile hero has a shield', 'Has Stoneskin (15 XP)', 'Protected by turn', 'Margin'],
  PROFILES.map(p => {
    const diver = simulate(p, ORDERS['XP first']);
    const fragile = simulate(p, ORDERS['Shield first']);
    const threat = diver.xpByTurn.findIndex(x => x >= 120);
    const skin = fragile.xpByTurn.findIndex(x => x >= XP_COST.elementPassive);
    const prot = fragile.shieldTurn === null ? null : Math.max(fragile.shieldTurn, skin);
    return [p.id, `${threat}`, fragile.shieldTurn === null ? 'never' : `${fragile.shieldTurn}`, `${skin}`, prot === null ? 'never' : `${prot}`,
      prot === null ? '—' : `${threat - prot} turns ahead`];
  }));

say('## 4. Where the income comes from (turn 15)');
say();
for (const order of ['Balanced', 'XP first']) {
  say(`### ${order} build order`);
  say();
  R.table(['Profile', ...['base', 'buildings', 'landmarks', 'npcs', 'quests'].map(s => `${s} XP / gold`)],
    PROFILES.map(p => {
      const r = simulate(p, ORDERS[order]);
      return [p.id, ...['base', 'buildings', 'landmarks', 'npcs', 'quests'].map(s => `${r.income15[s].xp} / ${r.income15[s].gold}`)];
    }));
}

say('## 5. Build timelines (Balanced profile)');
say();
for (const order of Object.keys(ORDERS)) {
  const r = simulate(PROFILES[1], ORDERS[order]);
  say(`- **${order}:** ` + r.bought.map(b => `T${b.turn} ${b.id === 'shield' ? 'SHIELD' : BUILDING[b.id].name}`).join(', '));
}
say();

mkdirSync(new URL('./reports/', import.meta.url), { recursive: true });
writeFileSync(new URL('./reports/economy.md', import.meta.url), R.lines.join('\n'));
console.log(`wrote sim/reports/economy.md (${R.lines.length} lines)`);
}
