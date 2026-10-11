// Attack preview panel (Design handoff 007), replacing the confirm box for anything that hits or heals.
// One enemy or monster: its details (portrait, class + element, block, move, statuses; a monster shows
// its kill reward), the HP bar with the loss flashing, the action row with the block maths
// ("7 − [block] 3"), your row when the hit changes your HP (recoil or self-heal), ✕ / ATTACK.
// Several units, or a heal: one row each (portrait, name, bar, HP after, result). Green for heals.

import type { GameState, Hero } from '@engine/state.ts';
import { maxHp } from '@engine/state.ts';
import { HERO_STATS } from '@engine/numbers.ts';
import { defenderState } from '@engine/rules.ts';
import type { Atlas } from '../art/sprites.ts';
import { Portrait } from './Portrait.tsx';
import { STATUS } from './HeroPanel.tsx';
import type { PreviewUnit } from '../game/preview.ts';

export interface PanelAction { name: string; icon: string; mana: number; btn: 'ATTACK' | 'CAST'; self?: { dmg: number; heal: number } }

function Bar({ hp, max, after, heal, big }: { hp: number; max: number; after: number; heal: boolean; big?: boolean }) {
  const lo = Math.min(hp, after), hi = Math.max(hp, after);
  return (
    <span className={`pv-bar${big ? ' big' : ''}`}>
      <i style={{ width: `${(lo / max) * 100}%` }} />
      <i className={heal ? 'gain' : 'loss'} style={{ width: `${((hi - lo) / max) * 100}%` }} />
    </span>
  );
}

function Face({ atlas, u, size }: { atlas: Atlas; u: PreviewUnit; size: number }) {
  if (u.hero) return <span className={`portrait ${u.hero.team ? 'blue' : 'red'}`} style={{ width: size, height: size }}><Portrait atlas={atlas} cls={u.hero.cls} team={u.hero.team} state={0} /></span>;
  // monsters: the first idle frame, centred
  const s = atlas.get(`creatures/${u.creature ?? 'mushling'}_idle`);
  const fw = s?.meta.frameW ?? 24, fh = s?.meta.frameH ?? 24, k = Math.min(1, (size - 4) / Math.max(fw, fh));
  return (
    <span className="portrait monster" style={{ width: size, height: size }}>
      <span style={{ width: fw * k, height: fh * k, overflow: 'hidden', display: 'block' }}>
        <img src={`art/creatures/${u.creature ?? 'mushling'}_idle.png`} alt="" style={{ height: fh * k, imageRendering: 'pixelated' }} />
      </span>
    </span>
  );
}

