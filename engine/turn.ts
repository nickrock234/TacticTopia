// Turn cycle: what happens at the start and end of each hero's turn, and a
// full round. The deciding (which actions to take) is done by a controller
// (a bot now, a human later), passed in as a callback.

import { HERO_STATS, MANA, SKILL, RESPAWN } from './numbers.ts';
import { BUILDING, ECON, QUESTS } from './economy.ts';
import { NPC } from './economy.ts';
import { cheb, walkField, type Pos } from './mapgen.ts';
import { type GameState, type Hero, type IncomeLine, idx, posOf, reveal, maxHp, maxManaOf, hasStatus, statusAmount, log } from './state.ts';
import { checkExplorer, gainGold, gainXp, landmarkAt, blocker, onFriendlyRoad, sortInventory, kill, placeDecoy } from './rules.ts';

export type Controller = (g: GameState, h: Hero) => void;
/** Picks where a dead hero comes back, from respawnOptions (Nick, 2026-10-01). */
export type RespawnPicker = (g: GameState, h: Hero, options: Pos[]) => Pos;

/** Where a hero can respawn: the base first, then every landmark the player owns. */
export function respawnOptions(g: GameState, h: Hero): Pos[] {
  const b = g.map.bases[h.player];
  return [{ x: b.x, y: b.y }, ...g.landmarks.filter(l => l.owner === h.player).map(l => ({ x: g.map.landmarks[l.idx].x, y: g.map.landmarks[l.idx].y }))];
}

/** True if this hero will respawn when its next turn starts (call before startTurn). */
export function dueToRespawn(g: GameState, h: Hero): boolean {
  if (h.pos || h.eliminated) return false;
  return RESPAWN.mode === 'oneRound' ? g.turnCounter + 1 - h.diedAtTurn >= g.order.length : h.respawnIn <= 1;
}

/** What a player's per-turn income is made of, one line per source (before any theft by a base occupier). */
export function incomeLines(g: GameState, player: number): IncomeLine[] {
  const p = g.players[player];
  const lines: IncomeLine[] = [{ label: 'Base', xp: ECON.baseXp, gold: ECON.baseGold }];
  let bxp = 0, bgold = 0;
  for (const id of p.buildings) { bxp += BUILDING[id].xp; bgold += BUILDING[id].gold; }
  if (bxp || bgold) lines.push({ label: 'Buildings', xp: bxp, gold: bgold });
  const owned = g.landmarks.filter(l => l.owner === player);
  if (owned.length) lines.push({ label: owned.length > 1 ? `Landmarks ×${owned.length}` : 'Landmark', xp: owned.length * ECON.landmarkXp, gold: 0 });
  const mines = owned.filter(l => g.map.landmarks[l.idx].bonus === 'mine').length;
  if (mines) lines.push({ label: mines > 1 ? `Gold mines ×${mines}` : 'Gold mine', xp: 0, gold: mines * ECON.goldMineGold });
  if (p.buildings.has('territory2') && owned.length) lines.push({ label: 'City hall', xp: 0, gold: owned.length * ECON.territory2PerLandmarkGold });
  if (p.quests.has('builder')) lines.push({ label: 'Builder quest', xp: QUESTS.builder.xpPerTurn, gold: 0 });
  if (p.quests.has('treasurer')) lines.push({ label: 'Treasurer quest', xp: 0, gold: QUESTS.treasurer.goldPerTurn });
  if (g.heroes[player].skills.has('investor')) {
    const xp = lines.reduce((s, l) => s + l.xp, 0);
    lines.push({ label: 'Investor', xp: 0, gold: Math.floor(xp / 3) });
  }
  return lines;
}

/** XP and gold a player earns per turn right now (before any theft by a base occupier). */
export function income(g: GameState, player: number): { xp: number; gold: number } {
  const lines = incomeLines(g, player);
  return { xp: lines.reduce((s, l) => s + l.xp, 0), gold: lines.reduce((s, l) => s + l.gold, 0) };
}

function collectIncome(g: GameState, player: number) {
  const p = g.players[player];
  const lines = incomeLines(g, player);
  let xp = lines.reduce((s, l) => s + l.xp, 0), gold = lines.reduce((s, l) => s + l.gold, 0);
  // Base occupied by an enemy last round: they took some of the gold income.
  const stolen = Math.min(p.stolenNext, gold);
  gold -= stolen; p.stolenNext = 0;
  if (stolen) lines.push({ label: 'Base raided', xp: 0, gold: -stolen });
  // gold a raid of an enemy base earned at the end of this player's last turn
  for (const c of p.carry ?? []) lines.push(c);
  p.carry = [];
  p.report = { turn: g.turnCounter, lines };
  gainXp(g, player, xp); gainGold(g, player, gold);
  if (!p.quests.has('treasurer') && p.gold >= QUESTS.treasurer.hold) p.quests.add('treasurer');
}

