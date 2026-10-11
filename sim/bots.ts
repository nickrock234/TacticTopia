// Rule-based bots that play the archetypes in Archetypes.md.
//
// Each turn a bot:
//   1. spends gold and XP down its archetype's shopping lists (free actions),
//   2. picks a goal (claim, farm, hunt, support, retreat, explore),
//   3. enumerates possible two-action plans (move/attack/cast/rest in various
//      orders), scores each, and executes the best.
// Scores combine damage and kills, NPC rewards, progress toward the goal,
// danger at the tile it ends on, and support value. Weights come from the archetype.

import { HERO_STATS, SKILL, MANA, WEAPONS, type ClassId, type Element } from '../engine/numbers.ts';
import { cheb, type Pos } from '../engine/mapgen.ts';
import { type GameState, type Hero, idx, posOf, field, maxHp, maxManaOf, hasStatus } from '../engine/state.ts';
import {
  reachable, previewAttack, previewSpell, attack, move, cast, doublecast, rest, huntersMark, manaSurge, curePoison,
  buyBuilding, learn, buyItem, upgrade, launder, sellItem, canCast, enemiesOf, alliesOf, visibleTo, weaponDamage, weaponRange,
  landmarkAt, targetPos, moveBudget, spellRange, canLearn, destinations, placeDecoy,
  type AttackOpt, type Target, type Spell, type CastArgs,
} from '../engine/rules.ts';
import { NPC } from '../engine/economy.ts';
import { SKILL_NODES } from '../engine/skills.ts';
import { SPELL_INFO } from '../engine/rules.ts';
const SPELL_MANA = Object.fromEntries(Object.entries(SPELL_INFO).map(([k, v]) => [k, v.mana])) as Record<Spell, number>;

export interface Archetype {
  id: string;
  cls: ClassId;
  element: Element;
  skills: string[];                 // XP priority (unavailable ones are skipped until possible)
  gold: string[];                   // building ids, or item:shield|boots|weapon2, upg:weapon|shield|boots
  w: { claim: number; farm: number; fight: number; support: number; safety: number };
  retreatAt: number;                // fraction of max HP
  late?: { after: string; w: Archetype['w'] }; // switch priorities once this skill is owned
  stick: number;                    // how much it wants to stay near teammates (0 = lone wolf)
}

const G_BASE = ['dummy', 'library', 'market', 'sparring', 'trade2', 'monastery', 'armory', 'shrine', 'stables', 'arena', 'trade3', 'refinery', 'apothecary', 'territory2', 'temple', 'territory3'];
const withBase = (first: string[]) => [...first, ...G_BASE.filter(b => !first.includes(b))];

