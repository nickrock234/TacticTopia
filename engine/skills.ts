// The skill tree: every node, its XP cost and what must be bought first.
// Structure per the design doc; costs from numbers.ts.

import { XP_COST, type ClassId, type Element } from './numbers.ts';

export interface SkillNode {
  id: string;
  name: string;
  cost: number;
  requires: string[];   // all of these first
  cls?: ClassId;        // class line node
  element?: Element;    // element node
  hybridOf?: [Element, Element];
}

const nodes: SkillNode[] = [];
const add = (n: SkillNode) => nodes.push(n);

function classLine(cls: ClassId, ids: [string, string, string], names: [string, string, string]) {
  const costs = [XP_COST.classNode1, XP_COST.classNode2, XP_COST.capstone];
  ids.forEach((id, i) => add({ id, name: names[i], cost: costs[i], requires: i ? [ids[i - 1]] : [], cls }));
}

classLine('knight', ['holyStrike', 'charge', 'smite'], ['Holy strike', 'Charge', 'Smite']);
classLine('knight', ['selfHeal', 'crossHeal', 'resurrection'], ['Self-heal', 'Cross heal', 'Resurrection']);
// 2026-09-30: Double strike and Vengeance swapped places (Double strike is now the capstone).
classLine('barbarian', ['heavyStrike', 'vengeance', 'doubleStrike'], ['Heavy strike', 'Vengeance', 'Double strike']);
classLine('barbarian', ['intimidate', 'counterattack', 'inspire'], ['Intimidate', 'Counterattack', 'Inspire Berserkers']);
classLine('archer', ['takeAim', 'armorPierce', 'arrowRain'], ['Take Aim', 'Armor pierce', 'Arrow Rain']);
classLine('archer', ['scoutsEye', 'pinningShot', 'huntersMark'], ["Scout's eye", 'Pinning shot', "Hunter's mark"]);
classLine('mage', ['deepRest', 'manaSurge', 'doublecast'], ['Deep rest', 'Mana surge', 'Doublecast']);
classLine('mage', ['empower', 'cleanse', 'teleport'], ['Empower', 'Cleanse & status ward', 'Telepuppet']);
classLine('thief', ['invisibility', 'ambush', 'doubleDagger'], ['Invisibility', 'Ambush', 'Double dagger']);
classLine('thief', ['investor', 'pickpocket', 'launder'], ['Investor', 'Pickpocket', 'Launder']);

function elementBranch(element: Element, ids: [string, string], names: [string, string]) {
  add({ id: ids[0], name: names[0], cost: XP_COST.elementPassive, requires: [], element });
  add({ id: ids[1], name: names[1], cost: XP_COST.elementSpell, requires: [ids[0]], element });
}

elementBranch('fire', ['flaming', 'fireball'], ['Flaming weapon', 'Fireball']);
elementBranch('fire', ['burningAura', 'firewall'], ['Burning aura', 'Firewall']);
elementBranch('water', ['chilling', 'tidalWave'], ['Chilling weapon', 'Tidal wave']);
elementBranch('water', ['windchill', 'iceBlock'], ['Windchill', 'Ice block']);
elementBranch('earth', ['shattering', 'quake'], ['Shattering weapon', 'Quake']);
elementBranch('earth', ['stoneskin', 'fortify'], ['Stoneskin', 'Fortify']);

// Hybrids need node 2 of EITHER branch in both parents. `requires` can't say
// "either", so hybrids are checked by hybridUnlocked() instead.
add({ id: 'lightning', name: 'Lightning', cost: XP_COST.hybrid, requires: [], hybridOf: ['fire', 'water'] });
add({ id: 'poison', name: 'Poison', cost: XP_COST.hybrid, requires: [], hybridOf: ['fire', 'earth'] });
add({ id: 'nature', name: 'Nature', cost: XP_COST.hybrid, requires: [], hybridOf: ['earth', 'water'] });

export const SKILL_NODES: Record<string, SkillNode> = Object.fromEntries(nodes.map(n => [n.id, n]));

const ELEMENT_SPELLS: Record<Element, string[]> = {
  fire: ['fireball', 'firewall'], water: ['tidalWave', 'iceBlock'], earth: ['quake', 'fortify'],
};

export function hybridUnlocked(id: string, owned: Set<string>): boolean {
  const [a, b] = SKILL_NODES[id].hybridOf!;
  return ELEMENT_SPELLS[a].some(s => owned.has(s)) && ELEMENT_SPELLS[b].some(s => owned.has(s));
}

/** Smallest set containing `wanted` plus all prerequisites. For hybrids, picks the
 *  cheapest way in (the offense spell of each parent, if not already owned). */
export function closure(wanted: string[]): Set<string> {
  const out = new Set<string>();
  const visit = (id: string) => {
    if (out.has(id)) return;
    const n = SKILL_NODES[id];
    if (!n) throw new Error(`unknown skill ${id}`);
    n.requires.forEach(visit);
    out.add(id);
  };
  const hybrids = wanted.filter(id => SKILL_NODES[id].hybridOf);
  wanted.filter(id => !SKILL_NODES[id].hybridOf).forEach(visit);
  for (const h of hybrids) {
    for (const el of SKILL_NODES[h].hybridOf!) {
      if (!ELEMENT_SPELLS[el].some(s => out.has(s))) visit(ELEMENT_SPELLS[el][0]);
    }
    out.add(h);
  }
  return out;
}

export const xpOf = (set: Set<string>) => [...set].reduce((sum, id) => sum + SKILL_NODES[id].cost, 0);

/** Elements a skill set draws on (besides the hero's chosen one, others need landmarks). */
export function elementsUsed(set: Set<string>): Set<Element> {
  const els = new Set<Element>();
  for (const id of set) {
    const n = SKILL_NODES[id];
    if (n.element) els.add(n.element);
    if (n.hybridOf) n.hybridOf.forEach(e => els.add(e));
  }
  return els;
}

export function classOk(cls: ClassId, set: Set<string>): boolean {
  return [...set].every(id => !SKILL_NODES[id].cls || SKILL_NODES[id].cls === cls);
}
