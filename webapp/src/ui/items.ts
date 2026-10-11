// Item names, stats and icons for the Items (H13) and Shop (H12) panels. Numbers come from the engine.

import { WEAPONS, GEAR, type WeaponId, type ClassId } from '@engine/numbers.ts';
import type { Terrain } from '@engine/mapgen.ts';
import { ECON } from '@engine/economy.ts';
import type { GameState, Hero } from '@engine/state.ts';

export const SECOND: Record<ClassId, WeaponId> = { knight: 'flail', barbarian: 'spear', archer: 'crossbow', mage: 'orb', thief: 'knives' };
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const TERRAIN_NAME: Record<string, string> = { water: 'Water', mountain: 'Mountain', desert: 'Desert' };

export interface ItemView { icon: string; name: string; val: string; sub: string; who: string; terrain?: string }

/** How an item reads: big number + small label (Design's H12/H13 rows). `refinery` adds +1. */
export function itemView(item: string, upgraded: boolean, opts: { terrain?: Terrain | null; refinery?: boolean } = {}): ItemView {
  const ref = opts.refinery ? GEAR.refineryBonus : 0;
  const plus = upgraded ? ' +' : '';
  if (item === 'shield') {
    const block = (upgraded ? GEAR.shieldUpgradedBlock : GEAR.shieldBlock) + ref;
    return { icon: upgraded ? 'icons/icon_item_shield_upgraded' : 'icons/icon_item_shield', name: 'Shield' + plus, val: `${block}`, sub: 'BLOCK', who: 'Any' };
  }
  if (item === 'boots') {
    const t = opts.terrain && opts.terrain !== 'plain' ? opts.terrain : null;
    return { icon: t ? `icons/icon_item_boots_${t}` : 'icons/icon_item_boots', name: t ? `${TERRAIN_NAME[t]} boots` : 'Boots' + plus, val: '+1', sub: t ? `MOVE · ${TERRAIN_NAME[t].toUpperCase()}` : 'MOVE', who: 'Any', terrain: t ? `icons/icon_element_${t === 'mountain' ? 'earth' : t === 'desert' ? 'fire' : 'water'}` : undefined };
  }
  const w = WEAPONS[item as WeaponId];
  if (!w) return { icon: '', name: cap(item), val: '', sub: '', who: '' };
  const mage = w.owner === 'mage';
  const dmg = w.damage + (upgraded && !mage ? GEAR.blacksmithDamage : 0) + ref;
  let sub = 'DMG';
  if (item === 'flail') sub = 'DMG ALL ADJACENT';
  else if (w.range > 1) sub = `DMG · RANGE ${w.range}`;
  if (item === 'staff') sub = `DMG · +${(w.bonusMana ?? 0) + (upgraded ? 1 : 0)} MANA`;
  if (item === 'orb') sub = `DMG · SPELLS +${1 + (upgraded ? 1 : 0)} RANGE`;
  return { icon: `icons/icon_item_${item}`, name: cap(item) + plus, val: w.hits > 1 ? `${w.hits}×${dmg}` : `${dmg}`, sub, who: cap(w.owner) };
}

/** The hero's equipped gear, as rows: weapon, shield, boots (null = empty slot). */
export function equipped(g: GameState, h: Hero): (ItemView | null)[] {
  const ref = g.players[h.player].buildings.has('refinery');
  return [
    itemView(h.weapon, h.weaponUpgraded, { refinery: ref }),
    h.shield ? itemView('shield', h.shield === 2, { refinery: ref }) : null,
    h.boots ? itemView('boots', h.boots !== 'plain', { terrain: h.boots }) : null,
  ];
}

export const BAG = ECON.bagSize;