function claim(g: GameState, lmIdx: number, player: number) {
  const l = g.landmarks[lmIdx];
  l.owner = player; l.pending = null;
  // Road: shortest route over plains from the landmark to the claimer's base.
  const base = g.map.bases[player];
  const f = walkField(g.map, base);
  const lm = g.map.landmarks[lmIdx];
  // walk downhill from the landmark's nearest walkable tile
  let cur = -1, best = Infinity;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const i = (lm.y + dy) * g.map.w + lm.x + dx; if (f[i] >= 0 && f[i] < best) { best = f[i]; cur = i; }
  }
  const road: number[] = [];
  while (cur >= 0 && f[cur] > 0) {
    road.push(cur);
    const p = posOf(g, cur); let next = -1;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = p.x + dx, y = p.y + dy; if (x < 0 || y < 0 || x >= g.map.w || y >= g.map.h) continue;
      const i = y * g.map.w + x; if (f[i] >= 0 && f[i] < f[cur]) { next = i; }
    }
    cur = next;
  }
  l.road = road;
  const p = g.players[player];
  if (!p.quests.has('conqueror') && g.landmarks.filter(x => x.owner === player).length >= 3) p.quests.add('conqueror');
  log(g, `P${player} claimed landmark ${lmIdx} (${lm.element ?? ''}${lm.bonus !== 'none' ? '+' + lm.bonus : ''})`);
}

export function startTurn(g: GameState, h: Hero, pickRespawn?: RespawnPicker) {
  g.turnCounter++;
  const p = g.players[h.player];
  collectIncome(g, h.player);
  // Claims complete if the hero is still in the territory, or its Body double survived.
  for (const l of g.landmarks) if (l.pending?.hero === h.id) {
    const inside = h.pos && landmarkAt(g, h.pos) === l.idx;
    if (inside || l.pending.decoy) claim(g, l.idx, h.player); else l.pending = null;
  }
  // zones cast by this hero expire
  g.zones = g.zones.filter(z => z.caster !== h.id);

  if (!h.pos) {
    // The body stays (for Resurrection) until the hero's first turn after one full
    // round of play since the death; then it respawns at base, or is removed if eliminated.
    const roundPassed = g.turnCounter - h.diedAtTurn >= g.order.length;
    if (RESPAWN.mode === 'oneRound' ? !roundPassed : false) { h.actionsLeft = 0; return; }
    if (h.eliminated) { h.deathPos = null; h.actionsLeft = 0; return; }
    if (RESPAWN.mode === 'escalating' && h.respawnIn > 0) h.respawnIn--;
    if (RESPAWN.mode === 'oneRound' || h.respawnIn === 0) {
      // respawn at the base or an owned landmark (the picker chooses; default base),
      // on the nearest free tile
      const options = respawnOptions(g, h);
      const want = pickRespawn ? pickRespawn(g, h, options) : options[0];
      const b = options.find(o => o.x === want.x && o.y === want.y) ?? options[0];
      let spot = { x: b.x, y: b.y };
      if (blocker(g, spot)) {
        outer: for (let r = 1; r < 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          const q = { x: b.x + dx, y: b.y + dy };
          if (q.x >= 0 && q.y >= 0 && q.x < g.map.w && q.y < g.map.h && g.map.tiles[idx(g, q)] === 'plain' && !blocker(g, q)) { spot = q; break outer; }
        }
      }
      h.pos = spot; h.hp = maxHp(g, h); h.mana = maxManaOf(g, h); h.deathPos = null;
      g.events.push({ t: 'respawn', hero: h.id, pos: { ...spot } });
      reveal(g, h.team, h.pos, HERO_STATS[h.cls].vision);
    } else { h.actionsLeft = 0; return; }
  }

  // per-turn scratch
  h.actionsLeft = 2 - Math.min(1, statusAmount(h, 'paralysis'));
  h.attacked = false; h.moved = false; h.rested = false; h.straightRun = 0; h.engagedPaid = false;
  h.startedOnRoad = onFriendlyRoad(g, h);

  // regen (building effects are global)
  h.mana = Math.min(maxManaOf(g, h), h.mana + MANA.regenPerTurn + (p.buildings.has('shrine') ? MANA.shrineRegen : 0));
  if (p.buildings.has('apothecary')) h.hp = Math.min(maxHp(g, h), h.hp + 1);
  if (h.surgeCd > 0) h.surgeCd--;

  // damage over time: poison, standing in an enemy Firewall
  const poison = statusAmount(h, 'poison');
  if (poison) { h.hp -= poison; if (h.hp <= 0) { kill(g, h, g.heroes[h.statuses.find(s => s.kind === 'poison')!.source]); return; } }
  for (const z of g.zones) if (z.team !== h.team && z.tiles.includes(idx(g, h.pos!))) {
    h.hp -= z.damage; if (h.hp <= 0) { kill(g, h, g.heroes[z.caster]); return; }
  }

  // tick statuses whose clock is this hero (debuffs on this hero have already
  // taken effect above via actionsLeft / moveBudget, which read them this turn)
  for (const o of g.heroes) for (const s of o.statuses) if (s.clock === h.id && !(o.id === h.id && ['chill', 'pinned', 'paralysis'].includes(s.kind))) s.turns--;
  for (const o of g.heroes) o.statuses = o.statuses.filter(s => s.turns > 0);

  sortInventory(g, h);
}

