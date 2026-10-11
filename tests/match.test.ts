// The shared turn flow (engine/match.ts) and saving games (engine/serialize.ts): what the offline
// app and the server both stand on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap } from '../engine/mapgen.ts';
import { newGame } from '../engine/state.ts';
import { MAP_SIZE } from '../engine/numbers.ts';
import { newMatch, startMatch, stepAuto, applyAction, currentHero, waitingForHuman, matchOver, type Bot } from '../engine/match.ts';
import { toJSON, loadState } from '../engine/serialize.ts';
import { botTurn, botRespawn, ARCH } from '../sim/bots.ts';
import { canCast } from '../engine/rules.ts';

const BOT: Bot = { turn: botTurn, respawn: botRespawn };

function game(seed = 7) {
  let map = null;
  for (let s = seed; !map; s++) map = generateMap({ size: MAP_SIZE[2], teams: 2, perTeam: 2 }, s);
  const picks = ['Crusader', 'Sniper', 'Berserker', 'Artillery'];
  return newGame(map, map.bases.map((_, i) => { const a = ARCH[picks[i]]; return { cls: a.cls, archetype: a.id, element: a.element }; }));
}

test('a saved game loads back the same, Sets and fog included', () => {
  const g = game();
  g.heroes[0].skills.add('holyStrike');
  g.players[0].buildings.add('forge');
  g.fog[0][5] = 1;
  const back = loadState(toJSON(g));
  assert.ok(back.heroes[0].skills instanceof Set && back.heroes[0].skills.has('holyStrike'));
  assert.ok(back.players[0].buildings.has('forge'));
  assert.ok(back.fog[0] instanceof Uint8Array && back.fog[0][5] === 1);
  assert.ok(back.fields instanceof Map);
  assert.equal(toJSON(back), toJSON(g));
});

test('turns: bots play until a person is up; out-of-turn actions are refused', () => {
  const m = newMatch(game(), [0]);
  startMatch(m, BOT);
  assert.ok(waitingForHuman(m));
  assert.equal(currentHero(m).id, 0);
  assert.equal(applyAction(m, 1, { t: 'rest' }, BOT), 'not your turn');
  const round = m.g.round;
  assert.equal(applyAction(m, 0, { t: 'end' }, BOT), null);
  while (stepAuto(m, BOT)) { /* the others */ }
  assert.equal(currentHero(m).id, 0);
  assert.equal(m.g.round, round + 1);
});

test('an all-bot match runs to the end through the same flow', () => {
  const m = newMatch(game(11), []);
  startMatch(m, BOT);
  assert.ok(matchOver(m));
});

test('a game survives a save and load in the middle of play', () => {
  const m = newMatch(game(3), [0]);
  startMatch(m, BOT);
  const saved = toJSON({ ...m, g: undefined, state: m.g });
  const back = JSON.parse(saved);
  const m2 = { ...newMatch(loadState(toJSON(m.g)), back.humans), turnIndex: back.turnIndex, respawnChoice: back.respawnChoice };
  assert.equal(applyAction(m2, 0, { t: 'end' }, BOT), null);
  while (stepAuto(m2, BOT)) { /* the others */ }
  assert.equal(currentHero(m2).id, 0);
});

test('a person ends their own turn, even with no actions left (they may still shop)', () => {
  const m = newMatch(game(), [0]);
  startMatch(m, BOT);
  currentHero(m).actionsLeft = 0;
  assert.ok(waitingForHuman(m));
  assert.equal(stepAuto(m, BOT), false);
});

test('Telepuppet: a person takes the ally\'s one action (not a move), or skips it; then the ally is as it was', () => {
  let map = null;
  for (let s = 7; !map; s++) map = generateMap({ size: MAP_SIZE[2], teams: 2, perTeam: 2 }, s);
  const picks = ['Enchanter', 'Crusader', 'Berserker', 'Sniper'];
  const g = newGame(map, map.bases.map((_, i) => { const a = ARCH[picks[i]]; return { cls: a.cls, archetype: a.id, element: a.element }; }));
  const m = newMatch(g, [0]);
  startMatch(m, BOT);
  const mage = g.heroes[0], ally = g.heroes[1];
  assert.equal(currentHero(m).id, 0);
  mage.skills.add('teleport'); mage.mana = 8; g.fog[0].fill(1);
  // put the ally next to the mage and find somewhere to send it
  let cast: { hero: number; dest: { x: number; y: number } } | null = null;
  for (let dy = -1; dy <= 1 && !cast; dy++) for (let dx = -1; dx <= 1 && !cast; dx++) {
    if (!dx && !dy) continue;
    ally.pos = { x: mage.pos!.x + dx, y: mage.pos!.y + dy };
    for (let ty = -5; ty <= 5 && !cast; ty++) for (let tx = -5; tx <= 5 && !cast; tx++) {
      const dest = { x: mage.pos!.x + tx, y: mage.pos!.y + ty };
      if (canCast(g, mage, 'teleport', { hero: 1, dest })) cast = { hero: 1, dest };
    }
  }
  assert.ok(cast, 'found a Telepuppet cast');
  ally.actionsLeft = 2; ally.attacked = true;
  assert.equal(applyAction(m, 0, { t: 'cast', spell: 'teleport', args: cast! }, BOT), null);
  assert.equal(m.puppet?.ally, 1);
  assert.equal(ally.actionsLeft, 1);
  assert.equal(applyAction(m, 0, { t: 'move', to: mage.pos! }, BOT), 'the puppet can only act');
  assert.equal(applyAction(m, 0, { t: 'rest' }, BOT), null);   // the ally's one action
  assert.equal(m.puppet, null);
  assert.equal(ally.actionsLeft, 2); assert.equal(ally.attacked, true); // its own turn comes back
  assert.equal(currentHero(m).id, 0);                               // still the mage's turn, to end
  assert.ok(waitingForHuman(m));
});

test('each turn start records an income report whose lines add up to what was paid', () => {
  const m = newMatch(game(), [0]);
  startMatch(m, BOT);
  const g = m.g, p = g.players[0];
  const r = p.report!;
  assert.ok(r && r.turn === g.turnCounter);
  assert.equal(r.lines[0].label, 'Base');
  // first turn: nothing was owned yet, so the lines are exactly what the player holds
  assert.equal(r.lines.reduce((s, l) => s + l.gold, 0), p.gold);
  assert.equal(r.lines.reduce((s, l) => s + l.xp, 0), p.xp);
});
