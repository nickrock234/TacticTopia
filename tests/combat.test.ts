// Checks that the damage pipeline matches Combat Rules.md, using cases worked
// out by hand in the design discussion.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveHit, OPEN_DEFENDER } from '../engine/combat.ts';
import { evaluate, defender, type Plan, type Stage } from '../engine/attacks.ts';
import { closure, xpOf } from '../engine/skills.ts';

const weaponHit = (base: number, extra: Partial<{ flat: number; skillBonus: number; armorPierce: boolean }> = {}) =>
  ({ base, isSpell: false, skillBonus: 0, flat: 0, ...extra });
const spellHit = (base: number) => ({ base, isSpell: true, skillBonus: 0, flat: 0 });

test('block reduces weapon hits, not spells', () => {
  const d = { ...OPEN_DEFENDER, shield: 2 };
  assert.equal(resolveHit(weaponHit(7), d), 5);
  assert.equal(resolveHit(spellHit(5), d), 5);
});

test('minimum 1 damage per hit', () => {
  assert.equal(resolveHit(weaponHit(3), { ...OPEN_DEFENDER, shield: 3, otherBlock: 2 }), 1);
});

test('Ice block halves AFTER block, rounding down', () => {
  // 7 into block 2 = 5, halved = 2 (the doc's stated order)
  assert.equal(resolveHit(weaponHit(7), { ...OPEN_DEFENDER, shield: 2, iceBlock: true }), 2);
});

test('terrain reduces spells too', () => {
  assert.equal(resolveHit(spellHit(5), { ...OPEN_DEFENDER, onTerrain: true }), 4);
});

test('Armor pierce ignores only the shield part of block', () => {
  const d = { ...OPEN_DEFENDER, shield: 2, otherBlock: 1 };
  assert.equal(resolveHit(weaponHit(3, { armorPierce: true }), d), 2);
});

test("Hunter's mark adds +2", () => {
  assert.equal(resolveHit(weaponHit(3), { ...OPEN_DEFENDER, marked: true }), 5);
});

const stage: Stage = { name: 't', xp: 999, gear: 0, elements: 3 };
function plan(p: Partial<Plan> & Pick<Plan, 'cls' | 'weapon' | 'attack'>, wanted: string[]): Plan {
  const nodes = closure(wanted);
  return { pre: 'none', mark: false, surge: false, passives: [], mana: 0, nodes, xp: xpOf(nodes), ...p };
}

test('Greataxe Double strike + Flaming weapon = 16 (kills a 15 HP mage)', () => {
  const p = plan({ cls: 'barbarian', weapon: 'greataxe', attack: 'doubleStrike' }, ['doubleStrike', 'flaming']);
  assert.equal(evaluate(p, stage, defender('mage', 0, false)).damage, 16);
});

test('Double dagger + Ambush = 14; with Flaming weapon = 16', () => {
  const p = plan({ cls: 'thief', weapon: 'dagger', attack: 'ambush', pre: 'move' }, ['ambush', 'doubleDagger']);
  assert.equal(evaluate(p, stage, defender('mage', 0, false)).damage, 14);
  const q = plan({ cls: 'thief', weapon: 'dagger', attack: 'ambush', pre: 'move' }, ['ambush', 'doubleDagger', 'flaming']);
  assert.equal(evaluate(q, stage, defender('mage', 0, false)).damage, 16);
});

test("Flaming weapon boosts a mage's spells but not a knight's", () => {
  const m = plan({ cls: 'mage', weapon: 'staff', attack: 'fireball' }, ['fireball', 'flaming']);
  assert.equal(evaluate(m, stage, defender('knight', 0, false)).damage, 4);
  const k = plan({ cls: 'knight', weapon: 'sword', attack: 'fireball' }, ['fireball', 'flaming']);
  assert.equal(evaluate(k, stage, defender('knight', 0, false)).damage, 3);
});

test('Heavy strike is +3, Holy strike +2', () => {
  const b = plan({ cls: 'barbarian', weapon: 'greataxe', attack: 'heavyStrike' }, ['heavyStrike']);
  assert.equal(evaluate(b, stage, defender('knight', 0, false)).damage, 10);
  const k = plan({ cls: 'knight', weapon: 'sword', attack: 'holyStrike' }, ['holyStrike']);
  assert.equal(evaluate(k, stage, defender('knight', 0, false)).damage, 7);
});

