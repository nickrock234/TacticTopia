// Tuning round 1: follow-ups to Nick's questions on the Layer 1 results.
//
// Run:  node sim/tuning-round1.ts   → writes sim/reports/tuning-round1.md
//
//   1. Kiting: can a ranged hero keep shooting a melee hero without being hit?
//   2. Defense race: what's the cheapest defense that survives each one-turn KO?
//   3. Mana variants: which rule makes the mage (and everyone) face mana choices?
//   4. Barbarian glass cannon: lower HP, earlier Vengeance.

import { writeFileSync, mkdirSync } from 'node:fs';
import { CLASSES, HERO_STATS, MANA, SKILL, WEAPONS, GEAR, type ClassId } from '../engine/numbers.ts';
import { defender, evaluate, maxMana, describe, type Plan, type Stage } from '../engine/attacks.ts';
import type { DefenderState } from '../engine/combat.ts';
import { STAGES, stage, cap, Report, plansFor, bestSolo, sustained } from './lib.ts';

const R = new Report();
const say = R.say;

say('# Tuning round 1');
say();
say(`Generated ${new Date().toISOString().slice(0, 10)} from \`engine/numbers.ts\`, plus the variants named in each section. Stages as in \`combat-matrix.md\` (Start 0 XP … Endgame 260 XP).`);
say();

// =====================================================================
// 1. KITING
// =====================================================================

interface Mover { label: string; move: number; range: number; takeAim?: boolean; chill?: number; chillMana?: number; mana?: number }

function kite(k: Mover, p: Mover, vision: number | null, kiterFirst: boolean, rounds = 8) {
  // One straight line of open plains, no map edge. d = distance (diagonals count).
  let d = kiterFirst ? Math.min(k.range, vision ?? 99) : p.move + p.range + 1;
  let kHits = 0, pHits = 0, slow = 0, mana = k.mana ?? 0, first = true;
  // Pinning costs mana; the kiter pins whenever it can afford to.
  const pin = () => { if (k.chill && mana >= (k.chillMana ?? 0)) { mana -= k.chillMana ?? 0; slow = k.chill; } };
  const kReach = (moved: boolean) => Math.min(k.range + (k.takeAim && !moved ? 1 : 0), vision ?? 99);
  const kiterTurn = () => {
    if (!first) mana = Math.min(k.mana ?? 0, mana + MANA.regenPerTurn);
    first = false;
    if (d <= kReach(false)) {                    // shoot first (Take Aim applies), then back off
      kHits++; pin(); d += k.move;
    } else if (d - k.move <= kReach(true) && kReach(true) > p.move + p.range) {
      d = kReach(true); kHits++; pin(); // step in and shoot, only if safe afterwards
    }
  };
  const pursuerTurn = () => {
    const mv = Math.max(0, p.move - slow); slow = 0;
    if (d - mv <= p.range) { d = Math.max(p.range, d - mv); pHits++; }
    else d = Math.max(1, d - 2 * mv);
  };
  for (let i = 0; i < rounds; i++) {
    if (kiterFirst) { kiterTurn(); pursuerTurn(); } else { pursuerTurn(); kiterTurn(); }
  }
  return { kHits, pHits };
}

const V = HERO_STATS.archer.vision;
const kiters: Mover[] = [
  { label: 'Archer, bow (range 4)', move: HERO_STATS.archer.move, range: WEAPONS.bow.range },
  { label: 'Archer, bow + Take Aim', move: HERO_STATS.archer.move, range: WEAPONS.bow.range, takeAim: true },
  { label: 'Archer, bow + Take Aim + Pinning shot (2 mana each)', move: HERO_STATS.archer.move, range: WEAPONS.bow.range, takeAim: true, chill: 2, chillMana: SKILL.pinningShot.mana, mana: HERO_STATS.archer.mana },
  { label: 'Archer, crossbow (range 3)', move: HERO_STATS.archer.move, range: WEAPONS.crossbow.range },
  { label: 'Mage, bolt (range 3)', move: HERO_STATS.mage.move, range: SKILL.mageBolt.range },
  { label: 'Mage, bolt + Orb (range 4)', move: HERO_STATS.mage.move, range: SKILL.mageBolt.range + 1 },
  { label: 'Thief, throwing knives (range 2)', move: HERO_STATS.thief.move, range: WEAPONS.knives.range },
];
const pursuers: Mover[] = [
  { label: 'Knight', move: HERO_STATS.knight.move, range: 1 },
  { label: 'Barbarian, greataxe', move: HERO_STATS.barbarian.move, range: 1 },
  { label: 'Barbarian, spear', move: HERO_STATS.barbarian.move, range: WEAPONS.spear.range },
  { label: 'Thief, dagger', move: HERO_STATS.thief.move, range: 1 },
];

