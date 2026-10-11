// Every action a hero or player can take, and how it resolves.
// Rule sources: Tactics Game doc, Skills by Class.md, Combat Rules.md, Map Generation.md.
// Functions return false (and change nothing) when an action is illegal.

import { HERO_STATS, WEAPONS, GEAR, SKILL, MANA, RESPAWN, ENGAGED, ELIMINATION, type ClassId, type WeaponId } from './numbers.ts';
import { resolveHit, type DefenderState, type Hit } from './combat.ts';
import { BUILDING, ECON, NPC, QUESTS } from './economy.ts';
import { SKILL_NODES, hybridUnlocked } from './skills.ts';
import { cheb, TERRAIN_OF, type Pos, type Terrain } from './mapgen.ts';
import {
  type GameState, type Hero, type Status, type StatusKind,
  idx, posOf, reveal, hasStatus, statusAmount, maxHp, maxManaOf, log,
} from './state.ts';

const DIRS: Pos[] = [
  { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 },
  { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
];

// =====================================================================
// Map queries
// =====================================================================

export const terrainAt = (g: GameState, p: Pos): Terrain => g.map.tiles[idx(g, p)];
export const inside = (g: GameState, p: Pos) => p.x >= 0 && p.y >= 0 && p.x < g.map.w && p.y < g.map.h;
export const alive = (h: Hero) => h.pos !== null;
export const enemiesOf = (g: GameState, h: Hero) => g.heroes.filter(o => o.team !== h.team && alive(o));
export const alliesOf = (g: GameState, h: Hero) => g.heroes.filter(o => o.team === h.team && o.id !== h.id && alive(o));

export function canStand(g: GameState, h: Hero, p: Pos): boolean {
  const t = terrainAt(g, p);
  return t === 'plain' || h.boots === t;
}

/** Something that blocks movement (and can't be stood on): a living hero, camp or lair boss. */
export function blocker(g: GameState, p: Pos): { kind: 'hero' | 'camp' | 'boss' | 'decoy'; id: number } | null {
  for (const o of g.heroes) if (o.pos && o.pos.x === p.x && o.pos.y === p.y) return { kind: 'hero', id: o.id };
  for (const l of g.landmarks) if (l.pending?.decoy && l.pending.decoy.x === p.x && l.pending.decoy.y === p.y) return { kind: 'decoy', id: l.idx };
  for (const c of g.camps) { const m = g.map.camps[c.idx]; if (c.respawn === 0 && m.x === p.x && m.y === p.y) return { kind: 'camp', id: c.idx }; }
  for (const l of g.landmarks) { const m = g.map.landmarks[l.idx]; if (m.bonus === 'lair' && l.bossRespawn === 0 && m.x === p.x && m.y === p.y) return { kind: 'boss', id: l.idx }; }
  return null;
}

export function landmarkAt(g: GameState, p: Pos): number | null {
  for (const l of g.landmarks) if (cheb(g.map.landmarks[l.idx], p) <= 1) return l.idx;
  return null;
}

export function onFriendlyRoad(g: GameState, h: Hero): boolean {
  if (!h.pos) return false;
  const i = idx(g, h.pos);
  return g.landmarks.some(l => l.owner !== null && g.players[l.owner].team === h.team && g.players[l.owner].buildings.has('stables') && l.road.includes(i));
}

export const isEngaged = (g: GameState, h: Hero) =>
  !!h.pos && g.heroes.some(o => o.team !== h.team && o.pos && cheb(o.pos, h.pos!) <= 1 && detected(g, o, h.team));

/** An enemy hero this hero's team can't see (invisible, undetected). */
const hiddenFrom = (g: GameState, o: Hero, team: number) => o.team !== team && !detected(g, o, team);

/** Polytopia-style cue: an undetected enemy is standing next to this hero. */
export const hiddenAdjacent = (g: GameState, h: Hero) =>
  !!h.pos && g.heroes.some(o => o.pos && cheb(o.pos, h.pos!) <= 1 && hiddenFrom(g, o, h.team));

export function moveBudget(g: GameState, h: Hero): number {
  let m = HERO_STATS[h.cls].move + (h.boots ? 1 : 0);
  if (h.startedOnRoad) m += 1;
  if (g.heroes.some(o => o.team === h.team && o.statuses.some(s => s.kind === 'huntBoost'))) m += 1;
  m -= statusAmount(h, 'chill') + statusAmount(h, 'pinned');
  // Engaged: a move that starts next to an enemy hero moves less. Once per turn, however
  // many enemies are adjacent, and never below 1 tile, so nobody is frozen in melee
  // (Nick, 2026-09-30).
  if (!h.engagedPaid && isEngaged(g, h)) m = Math.min(m, Math.max(1, m - ENGAGED.movePenalty));
  return Math.max(0, m);
}

/** Tiles reachable with ONE move action: tile index → { dist, prev, canEnd }.
 *  Allies can be walked through but not stopped on (canEnd = false). */
export function destinations(g: GameState, h: Hero, budget?: number): number[] {
  return [...reachable(g, h, budget).entries()].filter(([, v]) => v.canEnd).map(([k]) => k);
}

export function reachable(g: GameState, h: Hero, budget = moveBudget(g, h)): Map<number, { dist: number; prev: number; canEnd: boolean }> {
  const out = new Map<number, { dist: number; prev: number; canEnd: boolean }>();
  if (!h.pos) return out;
  const start = idx(g, h.pos);
  out.set(start, { dist: 0, prev: -1, canEnd: true });
  const q = [start];
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    const d = out.get(cur)!.dist;
    if (d >= budget) continue;
    const cp = posOf(g, cur);
    for (const dir of DIRS) {
      const np = { x: cp.x + dir.x, y: cp.y + dir.y };
      if (!inside(g, np) || !canStand(g, h, np)) continue;
      const ni = idx(g, np);
      if (out.has(ni)) continue;
      // Fog line (Nick, 2026-10-01): you can only walk on tiles your team has revealed,
      // so a move into the unknown stops at the edge. (Pushes and teleports aren't walking.)
      if (g.fog[h.team][ni] !== 1) continue;
      let b = blocker(g, np);
      // an enemy you can't see isn't there as far as planning goes; move() bumps into him
      if (b?.kind === 'hero' && hiddenFrom(g, g.heroes[b.id], h.team)) b = null;
      if (b && !(b.kind === 'hero' && g.heroes[b.id].team === h.team)) continue; // allies can be passed through
      out.set(ni, { dist: d + 1, prev: cur, canEnd: !b });
      q.push(ni);
    }
  }
  return out;
}

// =====================================================================
// Visibility
// =====================================================================

export function detected(g: GameState, target: Hero, byTeam: number): boolean {
  if (!hasStatus(target, 'invisible')) return true;
  // Standing next to him doesn't reveal him (that only shows a cue: hiddenAdjacent);
  // bumping into him does (move). Scout's eye sees him within vision.
  return g.heroes.some(o => o.team === byTeam && o.pos && target.pos &&
    o.skills.has('scoutsEye') && cheb(o.pos, target.pos) <= HERO_STATS[o.cls].vision);
}
export function visibleTo(g: GameState, target: Hero, team: number): boolean {
  return !!target.pos && g.fog[team][idx(g, target.pos)] === 1 && detected(g, target, team);
}

// =====================================================================
// Damage
// =====================================================================

function inOwnTerritory(g: GameState, h: Hero): boolean {
  if (!h.pos) return false;
  const l = landmarkAt(g, h.pos);
  return l !== null && g.landmarks[l].owner !== null && g.players[g.landmarks[l].owner!].team === h.team;
}

export function defenderState(g: GameState, t: Hero, attackerTeam: number): DefenderState {
  const pl = g.players[t.player];
  const refinery = pl.buildings.has('refinery') && t.shield > 0 ? GEAR.refineryBonus : 0;
  const shield = t.shield === 0 ? 0 : (t.shield === 2 ? GEAR.shieldUpgradedBlock : GEAR.shieldBlock) + refinery;
  let other = 0;
  if (t.skills.has('stoneskin')) other += SKILL.stoneskin.block;
  if (hasStatus(t, 'empower')) other += SKILL.empower.block;
  if (pl.buildings.has('territory3') && inOwnTerritory(g, t)) other += 1;
  const marked = t.statuses.some(s => s.kind === 'marked' && g.heroes[s.source].team === attackerTeam);
  return {
    shield, otherBlock: other, shattered: statusAmount(t, 'shattered'),
    onTerrain: !!t.pos && terrainAt(g, t.pos) !== 'plain',
    intimidate: t.skills.has('intimidate'), iceBlock: hasStatus(t, 'iceBlock'), marked,
  };
}