export function endTurn(g: GameState, h: Hero) {
  // one-turn debuffs (chill, pin, paralysis) are used up
  h.statuses = h.statuses.filter(s => !(s.clock === h.id && ['chill', 'pinned', 'paralysis'].includes(s.kind)));
  if (!h.pos) return;
  checkExplorer(g, h); // also catches pushes and teleports onto the edge
  // Mana fountain (Nick, 2026-10-01): end your turn in the territory of a fountain your
  // team owns and your mana refills. [G] owner's team, not just the owner.
  if (g.landmarks.some(l => l.owner !== null && g.players[l.owner].team === h.team &&
      g.map.landmarks[l.idx].bonus === 'fountain' && cheb(g.map.landmarks[l.idx], h.pos!) <= 1)) h.mana = maxManaOf(g, h);
  // Firewall: enemies inside at the end of the caster's turn take damage
  for (const z of g.zones) if (z.caster === h.id) for (const e of g.heroes) if (e.team !== h.team && e.pos && z.tiles.includes(idx(g, e.pos))) {
    e.hp -= z.damage; g.stats.heroDamage[h.id] += z.damage; if (e.hp <= 0) kill(g, e, h);
  }
  // landmark claim
  const lm = landmarkAt(g, h.pos);
  if (lm !== null) {
    const l = g.landmarks[lm];
    const ownerTeam = l.owner === null ? -1 : g.players[l.owner].team;
    if (ownerTeam !== h.team && !l.pending) {
      if (h.cls === 'thief') placeDecoy(g, h); // Body double holds the claim
      else l.pending = { player: h.player, hero: h.id, decoy: null };
    }
  }
  // Standing on an enemy base: take that base's gold income for the turn (max 5, thief 8).
  for (const b of g.map.bases) if (b.team !== h.team && b.x === h.pos.x && b.y === h.pos.y) {
    const income = ECON.baseGold + [...g.players[b.player].buildings].reduce((s, id) => s + BUILDING[id].gold, 0);
    const take = Math.min(h.cls === 'thief' ? 8 : 5, income);
    g.players[b.player].stolenNext = take;
    gainGold(g, h.player, take);
    (g.players[h.player].carry ??= []).push({ label: 'Base raid', xp: 0, gold: take });
  }
  reveal(g, h.team, h.pos, HERO_STATS[h.cls].vision);
}

/** One full round: every hero takes a turn in order. NPCs respawn at round start. */
export function playRound(g: GameState, control: Controller, pickRespawn?: RespawnPicker) {
  for (const c of g.camps) if (c.respawn !== 0 && c.respawn <= g.round && !blocker(g, g.map.camps[c.idx])) { c.respawn = 0; c.hp = NPC[g.map.camps[c.idx].kind].hp; }
  for (const l of g.landmarks) if (g.map.landmarks[l.idx].bonus === 'lair' && l.bossRespawn !== 0 && l.bossRespawn <= g.round && !blocker(g, g.map.landmarks[l.idx])) { l.bossRespawn = 0; l.bossHp = NPC.lair.hp; }
  for (const id of g.order) {
    if (g.winner !== null) return;
    const h = g.heroes[id];
    startTurn(g, h, pickRespawn);
    if (g.winner !== null) return;
    if (h.pos && h.actionsLeft > 0) control(g, h);
    endTurn(g, h);
  }
  g.round++;
}

export { hasStatus, cheb, SKILL };