say('## 1. Kiting: does range keep the archer safe?');
say();
say('A ranged hero tries to shoot every turn and step away; a melee hero chases. One straight line of open plains, no map edge, no teammates, 8 rounds, the ranged hero moving first from the edge of its range. Cells: **hits landed by the ranged hero – hits taken**.');
say();
say(`**Vision matters here.** Vision radius is ${V} and you can't attack what your team can't see, so a lone archer's range 4 bow effectively has range ${V}. The "with a spotter" table assumes a teammate can see the target.`);
say();
for (const [title, vision, boots] of [
  [`Alone (vision ${V})`, V, 0], ['With a spotter (full range)', null, 0], ['With a spotter, ranged hero has boots (+1 move)', null, 1],
] as [string, number | null, number][]) {
  say(`### ${title}`);
  say();
  R.table(['Ranged ↓  Melee →', ...pursuers.map(p => `${p.label} (move ${p.move})`)],
    kiters.map(k => [k.label + ` (move ${k.move + boots})`, ...pursuers.map(p => {
      const r = kite({ ...k, move: k.move + boots }, p, vision, true);
      const cell = `${r.kHits}–${r.pHits}`;
      return r.pHits === 0 ? `**${cell}**` : cell;
    })]));
}
say('Bold = the ranged hero is never hit.');
say();

// =====================================================================
// 2. DEFENSE RACE
// =====================================================================

interface Defense { label: string; gold: number; xp: number; shield: number; stoneskin: boolean; iceBlock: boolean; terrain: boolean }
const forgeAndUpgrade = 8 + 8; // Forge (enables blacksmith upgrades) + shield upgrade
const DEFENSES: Defense[] = [
  { label: 'nothing', gold: 0, xp: 0, shield: 0, stoneskin: false, iceBlock: false, terrain: false },
  { label: 'shield (7g)', gold: 7, xp: 0, shield: GEAR.shieldBlock, stoneskin: false, iceBlock: false, terrain: false },
  { label: 'Stoneskin (10 XP)', gold: 0, xp: 10, shield: 0, stoneskin: true, iceBlock: false, terrain: false },
  { label: 'shield + Stoneskin (7g, 10 XP)', gold: 7, xp: 10, shield: GEAR.shieldBlock, stoneskin: true, iceBlock: false, terrain: false },
  { label: 'upgraded shield (23g)', gold: 7 + forgeAndUpgrade, xp: 0, shield: GEAR.shieldUpgradedBlock, stoneskin: false, iceBlock: false, terrain: false },
  { label: 'upgraded shield + Stoneskin (23g, 10 XP)', gold: 7 + forgeAndUpgrade, xp: 10, shield: GEAR.shieldUpgradedBlock, stoneskin: true, iceBlock: false, terrain: false },
  { label: 'Ice block cast last turn (30 XP)', gold: 0, xp: 30, shield: 0, stoneskin: false, iceBlock: true, terrain: false },
  { label: 'Ice block + shield (7g, 30 XP)', gold: 7, xp: 30, shield: GEAR.shieldBlock, stoneskin: false, iceBlock: true, terrain: false },
];

function defState(d: Defense, st: Stage): DefenderState {
  const refinery = st.gear >= 2 && d.shield > 0 ? GEAR.refineryBonus : 0;
  return { shield: d.shield + refinery, otherBlock: d.stoneskin ? SKILL.stoneskin.block : 0, shattered: 0, onTerrain: d.terrain, intimidate: false, iceBlock: d.iceBlock, marked: false };
}