function flatBonus(g: GameState, h: Hero, spell: boolean): number {
  let f = 0;
  const weaponBased = !spell || h.cls === 'mage';
  if (weaponBased && h.skills.has('flaming')) f += SKILL.flaming.bonus;
  if (hasStatus(h, 'empower')) f += SKILL.empower.attack;
  if (hasStatus(h, 'inspire')) f += SKILL.inspire.bonus;
  if (h.skills.has('vengeance') && h.hp <= SKILL.vengeance.threshold * maxHp(g, h)) f += SKILL.vengeance.bonus;
  if (spell && g.players[h.player].buildings.has('monastery')) f += SKILL.monastery.spellBonus;
  if (g.players[h.player].buildings.has('territory3') && inOwnTerritory(g, h)) f += 1;
  return f;
}

export function weaponDamage(g: GameState, h: Hero): number {
  const w = WEAPONS[h.weapon];
  const smith = h.weaponUpgraded && h.cls !== 'mage' ? GEAR.blacksmithDamage : 0;
  const ref = g.players[h.player].buildings.has('refinery') ? GEAR.refineryBonus : 0;
  return w.damage + smith + ref;
}

export function weaponRange(g: GameState, h: Hero, moved: boolean): number {
  let r = WEAPONS[h.weapon].range;
  if (h.skills.has('takeAim') && !moved) r += 1;
  return r;
}

function damageHero(g: GameState, attacker: Hero | null, t: Hero, dmg: number) {
  if (!t.pos || dmg <= 0) return;
  // Phoenix blessing was removed; nothing prevents death here.
  t.hp -= dmg;
  g.stats.damageTaken[t.id] += dmg;
  if (attacker && attacker.team !== t.team) {
    g.stats.heroDamage[attacker.id] += dmg;
    if (g.firstContactRound === null) g.firstContactRound = g.round;
  }
  if (t.hp <= 0) kill(g, t, attacker);
}

