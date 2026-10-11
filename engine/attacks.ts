// What a hero can do with ONE turn's worth of fighting: an optional non-attack
// action (buff, move, rest) plus the one attack action, plus free actions
// (Hunter's mark, Mana surge). Used by the combat simulations.
//
// Movement and range are abstracted: a plan either starts "in position" (both
// actions free for fighting) or "on the approach" (one action spent moving).

import { HERO_STATS, WEAPONS, STARTING_WEAPON, GEAR, SKILL, MANA, type ClassId, type WeaponId } from './numbers.ts';
import { resolveHit, type Hit, type DefenderState } from './combat.ts';
import { closure, xpOf, elementsUsed, classOk } from './skills.ts';

export type GearTier = 0 | 1 | 2; // 0 start · 1 blacksmith + shield · 2 refinery + upgraded shield + Monastery

export type Pre = 'none' | 'move' | 'rest' | 'empowerSelf' | 'empowerAlly' | 'inspire';

export interface Plan {
  cls: ClassId;
  weapon: WeaponId;
  attack: string;          // attack id, or 'doublecast:a+b'
  pre: Pre;
  mark: boolean;           // Hunter's mark (free)
  surge: boolean;          // Mana surge (free)
  passives: string[];      // offensive passives the plan relies on
  nodes: Set<string>;      // every skill needed, prerequisites included
  xp: number;
  mana: number;
}

export interface Ctx {
  empowered: boolean;     // +1 attack from Empower
  inspired: boolean;      // +2 from Inspire Berserkers
  vengeance: boolean;     // barbarian below half HP
  fromInvis: boolean;     // thief attacking out of invisibility
}

interface AttackDef {
  id: string;
  label: string;
  cls?: ClassId;
  nodes: string[];
  mana: number;
  spell: boolean;
  needsMove?: boolean;
  needsInvis?: boolean;
  hits: (w: WeaponStats) => { base: number; skillBonus: number; count: number }[];
}

interface WeaponStats { damage: number; hits: number }

const weaponAttack = (skillBonus: number, times = 1) => (w: WeaponStats) =>
  [{ base: w.damage, skillBonus, count: w.hits * times }];
const spell = (damage: number) => () => [{ base: damage, skillBonus: 0, count: 1 }];

export const ATTACKS: AttackDef[] = [
  { id: 'weapon', label: 'weapon attack', nodes: [], mana: 0, spell: false, hits: weaponAttack(0) },
  { id: 'holyStrike', label: 'Holy strike', cls: 'knight', nodes: ['holyStrike'], mana: SKILL.holyStrike.mana, spell: false, hits: weaponAttack(SKILL.holyStrike.bonus) },
  { id: 'charge', label: 'Charge (3 tiles)', cls: 'knight', nodes: ['charge'], mana: SKILL.charge.mana, spell: false, needsMove: true, hits: weaponAttack(SKILL.charge.max) },
  { id: 'smite', label: 'Smite', cls: 'knight', nodes: ['smite'], mana: SKILL.smite.mana, spell: true, hits: spell(SKILL.smite.damage) },
  { id: 'heavyStrike', label: 'Heavy strike', cls: 'barbarian', nodes: ['heavyStrike'], mana: SKILL.heavyStrike.mana, spell: false, hits: weaponAttack(SKILL.heavyStrike.bonus) },
  { id: 'doubleStrike', label: 'Double strike', cls: 'barbarian', nodes: ['doubleStrike'], mana: SKILL.doubleStrike.mana, spell: false, hits: weaponAttack(0, 2) },
  { id: 'ambush', label: 'attack from invisibility', cls: 'thief', nodes: ['invisibility'], mana: 0, spell: false, needsMove: true, needsInvis: true, hits: weaponAttack(0) },
  { id: 'mageBolt', label: 'Mage bolt', cls: 'mage', nodes: [], mana: SKILL.mageBolt.mana, spell: true, hits: spell(SKILL.mageBolt.damage) },
  { id: 'fireball', label: 'Fireball', nodes: ['fireball'], mana: SKILL.fireball.mana, spell: true, hits: spell(SKILL.fireball.damage) },
  { id: 'firewall', label: 'Firewall (first tick)', nodes: ['firewall'], mana: SKILL.firewall.mana, spell: true, hits: spell(SKILL.firewall.damage) },
  { id: 'tidalWave', label: 'Tidal wave', nodes: ['tidalWave'], mana: SKILL.tidalWave.mana, spell: true, hits: spell(SKILL.tidalWave.damage) },
  { id: 'quake', label: 'Quake (adjacent)', nodes: ['quake'], mana: SKILL.quake.mana, spell: true, hits: spell(SKILL.quake.damage[0]) },
  { id: 'lightning', label: 'Lightning', nodes: ['lightning'], mana: SKILL.lightning.mana, spell: true, hits: spell(SKILL.lightning.damage) },
  { id: 'poison', label: 'Poison (first hit)', nodes: ['poison'], mana: SKILL.poison.mana, spell: true, hits: spell(SKILL.poison.damage) },
  { id: 'nature', label: 'Nature', nodes: ['nature'], mana: SKILL.nature.mana, spell: true, hits: spell(SKILL.nature.damage) },
];
const ATTACK_BY_ID = Object.fromEntries(ATTACKS.map(a => [a.id, a]));
const MAGE_SPELLS = ATTACKS.filter(a => a.spell && (!a.cls || a.cls === 'mage')).map(a => a.id);