say('## 2. Defense race: can fragile heroes protect themselves in time?');
say();
say('For each one-turn KO threat against a fragile hero (15–16 HP), the cheapest defense (in the order listed) that lets them survive a full-strength dive from full HP. The attacker is re-optimized against each defense, so this is the attacker\'s best answer to it. Shields need a one-handed weapon (all three fragile classes have one). "Upgraded shield" counts the Forge and the upgrade.');
say();
say('Defense ladder: ' + DEFENSES.map(d => d.label).join(' → ') + '.');
say();
const fragile: ClassId[] = ['archer', 'mage', 'thief'];
const raceRows: string[][] = [];
for (const st of STAGES.filter(s => s.xp > 0)) {
  for (const att of CLASSES) {
    for (const tgt of fragile) {
      const hp = HERO_STATS[tgt].hp;
      const open = bestSolo(att, tgt, st, false, false, false, defState(DEFENSES[0], st));
      if (open.dmg < hp) continue;
      const approach = bestSolo(att, tgt, st, false, true, false, defState(DEFENSES[0], st)).dmg >= hp;
      let found = 'none of these';
      for (const d of DEFENSES.slice(1)) {
        const b = bestSolo(att, tgt, st, false, false, false, defState(d, st));
        if (b.dmg < hp) { found = `${d.label} → takes ${b.dmg}`; break; }
      }
      raceRows.push([st.name, cap(att), `${open.plan!.xp} XP`, `${cap(tgt)} (${hp})`, `${open.dmg}${approach ? '' : ' (in position only)'}`, found]);
    }
  }
}
R.table(['Stage', 'Attacker', 'Attacker XP used', 'Target', 'Damage vs no defense', 'Cheapest defense that survives'], raceRows);

// =====================================================================
// 3. MANA VARIANTS
// =====================================================================

interface ManaVariant { id: string; label: string; mageMana: number; regen: number; restWithAttack: boolean; surgeEvery?: number }
const MANA_VARIANTS: ManaVariant[] = [
  { id: 'A', label: 'Current: mage 8, +1 regen, rest alongside an attack', mageMana: 8, regen: 1, restWithAttack: true },
  { id: 'B', label: 'Mage 6, +1 regen', mageMana: 6, regen: 1, restWithAttack: true },
  { id: 'C', label: 'Mage 7, no regen', mageMana: 7, regen: 0, restWithAttack: true },
  { id: 'D', label: 'Mage 8, +1 regen, rest only on a turn you don\'t attack', mageMana: 8, regen: 1, restWithAttack: false },
  { id: 'E', label: 'Mage 6, +1 regen, rest only on a non-attack turn', mageMana: 6, regen: 1, restWithAttack: false },
  { id: 'F', label: 'Mage 7, no regen, rest only on a non-attack turn', mageMana: 7, regen: 0, restWithAttack: false },
  { id: 'G', label: 'E, plus Mana surge only every 3 turns (was 2)', mageMana: 6, regen: 1, restWithAttack: false, surgeEvery: 3 },
];
const baseMageMana = HERO_STATS.mage.mana;
const baseRegen = MANA.regenPerTurn;

say('## 3. Mana variants');
say();
say('Best damage over **6 turns** (mage also over 10) against an armored knight, starting at full mana. Cells: **damage** (turns that spent mana / turns spent only resting). A rest-only turn is always allowed. In "standing" the hero is in range every turn; in "moving" the spare action is a move every turn.');
say();
R.table(['Variant', 'Rule'], MANA_VARIANTS.map(v => [v.id, v.label]));

for (const stName of ['Mid', 'Late']) {
  const st = stage(stName);
  say(`### Mage at ${stName} (${st.xp} XP)`);
  say();
  const rows: string[][] = [];
  const seqRows: string[][] = [];
  for (const v of MANA_VARIANTS) {
    HERO_STATS.mage.mana = v.mageMana;
    MANA.regenPerTurn = v.regen;
    SKILL.manaSurge.every = v.surgeEvery ?? 2;
    const cells = [false, true].map(mobile => sustained('mage', st, { turns: 6, regen: v.regen, mobile, restWithAttack: v.restWithAttack }));
    const long = sustained('mage', st, { turns: 10, regen: v.regen, mobile: true, restWithAttack: v.restWithAttack });
    rows.push([v.id, `${maxMana('mage', 'staff', st.gear)} / ${maxMana('mage', 'orb', st.gear)}`, ...cells.map(c => `${c.total} (${c.skillTurns}/6, ${c.restTurns} rest)`), `${long.total} (${long.skillTurns}/10, ${long.restTurns} rest)`]);
    seqRows.push([v.id, cells[1].line]);
  }
  R.table(['Variant', 'Max mana (Staff / Orb)', 'Standing, 6 turns', 'Moving, 6 turns', 'Moving, 10 turns'], rows);
  say('Best line while moving:');
  say();
  R.table(['Variant', 'Turn by turn'], seqRows);
}
HERO_STATS.mage.mana = baseMageMana;
MANA.regenPerTurn = baseRegen;
SKILL.manaSurge.every = 2;

