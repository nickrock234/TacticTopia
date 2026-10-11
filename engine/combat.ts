// The damage pipeline from Combat Rules.md, one hit at a time.
//
// A "hit" is built by the attacker (base damage + one attack-skill bonus + flat
// bonuses), then reduced by the defender (block, terrain, Intimidate, Ice block,
// minimum 1). Effects like Shattering land after the whole action, so callers
// apply them between actions, never between hits of one action.

import { COMBAT, SKILL } from './numbers.ts';

export interface Hit {
  base: number;       // weapon damage (with upgrades) or the spell's number
  isSpell: boolean;   // spells ignore block
  skillBonus: number; // Holy/Heavy strike or Charge; attack skills don't stack
  flat: number;       // sum of attacker-side flat bonuses already known
  armorPierce?: boolean; // ignores the shield part of block only
}

export interface DefenderState {
  shield: number;       // shield block incl. upgrades
  otherBlock: number;   // Stoneskin, Empower, territory
  shattered: number;    // block removed by Shattering
  onTerrain: boolean;
  intimidate: boolean;
  iceBlock: boolean;
  marked: boolean;      // Hunter's mark: +2 from every ally of the marker
}

export const OPEN_DEFENDER: DefenderState = {
  shield: 0, otherBlock: 0, shattered: 0, onTerrain: false,
  intimidate: false, iceBlock: false, marked: false,
};

export function resolveHit(hit: Hit, d: DefenderState): number {
  // 1-3. attacker side
  let dmg = hit.base + hit.skillBonus + hit.flat + (d.marked ? SKILL.huntersMark.bonus : 0);

  // 4. block (weapon hits only)
  if (!hit.isSpell) {
    const shield = hit.armorPierce ? 0 : d.shield;
    const block = Math.max(0, shield + d.otherBlock - d.shattered);
    dmg -= block;
  }
  // 5. terrain
  if (d.onTerrain) dmg -= COMBAT.terrainReduction;
  // 6. Intimidate
  if (d.intimidate) dmg -= SKILL.intimidate.reduction;
  // 7. Ice block: halve, round down
  if (d.iceBlock) dmg = Math.floor(dmg / 2);
  // 8. minimum per hit
  return Math.max(COMBAT.minDamagePerHit, dmg);
}
