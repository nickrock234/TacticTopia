// Procedural map generation, following Map Generation.md.
//
// Pipeline: bases → terrain features → landmarks → camps → validation.
// A failed validation throws the map away; generateMap() retries with new seeds.
// Everything is driven by a seeded RNG, so a seed always gives the same map.

export type Terrain = 'plain' | 'water' | 'mountain' | 'desert';
export type Element = 'fire' | 'water' | 'earth';
export const TERRAIN_OF: Record<Element, Terrain> = { water: 'water', earth: 'mountain', fire: 'desert' };

export interface Pos { x: number; y: number }
export type LandmarkBonus = 'none' | 'merchant' | 'lair' | 'mine' | 'fountain';
export interface Landmark extends Pos { element: Element | null; bonus: LandmarkBonus }
export interface Camp extends Pos { kind: 'weak' | 'medium'; owner: number }
export interface Base extends Pos { player: number; team: number }

export interface GameMap {
  w: number; h: number;
  tiles: Terrain[];          // row-major
  bases: Base[];
  landmarks: Landmark[];
  camps: Camp[];
  seed: number;
  attempts: number;
}

export interface MapParams {
  size: number;              // square maps
  teams: number;             // 2 for team games
  perTeam: number;
  // Tunables (see Map Generation.md; all guesses)
  teammateSpacing?: [number, number];     // 6–8
  nearbyElementWalk?: number;             // every base has each element within this walk (10; 8 was too tight)
  terrainShare?: [number, number];        // 10–18%
  fairness?: number;                      // ±10%
  maxAttempts?: number;
  /** Stretch the distances between things (1 = normal; 2 = the BIG map: same landmarks and camps, twice as far apart). */
  spread?: number;
}

// ---------- RNG ----------
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)), // inclusive
    pick: <T>(xs: T[]) => xs[Math.floor(next() * xs.length)],
    shuffle: <T>(xs: T[]) => { const a2 = [...xs]; for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; },
  };
}
type Rng = ReturnType<typeof rng>;