say('### Weapon classes: does the "rest only on a non-attack turn" rule matter?');
say();
say('Standing still is where it bites: under the current rule a hero in range can attack and rest every turn.');
say();
{
  const rows: string[][] = [];
  for (const stName of ['Early', 'Mid', 'Late']) {
    const st = stage(stName);
    for (const cls of CLASSES.filter(c => c !== 'mage')) {
      const a = sustained(cls, st, { turns: 6, regen: 1, mobile: false, restWithAttack: true });
      const d = sustained(cls, st, { turns: 6, regen: 1, mobile: false, restWithAttack: false });
      rows.push([stName, cap(cls), `${a.total} (${a.skillTurns}/6)`, `${d.total} (${d.skillTurns}/6, ${d.restTurns} rest)`]);
    }
  }
  R.table(['Stage', 'Class', 'Current rule (A)', 'Rest only on non-attack turns (D)'], rows);
}

say('### Teleport (8 mana): can the mage get locked out?');
say();
{
  const rows: string[][] = [];
  for (const v of MANA_VARIANTS) {
    for (const w of ['staff', 'orb'] as const) {
      HERO_STATS.mage.mana = v.mageMana;
      const mm = maxMana('mage', w, 1);
      if (mm < SKILL.teleport.mana) { rows.push([v.id, w, `${mm}`, '**never** (needs Temple +2)', '—']); continue; }
      // From empty: turns resting (3, or 5 with Deep rest) plus regen, vs turns of regen alone.
      const turns = (perTurn: number) => (perTurn <= 0 ? 'never' : `${Math.ceil(SKILL.teleport.mana / perTurn)}`);
      rows.push([v.id, w, `${mm}`, turns(MANA.restAmount + v.regen) + ` (Deep rest: ${turns(MANA.restAmount + MANA.deepRestBonus + v.regen)})`, turns(v.regen)]);
    }
  }
  HERO_STATS.mage.mana = baseMageMana;
  R.table(['Variant', 'Weapon', 'Max mana (Blacksmith)', 'Turns from empty to 8, resting every turn', 'Turns from empty, fighting (regen only)'], rows);
}

// =====================================================================
// 4. BARBARIAN GLASS CANNON
// =====================================================================

interface BarbVariant { id: string; hp: number; bonus: number; threshold: number }
const BARB: BarbVariant[] = [
  { id: 'Current', hp: 20, bonus: 3, threshold: 0.5 },
  { id: 'G1', hp: 18, bonus: 3, threshold: 0.75 },
  { id: 'G2', hp: 16, bonus: 3, threshold: 0.75 },
  { id: 'G3', hp: 16, bonus: 2, threshold: 0.75 },
  { id: 'G4', hp: 16, bonus: 3, threshold: 1.0 },
];
const baseBarb = { hp: HERO_STATS.barbarian.hp, bonus: SKILL.vengeance.bonus, threshold: SKILL.vengeance.threshold };

