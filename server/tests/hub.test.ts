// The server's logic, driven by fake phones (no sockets): lobby, start, turns, fog, saving.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Hub, type Conn, type ServerMsg } from '../src/hub.ts';
import { MemoryStore } from '../src/store.ts';
import { visibleTo } from '../../engine/rules.ts';
import { botTurn, botRespawn } from '../../sim/bots.ts';
import type { HeroView } from '../src/view.ts';

const BOT = { turn: botTurn, respawn: botRespawn };
type Phone = Conn & { got: ServerMsg[]; last: (t: string) => any };
const phone = (): Phone => { const got: ServerMsg[] = []; return { got, send: m => got.push(m), last: t => [...got].reverse().find(m => m.type === t) }; };

function lobby(store = new MemoryStore()) {
  const hub = new Hub(store, BOT, () => 42);
  const host = phone(), friend = phone();
  hub.handle(host, { type: 'create', name: 'Nick', perTeam: 2, archetype: 'Crusader' });
  const { gameId, token: hostToken } = host.last('joined');
  hub.handle(friend, { type: 'join', gameId, name: 'Sam', archetype: 'Sniper' });
  const { token: friendToken, seat: friendSeat } = friend.last('joined');
  return { hub, store, host, friend, gameId, hostToken, friendToken, friendSeat };
}

test('lobby: the host gets seat 0, a friend lands on the other team, both see the lobby', () => {
  const { host, friend, friendSeat } = lobby();
  assert.equal(host.last('joined').seat, 0);
  assert.equal(friendSeat, 2);                              // team 1 has fewer people
  const l = host.last('lobby');
  assert.equal(l.seats[2].name, 'Sam');
  assert.equal(l.seats[1].open, true);
  assert.equal(friend.last('lobby').host, false);
});

test('only the host starts; empty seats become bots; each phone gets its team view', () => {
  const { hub, host, friend, gameId, hostToken, friendToken } = lobby();
  hub.handle(friend, { type: 'start', gameId, token: friendToken });
  assert.equal(friend.last('error').message, 'only the host can start');
  hub.handle(host, { type: 'start', gameId, token: hostToken });
  const a = host.last('state'), b = friend.last('state');
  assert.ok(a && b);
  assert.deepEqual(a.names, ['Nick', null, 'Sam', null]);  // seats 1 and 3: bots
  assert.equal(a.view.heroes[0].archetype, 'Crusader');
  assert.equal(b.view.heroes[2].archetype, 'Sniper');
});

test('fog: a team view hides what that team cannot see', () => {
  const { hub, host, gameId, hostToken } = lobby();
  hub.handle(host, { type: 'start', gameId, token: hostToken });
  const v = host.last('state').view;
  for (const h of v.heroes as HeroView[]) {
    if (h.team === 0) continue;
    assert.equal(h.mana, 0);                                // enemy mana hidden
    if (h.hidden) assert.equal(h.pos, null);
  }
  assert.ok(v.fog[1].every((x: number) => x === 0));        // the other team's fog is not sent
  assert.equal(v.players[2].gold, 0);
  const unseen = v.map.tiles.findIndex((_: string, i: number) => !v.fog[0][i]);
  assert.equal(v.map.tiles[unseen], 'plain');
});

test('turns: out-of-turn actions are refused; ending your turn runs the bots and the friend', () => {
  const { hub, host, friend, gameId, hostToken, friendToken } = lobby();
  hub.handle(host, { type: 'start', gameId, token: hostToken });
  const s = host.last('state');
  const up = s.view.order[s.turnIndex];
  const [me, them, myTok, theirTok] = up === 0 ? [host, friend, hostToken, friendToken] : [friend, host, friendToken, hostToken];
  hub.handle(them, { type: 'act', gameId, token: theirTok, action: { t: 'rest' } });
  assert.equal(them.last('error').message, 'not your turn');
  hub.handle(me, { type: 'act', gameId, token: myTok, action: { t: 'end' } });
  const after = them.last('state');
  assert.equal(after.view.order[after.turnIndex], up === 0 ? 2 : 0); // the other person is up now
});