// ---------- geometry ----------
export const cheb = (a: Pos, b: Pos) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const DIRS: Pos[] = [
  { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 },
  { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
];

/** Walking distance (diagonals allowed) over plains from `from` to every tile. -1 = unreachable. */
export function walkField(m: { w: number; h: number; tiles: Terrain[] }, from: Pos): Int16Array {
  const d = new Int16Array(m.w * m.h).fill(-1);
  const q: number[] = [from.y * m.w + from.x];
  d[q[0]] = 0;
  for (let i = 0; i < q.length; i++) {
    const cur = q[i], cx = cur % m.w, cy = (cur / m.w) | 0;
    for (const dir of DIRS) {
      const nx = cx + dir.x, ny = cy + dir.y;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const ni = ny * m.w + nx;
      if (d[ni] >= 0 || m.tiles[ni] !== 'plain') continue;
      d[ni] = d[cur] + 1;
      q.push(ni);
    }
  }
  return d;
}

// ---------- generation ----------

/** Why attempts were rejected (line tags), for tuning the generator. */
export const FAILS: Record<string, number> = {};
const fail = (k: string): null => { FAILS[k] = (FAILS[k] ?? 0) + 1; return null; };

function tryGenerate(p: Required<MapParams>, seed: number): GameMap | null {
  const r = rng(seed);
  const W = p.size, H = p.size, P = p.teams * p.perTeam, K = p.spread;
  const tiles: Terrain[] = new Array(W * H).fill('plain');
  const at = (x: number, y: number) => tiles[y * W + x];
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

  // 1. Bases: each team on its own side (left/right or top/bottom), spread evenly along the whole
  // back row (Nick, 2026-10-03), all the same depth in from the edge; the two teams mirror each other.
  const vertical = r.next() < 0.5;
  const bases: Base[] = [];
  const margin = 3, depth = 2;
  for (let t = 0; t < p.teams; t++) {
    for (let i = 0; i < p.perTeam; i++) {
      const along = p.perTeam === 1 ? Math.round((H - 1) / 2) : Math.round(margin + (i * (H - 1 - 2 * margin)) / (p.perTeam - 1));
      const across = t === 0 ? depth : W - 1 - depth;
      const b = vertical ? { x: along, y: across } : { x: across, y: along };
      if (!inside(b.x, b.y)) return fail('base-off-map');
      bases.push({ ...b, player: bases.length, team: t });
    }
  }
  // teammate spacing check (Chebyshev, jitter can change it)
  for (const a of bases) for (const b of bases) if (a !== b && a.team === b.team) {
    const d = cheb(a, b);
    if (d < p.teammateSpacing[0] - 1) return fail('teammate-spacing');
  }

  // 2. Terrain features, in pairs: ceil(P/2) of each element.
  const featureTiles: { el: Element; tiles: Pos[] }[] = [];
  const nearBase = (x: number, y: number, k: number) => bases.some(b => cheb(b, { x, y }) <= k);
  const nearOtherFeature = (x: number, y: number, k: number) =>
    featureTiles.some(f => f.tiles.some(t => cheb(t, { x, y }) <= k));
  const elements: Element[] = ['water', 'earth', 'fire'];
  // Required features: one of each element per PAIR of teammates, anchored between
  // the pair (nudged toward the middle), so every base has each element nearby.
  // Then extra features anywhere until the map reaches the target terrain share,
  // so density is the same on every map size.
  const anchors: Pos[] = [];
  const mid = { x: (W - 1) / 2, y: (H - 1) / 2 };
  for (let t = 0; t < p.teams; t++) {
    const tb = bases.filter(b => b.team === t);
    for (let i = 0; i < tb.length; i += 2) {
      const a = tb[i], b = tb[i + 1] ?? tb[i];
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      const len = Math.hypot(mid.x - cx, mid.y - cy) || 1;
      anchors.push({ x: Math.round(cx + ((mid.x - cx) / len) * 6 * K), y: Math.round(cy + ((mid.y - cy) / len) * 6 * K) });
    }
  }
  const blockedShare = () => tiles.filter(t => t !== 'plain').length / tiles.length;
  const target = (p.terrainShare[0] + p.terrainShare[1]) / 2;
  const order: { el: Element; anchor: Pos | null }[] = [];
  for (const an of anchors) for (const el of r.shuffle(elements)) order.push({ el, anchor: an });
  for (let i = 0; i < 60; i++) order.push({ el: elements[i % 3], anchor: null });
  for (const { el, anchor } of order) {
    const must = anchor !== null;
    if (!must && blockedShare() >= target) break;
    let placed = false;
    for (let tries = 0; tries < 200 && !placed; tries++) {
      const sx = anchor ? Math.min(W - 2, Math.max(1, anchor.x + r.int(-5 - (tries >> 5), 5 + (tries >> 5)))) : r.int(1, W - 2);
      const sy = anchor ? Math.min(H - 2, Math.max(1, anchor.y + r.int(-5 - (tries >> 5), 5 + (tries >> 5)))) : r.int(1, H - 2);
      if (nearBase(sx, sy, 3) || nearOtherFeature(sx, sy, 2)) continue;
      const len = el === 'water' ? r.int(7, 12) : el === 'earth' ? r.int(6, 10) : r.int(5, 8);
      let dir = r.int(0, 7);
      const path: Pos[] = [];
      let x = sx, y = sy;
      for (let s = 0; s < len; s++) {
        path.push({ x, y });
        if (r.next() < 0.3) dir = (dir + (r.next() < 0.5 ? 1 : 7)) % 8;
        x += DIRS[dir].x; y += DIRS[dir].y;
        if (!inside(x, y) || nearBase(x, y, 3)) break;
      }
      if (path.length < 5) continue;
      const set = new Map<string, Pos>();
      const add = (q: Pos) => { if (inside(q.x, q.y) && !nearBase(q.x, q.y, 2)) set.set(`${q.x},${q.y}`, q); };
      path.forEach(add);
      if (el === 'fire') { // 2-wide strip
        const perp = DIRS[(dir + 2) % 8];
        path.forEach(q => add({ x: q.x + perp.x, y: q.y + perp.y }));
      }
      if (el === 'earth') path.forEach(q => { if (r.next() < 0.15) add({ x: q.x + 1, y: q.y }); });
      if (el === 'water' && r.next() < 0.4) { // lake at the end
        const e = path[path.length - 1];
        [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => add({ x: e.x + dx, y: e.y + dy }));
      }
      // ford / pass: lines longer than 6 get a 1-tile gap in the middle
      let list = [...set.values()];
      if (path.length > 6 && el !== 'fire') {
        const mid = path[Math.floor(path.length / 2)];
        list = list.filter(q => cheb(q, mid) > 0);
      }
      if (list.some(q => nearOtherFeature(q.x, q.y, 1))) continue;
      list.forEach(q => { tiles[q.y * W + q.x] = TERRAIN_OF[el]; });
      featureTiles.push({ el, tiles: list });
      placed = true;
    }
    if (!placed && must) return fail('feature');
  }
  const blocked = tiles.filter(t => t !== 'plain').length / tiles.length;
  if (blocked < p.terrainShare[0] || blocked > p.terrainShare[1]) return fail('terrain-share');

  const gm = { w: W, h: H, tiles };
  const baseFields = bases.map(b => walkField(gm, b));
  const walk = (pl: number, q: Pos) => baseFields[pl][q.y * W + q.x];
  // connectivity: every base reaches every other base
  for (const b of bases) if (walk(0, b) < 0) return fail('bases-disconnected');

  // 3. Landmarks
  const landmarks: Landmark[] = [];
  const territoryOk = (c: Pos, el: Element | null) => {
    if (at(c.x, c.y) !== 'plain') return false;
    if (c.x < 1 || c.y < 1 || c.x > W - 2 || c.y > H - 2) return false;
    if (nearBase(c.x, c.y, 3)) return false;
    if (landmarks.some(l => cheb(l, c) < 4 * K)) return false; // 3x3 territories 1+ tile apart
    let match = 0, walkable = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const t = at(c.x + dx, c.y + dy);
      if (t === 'plain') walkable++;
      else if (el && t === TERRAIN_OF[el]) match++;
      else return false; // no foreign terrain inside a territory
    }
    if (walkable < 6) return false;
    if (walk(0, c) < 0) return false;
    return el ? match >= 1 && match <= 3 : match === 0;
  };
  const candidates = (el: Element | null) => {
    const out: Pos[] = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (territoryOk({ x, y }, el)) out.push({ x, y });
    return out;
  };
  const teamOf = (pl: number) => bases[pl].team;
  // contestedness: how evenly a spot sits between the two teams (0 = perfectly even)
  const contest = (q: Pos) => {
    const best = [Infinity, Infinity];
    bases.forEach((b, i) => { const d = walk(i, q); if (d >= 0) best[b.team] = Math.min(best[b.team], d); });
    return Math.abs(best[0] - best[1]);
  };

  // 3a. every base gets each element within nearbyElementWalk (teammates may share)
  for (const b of r.shuffle(bases)) {
    for (const el of r.shuffle(elements)) {
      if (landmarks.some(l => l.element === el && walk(b.player, l) >= 0 && walk(b.player, l) <= p.nearbyElementWalk * K)) continue;
      const cands = candidates(el).filter(c => { const d = walk(b.player, c); return d >= 0 && d <= p.nearbyElementWalk * K; });
      if (!cands.length) return fail('no-nearby-element');
      // prefer the ones not deeper than necessary: sort by distance, pick among the nearest few
      cands.sort((a, c) => walk(b.player, a) - walk(b.player, c));
      const c = r.pick(cands.slice(0, 4));
      landmarks.push({ ...c, element: el, bonus: 'none' });
    }
  }
  // 3b. top up to P landmarks per element, preferring contested ground
  for (const el of elements) {
    while (landmarks.filter(l => l.element === el).length < P) {
      const cands = candidates(el);
      if (!cands.length) return fail('no-element-spot');
      cands.sort((a, c) => contest(a) - contest(c));
      landmarks.push({ ...r.pick(cands.slice(0, 3)), element: el, bonus: 'none' });
    }
  }
  // 3c. merchants and lairs: 1 of each per player, on element landmarks, spread by region
  const regionOf = (q: Pos) => {
    let best = -1, bd = Infinity;
    bases.forEach((b, i) => { const d = walk(i, q); if (d >= 0 && d < bd) { bd = d; best = i; } });
    return best;
  };
  for (const bonus of ['merchant', 'lair'] as const) {
    for (const b of r.shuffle(bases)) {
      const free = landmarks.filter(l => l.element && l.bonus === 'none');
      if (!free.length) return fail('no-landmark-for-bonus');
      // this player's region first, else the nearest free one
      const mine = free.filter(l => regionOf(l) === b.player);
      const pool = mine.length ? mine : free;
      pool.sort((a, c) => walk(b.player, a) - walk(b.player, c));
      pool[0].bonus = bonus;
    }
  }
  // 3d. standalone gold mines and mana fountains: P/2 in total, contested ground
  for (let i = 0; i < Math.floor(P / 2); i++) {
    const cands = candidates(null);
    if (!cands.length) return fail('no-standalone-spot');
    cands.sort((a, c) => contest(a) - contest(c));
    landmarks.push({ ...r.pick(cands.slice(0, 3)), element: null, bonus: i % 2 === 0 ? 'mine' : 'fountain' });
  }

  // 5. NPC camps
  const camps: Camp[] = [];
  const inTerritory = (q: Pos) => landmarks.some(l => cheb(l, q) <= 1);
  const campOk = (q: Pos) => at(q.x, q.y) === 'plain' && !inTerritory(q) && !camps.some(c => cheb(c, q) < 3 * K) && !nearBase(q.x, q.y, 2);
  const center = { x: (W - 1) / 2, y: (H - 1) / 2 };
  for (const b of bases) {
    const tilesAt = (lo: number, hi: number) => {
      const out: Pos[] = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d = walk(b.player, { x, y });
        if (d >= lo && d <= hi && campOk({ x, y })) out.push({ x, y });
      }
      return out;
    };
    const t1 = tilesAt(3, 3); // the turn-one camp stays 3 away however big the map (movement doesn't scale)
    if (!t1.length) return fail('camp-3-tiles');
    camps.push({ ...r.pick(t1), kind: 'weak', owner: b.player });
    const t2 = tilesAt(5 * K, 8 * K);
    if (!t2.length) return fail('camp-5-8');
    camps.push({ ...r.pick(t2), kind: 'weak', owner: b.player });
    const t3 = tilesAt(8 * K, 12 * K).sort((a, c) => cheb(a, center) - cheb(c, center));
    if (!t3.length) return fail('camp-8-12');
    camps.push({ ...r.pick(t3.slice(0, 5)), kind: 'medium', owner: b.player });
  }

  // 6. Fairness: per team, walking distance from each base to its nearest landmark
  // of each element, nearest merchant, nearest lair, and its own three camps.
  const score = bases.map(b => {
    const near = (f: (l: Landmark) => boolean) => Math.min(...landmarks.filter(f).map(l => walk(b.player, l)).filter(d => d >= 0));
    return elements.reduce((s, el) => s + near(l => l.element === el), 0)
      + near(l => l.bonus === 'merchant') + near(l => l.bonus === 'lair')
      + camps.filter(c => c.owner === b.player).reduce((s, c) => s + walk(b.player, c), 0);
  });
  const teamScore = [0, 1].map(t => score.filter((_, i) => bases[i].team === t).reduce((a, c) => a + c, 0));
  if (!teamScore.every(Number.isFinite)) return fail('unreachable-landmark');
  if (Math.abs(teamScore[0] - teamScore[1]) / Math.max(teamScore[0], teamScore[1]) > p.fairness) return fail('unfair');

  return { w: W, h: H, tiles, bases, landmarks, camps, seed, attempts: 0 };
}

