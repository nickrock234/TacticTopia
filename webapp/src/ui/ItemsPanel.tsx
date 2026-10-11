// Items (packet 006, H13): equipped weapon / shield / boots, the 5-slot bag, and for the selected
// spare: Equip, Give (to an adjacent teammate with room; two candidates → pick one), Sell.
// All free (no action). SHOP opens H12.

import { useState } from 'react';
import type { GameState, Hero } from '@engine/state.ts';
import { canEquip, canGive, sellPrice } from '@engine/rules.ts';
import type { Action } from '@engine/match.ts';
import type { Atlas } from '../art/sprites.ts';
import { Portrait } from './Portrait.tsx';
import { itemView, equipped, BAG, cap } from './items.ts';

export function ItemsPanel({ g, hero, atlas, canAct, act }: {
  g: GameState; hero: Hero; atlas: Atlas; canAct: boolean; act: (a: Action) => boolean;
}) {
  const [sel, setSel] = useState<number | null>(hero.inventory.length ? 0 : null);
  const [picking, setPicking] = useState(false);
  const p = g.players[hero.player];
  const gear = equipped(g, hero);
  const it = sel !== null ? hero.inventory[sel] : undefined;
  const view = it ? itemView(it.item, it.upgraded, { terrain: it.terrain ?? null }) : null;
  const mates = it ? g.heroes.filter(o => canGive(g, hero, o, sel!)) : [];
  const done = (ok: boolean) => { if (!ok) return; setPicking(false); setSel(s => (s !== null && s < hero.inventory.length ? s : hero.inventory.length ? 0 : null)); };

  return (
    <div className="window panel items">
      <div className="panel-head">
        <span className="panel-title">Items</span>
        <span className="chip gold"><img src="art/icons/icon_gold.png" alt="Gold" />{p.gold}</span>
      </div>

      <div className="gear-slots">
        {gear.map((v, i) => (
          <div key={i} className={`gear-slot${v ? '' : ' empty'}${i === 0 ? ' wide' : ''}`}>
            <img src={`art/${v?.icon ?? ['icons/icon_item_sword', 'icons/icon_item_shield', 'icons/icon_item_boots'][i]}.png`} alt="" />
            {v && <span className="gear-val"><b>{v.val}</b><small>{v.sub}</small></span>}
            {v?.terrain && <img className="gear-ter" src={`art/${v.terrain}.png`} alt="" />}
          </div>
        ))}
      </div>

      <div className="bag">
        {Array.from({ length: BAG }, (_, i) => {
          const b = hero.inventory[i];
          const bv = b ? itemView(b.item, b.upgraded, { terrain: b.terrain ?? null }) : null;
          return (
            <button key={i} className={`bag-slot${b ? '' : ' empty'}${sel === i ? ' sel' : ''}`} disabled={!b} onClick={() => { setSel(i); setPicking(false); }}>
              {bv && <img src={`art/${bv.icon}.png`} alt="" />}
              {b?.upgraded && <span className="bag-plus">+</span>}
            </button>
          );
        })}
      </div>

      {view && it && (
        <>
          <div className="item-detail">
            <img src={`art/${view.icon}.png`} alt="" />
            <span className="item-name">{view.name}<span className="gear-val"><b>{view.val}</b><small>{view.sub}</small></span></span>
            {view.terrain && <img className="gear-ter" src={`art/${view.terrain}.png`} alt="" />}
            <span className="item-who">{view.who}</span>
          </div>
          {picking && mates.length > 1 && (
            <div className="give-pick">
              {mates.map(m => (
                <button key={m.id} className="btn-orange" onClick={() => done(act({ t: 'give', to: m.id, index: sel! }))}>
                  <span className={`portrait ${m.team ? 'blue' : 'red'}`}><Portrait atlas={atlas} cls={m.cls} team={m.team} state={0} /></span>{cap(m.cls)}
                </button>
              ))}
            </div>
          )}
          <div className="item-actions">
            <button className="btn-blue" disabled={!canAct || !canEquip(g, hero, sel!)} onClick={() => done(act({ t: 'equip', index: sel! }))}>EQUIP</button>
            <button className="btn-orange" disabled={!canAct || mates.length === 0}
              onClick={() => mates.length === 1 ? done(act({ t: 'give', to: mates[0].id, index: sel! })) : setPicking(x => !x)}>
              {mates.length === 1 && <span className={`portrait small ${mates[0].team ? 'blue' : 'red'}`}><Portrait atlas={atlas} cls={mates[0].cls} team={mates[0].team} state={0} /></span>}GIVE
            </button>
            <button className="btn-blue" disabled={!canAct} onClick={() => done(act({ t: 'sell', index: sel! }))}>
              SELL<img src="art/icons/icon_gold.png" alt="gold" />{sellPrice(it.item, it.upgraded)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
