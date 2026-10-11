// Draws the game state onto the map canvas, in art pixels (the caller sets the zoom).
// Layout and draw order follow Claude Design's packet 001 mock-up:
//   pass 1, back to front: ground tiles, roads, territory tint, highlights
//   pass 2, back to front: mountains, bases, landmarks, camps, bodies, heroes, fog
//
// Art that doesn't exist yet (other landmarks, medium monsters, the boss) is drawn
// with stand-ins: a coloured plinth, the Mushling.
//
// Heroes (packet 002): sheet names are <class>_[<weapon2>_]<anim>_<se|ne>_red, with
// a `_shield` overlay for archer/mage/thief, spear attacks in tile pieces (_p0.._pN),
// and projectiles that fly from the release frame to the target.

import type { GameState, Hero, GameEvent } from '@engine/state.ts';
import { maxHp, idx } from '@engine/state.ts';
import { SKILL } from '@engine/numbers.ts';
import { cheb, type Pos } from '@engine/mapgen.ts';
import { visibleTo, hiddenAdjacent, weaponRange, inSpellArea, type AreaSpell } from '@engine/rules.ts';
import { type Atlas, drawSheet, drawCell, blobColumn, frameAt, durationOf, tone } from '../art/sprites.ts';
import { tileCenter, mapBounds } from './iso.ts';
import { toView, toWorld, rotDelta, viewSize, type Rot } from './view.ts';

export interface Highlights {
  selected?: { x: number; y: number } | null;
  move?: Set<number>;        // tile indices
  range?: Set<number>;       // within weapon reach (attack mode), whether or not anything is there
  blocked?: Set<number>;     // within move distance but not reachable
  attack?: Set<number>;      // pulsing: targets in reach, or (while confirming) everything the action affects
  area?: Set<number>;        // tiles an area skill covers
  help?: boolean;            // area + pulses are allies healed or buffed (green), not enemies hit (red)
  // while confirming an action (handoff 007): each affected unit glows and its HP bar previews the result
  preview?: Map<number, UnitPreview>;
  pending?: { x: number; y: number } | null; // tapped once, waiting for confirm
  path?: { x: number; y: number }[];         // a pending move's route, start to end (WORLD tiles)
  pulseMove?: boolean;                       // move tiles pulse (respawn choices)
  claim?: Set<number>;                       // a landmark's territory (its panel is open): stand here to claim
}

interface Pickable { tile: number; draw: (c: CanvasRenderingContext2D) => void } // tile: WORLD index

/** A unit's predicted result while confirming: HP now → after, the number over it, and the glow colour. */
export interface UnitPreview { hp: number; max: number; after: number; heal: boolean; ko: boolean; num: string; sheet: string }
const GLOW = { attack: ['#fff4d6', '#fff08a', '#ffa42e', '#fff08a'], heal: ['#f2ffe0', '#b8f0a0', '#5ee06a', '#b8f0a0'] };

interface HeroVisual {
  x: number; y: number; fromX: number; fromY: number; start: number; dur: number;
  dirX: number; dirY: number; hp: number; hurtAt: number; // last direction faced, in WORLD tiles
  attackAt: number; attacked: boolean; attackAnim: 'attack' | 'cast'; reach: number;
}
interface Fx {
  sheet: string; x: number; y: number; start: number; text?: string; color?: string;
  to?: { x: number; y: number }; dur?: number; flip?: boolean; // projectiles
  hold?: number; // ms to keep showing the last frame (the lair chest stays open a moment)
  num?: string;  // a pop-up number drawn with a digit sheet (sheet = fx/num_*)
  life?: number; // how long a number lasts, ms (default 700; damage to your own team lingers longer)
}

const WEAPON2: Record<string, string> = { knight: 'flail', barbarian: 'spear', archer: 'crossbow', mage: 'orb', thief: 'knives' };
const facingOf = (dx: number, dy: number) => { const sx = dx - dy, sy = dx + dy; return { facing: (sy >= 0 ? 'se' : 'ne') as 'se' | 'ne', flip: sx < 0 }; };

const TEAM = ['#a8203e', '#3040b0'];
// camp kind → creature sheets (packet 004)
const CREATURE: Record<string, string> = { weak: 'mushling', medium: 'wolfdog', boss: 'troll' };
const PLACEHOLDER_LANDMARK: Record<string, string> = { water: '#3a92e0', earth: '#8f5e34', mine: '#f4c030', fountain: '#7cc8f2', fire: '#e67a36' };

export class Renderer {
  private visuals = new Map<number, HeroVisual>();
  private npcHp = new Map<string, number>();
  private owners = new Map<number, number | null>();      // landmark → owner last frame
  private claimAt = new Map<number, number>();            // landmark → when it was claimed (flag raise)
  private decoys = new Map<number, { x: number; y: number }>(); // Body doubles last frame
  private npcAnims = new Map<string, { hitAt: number; attackAt: number; flip: boolean }>();
  private evSeen = 0;          // g.events already played
  private landAt = new Map<string, number>(); // this frame: "x,y" → when its first impact lands
  private lastLand = 0;        // when the last attack's blow lands (ms after its event): reactions follow it
  private viewer = 0;          // team the map is drawn for (damage to it pops in red)
  private shakeFrom = 0; private shakeUntil = 0; private shakePx = 0;
  private flashAt = -1e9;      // Lightning: a 20% white flash
  rot: Rot = 0;
  private W = 1; private H = 1;

  /** Screen centre (art px) of a world tile, honouring the rotation. */
  tc(x: number, y: number) { const v = toView(x, y, this.rot, this.W, this.H); return tileCenter(v.x, v.y); }
  /** Screen facing for a world direction. */
  face(dx: number, dy: number) { const d = rotDelta(dx, dy, this.rot); return facingOf(d.dx, d.dy); }
  private fx: Fx[] = [];
  private diamonds = new Map<string, HTMLCanvasElement>();
  private picks: Pickable[] = [];   // units drawn last frame, back to front
  private pickCtx: CanvasRenderingContext2D | null = null;
  private glowIn: CanvasRenderingContext2D | null = null;  // target glow scratch canvases
  private glowOut: CanvasRenderingContext2D | null = null;

