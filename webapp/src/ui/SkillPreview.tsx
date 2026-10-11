// Skill preview (Design handoff 006, 13a–d): a small board in the skill detail sheet that loops every
// 3.4 s. The hero casts (or swings), a projectile flies if the skill has one, the skill's fx play on
// every affected tile, foes flinch, damage / heal numbers rise.
// Tile overlays: caster orange, range pale blue, impact red (heal green) with a pulse, aim yellow,
// push landing cyan; Quake shows its falloff by tint strength.
//
// Design scripted six skills by hand; here every scene is built from the skill's real shape and
// numbers in the engine (inSpellArea, SKILL, WEAPONS), so the board can't drift from the rules.

import { useEffect, useRef } from 'react';
import { SKILL, WEAPONS, STARTING_WEAPON, type ClassId } from '@engine/numbers.ts';
import { inSpellArea, type AreaSpell } from '@engine/rules.ts';
import { type Atlas, type Sheet, drawSheet } from '../art/sprites.ts';

type P = [number, number]; // [row, col] on the preview board; the caster usually stands at [0, 0]
type Place = 'tile' | 'chest';
interface Scene {
  cls: ClassId; caster: P; anim: 'attack' | 'cast'; aim?: P;
  range?: number;                       // pale-blue tint around the caster
  tiles: [number, number, number][];    // impact tiles with tint strength
  heal?: boolean;
  target?: P;                           // yellow aim outline
  foes: P[]; allies: P[]; body?: P;     // body: a fallen ally (Resurrection)
  proj?: string; projTo?: P;            // projectile sheet and where it lands
  fx: [string, P, number, Place?][];    // sheet, tile, delay after impact, placement (default tile)
  nums: [P, string, string][];          // tile, text, digit sheet
  push?: { from: P; to: P };
  shake?: boolean;
  loop?: string;                        // a status loop on the caster
  foeLoop?: string;                     // a loop on the first foe
  reverse?: boolean;                    // the first foe attacks the caster (reactive passives)
}

const N = 5, CX = 86, CY = 52, L = 3400;
const cen = (r: number, c: number): P => [CX + (c - r) * 16, CY + (c + r) * 8];
const cheb = (a: P, b: P) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
const area = (f: (r: number, c: number) => number) => { const o: [number, number, number][] = []; for (let r = -N; r <= N; r++) for (let c = -N; c <= N; c++) { const v = f(r, c); if (v) o.push([r, c, v]); } return o; };
const shape = (s: AreaSpell, centre = false) => area((r, c) => (centre && !r && !c) || inSpellArea(s, { x: 0, y: 0 }, { x: c, y: r }) ? 1 : 0);
const W = (cls: ClassId) => WEAPONS[STARTING_WEAPON[cls]].damage;

