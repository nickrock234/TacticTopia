// Base (packet 006, "Base Phone"): one row per branch, tiers left to right, same
// state language as the skill tree (gold outline owned, orange buildable, red
// short on gold, grey needs the previous tier). Gold and income per turn on top.
// Tap a building for its sheet (Build). Free, from anywhere.

import { useState } from 'react';
import type { GameState, Hero } from '@engine/state.ts';
import { BUILDINGS, BUILDING } from '@engine/economy.ts';
import { priceFor } from '@engine/rules.ts';
import type { Action } from '@engine/match.ts';
import { income } from '@engine/turn.ts';
import type { Atlas } from '../art/sprites.ts';
import { BUILDING_TEXT, buildingIcon } from './info.ts';

const BRANCHES = ['Smithing', 'Learning', 'Training', 'Faith', 'Trade', 'Territory'];

export function BaseScreen({ g, hero, atlas, canBuy, onClose, act }: {
  g: GameState; hero: Hero; atlas: Atlas; canBuy: boolean; onClose: () => void; act: (a: Action) => boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const p = g.players[hero.player];
  const inc = income(g, hero.player);
  const nameOf = (id: string) => BUILDING[id].name;
  const stateOf = (id: string) => {
    const b = BUILDING[id];
    if (p.buildings.has(id)) return 'owned';
    if (b.requires && !p.buildings.has(b.requires)) return 'locked';
    return p.gold >= priceFor(g, hero.player, b.cost) ? 'avail' : 'pricey';
  };

  const b = sel ? BUILDING[sel] : null;
  return (
    <div className="screen base">
      <div className="screen-head">
        <button className="back" onClick={onClose}>‹</button>
        <span className="screen-title">Base</span>
        <span className="chip gold"><img src="art/icons/icon_gold.png" alt="Gold" />{p.gold}</span>
      </div>
      <div className="base-income">
        <span><img src="art/icons16/icon16_gold.png" alt="gold" />+{inc.gold}</span>
        <span><img src="art/icons16/icon16_xp.png" alt="XP" />+{inc.xp}</span>
      </div>

      <div className="base-rows">
        {BRANCHES.map(br => {
          const row = BUILDINGS.filter(x => x.branch === br).sort((x, y) => x.tier - y.tier);
          return (
            <div key={br} className="base-row">
              {[0, 1, 2].map(i => {
                const x = row[i];
                if (!x) return <div key={i} className="base-cell" />;
                const st = stateOf(x.id);
                const prevOwned = i > 0 && p.buildings.has(row[i - 1].id);
                return (
                  <button key={x.id} className={`base-cell${sel === x.id ? ' sel' : ''}`} onClick={() => setSel(x.id)}>
                    {i > 0 && <i className={`base-link${prevOwned ? ' on' : ''}`} />}
                    <span className="node-wrap">
                      {atlas.has(buildingIcon(x.id)) ? <img className={`node-icon ${st}`} src={`art/${buildingIcon(x.id)}.png`} alt="" /> : <span className={`node-icon node-blank ${st}`}>{nameOf(x.id)[0]}</span>}
                      {st !== 'owned' && <span className={`node-cost gold ${st}`}>{priceFor(g, hero.player, x.cost)}</span>}
                    </span>
                    <span className={`base-name ${st}`}>{nameOf(x.id)}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>


      {b && (
        <div className="window detail">
          <div className="detail-head">
            {atlas.has(buildingIcon(b.id)) ? <img className="detail-icon" src={`art/${buildingIcon(b.id)}.png`} alt="" /> : <span className="detail-icon node-blank">{nameOf(b.id)[0]}</span>}
            <span className="detail-name">{nameOf(b.id)}</span>
            {b.gold > 0 && <span className="detail-gold"><img src="art/icons16/icon16_gold.png" alt="gold" />+{b.gold}</span>}
            {b.xp > 0 && <span className="detail-xp"><img src="art/icons16/icon16_xp.png" alt="XP" />+{b.xp}</span>}
          </div>
          {BUILDING_TEXT[b.id] && <span>{BUILDING_TEXT[b.id]}</span>}
          {stateOf(b.id) === 'locked' && <span className="detail-lock">Needs {nameOf(b.requires!)}.</span>}
          <div className="detail-buttons">
            <button className="detail-x" onClick={() => setSel(null)}>✕</button>
            {stateOf(b.id) === 'owned'
              ? <button className="detail-go done" disabled>BUILT</button>
              : <button className="detail-go" disabled={!canBuy || stateOf(b.id) !== 'avail'} onClick={() => { act({ t: 'build', id: b.id }); }}>
                  BUILD <img src="art/icons16/icon16_gold.png" alt="gold" />{priceFor(g, hero.player, b.cost)}
                </button>}
          </div>
        </div>
      )}
    </div>
  );
}
