// Layer 3: map geometry. Generates many maps per mode and size and measures
// what the size means for play: can the rules fit at all, how soon enemies can
// meet, how far landmarks are, how crowded the map is.
//
// Run:  node sim/map-geometry.ts   → writes sim/reports/map-geometry.md

import { writeFileSync, mkdirSync } from 'node:fs';
import { generateMap, walkField, renderAscii, FAILS, type GameMap } from '../engine/mapgen.ts';
import { HERO_STATS } from '../engine/numbers.ts';
import { Report } from './lib.ts';

const MAPS_PER_CONFIG = 40;
const CONFIGS: { per: number; sizes: number[] }[] = [
  { per: 2, sizes: [20, 22, 24, 28, 32] },
  { per: 3, sizes: [24, 28, 32, 36] },
  { per: 4, sizes: [28, 32, 36, 40] },
];

// Tiles per turn with both actions spent moving (no boots, no roads).
const SPEED = { knight: 2 * HERO_STATS.knight.move, barbarian: 2 * HERO_STATS.barbarian.move, thief: 2 * HERO_STATS.thief.move };

interface Stats {
  ok: number; attempts: number;
  enemyWalk: number[];      // per map: nearest enemy base (walking tiles), min over bases
  enemyWalkAvg: number[];   // per map: average over bases of the nearest enemy base
  landmarkTrip: number[];   // per base: walking tiles to its 4th-nearest landmark
  home: number[];           // per base: landmarks within 10 walking tiles
  merchant: number[];       // per base: nearest merchant
  lair: number[];           // per base: nearest lair
  terrain: number[];        // per map: blocked share
  territory: number[];      // per map: share of walkable tiles inside a territory
  sample?: GameMap;
}

function measure(m: GameMap, s: Stats) {
  const fields = m.bases.map(b => walkField(m, b));
  const at = (f: Int16Array, x: number, y: number) => f[y * m.w + x];
  let nearestMin = Infinity; const nearest: number[] = [];
  m.bases.forEach((b, i) => {
    const d = Math.min(...m.bases.filter(o => o.team !== b.team).map(o => at(fields[i], o.x, o.y)));
    nearest.push(d); nearestMin = Math.min(nearestMin, d);
    const lm = m.landmarks.map(l => at(fields[i], l.x, l.y)).filter(d2 => d2 >= 0).sort((a, c) => a - c);
    s.landmarkTrip.push(lm[3] ?? 99);
    s.home.push(lm.filter(d2 => d2 <= 10).length);
    s.merchant.push(Math.min(...m.landmarks.filter(l => l.bonus === 'merchant').map(l => at(fields[i], l.x, l.y))));
    s.lair.push(Math.min(...m.landmarks.filter(l => l.bonus === 'lair').map(l => at(fields[i], l.x, l.y))));
  });
  s.enemyWalk.push(nearestMin);
  s.enemyWalkAvg.push(nearest.reduce((a, c) => a + c, 0) / nearest.length);
  const blocked = m.tiles.filter(t => t !== 'plain').length;
  s.terrain.push(blocked / m.tiles.length);
  let terr = 0;
  for (const l of m.landmarks) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (m.tiles[(l.y + dy) * m.w + l.x + dx] === 'plain') terr++;
  s.territory.push(terr / (m.tiles.length - blocked));
}

const avg = (xs: number[]) => xs.reduce((a, c) => a + c, 0) / Math.max(1, xs.length);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const turns = (tiles: number, speed: number) => (tiles / speed).toFixed(1);

const results: { per: number; size: number; s: Stats; fails: Record<string, number> }[] = [];
for (const c of CONFIGS) for (const size of c.sizes) {
  const s: Stats = { ok: 0, attempts: 0, enemyWalk: [], enemyWalkAvg: [], landmarkTrip: [], home: [], merchant: [], lair: [], terrain: [], territory: [] };
  for (const k in FAILS) delete FAILS[k];
  for (let seed = 1; seed <= MAPS_PER_CONFIG; seed++) {
    const m = generateMap({ size, teams: 2, perTeam: c.per, maxAttempts: 200 }, seed);
    if (!m) continue;
    s.ok++; s.attempts += m.attempts;
    if (!s.sample) s.sample = m;
    measure(m, s);
  }
  results.push({ per: c.per, size, s, fails: { ...FAILS } });
  console.log(`${c.per}v${c.per} ${size}: ${s.ok}/${MAPS_PER_CONFIG}`);
}

