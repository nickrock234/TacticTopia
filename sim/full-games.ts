// Layer 4: full games between bots, on generated maps, with every rule.
//
// Run:  node sim/full-games.ts [games per mode]   → writes sim/reports/full-games.md
//
// Teams are random archetype picks (Archetypes.md). Which team moves first
// alternates between games. Games stop at a team wipe or after MAX_ROUNDS.

import { writeFileSync, mkdirSync } from 'node:fs';
import { generateMap } from '../engine/mapgen.ts';
import { newGame, type GameState } from '../engine/state.ts';
import { playRound } from '../engine/turn.ts';
import { CLASSES, RESPAWN, SKILL, ELIMINATION, TURN_LIMIT, ENGAGED, HERO_STATS, MAP_SIZE } from '../engine/numbers.ts';
import { botTurn, botRespawn, ARCHETYPES, ARCH, USAGE } from './bots.ts';
import { Report, cap } from './lib.ts';

const MAX_ROUNDS = TURN_LIMIT;
const GAMES = Number(process.argv[2] ?? 300);
// Variant overrides: node sim/full-games.ts 300 respawnMax=5 mageBolt=6 fireball=4 label=x
const OVERRIDES: Record<string, string> = Object.fromEntries(process.argv.slice(3).map(a => a.split('=') as [string, string]));
if (OVERRIDES.respawnMax) RESPAWN.max = Number(OVERRIDES.respawnMax);
if (OVERRIDES.perDeath) RESPAWN.perDeath = Number(OVERRIDES.perDeath);
if (OVERRIDES.respawn === 'escalating') RESPAWN.mode = 'escalating';
if (OVERRIDES.resRange) SKILL.resurrection.range = Number(OVERRIDES.resRange);
if (OVERRIDES.mageBolt) SKILL.mageBolt.damage = Number(OVERRIDES.mageBolt);
if (OVERRIDES.fireball) SKILL.fireball.damage = Number(OVERRIDES.fireball);
if (OVERRIDES.monastery) SKILL.monastery.spellBonus = Number(OVERRIDES.monastery);
if (OVERRIDES.elimination === 'off') ELIMINATION.enabled = false;
if (OVERRIDES.resErases === '1') ELIMINATION.resurrectionErases = true;
if (OVERRIDES.elim4v4) ELIMINATION.deaths4v4 = Number(OVERRIDES.elim4v4);
if (OVERRIDES.engaged) ENGAGED.movePenalty = Number(OVERRIDES.engaged);
if (OVERRIDES.vengeance) SKILL.vengeance.bonus = Number(OVERRIDES.vengeance);
if (OVERRIDES.vengeanceAt) SKILL.vengeance.threshold = Number(OVERRIDES.vengeanceAt);
if (OVERRIDES.doubleStrikeMana) SKILL.doubleStrike.mana = Number(OVERRIDES.doubleStrikeMana);
if (OVERRIDES.barbHp) HERO_STATS.barbarian.hp = Number(OVERRIDES.barbHp);
const LABEL = OVERRIDES.label ? `-${OVERRIDES.label}` : '';
// sizes=32,42,48 tries other map sizes (2v2,3v3,4v4); moveBonus=1 adds movement to every class
const SIZES = OVERRIDES.sizes ? OVERRIDES.sizes.split(",").map(Number) : [MAP_SIZE[2], MAP_SIZE[3], MAP_SIZE[4]];
if (OVERRIDES.moveBonus) for (const c of CLASSES) HERO_STATS[c].move += Number(OVERRIDES.moveBonus);
const MODES = [{ per: 2, size: SIZES[0] }, { per: 3, size: SIZES[1] }, { per: 4, size: SIZES[2] }];

interface HeroRow {
  mode: string; archetype: string; cls: string; won: boolean | null; ahead: boolean | null;
  kills: number; deaths: number; heroDamage: number; healing: number; npcDamage: number; damageTaken: number;
  xp: number; claims: number; skills: number; capstoneRound: number | null;
}
interface GameRow { deathsAtCap: number; deathsTotal: number; mode: string; winner: number | null; leader: number | null; firstTeam: number; end: number; firstContact: number | null; xpAt: Record<number, number>; comp: string[][]; closest: number }