/** The scene for a skill, cast by a hero of class `cls` with element `el`. */
export function sceneFor(id: string, cls: ClassId, el: string): Scene {
  const base: Scene = { cls, caster: [0, 0], anim: 'cast', tiles: [], foes: [], allies: [], fx: [], nums: [] };
  const strike = (fxSheet: string | null, dmg: number[], extra: Partial<Scene> = {}): Scene => ({
    ...base, anim: 'attack', aim: [0, 1], tiles: [[0, 1, 1]], foes: [[0, 1]],
    fx: [...(fxSheet ? [[fxSheet, [0, 1], 0, 'chest'] as [string, P, number, Place]] : []), ['effects/fx_hit_spark', [0, 1], 0, 'chest']],
    nums: dmg.map(d => [[0, 1], `-${d}`, 'fx/num_white'] as [P, string, string]), ...extra });
  const shot = (dist: number, dmg: number, extra: Partial<Scene> = {}): Scene => ({
    ...base, cls: 'archer', anim: 'attack', aim: [0, dist], projTo: [0, dist], proj: 'heroes/archer/archer_arrow_se', tiles: [[0, dist, 1]], foes: [[0, dist]],
    fx: [['effects/fx_hit_spark', [0, dist], 0, 'chest']], nums: [[[0, dist], `-${dmg}`, 'fx/num_white']], ...extra });
  const hitBy = (onCaster: [string, Place][], num: string, extra: Partial<Scene> = {}): Scene => ({
    ...base, reverse: true, aim: [0, 1], tiles: [[0, 0, 1]], foes: [[0, 1]],
    fx: onCaster.map(([s, pl]) => [s, [0, 0], 0, pl] as [string, P, number, Place]), nums: [[[0, 0], num, 'fx/num_red']], ...extra });
  const orb = ['fire', 'water', 'earth'].includes(el) ? el : 'fire';
  switch (id) {
    // ---------- knight ----------
    case 'holyStrike': return strike('fx/fx_holy_strike', [W(cls) + SKILL.holyStrike.bonus], { nums: [[[0, 1], `-${W(cls) + SKILL.holyStrike.bonus}`, 'fx/num_white'], [[0, 0], `+${SKILL.holyStrike.healOnHit}`, 'fx/num_green']] });
    case 'charge': return strike('fx/fx_charge_streak', [W(cls) + SKILL.charge.max]);
    case 'smite': return { ...base, tiles: shape('smite'), foes: [[0, 2], [-2, 0], [-1, -1]], fx: shape('smite', true).map(([r, c]) => ['fx/fx_smite_tile', [r, c], (Math.abs(r) + Math.abs(c)) * 70] as [string, P, number]), nums: [[[0, 2], `-${SKILL.smite.damage}`, 'fx/num_white'], [[-2, 0], `-${SKILL.smite.damage}`, 'fx/num_white']] };
    case 'selfHeal': return { ...base, heal: true, tiles: [[0, 0, 1]], fx: [['effects/fx_self_heal', [0, 0], 0]], nums: [[[0, 0], `+${SKILL.selfHeal.heal}`, 'fx/num_green']] };
    case 'crossHeal': return { ...base, heal: true, tiles: shape('crossHeal'), allies: [[0, 1]], fx: shape('crossHeal').map(([r, c]) => ['fx/fx_cross_heal_tile', [r, c], r || c ? 70 : 0] as [string, P, number]), nums: [[[0, 0], `+${SKILL.crossHeal.heal}`, 'fx/num_green'], [[0, 1], `+${SKILL.crossHeal.heal}`, 'fx/num_green']] };
    case 'resurrection': return { ...base, heal: true, aim: [0, 2], target: [0, 2], body: [0, 2], tiles: [[0, 2, 1]], fx: [['fx/fx_resurrection', [0, 2], 0]], nums: [[[0, 2], '+8', 'fx/num_green']] };
    // ---------- barbarian ----------
    case 'heavyStrike': return strike('fx/fx_heavy_strike', [W(cls) + SKILL.heavyStrike.bonus], { shake: true });
    case 'doubleStrike': return strike('fx/fx_double_strike', [W(cls), W(cls)]);
    case 'vengeance': return strike(null, [W(cls) + SKILL.vengeance.bonus], { loop: 'fx/fx_vengeance_aura' });
    case 'intimidate': return hitBy([['fx/fx_block', 'chest']], '-1');
    case 'counterattack': return hitBy([], `-${W('barbarian')}`, { fx: [['fx/fx_counterattack', [0, 1], 250, 'chest']], nums: [[[0, 0], `-${W('barbarian')}`, 'fx/num_red'], [[0, 1], `-${Math.ceil(W(cls) / 2)}`, 'fx/num_white']] });
    case 'inspire': { const t = shape('inspire', true).filter(([r, c]) => Math.abs(r) <= 2 && Math.abs(c) <= 4); return { ...base, heal: true, tiles: t, allies: [[1, 2], [-1, -2]], fx: [['fx/fx_inspire_ring', [0, 0], 0], ['fx/fx_empower', [0, 0], 200], ['fx/fx_empower', [1, 2], 260], ['fx/fx_empower', [-1, -2], 320]], nums: [] }; }
    // ---------- archer ----------
    case 'takeAim': return shot(WEAPONS.bow.range + 1, W('archer'), { range: WEAPONS.bow.range + 1 });
    case 'armorPierce': return shot(3, W('archer'), { fx: [['effects/fx_hit_spark', [0, 3], 0, 'chest'], ['fx/fx_chip_hit', [0, 3], 60, 'chest']] });
    case 'arrowRain': { const r = WEAPONS.bow.range; const t = area((a, b) => (a || b) && Math.max(Math.abs(a), Math.abs(b)) <= r ? 0.6 : 0); return { ...base, cls: 'archer', anim: 'attack', aim: [0, 2], range: r, tiles: t, foes: [[0, 2], [-2, 1], [2, -1]], fx: t.map(([a, b], i) => ['fx/fx_arrow_rain_tile', [a, b], (i * 37) % 120] as [string, P, number]), nums: [[0, 2], [-2, 1], [2, -1]].map(p => [p as P, `-${W('archer')}`, 'fx/num_white'] as [P, string, string]) }; }
    case 'scoutsEye': return { ...base, cls: 'archer', range: 3, tiles: [[1, 2, 1]], foes: [[1, 2]], foeLoop: 'fx/fx_invisible_shimmer', fx: [['fx/fx_invisibility_fade', [1, 2], 0]], nums: [] };
    case 'pinningShot': return shot(3, W('archer'), { fx: [['fx/fx_pinning_shot', [0, 3], 0]] });
    case 'huntersMark': return { ...shot(3, 0), nums: [[[0, 3], '+2', 'fx/num_red']], fx: [], foeLoop: 'fx/fx_hunters_mark' };
    // ---------- mage ----------
    case 'deepRest': return { ...base, cls: 'mage', heal: true, tiles: [[0, 0, 1]], fx: [['fx/fx_mana_surge', [0, 0], 0]], nums: [[[0, 0], '+5', 'fx/num_white']] };
    case 'manaSurge': return { ...base, cls: 'mage', heal: true, tiles: [[0, 0, 1]], fx: [['fx/fx_mana_surge', [0, 0], 0]], nums: [[[0, 0], `+${SKILL.manaSurge.amount}`, 'fx/num_white']] };
    case 'doublecast': return { ...base, cls: 'mage', aim: [0, 2], tiles: [[0, 2, 1], [-2, 1, 1]], foes: [[0, 2], [-2, 1]], proj: `fx/fx_bolt_${orb}`, projTo: [0, 2], fx: [[`fx/fx_bolt_${orb}_impact`, [0, 2], 0, 'chest'], [`fx/fx_bolt_${orb}_impact`, [-2, 1], 250, 'chest']], nums: [[[0, 2], `-${SKILL.mageBolt.damage}`, 'fx/num_white'], [[-2, 1], `-${SKILL.mageBolt.damage}`, 'fx/num_white']] };
    case 'empower': case 'cleanse': case 'fortify': return { ...base, heal: true, aim: [0, 1], target: [0, 1], tiles: [[0, 1, 1]], allies: [[0, 1]], fx: [[`fx/fx_${id}`, [0, 1], 0]], nums: id === 'empower' ? [[[0, 1], `+${SKILL.empower.attack}`, 'fx/num_green']] : [] };
    case 'teleport': return { ...base, cls: 'mage', aim: [0, 1], target: [-2, 3], tiles: [[-2, 3, 1]], allies: [[0, 1]], fx: [['fx/fx_teleport', [0, 1], 0], ['fx/fx_teleport', [-2, 3], 300]], nums: [] };
    // ---------- thief ----------
    case 'invisibility': return { ...base, cls: 'thief', tiles: [[0, 0, 1]], heal: true, fx: [['fx/fx_invisibility_fade', [0, 0], 0]], loop: 'fx/fx_invisible_shimmer', nums: [] };
    case 'ambush': return strike('fx/fx_ambush', [W('thief') + SKILL.ambush.bonus], { cls: 'thief' });
    case 'doubleDagger': return strike('fx/fx_ambush', [W('thief') + SKILL.ambush.bonus, W('thief') + SKILL.ambush.bonus], { cls: 'thief' });
    case 'pickpocket': return strike('fx/fx_coin', [W('thief')], { cls: 'thief', nums: [[[0, 1], `-${W('thief')}`, 'fx/num_white'], [[0, 0], '+2', 'fx/num_gold']] });
    case 'investor': case 'launder': return { ...base, cls: 'thief', heal: true, tiles: [[0, 0, 1]], fx: [['fx/fx_coin', [0, 0], 0, 'chest'], ['fx/fx_pop_sparkle', [0, 0], 100, 'chest']], nums: [[[0, 0], '+3', 'fx/num_gold']] };
    // ---------- elements ----------
    case 'flaming': return strike('fx/fx_bolt_fire_impact', [W(cls) + SKILL.flaming.bonus]);
    case 'chilling': return strike('fx/fx_bolt_water_impact', [W(cls)]);
    case 'shattering': return strike('fx/fx_bolt_earth_impact', [W(cls)]);
    case 'burningAura': return hitBy([], `-${W('barbarian')}`, { fx: [['fx/fx_burning_aura', [0, 1], 150]], nums: [[[0, 0], `-${W('barbarian')}`, 'fx/num_red'], [[0, 1], `-${SKILL.burningAura.damage}`, 'fx/num_white']] });
    case 'windchill': return { ...base, range: 2, tiles: [[0, 0, 1]], foes: [[0, 4]], fx: [['fx/fx_block', [0, 0], 0, 'chest']], nums: [] };
    case 'stoneskin': return hitBy([['fx/fx_block', 'chest']], `-${W('barbarian') - SKILL.stoneskin.block}`);
    case 'iceBlock': return hitBy([['fx/fx_block', 'chest']], `-${Math.floor(W('barbarian') / 2)}`, { loop: 'fx/fx_ice_block' });
    case 'fireball': { const tg: P = [-1, 2]; const t = area((r, c) => cheb([r, c], tg) <= 1 ? 1 : 0); return { ...base, aim: tg, target: tg, range: SKILL.fireball.range, tiles: t, foes: [[-1, 2], [0, 3], [1, 1]], proj: 'fx/fx_bolt_fire', projTo: tg, fx: [...t.map(([r, c]) => ['fx/fx_fireball_tile', [r, c], r === tg[0] && c === tg[1] ? 0 : 60] as [string, P, number]), ['fx/fx_fireball_blast', tg, 0]], nums: [[-1, 2], [0, 3], [1, 1]].map(p => [p as P, `-${SKILL.fireball.damage}`, 'fx/num_white'] as [P, string, string]) }; }
    case 'firewall': { const u: P[] = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [1, -1]]; return { ...base, tiles: u.map(([r, c]) => [r, c, 1] as [number, number, number]), foes: [[-1, 1]], fx: u.map(([r, c], i) => ['fx/fx_firewall_ignite', [r, c], i * 70] as [string, P, number]), nums: [[[-1, 1], `-${SKILL.firewall.damage}`, 'fx/num_white']] }; }
    case 'tidalWave': return { ...base, caster: [0, -2], aim: [0, 0], tiles: [[0, -1, 1], [0, 0, 1], [0, 1, 1]], foes: [[0, 0]], push: { from: [0, 0], to: [0, 2] }, fx: [[0, -1], [0, 0], [0, 1]].map(([r, c]) => ['fx/fx_tidal_wave_tile', [r, c] as P, (c + 1) * 90] as [string, P, number]), nums: [[[0, 0], `-${SKILL.tidalWave.damage}`, 'fx/num_white']] };
    case 'quake': return { ...base, shake: true, tiles: area((r, c) => { const d = cheb([r, c], [0, 0]); return d >= 1 && d <= 3 ? [1, 0.6, 0.3][d - 1] : 0; }), foes: [[0, 1], [-2, -1], [3, 1]], fx: area((r, c) => { const d = cheb([r, c], [0, 0]); return d >= 1 && d <= 3 ? d : 0; }).map(([r, c, d]) => [`fx/fx_quake_r${d}`, [r, c], (d - 1) * 120] as [string, P, number]), nums: [[[0, 1], `-${SKILL.quake.damage[0]}`, 'fx/num_white'], [[-2, -1], `-${SKILL.quake.damage[1]}`, 'fx/num_white'], [[3, 1], `-${SKILL.quake.damage[2]}`, 'fx/num_white']] };
    case 'lightning': return { ...base, aim: [0, 3], target: [0, 3], range: SKILL.lightning.range, tiles: [[0, 3, 1]], foes: [[0, 3]], foeLoop: 'fx/fx_paralysis', fx: [['fx/fx_lightning_strike', [0, 3], 0]], nums: [[[0, 3], `-${SKILL.lightning.damage}`, 'fx/num_white']] };
    case 'poison': return { ...base, aim: [0, 3], target: [0, 3], range: SKILL.poison.range, tiles: [[0, 3, 1]], foes: [[0, 3]], foeLoop: 'fx/fx_poison_drip', fx: [['fx/fx_poison_burst', [0, 3], 0]], nums: [[[0, 3], `-${SKILL.poison.damage}`, 'fx/num_white']] };
    case 'nature': return { ...base, aim: [0, 3], target: [0, 3], range: SKILL.nature.range, tiles: [[0, 3, 1]], foes: [[0, 3]], fx: [['fx/fx_nature_vines', [0, 3], 0]], nums: [[[0, 3], `-${SKILL.nature.damage}`, 'fx/num_white'], [[0, 0], `+${Math.ceil(SKILL.nature.damage / 2)}`, 'fx/num_green']] };
  }
  return strike(null, [W(cls)]);
}