export function kill(g: GameState, t: Hero, killer: Hero | null) {
  log(g, `${t.cls}#${t.id} killed${killer ? ` by ${killer.cls}#${killer.id}` : ''}`);
  t.deathPos = t.pos; t.pos = null; t.hp = 0; t.diedAtTurn = g.turnCounter;
  g.stats.deathsTotal++;
  if (t.deaths * RESPAWN.perDeath >= RESPAWN.max) g.stats.deathsAtCap++;
  t.deaths++; t.respawnIn = Math.min(RESPAWN.max, t.deaths * RESPAWN.perDeath);
  t.elimDeaths++;
  if (g.eliminationDeaths && t.elimDeaths >= g.eliminationDeaths) { t.eliminated = true; log(g, `${t.cls}#${t.id} eliminated`); }
  t.statuses = [];
  g.stats.deaths[t.id]++;
  // a lingering hero's claim fails when it dies; a thief's Body double keeps holding
  for (const l of g.landmarks) if (l.pending?.hero === t.id && !l.pending.decoy) l.pending = null;
  if (killer) {
    g.stats.kills[killer.id]++;
    const kp = g.players[killer.player];
    kp.heroKills++;
    if (!kp.quests.has('firstBlood')) { kp.quests.add('firstBlood'); gainGold(g, kp.id, QUESTS.firstBlood.gold); }
  }
  // Victory: every member of a team dead at the same time.
  for (const team of [0, 1]) {
    if (g.heroes.filter(h => h.team === team).every(h => !h.pos)) g.winner = 1 - team;
  }
}

function heal(g: GameState, healer: Hero, t: Hero, amount: number) {
  if (!t.pos) return;
  const before = t.hp;
  t.hp = Math.min(maxHp(g, t), t.hp + amount);
  g.stats.healing[healer.id] += t.hp - before;
}

function addStatus(t: Hero, s: Status) {
  const immune = hasStatus(t, 'fortify') && ['chill', 'pinned', 'paralysis', 'poison', 'shattered'].includes(s.kind);
  if (immune) return;
  if (['chill', 'pinned', 'paralysis', 'poison', 'shattered'].includes(s.kind) && hasStatus(t, 'ward')) {
    t.statuses = t.statuses.filter(x => x.kind !== 'ward');
    return;
  }
  // refresh rather than stack same-kind statuses from the same source
  t.statuses = t.statuses.filter(x => !(x.kind === s.kind && x.source === s.source));
  t.statuses.push(s);
}

// =====================================================================
// Movement
// =====================================================================

export function move(g: GameState, h: Hero, dest: Pos): boolean {
  if (!h.pos || h.actionsLeft <= 0) return false;
  const engagedAtStart = isEngaged(g, h);
  const r = reachable(g, h);
  const di = idx(g, dest);
  const node = r.get(di);
  if (!node || node.dist === 0 || !node.canEnd) return false;
  // path (for Firewall entry and reveal)
  const path: number[] = [];
  for (let c = di; c !== -1; c = r.get(c)!.prev) path.unshift(c);
  // Bumping into a hidden enemy anywhere on the path reveals him and cancels the
  // move; no action is spent (Nick, 2026-09-30).
  for (const pi of path.slice(1)) {
    const o = g.heroes.find(e => e.pos && idx(g, e.pos) === pi && hiddenFrom(g, e, h.team));
    if (o) { o.statuses = o.statuses.filter(s => s.kind !== 'invisible'); g.events.push({ t: 'reveal', hero: o.id, by: h.id }); return false; }
  }
  const from = h.pos;
  const dx = dest.x - from.x, dy = dest.y - from.y;
  const straight = (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) && node.dist === cheb(from, dest);
  h.straightRun = straight ? h.straightRun + node.dist : 0;
  h.pos = { ...dest };
  h.actionsLeft--;
  h.moved = true;
  if (!h.engagedPaid && engagedAtStart) h.engagedPaid = true;
  checkExplorer(g, h);
  for (const pi of path) reveal(g, h.team, posOf(g, pi), 1);
  reveal(g, h.team, dest, HERO_STATS[h.cls].vision);
  // Firewall: entering an enemy zone
  for (const z of g.zones) if (z.team !== h.team && path.slice(1).some(pi => z.tiles.includes(pi))) {
    damageHero(g, g.heroes[z.caster], h, Math.max(1, z.damage - (terrainAt(g, h.pos) !== 'plain' ? 1 : 0)));
    if (!h.pos) break;
  }
  return true;
}

// =====================================================================
// Attacks
// =====================================================================

export type AttackOpt = 'weapon' | 'holyStrike' | 'heavyStrike' | 'charge' | 'doubleStrike' | 'pinningShot' | 'arrowRain';
// Mana is read live (not copied at load) so simulations can override SKILL numbers.
const ATTACK_SKILL: Record<AttackOpt, { node?: string; readonly mana: number }> = {
  weapon: { mana: 0 },
  holyStrike: { node: 'holyStrike', get mana() { return SKILL.holyStrike.mana; } },
  heavyStrike: { node: 'heavyStrike', get mana() { return SKILL.heavyStrike.mana; } },
  charge: { node: 'charge', get mana() { return SKILL.charge.mana; } },
  doubleStrike: { node: 'doubleStrike', get mana() { return SKILL.doubleStrike.mana; } },
  pinningShot: { node: 'pinningShot', get mana() { return SKILL.pinningShot.mana; } },
  arrowRain: { node: 'arrowRain', get mana() { return SKILL.arrowRain.mana; } },
};

export type Target = { kind: 'hero'; id: number } | { kind: 'camp'; id: number } | { kind: 'boss'; id: number } | { kind: 'decoy'; id: number };

export function targetPos(g: GameState, t: Target): Pos | null {
  if (t.kind === 'hero') return g.heroes[t.id].pos;
  if (t.kind === 'camp') return g.camps[t.id].respawn === 0 ? g.map.camps[t.id] : null;
  if (t.kind === 'decoy') return g.landmarks[t.id].pending?.decoy ?? null;
  return g.landmarks[t.id].bossRespawn === 0 ? g.map.landmarks[t.id] : null;
}

export function canAttack(g: GameState, h: Hero, t: Target, opt: AttackOpt = 'weapon'): boolean {
  if (!h.pos || h.actionsLeft <= 0 || h.attacked || (h.rested && !MANA.restWithAttack)) return false;
  const sk = ATTACK_SKILL[opt];
  if (sk.node && !h.skills.has(sk.node)) return false;
  if (h.mana < sk.mana) return false;
  const tp = targetPos(g, t);
  if (!tp) return false;
  if (t.kind === 'hero') {
    const th = g.heroes[t.id];
    if (th.team === h.team || !visibleTo(g, th, h.team)) return false;
  }
  if (t.kind === 'boss') {
    const owner = g.landmarks[t.id].owner;
    if (owner === null || g.players[owner].team !== h.team) return false; // only the lair's owner team
  }
  if (t.kind === 'decoy') {
    const pend = g.landmarks[t.id].pending!;
    if (g.players[pend.player].team === h.team || !g.fog[h.team][idx(g, tp)]) return false;
  }
  let range = weaponRange(g, h, !!h.moved);
  if (t.kind === 'hero' && g.heroes[t.id].skills.has('windchill') && range > 1) range -= 1;
  return cheb(h.pos, tp) <= range;
}

/** The hit an attack lands, and how many times. `chargeTiles`: straight tiles run before a Charge. */
function attackHit(g: GameState, h: Hero, opt: AttackOpt, chargeTiles: number): { hit: Hit; times: number } {
  const fromInvis = hasStatus(h, 'invisible');
  let skillBonus = 0, times = WEAPONS[h.weapon].hits;
  if (opt === 'holyStrike') skillBonus = SKILL.holyStrike.bonus;
  if (opt === 'heavyStrike') skillBonus = SKILL.heavyStrike.bonus;
  if (opt === 'charge') skillBonus = Math.min(SKILL.charge.max, chargeTiles * SKILL.charge.perTile);
  if (opt === 'doubleStrike') times *= 2;
  let flat = flatBonus(g, h, false);
  if (fromInvis && h.skills.has('ambush')) flat += SKILL.ambush.bonus;
  if (fromInvis && h.skills.has('doubleDagger')) times *= 2;
  return { hit: { base: weaponDamage(g, h), skillBonus, flat, isSpell: false, armorPierce: h.skills.has('armorPierce') }, times };
}

/** Who an attack hits: the target; Flail = every adjacent enemy; Arrow Rain = every enemy in range. */
function attackTargets(g: GameState, h: Hero, from: Pos, moved: boolean, t: Target, opt: AttackOpt): Target[] {
  const targets: Target[] = [t];
  if (h.weapon === 'flail' || opt === 'arrowRain') {
    const range = opt === 'arrowRain' ? weaponRange(g, h, moved) : 1;
    for (const e of enemiesOf(g, h)) if ((t.kind !== 'hero' || e.id !== t.id) && visibleTo(g, e, h.team) && cheb(e.pos!, from) <= range) targets.push({ kind: 'hero', id: e.id });
  }
  return targets;
}

const OPEN: DefenderState = { shield: 0, otherBlock: 0, shattered: 0, onTerrain: false, intimidate: false, iceBlock: false, marked: false };

/** One unit an action would affect (for the app's preview): damage dealt, or HP healed / bonus given. */
/** One unit an action would affect (for the app's preview): damage dealt (capped at its HP), or HP healed / bonus
 *  given. `full`: the damage before the HP cap; `raw`: before the target's defences (block, terrain…). */
export interface Effect { pos: Pos; amount: number; kills: boolean; help: boolean; full?: number; raw?: number }

/** Every unit this attack would hit from where the hero stands, and for how much. */
export function attackEffects(g: GameState, h: Hero, t: Target, opt: AttackOpt = 'weapon'): Effect[] {
  if (!h.pos || !canAttack(g, h, t, opt)) return [];
  const { hit, times } = attackHit(g, h, opt, h.straightRun);
  const out: Effect[] = [];
  for (const tt of attackTargets(g, h, h.pos, !!h.moved, t, opt)) {
    const p = targetPos(g, tt)!;
    if (tt.kind === 'decoy') { out.push({ pos: p, amount: 1, kills: true, help: false }); continue; }
    const hp = tt.kind === 'hero' ? g.heroes[tt.id].hp : tt.kind === 'camp' ? g.camps[tt.id].hp : g.landmarks[tt.id].bossHp;
    const d = resolveHit(hit, tt.kind === 'hero' ? defenderState(g, g.heroes[tt.id], h.team) : OPEN) * times;
    out.push({ pos: p, amount: Math.min(d, hp), kills: d >= hp, help: false, full: d, raw: resolveHit(hit, OPEN) * times });
  }
  return out;
}

interface NpcTarget { hp: number; dmg: number }

export function attack(g: GameState, h: Hero, t: Target, opt: AttackOpt = 'weapon'): boolean {
  if (!canAttack(g, h, t, opt)) return false;
  const sk = ATTACK_SKILL[opt];
  h.mana -= sk.mana;
  h.actionsLeft--;
  h.attacked = true;
  const { hit, times } = attackHit(g, h, opt, h.straightRun); // before invisibility drops
  const fromInvis = hasStatus(h, 'invisible');
  h.statuses = h.statuses.filter(s => s.kind !== 'invisible');

  const all = attackTargets(g, h, h.pos!, !!h.moved, t, opt);
  g.events.push({ t: 'attack', hero: h.id, opt, from: { ...h.pos! }, targets: all.map(x => ({ ...targetPos(g, x)! })), fromInvis });
  let hits = 0;
  for (const tt of all) {
    if (tt.kind === 'hero') {
      const th = g.heroes[tt.id];
      for (let i = 0; i < times && th.pos; i++) {
        const dmg = resolveHit(hit, defenderState(g, th, h.team));
        if (i === 0 && dmg < resolveHit(hit, OPEN)) g.events.push({ t: 'hit', pos: { ...th.pos }, kind: dmg <= 1 ? 'chip' : 'block' });
        damageHero(g, h, th, dmg);
        hits++;
        if (th.skills.has('burningAura') && h.pos) { g.events.push({ t: 'burn', hero: h.id }); damageHero(g, th, h, SKILL.burningAura.damage); }
        if (h.skills.has('pickpocket')) { const s = Math.min(g.players[th.player].gold, 2); g.players[th.player].gold -= s; g.players[h.player].gold += s; if (s && th.pos) g.events.push({ t: 'coin', pos: { ...th.pos } }); }
        if (opt === 'holyStrike') heal(g, h, h, SKILL.holyStrike.healOnHit);
      }
      // after the whole action
      if (th.pos) {
        if (h.skills.has('chilling')) addStatus(th, { kind: 'chill', turns: 1, clock: th.id, source: h.id, amount: 1 });
        if (h.skills.has('shattering')) addStatus(th, { kind: 'shattered', turns: 2, clock: th.id, source: h.id, amount: 1 });
        if (opt === 'pinningShot') addStatus(th, { kind: 'pinned', turns: 1, clock: th.id, source: h.id, amount: 2 });
        if (th.skills.has('counterattack') && h.pos && cheb(h.pos, th.pos) <= 1 && WEAPONS[h.weapon].range === 1) {
          g.events.push({ t: 'counter', hero: th.id, target: { ...h.pos } });
          const cdmg = resolveHit({ base: Math.ceil(weaponDamage(g, th) / 2), skillBonus: 0, flat: 0, isSpell: false }, defenderState(g, h, th.team));
          damageHero(g, th, h, cdmg);
        }
      }
    } else if (tt.kind === 'decoy') {
      g.landmarks[tt.id].pending = null; // 1 HP: any hit destroys it and the claim
    } else {
      npcHit(g, h, tt, hit, times);
    }
  }
  return true;
}

/** Where the thief's Body double would go if placed now (a free plains tile of the territory he stands
 *  in, not under him), or null if he can't place one here. */
export function decoySpot(g: GameState, h: Hero): Pos | null {
  if (h.cls !== 'thief' || !h.pos) return null;
  const lm = landmarkAt(g, h.pos);
  if (lm === null) return null;
  const l = g.landmarks[lm];
  const ownerTeam = l.owner === null ? -1 : g.players[l.owner].team;
  if (ownerTeam === h.team || l.pending) return null;
  if (g.landmarks.some(x => x.pending?.hero === h.id && x.pending.decoy)) return null;
  const c = g.map.landmarks[lm];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const q = { x: c.x + dx, y: c.y + dy };
    if (terrainAt(g, q) === 'plain' && !blocker(g, q)) return q;
  }
  return null;
}

/** Thief's Body double (free): leave a 1 HP decoy in this territory to hold the claim. One at a time. */
export function placeDecoy(g: GameState, h: Hero): boolean {
  const spot = decoySpot(g, h);
  if (!spot) return false;
  g.landmarks[landmarkAt(g, h.pos!)!].pending = { player: h.player, hero: h.id, decoy: spot };
  return true;
}

function npcHit(g: GameState, h: Hero, t: Target, hit: Hit, times: number) {
  const open: DefenderState = { shield: 0, otherBlock: 0, shattered: 0, onTerrain: false, intimidate: false, iceBlock: false, marked: false };
  const npc: NpcTarget = t.kind === 'camp'
    ? { hp: g.camps[t.id].hp, dmg: NPC[g.map.camps[t.id].kind].dmg }
    : { hp: g.landmarks[t.id].bossHp, dmg: NPC.lair.dmg };
  let dealt = 0;
  for (let i = 0; i < times && npc.hp - dealt > 0; i++) dealt += resolveHit(hit, open);
  g.stats.npcDamage[h.id] += Math.min(dealt, npc.hp);
  const left = npc.hp - dealt;
  if (t.kind === 'camp') g.camps[t.id].hp = Math.max(0, left); else g.landmarks[t.id].bossHp = Math.max(0, left);
  if (left <= 0) { npcKilled(g, h, t); return; }
  // NPCs only hit back at adjacent attackers, once per attack action
  const tp = targetPos(g, t)!;
  if (h.pos && cheb(h.pos, tp) <= 1) {
    g.events.push({ t: 'npcAttack', npc: { ...tp }, target: { ...h.pos } });
    const dmg = resolveHit({ base: npc.dmg, skillBonus: 0, flat: 0, isSpell: false }, defenderState(g, h, -1));
    damageHero(g, null, h, dmg);
  }
}