test('a restart loses nothing: a new server on the same saves picks the game up', () => {
  const { hub, store, host, gameId, hostToken } = lobby();
  hub.handle(host, { type: 'start', gameId, token: hostToken });
  const before = host.last('state');
  const hub2 = new Hub(store, BOT, () => 42), again = phone();
  hub2.handle(again, { type: 'hello', gameId, token: hostToken });
  const s = again.last('state');
  assert.equal(s.turnIndex, before.turnIndex);
  assert.equal(s.view.round, before.view.round);
  assert.ok(s.view.heroes[0].skills instanceof Set);
});

test('a whole online game plays to the end', () => {
  const { hub, host, friend, gameId, hostToken, friendToken } = lobby();
  hub.handle(host, { type: 'start', gameId, token: hostToken });
  const tok: Record<number, [Phone, string]> = { 0: [host, hostToken], 2: [friend, friendToken] };
  for (let i = 0; i < 2000; i++) {
    const s = host.last('state');
    if (s.over) break;
    const [p, t] = tok[s.view.order[s.turnIndex]];
    hub.handle(p, { type: 'act', gameId, token: t, action: { t: 'end' } });
  }
  assert.ok(host.last('state').over);
});

test('enemy positions in a view are only the ones that team can see', () => {
  const { hub, host, gameId, hostToken } = lobby();
  hub.handle(host, { type: 'start', gameId, token: hostToken });
  // drive a few rounds so heroes spread out
  for (let i = 0; i < 6; i++) {
    const s = host.last('state');
    if (s.over) break;
    if (s.view.order[s.turnIndex] === 0) hub.handle(host, { type: 'act', gameId, token: hostToken, action: { t: 'end' } });
  }
  const v = host.last('state').view;
  for (const h of v.heroes as HeroView[]) if (h.team === 1 && h.pos) assert.ok(v.fog[0][h.pos.y * v.map.w + h.pos.x] === 1);
  void visibleTo;
});

test('list: the home screen gets title, mode and whose turn for the games a phone holds', () => {
  const { hub, host, gameId, hostToken } = lobby();
  const p = phone();
  hub.handle(p, { type: 'list', games: [{ gameId, token: hostToken }, { gameId, token: 'wrong' }, { gameId: 'nope', token: hostToken }] });
  let l = p.last('list').games;
  assert.equal(l.length, 1);
  assert.equal(l[0].title, "Nick's game");
  assert.equal(l[0].started, false);
  hub.handle(host, { type: 'start', gameId, token: hostToken });
  hub.handle(p, { type: 'list', games: [{ gameId, token: hostToken }] });
  l = p.last('list').games;
  assert.equal(l[0].started, true);
  assert.ok(l[0].turn === 0 || l[0].turn === 2); // bots have played: a person is up
});

test('paced bots: with a step delay the bots play one turn per message until a person is up', async () => {
  const hub = new Hub(new MemoryStore(), BOT, () => 42, 5);
  const host = phone();
  hub.handle(host, { type: 'create', name: 'Nick', perTeam: 2 });
  const { gameId, token } = host.last('joined');
  hub.handle(host, { type: 'start', gameId, token });
  for (let i = 0; i < 200 && host.last('state').view.order[host.last('state').turnIndex] !== 0; i++) await new Promise(r => setTimeout(r, 10));
  const states = host.got.filter(m => m.type === 'state');
  assert.equal(states.at(-1)!.type === 'state' && states.at(-1)!.view.order[states.at(-1)!.turnIndex], 0);
  // the turn moved one hero at a time
  for (let i = 1; i < states.length; i++) {
    const a = states[i - 1], b = states[i];
    if (a.type !== 'state' || b.type !== 'state') continue;
    assert.ok(b.turnIndex === a.turnIndex || b.turnIndex === (a.turnIndex + 1) % a.view.order.length);
  }
});