export const ARCHETYPES: Archetype[] = [
  { id: 'Paladin', cls: 'knight', element: 'earth',
    skills: ['selfHeal', 'stoneskin', 'crossHeal', 'resurrection', 'fortify', 'holyStrike', 'shattering', 'charge'],
    gold: withBase(['forge', 'item:shield', 'shrine', 'library', 'upg:shield', 'apothecary', 'item:boots']),
    w: { claim: 0.8, farm: 0.8, fight: 0.8, support: 1.6, safety: 1.0 }, retreatAt: 0.35, stick: 1.5 },
  { id: 'Crusader', cls: 'knight', element: 'fire',
    skills: ['holyStrike', 'flaming', 'charge', 'selfHeal', 'smite', 'stoneskin', 'burningAura', 'crossHeal'],
    gold: withBase(['forge', 'item:shield', 'upg:weapon', 'library', 'upg:shield', 'item:boots']),
    w: { claim: 1.0, farm: 1.0, fight: 1.2, support: 0.6, safety: 0.8 }, retreatAt: 0.3, stick: 1.0 },
  { id: 'Berserker', cls: 'barbarian', element: 'fire',
    skills: ['heavyStrike', 'flaming', 'vengeance', 'doubleStrike', 'burningAura', 'intimidate', 'stoneskin'],
    gold: withBase(['library', 'dummy', 'forge', 'upg:weapon', 'item:boots', 'sparring']),
    w: { claim: 0.8, farm: 1.0, fight: 1.6, support: 0, safety: 0.6 }, retreatAt: 0.25, stick: 0.6 },
  { id: 'Warlord', cls: 'barbarian', element: 'earth',
    skills: ['intimidate', 'stoneskin', 'counterattack', 'heavyStrike', 'inspire', 'shattering', 'vengeance'],
    gold: withBase(['forge', 'item:weapon2', 'library', 'upg:weapon', 'item:boots']),
    w: { claim: 1.0, farm: 1.0, fight: 1.2, support: 0.8, safety: 0.8 }, retreatAt: 0.3, stick: 1.3 },
  { id: 'Sniper', cls: 'archer', element: 'fire',
    skills: ['takeAim', 'flaming', 'armorPierce', 'burningAura', 'arrowRain', 'windchill'],
    gold: withBase(['item:boots', 'forge', 'upg:weapon', 'library', 'item:shield']),
    w: { claim: 0.9, farm: 1.2, fight: 1.3, support: 0.2, safety: 1.3 }, retreatAt: 0.45, stick: 1.0 },
  { id: 'Hunter', cls: 'archer', element: 'water',
    skills: ['scoutsEye', 'chilling', 'pinningShot', 'windchill', 'huntersMark', 'iceBlock', 'takeAim'],
    gold: withBase(['forge', 'item:weapon2', 'library', 'item:shield', 'item:boots', 'upg:weapon']),
    w: { claim: 0.9, farm: 1.0, fight: 1.1, support: 0.8, safety: 1.2 }, retreatAt: 0.45, stick: 1.4 },
  { id: 'Artillery', cls: 'mage', element: 'fire',
    skills: ['flaming', 'deepRest', 'fireball', 'manaSurge', 'doublecast', 'burningAura'],
    gold: withBase(['library', 'monastery', 'dummy', 'shrine', 'forge', 'upg:weapon', 'item:shield']),
    w: { claim: 0.8, farm: 1.1, fight: 1.4, support: 0.3, safety: 1.4 }, retreatAt: 0.5, stick: 1.3 },
  { id: 'Enchanter', cls: 'mage', element: 'water',
    skills: ['empower', 'windchill', 'cleanse', 'iceBlock', 'teleport', 'deepRest', 'chilling'],
    gold: withBase(['shrine', 'library', 'dummy', 'apothecary', 'forge', 'item:shield', 'temple']),
    w: { claim: 0.8, farm: 0.9, fight: 1.0, support: 1.6, safety: 1.4 }, retreatAt: 0.5, stick: 1.8 },
  { id: 'Assassin', cls: 'thief', element: 'fire',
    skills: ['invisibility', 'flaming', 'ambush', 'doubleDagger', 'burningAura'],
    gold: withBase(['item:boots', 'forge', 'upg:weapon', 'library', 'dummy', 'item:shield']),
    w: { claim: 1.0, farm: 1.0, fight: 1.5, support: 0, safety: 1.0 }, retreatAt: 0.4, stick: 0.3 },
  { id: 'Profiteer', cls: 'thief', element: 'earth',
    skills: ['investor', 'stoneskin', 'pickpocket', 'launder', 'invisibility', 'ambush', 'doubleDagger', 'shattering'],
    gold: withBase(['market', 'trade2', 'item:weapon2', 'forge', 'library', 'trade3', 'item:shield']),
    w: { claim: 1.6, farm: 1.3, fight: 0.8, support: 0.3, safety: 1.2 }, retreatAt: 0.45, stick: 0.3,
    late: { after: 'launder', w: { claim: 1.0, farm: 1.0, fight: 1.4, support: 0.3, safety: 1.0 } } },
];
/** How often each archetype used each action type (for the report). */
export const USAGE = new Map<string, number>();
const used = (h: Hero, what: string) => { const k = `${h.archetype}|${what}`; USAGE.set(k, (USAGE.get(k) ?? 0) + 1); };

export const ARCH: Record<string, Archetype> = Object.fromEntries(ARCHETYPES.map(a => [a.id, a]));

// =====================================================================
// Economy (free actions)
// =====================================================================

/** The archetype's own list, then the rest of the tree: its class's other skills,
 *  element passives before element spells (own element first), then hybrids. */
const fullOrderCache = new Map<string, string[]>();
function skillOrder(h: Hero, a: Archetype): string[] {
  const key = a.id;
  let o = fullOrderCache.get(key);
  if (o) return o;
  const nodes = Object.values(SKILL_NODES);
  const els = [a.element, ...(['fire', 'water', 'earth'] as const).filter(e => e !== a.element)];
  const rest = [
    ...nodes.filter(n => n.cls === h.cls).map(n => n.id),
    ...els.flatMap(e => nodes.filter(n => n.element === e && n.requires.length === 0).map(n => n.id)),
    ...els.flatMap(e => nodes.filter(n => n.element === e && n.requires.length > 0).map(n => n.id)),
    ...nodes.filter(n => n.hybridOf).map(n => n.id),
  ];
  o = [...a.skills, ...rest.filter(id => !a.skills.includes(id))];
  fullOrderCache.set(key, o);
  return o;
}

export function shop(g: GameState, h: Hero, a: Archetype) {
  // XP: learn down the full order; skip what isn't possible yet (element not unlocked,
  // hybrid not ready) but save up for the first skill that IS possible.
  let progress = true;
  while (progress) {
    progress = false;
    for (const id of skillOrder(h, a)) {
      if (h.skills.has(id)) continue;
      if (learn(g, h, id)) { progress = true; break; }
      // learnable in principle (prereqs + element) but not affordable → stop, save up
      const cost = SKILL_COST(g, h, id);
      if (cost !== null) break;
    }
  }
  // Gold: strictly in order (save for the next item).
  for (const item of a.gold) {
    const done = isDone(g, h, item);
    if (done) continue;
    if (!tryBuy(g, h, item)) { if (possibleLater(g, h, item)) break; else continue; }
  }
  // spare chest gear: bots sell it (no giving to teammates yet)
  while (h.inventory.length) sellItem(g, h, 0);
  if (h.skills.has('launder') && g.players[h.player].gold > 40) launder(g, h, g.players[h.player].gold - 30);
}

function SKILL_COST(g: GameState, h: Hero, id: string): number | null {
  // returns a cost if the skill could be learned with enough XP, else null
  const saveXp = g.players[h.player].xp;
  g.players[h.player].xp = 1e9;
  const ok = learnCheck(g, h, id);
  g.players[h.player].xp = saveXp;
  return ok ? 1 : null;
}
const learnCheck = (g: GameState, h: Hero, id: string) => canLearn(g, h, id);