function npcKilled(g: GameState, h: Hero, t: Target) {
  const pl = g.players[h.player];
  const kind = t.kind === 'camp' ? g.map.camps[t.id].kind : 'lair';
  const r = NPC[kind];
  const mult = pl.buildings.has('arena') ? 1 + ECON.arenaBonus : 1;
  pl.npcKills++;
  gainXp(g, pl.id, Math.floor(r.xp * mult));
  gainGold(g, pl.id, Math.floor(r.gold * mult) + (pl.quests.has('hunter') ? QUESTS.hunter.goldPerKill : 0));
  if (!pl.quests.has('hunter') && pl.npcKills >= QUESTS.hunter.kills) pl.quests.add('hunter');
  if (t.kind === 'camp') { g.camps[t.id].respawn = g.round + NPC.respawnTurns; }
  else {
    const l = g.landmarks[t.id];
    l.bossRespawn = g.round + NPC.lairRespawnTurns;
    giveChestItem(g, h);
  }
}

// Lair chest: a pre-upgraded item the owner's team can use.
function giveChestItem(g: GameState, h: Hero) {
  const teamClasses = new Set(g.heroes.filter(o => o.team === h.team).map(o => o.cls));
  const pool: string[] = ['shield', 'boots'];
  for (const w of Object.values(WEAPONS)) if (teamClasses.has(w.owner)) pool.push(w.id);
  const item = pool[(g.round * 7 + h.id * 13) % pool.length]; // deterministic "random"
  if (h.inventory.length >= ECON.bagSize) {
    // bag full: the item is sold on the spot (placeholder rule, 2026-10-01)
    gainGold(g, h.player, sellPrice(item, true));
    log(g, `${h.cls}#${h.id} opened a lair chest with a full bag: sold upgraded ${item}`);
    return;
  }
  h.inventory.push({ item, upgraded: true });
  log(g, `${h.cls}#${h.id} opened a lair chest: upgraded ${item}`);
}

// =====================================================================
// Previews (for bots): what an attack would do, without doing it
// =====================================================================

export interface Preview { dmg: number; kills: number; selfDmg: number; npcReward: number }

/** Preview an attack as if the hero stood at `from` (having moved or not). */
export function previewAttack(g: GameState, h: Hero, from: Pos, moved: boolean, t: Target, opt: AttackOpt = 'weapon'): Preview | null {
  const saved = { pos: h.pos, moved: h.moved };
  h.pos = from; h.moved = moved;
  try {
    if (!canAttack(g, h, t, opt)) return null;
    const { hit, times } = attackHit(g, h, opt, moved ? cheb(saved.pos!, from) : 0);
    const out: Preview = { dmg: 0, kills: 0, selfDmg: 0, npcReward: 0 };
    for (const tt of attackTargets(g, h, from, moved, t, opt)) {
      if (tt.kind === 'hero') {
        const th = g.heroes[tt.id];
        const d = resolveHit(hit, defenderState(g, th, h.team)) * times;
        out.dmg += Math.min(d, th.hp);
        if (d >= th.hp) out.kills++;
        if (th.skills.has('burningAura')) out.selfDmg += times;
        if (d < th.hp && th.skills.has('counterattack') && cheb(from, th.pos!) <= 1 && WEAPONS[h.weapon].range === 1)
          out.selfDmg += resolveHit({ base: Math.ceil(weaponDamage(g, th) / 2), skillBonus: 0, flat: 0, isSpell: false }, defenderState(g, h, th.team));
      } else if (tt.kind === 'decoy') {
        out.dmg += 1; out.npcReward += 12; // breaking an enemy claim
      } else {
        const hp = tt.kind === 'camp' ? g.camps[tt.id].hp : g.landmarks[tt.id].bossHp;
        const npcDmg = tt.kind === 'camp' ? NPC[g.map.camps[tt.id].kind].dmg : NPC.lair.dmg;
        const open: DefenderState = { shield: 0, otherBlock: 0, shattered: 0, onTerrain: false, intimidate: false, iceBlock: false, marked: false };
        const d = resolveHit(hit, open) * times;
        out.dmg += Math.min(d, hp);
        if (d >= hp) {
          const kind = tt.kind === 'camp' ? g.map.camps[tt.id].kind : 'lair';
          out.npcReward += NPC[kind].xp + NPC[kind].gold + (kind === 'lair' ? 10 : 0);
        } else if (cheb(from, targetPos(g, tt)!) <= 1) out.selfDmg += resolveHit({ base: npcDmg, skillBonus: 0, flat: 0, isSpell: false }, defenderState(g, h, -1));
      }
    }
    return out;
  } finally { h.pos = saved.pos; h.moved = saved.moved; }
}

/** Preview a damaging spell cast from `from`. */
export function previewSpell(g: GameState, h: Hero, from: Pos, s: Spell, a: CastArgs, doublecastSecond = false): Preview | null {
  const saved = h.pos;
  h.pos = from;
  try {
    if (!DAMAGING.has(s) || !canCast(g, h, s, a, doublecastSecond)) return null;
    const out: Preview = { dmg: 0, kills: 0, selfDmg: 0, npcReward: 0 };
    const flat = flatBonus(g, h, true);
    const one = (th: Hero, base: number) => {
      const d = resolveHit({ base, skillBonus: 0, flat, isSpell: true }, defenderState(g, th, h.team));
      out.dmg += Math.min(d, th.hp); if (d >= th.hp) out.kills++;
    };
    if (a.npc) {
      const base = { mageBolt: SKILL.mageBolt.damage, lightning: SKILL.lightning.damage, poison: SKILL.poison.damage, nature: SKILL.nature.damage }[s as 'mageBolt'];
      const open: DefenderState = { shield: 0, otherBlock: 0, shattered: 0, onTerrain: false, intimidate: false, iceBlock: false, marked: false };
      const hp = a.npc.kind === 'camp' ? g.camps[a.npc.id].hp : g.landmarks[a.npc.id].bossHp;
      const d = resolveHit({ base, skillBonus: 0, flat, isSpell: true }, open);
      out.dmg += Math.min(d, hp);
      if (d >= hp) { const kind = a.npc.kind === 'camp' ? g.map.camps[a.npc.id].kind : 'lair'; out.npcReward += NPC[kind].xp + NPC[kind].gold + (kind === 'lair' ? 10 : 0); }
      return out;
    }
    const vis = enemiesOf(g, h).filter(e => visibleTo(g, e, h.team));
    const tp = a.hero !== undefined ? g.heroes[a.hero].pos! : a.target!;
    switch (s) {
      case 'mageBolt': one(g.heroes[a.hero!], SKILL.mageBolt.damage); break;
      case 'lightning': one(g.heroes[a.hero!], SKILL.lightning.damage); out.dmg += 3; break; // paralysis worth ~3
      case 'poison': one(g.heroes[a.hero!], SKILL.poison.damage); out.dmg += 4; break;       // damage over time
      case 'nature': one(g.heroes[a.hero!], SKILL.nature.damage); break;
      case 'fireball': for (const e of vis) if (cheb(e.pos!, tp) <= 1) one(e, SKILL.fireball.damage); break;
      case 'quake': for (const e of vis) { const d = cheb(e.pos!, from); if (d >= 1 && d <= 3) one(e, SKILL.quake.damage[d - 1]); } break;
      case 'smite': for (const e of vis) if ((e.pos!.x === from.x || e.pos!.y === from.y) && cheb(e.pos!, from) <= 2 && cheb(e.pos!, from) >= 1) one(e, SKILL.smite.damage); break;
      default: return null;
    }
    return out;
  } finally { h.pos = saved; }
}

// =====================================================================
// Spells
// =====================================================================

export type Spell =
  | 'mageBolt' | 'fireball' | 'firewall' | 'tidalWave' | 'quake' | 'lightning' | 'poison' | 'nature' | 'smite'
  | 'selfHeal' | 'crossHeal' | 'resurrection' | 'empower' | 'cleanse' | 'fortify' | 'iceBlock' | 'inspire'
  | 'invisibility' | 'teleport';

export const DAMAGING: Set<Spell> = new Set(['mageBolt', 'fireball', 'firewall', 'tidalWave', 'quake', 'lightning', 'poison', 'nature', 'smite']);