// 1v1 duel, both standing in range, alternating turns. Each hero commits to one
// build (the best-burst build against this opponent) and each turn picks the
// best affordable plan within it. Current mana rule (A). Abstracts away
// movement, so ranged heroes don't get to kite (see section 1 for that).
function duel(a: ClassId, b: ClassId, st: Stage, aFirst: boolean): { winner: ClassId; turns: number; hpLeft: number } {
  const mk = (cls: ClassId, opp: ClassId) => {
    const best = bestSolo(cls, opp, st, true, false, cls === 'barbarian').plan!;
    // The barbarian's best build is chosen with Vengeance active, so it includes
    // Vengeance whenever the budget allows.
    const nodes = new Set(best.nodes);
    const plans = plansFor(cls, st).filter(p => p.pre !== 'move' && p.pre !== 'empowerAlly' && p.attack !== 'ambush' && [...p.nodes].every(n => nodes.has(n)) && p.weapon === best.weapon);
    const maxHp = HERO_STATS[cls].hp;
    return { cls, plans, hp: maxHp, maxHp, mana: maxMana(cls, best.weapon, st.gear), mm: maxMana(cls, best.weapon, st.gear), emp: 0, insp: 0, mark: 0, def: defender(cls, st.gear, true) };
  };
  const A = mk(a, b), B = mk(b, a);
  const order = aFirst ? [A, B] : [B, A];
  for (let t = 0; t < 30; t++) {
    const me = order[t % 2], foe = order[(t + 1) % 2];
    if (t >= 2) me.mana = Math.min(me.mm, me.mana + MANA.regenPerTurn);
    const veng = me.cls === 'barbarian' && me.hp <= SKILL.vengeance.threshold * me.maxHp;
    let bestP: Plan | null = null, bestD = -1;
    for (const p of me.plans) {
      if (p.mana > me.mana) continue;
      const dmg = evaluate(p, st, { ...foe.def, marked: me.mark > 0 || p.mark }, { empowered: me.emp > 0, inspired: me.insp > 0, vengeance: veng }).damage;
      if (dmg > bestD || (dmg === bestD && bestP && p.mana < bestP.mana)) { bestD = dmg; bestP = p; }
    }
    const p = bestP!;
    me.mana -= p.mana;
    if (p.pre === 'none') me.mana = Math.min(me.mm, me.mana + MANA.restAmount); // rest alongside (rule A)
    me.emp = p.pre === 'empowerSelf' ? SKILL.empower.turns : Math.max(0, me.emp - 1);
    me.insp = p.pre === 'inspire' ? SKILL.inspire.turns : Math.max(0, me.insp - 1);
    me.mark = p.mark ? SKILL.huntersMark.turns : Math.max(0, me.mark - 1);
    foe.hp -= bestD;
    if (foe.hp <= 0) return { winner: me.cls, turns: Math.floor(t / 2) + 1, hpLeft: me.hp };
  }
  return { winner: a, turns: 99, hpLeft: -1 };
}

say('## 4. Barbarian as a glass cannon');
say();
R.table(['Variant', 'Barbarian HP', 'Vengeance', 'Active at or below'],
  BARB.map(v => [v.id, v.hp, `+${v.bonus} per hit`, `${Math.floor(v.threshold * v.hp)} HP (${Math.round(v.threshold * 100)}%)`]));

for (const stName of ['Mid', 'Late']) {
  const st = stage(stName);
  say(`### ${stName} (${st.xp} XP)`);
  say();
  const rows: string[][] = [];
  for (const v of BARB) {
    HERO_STATS.barbarian.hp = v.hp; SKILL.vengeance.bonus = v.bonus; SKILL.vengeance.threshold = v.threshold;
    const burst = bestSolo('barbarian', 'knight', st, true, true, true).dmg;
    const burstOpen = bestSolo('barbarian', 'mage', st, false, true, true).dmg;
    // Who kills the barbarian in one turn (armored barbarian = Intimidate, +Stoneskin late)
    const killers = CLASSES.filter(c => bestSolo(c, 'barbarian', st, true, true).dmg >= v.hp).map(cap);
    const duels = CLASSES.map(c => {
      const r1 = duel('barbarian', c, st, true);
      const r2 = duel('barbarian', c, st, false);
      const w = [r1, r2].filter(r => r.winner === 'barbarian').length;
      return `${w}/2`;
    });
    rows.push([v.id, `${burstOpen} / ${burst}`, killers.join(', ') || 'nobody', ...duels]);
  }
  R.table(['Variant', 'Vengeance burst: open mage / armored knight', 'One-turn KO the barbarian (on the approach)', ...CLASSES.map(c => `Duel vs ${cap(c)}`)], rows);
}
HERO_STATS.barbarian.hp = baseBarb.hp; SKILL.vengeance.bonus = baseBarb.bonus; SKILL.vengeance.threshold = baseBarb.threshold;
say('Duels: 1v1, both armored, standing in range, each going first once; cell = duels the barbarian wins. Duels ignore movement, so the archer and mage can\'t kite here (section 1 shows how that goes).');
say();

mkdirSync(new URL('./reports/', import.meta.url), { recursive: true });
writeFileSync(new URL('./reports/tuning-round1.md', import.meta.url), R.lines.join('\n'));
console.log(`wrote sim/reports/tuning-round1.md (${R.lines.length} lines)`);