function isDone(g: GameState, h: Hero, item: string): boolean {
  const p = g.players[h.player];
  if (item === 'item:shield') return h.shield > 0 || WEAPONS[h.weapon].twoHanded;
  if (item === 'item:boots') return !!h.boots;
  if (item === 'item:weapon2') return WEAPONS[h.weapon].owner === h.cls && h.weapon !== ({ knight: 'sword', barbarian: 'greataxe', archer: 'bow', mage: 'staff', thief: 'dagger' } as const)[h.cls];
  if (item === 'upg:weapon') return h.weaponUpgraded;
  if (item === 'upg:shield') return h.shield === 2 || WEAPONS[h.weapon].twoHanded;
  if (item === 'upg:boots') return !!h.boots && h.boots !== 'plain';
  return p.buildings.has(item);
}
function tryBuy(g: GameState, h: Hero, item: string): boolean {
  if (item.startsWith('item:')) return buyItem(g, h, item.slice(5) as 'shield' | 'boots' | 'weapon2');
  if (item.startsWith('upg:')) return upgrade(g, h, item.slice(4) as 'weapon' | 'shield' | 'boots');
  return buyBuilding(g, h.player, item);
}
function possibleLater(g: GameState, h: Hero, item: string): boolean {
  const p = g.players[h.player];
  const merchant = g.landmarks.some(l => l.owner === h.player && g.map.landmarks[l.idx].bonus === 'merchant');
  if (item.startsWith('item:')) return merchant || p.buildings.has('armory'); // else skip it for now
  if (item.startsWith('upg:')) {
    if (!p.buildings.has('forge')) return false;
    if (item === 'upg:shield') return h.shield === 1;
    if (item === 'upg:boots') return h.boots === 'plain';
    return true;
  }
  return true;
}

// =====================================================================
// Threat estimate
// =====================================================================

/** Rough one-turn burst an enemy could put on `me` (next turn), ignoring positioning. */
function burstOf(g: GameState, e: Hero, me: Hero): number {
  let best = 0;
  if (e.cls === 'mage') {
    const bolt = SKILL.mageBolt.damage + (e.skills.has('flaming') ? 1 : 0);
    best = Math.max(best, e.skills.has('doublecast') && e.mana >= 4 ? 2 * bolt : e.mana >= 2 ? bolt : WEAPONS[e.weapon].damage);
  }
  const w = weaponDamage(g, e) + (e.skills.has('flaming') ? 1 : 0) + (e.skills.has('vengeance') && e.hp <= 0.75 * maxHp(g, e) ? 3 : 0);
  const block = me.shield ? (me.shield === 2 ? 2 : 1) : 0;
  let perHit = Math.max(1, w - block - (me.skills.has('stoneskin') ? 1 : 0));
  let hits = WEAPONS[e.weapon].hits;
  if (e.skills.has('doubleStrike') && e.mana >= 2) hits *= 2;
  else if (e.skills.has('heavyStrike') && e.mana >= 2) perHit += 3;
  else if (e.skills.has('holyStrike') && e.mana >= 2) perHit += 2;
  if (e.cls === 'thief' && hasStatus(e, 'invisible')) { if (e.skills.has('ambush')) perHit += 3; if (e.skills.has('doubleDagger')) hits *= 2; }
  return Math.max(best, perHit * hits);
}

function reachOf(g: GameState, e: Hero): number {
  const r = e.cls === 'mage' ? spellRange(e, 'mageBolt') : WEAPONS[e.weapon].range;
  return HERO_STATS[e.cls].move + (e.boots ? 1 : 0) + r;
}

// =====================================================================
// Goals
// =====================================================================

interface Goal { kind: string; pos: Pos; value: number; target?: Target }