export const SPELL_INFO: Record<Spell, { mana: number; node: string | null; range: number }> = {
  mageBolt: { mana: SKILL.mageBolt.mana, node: null, range: SKILL.mageBolt.range },
  fireball: { mana: SKILL.fireball.mana, node: 'fireball', range: SKILL.fireball.range },
  firewall: { mana: SKILL.firewall.mana, node: 'firewall', range: SKILL.firewall.range },
  tidalWave: { mana: SKILL.tidalWave.mana, node: 'tidalWave', range: 1 },
  quake: { mana: SKILL.quake.mana, node: 'quake', range: 0 },
  lightning: { mana: SKILL.lightning.mana, node: 'lightning', range: SKILL.lightning.range },
  poison: { mana: SKILL.poison.mana, node: 'poison', range: SKILL.poison.range },
  nature: { mana: SKILL.nature.mana, node: 'nature', range: SKILL.nature.range },
  smite: { mana: SKILL.smite.mana, node: 'smite', range: 0 },
  selfHeal: { mana: SKILL.selfHeal.mana, node: 'selfHeal', range: 0 },
  crossHeal: { mana: SKILL.crossHeal.mana, node: 'crossHeal', range: 0 },
  resurrection: { mana: SKILL.resurrection.mana, node: 'resurrection', range: SKILL.resurrection.range },
  empower: { mana: SKILL.empower.mana, node: 'empower', range: 3 },
  cleanse: { mana: SKILL.cleanse.mana, node: 'cleanse', range: 3 },
  fortify: { mana: SKILL.fortify.mana, node: 'fortify', range: 2 },
  iceBlock: { mana: SKILL.iceBlock.mana, node: 'iceBlock', range: 0 },
  inspire: { mana: SKILL.inspire.mana, node: 'inspire', range: 4 },
  invisibility: { mana: SKILL.invisibility.mana, node: 'invisibility', range: 0 },
  teleport: { mana: SKILL.teleport.mana, node: 'teleport', range: 3 },
};

export function spellRange(h: Hero, s: Spell): number {
  const r = SPELL_INFO[s].range;
  return h.weapon === 'orb' && DAMAGING.has(s) && r > 0 ? r + 1 + (h.weaponUpgraded ? 1 : 0) : r;
}

export interface CastArgs { target?: Pos; hero?: number; npc?: Target; dir?: number; dest?: Pos; open?: number }
const SINGLE_TARGET: Set<Spell> = new Set(['mageBolt', 'lightning', 'poison', 'nature']);

export function canCast(g: GameState, h: Hero, s: Spell, a: CastArgs, doublecastSecond = false): boolean {
  const info = SPELL_INFO[s];
  if (!h.pos) return false;
  if (!doublecastSecond && h.actionsLeft <= 0) return false;
  if (s === 'mageBolt' && h.cls !== 'mage') return false;
  if (info.node && !h.skills.has(info.node)) return false;
  if (h.mana < info.mana) return false;
  if (DAMAGING.has(s) && h.attacked && !doublecastSecond) return false;
  if (DAMAGING.has(s) && h.rested && !MANA.restWithAttack) return false;
  const range = spellRange(h, s);
  if (a.npc) {
    if (!SINGLE_TARGET.has(s)) return false;
    const np = targetPos(g, a.npc);
    if (!np || cheb(h.pos, np) > range) return false;
    if (a.npc.kind === 'boss') { const o = g.landmarks[a.npc.id].owner; if (o === null || g.players[o].team !== h.team) return false; }
    return true;
  }
  // (a dead hero has no position: Resurrection targets the body instead)
  const tp = a.hero !== undefined ? (s === 'resurrection' ? g.heroes[a.hero].deathPos : g.heroes[a.hero].pos) : a.target;
  if (range > 0 && s !== 'tidalWave' && s !== 'inspire') { // Inspire's range is its radius around the caster
    if (!tp || cheb(h.pos, tp) > range) return false;
  }
  if (a.hero !== undefined && s !== 'resurrection') {
    const th = g.heroes[a.hero];
    if (!th.pos) return false;
    const hostile = ['mageBolt', 'lightning', 'poison', 'nature'].includes(s);
    if (hostile && (th.team === h.team || !visibleTo(g, th, h.team))) return false;
    if (!hostile && th.team !== h.team) return false;
  }
  if (s === 'invisibility' && enemiesOf(g, h).some(e => cheb(e.pos!, h.pos!) <= SKILL.invisibility.noEnemyWithin)) return false;
  if (s === 'resurrection') {
    const th = a.hero !== undefined ? g.heroes[a.hero] : null;
    if (!th || th.pos || !th.deathPos || th.team !== h.team || cheb(th.deathPos, h.pos) > SKILL.resurrection.range || blocker(g, th.deathPos)) return false;
  }
  if (s === 'teleport') {
    const th = a.hero !== undefined ? g.heroes[a.hero] : null;
    if (!th || !th.pos || th.id === h.id || !a.dest || cheb(a.dest, h.pos) > 5 || !canStand(g, th, a.dest) || blocker(g, a.dest) || !g.fog[h.team][idx(g, a.dest)]) return false;
  }
  return true;
}

/** Telepuppet (id 'teleport'): the ally's own turn state, put back after its one cut-in action. */
export interface CutInSaved { actionsLeft: number; attacked: boolean; moved: boolean; rested: boolean; straightRun: number }
/** Telepuppet's cut-in is over: the ally's own turn state comes back. */
export function endCutIn(th: Hero, saved: CutInSaved) { Object.assign(th, saved); }

/** Cast a spell. For Telepuppet, the caster takes the ally's one action through `onTeleport`; it may
 *  return 'later' (a person picks the action: the caller ends the cut-in with endCutIn). */