test('hybrid closure buys the cheapest parent spells', () => {
  // Lightning: Flaming 15 + Fireball 30 + Chilling 15 + Tidal wave 30 + 60 = 150
  assert.equal(xpOf(closure(['lightning'])), 150);
});

import { generateMap } from '../engine/mapgen.ts';
import { newGame } from '../engine/state.ts';
import { kill, cast } from '../engine/rules.ts';

test('a knight can Resurrect a fallen ally within range 4', () => {
  const m = generateMap({ size: 24, teams: 2, perTeam: 2 }, 1)!;
  const g = newGame(m, [
    { cls: 'knight', archetype: 'Paladin', element: 'earth' }, { cls: 'mage', archetype: 'Artillery', element: 'fire' },
    { cls: 'barbarian', archetype: 'Berserker', element: 'fire' }, { cls: 'thief', archetype: 'Assassin', element: 'fire' },
  ]);
  for (const c of g.camps) c.respawn = 99; // no monster standing where the ally falls
  const [knight, ally] = g.heroes.filter(h => h.team === g.heroes[0].team);
  ally.pos = { x: knight.pos!.x + 3, y: knight.pos!.y };
  g.map.tiles[ally.pos.y * g.map.w + ally.pos.x] = 'plain';
  kill(g, ally, null);
  knight.skills.add('resurrection'); knight.actionsLeft = 2; knight.mana = 5;
  assert.equal(cast(g, knight, 'resurrection', { hero: ally.id }), true);
  assert.ok(ally.pos);
});

import { moveBudget, move as moveTo } from '../engine/rules.ts';
import { HERO_STATS, ENGAGED } from '../engine/numbers.ts';

test('the engaged move penalty applies once per turn, however many enemies are adjacent', () => {
  const m = generateMap({ size: 24, teams: 2, perTeam: 2 }, 1)!;
  m.tiles.fill('plain');
  const g = newGame(m, [
    { cls: 'barbarian', archetype: 'Berserker', element: 'fire' }, { cls: 'mage', archetype: 'Artillery', element: 'fire' },
    { cls: 'knight', archetype: 'Paladin', element: 'earth' }, { cls: 'thief', archetype: 'Assassin', element: 'fire' },
  ]);
  for (const f of g.fog) f.fill(1); // not a fog test: everything revealed
  for (const c of g.camps) c.respawn = 99; // no monster on the tile we step to
  const me = g.heroes.find(h => h.team === 0 && h.cls === 'barbarian')!;
  const foes = g.heroes.filter(h => h.team === 1);
  me.pos = { x: 10, y: 10 };
  foes[0].pos = { x: 11, y: 10 }; foes[1].pos = { x: 11, y: 11 };
  me.actionsLeft = 2; me.engagedPaid = false;
  const full = HERO_STATS.barbarian.move;
  assert.equal(moveBudget(g, me), full - ENGAGED.movePenalty);         // two adjacent enemies: still only -2
  assert.ok(moveTo(g, me, { x: 10, y: 11 }));                          // step away, staying next to an enemy
  assert.equal(moveBudget(g, me), full);                               // second move: no penalty again
});

test('engagement never drops movement below 1 (knight and mage can always step away)', () => {
  const m = generateMap({ size: 24, teams: 2, perTeam: 2 }, 1)!;
  m.tiles.fill('plain');
  const g = newGame(m, [
    { cls: 'knight', archetype: 'Crusader', element: 'fire' }, { cls: 'mage', archetype: 'Artillery', element: 'fire' },
    { cls: 'barbarian', archetype: 'Berserker', element: 'fire' }, { cls: 'thief', archetype: 'Assassin', element: 'fire' },
  ]);
  const knight = g.heroes.find(h => h.cls === 'knight')!;
  const foe = g.heroes.find(h => h.team !== knight.team)!;
  knight.pos = { x: 10, y: 10 }; foe.pos = { x: 11, y: 10 }; knight.engagedPaid = false;
  assert.equal(moveBudget(g, knight), 1);
});