function chooseGoal(g: GameState, h: Hero, a: Archetype): Goal {
  const me = h.pos!;
  const speed = 2 * Math.max(1, moveBudget(g, h));
  const dist = (p: Pos) => { const d = field(g, p)[idx(g, me)]; return d < 0 ? cheb(p, me) * 1.5 : d; };
  const goals: Goal[] = [];
  const hpFrac = h.hp / maxHp(g, h);
  const base = g.map.bases[h.player];

  if (hpFrac < a.retreatAt) {
    const knight = alliesOf(g, h).find(o => o.skills.has('crossHeal') || o.skills.has('selfHeal'));
    return { kind: 'retreat', pos: knight?.pos ?? { x: base.x, y: base.y }, value: 100 };
  }
  // claim
  for (const l of g.landmarks) {
    const m = g.map.landmarks[l.idx];
    const ownerTeam = l.owner === null ? -1 : g.players[l.owner].team;
    if (ownerTeam === h.team) continue;
    if (l.pending && g.players[l.pending.player].team === h.team && l.pending.hero !== h.id) continue;
    let v = 10;
    if (m.element && !g.landmarks.some(x => x.owner === h.player && g.map.landmarks[x.idx].element === m.element) && m.element !== h.element) v += 5;
    if (m.bonus === 'merchant') v += 6;
    if (m.bonus === 'mine') v += 8;
    if (m.bonus === 'fountain') v += maxManaOf(g, h) >= 8 ? 6 : 3; // refills mana: worth more to casters
    if (m.bonus === 'lair') v += 5;
    if (ownerTeam >= 0) v += 4; // taking it from the enemy
    goals.push({ kind: 'claim', pos: m, value: v * a.w.claim });
  }
  // refill mana at a fountain the team owns, when low
  const missing = maxManaOf(g, h) - h.mana;
  if (missing >= 4) for (const l of g.landmarks) {
    const m = g.map.landmarks[l.idx];
    if (m.bonus === 'fountain' && l.owner !== null && g.players[l.owner].team === h.team && dist(m) <= speed)
      goals.push({ kind: 'refill', pos: m, value: missing * 3 });
  }
  // farm
  const myHit = Math.max(1, weaponDamage(g, h) + (h.cls === 'mage' && h.mana >= 2 ? 3 : 0));
  const melee = WEAPONS[h.weapon].range === 1 && h.cls !== 'mage';
  for (const c of g.camps) {
    if (c.respawn !== 0) continue;
    const kind = g.map.camps[c.idx].kind;
    const hits = Math.ceil(c.hp / myHit);
    const taken = melee ? (hits - 1) * NPC[kind].dmg : 0;
    if (taken >= h.hp - 3) continue;
    goals.push({ kind: 'farm', pos: g.map.camps[c.idx], value: (NPC[kind].xp + NPC[kind].gold) * 1.2 * a.w.farm - taken * 0.5, target: { kind: 'camp', id: c.idx } });
  }
  for (const l of g.landmarks) {
    const m = g.map.landmarks[l.idx];
    if (m.bonus !== 'lair' || l.bossRespawn !== 0 || l.owner === null || g.players[l.owner].team !== h.team) continue;
    const hits = Math.ceil(l.bossHp / myHit);
    const taken = melee ? (hits - 1) * NPC.lair.dmg : 0;
    if (taken >= h.hp - 3) continue;
    goals.push({ kind: 'farm', pos: m, value: 40 * a.w.farm - taken, target: { kind: 'boss', id: l.idx } });
  }
  // hunt
  if (hpFrac >= 0.5) for (const e of enemiesOf(g, h)) {
    if (!visibleTo(g, e, h.team)) continue;
    const ratio = burstOf(g, h, e) / Math.max(1, e.hp);
    goals.push({ kind: 'hunt', pos: e.pos!, value: (12 + 25 * Math.min(1.5, ratio)) * a.w.fight });
  }
  // support: go to the teammate most in need
  if (a.w.support > 0.5) {
    for (const o of alliesOf(g, h)) {
      const need = 1 - o.hp / maxHp(g, o);
      const engaged = enemiesOf(g, h).some(e => cheb(e.pos!, o.pos!) <= 5);
      goals.push({ kind: 'support', pos: o.pos!, value: (8 + 20 * need + (engaged ? 8 : 0)) * a.w.support });
    }
    if (h.skills.has('resurrection')) for (const o of g.heroes) if (o.team === h.team && !o.pos && o.deathPos)
      goals.push({ kind: 'support', pos: o.deathPos, value: 60 });
  }
  // explore: nearest unrevealed tile
  let ex: Pos | null = null, exd = Infinity;
  for (let i = 0; i < g.fog[h.team].length; i += 3) if (!g.fog[h.team][i]) { const p = posOf(g, i); const d = cheb(p, me); if (d < exd) { exd = d; ex = p; } }
  if (ex) goals.push({ kind: 'explore', pos: ex, value: 4 });

  let best: Goal = { kind: 'idle', pos: me, value: 0 };
  let bs = -Infinity;
  for (const go of goals) { const s = go.value / (1 + dist(go.pos) / speed); if (s > bs) { bs = s; best = go; } }
  return best;
}

// =====================================================================
// Plans
// =====================================================================

type Step =
  | { t: 'move'; to: Pos } | { t: 'attack'; target: Target; opt: AttackOpt }
  | { t: 'cast'; spell: Spell; args: CastArgs } | { t: 'double'; s1: Spell; a1: CastArgs; s2: Spell; a2: CastArgs }
  | { t: 'rest' } | { t: 'teleport'; ally: number; dest: Pos; follow: { target: Target; opt: AttackOpt } | { spell: Spell; args: CastArgs } };

interface Plan { steps: Step[]; score: number; why: string }

interface Ctx {
  g: GameState; h: Hero; a: Archetype; goal: Goal;
  goalField: Int16Array; danger: Map<number, number>;
  enemies: Hero[];
}

function dangerAt(c: Ctx, p: Pos): number {
  const k = idx(c.g, p);
  let v = c.danger.get(k);
  if (v === undefined) {
    v = 0;
    for (const e of c.enemies) if (cheb(e.pos!, p) <= reachOf(c.g, e)) v += burstOf(c.g, e, c.h);
    c.danger.set(k, v);
  }
  return v;
}