export function cast(g: GameState, h: Hero, s: Spell, a: CastArgs, opts: { doublecastSecond?: boolean; onTeleport?: (ally: Hero, saved: CutInSaved) => void | 'later' } = {}): boolean {
  if (!canCast(g, h, s, a, opts.doublecastSecond)) return false;
  {
    // for the app's animations: where it was cast, at what, and (Tidal wave, Teleport) which tiles
    const at = a.npc ? targetPos(g, a.npc) : a.hero !== undefined ? (s === 'resurrection' ? g.heroes[a.hero].deathPos : g.heroes[a.hero].pos) : a.target;
    const tiles = s === 'tidalWave' ? tidalTiles(g, h.pos!, a.dir ?? 0) : s === 'teleport' && a.dest ? [{ ...a.dest }] : undefined;
    g.events.push({ t: 'cast', hero: h.id, spell: s, from: { ...h.pos! }, at: at ? { ...at } : undefined, tiles });
  }
  h.mana -= SPELL_INFO[s].mana;
  if (!opts.doublecastSecond) h.actionsLeft--;
  if (DAMAGING.has(s)) { h.attacked = true; h.statuses = h.statuses.filter(x => x.kind !== 'invisible'); }
  const hitE = (t: { kind: 'hero'; id: number } | { kind: 'camp'; id: number } | { kind: 'boss'; id: number }, dmg: number) => {
    const hit: Hit = { base: dmg, skillBonus: 0, flat: flatBonus(g, h, true), isSpell: true };
    if (t.kind === 'hero') { const th = g.heroes[t.id]; const d = resolveHit(hit, defenderState(g, th, h.team)); damageHero(g, h, th, d); return d; }
    npcHit(g, h, t, hit, 1); return 0;
  };
  const enemiesAround = (c: Pos, pred: (p: Pos) => boolean) => {
    const out: ({ kind: 'hero'; id: number } | { kind: 'camp'; id: number })[] = [];
    for (const e of enemiesOf(g, h)) if (visibleTo(g, e, h.team) && pred(e.pos!)) out.push({ kind: 'hero', id: e.id });
    for (const c2 of g.camps) if (c2.respawn === 0 && pred(g.map.camps[c2.idx])) out.push({ kind: 'camp', id: c2.idx });
    return out;
  };
  if (a.npc) {
    const base = { mageBolt: SKILL.mageBolt.damage, lightning: SKILL.lightning.damage, poison: SKILL.poison.damage, nature: SKILL.nature.damage }[s as 'mageBolt'];
    if (a.npc.kind === 'decoy') g.landmarks[a.npc.id].pending = null; // 1 HP: any hit destroys it
    else hitE(a.npc, base);
    return true;
  }
  const tp = a.hero !== undefined ? g.heroes[a.hero].pos! : a.target;
  switch (s) {
    case 'mageBolt': hitE({ kind: 'hero', id: a.hero! }, SKILL.mageBolt.damage); break;
    case 'lightning': {
      hitE({ kind: 'hero', id: a.hero! }, SKILL.lightning.damage);
      const th = g.heroes[a.hero!]; if (th.pos) addStatus(th, { kind: 'paralysis', turns: 1, clock: th.id, source: h.id, amount: 1 });
      break;
    }
    case 'poison': {
      hitE({ kind: 'hero', id: a.hero! }, SKILL.poison.damage);
      const th = g.heroes[a.hero!]; if (th.pos) addStatus(th, { kind: 'poison', turns: 999, clock: th.id, source: h.id, amount: SKILL.poison.perTurn });
      break;
    }
    case 'nature': { const d = hitE({ kind: 'hero', id: a.hero! }, SKILL.nature.damage); heal(g, h, h, Math.ceil(d / 2)); break; }
    case 'fireball': for (const t of enemiesAround(tp!, p => cheb(p, tp!) <= 1)) hitE(t, SKILL.fireball.damage); break;
    case 'quake': for (const t of enemiesAround(h.pos!, p => inSpellArea('quake', h.pos!, p))) {
      const d = cheb(h.pos!, t.kind === 'hero' ? g.heroes[t.id].pos! : g.map.camps[t.id]);
      hitE(t, SKILL.quake.damage[d - 1]);
    } break;
    case 'smite': for (const t of enemiesAround(h.pos!, p => inSpellArea('smite', h.pos!, p))) hitE(t, SKILL.smite.damage);
      h.statuses = h.statuses.filter(x => !['chill', 'pinned', 'paralysis', 'poison', 'shattered'].includes(x.kind));
      break;
    case 'tidalWave': {
      const dir = DIRS[a.dir ?? 0];
      for (let k = 1; k <= 3; k++) {
        const p = { x: h.pos!.x + dir.x * k, y: h.pos!.y + dir.y * k };
        if (!inside(g, p)) break;
        const b = blocker(g, p);
        if (b?.kind === 'hero' && g.heroes[b.id].team !== h.team) {
          const th = g.heroes[b.id];
          hitE({ kind: 'hero', id: th.id }, SKILL.tidalWave.damage);
          if (th.pos && !hasStatus(th, 'fortify')) for (let push = 0; push < SKILL.tidalWave.push; push++) {
            const cur: Pos = th.pos!;
            const np: Pos = { x: cur.x + dir.x, y: cur.y + dir.y };
            if (!inside(g, np) || !canStand(g, th, np) || blocker(g, np)) break;
            th.pos = np;
          }
        }
      }
      break;
    }
    case 'firewall': {
      const center = a.hero !== undefined ? g.heroes[a.hero].pos! : h.pos!;
      const tiles = firewallTiles(g, center, a.open ?? 0).map(p => idx(g, p));
      g.zones = g.zones.filter(z => z.caster !== h.id);
      g.zones.push({ tiles, team: h.team, caster: h.id, damage: SKILL.firewall.damage });
      break;
    }
    case 'selfHeal': heal(g, h, h, SKILL.selfHeal.heal); break;
    case 'crossHeal':
      for (const o of [h, ...alliesOf(g, h)]) if (o.pos && inSpellArea('crossHeal', h.pos!, o.pos)) heal(g, h, o, SKILL.crossHeal.heal);
      break;
    case 'resurrection': {
      const th = g.heroes[a.hero!];
      th.pos = { ...th.deathPos! }; th.hp = Math.ceil(maxHp(g, th) / 2); th.respawnIn = 0; th.deathPos = null;
      th.eliminated = false; // saved in time
      if (ELIMINATION.resurrectionErases) th.elimDeaths--; // ...and this death no longer counts toward elimination
      g.stats.healing[h.id] += th.hp;
      break;
    }
    case 'empower': addStatus(g.heroes[a.hero ?? h.id], { kind: 'empower', turns: SKILL.empower.turns, clock: h.id, source: h.id }); break;
    case 'cleanse': { const th = g.heroes[a.hero ?? h.id]; th.statuses = th.statuses.filter(x => !['chill', 'pinned', 'paralysis', 'poison', 'shattered'].includes(x.kind)); addStatus(th, { kind: 'ward', turns: 99, clock: th.id, source: h.id }); break; }
    case 'fortify': addStatus(g.heroes[a.hero ?? h.id], { kind: 'fortify', turns: 1, clock: h.id, source: h.id }); break;
    case 'iceBlock': addStatus(h, { kind: 'iceBlock', turns: 1, clock: h.id, source: h.id }); break;
    case 'inspire': for (const o of [h, ...alliesOf(g, h)]) if (inSpellArea('inspire', h.pos!, o.pos!)) addStatus(o, { kind: 'inspire', turns: SKILL.inspire.turns, clock: h.id, source: h.id }); break;
    case 'invisibility': addStatus(h, { kind: 'invisible', turns: SKILL.invisibility.turns, clock: h.id, source: h.id }); break;
    case 'teleport': {
      const th = g.heroes[a.hero!];
      th.pos = { ...a.dest! };
      reveal(g, th.team, th.pos, HERO_STATS[th.cls].vision);
      // The mage spends its remaining action working the ally (Telepuppet), then its own turn ends.
      h.actionsLeft = 0;
      if (opts.onTeleport) {
        const saved: CutInSaved = { actionsLeft: th.actionsLeft, attacked: th.attacked, moved: th.moved, rested: th.rested, straightRun: th.straightRun };
        th.actionsLeft = 1; th.attacked = false; th.moved = true; th.rested = false; th.straightRun = 0;
        if (opts.onTeleport(th, saved) !== 'later') endCutIn(th, saved);
      }
      break;
    }
  }
  return true;
}

// Self-centred area spells: one shape for casting and for the app's preview.
export type AreaSpell = 'smite' | 'quake' | 'crossHeal' | 'inspire';
export const AREA_SPELLS: AreaSpell[] = ['smite', 'quake', 'crossHeal', 'inspire'];

/** Does area spell `s`, cast from `c`, cover tile `p`? */
export function inSpellArea(s: AreaSpell, c: Pos, p: Pos): boolean {
  const d = cheb(c, p), straight = p.x === c.x || p.y === c.y;
  switch (s) {
    case 'smite': return straight && d >= 1 && d <= 2;       // cross, 2 each way
    case 'quake': return d >= 1 && d <= 3;                   // rings out to 3
    case 'crossHeal': return straight && d <= 1;             // cross, 1 each way, caster included
    case 'inspire': return d <= SPELL_INFO.inspire.range;    // allies within 4, caster included
  }
}

/** Every unit an area spell would affect if cast now: damage to enemies, or HP healed / bonus given to allies. */
export function spellEffects(g: GameState, h: Hero, s: AreaSpell): Effect[] {
  if (!h.pos) return [];
  const c = h.pos, out: Effect[] = [];
  if (s === 'crossHeal' || s === 'inspire') {
    for (const o of [h, ...alliesOf(g, h)]) if (o.pos && inSpellArea(s, c, o.pos))
      out.push({ pos: o.pos, amount: s === 'crossHeal' ? Math.min(maxHp(g, o) - o.hp, SKILL.crossHeal.heal) : SKILL.inspire.bonus, kills: false, help: true });
    return out;
  }
  const flat = flatBonus(g, h, true);
  const base = (p: Pos) => s === 'smite' ? SKILL.smite.damage : SKILL.quake.damage[cheb(c, p) - 1];
  for (const e of enemiesOf(g, h)) if (visibleTo(g, e, h.team) && inSpellArea(s, c, e.pos!)) {
    const d = resolveHit({ base: base(e.pos!), skillBonus: 0, flat, isSpell: true }, defenderState(g, e, h.team));
    out.push({ pos: e.pos!, amount: Math.min(d, e.hp), kills: d >= e.hp, help: false, full: d, raw: resolveHit({ base: base(e.pos!), skillBonus: 0, flat, isSpell: true }, OPEN) });
  }
  for (const cp of g.camps) {
    const p = g.map.camps[cp.idx];
    if (cp.respawn !== 0 || !inSpellArea(s, c, p)) continue;
    const d = resolveHit({ base: base(p), skillBonus: 0, flat, isSpell: true }, OPEN);
    out.push({ pos: p, amount: Math.min(d, cp.hp), kills: d >= cp.hp, help: false });
  }
  return out;
}

/** Firewall's U: the 8 tiles around `center` minus the open side (DIRS index) and its two neighbours. */
export function firewallTiles(g: GameState, center: Pos, open: number): Pos[] {
  const openSet = new Set([open, (open + 1) % 8, (open + 7) % 8]);
  const out: Pos[] = [];
  DIRS.forEach((d, i) => { const p = { x: center.x + d.x, y: center.y + d.y }; if (!openSet.has(i) && inside(g, p)) out.push(p); });
  return out;
}

/** The DIRS index pointing from `from` toward `to` (nearest of the 8 directions), or -1 if the same tile. */
export function dirToward(from: Pos, to: Pos): number {
  const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y);
  return DIRS.findIndex(d => d.x === dx && d.y === dy);
}

/** Tidal wave's line of 3 from the caster in direction `dir` (DIRS index). */
export function tidalTiles(g: GameState, from: Pos, dir: number): Pos[] {
  const d = DIRS[dir];
  return [1, 2, 3].map(k => ({ x: from.x + d.x * k, y: from.y + d.y * k })).filter(p => inside(g, p));
}

/** What an aimed spell would do if cast now (for the app's preview): the tiles it covers and every unit
 *  it affects. Damage for hostile spells; HP healed or bonus given for support ones (0 = a status only). */
