// Monster details: tap a camp or a lair boss you can see to read its HP from afar, plus what it
// hits for and what killing it pays. Same panel family as the hero (H9) and landmark (H15) panels.

import type { GameState } from '@engine/state.ts';
import { NPC } from '@engine/economy.ts';

export type NpcRef = { kind: 'camp' | 'boss'; idx: number };

const NAME = { weak: 'Mushling', medium: 'Wolf-dog', boss: 'Troll' } as const;
const TIER = { weak: 'Weak camp', medium: 'Medium camp', boss: 'Lair boss' } as const;

export function NpcPanel({ g, npc }: { g: GameState; npc: NpcRef }) {
  const kind = npc.kind === 'boss' ? 'boss' : g.map.camps[npc.idx].kind;
  const stats = kind === 'boss' ? NPC.lair : NPC[kind];
  const hp = npc.kind === 'boss' ? g.landmarks[npc.idx].bossHp : g.camps[npc.idx].hp;
  return (
    <div className="window panel npc-panel">
      <div className="panel-head">
        <span className="hero-title"><b>{NAME[kind]}</b><small className="owner theirs">{TIER[kind]}</small></span>
      </div>
      <div className="hero-stats">
        <span><img src="art/icons/icon_hp.png" alt="HP" /><b>{hp}</b><small>/{stats.hp}</small></span>
        <span><small>ATK</small><b>{stats.dmg}</b></span>
        <span className="lm-tag"><img src="art/icons/icon_xp.png" alt="XP" />{stats.xp}</span>
        <span className="lm-tag"><img src="art/icons/icon_gold.png" alt="Gold" />{stats.gold}</span>
      </div>
      <div className="npc-bar"><i style={{ width: `${Math.max(0, Math.min(100, (hp / stats.hp) * 100))}%` }} /></div>
    </div>
  );
}