function positionScore(c: Ctx, p: Pos, hpAfter: number): number {
  const { g, h, a, goal } = c;
  let s = 0;
  const gd = c.goalField[idx(g, p)];
  s -= (gd < 0 ? cheb(p, goal.pos) * 1.5 : gd) * 1.0;
  if (goal.kind === 'retreat' || goal.kind === 'support') s -= 0; // distance term already dominates
  const d = dangerAt(c, p);
  if (d >= hpAfter) s -= 40 * a.w.safety;
  else s -= (d / Math.max(1, hpAfter)) * 10 * a.w.safety;
  // teammates
  const allies = alliesOf(g, h);
  if (allies.length && a.stick > 0) {
    const nd = Math.min(...allies.map(o => cheb(o.pos!, p)));
    s -= Math.max(0, nd - 3) * 0.5 * a.stick;
  }
  // claiming: standing in a claimable territory we're working on
  const lm = landmarkAt(g, p);
  if (lm !== null) {
    const l = g.landmarks[lm];
    const ownerTeam = l.owner === null ? -1 : g.players[l.owner].team;
    if (ownerTeam !== h.team && !(l.pending?.decoy && l.pending.hero === h.id)) s += (l.pending?.hero === h.id ? 12 : 8) * a.w.claim;
  }
  return s;
}

function attackScore(c: Ctx, pv: { dmg: number; kills: number; selfDmg: number; npcReward: number }, targetIsHero: boolean): number {
  const { a, h } = c;
  let s = 0;
  if (targetIsHero) s += pv.dmg * 1.5 * a.w.fight + pv.kills * 30 * a.w.fight;
  else s += pv.dmg * 0.3 * a.w.farm + pv.npcReward * 1.0 * a.w.farm;
  if (pv.selfDmg >= h.hp) s -= 100; else s -= pv.selfDmg * 0.8 * a.w.safety;
  return s;
}

function attackOptions(c: Ctx): AttackOpt[] {
  const h = c.h;
  const o: AttackOpt[] = ['weapon'];
  for (const k of ['holyStrike', 'heavyStrike', 'charge', 'doubleStrike', 'pinningShot', 'arrowRain'] as AttackOpt[]) if (h.skills.has(k)) o.push(k);
  return o;
}

function targetsNear(c: Ctx, from: Pos, reach: number): Target[] {
  const { g, h } = c;
  const out: Target[] = [];
  for (const e of c.enemies) if (cheb(e.pos!, from) <= reach) out.push({ kind: 'hero', id: e.id });
  for (const cp of g.camps) if (cp.respawn === 0 && cheb(g.map.camps[cp.idx], from) <= reach) out.push({ kind: 'camp', id: cp.idx });
  for (const l of g.landmarks) if (g.map.landmarks[l.idx].bonus === 'lair' && l.bossRespawn === 0 && l.owner !== null && g.players[l.owner].team === h.team && cheb(g.map.landmarks[l.idx], from) <= reach) out.push({ kind: 'boss', id: l.idx });
  for (const l of g.landmarks) if (l.pending?.decoy && g.players[l.pending.player].team !== h.team && cheb(l.pending.decoy, from) <= reach) out.push({ kind: 'decoy', id: l.idx });
  return out;
}

/** Best attack (weapon, skill or damaging spell) from `from`. */
function bestAttackFrom(c: Ctx, from: Pos, moved: boolean): { step: Step; score: number } | null {
  const { g, h } = c;
  let best: { step: Step; score: number } | null = null;
  const reserve = h.skills.has('teleport') ? SKILL.teleport.mana : 0;
  const manaOf = (step: Step) => step.t === 'cast' ? SPELL_MANA[step.spell] : step.t === 'double' ? SPELL_MANA[step.s1] + SPELL_MANA[step.s2] : 0;
  const consider = (step: Step, score: number) => {
    if (reserve && h.mana - manaOf(step) < reserve && score < 30) score -= 8;
    if (!best || score > best.score) best = { step, score };
  };
  const reach = Math.max(weaponRange(g, h, moved) + 1, 5);
  const tgts = targetsNear(c, from, reach);
  for (const t of tgts) for (const opt of attackOptions(c)) {
    const pv = previewAttack(g, h, from, moved, t, opt);
    if (!pv) continue;
    consider({ t: 'attack', target: t, opt }, (t.kind === 'decoy' ? 14 * c.a.w.claim : attackScore(c, pv, t.kind === 'hero')) - (opt !== 'weapon' ? 0.5 : 0));
  }
  // damaging spells on heroes
  const heroT = c.enemies.filter(e => cheb(e.pos!, from) <= 5);
  const single: Spell[] = ['mageBolt', 'lightning', 'nature', 'poison'];
  for (const e of heroT) {
    for (const s of single) {
      const pv = previewSpell(g, h, from, s, { hero: e.id });
      if (pv) consider({ t: 'cast', spell: s, args: { hero: e.id } }, attackScore(c, pv, true) - 0.3);
    }
    const fb = previewSpell(g, h, from, 'fireball', { target: e.pos! });
    if (fb) consider({ t: 'cast', spell: 'fireball', args: { target: e.pos! } }, attackScore(c, fb, true) - 0.3);
  }
  for (const s of ['quake', 'smite'] as Spell[]) {
    const pv = previewSpell(g, h, from, s, {});
    if (pv && pv.dmg > 0) consider({ t: 'cast', spell: s, args: {} }, attackScore(c, pv, true) - 0.3);
  }
  // Doublecast: two bolts (or fireball + bolt) in one action
  if (h.skills.has('doublecast')) for (const e of heroT) {
    const p1 = previewSpell(g, h, from, 'mageBolt', { hero: e.id });
    if (!p1 || h.mana < 4) continue;
    const e2 = c.enemies.filter(x => cheb(x.pos!, from) <= spellRange(h, 'mageBolt'));
    for (const f of e2) {
      const p2 = previewSpell(g, h, from, 'mageBolt', { hero: f.id });
      if (!p2) continue;
      const same = f.id === e.id;
      const dmg = same ? Math.min(p1.dmg + p2.dmg, e.hp) : p1.dmg + p2.dmg;
      const kills = same ? (p1.dmg + p2.dmg >= e.hp ? 1 : 0) : p1.kills + p2.kills;
      consider({ t: 'double', s1: 'mageBolt', a1: { hero: e.id }, s2: 'mageBolt', a2: { hero: f.id } }, attackScore(c, { dmg, kills, selfDmg: 0, npcReward: 0 }, true) - 0.6);
    }
  }
  // single-target spells on NPC camps and our lair boss (mages farm this way)
  for (const t of tgts) if (t.kind === 'camp' || t.kind === 'boss') for (const s of single) {
    const pv = previewSpell(g, h, from, s, { npc: t });
    if (pv) consider({ t: 'cast', spell: s, args: { npc: t } }, attackScore(c, pv, false) - 0.3);
  }
  return best;
}