export function aimedEffects(g: GameState, h: Hero, s: Spell, a: CastArgs): { tiles: Pos[]; effects: Effect[] } {
  if (!h.pos || !canCast(g, h, s, a)) return { tiles: [], effects: [] };
  const flat = flatBonus(g, h, true);
  const out: Effect[] = [];
  const hurtHero = (e: Hero, base: number) => {
    const d = resolveHit({ base, skillBonus: 0, flat, isSpell: true }, defenderState(g, e, h.team));
    out.push({ pos: { ...e.pos! }, amount: Math.min(d, e.hp), kills: d >= e.hp, help: false, full: d, raw: resolveHit({ base, skillBonus: 0, flat, isSpell: true }, OPEN) });
    return d;
  };
  const hurtNpc = (t: Target, base: number) => {
    const p = targetPos(g, t)!;
    if (t.kind === 'decoy') { out.push({ pos: p, amount: 1, kills: true, help: false }); return; }
    const hp = t.kind === 'camp' ? g.camps[t.id].hp : g.landmarks[t.id].bossHp;
    const d = resolveHit({ base, skillBonus: 0, flat, isSpell: true }, OPEN);
    out.push({ pos: p, amount: Math.min(d, hp), kills: d >= hp, help: false });
  };
  const SINGLE: Partial<Record<Spell, number>> = { mageBolt: SKILL.mageBolt.damage, lightning: SKILL.lightning.damage, poison: SKILL.poison.damage, nature: SKILL.nature.damage };
  const base = SINGLE[s];
  if (base !== undefined) {
    let dealt = 0;
    if (a.npc) hurtNpc(a.npc, base); else dealt = hurtHero(g.heroes[a.hero!], base);
    if (s === 'nature' && a.hero !== undefined) out.push({ pos: { ...h.pos }, amount: Math.min(maxHp(g, h) - h.hp, Math.ceil(dealt / 2)), kills: false, help: true });
    return { tiles: [a.npc ? targetPos(g, a.npc)! : { ...g.heroes[a.hero!].pos! }], effects: out };
  }
  const visibleEnemiesOn = (tiles: Pos[]) => enemiesOf(g, h).filter(e => visibleTo(g, e, h.team) && tiles.some(p => p.x === e.pos!.x && p.y === e.pos!.y));
  switch (s) {
    case 'fireball': {
      const c = a.target!, tiles: Pos[] = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const p = { x: c.x + dx, y: c.y + dy }; if (inside(g, p)) tiles.push(p); }
      for (const e of visibleEnemiesOn(tiles)) hurtHero(e, SKILL.fireball.damage);
      g.camps.forEach((cp, i) => { const p = g.map.camps[i]; if (cp.respawn === 0 && cheb(p, c) <= 1) hurtNpc({ kind: 'camp', id: i }, SKILL.fireball.damage); });
      return { tiles, effects: out };
    }
    case 'tidalWave': {
      const tiles = tidalTiles(g, h.pos, a.dir ?? 0);
      for (const e of visibleEnemiesOn(tiles)) hurtHero(e, SKILL.tidalWave.damage);
      return { tiles, effects: out };
    }
    case 'firewall': {
      // the burn lands at the end of your turn: spell damage, terrain −1, minimum 1
      const tiles = firewallTiles(g, a.hero !== undefined ? g.heroes[a.hero].pos! : h.pos, a.open ?? 0);
      for (const e of visibleEnemiesOn(tiles)) {
        const d = Math.max(1, SKILL.firewall.damage - (terrainAt(g, e.pos!) !== 'plain' ? 1 : 0));
        out.push({ pos: { ...e.pos! }, amount: Math.min(d, e.hp), kills: d >= e.hp, help: false });
      }
      return { tiles, effects: out };
    }
    case 'empower': case 'cleanse': case 'fortify': {
      const t = g.heroes[a.hero ?? h.id];
      out.push({ pos: { ...t.pos! }, amount: s === 'empower' ? SKILL.empower.attack : 0, kills: false, help: true });
      return { tiles: [{ ...t.pos! }], effects: out };
    }
    case 'resurrection': {
      const t = g.heroes[a.hero!];
      out.push({ pos: { ...t.deathPos! }, amount: Math.ceil(maxHp(g, t) / 2), kills: false, help: true });
      return { tiles: [{ ...t.deathPos! }], effects: out };
    }
  }
  return { tiles: [], effects: out };
}

/** Doublecast: two spells in ONE action, each paying its own mana. */
export function doublecast(g: GameState, h: Hero, s1: Spell, a1: CastArgs, s2: Spell, a2: CastArgs): boolean {
  if (!h.skills.has('doublecast') || h.actionsLeft <= 0) return false;
  if (h.mana < SPELL_INFO[s1].mana + SPELL_INFO[s2].mana) return false;
  if (!canCast(g, h, s1, a1)) return false;
  cast(g, h, s1, a1);
  h.actionsLeft++; // the first cast used the action; give it back for the second half
  const ok = cast(g, h, s2, a2, { doublecastSecond: true });
  h.actionsLeft--;
  return ok || true;
}

// Hunter's mark: free action, not an attack.
export function huntersMark(g: GameState, h: Hero, targetId: number): boolean {
  const th = g.heroes[targetId];
  if (!h.pos || !th.pos || !h.skills.has('huntersMark') || h.mana < SKILL.huntersMark.mana) return false;
  if (th.team === h.team || !visibleTo(g, th, h.team) || cheb(h.pos, th.pos) > weaponRange(g, h, !!h.moved)) return false;
  h.mana -= SKILL.huntersMark.mana;
  addStatus(th, { kind: 'marked', turns: SKILL.huntersMark.turns, clock: h.id, source: h.id });
  addStatus(h, { kind: 'huntBoost', turns: SKILL.huntersMark.turns, clock: h.id, source: h.id });
  return true;
}

export function manaSurge(g: GameState, h: Hero): boolean {
  if (!h.skills.has('manaSurge') || h.surgeCd > 0) return false;
  h.mana = Math.min(maxManaOf(g, h), h.mana + SKILL.manaSurge.amount);
  g.events.push({ t: 'surge', hero: h.id });
  h.surgeCd = SKILL.manaSurge.every;
  return true;
}

/** Rest: an action. Mana +3 (+2 Deep rest), HP +2. Can share a turn with an attack (MANA.restWithAttack). */
export function rest(g: GameState, h: Hero): boolean {
  if (!h.pos || h.actionsLeft <= 0 || (h.attacked && !MANA.restWithAttack)) return false;
  h.actionsLeft--;
  h.rested = true;
  h.mana = Math.min(maxManaOf(g, h), h.mana + MANA.restAmount + (h.skills.has('deepRest') ? MANA.deepRestBonus : 0));
  heal(g, h, h, MANA.restHeal);
  return true;
}

export function curePoison(g: GameState, h: Hero): boolean {
  const pl = g.players[h.player];
  if (!hasStatus(h, 'poison') || h.actionsLeft <= 0 || pl.gold < 3) return false;
  pl.gold -= 3; h.actionsLeft--;
  h.statuses = h.statuses.filter(s => s.kind !== 'poison');
  return true;
}

// =====================================================================
// Economy (free actions)
// =====================================================================

export function gainXp(g: GameState, player: number, n: number) { const p = g.players[player]; p.xp += n; p.xpEarned += n; }
export function gainGold(g: GameState, player: number, n: number) { const p = g.players[player]; p.gold += n; p.goldEarned += n; }

export const priceFor = (g: GameState, player: number, gold: number) =>
  Math.ceil(gold * (g.players[player].buildings.has('trade3') ? 1 - ECON.tradeDiscount : 1));

export function buyBuilding(g: GameState, player: number, id: string): boolean {
  const b = BUILDING[id]; const p = g.players[player];
  if (!b || p.buildings.has(id) || (b.requires && !p.buildings.has(b.requires))) return false;
  const cost = priceFor(g, player, b.cost);
  if (p.gold < cost) return false;
  p.gold -= cost; p.buildings.add(id);
  if (!p.quests.has('builder') && p.buildings.size >= QUESTS.builder.buildings) p.quests.add('builder');
  return true;
}

export function elementsAvailable(g: GameState, h: Hero): Set<string> {
  const s = new Set<string>([h.element]);
  for (const l of g.landmarks) { const m = g.map.landmarks[l.idx]; if (l.owner === h.player && m.element) s.add(m.element); }
  return s;
}

export function skillCost(g: GameState, h: Hero, id: string): number {
  const p = g.players[h.player];
  let c = SKILL_NODES[id].cost;
  if (p.scholarReady) c = Math.ceil(c / 2);
  return c;
}

export function canLearn(g: GameState, h: Hero, id: string): boolean {
  const n = SKILL_NODES[id];
  if (!n || h.skills.has(id)) return false;
  if (n.cls && n.cls !== h.cls) return false;
  if (n.requires.some(r => !h.skills.has(r))) return false;
  if (n.element && !elementsAvailable(g, h).has(n.element)) return false;
  if (n.hybridOf && !hybridUnlocked(id, h.skills)) return false;
  return g.players[h.player].xp >= skillCost(g, h, id);
}