// ---------- drawing ----------
function diamond(fill: string | null, edge: string) {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 16; const ctx = cv.getContext('2d')!;
  for (let y = 0; y < 16; y++) { const hw = y < 8 ? 2 * (y + 1) : 2 * (16 - y); for (let x = 16 - hw; x < 16 + hw; x++) { const e = x < 16 - hw + 2 || x >= 16 + hw - 2; if (!fill && !e) continue; ctx.fillStyle = e ? edge : fill!; ctx.fillRect(x, y, 1, 1); } }
  return cv;
}
let TINTS: Record<string, HTMLCanvasElement> | null = null;
const tints = () => TINTS ??= {
  range: diamond('rgba(90,180,255,0.16)', 'rgba(122,224,255,0.45)'), dmg: diamond('rgba(224,48,74,0.5)', '#ff9aa8'), heal: diamond('rgba(90,220,120,0.45)', '#b8f0a0'),
  sel: diamond('rgba(255,164,46,0.35)', '#ffa42e'), tgt: diamond(null, '#fff08a'), dest: diamond('rgba(122,224,255,0.25)', '#7ae0ff'),
};
const dur = (s: Sheet | undefined) => s ? s.meta.durations.reduce((a, b) => a + b, 0) : 0;
/** Frame at t: looping, or one-shot (-1 before it starts or after it ends). */
function frame(s: Sheet | undefined, t: number, loop: boolean) {
  if (!s || t < 0) return -1;
  const d = s.meta.durations.length ? s.meta.durations : [100], tot = d.reduce((a, b) => a + b, 0) || 1;
  if (loop) t %= tot; else if (t >= tot) return -1;
  let f = 0; while (f < d.length - 1 && t >= d[f]) { t -= d[f]; f++; }
  return s.meta.order?.[f] ?? f;
}
const faceOf = (from: P, to: P): ['se' | 'ne', boolean] => { const dr = to[0] - from[0], dc = to[1] - from[1], dx = dc - dr, dy = dc + dr; if (!dr && !dc) return ['se', false]; return dy >= 0 ? ['se', dx < 0] : ['ne', dx < 0]; };