import { detected, hiddenAdjacent, rest, attack, canAttack } from '../engine/rules.ts';

function openBoard() {
  const m = generateMap({ size: 24, teams: 2, perTeam: 2 }, 1)!;
  m.tiles.fill('plain');
  const g = newGame(m, [
    { cls: 'barbarian', archetype: 'Berserker', element: 'fire' }, { cls: 'mage', archetype: 'Artillery', element: 'fire' },
    { cls: 'knight', archetype: 'Paladin', element: 'earth' }, { cls: 'thief', archetype: 'Assassin', element: 'fire' },
  ]);
  for (const f of g.fog) f.fill(1);
  return g;
}

test('an invisible thief next to you stays hidden; you only get the cue', () => {
  const g = openBoard();
  const me = g.heroes.find(h => h.cls === 'barbarian')!, thief = g.heroes.find(h => h.cls === 'thief')!;
  me.pos = { x: 10, y: 10 }; thief.pos = { x: 11, y: 10 };
  thief.statuses.push({ kind: 'invisible', turns: 2, clock: thief.id, source: thief.id } as never);
  assert.equal(detected(g, thief, me.team), false);
  assert.equal(hiddenAdjacent(g, me), true);
  assert.equal(moveBudget(g, me), HERO_STATS.barbarian.move); // a hidden enemy doesn't engage
});

test('bumping into a hidden thief reveals him, cancels the move, and spends no action', () => {
  const g = openBoard();
  const me = g.heroes.find(h => h.cls === 'barbarian')!, thief = g.heroes.find(h => h.cls === 'thief')!;
  me.pos = { x: 10, y: 10 }; thief.pos = { x: 11, y: 10 }; me.actionsLeft = 2;
  thief.statuses.push({ kind: 'invisible', turns: 2, clock: thief.id, source: thief.id } as never);
  assert.equal(moveTo(g, me, { x: 12, y: 10 }), false);         // path runs through his tile
  assert.deepEqual(me.pos, { x: 10, y: 10 });
  assert.equal(me.actionsLeft, 2);
  assert.equal(detected(g, thief, me.team), true);
  assert.equal(hiddenAdjacent(g, me), false);
});

test('rest and attack can share a turn, in either order', () => {
  const g = openBoard();
  const me = g.heroes.find(h => h.cls === 'barbarian')!, foe = g.heroes.find(h => h.cls === 'knight')!;
  me.pos = { x: 10, y: 10 }; foe.pos = { x: 11, y: 10 };
  me.actionsLeft = 2;
  assert.ok(attack(g, me, { kind: 'hero', id: foe.id }));
  assert.ok(rest(g, me));
  me.actionsLeft = 2; me.attacked = false; me.rested = false;
  assert.ok(rest(g, me));
  assert.ok(canAttack(g, me, { kind: 'hero', id: foe.id }));
});

import { sellPrice, sellItem } from '../engine/rules.ts';

test('spare chest items sell for half of merchant price + upgrade', () => {
  assert.equal(sellPrice('sword', true), 7);   // (7 + 8) / 2, rounded down
  assert.equal(sellPrice('boots', true), 7);   // (6 + 8) / 2
  assert.equal(sellPrice('shield', false), 3);
  const g = openBoard();
  const h = g.heroes[0];
  h.inventory.push({ item: 'bow', upgraded: true });
  const gold = g.players[h.player].gold;
  assert.ok(sellItem(g, h, 0));
  assert.equal(g.players[h.player].gold, gold + 7);
  assert.equal(h.inventory.length, 0);
});

import { canGive, giveItem } from '../engine/rules.ts';
import { startTurn, respawnOptions, dueToRespawn } from '../engine/turn.ts';
import { cheb } from '../engine/mapgen.ts';
import { maxHp } from '../engine/state.ts';
import { ECON } from '../engine/economy.ts';