// ---------------------------------------------------------------------

const R = new Report();
const say = R.say;
say('# Layer 3 — Map geometry');
say();
say(`Generated ${new Date().toISOString().slice(0, 10)} from \`engine/mapgen.ts\`, ${MAPS_PER_CONFIG} maps per mode and size. Rules follow \`Map Generation.md\`: 3×3 territories, one landmark per element per player, 1 merchant + 1 lair per player on element landmarks, 1 gold mine or mana fountain per 2 players, 3 NPC camps per player, 10–18% impassable terrain, every base within 10 walking tiles of each element, teams within ±10% on walking distances.`);
say();
say(`Walking distance counts diagonal steps, around terrain. **Turns** = tiles ÷ tiles moved per turn with both actions spent moving: knight ${SPEED.knight}, barbarian ${SPEED.barbarian}, thief ${SPEED.thief} (no boots, no roads).`);
say();

say('## 1. Does the map fit the rules?');
say();
say('"Maps generated" = seeds out of ' + MAPS_PER_CONFIG + ' that produced a valid map within 200 attempts. Low numbers mean the rules don\'t fit in that space.');
say();
R.table(['Mode', 'Size', 'Maps generated', 'Avg attempts', 'Most common rejection'],
  results.map(({ per, size, s, fails }) => {
    const top = Object.entries(fails).sort((a, b) => b[1] - a[1])[0];
    return [`${per}v${per}`, `${size}×${size}`, `${s.ok}/${MAPS_PER_CONFIG}`, s.ok ? (s.attempts / s.ok).toFixed(0) : '—', top ? `${top[0]} (${top[1]})` : '—'];
  }));

say('## 2. How soon can enemies meet?');
say();
say('Nearest enemy base, in walking tiles and in turns for a barbarian running there. Two heroes running at each other meet in about half that time.');
say();
R.table(['Mode', 'Size', 'Nearest enemy base: closest pair (avg over maps)', 'Barbarian turns to reach it', 'Thief turns', 'Knight turns', 'Meeting in the middle (barbarians)'],
  results.filter(r => r.s.ok).map(({ per, size, s }) => {
    const d = avg(s.enemyWalk);
    return [`${per}v${per}`, `${size}×${size}`, `${d.toFixed(1)} (avg base: ${avg(s.enemyWalkAvg).toFixed(1)})`, turns(d, SPEED.barbarian), turns(d, SPEED.thief), turns(d, SPEED.knight), turns(d / 2, SPEED.barbarian)];
  }));

say('## 3. Landmarks, merchants and lairs');
say();
R.table(['Mode', 'Size', 'Landmarks within 10 tiles of a base', 'Walk to 4th-nearest landmark', 'Nearest merchant', 'Nearest lair', 'Terrain', 'Walkable land inside territories'],
  results.filter(r => r.s.ok).map(({ per, size, s }) => [`${per}v${per}`, `${size}×${size}`, avg(s.home).toFixed(1), avg(s.landmarkTrip).toFixed(1), avg(s.merchant).toFixed(1), avg(s.lair).toFixed(1), pct(avg(s.terrain)), pct(avg(s.territory))]));

say('## 4. Sample maps');
say();
say('Legend: `·` plains, `~` water, `^` mountains, `%` hot desert, blank = landmark territory. Landmark centres: `f` `w` `e` element, `$` element + merchant, `&` element + lair, `G` gold mine, `O` mana fountain. Camps: `n` weak, `N` medium. Bases: `1`–`4` one team, `6`–`9` the other.');
say();
for (const r of results.filter(r => r.s.sample)) {
  if (![24, 28, 32, 36].includes(r.size)) continue;
  say(`### ${r.per}v${r.per}, ${r.size}×${r.size}`);
  say();
  say('```');
  say(renderAscii(r.s.sample!));
  say('```');
  say();
}

mkdirSync(new URL('./reports/', import.meta.url), { recursive: true });
writeFileSync(new URL('./reports/map-geometry.md', import.meta.url), R.lines.join('\n'));
console.log(`wrote sim/reports/map-geometry.md (${R.lines.length} lines)`);