function manaValue(c: Ctx, gain: number): number {
  const { g, h } = c;
  const missing = maxManaOf(g, h) - h.mana;
  const useful = Math.min(gain, missing);
  const caster = h.cls === 'mage' ? 1.2 : 0.5;
  return useful * caster;
}

function supportSteps(c: Ctx): { step: Step; score: number }[] {
  const { g, h, a } = c;
  const out: { step: Step; score: number }[] = [];
  const hurt = (o: Hero) => maxHp(g, o) - o.hp;
  const add = (spell: Spell, args: CastArgs, score: number) => { if (canCast(g, h, spell, args)) out.push({ step: { t: 'cast', spell, args }, score }); };
  if (h.skills.has('selfHeal') && hurt(h) >= 3) add('selfHeal', {}, Math.min(hurt(h), SKILL.selfHeal.heal) * 1.5 * a.w.support + (h.hp < 0.4 * maxHp(g, h) ? 8 : 0));
  if (h.skills.has('crossHeal')) {
    const pos = h.pos!;
    let v = 0; for (const o of [h, ...alliesOf(g, h)]) if ((o.pos!.x === pos.x || o.pos!.y === pos.y) && cheb(o.pos!, pos) <= 1) v += Math.min(hurt(o), SKILL.crossHeal.heal);
    if (v >= 3) add('crossHeal', {}, v * 1.4 * a.w.support);
  }
  if (h.skills.has('resurrection')) for (const o of g.heroes) if (o.team === h.team && !o.pos && o.deathPos) add('resurrection', { hero: o.id }, 60);
  if (h.skills.has('empower')) for (const o of [h, ...alliesOf(g, h)]) {
    if (hasStatus(o, 'empower')) continue;
    const engaged = c.enemies.some(e => cheb(e.pos!, o.pos!) <= 4);
    if (engaged) add('empower', { hero: o.id }, (o.id === h.id ? 3 : 5) * a.w.support);
  }
  if (h.skills.has('cleanse')) for (const o of [h, ...alliesOf(g, h)]) if (o.statuses.some(s => ['poison', 'paralysis', 'pinned', 'chill'].includes(s.kind))) add('cleanse', { hero: o.id }, 6 * a.w.support);
  if (h.skills.has('inspire')) {
    const n = [h, ...alliesOf(g, h)].filter(o => cheb(o.pos!, h.pos!) <= 4 && c.enemies.some(e => cheb(e.pos!, o.pos!) <= 4)).length;
    if (n >= 1 && !hasStatus(h, 'inspire')) add('inspire', {}, n * 3 * (a.w.support + a.w.fight) / 2);
  }
  if (h.skills.has('iceBlock') && dangerAt(c, h.pos!) >= h.hp) add('iceBlock', {}, 12 * a.w.safety);
  if (h.skills.has('invisibility') && !hasStatus(h, 'invisible') && c.enemies.length) add('invisibility', {}, 6 * a.w.fight);
  if (h.skills.has('firewall') && !h.attacked) for (const o of [h, ...alliesOf(g, h)]) {
    const foes = c.enemies.filter(e => cheb(e.pos!, o.pos!) <= 1);
    if (!foes.length) continue;
    // leave open the side facing away from the enemies
    const cx = foes.reduce((s, e) => s + e.pos!.x, 0) / foes.length - o.pos!.x, cy = foes.reduce((s, e) => s + e.pos!.y, 0) / foes.length - o.pos!.y;
    const DIR8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    let open = 0, bd = -Infinity; DIR8.forEach(([dx, dy], i) => { const dot = -(dx * cx + dy * cy); if (dot > bd) { bd = dot; open = i; } });
    add('firewall', { hero: o.id, open }, foes.length * 4 * a.w.fight + 6 * a.w.support);
  }
  if (h.skills.has('fortify')) for (const o of [h, ...alliesOf(g, h)]) if (c.enemies.some(e => cheb(e.pos!, o.pos!) <= 3) && o.cls !== 'knight') add('fortify', { hero: o.id }, 2 * a.w.support);
  return out;
}