export function AttackPanel({ g, me, atlas, act, units, onOk, onCancel, canAct }: {
  g: GameState; me: Hero; atlas: Atlas; act: PanelAction; units: PreviewUnit[]; onOk: () => void; onCancel: () => void; canAct: boolean;
}) {
  const heal = units.length > 0 && units.every(u => u.heal);
  const single = units.length === 1 && !heal;
  const buttons = (
    <div className="pv-buttons">
      <button className="detail-x" onClick={onCancel}>✕</button>
      <button className="detail-go" disabled={!canAct} onClick={onOk}>{act.btn}</button>
    </div>
  );
  const mana = act.mana > 0 && <span className="pv-mana">{act.mana}<img src="art/icons16/icon16_mana.png" alt="mana" /></span>;

  if (single) {
    const u = units[0], h = u.hero;
    const def = h ? defenderState(g, h, me.team) : null;
    const block = def ? Math.max(0, def.shield + def.otherBlock - def.shattered) : 0;
    const myMax = maxHp(g, me);
    const self = act.self && (act.self.dmg || act.self.heal) ? act.self : null;
    const selfAfter = self ? Math.max(0, Math.min(myMax, me.hp - self.dmg + self.heal)) : me.hp;
    return (
      <div className="window panel attack-panel">
        <div className="pv-head">
          <Face atlas={atlas} u={u} size={48} />
          <span className="hero-title"><b>{u.name}</b>
            <small>{h && <img src={`art/icons/icon_element_${h.element}.png`} alt="" />}{h ? 'Enemy' : u.kind === 'boss' ? 'Lair boss' : u.kind === 'decoy' ? 'Body double' : 'Monster'}</small></span>
          {h && <span className="pv-chip"><img className="i16" src="art/icons16/icon16_block.png" alt="block" />{block}</span>}
          {h && <span className="pv-chip"><img src="art/icons/icon_movement.png" alt="move" />{HERO_STATS[h.cls].move + (h.boots ? 1 : 0)}</span>}
          {u.reward && <span className="pv-chip xp"><img src="art/icons/icon_xp.png" alt="XP" />{u.reward.xp}</span>}
          {u.reward && <span className="pv-chip gold"><img src="art/icons/icon_gold.png" alt="gold" />{u.reward.gold}</span>}
          {u.reward?.chest && <span className="pv-chip"><img src="art/objects/chest.png" className="chest" alt="chest" /></span>}
        </div>
        {h && h.statuses.filter(s => STATUS[s.kind] && s.kind !== 'invisible').length > 0 && (
          <div className="hero-statuses">
            {h.statuses.filter(s => STATUS[s.kind] && s.kind !== 'invisible').map((s, i) => (
              <span key={i} className="status-chip"><img src={`art/icons16/icon16_status_${STATUS[s.kind][0]}.png`} alt="" />{STATUS[s.kind][1]}<b>{s.turns < 99 ? s.turns : ''}</b></span>
            ))}
          </div>
        )}
        <div className="pv-hp">
          <img src="art/icons/icon_hp.png" alt="HP" />
          <span className="pv-num"><b>{u.hp}</b><small>/{u.max}</small></span>
          <Bar hp={u.hp} max={u.max} after={u.after} heal={false} big />
          <span className={`pv-after${u.ko ? ' ko' : ''}`}>{u.ko && <img className="i16" src="art/icons16/icon16_ko.png" alt="" />}{u.ko ? 'KO' : u.after}</span>
        </div>
        <div className="pv-act">
          <img src={`art/${act.icon}.png`} alt="" />
          <span className="pv-act-name"><b>{act.name}</b>
            {u.blocked > 0 && <small>{u.effect.raw} − <img className="i16" src="art/icons16/icon16_block.png" alt="block" />{u.blocked}</small>}</span>
          {mana}
          <span className="pv-res">−{u.effect.full ?? u.effect.amount}</span>
        </div>
        {self && (
          <div className="pv-self">
            <img className="i16" src={`art/icons16/${self.dmg > self.heal ? 'icon16_recoil' : 'icon16_hp'}.png`} alt="" />
            <span className={`portrait small ${me.team ? 'blue' : 'red'}`}><Portrait atlas={atlas} cls={me.cls} team={me.team} state={0} /></span>
            <span className="pv-num"><b>{me.hp}</b></span>
            <Bar hp={me.hp} max={myMax} after={selfAfter} heal={self.heal > self.dmg} />
            <span className="pv-after">{selfAfter}</span>
            <span className={`pv-res ${self.heal > self.dmg ? 'heal' : ''}`}>{self.heal > self.dmg ? `+${self.heal - self.dmg}` : `−${self.dmg - self.heal}`}</span>
          </div>
        )}
        {buttons}
      </div>
    );
  }

  return (
    <div className={`window panel attack-panel${heal ? ' heal' : ''}`}>
      <div className="pv-list-head">
        <img src={`art/${act.icon}.png`} alt="" />
        <span className="pv-act-name"><b>{act.name}</b></span>
        {mana}
      </div>
      {units.map(u => (
        <div key={u.tile} className="pv-row">
          <Face atlas={atlas} u={u} size={32} />
          <span className="pv-who">{u.name}</span>
          {u.effect.help && u.effect.amount === 0 ? <span className="pv-bar-gap" /> : <Bar hp={u.hp} max={u.max} after={u.after} heal={u.heal} />}
          <span className="pv-after">{u.ko || (u.effect.help && u.effect.amount === 0) ? '' : u.after}</span>
          <span className={`pv-res ${u.heal ? 'heal' : u.ko ? 'ko' : ''}`}>
            {u.ko && <img className="i16" src="art/icons16/icon16_ko.png" alt="" />}
            {!u.ko && u.chip && <img className="i16" src="art/icons16/icon16_block.png" alt="" />}
            {u.ko ? 'KO' : u.heal ? (u.effect.amount ? `+${u.effect.amount}` : '✓') : `−${u.effect.amount}`}
          </span>
        </div>
      ))}
      {buttons}
    </div>
  );
}