  /** The tile of the frontmost unit with a visible pixel at art point (ax, ay), or null.
   *  Redraws last frame's units into a 1×1 canvas at that point, front to back; exact
   *  pixels, no margin. Works at any rotation (it's done in screen space). */
  pick(ax: number, ay: number): number | null {
    if (!this.pickCtx) {
      const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1;
      this.pickCtx = cv.getContext('2d', { willReadFrequently: true });
    }
    const c = this.pickCtx;
    if (!c) return null;
    c.imageSmoothingEnabled = false;
    for (let k = this.picks.length - 1; k >= 0; k--) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, 1, 1);
      c.setTransform(1, 0, 0, 1, -Math.floor(ax), -Math.floor(ay));
      this.picks[k].draw(c);
      if (c.getImageData(0, 0, 1, 1).data[3] > 0) return this.picks[k].tile;
    }
    return null;
  }

  constructor(private atlas: Atlas) {}

  private diamond(fill: string, edge: string): HTMLCanvasElement {
    const key = fill + edge;
    let cv = this.diamonds.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = 32; cv.height = 16;
    const ctx = cv.getContext('2d')!;
    for (let y = 0; y < 16; y++) {
      const hw = y < 8 ? 2 * (y + 1) : 2 * (16 - y);
      for (let x = 16 - hw; x < 16 + hw; x++) {
        const e = x < 16 - hw + 2 || x >= 16 + hw - 2;
        ctx.fillStyle = e ? edge : fill; ctx.fillRect(x, y, 1, 1);
      }
    }
    this.diamonds.set(key, cv);
    return cv;
  }

  /** Sheet path for a hero animation, honouring the equipped weapon. */
  heroPath(h: Hero, anim: string, facing: string, suffix = ''): string {
    const w2 = WEAPON2[h.cls];
    const tag = h.weapon === w2 ? `${w2}_` : '';
    for (const p of [`heroes/${h.cls}/${h.cls}_${tag}${anim}_${facing}_red${suffix}`, `heroes/${h.cls}/${h.cls}_${anim}_${facing}_red${suffix}`])
      if (this.atlas.has(p)) return p;
    return suffix ? '' : `heroes/knight/knight_${anim}_${facing}_red`;
  }

  /** Track positions and HP (moves animate, numbers pop), and play the engine's events:
   *  swings, casts, projectiles and every skill's effect (packet 004). */
  sync(g: GameState, now: number) {
    // 1. hero movement first (actions after a move wait for the walk)
    const fell: { h: Hero; lost: number }[] = []; // heroes that died since last frame (their last blow still gets a number)
    for (const h of g.heroes) {
      let v = this.visuals.get(h.id);
      if (!h.pos) {
        if (v) {
          if (v.hp > 0 && h.deathPos && !(h as { hidden?: boolean }).hidden) fell.push({ h, lost: v.hp });
          v.hp = 0; v.attacked = false;
        }
        continue;
      }
      if (!v) {
        v = { x: h.pos.x, y: h.pos.y, fromX: h.pos.x, fromY: h.pos.y, start: 0, dur: 0, dirX: 1, dirY: 0, hp: h.hp, hurtAt: -1e9, attackAt: -1e9, attacked: false, attackAnim: 'attack', reach: 1 };
        this.visuals.set(h.id, v);
      }
      if (v.hp === 0) { v.x = h.pos.x; v.y = h.pos.y; v.fromX = h.pos.x; v.fromY = h.pos.y; v.dur = 0; } // respawned
      if (v.x !== h.pos.x || v.y !== h.pos.y) {
        const cur = this.pos(v, now);
        const dx = h.pos.x - v.x, dy = h.pos.y - v.y;
        v.fromX = cur.x; v.fromY = cur.y; v.x = h.pos.x; v.y = h.pos.y;
        v.start = now; v.dur = Math.max(1, cheb({ x: 0, y: 0 }, { x: dx, y: dy })) * 180;
        v.dirX = dx; v.dirY = dy;
      }
    }

    // 2. the engine's events since last frame: swings, casts, effects. Each impact records when it
    //    lands on its tile (landAt), so numbers, flinches and deaths below wait for the blow.
    this.landAt.clear();
    for (; this.evSeen < g.events.length; this.evSeen++) this.play(g, g.events[this.evSeen], now);
    const landing = (p: Pos) => this.landAt.get(`${p.x},${p.y}`) ?? now;

    // 3. monsters: damage numbers, flinch, death animation (+ the lair chest after the troll)
    const npcs: [string, number, { x: number; y: number }, string][] = [
      ...g.camps.map((c, i) => [`c${i}`, c.respawn === 0 ? c.hp : 0, g.map.camps[i], g.map.camps[i].kind] as [string, number, { x: number; y: number }, string]),
      ...g.landmarks.filter(l => g.map.landmarks[l.idx].bonus === 'lair').map(l => [`b${l.idx}`, l.bossRespawn === 0 ? l.bossHp : 0, g.map.landmarks[l.idx], 'boss'] as [string, number, { x: number; y: number }, string]),
    ];
    for (const [k, hp, p, kind] of npcs) {
      const before = this.npcHp.get(k);
      if (before !== undefined && hp < before) {
        const c = this.tc(p.x, p.y), a = this.npcAnim(k), t = landing(p);
        this.num(`-${before - hp}`, 'fx/num_white', c.sx, c.sy - (kind === 'boss' ? 44 : 24), t);
        a.hitAt = t;
        if (hp === 0) {
          // death plays where it stood (the camp itself is gone from the state)
          const death = this.atlas.get(`creatures/${CREATURE[kind]}_death`);
          this.fx.push({ sheet: `creatures/${CREATURE[kind]}_death`, x: c.sx, y: c.sy + 1, start: t, flip: a.flip });
          if (kind === 'boss') this.fx.push({ sheet: 'objects/chest', x: c.sx, y: c.sy, start: t + (death ? durationOf(death.meta) : 200), hold: 1400 });
        }
      }
      this.npcHp.set(k, hp);
    }

    // 4. landmark claims (flag raise, then a flourish) and Body doubles that vanished (poof)
    for (const l of g.landmarks) {
      const prev = this.owners.get(l.idx);
      if (prev !== undefined && l.owner !== null && l.owner !== prev) {
        this.claimAt.set(l.idx, now);
        const m = g.map.landmarks[l.idx], c = this.tc(m.x, m.y);
        this.fx.push({ sheet: 'fx/fx_claim_flourish', x: c.sx, y: c.sy, start: now + 700 });
      }
      this.owners.set(l.idx, l.owner);
      const d = l.pending?.decoy ?? null, had = this.decoys.get(l.idx);
      if (had && (!d || d.x !== had.x || d.y !== had.y)) { const c = this.tc(had.x, had.y); this.fx.push({ sheet: 'fx/fx_poof', x: c.sx, y: c.sy, start: landing(had) }); }
      if (d) this.decoys.set(l.idx, { ...d }); else this.decoys.delete(l.idx);
    }

    // 5. hero HP changes: numbers (from HP, so poison and Firewall ticks show too) and flinches
    for (const { h, lost } of fell) {
      const c = this.tc(h.deathPos!.x, h.deathPos!.y);
      this.num(`-${lost}`, h.team === this.viewer ? 'fx/num_red' : 'fx/num_white', c.sx, c.sy - 44, landing(h.deathPos!), h.team === this.viewer ? 1400 : undefined);
    }
    for (const h of g.heroes) {
      const v = this.visuals.get(h.id);
      if (!v || !h.pos) continue;
      const c = this.tc(h.pos.x, h.pos.y), t = landing(h.pos);
      if (h.hp < v.hp) {
        this.num(`-${v.hp - h.hp}`, h.team === this.viewer ? 'fx/num_red' : 'fx/num_white', c.sx, c.sy - 44, t, h.team === this.viewer ? 1400 : undefined);
        v.hurtAt = t;
      } else if (h.hp > v.hp && v.hp > 0) {
        this.fx.push({ sheet: 'effects/fx_self_heal', x: c.sx, y: c.sy, start: t });
        this.num(`+${h.hp - v.hp}`, 'fx/num_green', c.sx, c.sy - 44, t);
      }
      v.hp = h.hp;
    }
  }


  /** Time until a hero finishes walking (actions after a move wait for it). */
  private walkLeft(id: number, now: number) { const v = this.visuals.get(id); return v ? Math.max(0, v.start + v.dur - now) : 0; }

  /** Delay from the start of a hero animation to its release / spawn frame. */
  private releaseDelay(h: Hero, anim: string, facing: string) {
    const sheet = this.atlas.get(this.heroPath(h, anim, facing));
    if (!sheet) return 200;
    const ev = sheet.meta.events as Record<string, number | number[]> | undefined;
    const r = ev?.release ?? ev?.spawnVfx ?? ev?.hit ?? 2;
    return sheet.meta.durations.slice(0, Array.isArray(r) ? r[0] : r).reduce((a, b) => a + b, 0);
  }

  /** Swing or cast toward a world tile; returns when the blow lands / the spell leaves (ms from now). */
  private act(h: Hero, anim: 'attack' | 'cast', toward: Pos | undefined, now: number, from: Pos | null = h.pos): number {
    const v = this.visuals.get(h.id);
    const wait = this.walkLeft(h.id, now);
    if (!v || !from) return wait;
    v.attackAt = now + wait; v.attackAnim = anim;
    let facing = this.face(v.dirX, v.dirY).facing;
    if (toward && (toward.x !== from.x || toward.y !== from.y)) {
      v.dirX = toward.x - from.x; v.dirY = toward.y - from.y; v.reach = cheb(toward, from);
      facing = this.face(v.dirX, v.dirY).facing;
    }
    return wait + this.releaseDelay(h, anim, facing);
  }

  private play(g: GameState, e: GameEvent, now: number) {
    const A = this.atlas;
    const at = (p: Pos) => this.tc(p.x, p.y);
    const land = (p: Pos, t: number) => { const k = `${p.x},${p.y}`; if (!this.landAt.has(k)) this.landAt.set(k, now + t); };
    const tileFx = (sheet: string, p: Pos, t: number) => { const c = at(p); this.fx.push({ sheet, x: c.sx, y: c.sy, start: now + t }); land(p, t); };
    const chestFx = (sheet: string, p: Pos, t: number) => { const c = at(p); this.fx.push({ sheet, x: c.sx, y: c.sy - 14, start: now + t }); land(p, t); };
    const fly = (sheet: string, from: Pos, to: Pos, t: number, pxPerMs = 0.22) => {
      const a = at(from), b = at(to), d = Math.hypot(b.sx - a.sx, b.sy - a.sy);
      const dur = Math.max(60, d / pxPerMs);
      this.fx.push({ sheet, x: a.sx, y: a.sy - 14, to: { x: b.sx, y: b.sy - 14 }, start: now + t, dur });
      return t + dur;
    };
    switch (e.t) {
      case 'attack': {
        const h = g.heroes[e.hero];
        const o = e.from; // where the attacker stood (it may have moved on since)
        const first = e.targets[0];
        let hitT = this.act(h, 'attack', first, now, o);
        // ranged weapons fly a projectile first
        const dist = first ? cheb(first, o) : 0;
        const proj = dist > 1 ? this.projectile(h, this.face(first.x - o.x, first.y - o.y).facing) : '';
        if (proj && first) {
          const a0 = at(o), b0 = at(first);
          this.fx.push({ sheet: proj, x: a0.sx, y: a0.sy - 16, to: { x: b0.sx, y: b0.sy - 14 }, start: now + hitT, dur: dist * 70, flip: this.face(first.x - o.x, first.y - o.y).flip });
          hitT += dist * 70;
        }
        if (e.opt === 'arrowRain') {
          // a volley on every tile in range, scattered
          const r = weaponRange(g, h, !!h.moved);
          let k = 0;
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const p = { x: o.x + dx, y: o.y + dy };
            if ((dx || dy) && p.x >= 0 && p.y >= 0 && p.x < g.map.w && p.y < g.map.h) tileFx('fx/fx_arrow_rain_tile', p, hitT + (k++ * 37) % 120);
          }
        }
        if (e.opt === 'charge') { const c = at(o); this.fx.push({ sheet: 'fx/fx_charge_streak', x: c.sx, y: c.sy - 14, start: now + hitT - 120, flip: this.face(o.x - (first?.x ?? o.x), o.y - (first?.y ?? o.y)).flip }); }
        const STRIKE: Record<string, string> = { holyStrike: 'fx/fx_holy_strike', heavyStrike: 'fx/fx_heavy_strike', doubleStrike: 'fx/fx_double_strike' };
        for (const p of e.targets) {
          const nk = this.npcKeyAt(g, p);
          if (nk) this.npcAnim(nk).flip = at(o).sx > at(p).sx; // monsters turn to face the attacker
          if (e.fromInvis) chestFx('fx/fx_ambush', p, hitT);
          else if (e.opt === 'pinningShot') tileFx('fx/fx_pinning_shot', p, hitT);
          else if (STRIKE[e.opt]) chestFx(STRIKE[e.opt], p, hitT);
          chestFx('effects/fx_hit_spark', p, hitT);
        }
        if (e.opt === 'heavyStrike') this.shake(now + hitT, 2, 140);
        this.lastLand = hitT;
        break;
      }
      case 'hit': chestFx(e.kind === 'block' ? 'fx/fx_block' : 'fx/fx_chip_hit', e.pos, this.lastLand); break;
      case 'counter': {
        // the defender swings back right after the blow lands
        const h = g.heroes[e.hero], v = this.visuals.get(h.id);
        const t = this.lastLand + this.act(h, 'attack', e.target, now) - this.walkLeft(h.id, now);
        if (v) v.attackAt = now + this.lastLand;
        chestFx('fx/fx_counterattack', e.target, t);
        break;
      }
      case 'burn': { const h = g.heroes[e.hero]; if (h.pos) tileFx('fx/fx_burning_aura', h.pos, this.lastLand); break; }
      case 'coin': chestFx('fx/fx_coin', e.pos, this.lastLand); break;
      case 'surge': { const h = g.heroes[e.hero]; if (h.pos) tileFx('fx/fx_mana_surge', h.pos, this.walkLeft(h.id, now)); break; }
      case 'respawn': tileFx('fx/fx_respawn_column', e.pos, 0); break;
      case 'reveal': {
        const th = g.heroes[e.hero], by = g.heroes[e.by];
        if (th.pos) tileFx('fx/fx_invisibility_fade', th.pos, 0);
        if (by.pos) { const c = at(by.pos); this.fx.push({ sheet: 'ui/alert_hidden', x: c.sx, y: c.sy - 46, start: now, hold: 700 }); }
        break;
      }
      case 'npcAttack': {
        // the monster strikes back: its attack animation, then a spark on the attacker at hitFrame
        const k = this.npcKeyAt(g, e.npc);
        const t0 = this.lastLand + 150;
        if (k) {
          const a = this.npcAnim(k), kind = k[0] === 'b' ? 'boss' : g.map.camps[Number(k.slice(1))].kind;
          a.attackAt = now + t0; a.flip = at(e.target).sx > at(e.npc).sx;
          const sheet = A.get(`creatures/${CREATURE[kind]}_attack`), hf = (sheet?.meta as { hitFrame?: number } | undefined)?.hitFrame ?? 3;
          const tHit = t0 + (sheet ? sheet.meta.durations.slice(0, hf).reduce((x, y) => x + y, 0) : 200);
          chestFx('effects/fx_hit_spark', e.target, tHit);
          if (kind === 'boss') this.shake(now + tHit, 2, 160);
        }
        break;
      }
      case 'cast': {
        const h = g.heroes[e.hero];
        const t = this.act(h, 'cast', e.at, now);
        const el = ['fire', 'water', 'earth'].includes(h.element) ? h.element : 'fire';
        const p = e.at;
        switch (e.spell) {
          case 'mageBolt': if (p) chestFx(`fx/fx_bolt_${el}_impact`, p, fly(`fx/fx_bolt_${el}`, e.from, p, t)); break;
          case 'fireball': if (p) {
            const t2 = fly('fx/fx_bolt_fire', e.from, p, t);
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (p.x + dx >= 0 && p.y + dy >= 0 && p.x + dx < g.map.w && p.y + dy < g.map.h) tileFx('fx/fx_fireball_tile', { x: p.x + dx, y: p.y + dy }, t2);
            const c = at(p); this.fx.push({ sheet: 'fx/fx_fireball_blast', x: c.sx, y: c.sy, start: now + t2 });
          } break;
          case 'lightning': if (p) { tileFx('fx/fx_lightning_strike', p, t); this.flashAt = now + t; } break;
          case 'poison': if (p) tileFx('fx/fx_poison_burst', p, t); break;
          case 'nature': if (p) {
            tileFx('fx/fx_nature_vines', p, t);
            for (let k = 0; k < 3; k++) fly('fx/fx_nature_leech', p, e.from, t + 400 + k * 80, 0.15);
          } break;
          case 'tidalWave': (e.tiles ?? []).forEach((q, k) => tileFx('fx/fx_tidal_wave_tile', q, t + k * 90)); break;
          case 'firewall': {
            const z = g.zones.find(zz => zz.caster === h.id);
            (z?.tiles ?? []).forEach((i, k) => tileFx('fx/fx_firewall_ignite', { x: i % g.map.w, y: Math.floor(i / g.map.w) }, t + k * 70));
            break;
          }
          case 'quake': case 'smite': case 'crossHeal': {
            // per tile of the exact shape, staggered outward from the caster
            const sheet = e.spell === 'quake' ? '' : e.spell === 'smite' ? 'fx/fx_smite_tile' : 'fx/fx_cross_heal_tile';
            const step = e.spell === 'quake' ? 120 : 70;
            for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
              const q = { x: e.from.x + dx, y: e.from.y + dy }, d = cheb(q, e.from);
              const centre = d === 0 && e.spell !== 'quake';
              if (!centre && !inSpellArea(e.spell as AreaSpell, e.from, q)) continue;
              if (q.x < 0 || q.y < 0 || q.x >= g.map.w || q.y >= g.map.h) continue;
              tileFx(sheet || `fx/fx_quake_r${d}`, q, t + (e.spell === 'quake' ? d - 1 : d) * step);
            }
            if (e.spell === 'quake') this.shake(now + t, 2, 160);
            break;
          }
          case 'inspire': {
            const c = at(e.from); this.fx.push({ sheet: 'fx/fx_inspire_ring', x: c.sx, y: c.sy, start: now + t });
            let k = 0;
            for (const o of g.heroes) if (o.team === h.team && o.pos && inSpellArea('inspire', e.from, o.pos)) tileFx('fx/fx_empower', o.pos, t + 200 + (k++) * 60);
            break;
          }
          case 'empower': if (p) tileFx('fx/fx_empower', p, t); break;
          case 'cleanse': if (p) tileFx('fx/fx_cleanse', p, t); break;
          case 'invisibility': tileFx('fx/fx_invisibility_fade', e.from, t); break;
          case 'resurrection': if (p) tileFx('fx/fx_resurrection', p, t); break;
          case 'teleport': if (p) { tileFx('fx/fx_teleport', p, t); if (e.tiles?.[0]) tileFx('fx/fx_teleport', e.tiles[0], t + 300); } break;
          // Self-heal: the heal itself plays fx_self_heal. Ice block, Fortify: their status loops show.
        }
        break;
      }
    }
  }

  private npcAnim(k: string) { let a = this.npcAnims.get(k); if (!a) { a = { hitAt: -1e9, attackAt: -1e9, flip: false }; this.npcAnims.set(k, a); } return a; }
  private npcKeyAt(g: GameState, p: Pos): string | null {
    const ci = g.map.camps.findIndex(c => c.x === p.x && c.y === p.y);
    if (ci >= 0) return `c${ci}`;
    const li = g.map.landmarks.findIndex(l => l.x === p.x && l.y === p.y);
    return li >= 0 ? `b${li}` : null;
  }

  /** A damage / heal number that pops up (Design's digit sheets). */
  private num(text: string, sheet: string, x: number, y: number, start: number, life?: number) { this.fx.push({ sheet, num: text, x, y, start, life }); }

  private shake(at: number, px: number, ms: number) { this.shakeFrom = at; this.shakeUntil = at + ms; this.shakePx = px; }

  private projectile(h: Hero, facing: string): string {
    if (h.cls === 'archer') return `heroes/archer/archer_${h.weapon === 'crossbow' ? 'bolt' : 'arrow'}_${facing}`;
    if (h.cls === 'thief' && h.weapon === 'knives') return 'heroes/thief/thief_knife';
    return ''; // mage spells fly Design's element orbs (see play)
  }

  private pos(v: HeroVisual, now: number) {
    const t = v.dur ? Math.min(1, (now - v.start) / v.dur) : 1;
    return { x: v.fromX + (v.x - v.fromX) * t, y: v.fromY + (v.y - v.fromY) * t, moving: t < 1 };
  }

  draw(ctx: CanvasRenderingContext2D, g: GameState, viewerTeam: number, hl: Highlights, now: number) {
    const A = this.atlas;
    const { w, h: H } = g.map;
    this.W = w; this.H = H;
    this.viewer = viewerTeam;
    // screen shake (Heavy strike, Quake, the troll's club): a few px, restored at the end
    ctx.save();
    if (now >= this.shakeFrom && now < this.shakeUntil) ctx.translate(Math.round((Math.random() * 2 - 1) * this.shakePx), Math.round((Math.random() * 2 - 1) * this.shakePx));
    const V = viewSize(this.rot, w, H);
    const world = (vx: number, vy: number) => toWorld(vx, vy, this.rot, w, H);
    const inView = (vx: number, vy: number) => vx >= 0 && vy >= 0 && vx < V.w && vy < V.h;
    const fog = g.fog[viewerTeam];
    const tiles = g.map.tiles;
    const seen = (x: number, y: number) => fog[y * w + x] === 1;
    const territory = new Map<number, number>();
    for (const l of g.landmarks) if (l.owner !== null) {
      const m = g.map.landmarks[l.idx];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) territory.set((m.y + dy) * w + m.x + dx, g.players[l.owner].team);
    }

    // ---------- clouds drifting in the void behind the board (MapCanvas paints the sky) ----------
    {
      const bnd = mapBounds(V.w, V.h), span = bnd.right - bnd.left + 160;
      for (let k = 0; k < 14; k++) {
        const c = A.get(`terrain/cloud_${'abc'[k % 3]}`);
        if (!c) continue;
        const x0 = (k * 977) % span, y = bnd.top - 20 + ((k * 613) % Math.max(1, bnd.bottom - bnd.top + 40));
        const x = bnd.left - 80 + ((x0 + now * 0.002 * (1 + (k % 3) * 0.3)) % span); // ~2 px/s, wrapping
        drawSheet(ctx, c, 0, Math.round(x), Math.round(y));
      }
    }

    // ---------- pass 1: ground (back to front in VIEW order) ----------
    // Packet 003 autotiles are drawn for SCREEN directions, so neighbours are looked up in
    // view space (after rotation). Off the map counts as "same" for water/desert/fog.
    const tileV = (vx: number, vy: number): string | null => { if (!inView(vx, vy)) return null; const p = world(vx, vy); return tiles[p.y * w + p.x]; };
    const sameAs = (vx: number, vy: number, k: string) => (dx: number, dy: number) => { const n = tileV(vx + dx, vy + dy); return n === null || n === k; };
    const hash = (x: number, y: number) => (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0; // per WORLD tile: stable under rotation
    const anim = (period: number, x: number, y: number) => Math.floor(now / period + ((x + y) % 3)) % 3;
    const shore = A.get('terrain/water_shore'), dEdge = A.get('terrain/desert_edge'), face = A.get('terrain/map_edge');
    const PLAINS = ['terrain/plains_a', 'terrain/plains_b', 'terrain/plains_c', 'terrain/plains_d'];

    // pass 1a: ground
    for (let s = 0; s < V.w + V.h - 1; s++) for (let vy = 0; vy < V.h; vy++) {
      const vx = s - vy;
      if (vx < 0 || vx >= V.w) continue;
      const { x, y } = world(vx, vy);
      const { sx, sy } = tileCenter(vx, vy);
      // the board's earthen side face under the front edges (fogged or not): last row = SW face,
      // last column = SE face, the bottom corner both; 2 variants
      const lastRow = vy === V.h - 1, lastCol = vx === V.w - 1;
      if (face && (lastRow || lastCol)) drawSheet(ctx, face, (hash(x, y) % 2) * 3 + (lastRow && lastCol ? 2 : lastRow ? 0 : 1), sx, sy);
      if (!seen(x, y)) continue;
      const t = tiles[y * w + x];
      if (t === 'water' && shore?.meta.masks) {
        drawCell(ctx, shore, blobColumn(shore.meta.masks, sameAs(vx, vy, 'water')), anim(300, x, y), sx, sy);
      } else if (t === 'desert' && dEdge?.meta.masks) {
        const col = blobColumn(dEdge.meta.masks, sameAs(vx, vy, 'desert'));
        if (col === dEdge.meta.masks.length - 1) {
          // inner desert: two crack patterns at random
          const sheet = A.get(hash(x, y) % 2 ? 'terrain/desert_hot_b' : 'terrain/desert_hot');
          if (sheet) drawSheet(ctx, sheet, frameAt(sheet.meta, now + ((x + y) % 3) * 250), sx, sy);
        } else drawCell(ctx, dEdge, col, anim(250, x, y), sx, sy);
      } else {
        drawSheet(ctx, A.get(PLAINS[hash(x, y) % 4]), 0, sx, sy); // plains (also under mountains)
      }
    }

    // pass 1b: roads, an overlay after all ground (diagonal pieces paint into the tiles beside them).
    // Links follow each road's path (landmark → base), not every road neighbour.
    const roadSet = A.get('terrain/road_set');
    if (roadSet) {
      const links = new Map<number, Set<number>>();
      const link = (a: number, b: number) => { if (!links.has(a)) links.set(a, new Set()); links.get(a)!.add(b); };
      for (const l of g.landmarks) if (l.owner !== null && l.road.length) {
        const base = g.map.bases[l.owner];
        const path = [...l.road, base.y * w + base.x];
        for (let k = 0; k + 1 < path.length; k++) { link(path[k], path[k + 1]); if (k + 1 < path.length - 1) link(path[k + 1], path[k]); }
      }
      // view offset → bit: edges NE=1 SE=2 SW=4 NW=8 (column), corners N=1 E=2 S=4 W=8 (row)
      const EDGE: Record<string, number> = { '0,-1': 1, '1,0': 2, '0,1': 4, '-1,0': 8 };
      const CORNER: Record<string, number> = { '-1,-1': 1, '1,-1': 2, '1,1': 4, '-1,1': 8 };
      for (const [i, to] of links) {
        const x = i % w, y = Math.floor(i / w);
        if (!seen(x, y)) continue;
        const v = toView(x, y, this.rot, w, H);
        let col = 0, row = 0;
        for (const j of to) {
          const u = toView(j % w, Math.floor(j / w), this.rot, w, H);
          const key = `${u.x - v.x},${u.y - v.y}`;
          col |= EDGE[key] ?? 0; row |= CORNER[key] ?? 0;
        }
        const { sx, sy } = tileCenter(v.x, v.y);
        drawCell(ctx, roadSet, col, row, sx, sy);
      }
    }

    // pass 1c: territory and highlights (Design's overlay sheet, packet 003; code-drawn fallback)
    const overlays = A.get('ui/overlays');
    const ov = (name: string, sx: number, sy: number, fill: string, edge: string) => {
      const k = overlays?.meta.names?.indexOf(name) ?? -1;
      if (overlays && k >= 0) drawSheet(ctx, overlays, k, sx, sy);
      else ctx.drawImage(this.diamond(fill, edge), sx - 16, sy - 8);
    };
    const pulse = 0.75 + 0.25 * Math.sin((now / 600) * Math.PI * 2); // alpha 0.5–1 over 600 ms
    for (let s = 0; s < V.w + V.h - 1; s++) for (let vy = 0; vy < V.h; vy++) {
      const vx = s - vy;
      if (vx < 0 || vx >= V.w) continue;
      const { x, y } = world(vx, vy);
      if (!seen(x, y)) continue;
      const i = y * w + x;
      const { sx, sy } = tileCenter(vx, vy);
      // territory: one outlined region per team (border on edges not shared with the same team)
      const tt = territory.get(i);
      if (tt !== undefined) {
        const same = (dx: number, dy: number) => { if (!inView(vx + dx, vy + dy)) return false; const p = world(vx + dx, vy + dy); return territory.get(p.y * w + p.x) === tt; };
        const sheet = A.get(tt ? 'objects/territory_tint_blue' : 'objects/territory_tint_red');
        if (sheet) drawSheet(ctx, sheet, (same(0, -1) ? 1 : 0) | (same(1, 0) ? 2 : 0) | (same(0, 1) ? 4 : 0) | (same(-1, 0) ? 8 : 0), sx, sy);
        else ctx.drawImage(this.diamond(tt ? 'rgba(48,64,176,0.18)' : 'rgba(168,32,62,0.18)', 'rgba(0,0,0,0)'), sx - 16, sy - 8);
      }
      if (hl.claim?.has(i)) { ctx.globalAlpha = pulse; ov('selected', sx, sy, 'rgba(255,164,46,0.35)', '#ffa42e'); ctx.globalAlpha = 1; }
      if (hl.blocked?.has(i)) ov('move_far', sx, sy, 'rgba(210,215,235,0.16)', 'rgba(255,255,255,0.3)');
      if (hl.move?.has(i)) {
        // respawn choices pulse
        if (hl.pulseMove) ctx.globalAlpha = pulse;
        ov('move', sx, sy, 'rgba(90,180,255,0.42)', '#bfe6ff');
        ctx.globalAlpha = 1;
      }
      if (hl.range?.has(i) && !hl.attack?.has(i)) ov('attack_edge', sx, sy, 'rgba(255,90,90,0.14)', 'rgba(255,140,140,0.35)');
      if (hl.area?.has(i) && !hl.attack?.has(i)) {
        if (hl.help) ov('support', sx, sy, 'rgba(90,220,110,0.2)', 'rgba(150,255,160,0.45)');
        else ov('spell', sx, sy, 'rgba(255,90,90,0.24)', 'rgba(255,150,150,0.5)');
      }
      if (hl.attack?.has(i)) {
        // targets in reach (or everything an action affects) pulse
        ctx.globalAlpha = pulse;
        if (hl.help) ov('support', sx, sy, 'rgba(90,220,110,0.55)', '#e0ffe4');
        else ov('attack', sx, sy, 'rgba(255,90,90,0.55)', '#ffe0e0');
        ctx.globalAlpha = 1;
      }
      if (hl.selected && hl.selected.x === x && hl.selected.y === y) ov('selected', sx, sy, 'rgba(255,164,46,0.35)', '#ffa42e');
      if (hl.pending && hl.pending.x === x && hl.pending.y === y) ov(hl.move?.has(i) ? 'move_target' : 'selected_hot', sx, sy, 'rgba(255,255,255,0.35)', '#ffffff');
    }

    // pass 1d: the path a pending move would take (seg toward previous + next; start; head)
    const arrows = A.get('ui/path_arrows'), names = arrows?.meta.names;
    if (arrows && names && hl.path && hl.path.length > 1) {
      const vp = hl.path.map(p => toView(p.x, p.y, this.rot, w, H));
      const DIR: Record<string, string> = { '0,-1': 'NE', '1,0': 'SE', '0,1': 'SW', '-1,0': 'NW', '-1,-1': 'N', '1,-1': 'E', '1,1': 'S', '-1,1': 'W' };
      const dir = (a: { x: number; y: number }, b: { x: number; y: number }) => DIR[`${b.x - a.x},${b.y - a.y}`];
      const piece = (n: string, p: { x: number; y: number }) => { const k = names.indexOf(n); if (k >= 0) { const c = tileCenter(p.x, p.y); drawSheet(ctx, arrows, k, c.sx, c.sy); } };
      vp.forEach((p, k) => {
        if (k === 0) piece('start', p);
        if (k > 0) piece(`seg_${dir(p, vp[k - 1])}`, p);
        if (k < vp.length - 1) piece(`seg_${dir(p, vp[k + 1])}`, p);
        else piece(`head_${dir(vp[k - 1], p)}`, p);
      });
    }

    // ---------- pass 2: things standing on tiles ----------

    const picks: Pickable[] = [];
    // Draw a unit and remember how, so a tap can be matched to what's visible (see pick()).
    // `sprite` draws the unit without its ring, bars or cues: the glow (handoff 007) outlines just that
    const unit = (tile: number, draw: (c: CanvasRenderingContext2D) => void, sprite?: (c: CanvasRenderingContext2D) => void, at?: [number, number]) => {
      draw(ctx); picks.push({ tile, draw });
      const pv = hl.preview?.get(tile);
      if (pv && sprite && at) this.drawGlow(ctx, sprite, at[0], at[1], pv.heal, now);
    };
    const heroAt = new Map<number, Hero[]>();
    for (const hero of g.heroes) {
      const v = this.visuals.get(hero.id);
      if (!hero.pos || !v) continue;
      const p = this.pos(v, now);
      const key = Math.round(p.y) * w + Math.round(p.x);
      if (!heroAt.has(key)) heroAt.set(key, []);
      heroAt.get(key)!.push(hero);
    }
    const lmAt = new Map(g.landmarks.map(l => [g.map.landmarks[l.idx].y * w + g.map.landmarks[l.idx].x, l]));
    const campAt = new Map(g.camps.map(c => [g.map.camps[c.idx].y * w + g.map.camps[c.idx].x, c]));
    const baseAt = new Map(g.map.bases.map(b => [b.y * w + b.x, b]));
    const fogEdge = A.get('terrain/fog_edge'), ridge = A.get('terrain/mountain_ridge_set'), fire = A.get('fx/firewall');

    for (let s = 0; s < V.w + V.h - 1; s++) for (let vy = 0; vy < V.h; vy++) {
      const vx = s - vy;
      if (vx < 0 || vx >= V.w) continue;
      const { x, y } = world(vx, vy);
      const i = y * w + x;
      const { sx, sy } = tileCenter(vx, vy);
      if (!seen(x, y)) {
        // fog: 47-blob edge pieces toward revealed neighbours (off the map counts as fog)
        const fogged = (dx: number, dy: number) => { if (!inView(vx + dx, vy + dy)) return true; const p = world(vx + dx, vy + dy); return !seen(p.x, p.y); };
        if (fogEdge?.meta.masks) drawCell(ctx, fogEdge, blobColumn(fogEdge.meta.masks, fogged), 0, sx, sy);
        else drawSheet(ctx, A.get('terrain/fog'), 0, sx, sy);
        continue;
      }
      if (tiles[i] === 'mountain') {
        // ridge pieces join toward ridge neighbours sharing an edge (NE=1 SE=2 SW=4 NW=8); 3 variants
        const r = (dx: number, dy: number) => tileV(vx + dx, vy + dy) === 'mountain';
        const col = (r(0, -1) ? 1 : 0) | (r(1, 0) ? 2 : 0) | (r(0, 1) ? 4 : 0) | (r(-1, 0) ? 8 : 0);
        if (ridge) drawCell(ctx, ridge, col, hash(x, y) % 3, sx, sy);
      }
      // Firewall: a burning loop on each tile of the U, out of step tile to tile
      if (fire && g.zones.some(z => z.tiles.includes(i))) drawSheet(ctx, fire, frameAt(fire.meta, now + ((vx + vy) * 2 % 6) * 100), sx, sy);
      const b = baseAt.get(i);
      if (b) {
        // under siege while a visible enemy hero stands on it
        const siege = g.heroes.some(o => o.pos && o.pos.x === x && o.pos.y === y && o.team !== b.team && (o.team === viewerTeam || visibleTo(g, o, viewerTeam)));
        const sheet = A.get(siege ? 'objects/home_base_siege_red' : 'objects/home_base_red', b.team);
        if (sheet) drawSheet(ctx, sheet, frameAt(sheet.meta, now), sx, sy);
      }
      const l = lmAt.get(i);
      if (l) {
        this.drawLandmark(ctx, g, l.idx, sx, sy, now);
        // lair boss stands on the landmark tile while alive
        if (g.map.landmarks[l.idx].bonus === 'lair' && l.bossRespawn === 0 && l.owner !== null) unit(i, c => this.drawCamp(c, 'boss', l.bossHp, sx, sy, now, `b${l.idx}`, hl.preview?.get(i)), c => this.drawCamp(c, 'boss', l.bossHp, sx, sy, now, `b${l.idx}`, undefined, true), [sx, sy]);
      }
      const c = campAt.get(i);
      if (c && c.respawn === 0) unit(i, cx => this.drawCamp(cx, g.map.camps[c.idx].kind, c.hp, sx, sy, now, `c${c.idx}`, hl.preview?.get(i)), cx => this.drawCamp(cx, g.map.camps[c.idx].kind, c.hp, sx, sy, now, `c${c.idx}`, undefined, true), [sx, sy]);
      // bodies waiting for respawn (Resurrection targets)
      for (const hero of g.heroes) if (!hero.pos && hero.deathPos && hero.deathPos.x === x && hero.deathPos.y === y && seen(x, y)) {
        const d = A.get(this.heroPath(hero, 'death', 'se'), hero.team);
        if (d) unit(i, cx => drawSheet(cx, d, d.meta.frames - 1, sx, sy, false, 0.7));
      }
      // Body double decoys
      for (const lm of g.landmarks) if (lm.pending?.decoy && lm.pending.decoy.x === x && lm.pending.decoy.y === y) {
        const thief = g.heroes[lm.pending.hero];
        const bd = A.get(`objects/body_double_${thief.team ? 'blue' : 'red'}`);
        unit(i, cx => bd ? drawSheet(cx, bd, frameAt(bd.meta, now + thief.id * 170), sx, sy)
          : drawSheet(cx, A.get(this.heroPath(thief, 'idle', 'se'), thief.team), 0, sx, sy, false, 0.45));
      }
      for (const hero of heroAt.get(i) ?? []) {
        if (hero.team !== viewerTeam && !visibleTo(g, hero, viewerTeam)) continue;
        const sel = hl.selected?.x === hero.pos!.x && hl.selected?.y === hero.pos!.y;
        const ht = idx(g, hero.pos!);
        unit(ht, cx => this.drawHero(cx, g, hero, viewerTeam, now, sel, hl.preview?.get(ht)), cx => this.drawHero(cx, g, hero, viewerTeam, now, false, undefined, true), [sx, sy]);
      }
    }

    this.picks = picks;


    // ---------- effects on top ----------
    this.fx = this.fx.filter(f => {
      const t = now - f.start;
      if (t < 0) return true; // not started yet (e.g. waiting for the release frame)
      if (f.to) {
        if (t > f.dur!) return false;
        const k = t / f.dur!;
        const sheet = A.get(f.sheet);
        if (sheet) drawSheet(ctx, sheet, frameAt(sheet.meta, t), Math.round(f.x + (f.to.x - f.x) * k), Math.round(f.y + (f.to.y - f.y) * k), f.flip);
        return true;
      }
      if (f.num !== undefined) {
        // Design's pop-up: scale 1.4 → 1 over 80 ms, rise 14 px over 700 ms, fade in the last 200 ms
        const life = f.life ?? 700;
        if (t > life) return false;
        const sheet = A.get(f.sheet);
        if (sheet) {
          ctx.globalAlpha = t > life - 200 ? (life - t) / 200 : 1;
          this.drawNum(ctx, sheet, f.num, Math.round(f.x), Math.round(f.y - (14 * t) / 700 * (life / 700 > 1 ? 1.6 : 1)), t < 80 ? 1.4 - (0.4 * t) / 80 : 1);
          ctx.globalAlpha = 1;
        }
        return true;
      }
      const sheet = A.get(f.sheet);
      if (!sheet || t > durationOf(sheet.meta) + (f.hold ?? 0)) return false;
      drawSheet(ctx, sheet, frameAt(sheet.meta, t), f.x, f.y, f.flip);
      return true;
    });

    // Lightning: the screen flashes white (20%) for its first frame
    if (now - this.flashAt >= 0 && now - this.flashAt < 90) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-1e4, -1e4, 2e4, 2e4); }
    ctx.restore(); // (screen shake)
  }

  /** Draw a number with a digit sheet ("0123456789+-"), centred on x, baseline y. */
  private drawNum(ctx: CanvasRenderingContext2D, sheet: NonNullable<ReturnType<Atlas['get']>>, text: string, x: number, y: number, scale: number) {
    const m = sheet.meta as typeof sheet.meta & { glyphs?: string; advance?: number[] };
    const glyphs = m.glyphs ?? '0123456789+-', adv = m.advance ?? [];
    const idxs = [...text].map(ch => glyphs.indexOf(ch)).filter(i => i >= 0);
    const width = idxs.reduce((s, i) => s + (adv[i] ?? 6), 0);
    ctx.save();
    ctx.translate(x, y); ctx.scale(scale, scale);
    let cx = -Math.round(width / 2);
    for (const i of idxs) { drawSheet(ctx, sheet, i, cx + m.anchor[0], 0); cx += adv[i] ?? 6; }
    ctx.restore();
  }

  private drawHero(ctx: CanvasRenderingContext2D, g: GameState, hero: Hero, viewerTeam: number, now: number, selected: boolean, pv?: UnitPreview, bare = false) {
    const A = this.atlas;
    const v = this.visuals.get(hero.id)!;
    const p = this.pos(v, now);
    const { sx, sy } = this.tc(p.x, p.y);
    const x = Math.round(sx), y = Math.round(sy);
    const { facing: f, flip } = this.face(v.dirX, v.dirY);
    // team ground ring (overlay sheet, packet 003; drawn in code if missing)
    const ov = A.get('ui/overlays'), ring = ov?.meta.names?.indexOf(hero.team ? 'ring_blue' : 'ring_red') ?? -1;
    if (bare) { /* sprite only (for the glow): no ring */ } else if (ov && ring >= 0) drawSheet(ctx, ov, ring, x, y);
    else {
      ctx.fillStyle = TEAM[hero.team];
      for (let i = -6; i <= 6; i++) { const dy = Math.round(Math.sqrt(1 - (i * i) / 42) * 2.5); ctx.fillRect(x + i, y + dy, 1, 1); ctx.fillRect(x + i, y - dy, 1, 1); }
    }

    // which animation, and when it started
    let anim = 'idle', t0 = hero.id * 170;
    const atk = A.get(this.heroPath(hero, v.attackAnim, f));
    if (atk && now - v.attackAt < durationOf(atk.meta)) { anim = v.attackAnim; t0 = -v.attackAt; }
    else if (p.moving) anim = 'walk';
    else if (now - v.hurtAt < 400) { anim = 'hurt'; t0 = -v.hurtAt; }

    // Vengeance aura (under the hero)
    if (hero.skills.has('vengeance') && hero.hp <= SKILL.vengeance.threshold * maxHp(g, hero)) {
      const aura = A.get(`heroes/barbarian/barbarian_vengeance_aura_${f}`);
      if (aura) drawSheet(ctx, aura, frameAt(aura.meta, now), x, y, flip);
    }

    // invisible thief: his own team sees the shimmer version; enemies only see him when detected
    const invisible = hero.statuses.some(s => s.kind === 'invisible');
    let path = this.heroPath(hero, anim, f);
    if (invisible && hero.team === viewerTeam) {
      const w = hero.weapon === 'knives' ? 'knives_' : '';
      const inv = `heroes/thief/thief_${w}invisible_${anim === 'walk' ? 'walk' : 'idle'}_${f}_red`;
      if (A.has(inv)) path = inv;
    }
    const frame = (s: { meta: import('../art/sprites.ts').SheetMeta }) => frameAt(s.meta, now + t0);
    const shieldPath = hero.shield > 0 ? this.heroPath(hero, anim, f, '_shield') : '';
    const shield = shieldPath ? A.get(shieldPath, hero.team) : undefined;
    const shieldBehind = f === 'se';

    if (shield && shieldBehind) drawSheet(ctx, shield, frame(shield), x, y, flip);
    if (hero.cls === 'barbarian' && hero.weapon === 'spear' && anim === 'attack') {
      // spear thrust drawn in tile pieces along the facing
      const r = v.reach >= 2 ? 2 : 1;
      for (let i = 0; i <= r; i++) {
        const piece = A.get(`heroes/barbarian/barbarian_spear_attack_r${r}_${f}_red_p${i}`, hero.team);
        if (!piece) continue;
        const ox = 16 * i * (flip ? -1 : 1), oy = (f === 'se' ? 8 : -8) * i;
        drawSheet(ctx, piece, frame(piece), x + ox, y + oy, flip);
      }
    } else {
      const sheet = A.get(path, hero.team);
      if (sheet) drawSheet(ctx, sheet, frame(sheet), x, y, flip);
    }
    if (shield && !shieldBehind) drawSheet(ctx, shield, frame(shield), x, y, flip);
    if (bare) return;

    // status loops (packet 004), subtle enough to sit on a hero all turn. Invisibility's shimmer
    // only for the thief's own side; Hunter's mark is a reticle at the chest.
    const LOOPS: [string, string][] = [['iceBlock', 'fx_ice_block'], ['fortify', 'fx_fortify'], ['poison', 'fx_poison_drip'], ['paralysis', 'fx_paralysis'], ['ward', 'fx_ward'], ['marked', 'fx_hunters_mark']];
    for (const [kind, sheetName] of LOOPS) if (hero.statuses.some(s => s.kind === kind)) {
      const s = A.get(`fx/${sheetName}`);
      if (s) drawSheet(ctx, s, frameAt(s.meta, now + hero.id * 90), x, kind === 'marked' ? y - 14 : y);
    }
    if (invisible && hero.team === viewerTeam) { const s = A.get('fx/fx_invisible_shimmer'); if (s) drawSheet(ctx, s, frameAt(s.meta, now), x, y); }

    // HP bar (while an action is being confirmed: the preview bar with the result)
    const max = maxHp(g, hero);
    if (pv) this.previewBar(ctx, x, y - 45, pv, now);
    else {
      ctx.fillStyle = '#0b0d2a'; ctx.fillRect(x - 7, y - 42, 14, 3);
      ctx.fillStyle = hero.hp / max > 0.5 ? '#5ee06a' : hero.hp / max > 0.25 ? '#ffb020' : '#ff5a5a';
      ctx.fillRect(x - 6, y - 41, Math.max(1, Math.round((12 * hero.hp) / max)), 1);
    }
    // hidden enemy next to one of the viewer's heroes: a "!" over the head (beside the selection arrow)
    if (hero.team === viewerTeam && hiddenAdjacent(g, hero)) {
      const s = A.get('ui/alert_hidden');
      if (s) drawSheet(ctx, s, frameAt(s.meta, now), x + 9, y - 46);
      else {
        const bx = x + 9, by = y - 50 + (Math.floor(now / 300) % 2);
        ctx.fillStyle = '#0b0d2a'; ctx.fillRect(bx - 1, by - 1, 4, 7); ctx.fillRect(bx - 1, by + 6, 4, 4);
        ctx.fillStyle = '#ffe04a'; ctx.fillRect(bx, by, 2, 5); ctx.fillRect(bx, by + 7, 2, 2);
      }
    }
    if (selected) {
      const bob = Math.floor(now / 250) % 2;
      ctx.fillStyle = '#3b2219'; ctx.fillRect(x - 3, y - 49 + bob, 7, 1);
      ctx.fillStyle = '#ffa42e'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 2 + i, y - 48 + bob + i, 5 - 2 * i, 1);
    }
  }

  private drawLandmark(ctx: CanvasRenderingContext2D, g: GameState, idx: number, sx: number, sy: number, now: number) {
    const m = g.map.landmarks[idx];
    const st = g.landmarks[idx];
    // Packet 003: gold mine and mana fountain are whole sprites; every other landmark is the
    // waystone marker plus its element floating in the marker's indicator slot.
    const whole = m.bonus === 'mine' ? 'objects/landmark_gold_mine' : m.bonus === 'fountain' ? 'objects/landmark_mana_fountain' : null;
    const marker = this.atlas.get(whole ?? 'objects/landmark_marker');
    if (marker) {
      // order (Design): marker → flag → element indicator → merchant/lair add-on
      drawSheet(ctx, marker, frameAt(marker.meta, now + idx * 130), sx, sy);
      const at = (slot: [number, number] | undefined) => slot && { x: sx + slot[0] - marker.meta.anchor[0], y: sy + slot[1] - marker.meta.anchor[1] };
      // flag (owned only): raised over ~0.7 s after a claim, then flying from the top of the pillar.
      // Gold mine / fountain have no flag slot: the flag stands on the ground beside them.
      if (st.owner !== null) {
        const team = g.players[st.owner].team ? 'blue' : 'red';
        const raise = this.atlas.get(`objects/flag_raise_${team}`), top = this.atlas.get(`objects/flag_top_${team}`);
        const since = now - (this.claimAt.get(idx) ?? -1e9);
        const flag = raise && since < durationOf(raise.meta) ? raise : top;
        const p = at(marker.meta.flagSlot) ?? { x: sx + 10, y: sy + 1 }; // gold mine / fountain have their own flagSlot (packet 004)
        if (flag && p) drawSheet(ctx, flag, flag === raise ? frameAt(flag.meta, since) : frameAt(flag.meta, now + idx * 90), p.x, p.y);
      }
      const ind = !whole && m.element ? this.atlas.get(`objects/element_indicator_${m.element}`) : undefined;
      const ip = at(marker.meta.indicatorSlot);
      if (ind && ip) drawSheet(ctx, ind, frameAt(ind.meta, now + idx * 90), ip.x, ip.y);
      const add = m.bonus === 'merchant' || m.bonus === 'lair' ? this.atlas.get(`objects/addon_${m.bonus}`) : undefined;
      const ap = at(marker.meta.addonSlot);
      if (add && ap) drawSheet(ctx, add, frameAt(add.meta, now + idx * 70), ap.x, ap.y);
      return;
    } else {
      // stand-in plinth with a coloured stone until packet 003
      const col = PLACEHOLDER_LANDMARK[m.element ?? m.bonus] ?? '#c3c8d6';
      ctx.fillStyle = tone('#5f6380'); ctx.fillRect(sx - 6, sy - 4, 12, 5);
      ctx.fillStyle = tone('#c3c8d6'); ctx.fillRect(sx - 5, sy - 5, 10, 2);
      ctx.fillStyle = tone('#3b2219'); ctx.fillRect(sx - 4, sy - 16, 8, 11);
      ctx.fillStyle = tone(col); ctx.fillRect(sx - 3, sy - 15, 6, 9);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(sx - 2, sy - 14, 2, 3);
    }
    // merchant / lair add-ons (stand-ins)
    if (m.bonus === 'merchant') { ctx.fillStyle = tone('#f4c030'); ctx.fillRect(sx - 14, sy - 6, 6, 4); ctx.fillStyle = tone('#a8203e'); ctx.fillRect(sx - 15, sy - 9, 8, 3); }
    if (m.bonus === 'lair') { ctx.fillStyle = tone('#262c4a'); ctx.fillRect(sx - 14, sy - 8, 7, 6); ctx.fillStyle = tone('#0b0d2a'); ctx.fillRect(sx - 12, sy - 6, 3, 4); }
    // (the lair boss is drawn by draw(), as a tappable unit)
  }

  /** A monster (packet 004): mushling (weak camp), wolf-dog (medium), troll (lair boss). They face
   *  left as drawn and turn toward whoever they last struck; flinch when hit, swing when striking back. */
  /** Handoff 007 preview bar, 18×4 with its top-left at (cx − 9, top): HP kept in green, the part
   *  that would be lost (or healed) flashing every 200 ms; a KO flashes the whole remaining bar and adds
   *  a 5×5 skull. The predicted number pops above it. */
  private previewBar(ctx: CanvasRenderingContext2D, cx: number, top: number, pv: UnitPreview, now: number) {
    const x0 = Math.round(cx - 9), w = 16, flash = Math.floor(now / 200) % 2;
    const px = (v: number) => Math.round((w * Math.max(0, Math.min(pv.max, v))) / pv.max);
    const keep = px(Math.min(pv.hp, pv.after)), change = px(Math.max(pv.hp, pv.after)) - keep;
    ctx.fillStyle = '#0b0d2a'; ctx.fillRect(x0, top, 18, 4);
    ctx.fillStyle = '#262c4a'; ctx.fillRect(x0 + 1, top + 1, w, 2);
    ctx.fillStyle = '#5ee06a'; ctx.fillRect(x0 + 1, top + 1, keep, 2);
    ctx.fillStyle = pv.heal ? (flash ? '#ffffff' : '#b8f0a0') : (flash ? '#fff4d6' : '#ff5a5a');
    ctx.fillRect(x0 + 1 + keep, top + 1, Math.max(change, pv.heal || pv.after < pv.hp ? 1 : 0), 2);
    if (pv.ko) {
      // skull: 5×5 on a dark backing, right of the bar
      const sx = x0 + 19, sy = top - 1;
      ctx.fillStyle = '#0b0d2a'; ctx.fillRect(sx - 1, sy - 1, 7, 7);
      ctx.fillStyle = '#f6f0e2';
      for (const [dx, dy] of [[1, 0], [2, 0], [3, 0], [0, 1], [2, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [3, 3], [1, 4], [2, 4], [3, 4]]) ctx.fillRect(sx + dx, sy + dy, 1, 1);
    }
    const sheet = this.atlas.get(pv.sheet);
    if (sheet && pv.num) this.drawNum(ctx, sheet, pv.num, cx, top - 2, 1);
  }

  /** Handoff 007 target glow, a runtime rule: ring 1 = transparent pixels 4-adjacent to the sprite (full
   *  alpha), ring 2 = the next ring out (alpha 100/255); colour cycles every 120 ms. `sprite` draws the
   *  unit with its anchor at (sx, sy). */
  private drawGlow(ctx: CanvasRenderingContext2D, sprite: (c: CanvasRenderingContext2D) => void, sx: number, sy: number, heal: boolean, now: number) {
    const S = 96, AX = 48, AY = 80;
    if (!this.glowIn) {
      const a = document.createElement('canvas'); a.width = S; a.height = S;
      const b = document.createElement('canvas'); b.width = S; b.height = S;
      this.glowIn = a.getContext('2d', { willReadFrequently: true }); this.glowOut = b.getContext('2d');
    }
    const gi = this.glowIn, go = this.glowOut;
    if (!gi || !go) return;
    gi.setTransform(1, 0, 0, 1, 0, 0); gi.clearRect(0, 0, S, S);
    gi.setTransform(1, 0, 0, 1, AX - Math.round(sx), AY - Math.round(sy));
    sprite(gi);
    const src = gi.getImageData(0, 0, S, S).data;
    const solid = (i: number) => src[i * 4 + 3] > 0;
    const ring = new Uint8Array(S * S); // 1 = ring 1, 2 = ring 2
    const nb = (i: number, f: (j: number) => boolean) => { const x = i % S, y = (i / S) | 0; return (x > 0 && f(i - 1)) || (x < S - 1 && f(i + 1)) || (y > 0 && f(i - S)) || (y < S - 1 && f(i + S)); };
    for (let i = 0; i < S * S; i++) if (!solid(i) && nb(i, solid)) ring[i] = 1;
    for (let i = 0; i < S * S; i++) if (!solid(i) && !ring[i] && nb(i, j => ring[j] === 1)) ring[i] = 2;
    const col = (heal ? GLOW.heal : GLOW.attack)[Math.floor(now / 120) % 4];
    const r = parseInt(col.slice(1, 3), 16), gC = parseInt(col.slice(3, 5), 16), bC = parseInt(col.slice(5, 7), 16);
    const out = go.createImageData(S, S), d = out.data;
    for (let i = 0; i < S * S; i++) if (ring[i]) { d[i * 4] = r; d[i * 4 + 1] = gC; d[i * 4 + 2] = bC; d[i * 4 + 3] = ring[i] === 1 ? 255 : 100; }
    go.putImageData(out, 0, 0);
    ctx.drawImage(go.canvas, Math.round(sx) - AX, Math.round(sy) - AY);
  }

  private drawCamp(ctx: CanvasRenderingContext2D, kind: string, hp: number, sx: number, sy: number, now: number, key: string, pv?: UnitPreview, bare = false) {
    const name = CREATURE[kind] ?? 'mushling', a = this.npcAnim(key);
    const atk = this.atlas.get(`creatures/${name}_attack`), hit = this.atlas.get(`creatures/${name}_hit`);
    let s = this.atlas.get(`creatures/${name}_idle`) ?? this.atlas.get('creatures/mushling_idle'), t = now + sx * 13;
    if (atk && now >= a.attackAt && now - a.attackAt < durationOf(atk.meta)) { s = atk; t = now - a.attackAt; }
    else if (hit && now - a.hitAt < durationOf(hit.meta)) { s = hit; t = now - a.hitAt; }
    if (s) drawSheet(ctx, s, frameAt(s.meta, t), sx, sy + 1, a.flip);
    if (bare) return;
    const max = kind === 'weak' ? 5 : kind === 'medium' ? 10 : 25;
    const top = sy - (s ? s.meta.anchor[1] : 22) - 1;
    if (pv) { this.previewBar(ctx, sx, top - 3, pv, now); return; }
    ctx.fillStyle = '#0b0d2a'; ctx.fillRect(sx - 6, top, 12, 3);
    ctx.fillStyle = '#ff5a5a'; ctx.fillRect(sx - 5, top + 1, Math.max(1, Math.round((10 * hp) / max)), 1);
  }
}