// ---------- loadout ----------

export function weaponsAt(cls: ClassId, gear: GearTier): WeaponId[] {
  const all = (Object.keys(WEAPONS) as WeaponId[]).filter(w => WEAPONS[w].owner === cls);
  return gear === 0 ? [STARTING_WEAPON[cls]] : all;
}

function weaponStats(cls: ClassId, weapon: WeaponId, gear: GearTier): WeaponStats {
  const w = WEAPONS[weapon];
  // Blacksmith: +1 damage, except mage weapons (trait instead). Refinery: +1 to all.
  const smith = gear >= 1 && cls !== 'mage' ? GEAR.blacksmithDamage : 0;
  const refinery = gear >= 2 ? GEAR.refineryBonus : 0;
  return { damage: w.damage + smith + refinery, hits: w.hits };
}

export function maxMana(cls: ClassId, weapon: WeaponId, gear: GearTier): number {
  let m = HERO_STATS[cls].mana;
  if (weapon === 'staff') m += (WEAPONS.staff.bonusMana ?? 0) + (gear >= 1 ? 1 : 0);
  return m;
}

// ---------- defender profiles ----------

/** 'open': no defences. 'armored': what a defence-minded hero has at this gear tier. */
export function defender(cls: ClassId, gear: GearTier, armored: boolean): DefenderState & { hp: number } {
  const hp = HERO_STATS[cls].hp;
  const base = { hp, shield: 0, otherBlock: 0, shattered: 0, onTerrain: false, intimidate: false, iceBlock: false, marked: false };
  if (!armored || gear === 0) return { ...base, intimidate: armored && cls === 'barbarian' && gear > 0 };
  const oneHanded = !WEAPONS[STARTING_WEAPON[cls]].twoHanded;
  const shield = !oneHanded ? 0 : gear === 1 ? GEAR.shieldBlock : GEAR.shieldUpgradedBlock + GEAR.refineryBonus;
  return {
    ...base,
    shield,
    otherBlock: gear >= 2 ? SKILL.stoneskin.block : 0,
    intimidate: cls === 'barbarian',
  };
}

// ---------- plan enumeration ----------

export interface Stage { name: string; xp: number; gear: GearTier; elements: number }

function preOptions(cls: ClassId, team: boolean): Pre[] {
  const p: Pre[] = ['none', 'move'];
  if (cls === 'mage') p.push('empowerSelf');
  if (cls === 'mage' && team) p.push('empowerAlly');
  if (cls === 'barbarian') p.push('inspire');
  return p;
}
const PRE_NODES: Record<Pre, string[]> = {
  none: [], move: [], rest: [], empowerSelf: ['empower'], empowerAlly: ['empower'], inspire: ['inspire'],
};
const PRE_MANA: Record<Pre, number> = {
  none: 0, move: 0, rest: 0, empowerSelf: SKILL.empower.mana, empowerAlly: SKILL.empower.mana, inspire: SKILL.inspire.mana,
};

function passiveOptions(cls: ClassId, attack: AttackDef): string[][] {
  const opts: string[][] = [[]];
  const push = (xs: string[]) => { for (const o of [...opts]) opts.push([...o, ...xs]); };
  const weaponBased = !attack.spell || cls === 'mage';
  if (weaponBased) push(['flaming']);
  if (!attack.spell && cls !== 'mage') push(['shattering']); // matters for the next attacker
  if (cls === 'archer' && !attack.spell) push(['armorPierce']);
  if (attack.id === 'ambush') { push(['ambush']); push(['doubleDagger']); }
  if (cls === 'barbarian') push(['vengeance']);
  return opts;
}

