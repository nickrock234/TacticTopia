// Shop (packet 006: H12, redone in handoff 006 as "Shop Panel"). One shared panel, opened from the
// Items header and from the Base. A tile per item, grouped by where it's sold:
//   Merchant (an owned merchant landmark) or, without one, the Armory (10 each): your class's second
//   weapon, a shield, boots.
//   Forge: one upgrade per owned item, shown with that item's icon; the boots upgrade picks a terrain.
// Tiles: gold price (red when short), ✓ when owned, grey when something is needed first.
// Tap a tile; the strip below shows it with BUY / price / ✓ / "[needed] FIRST". Free, no action.

import { useState } from 'react';
import type { GameState, Hero } from '@engine/state.ts';
import { ECON } from '@engine/economy.ts';
import { WEAPONS } from '@engine/numbers.ts';
import { priceFor } from '@engine/rules.ts';
import type { Action } from '@engine/match.ts';
import { itemView, SECOND } from './items.ts';

type St = 'buy' | 'short' | 'owned' | 'locked' | 'full';
interface Tile { id: string; icon: string; name: string; val: string; sub: string; price: number; st: St; need?: string; buy: () => boolean; boots?: boolean }

export function ShopPanel({ g, hero, canAct, act }: {
  g: GameState; hero: Hero; canAct: boolean; act: (a: Action) => boolean;
}) {
  const p = g.players[hero.player];
  const merchant = g.landmarks.some(l => l.owner === hero.player && g.map.landmarks[l.idx].bonus === 'merchant');
  const armory = p.buildings.has('armory'), forge = p.buildings.has('forge');
  const twoHandedClass = WEAPONS[hero.weapon].twoHanded && WEAPONS[SECOND[hero.cls]].twoHanded; // the barbarian: never a shield
  const st = (owned: boolean, need: string | null, price: number): St => owned ? 'owned' : need ? 'locked' : p.gold < price ? 'short' : 'buy';

  // ---------- merchant / Armory ----------
  const source = merchant || armory;
  const shopNeed = source ? null : 'icons/icon_landmark_merchant';
  const price = (boots: boolean) => priceFor(g, hero.player, merchant || !armory ? (boots ? ECON.items.boots : ECON.items.merchant) : ECON.items.crafted);
  const w2 = SECOND[hero.cls], v2 = itemView(w2, false), vs = itemView('shield', false), vb = itemView('boots', false);
  const bagFull = hero.inventory.length >= ECON.bagSize;
  const shop: Tile[] = [
    { id: 'w2', ...v2, price: price(false), need: shopNeed ?? undefined, buy: () => act({ t: 'buy', item: 'weapon2' }),
      st: hero.weapon === w2 ? 'owned' : shopNeed ? 'locked' : bagFull ? 'full' : st(false, null, price(false)) },
    ...(twoHandedClass ? [] : [{ id: 'sh', ...vs, price: price(false), need: shopNeed ?? undefined, buy: () => act({ t: 'buy', item: 'shield' }), st: st(hero.shield > 0, shopNeed, price(false)) }]),
    { id: 'bo', ...vb, price: price(true), need: shopNeed ?? undefined, buy: () => act({ t: 'buy', item: 'boots' }), st: st(!!hero.boots, shopNeed, price(true)) },
  ];

  // ---------- Forge: one upgrade per owned item ----------
  const up = priceFor(g, hero.player, ECON.items.blacksmithUpgrade), bootsUp = priceFor(g, hero.player, ECON.items.bootsUpgrade);
  const forgeNeed = forge ? null : 'icons/icon_building_forge';
  const wUp = itemView(hero.weapon, true), mage = hero.cls === 'mage';
  const bootsT = hero.boots && hero.boots !== 'plain' ? hero.boots : 'water';
  const forgeTiles: Tile[] = [
    { id: 'uw', icon: wUp.icon, name: wUp.name, val: '+1', sub: mage ? (hero.weapon === 'staff' ? 'MANA' : 'SPELL RANGE') : 'DMG', price: up,
      need: forgeNeed ?? undefined, st: st(hero.weaponUpgraded, forgeNeed, up), buy: () => act({ t: 'upgrade', what: 'weapon' }) },
    ...(twoHandedClass ? [] : [{ id: 'us', icon: 'icons/icon_item_shield_upgraded', name: 'Shield +', val: '2', sub: 'BLOCK', price: up,
      need: forgeNeed ?? (hero.shield === 0 ? 'icons/icon_item_shield' : undefined), st: st(hero.shield === 2, forgeNeed ?? (hero.shield === 0 ? 'shield' : null), up), buy: () => act({ t: 'upgrade', what: 'shield' }) }]),
    { id: 'ub', icon: `icons/icon_item_boots_${bootsT}`, name: 'Boots +', val: '', sub: 'WATER · MOUNTAIN · DESERT', price: bootsUp, boots: true,
      need: forgeNeed ?? (!hero.boots ? 'icons/icon_item_boots' : undefined), st: st(!!hero.boots && hero.boots !== 'plain', forgeNeed ?? (!hero.boots ? 'boots' : null), bootsUp), buy: () => false },
  ];

  const all = [...shop, ...forgeTiles];
  const [selId, setSelId] = useState<string>(() => (all.find(t => t.st === 'buy') ?? all[0]).id);
  const [bootsPick, setBootsPick] = useState(false);
  const s = all.find(t => t.id === selId) ?? all[0];
  const go = () => { if (s.boots) { setBootsPick(x => !x); return; } s.buy(); };

  const group = (name: string, icon: string, tiles: Tile[]) => (
    <div className="shop-group">
      <div className="shop-group-name"><img src={`art/${icon}.png`} alt="" />{name}</div>
      <div className="shop-tiles">
        {tiles.map(t => (
          <button key={t.id} className={`shop-tile ${t.st}${t.id === s.id ? ' sel' : ''}`} onClick={() => { setSelId(t.id); setBootsPick(false); }}>
            <img src={`art/${t.icon}.png`} alt="" />
            {t.st === 'owned' ? <span className="tile-check">✓</span>
              : <span className="tile-price"><img src="art/icons16/icon16_gold.png" alt="gold" />{t.price}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="window panel shop">
      <div className="panel-head">
        <span className="panel-title">Shop</span>
        <span className="chip gold"><img src="art/icons/icon_gold.png" alt="Gold" />{p.gold}</span>
      </div>
      {group(merchant || !armory ? 'Merchant' : 'Armory', merchant || !armory ? 'icons/icon_landmark_merchant' : 'icons/icon_building_armory', shop)}
      {group('Forge', 'icons/icon_building_forge', forgeTiles)}

      <div className="shop-strip">
        <img src={`art/${s.icon}.png`} alt="" />
        <span className="item-name">{s.name}<span className="gear-val"><b>{s.val}</b><small>{s.sub}</small></span></span>
        {s.st === 'owned' ? <span className="strip-btn owned">✓</span>
          : s.st === 'locked' ? <span className="strip-btn locked">{s.need && <img src={`art/${s.need}.png`} alt="" />}FIRST</span>
          : s.st === 'full' ? <span className="strip-btn locked">BAG FULL</span>
          : <button className={`strip-btn ${s.st}`} disabled={!canAct || s.st === 'short'} onClick={go}>
              {s.st === 'buy' && 'BUY'}<img src="art/icons16/icon16_gold.png" alt="gold" />{s.price}
            </button>}
      </div>
      {bootsPick && s.boots && hero.boots === 'plain' && (
        <div className="boots-pick">
          {(['water', 'mountain', 'desert'] as const).map(t => (
            <button key={t} className="btn-orange" disabled={!canAct || p.gold < bootsUp} onClick={() => { if (act({ t: 'upgrade', what: 'boots', terrain: t })) setBootsPick(false); }}>
              <img src={`art/icons/icon_item_boots_${t}.png`} alt="" />{t === 'water' ? 'Water' : t === 'mountain' ? 'Mountain' : 'Desert'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