function teleportPlans(c: Ctx): Plan[] {
  const { g, h } = c;
  const out: Plan[] = [];
  if (!h.skills.has('teleport') || h.mana < SKILL.teleport.mana) return out;
  for (const ally of alliesOf(g, h)) {
    if (cheb(ally.pos!, h.pos!) > 3) continue;
    const aCtx: Ctx = { ...c, h: ally, a: ARCH[ally.archetype], danger: new Map() };
    // Evaluate as the ally will be after the cut-in: one action, free to attack.
    const saved = { actionsLeft: ally.actionsLeft, attacked: ally.attacked, rested: ally.rested, moved: ally.moved };
    Object.assign(ally, { actionsLeft: 1, attacked: false, rested: false, moved: true });
    for (const e of c.enemies) {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const dest = { x: e.pos!.x + dx, y: e.pos!.y + dy };
        if (!canCast(g, h, 'teleport', { hero: ally.id, dest })) continue;
        const best = bestAttackFrom(aCtx, dest, true);
        if (!best || best.step.t !== 'attack' && best.step.t !== 'cast') continue;
        if (best.score < 15) continue;
        const follow = best.step.t === 'attack' ? { target: best.step.target, opt: best.step.opt } : { spell: best.step.spell, args: best.step.args };
        out.push({ steps: [{ t: 'teleport', ally: ally.id, dest, follow }], score: best.score * 1.1 - dangerAt(aCtx, dest) * 0.3, why: `teleport ${ally.cls} onto ${e.cls}` });
      }
    }
    Object.assign(ally, saved);
  }
  return out;
}

export function botTurn(g: GameState, h: Hero) {
  const base = ARCH[h.archetype];
  const a = base.late && h.skills.has(base.late.after) ? { ...base, w: base.late.w } : base;
  shop(g, h, a);
  manaSurge(g, h) || null;
  if (hasStatus(h, 'poison') && g.players[h.player].gold >= 3 && h.hp <= 6) curePoison(g, h);
  if (!h.pos || h.actionsLeft <= 0) return;

  const goal = chooseGoal(g, h, a);
  const c: Ctx = { g, h, a, goal, goalField: field(g, goal.pos), danger: new Map(), enemies: enemiesOf(g, h).filter(e => visibleTo(g, e, h.team)) };
  // Hunter's mark before attacking, if a visible enemy is in range and a teammate is near
  if (h.skills.has('huntersMark') && h.mana >= SKILL.huntersMark.mana) {
    const t = c.enemies.find(e => cheb(e.pos!, h.pos!) <= weaponRange(g, h, false) && alliesOf(g, h).some(o => cheb(o.pos!, e.pos!) <= 5));
    if (t && huntersMark(g, h, t.id)) used(h, "hunter's mark");
  }

  const plans: Plan[] = [];
  const here = h.pos!;
  const r1 = destinations(g, h);
  const hp = h.hp;
  const two = h.actionsLeft >= 2;

  // A: attack from here, then (maybe) move
  const atkHere = bestAttackFrom(c, here, false);
  if (atkHere) {
    const hpAfter = hp - 0;
    let bestPos = here, bp = positionScore(c, here, hpAfter);
    if (two) for (const k of r1) { const p = posOf(g, k); const s = positionScore(c, p, hpAfter); if (s > bp) { bp = s; bestPos = p; } }
    plans.push({ steps: bestPos === here ? [atkHere.step] : [atkHere.step, { t: 'move', to: bestPos }], score: atkHere.score + bp, why: 'attack, then move' });
    if (two && MANA.restWithAttack) plans.push({ steps: [atkHere.step, { t: 'rest' }], score: atkHere.score + positionScore(c, here, hpAfter) + manaValue(c, 3 + (h.skills.has('deepRest') ? 2 : 0)) + Math.min(2, maxHp(g, h) - hp) * 0.6, why: 'attack, rest' });
  }
  // B: move, then attack (and C: move, then something else)
  const supHere = supportSteps(c);
  for (const k of r1) {
    const p = posOf(g, k);
    if (k === idx(g, here)) continue;
    const pos = positionScore(c, p, hp);
    if (two) {
      const atk = bestAttackFrom(c, p, true);
      if (atk) plans.push({ steps: [{ t: 'move', to: p }, atk.step], score: atk.score + pos, why: 'move, then attack' });
      if (MANA.restWithAttack || !h.attacked) plans.push({ steps: [{ t: 'move', to: p }, { t: 'rest' }], score: pos + manaValue(c, SKILL.manaSurge.amount + (h.skills.has('deepRest') ? 2 : 0)) + Math.min(2, maxHp(g, h) - hp) * 0.6, why: 'move, rest' });
      for (const s of supHere) if (s.step.t === 'cast' && ['invisibility', 'empower', 'inspire', 'iceBlock', 'fortify'].includes(s.step.spell)) plans.push({ steps: [s.step, { t: 'move', to: p }], score: s.score + pos, why: `${s.step.spell}, move` });
      // walk over and Resurrect a fallen ally
      if (h.skills.has('resurrection') && h.mana >= SKILL.resurrection.mana) for (const o of g.heroes) {
        if (o.team !== h.team || o.pos || !o.deathPos || cheb(o.deathPos, p) > SKILL.resurrection.range) continue;
        plans.push({ steps: [{ t: 'move', to: p }, { t: 'cast', spell: 'resurrection', args: { hero: o.id } }], score: 60 + pos, why: 'move, resurrect' });
      }
    }
  }
  // T: thief steps into a claimable territory, drops the Body double, and steps out
  if (two && h.cls === 'thief' && !g.landmarks.some(l => l.pending?.hero === h.id && l.pending.decoy)) {
    for (const k of r1) {
      const p = posOf(g, k);
      const lm = landmarkAt(g, p);
      if (lm === null) continue;
      const l = g.landmarks[lm];
      if (l.pending || (l.owner !== null && g.players[l.owner].team === h.team)) continue;
      const saved: Pos | null = h.pos; h.pos = p;
      const r1b = destinations(g, h);
      h.pos = saved;
      let bp: Pos | null = null, bs = -Infinity;
      for (const k2 of r1b) { const p2 = posOf(g, k2); const s2 = positionScore(c, p2, hp); if (s2 > bs) { bs = s2; bp = p2; } }
      if (bp) plans.push({ steps: [{ t: 'move', to: p }, { t: 'move', to: bp }], score: bs + 8 * a.w.claim, why: 'body double' });
    }
  }
  // D: two moves (double move toward the goal)
  if (two) {
    const r2 = destinations(g, h, 2 * moveBudget(g, h));
    let bestP: Pos | null = null, bs = -Infinity;
    for (const k of r2) { const p = posOf(g, k); const s = positionScore(c, p, hp); if (s > bs) { bs = s; bestP = p; } }
    if (bestP) plans.push({ steps: [{ t: 'move', to: bestP }], score: bs + 0.1, why: 'double move' });
  }
  // E: stay and rest / support here
  const stay = positionScore(c, here, hp);
  if (MANA.restWithAttack || !h.attacked) plans.push({ steps: [{ t: 'rest' }], score: stay + manaValue(c, 3 + (h.skills.has('deepRest') ? 2 : 0)) * (two ? 1.3 : 1) + Math.min(2, maxHp(g, h) - hp) * 0.6, why: 'rest' });
  for (const s of supHere) {
    plans.push({ steps: [s.step], score: s.score + stay, why: `support ${s.step.t === 'cast' ? s.step.spell : ''}` });
    if (two && atkHere) plans.push({ steps: [s.step, atkHere.step], score: s.score + atkHere.score + stay, why: 'support + attack' });
  }
  plans.push(...teleportPlans(c));
  plans.push({ steps: [], score: stay - 0.5, why: 'wait' });

  plans.sort((x, y) => y.score - x.score);
  for (const plan of plans) { if (execute(g, h, plan)) return; }
}