export function generateMap(params: MapParams, seed: number): GameMap | null {
  const p: Required<MapParams> = {
    teammateSpacing: [6, 8], nearbyElementWalk: 10, terrainShare: [0.10, 0.18], fairness: 0.10, maxAttempts: 300, spread: 1,
    ...params,
  };
  for (let i = 0; i < p.maxAttempts; i++) {
    const m = tryGenerate(p, seed * 1000 + i);
    if (m) return { ...m, attempts: i + 1 };
  }
  return null;
}

/** ASCII rendering for reports. */
export function renderAscii(m: GameMap): string {
  const g: string[][] = [];
  for (let y = 0; y < m.h; y++) g.push(m.tiles.slice(y * m.w, (y + 1) * m.w).map(t => ({ plain: '·', water: '~', mountain: '^', desert: '%' }[t])));
  // Legend: · plain  ~ water  ^ mountain  % hot desert  (blank = landmark territory)
  // landmark centre: f/w/e element, $ element+merchant, & element+lair, G gold mine, O mana fountain
  // camps: n weak, N medium · bases: 1-4 team one, 6-9 team two
  for (const l of m.landmarks) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (g[l.y + dy][l.x + dx] === '·') g[l.y + dy][l.x + dx] = ' ';
    g[l.y][l.x] = { merchant: '$', lair: '&', mine: 'G', fountain: 'O', none: { fire: 'f', water: 'w', earth: 'e' }[l.element ?? 'fire'] }[l.bonus];
  }
  for (const c of m.camps) g[c.y][c.x] = c.kind === 'weak' ? 'n' : 'N';
  const idx = [0, 0];
  for (const b of m.bases) g[b.y][b.x] = String((b.team === 0 ? 1 : 6) + idx[b.team]++);
  return g.map(row => row.join(' ')).join('\n');
}