export function enumeratePlans(cls: ClassId, stage: Stage, opts: { team?: boolean; approach?: boolean } = {}): Plan[] {
  const plans: Plan[] = [];
  const attacks: string[] = ATTACKS.filter(a => !a.cls || a.cls === cls).map(a => a.id);
  if (cls === 'mage') {
    for (let i = 0; i < MAGE_SPELLS.length; i++)
      for (let j = i; j < MAGE_SPELLS.length; j++) attacks.push(`doublecast:${MAGE_SPELLS[i]}+${MAGE_SPELLS[j]}`);
  }
  for (const weapon of weaponsAt(cls, stage.gear)) {
    const mm = maxMana(cls, weapon, stage.gear);
    for (const attackId of attacks) {
      const parts = attackId.startsWith('doublecast:') ? attackId.slice(11).split('+') : [attackId];
      const defs = parts.map(p => ATTACK_BY_ID[p]);
      const attackNodes = defs.flatMap(d => d.nodes).concat(parts.length > 1 ? ['doublecast'] : []);
      const attackMana = defs.reduce((s, d) => s + d.mana, 0);
      const needsMove = defs.some(d => d.needsMove);
      for (const pre of preOptions(cls, !!opts.team)) {
        if (opts.approach && pre !== 'move') continue;
        if (needsMove && pre !== 'move') continue;
        for (const passives of passiveOptions(cls, defs[0])) {
          for (const mark of cls === 'archer' ? [false, true] : [false]) {
            for (const surge of cls === 'mage' ? [false, true] : [false]) {
              const wanted = [...attackNodes, ...PRE_NODES[pre], ...passives];
              if (mark) wanted.push('huntersMark');
              if (surge) wanted.push('manaSurge');
              const nodes = closure(wanted);
              if (!classOk(cls, nodes)) continue;
              const xp = xpOf(nodes);
              if (xp > stage.xp) continue;
              if (elementsUsed(nodes).size > stage.elements) continue;
              const mana = attackMana + PRE_MANA[pre] + (mark ? SKILL.huntersMark.mana : 0);
              if (mana > mm + (surge ? SKILL.manaSurge.amount : 0)) continue;
              plans.push({ cls, weapon, attack: attackId, pre, mark, surge, passives, nodes, xp, mana });
            }
          }
        }
      }
    }
  }
  return plans;
}

// ---------- evaluation ----------

export interface Outcome {
  damage: number;
  // effects this plan leaves for teammates acting after it
  marks: boolean;
  inspires: boolean;
  empowersAlly: boolean;
  shatters: boolean;
}

export function evaluate(plan: Plan, stage: Stage, target: DefenderState, ctx: Partial<Ctx> = {}): Outcome {
  const has = (id: string) => plan.nodes.has(id);
  const w = weaponStats(plan.cls, plan.weapon, stage.gear);
  const parts = plan.attack.startsWith('doublecast:') ? plan.attack.slice(11).split('+') : [plan.attack];
  const empowered = ctx.empowered || plan.pre === 'empowerSelf';
  const inspired = ctx.inspired || plan.pre === 'inspire';
  const tgt: DefenderState = { ...target, marked: target.marked || plan.mark };
  const monastery = stage.gear >= 2 ? SKILL.monastery.spellBonus : 0;

  let damage = 0;
  let usedWeapon = false;
  for (const p of parts) {
    const def = ATTACK_BY_ID[p];
    const weaponBased = !def.spell || plan.cls === 'mage';
    let flat = 0;
    if (weaponBased && has('flaming')) flat += SKILL.flaming.bonus;
    if (empowered) flat += SKILL.empower.attack;
    if (inspired) flat += SKILL.inspire.bonus;
    if (ctx.vengeance && has('vengeance')) flat += SKILL.vengeance.bonus;
    if (def.spell) flat += monastery;
    let times = 1;
    if (p === 'ambush') {
      if (has('ambush')) flat += SKILL.ambush.bonus;
      if (has('doubleDagger')) times = 2;
    }
    if (!def.spell) usedWeapon = true;
    for (const h of def.hits(w)) {
      const hit: Hit = { base: h.base, skillBonus: h.skillBonus, flat, isSpell: def.spell, armorPierce: !def.spell && has('armorPierce') };
      damage += resolveHit(hit, tgt) * h.count * times;
    }
  }
  return {
    damage,
    marks: plan.mark,
    inspires: plan.pre === 'inspire',
    empowersAlly: plan.pre === 'empowerAlly',
    shatters: usedWeapon && has('shattering'),
  };
}

export function describe(plan: Plan): string {
  const parts: string[] = [];
  const pre: Record<Pre, string> = { none: '', move: 'move', rest: 'rest', empowerSelf: 'Empower self', empowerAlly: 'Empower ally', inspire: 'Inspire' };
  if (plan.surge) parts.push('Mana surge');
  if (plan.mark) parts.push("Hunter's mark");
  if (pre[plan.pre]) parts.push(pre[plan.pre]);
  const atk = plan.attack.startsWith('doublecast:')
    ? 'Doublecast ' + plan.attack.slice(11).split('+').map(a => ATTACK_BY_ID[a].label).join(' + ')
    : ATTACK_BY_ID[plan.attack].label;
  parts.push(`${atk} (${WEAPONS[plan.weapon].id})`);
  const passives = plan.passives.filter(p => p !== 'shattering');
  if (passives.length) parts.push(`[${passives.join(', ')}]`);
  return parts.join(' → ');
}

export { MANA };