function execute(g: GameState, h: Hero, plan: Plan): boolean {
  let any = false;
  for (const s of plan.steps) {
    let ok = false;
    switch (s.t) {
      case 'move': ok = move(g, h, s.to); if (ok) placeDecoy(g, h); if (!ok) { // the destination may need two moves: step as far as possible
        const r2 = reachable(g, h, 2 * moveBudget(g, h)); const node = r2.get(idx(g, s.to));
        if (node) {
          let cur = idx(g, s.to);
          while (cur !== -1 && (r2.get(cur)!.dist > moveBudget(g, h) || !r2.get(cur)!.canEnd)) cur = r2.get(cur)!.prev;
          if (cur !== -1 && cur !== idx(g, h.pos!)) { ok = move(g, h, posOf(g, cur)); if (ok && h.actionsLeft > 0) move(g, h, s.to); }
        }
      } break;
      case 'attack': ok = attack(g, h, s.target, s.opt); break;
      case 'cast': ok = cast(g, h, s.spell, s.args); break;
      case 'double': ok = doublecast(g, h, s.s1, s.a1, s.s2, s.a2); break;
      case 'rest': ok = rest(g, h); break;
      case 'teleport': ok = cast(g, h, 'teleport', { hero: s.ally, dest: s.dest }, {
        onTeleport: ally => {
          if ('target' in s.follow) attack(g, ally, s.follow.target, s.follow.opt);
          else cast(g, ally, s.follow.spell, s.follow.args);
        },
      }); break;
    }
    if (!ok) return any;
    any = true;
    used(h, s.t === 'attack' ? `attack:${s.opt}` : s.t === 'cast' ? `cast:${s.spell}` : s.t === 'double' ? 'doublecast' : s.t);
    if (!h.pos || g.winner !== null) return true;
  }
  return any || plan.steps.length === 0;
}

export { targetPos, maxManaOf };

/** Respawn choice (Nick, 2026-10-01: base or any owned landmark). Simple rule: come
 *  back at the option closest to the nearest living enemy hero, so the bot rejoins
 *  the fight; the base wins ties. */
export function botRespawn(g: GameState, h: Hero, options: Pos[]): Pos {
  const foes = g.heroes.filter(o => o.team !== h.team && o.pos).map(o => o.pos!);
  if (!foes.length) return options[0];
  const near = (p: Pos) => Math.min(...foes.map(f => cheb(p, f)));
  return options.reduce((best, o) => (near(o) < near(best) ? o : best), options[0]);
}