test('give: spares only, adjacent teammate, no action, receiver needs bag room', () => {
  const g = openBoard();
  const [a, b] = g.heroes.filter(h => h.team === 0), foe = g.heroes.find(h => h.team === 1)!;
  a.pos = { x: 10, y: 10 }; b.pos = { x: 11, y: 11 }; foe.pos = { x: 10, y: 11 };
  a.actionsLeft = 2;
  a.inventory.push({ item: 'shield', upgraded: true });
  assert.equal(canGive(g, a, foe, 0), false);          // not to an enemy
  assert.equal(canGive(g, a, b, 1), false);            // only items in the bag
  assert.ok(giveItem(g, a, b, 0));                     // diagonal counts as adjacent
  assert.equal(a.actionsLeft, 2);                      // no action spent
  assert.deepEqual(b.inventory, [{ item: 'shield', upgraded: true }]);
  b.pos = { x: 13, y: 10 };
  assert.equal(giveItem(g, b, a, 0), false);           // too far
  b.pos = { x: 11, y: 10 };
  for (let i = 0; i < ECON.bagSize; i++) a.inventory.push({ item: 'boots', upgraded: false });
  assert.equal(giveItem(g, b, a, 0), false);           // a's bag is full
});

test('respawn: base by default, or any landmark the player owns', () => {
  const g = openBoard();
  const h = g.heroes[0];
  const kill = () => { h.pos = null; h.hp = 0; h.diedAtTurn = g.turnCounter - g.order.length; };
  kill();
  assert.equal(respawnOptions(g, h).length, 1);        // nothing owned: base only
  assert.ok(dueToRespawn(g, h));
  startTurn(g, h);
  const b = g.map.bases[h.player];
  assert.ok(h.pos && cheb(h.pos, b) <= 1);
  // own a landmark, die again, pick it
  const lm = g.landmarks[0]; lm.owner = h.player;
  const m = g.map.landmarks[lm.idx];
  kill();
  const opts = respawnOptions(g, h);
  assert.equal(opts.length, 2);
  startTurn(g, h, (_g, _h, o) => o[1]);
  assert.ok(h.pos && cheb(h.pos, m) <= 1, 'respawned in the landmark territory');
  assert.equal(h.hp, maxHp(g, h));
});

import { endTurn } from '../engine/turn.ts';
import { maxManaOf } from '../engine/state.ts';

test('mana fountain: ending your turn in its territory refills mana, for the owner team only', () => {
  const g = openBoard();
  const lm = g.landmarks.find(l => g.map.landmarks[l.idx].bonus === 'fountain')!;
  const m = g.map.landmarks[lm.idx];
  const me = g.heroes.find(h => h.team === 0 && h.cls === 'mage')!, foe = g.heroes.find(h => h.team === 1)!;
  const mate = g.heroes.find(h => h.team === 0 && h.id !== me.id)!;
  lm.owner = mate.player;                              // owned by a teammate counts
  for (const h of [me, foe]) { h.pos = { x: m.x + 1, y: m.y }; h.mana = 0; }
  foe.pos = { x: m.x - 1, y: m.y };
  endTurn(g, me); endTurn(g, foe);
  assert.equal(me.mana, maxManaOf(g, me));
  assert.equal(foe.mana, 0);                           // enemies get nothing
  me.mana = 0; me.pos = { x: m.x + 2, y: m.y };        // outside the 3×3
  endTurn(g, me);
  assert.equal(me.mana, 0);
});

import { onExplorerEdge } from '../engine/rules.ts';

test('Explorer: reaching the map edge farthest from your base gives 15 XP, once', () => {
  const g = openBoard();
  const h = g.heroes[0], p = g.players[h.player], b = g.map.bases[h.player];
  const W = g.map.w;
  const H = g.map.h;
  h.pos = { x: b.x, y: b.y };
  assert.equal(onExplorerEdge(g, h), false);
  // bases sit near one edge (spread along it), so the far edge is the opposite one
  h.pos = [{ x: 0, y: b.y }, { x: W - 1, y: b.y }, { x: b.x, y: 0 }, { x: b.x, y: H - 1 }].find(p => onExplorerEdge(g, { ...h, pos: p }))!;
  assert.ok(onExplorerEdge(g, h));
  const xp = p.xp;
  endTurn(g, h);
  assert.ok(p.quests.has('explorer'));
  assert.equal(p.xp, xp + 15);
  endTurn(g, h);
  assert.equal(p.xp, xp + 15);                         // only once
});

