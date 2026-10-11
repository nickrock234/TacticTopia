// Short in-app text and icon names for skills and buildings (skill tree and Base
// screens). Numbers come from engine/numbers.ts so they follow tuning. Terse on
// purpose: a number or a fact, never an explanation.

import { SKILL } from '@engine/numbers.ts';
import type { ClassId } from '@engine/numbers.ts';

const S = SKILL;

export const SKILL_TEXT: Record<string, string> = {
  // knight
  holyStrike: `Attack +${S.holyStrike.bonus}. Heal ${S.holyStrike.healOnHit} on hit.`,
  charge: `Attack +${S.charge.perTile} per tile moved in a straight line, max +${S.charge.max}.`,
  smite: `Cross, 2 tiles: ${S.smite.damage} damage. Cures your statuses.`,
  selfHeal: `Heal self ${S.selfHeal.heal}.`,
  crossHeal: `Cross, 1 tile: allies heal ${S.crossHeal.heal}.`,
  resurrection: `Revive an ally's body within ${S.resurrection.range}, at half HP.`,
  // barbarian
  heavyStrike: `Attack +${S.heavyStrike.bonus}.`,
  vengeance: `At ${Math.round(S.vengeance.threshold * 100)}% HP or less: +${S.vengeance.bonus} per hit.`,
  doubleStrike: 'Two weapon hits.',
  intimidate: `Enemies deal ${S.intimidate.reduction} less to you.`,
  counterattack: 'Hit back melee attackers for half weapon damage.',
  inspire: `You and allies within 4: +${S.inspire.bonus} damage, ${S.inspire.turns} turns.`,
  // archer
  takeAim: '+1 range if you haven’t moved.',
  armorPierce: 'Ignore shield block.',
  arrowRain: 'Weapon damage to every enemy in range.',
  scoutsEye: 'See invisible enemies.',
  pinningShot: 'Attack. Target: −2 move next turn.',
  huntersMark: `Free. Target takes +${S.huntersMark.bonus} from your team; team +1 move. ${S.huntersMark.turns} turns.`,
  // mage
  deepRest: 'Rest: +2 mana.',
  manaSurge: `Free. +${S.manaSurge.amount} mana, every ${S.manaSurge.every} turns.`,
  doublecast: 'Two spells in one action.',
  empower: `Range 3: +${S.empower.attack} attack, +${S.empower.block} block, ${S.empower.turns} turns.`,
  cleanse: 'Range 3: remove statuses; ward the next one.',
  teleport: 'Move an ally within 3 to a tile within 5, then take its one action.',
  // thief
  invisibility: `Invisible ${S.invisibility.turns} turns. Not with an enemy within ${S.invisibility.noEnemyWithin}.`,
  ambush: `+${S.ambush.bonus} from invisibility.`,
  doubleDagger: 'Two hits from invisibility.',
  investor: '+1 gold per 3 XP earned.',
  pickpocket: 'Steal 2 gold per hit.',
  launder: 'Free. 3 gold → 1 XP.',
  // elements
  flaming: `Weapon +${S.flaming.bonus}.`,
  fireball: `Range ${S.fireball.range}: ${S.fireball.damage} damage, 3×3.`,
  burningAura: `Attackers take ${S.burningAura.damage} per hit.`,
  firewall: `Range ${S.firewall.range}: U of fire, ${S.firewall.damage} damage.`,
  chilling: 'Weapon hits: −1 move next turn.',
  tidalWave: `Line of 3: ${S.tidalWave.damage} damage, push ${S.tidalWave.push}.`,
  windchill: 'Ranged attacks on you: −1 range.',
  iceBlock: 'Halve damage until your next turn.',
  shattering: 'Weapon hits: −1 block, 2 turns.',
  quake: `Around you: ${S.quake.damage.join(' / ')} damage.`,
  stoneskin: `+${S.stoneskin.block} block.`,
  fortify: 'Range 2: immune to statuses and pushes.',
  // hybrids
  lightning: `Range ${S.lightning.range}: ${S.lightning.damage} damage, −1 action.`,
  poison: `Range ${S.poison.range}: ${S.poison.damage} damage, then ${S.poison.perTurn} per turn.`,
  nature: `Range ${S.nature.range}: ${S.nature.damage} damage, heal half.`,
};

/** Mana cost shown on the detail sheet, if the skill has one. */
export function skillMana(id: string): number | null {
  const s = (SKILL as Record<string, { mana?: number }>)[id];
  return s && typeof s.mana === 'number' && s.mana > 0 ? s.mana : null;
}

/** Icon sheet name (without "icons/icon_skill_") where it differs from the snake-cased name. */
const ICON: Record<string, string> = {
  holyStrike: 'holy_strike', selfHeal: 'self_heal', crossHeal: 'cross_heal', heavyStrike: 'heavy_strike',
  doubleStrike: 'double_strike', takeAim: 'take_aim', armorPierce: 'armor_pierce', arrowRain: 'arrow_rain',
  scoutsEye: 'scouts_eye', pinningShot: 'pinning_shot', huntersMark: 'hunters_mark', deepRest: 'deep_rest',
  manaSurge: 'mana_surge', teleport: 'teleport_ally', doubleDagger: 'double_dagger', flaming: 'flaming_weapon',
  burningAura: 'burning_aura', chilling: 'chilling_weapon', tidalWave: 'tidal_wave', iceBlock: 'ice_block',
  shattering: 'shattering_weapon', inspire: 'inspire_berserkers',
};
export const skillIcon = (id: string) => `icons/icon_skill_${ICON[id] ?? id.toLowerCase()}`;

/** Starting perks, shown as an owned node at the bottom of the ring. */
export const START_PERK: Record<ClassId, { name: string; icon: string; text: string } | null> = {
  knight: null, // starts with a shield: gear, not a skill, so it stays out of the tree (Nick, 2026-10-01)
  barbarian: null,
  archer: null, // starts with a Training dummy: a building, not a skill (Nick, 2026-10-01)
  mage: { name: 'Mage bolt', icon: 'icons/icon_skill_mage_bolt', text: `Range ${S.mageBolt.range}: ${S.mageBolt.damage} damage.` },
  thief: { name: 'Body double', icon: '', text: 'Leave a 1 HP decoy to hold a claim.' },
};

// ---------------- buildings ----------------

const BUILDING_ICON: Record<string, string> = {
  dummy: 'training_dummy', sparring: 'sparring_ring', trade2: 'bank', trade3: 'guildhall', territory2: 'city_hall', territory3: 'fortress',
};
export const buildingIcon = (id: string) => `icons/icon_building_${BUILDING_ICON[id] ?? id}`;

export const BUILDING_TEXT: Record<string, string> = {
  forge: 'Unlocks Blacksmith upgrades.',
  armory: 'Unlocks crafting.',
  refinery: 'Weapons and shields +1.',
  monastery: `Spells +${S.monastery.spellBonus}.`,
  arena: 'Monster rewards +50%.',
  shrine: '+1 mana per turn.',
  apothecary: '+1 HP per turn.',
  temple: '+2 max mana.',
  trade3: 'Gold prices −33%.',
  stables: '+1 move starting on your roads.',
  territory2: '+1 gold per landmark.',
  territory3: '+1 damage and block in your territory.',
};