export function learn(g: GameState, h: Hero, id: string): boolean {
  if (!canLearn(g, h, id)) return false;
  const p = g.players[h.player];
  p.xp -= skillCost(g, h, id);
  if (p.scholarReady) p.scholarReady = false;
  h.skills.add(id);
  p.skillsBought++;
  if (p.skillsBought === QUESTS.scholar.skills && !p.quests.has('scholar')) { p.quests.add('scholar'); p.scholarReady = true; }
  if (id === 'stoneskin' || id === 'windchill' || id === 'burningAura') { /* passives read from skills */ }
  return true;
}

const OPTION2: Record<ClassId, WeaponId> = { knight: 'flail', barbarian: 'spear', archer: 'crossbow', mage: 'orb', thief: 'knives' };

/** Buy gear: from an owned merchant (7, boots 6) or crafted at the Armory (10). */
export function buyItem(g: GameState, h: Hero, item: 'shield' | 'boots' | 'weapon2'): boolean {
  const p = g.players[h.player];
  const merchant = g.landmarks.some(l => l.owner === h.player && g.map.landmarks[l.idx].bonus === 'merchant');
  const base = merchant ? (item === 'boots' ? ECON.items.boots : ECON.items.merchant) : p.buildings.has('armory') ? ECON.items.crafted : null;
  if (base === null) return false;
  const cost = priceFor(g, h.player, base);
  if (p.gold < cost) return false;
  if (item === 'shield' && (h.shield > 0 || WEAPONS[h.weapon].twoHanded)) return false;
  if (item === 'boots' && h.boots) return false;
  if (item === 'weapon2' && h.weapon === OPTION2[h.cls]) return false;
  // the weapon you had goes into the bag (Nick, 2026-10-02), and the shield too if the new one is
  // two-handed; with no room the purchase is refused (my default) rather than losing gear
  const bagged = item === 'weapon2' ? 1 + (WEAPONS[OPTION2[h.cls]].twoHanded && h.shield > 0 ? 1 : 0) : 0;
  if (h.inventory.length + bagged > ECON.bagSize) return false;
  p.gold -= cost;
  if (item === 'shield') h.shield = 1;
  if (item === 'boots') h.boots = 'plain';
  if (item === 'weapon2') {
    h.inventory.push({ item: h.weapon, upgraded: h.weaponUpgraded });
    h.weapon = OPTION2[h.cls]; h.weaponUpgraded = false;
    if (WEAPONS[h.weapon].twoHanded && h.shield) { h.inventory.push({ item: 'shield', upgraded: h.shield === 2 }); h.shield = 0; }
    h.mana = Math.min(h.mana, maxManaOf(g, h));
  }
  return true;
}

export function upgrade(g: GameState, h: Hero, what: 'weapon' | 'shield' | 'boots', terrain?: Terrain): boolean {
  const p = g.players[h.player];
  if (!p.buildings.has('forge')) return false;
  const cost = priceFor(g, h.player, what === 'boots' ? ECON.items.bootsUpgrade : ECON.items.blacksmithUpgrade);
  if (p.gold < cost) return false;
  if (what === 'weapon' && h.weaponUpgraded) return false;
  if (what === 'shield' && h.shield !== 1) return false;
  if (what === 'boots' && h.boots !== 'plain') return false;
  p.gold -= cost;
  if (what === 'weapon') h.weaponUpgraded = true;
  if (what === 'shield') h.shield = 2;
  if (what === 'boots') h.boots = terrain ?? 'water';
  return true;
}

/** Sell price of a spare item: half of (merchant price + its upgrade). Chest items come upgraded. */
/** Explorer quest (Nick, 2026-10-01): stand on any tile of the map edge farthest from
 *  your base (row or column; if two edges tie, either counts). */
export function onExplorerEdge(g: GameState, h: Hero): boolean {
  if (!h.pos) return false;
  const b = g.map.bases[h.player], { w, h: H } = g.map;
  const edges = [
    { d: b.x, hit: h.pos.x === 0 }, { d: w - 1 - b.x, hit: h.pos.x === w - 1 },
    { d: b.y, hit: h.pos.y === 0 }, { d: H - 1 - b.y, hit: h.pos.y === H - 1 },
  ];
  const far = Math.max(...edges.map(e => e.d));
  return edges.some(e => e.d === far && e.hit);
}
export function checkExplorer(g: GameState, h: Hero) {
  const p = g.players[h.player];
  if (!p.quests.has('explorer') && onExplorerEdge(g, h)) { p.quests.add('explorer'); gainXp(g, p.id, QUESTS.explorer.xp); }
}

export function sellPrice(item: string, upgraded: boolean): number {
  const boots = item === 'boots';
  const base = boots ? ECON.items.boots : ECON.items.merchant;
  const upg = upgraded ? (boots ? ECON.items.bootsUpgrade : ECON.items.blacksmithUpgrade) : 0;
  return Math.floor((base + upg) * ECON.sellRate);
}

/** Sell a spare item from the inventory. Free, from anywhere. */
export function sellItem(g: GameState, h: Hero, index: number): boolean {
  const it = h.inventory[index];
  if (!it) return false;
  h.inventory.splice(index, 1);
  gainGold(g, h.player, sellPrice(it.item, it.upgraded));
  return true;
}

/** Give a spare item to an adjacent teammate (Nick, 2026-10-01): spares only, not
 *  equipped gear; no action; the receiver needs a free bag slot. */
export function canGive(g: GameState, from: Hero, to: Hero, index: number): boolean {
  return from.id !== to.id && from.team === to.team && !!from.pos && !!to.pos && cheb(from.pos, to.pos) <= 1 &&
    !!from.inventory[index] && to.inventory.length < ECON.bagSize;
}
export function giveItem(g: GameState, from: Hero, to: Hero, index: number): boolean {
  if (!canGive(g, from, to, index)) return false;
  to.inventory.push(...from.inventory.splice(index, 1));
  return true;
}

/** Can this spare be equipped? Own-class weapons, shields (not with a two-handed weapon), boots.
 *  A two-handed weapon sends the shield to the bag too, so that needs a free slot. */
export function canEquip(g: GameState, h: Hero, index: number): boolean {
  const it = h.inventory[index];
  if (!it) return false;
  if (it.item === 'shield') return !WEAPONS[h.weapon].twoHanded;
  if (it.item === 'boots') return true;
  const w = WEAPONS[it.item as WeaponId];
  if (!w || w.owner !== h.cls) return false;
  return !(w.twoHanded && h.shield > 0 && h.inventory.length >= ECON.bagSize);
}

/** Equip a spare from the bag; what it replaces goes into the bag. No action (my default, 2026-10-02,
 *  like buying, selling and giving). Upgraded boots keep their terrain through the swap. */
export function equipItem(g: GameState, h: Hero, index: number): boolean {
  if (!canEquip(g, h, index)) return false;
  const [it] = h.inventory.splice(index, 1);
  const bagShield = () => { if (h.shield) h.inventory.push({ item: 'shield', upgraded: h.shield === 2 }); };
  if (it.item === 'shield') { bagShield(); h.shield = it.upgraded ? 2 : 1; }
  else if (it.item === 'boots') {
    if (h.boots) h.inventory.push(h.boots === 'plain' ? { item: 'boots', upgraded: false } : { item: 'boots', upgraded: true, terrain: h.boots });
    h.boots = it.upgraded ? (it.terrain ?? TERRAIN_OF[h.element]) : 'plain';
  } else {
    h.inventory.push({ item: h.weapon, upgraded: h.weaponUpgraded });
    h.weapon = it.item as WeaponId; h.weaponUpgraded = it.upgraded;
    if (WEAPONS[h.weapon].twoHanded) { bagShield(); h.shield = 0; }
    h.mana = Math.min(h.mana, maxManaOf(g, h));
  }
  return true;
}

/** Equip chest items that are better than what the hero has. Spares stay in the inventory (sellItem). */
export function sortInventory(g: GameState, h: Hero) {
  for (const it of [...h.inventory]) {
    let used = false;
    if (it.item === 'shield' && !WEAPONS[h.weapon].twoHanded && h.shield < 2) { h.shield = 2; used = true; }
    else if (it.item === 'boots' && (!h.boots || h.boots === 'plain')) { h.boots = h.boots === null || h.boots === 'plain' ? TERRAIN_OF[h.element] : h.boots; used = true; }
    else if (it.item === h.weapon && !h.weaponUpgraded) { h.weaponUpgraded = true; used = true; }
    if (used) h.inventory.splice(h.inventory.indexOf(it), 1);
  }
}

export function launder(g: GameState, h: Hero, gold: number): boolean {
  const p = g.players[h.player];
  if (!h.skills.has('launder') || gold < 3 || p.gold < gold) return false;
  const n = Math.floor(gold / 3);
  p.gold -= n * 3; gainXp(g, p.id, n);
  return true;
}

export type { StatusKind };