import { spellEffects, attackEffects, canCast } from '../engine/rules.ts';
import { hasStatus } from '../engine/state.ts';

function areaBoard() {
  const g = openBoard();
  for (const c of g.camps) c.respawn = 99; // no monsters in the way
  const [barb, mage, knight, thief] = g.heroes;
  for (const h of g.heroes) { h.actionsLeft = 2; h.mana = 20; }
  return { g, barb, mage, knight, thief };
}

test('the Smite preview names exactly who gets hit, and for how much', () => {
  const { g, barb, mage, knight } = areaBoard();
  knight.skills.add('smite');
  knight.pos = { x: 10, y: 10 }; barb.pos = { x: 12, y: 10 }; mage.pos = { x: 11, y: 11 }; // mage is diagonal: outside the cross
  const fx = spellEffects(g, knight, 'smite');
  assert.deepEqual(fx.map(e => e.pos), [{ x: 12, y: 10 }]);
  const before = barb.hp;
  assert.ok(cast(g, knight, 'smite', {}));
  assert.equal(before - barb.hp, fx[0].amount);
  assert.equal(mage.hp, maxHp(g, mage));
});

test('Inspire casts with no target and buffs allies within 4', () => {
  const { g, barb, mage } = areaBoard();
  barb.skills.add('inspire');
  barb.pos = { x: 10, y: 10 }; mage.pos = { x: 14, y: 12 };
  assert.ok(canCast(g, barb, 'inspire', {}));
  assert.equal(spellEffects(g, barb, 'inspire').length, 2);
  assert.ok(cast(g, barb, 'inspire', {}));
  assert.ok(hasStatus(mage, 'inspire'));
});

test('a Flail attack preview covers every adjacent enemy, matching the real hit', () => {
  const { g, barb, mage, knight } = areaBoard();
  knight.weapon = 'flail';
  knight.pos = { x: 10, y: 10 }; barb.pos = { x: 11, y: 10 }; mage.pos = { x: 9, y: 11 };
  const fx = attackEffects(g, knight, { kind: 'hero', id: barb.id });
  assert.equal(fx.length, 2);
  const hp = [barb.hp, mage.hp];
  assert.ok(attack(g, knight, { kind: 'hero', id: barb.id }));
  assert.deepEqual([hp[0] - barb.hp, hp[1] - mage.hp], fx.map(e => e.amount));
});

import { destinations } from '../engine/rules.ts';

test('the fog line: a move only covers tiles your team has revealed', () => {
  const { g, barb } = areaBoard();
  barb.pos = { x: 10, y: 10 };
  const fog = g.fog[barb.team];
  fog.fill(0);
  for (let x = 8; x <= 12; x++) for (let y = 8; y <= 12; y++) fog[y * g.map.w + x] = 1; // 2 tiles revealed each way
  const ds = destinations(g, barb).map(i => ({ x: i % g.map.w, y: Math.floor(i / g.map.w) }));
  assert.ok(ds.some(p => p.x === 12 && p.y === 10));     // the edge of what's revealed
  assert.ok(!ds.some(p => p.x === 13 && p.y === 10));    // 3 tiles out is in fog: no
  assert.equal(moveTo(g, barb, { x: 14, y: 10 }), false);
  assert.ok(moveTo(g, barb, { x: 12, y: 10 }));
  assert.equal(fog[10 * g.map.w + 15], 1);               // arriving reveals (vision 3), so the next move goes further
});

import { aimedEffects, firewallTiles, tidalTiles, dirToward } from '../engine/rules.ts';

test('the Fireball preview matches the real cast: 3×3 around the tile, same damage', () => {
  const { g, barb, mage, knight, thief } = areaBoard();
  mage.skills.add('fireball');
  mage.pos = { x: 10, y: 10 }; barb.pos = { x: 9, y: 10 };
  knight.pos = { x: 13, y: 10 }; thief.pos = { x: 15, y: 10 };            // thief 2 tiles from the centre: outside
  const at = { x: 13, y: 11 };
  const { tiles, effects } = aimedEffects(g, mage, 'fireball', { target: at });
  assert.equal(tiles.length, 9);
  assert.deepEqual(effects.map(e => e.pos), [{ x: 13, y: 10 }]);
  const hp = knight.hp;
  assert.ok(cast(g, mage, 'fireball', { target: at }));
  assert.equal(hp - knight.hp, effects[0].amount);
  assert.equal(thief.hp, maxHp(g, thief));
});