function rngPick(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const CAPSTONES = new Set(['smite', 'resurrection', 'doubleStrike', 'inspire', 'arrowRain', 'huntersMark', 'doublecast', 'teleport', 'doubleDagger', 'launder']);

export function playGame(per: number, size: number, seed: number, comp?: string[][]): { g: GameState; comp: string[][]; xpAt: Record<number, number>; capRound: (number | null)[]; firstTeam: number; closest: number } | null {
  const m = generateMap({ size, teams: 2, perTeam: per }, seed);
  if (!m) return null;
  const rnd = rngPick(seed * 7919);
  const teams = comp ?? [0, 1].map(() => Array.from({ length: per }, () => ARCHETYPES[Math.floor(rnd() * ARCHETYPES.length)].id));
  // map.bases are ordered team 0 then team 1
  const setups = m.bases.map(b => { const a = ARCH[teams[b.team][m.bases.filter(x => x.team === b.team).indexOf(b)]]; return { cls: a.cls, archetype: a.id, element: a.element }; });
  const g = newGame(m, setups);
  if (ELIMINATION.enabled) g.eliminationDeaths = per >= 4 ? ELIMINATION.deaths4v4 : ELIMINATION.deathsUpTo3v3;
  if (seed % 2 === 1) { // team 1 moves first in odd games
    const o = g.order; for (let i = 0; i + 1 < o.length; i += 2) [o[i], o[i + 1]] = [o[i + 1], o[i]];
  }
  const xpAt: Record<number, number> = {};
  const capRound: (number | null)[] = g.heroes.map(() => null);
  let closest = 0; // most heroes of one team dead at once (checked at round ends), as a share of the team
  while (g.winner === null && g.round <= MAX_ROUNDS) {
    playRound(g, botTurn, botRespawn);
    for (const t of [0, 1]) { const team = g.heroes.filter(h => h.team === t); closest = Math.max(closest, team.filter(h => !h.pos).length / team.length); }
    for (const h of g.heroes) if (capRound[h.id] === null && [...h.skills].some(s => CAPSTONES.has(s))) capRound[h.id] = g.round - 1;
    if ([10, 20, 30].includes(g.round - 1)) xpAt[g.round - 1] = g.players.reduce((s, p) => s + p.xpEarned, 0) / g.players.length;
  }
  return { g, comp: teams, xpAt, capRound, firstTeam: seed % 2 === 1 ? 1 : 0, closest: g.winner !== null ? 1 : closest };
}

if (import.meta.main) {
  const heroes: HeroRow[] = [];
  const games: GameRow[] = [];
  const t0 = Date.now();
  for (const { per, size } of MODES) {
    const mode = `${per}v${per}`;
    let n = 0;
    for (let seed = 1; n < GAMES && seed < GAMES * 3; seed++) {
      const r = playGame(per, size, seed);
      if (!r) continue;
      n++;
      const { g } = r;
      // At the turn limit: most team kills wins; tie -> landmarks held
      const score = [0, 1].map(t => g.heroes.filter(h => h.team === t).reduce((s, h) => s + g.stats.kills[h.id] * 1000, 0) + g.landmarks.filter(l => l.owner !== null && g.players[l.owner].team === t).length);
      const leader = g.winner ?? (score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1);
      games.push({ deathsAtCap: g.stats.deathsAtCap, deathsTotal: g.stats.deathsTotal, mode, winner: g.winner, leader, firstTeam: r.firstTeam, end: g.winner === null ? MAX_ROUNDS + 1 : g.round, firstContact: g.firstContactRound, xpAt: r.xpAt, comp: r.comp, closest: r.closest });
      const claims = g.heroes.map(() => 0);
      for (const l of g.log) { const mm = /^P(\d+) claimed/.exec(l.text); if (mm) claims[+mm[1]]++; }
      for (const h of g.heroes) heroes.push({
        mode, archetype: h.archetype, cls: h.cls, won: g.winner === null ? null : g.winner === h.team,
        ahead: leader === null ? null : leader === h.team,
        kills: g.stats.kills[h.id], deaths: g.stats.deaths[h.id], heroDamage: g.stats.heroDamage[h.id], healing: g.stats.healing[h.id],
        npcDamage: g.stats.npcDamage[h.id], damageTaken: g.stats.damageTaken[h.id], xp: g.players[h.player].xpEarned, claims: claims[h.id],
        skills: h.skills.size, capstoneRound: r.capRound[h.id],
      });
    }
    console.log(`${mode}: ${n} games (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  }

  // ---------------------------------------------------------------------
  const R = new Report(); const say = R.say;
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, c) => a + c, 0) / xs.length : NaN);
  const pctl = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) * p)]; };
  const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : '—');
  const pc = (x: number) => (Number.isFinite(x) ? `${Math.round(x * 100)}%` : '—');

  say('# Layer 4 — Full games between bots');
  say();
  say(`Generated ${new Date().toISOString().slice(0, 10)}. ${GAMES} games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in \`engine/\`, teams drawn at random from the ten archetypes in \`Archetypes.md\`. Games end when a whole team is dead at once, or are stopped after round ${MAX_ROUNDS}. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.`);
  say();

  say(`Variant: ${ELIMINATION.enabled ? `elimination on death ${ELIMINATION.deathsUpTo3v3} (2v2/3v3) or ${ELIMINATION.deaths4v4} (4v4)${ELIMINATION.resurrectionErases ? ', resurrected deaths excluded' : ''}` : 'no elimination'}, ${RESPAWN.mode === 'oneRound' ? 'respawn after one full round' : `respawn wait +${RESPAWN.perDeath} per death (cap ${RESPAWN.max})`}, Resurrection range ${SKILL.resurrection.range}, Mage bolt ${SKILL.mageBolt.damage}, Fireball ${SKILL.fireball.damage}, Monastery +${SKILL.monastery.spellBonus}, engaged move penalty ${ENGAGED.movePenalty}, Vengeance +${SKILL.vengeance.bonus} at ${SKILL.vengeance.threshold * 100}%, Double strike ${SKILL.doubleStrike.mana} mana, barbarian ${HERO_STATS.barbarian.hp} HP, movement ${CLASSES.map(c => HERO_STATS[c].move).join("/")}, maps ${SIZES.join("/")}.`);
  say();
  say('## 1. How games go');
  say();
  R.table(['Mode', 'Games', 'Deaths per game', 'Deaths at the respawn cap', 'Ended by a team wipe', 'End round (median, middle half)', 'Unfinished games: most of one team dead at once (avg)', 'First hero-vs-hero damage (median round)', 'First-moving team wins or leads'],
    MODES.map(({ per }) => {
      const gs = games.filter(x => x.mode === `${per}v${per}`);
      const done = gs.filter(x => x.winner !== null);
      const ends = done.map(x => x.end);
      const fc = gs.map(x => x.firstContact).filter((x): x is number => x !== null);
      const led = gs.filter(x => x.leader !== null);
      const firstLeads = led.filter(x => x.leader === x.firstTeam).length;
      const dt = gs.reduce((s, x) => s + x.deathsTotal, 0), dc = gs.reduce((s, x) => s + x.deathsAtCap, 0);
      return [`${per}v${per}`, gs.length, (dt / gs.length).toFixed(1), pc(dc / Math.max(1, dt)), pc(done.length / gs.length), done.length ? `${pctl(ends, 0.5)} (${pctl(ends, 0.25)}–${pctl(ends, 0.75)})` : '—', pc(avg(gs.filter(x => x.winner === null).map(x => x.closest))), fc.length ? `${pctl(fc, 0.5)}` : '—', pc(firstLeads / Math.max(1, led.length))];
    }));

  say('Games ending by elimination (a whole team out or dead at once), by round:');
  say();
  R.table(['Mode', 'By round 20', 'By 25', 'By 30', 'By 35', 'By 40 (limit)', 'Went to the limit'],
    MODES.map(({ per }) => {
      const gs = games.filter(x => x.mode === `${per}v${per}`);
      const by = (r: number) => pc(gs.filter(x => x.winner !== null && x.end <= r).length / gs.length);
      return [`${per}v${per}`, by(20), by(25), by(30), by(35), by(41), pc(gs.filter(x => x.winner === null).length / gs.length)];
    }));

  say('## 2. Win rate by archetype');
  say();
  say('Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.');
  say();
  const wr = (rows: HeroRow[]) => { const d = rows.filter(r => r.ahead !== null); return d.length ? d.filter(r => r.ahead).length / d.length : NaN; };
  R.table(['Archetype', 'Class', ...MODES.map(m => `${m.per}v${m.per}`), 'All'],
    ARCHETYPES.map(a => [a.id, cap(a.cls), ...MODES.map(m => pc(wr(heroes.filter(r => r.archetype === a.id && r.mode === `${m.per}v${m.per}`)))), pc(wr(heroes.filter(r => r.archetype === a.id)))]));
  R.table(['Class', ...MODES.map(m => `${m.per}v${m.per}`), 'All'],
    CLASSES.map(c => [cap(c), ...MODES.map(m => pc(wr(heroes.filter(r => r.cls === c && r.mode === `${m.per}v${m.per}`)))), pc(wr(heroes.filter(r => r.cls === c)))]));

  say('## 3. What each archetype does in a game (averages per game, all modes)');
  say();
  R.table(['Archetype', 'Kills', 'Deaths', 'Damage to heroes', 'Healing', 'Damage to NPCs', 'Damage taken', 'Landmarks claimed', 'XP earned', 'Skills', 'First capstone (median round)'],
    ARCHETYPES.map(a => {
      const rs = heroes.filter(r => r.archetype === a.id);
      const caps = rs.map(r => r.capstoneRound).filter((x): x is number => x !== null);
      return [a.id, f1(avg(rs.map(r => r.kills))), f1(avg(rs.map(r => r.deaths))), f1(avg(rs.map(r => r.heroDamage))), f1(avg(rs.map(r => r.healing))), f1(avg(rs.map(r => r.npcDamage))), f1(avg(rs.map(r => r.damageTaken))), f1(avg(rs.map(r => r.claims))), f1(avg(rs.map(r => r.xp))), f1(avg(rs.map(r => r.skills))), caps.length ? `${pctl(caps, 0.5)} (${pc(caps.length / rs.length)} get one)` : 'never'];
    }));

  say('## 4. Economy pace in real games');
  say();
  say('Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).');
  say();
  R.table(['Mode', 'Round 10', 'Round 20', 'Round 30'], MODES.map(({ per }) => {
    const gs = games.filter(x => x.mode === `${per}v${per}`);
    return [`${per}v${per}`, ...[10, 20, 30].map(r => f1(avg(gs.map(x => x.xpAt[r]).filter(x => x !== undefined))))];
  }));

  say('## 5. What gets used');
  say();
  say('Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.');
  say();
  const totalGames = games.length;
  const perArch = new Map<string, number>(); for (const r of heroes) perArch.set(r.archetype, (perArch.get(r.archetype) ?? 0) + 1);
  for (const a of ARCHETYPES) {
    const rows = [...USAGE.entries()].filter(([k]) => k.startsWith(a.id + '|')).map(([k, v]) => [k.split('|')[1], v / (perArch.get(a.id) ?? 1)] as [string, number]).sort((x, y) => y[1] - x[1]);
    say(`- **${a.id}:** ${rows.map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', ')}`);
  }
  say();
  say(`(${totalGames} games in total.)`);
  say();

  say('## 6. Set duos (2v2)');
  say();
  say('Each duo plays ' + Math.round(GAMES / 2) + ' 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.');
  say();
  const DUOS = [['Berserker', 'Enchanter'], ['Berserker', 'Paladin'], ['Artillery', 'Paladin'], ['Sniper', 'Warlord'], ['Assassin', 'Profiteer']];
  const duoRows: (string | number)[][] = [];
  for (const duo of DUOS) {
    let lead = 0, decided = 0, wipes = 0, n = 0;
    const tpBefore = [...USAGE.entries()].filter(([k]) => k.endsWith('|teleport')).reduce((s, [, v]) => s + v, 0);
    for (let seed = 5000; n < Math.round(GAMES / 2) && seed < 5000 + GAMES * 3; seed++) {
      const rnd = rngPick(seed * 31);
      const opp = [0, 1].map(() => ARCHETYPES[Math.floor(rnd() * ARCHETYPES.length)].id);
      const side = seed % 2; // duo plays team 0 or team 1
      const comp = side === 0 ? [duo, opp] : [opp, duo];
      const r = playGame(2, 24, seed, comp);
      if (!r) continue;
      n++;
      const g = r.g;
      const score = [0, 1].map(t => g.heroes.filter(h => h.team === t).reduce((s, h) => s + g.stats.kills[h.id] * 1000, 0) + g.landmarks.filter(l => l.owner !== null && g.players[l.owner].team === t).length);
      const leader = g.winner ?? (score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1);
      if (g.winner !== null) wipes++;
      if (leader !== null) { decided++; if (leader === side) lead++; }
    }
    const tp = [...USAGE.entries()].filter(([k]) => k.endsWith('|teleport')).reduce((s, [, v]) => s + v, 0) - tpBefore;
    duoRows.push([duo.join(' + '), n, pc(lead / Math.max(1, decided)), pc(wipes / n), (tp / n).toFixed(2)]);
  }
  R.table(['Duo', 'Games', 'Wins or leads', 'Games ending in a wipe', 'Teleports per game'], duoRows);

  mkdirSync(new URL('./reports/', import.meta.url), { recursive: true });
  writeFileSync(new URL(`./reports/full-games${LABEL}.md`, import.meta.url), R.lines.join('\n'));
  console.log(`wrote sim/reports/full-games${LABEL}.md in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
