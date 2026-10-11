// Aimed spells from the Skills menu (Nick's targeting rule, 2026-10-01): pick a target, a tile or
// a direction; the area and every affected unit light up; then confirm.
//
//   enemy     Mage bolt, Lightning, Poison, Nature   tap an enemy (or monster) in range
//   tile      Fireball                               tap any revealed tile in range → its 3×3
//   dir       Tidal wave                             tap a tile on one of the 8 lines → that line of 3
//   ally      Empower, Cleanse, Fortify              tap yourself or an ally in range
//   body      Resurrection                           tap a fallen ally's body
//   firewall  Firewall                               tap yourself or an ally (the centre), then a tile
//                                                    around it: the U opens toward that tile
//   teleport  Telepuppet                               tap an ally within 3, then a revealed tile within 5 of
//                                                    you: the ally lands there and takes one action
//
// Everything here only lists options; canCast in the engine has the last word.

import type { GameState, Hero } from '@engine/state.ts';
import type { Pos } from '@engine/mapgen.ts';
import { canCast, aimedEffects, spellRange, weaponRange, alliesOf, enemiesOf, visibleTo, targetPos, tidalTiles, dirToward, type CastArgs, type Spell, type Target, type Effect } from '@engine/rules.ts';
import { SKILL } from '@engine/numbers.ts';
import { SPELL_INFO } from '@engine/rules.ts';
import type { Action } from '@engine/match.ts';
import { cheb } from '@engine/mapgen.ts';

export type AimKind = 'enemy' | 'tile' | 'dir' | 'ally' | 'body' | 'firewall' | 'teleport' | 'mark';

/** What can be aimed: a spell, or Hunter's mark (a free action, not a spell). */
export type Aimable = Spell | 'huntersMark';

export const AIMED: Partial<Record<Aimable, AimKind>> = {
  mageBolt: 'enemy', lightning: 'enemy', poison: 'enemy', nature: 'enemy',
  fireball: 'tile', tidalWave: 'dir', firewall: 'firewall',
  empower: 'ally', cleanse: 'ally', fortify: 'ally', resurrection: 'body',
  huntersMark: 'mark', teleport: 'teleport',
};

/** The spell being aimed; for Firewall, `center` is the hero it's placed around once picked. */
export interface Aim { spell: Aimable; center?: number }

export interface AimOption { tile: number; args: CastArgs }

/** Every tile the player can tap to aim, with the cast it stands for. */
export function aimOptions(g: GameState, h: Hero, aim: Aim): AimOption[] {
  if (!h.pos) return [];
  const kind = AIMED[aim.spell];
  const W = g.map.w, out: AimOption[] = [];
  if (kind === 'mark') {
    // Hunter's mark (free): a visible enemy within weapon range
    if (!h.skills.has('huntersMark') || h.mana < SKILL.huntersMark.mana) return [];
    const r = weaponRange(g, h, !!h.moved);
    return enemiesOf(g, h).filter(e => visibleTo(g, e, h.team) && cheb(e.pos!, h.pos!) <= r).map(e => ({ tile: e.pos!.y * W + e.pos!.x, args: { hero: e.id } }));
  }
  const spell = aim.spell as Spell;
  const add = (p: Pos, args: CastArgs) => { if (canCast(g, h, spell, args)) out.push({ tile: p.y * W + p.x, args }); };
  switch (kind) {
    case 'enemy': {
      for (const e of enemiesOf(g, h)) if (visibleTo(g, e, h.team)) add(e.pos!, { hero: e.id });
      const npcs: Target[] = [];
      g.camps.forEach((c, i) => { if (c.respawn === 0) npcs.push({ kind: 'camp', id: i }); });
      g.landmarks.forEach((l, i) => {
        if (g.map.landmarks[i].bonus === 'lair' && l.bossRespawn === 0) npcs.push({ kind: 'boss', id: i });
        if (l.pending?.decoy) npcs.push({ kind: 'decoy', id: i });
      });
      for (const t of npcs) { const p = targetPos(g, t); if (p && g.fog[h.team][p.y * W + p.x]) add(p, { npc: t }); }
      break;
    }
    case 'tile': {
      const r = spellRange(h, spell);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const p = { x: h.pos.x + dx, y: h.pos.y + dy };
        if (p.x >= 0 && p.y >= 0 && p.x < W && p.y < g.map.h && g.fog[h.team][p.y * W + p.x]) add(p, { target: p });
      }
      break;
    }
    case 'dir':
      for (let d = 0; d < 8; d++) for (const p of tidalTiles(g, h.pos, d)) add(p, { dir: d });
      break;
    case 'ally':
      for (const o of [h, ...alliesOf(g, h)]) if (o.pos) add(o.pos, { hero: o.id });
      break;
    case 'body':
      for (const o of g.heroes) if (o.team === h.team && !o.pos && o.deathPos) add(o.deathPos, { hero: o.id });
      break;
    case 'teleport': {
      // first the ally (within range, alive, not you), then where it lands
      if (aim.center === undefined) {
        if (!h.skills.has('teleport') || h.mana < SPELL_INFO.teleport.mana) break;
        for (const o of alliesOf(g, h)) if (o.pos && cheb(o.pos, h.pos) <= spellRange(h, 'teleport')) out.push({ tile: o.pos.y * W + o.pos.x, args: { hero: o.id } });
        break;
      }
      const R = 5;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const p = { x: h.pos.x + dx, y: h.pos.y + dy };
        if (p.x >= 0 && p.y >= 0 && p.x < W && p.y < g.map.h) add(p, { hero: aim.center, dest: p });
      }
      break;
    }
    case 'firewall': {
      if (aim.center === undefined) { for (const o of [h, ...alliesOf(g, h)]) if (o.pos) add(o.pos, { hero: o.id, open: 0 }); break; }
      const c = g.heroes[aim.center].pos;
      if (!c) break;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const p = { x: c.x + dx, y: c.y + dy };
        if ((dx || dy) && p.x >= 0 && p.y >= 0 && p.x < W && p.y < g.map.h) add(p, { hero: aim.center, open: dirToward(c, p) });
      }
      break;
    }
  }
  return out;
}

/** Firewall's first pick: the U around the chosen hero, open toward the caster (or east if it's the caster). */
export function firewallDefault(g: GameState, h: Hero, center: number): CastArgs {
  const c = g.heroes[center].pos!;
  const open = center === h.id || !h.pos ? 0 : dirToward(c, h.pos);
  return { hero: center, open: open < 0 ? 0 : open };
}

/** Preview of an aimed pick: the spell's area and effects (Hunter's mark: just its target). */
export function aimPreview(g: GameState, h: Hero, aim: Aim, args: CastArgs): { tiles: Pos[]; effects: Effect[] } {
  if (aim.spell === 'huntersMark') { const p = g.heroes[args.hero!].pos!; return { tiles: [{ ...p }], effects: [] }; }
  if (aim.spell === 'teleport') return { tiles: args.dest ? [{ ...args.dest }] : [], effects: [] };
  return aimedEffects(g, h, aim.spell, args);
}


/** The action for an aimed pick: Hunter's mark, or the spell. (Telepuppet: the ally's one action is
 *  the caster's next action, see Match.puppet.) */
export function aimAction(aim: Aim, args: CastArgs): Action {
  return aim.spell === 'huntersMark' ? { t: 'mark', hero: args.hero! } : { t: 'cast', spell: aim.spell, args };
}