test('Tidal wave aims along a tapped direction; Firewall opens toward the tapped side', () => {
  const { g, mage } = areaBoard();
  mage.pos = { x: 10, y: 10 };
  const d = dirToward(mage.pos, { x: 12, y: 8 });                          // up-right diagonal
  assert.deepEqual(tidalTiles(g, mage.pos, d), [{ x: 11, y: 9 }, { x: 12, y: 8 }, { x: 13, y: 7 }]);
  const open = dirToward(mage.pos, { x: 10, y: 11 });                      // open side: +y
  const u = firewallTiles(g, mage.pos, open);
  assert.equal(u.length, 5);
  assert.ok(!u.some(p => p.y === 11));                                     // the whole +y side stays open
});

import { equipItem, canEquip } from '../engine/rules.ts';

test('equipping a spare swaps it with what you wear; a two-handed weapon bags the shield', () => {
  const { g, barb, knight } = areaBoard();
  knight.inventory = [{ item: 'flail', upgraded: true }, { item: 'boots', upgraded: true, terrain: 'mountain' }];
  assert.ok(equipItem(g, knight, 0));
  assert.equal(knight.weapon, 'flail'); assert.ok(knight.weaponUpgraded);
  assert.deepEqual(knight.inventory.map(i => i.item), ['boots', 'sword']);
  assert.ok(equipItem(g, knight, 0));
  assert.equal(knight.boots, 'mountain');                                // the terrain survived the bag
  assert.equal(canEquip(g, knight, knight.inventory.findIndex(i => i.item === 'sword')), true);
  // barbarian with a shield equips the two-handed spear: the shield goes to the bag
  barb.weapon = 'greataxe'; barb.shield = 0; barb.inventory = [{ item: 'spear', upgraded: false }, { item: 'shield', upgraded: false }];
  assert.equal(canEquip(g, barb, 1), false);                             // no shield with a two-handed axe
  assert.equal(canEquip(g, knight, 0), true);
  assert.equal(canEquip(g, barb, 0), true);
  assert.ok(equipItem(g, barb, 0));
  assert.equal(barb.weapon, 'spear');
  assert.deepEqual(barb.inventory.map(i => i.item).sort(), ['greataxe', 'shield']);
});

import { buyItem } from '../engine/rules.ts';

test('buying the second weapon puts the old one in the bag; a full bag refuses the buy', () => {
  const { g, knight } = areaBoard();
  g.players[knight.player].buildings.add('armory'); g.players[knight.player].gold = 100;
  knight.weaponUpgraded = true;
  assert.ok(buyItem(g, knight, 'weapon2'));
  assert.equal(knight.weapon, 'flail');
  assert.deepEqual(knight.inventory, [{ item: 'sword', upgraded: true }]);
  const { g: g2, knight: k2 } = areaBoard();
  g2.players[k2.player].buildings.add('armory'); g2.players[k2.player].gold = 100;
  k2.inventory = Array.from({ length: 5 }, () => ({ item: 'boots', upgraded: false }));
  assert.equal(buyItem(g2, k2, 'weapon2'), false);
  assert.equal(k2.weapon, 'sword');
});

import { decoySpot, placeDecoy } from '../engine/rules.ts';

test('the Body double goes where decoySpot says, and only one at a time', () => {
  const { g, thief } = areaBoard();
  const lm = g.map.landmarks[0];
  thief.pos = { x: lm.x, y: lm.y };
  const spot = decoySpot(g, thief);
  assert.ok(spot);
  assert.ok(placeDecoy(g, thief));
  assert.deepEqual(g.landmarks[0].pending?.decoy, spot);
  assert.equal(decoySpot(g, thief), null);                  // this landmark now has a claim pending
});
