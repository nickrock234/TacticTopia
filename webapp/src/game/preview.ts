// What a pending action does to each unit it affects (handoff 007): who it is, HP now → after, KO,
// the block maths, and what the map shows over it. Used by the map preview and the attack panel.

import type { GameState, Hero } from '@engine/state.ts';
import { maxHp } from '@engine/state.ts';
import { NPC } from '@engine/economy.ts';
import type { Pos } from '@engine/mapgen.ts';
import type { Effect } from '@engine/rules.ts';
import type { UnitPreview } from '../map/renderer.ts';

export interface PreviewUnit {
  tile: number; pos: Pos; effect: Effect;
  kind: 'hero' | 'camp' | 'boss' | 'decoy';
  hero?: Hero; creature?: string;      // creature sheet name for monsters (mushling / wolfdog / troll)
  name: string; hp: number; max: number; after: number;
  heal: boolean; ko: boolean;
  blocked: number;                     // damage the target's defences took off (raw − full)
  chip: boolean;                       // defences cut it to the minimum 1
  reward?: { xp: number; gold: number; chest: boolean };
  view: UnitPreview;                   // what the map draws over it
}

const CREATURE: Record<string, string> = { weak: 'mushling', medium: 'wolfdog' };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function previewUnits(g: GameState, viewer: Hero, effects: Effect[]): PreviewUnit[] {
  const out: PreviewUnit[] = [];
  for (const e of effects) {
    const { x, y } = e.pos, tile = y * g.map.w + x;
    let u: Omit<PreviewUnit, 'after' | 'ko' | 'heal' | 'blocked' | 'chip' | 'view' | 'tile' | 'pos' | 'effect'> | null = null;
    const hero = g.heroes.find(h => h.pos && h.pos.x === x && h.pos.y === y);
    const camp = g.camps.findIndex((c, i) => c.respawn === 0 && g.map.camps[i].x === x && g.map.camps[i].y === y);
    const lair = g.landmarks.findIndex((l, i) => g.map.landmarks[i].bonus === 'lair' && l.bossRespawn === 0 && g.map.landmarks[i].x === x && g.map.landmarks[i].y === y);
    const decoy = g.landmarks.findIndex(l => l.pending?.decoy && l.pending.decoy.x === x && l.pending.decoy.y === y);
    if (hero) u = { kind: 'hero', hero, name: cap(hero.cls), hp: hero.hp, max: maxHp(g, hero) };
    else if (camp >= 0) {
      const kind = g.map.camps[camp].kind, r = NPC[kind];
      u = { kind: 'camp', creature: CREATURE[kind] ?? 'mushling', name: kind === 'weak' ? 'Mushling' : 'Wolf-dog', hp: g.camps[camp].hp, max: r.hp, reward: { xp: r.xp, gold: r.gold, chest: false } };
    } else if (lair >= 0) u = { kind: 'boss', creature: 'troll', name: 'Troll', hp: g.landmarks[lair].bossHp, max: NPC.lair.hp, reward: { xp: NPC.lair.xp, gold: NPC.lair.gold, chest: true } };
    else if (decoy >= 0) u = { kind: 'decoy', name: 'Body double', hp: 1, max: 1 };
    if (!u) continue;
    const heal = e.help;
    const after = heal ? Math.min(u.max, u.hp + e.amount) : Math.max(0, u.hp - e.amount);
    const ko = !heal && e.kills;
    const blocked = !heal && e.raw !== undefined && e.full !== undefined ? Math.max(0, e.raw - e.full) : 0;
    const chip = blocked > 0 && (e.full ?? 0) <= 1;
    const ours = u.kind === 'hero' && u.hero!.team === viewer.team;
    const num = heal ? (e.amount > 0 ? `+${e.amount}` : '') : `-${e.amount}`;
    out.push({ ...u, tile, pos: e.pos, effect: e, after, heal, ko, blocked, chip,
      view: { hp: u.hp, max: u.max, after, heal, ko, num, sheet: heal ? 'fx/num_green' : ours ? 'fx/num_red' : 'fx/num_white' } });
  }
  return out;
}