export function SkillPreview({ atlas, skill, cls, element }: { atlas: Atlas; skill: string; cls: ClassId; element: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const S = sceneFor(skill, cls, element), T = tints();
    const hero = (c: ClassId, anim: string, d: string, team: number) => atlas.get(`heroes/${c}/${c}_${anim}_${d}_red`, team);
    const t0 = performance.now();
    const draw = () => {
      const cv = ref.current; if (!cv) return;
      const ctx = cv.getContext('2d')!; ctx.imageSmoothingEnabled = false;
      const t = (performance.now() - t0) % L, pulse = 0.6 + 0.4 * Math.sin(t / 200);
      const aim = S.aim ?? S.target ?? (S.tiles.find(q => q[0] || q[1]) as P | undefined) ?? [0, 1];
      const actor: P = S.reverse ? S.foes[0] : S.caster;
      const [cd, cf] = faceOf(S.caster, S.reverse ? S.foes[0] : aim);
      const castT = 700, spawn = castT + 280, cp = cen(...actor), tp = S.proj && S.projTo ? cen(...S.projTo) : null;
      const projDur = tp ? Math.hypot(tp[0] - cp[0], tp[1] - cp[1]) / 0.12 : 0, I = spawn + projDur;
      const inT = (r: number, c: number) => S.tiles.find(q => q[0] === r && q[1] === c);
      ctx.fillStyle = '#0b0d2a'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.save();
      if (S.shake && t > I && t < I + 220) ctx.translate(Math.floor(t / 40) % 2 ? 1 : -1, 0);
      // board
      for (let s = -2 * N; s <= 2 * N; s++) for (let r = -N; r <= N; r++) {
        const c = s - r; if (c < -N || c > N) continue; const [x, y] = cen(r, c);
        drawSheet(ctx, atlas.get(((r * 7 + c * 13) % 5 + 5) % 5 === 0 ? 'terrain/plains_b' : 'terrain/plains_a'), 0, x, y);
        if (S.range && cheb([r, c], S.caster) <= S.range) ctx.drawImage(T.range, x - 16, y - 8);
        const q = inT(r, c); if (q) { ctx.globalAlpha = q[2] * pulse; ctx.drawImage(S.heal ? T.heal : T.dmg, x - 16, y - 8); ctx.globalAlpha = 1; }
        if (S.push && r === S.push.to[0] && c === S.push.to[1]) { ctx.globalAlpha = pulse; ctx.drawImage(T.dest, x - 16, y - 8); ctx.globalAlpha = 1; }
        if (r === S.caster[0] && c === S.caster[1] && !(S.heal && q)) ctx.drawImage(T.sel, x - 16, y - 8);
        if (S.target && r === S.target[0] && c === S.target[1]) ctx.drawImage(T.tgt, x - 16, y - 8);
      }
      // units and fx, back to front
      const items: [number, number, () => void][] = [];

      const casterHit = S.reverse && t - I - 80 >= 0 && t - I - 80 < 300;
      const ct = t - castT, cast = hero(S.cls, S.anim, cd, 0), castOn = !S.reverse && ct >= 0 && ct < dur(cast);
      const ck = castOn ? cast : casterHit ? hero(S.cls, 'hurt', cd, 0) : hero(S.cls, 'idle', cd, 0);
      const cfr = castOn ? frame(cast, ct, false) : casterHit ? Math.min(frame(ck, t - I - 80, false), 1) : frame(ck, t, true);
      const cpos = cen(...S.caster);
      items.push([cpos[1], 0, () => { drawSheet(ctx, ck, Math.max(0, cfr), cpos[0], cpos[1], cf); if (S.loop) drawSheet(ctx, atlas.get(S.loop), Math.max(0, frame(atlas.get(S.loop), t, true)), cpos[0], cpos[1]); }]);
      for (const [r, c] of S.allies) { const p = cen(r, c), [d, fl] = faceOf([r, c], S.caster), k = hero('archer', 'idle', d, 0); items.push([p[1], 0, () => drawSheet(ctx, k, Math.max(0, frame(k, t + 300, true)), p[0], p[1], fl)]); }
      if (S.body) {
        // a fallen ally until the column of light raises it
        const p = cen(...S.body), up = t > I + 500, k = up ? hero('archer', 'idle', 'se', 0) : hero('archer', 'death', 'se', 0);
        items.push([p[1], 0, () => drawSheet(ctx, k, up ? Math.max(0, frame(k, t, true)) : (k ? k.meta.frames - 1 : 0), p[0], p[1])]);
      }
      S.foes.forEach(([r, c], i) => {
        let p = cen(r, c);
        if (S.push && r === S.push.from[0] && c === S.push.from[1]) { const k = Math.max(0, Math.min(1, (t - I - 300) / 220)), q = cen(...S.push.to); p = [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; }
        const [d, fl] = faceOf([r, c], S.caster), hitHere = !!inT(r, c) && !S.reverse, ht = t - I - 80, hurt = hitHere && ht >= 0 && ht < 300;
        const swinging = S.reverse && i === 0 && ct >= 0 && ct < dur(hero('barbarian', 'attack', d, 1));
        const k = swinging ? hero('barbarian', 'attack', d, 1) : hero('barbarian', hurt ? 'hurt' : 'idle', d, 1);
        const f = swinging ? frame(k, ct, false) : hurt ? Math.min(frame(k, ht, false), 1) : frame(k, t + r * 170, true);
        items.push([p[1], 0, () => { drawSheet(ctx, k, Math.max(0, f), p[0], p[1], fl); if (i === 0 && S.foeLoop) { const lp = atlas.get(S.foeLoop); drawSheet(ctx, lp, Math.max(0, frame(lp, t, true)), p[0], p[1] - (lp && lp.meta.frameH <= 16 ? 14 : 0)); } }]);
      });
      for (const [k, [r, c], d, pl] of S.fx) {
        const s = atlas.get(k), f = frame(s, t - I - d, false); if (f < 0) continue;
        const p = cen(r, c); items.push([p[1], 1, () => drawSheet(ctx, s, f, p[0], p[1] - (pl === 'chest' ? 14 : 0))]);
      }
      items.sort((a, b) => a[0] - b[0] || a[1] - b[1]).forEach(it => it[2]());
      if (S.proj && tp && t >= spawn && t < I) { const s = atlas.get(S.proj), k = (t - spawn) / projDur; drawSheet(ctx, s, Math.max(0, frame(s, t, true)), cp[0] + (tp[0] - cp[0]) * k, cp[1] - 14 + (tp[1] - cp[1]) * k); }
      ctx.restore();
      // numbers rise after the impact

      const pt = t - I - 100;
      if (pt >= 0 && pt < 900) for (const [[r, c], text, sheet] of S.nums) {
        const s = atlas.get(sheet); if (!s) continue;
        const m = s.meta as Sheet['meta'] & { glyphs?: string; advance?: number[] };
        const gl = m.glyphs ?? '0123456789+-', adv = m.advance ?? [];
        const [x, y] = cen(r, c), yy = y - 38 - Math.min(pt, 700) / 50;
        let w = 0; for (const ch of text) w += adv[gl.indexOf(ch)] ?? 6;
        let cx = Math.round(x - w / 2);
        ctx.globalAlpha = pt > 700 ? 1 - (pt - 700) / 200 : 1;
        for (const ch of text) { const i = gl.indexOf(ch); if (i < 0) continue; drawSheet(ctx, s, i, cx + m.anchor[0], Math.round(yy)); cx += adv[i] ?? 6; }
        ctx.globalAlpha = 1;
      }
    };
    const id = setInterval(draw, 50);
    draw();
    return () => clearInterval(id);
  }, [atlas, skill, cls, element]);
  return <canvas ref={ref} className="skill-preview" width={173} height={104} />;
}
