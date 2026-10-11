// Landmark panel (packet 006, H15): opened by tapping a tile of a landmark's territory. Icon by type,
// owner in team colour, one row per bonus (+XP a turn, the element's skills, merchant / lair / gold
// mine / fountain), and a claim strip when someone is claiming it (in person or by Body double).
// When you own the merchant, its row opens the shop.

import type { GameState, Hero } from '@engine/state.ts';
import { ECON, NPC } from '@engine/economy.ts';
import { visibleTo } from '@engine/rules.ts';
import type { Atlas } from '../art/sprites.ts';
import { Portrait } from './Portrait.tsx';
import { cap } from './items.ts';

export function LandmarkPanel({ g, idx, viewer, atlas, onShop }: {
  g: GameState; idx: number; viewer: Hero; atlas: Atlas; onShop: () => void;
}) {
  const m = g.map.landmarks[idx], l = g.landmarks[idx];
  const type = m.bonus === 'mine' ? 'gold_mine' : m.bonus === 'fountain' ? 'mana_fountain' : m.element ?? 'fire';
  const name = m.bonus === 'mine' ? 'Gold mine' : m.bonus === 'fountain' ? 'Mana fountain' : `${cap(m.element ?? '')} landmark`;
  const ownerTeam = l.owner === null ? null : g.players[l.owner].team;
  const owner = l.owner === null ? 'Unclaimed' : l.owner === viewer.player ? 'Yours' : ownerTeam === viewer.team ? 'Your team' : 'Enemy team';
  const rows: { icon: string; text: string; tags: [string, string][]; onTap?: () => void }[] = [
    { icon: 'xp', text: 'Per turn', tags: [['xp', `+${ECON.landmarkXp}`]] },
  ];
  if (m.element) rows.push({ icon: `element_${m.element}`, text: `${cap(m.element)} skills`, tags: [] });
  if (m.bonus === 'merchant') rows.push({ icon: 'landmark_merchant', text: l.owner === viewer.player ? 'Merchant ›' : 'Merchant', tags: [], onTap: l.owner === viewer.player ? onShop : undefined });
  if (m.bonus === 'mine') rows.push({ icon: 'gold', text: 'Per turn', tags: [['gold', `+${ECON.goldMineGold}`]] });
  if (m.bonus === 'fountain') rows.push({ icon: 'mana', text: 'Mana refill at turn end', tags: [] });
  if (m.bonus === 'lair') rows.push({ icon: 'landmark_lair', text: l.bossRespawn === 0 ? 'Lair boss' : `Boss back round ${l.bossRespawn}`,
    tags: [['hp', l.bossRespawn === 0 ? `${l.bossHp}` : '—'], ['xp', `${NPC.lair.xp}`], ['gold', `${NPC.lair.gold}`]] });

  // a claim in progress, if the viewer can see it (a hidden thief's claim in person stays hidden)
  const pend = l.pending;
  const claimer = pend ? g.heroes[pend.hero] : null;
  const decoySeen = !!pend?.decoy && !!g.fog[viewer.team][pend.decoy.y * g.map.w + pend.decoy.x];
  const showClaim = !!claimer && (claimer.team === viewer.team || decoySeen || visibleTo(g, claimer, viewer.team));

  return (
    <div className={`window panel landmark-panel${ownerTeam === null ? '' : ownerTeam ? ' blue' : ' red'}`}>
      <div className="panel-head">
        <img className="lm-icon" src={`art/icons/icon_landmark_${type}.png`} alt="" />
        <span className="hero-title"><b>{name}</b><small className={`owner ${ownerTeam === null ? '' : ownerTeam === viewer.team ? 'ours' : 'theirs'}`}>{owner}</small></span>
      </div>
      {rows.map((r, i) => {
        const body = (<>
          <img src={`art/icons/icon_${r.icon}.png`} alt="" />
          <span className="lm-text">{r.text}</span>
          {r.tags.map(([ic, v]) => <span key={ic} className="lm-tag"><img src={`art/icons/icon_${ic}.png`} alt="" />{v}</span>)}
        </>);
        return r.onTap ? <button key={i} className="lm-row tap" onClick={r.onTap}>{body}</button> : <div key={i} className="lm-row">{body}</div>;
      })}
      {showClaim && claimer && (
        <div className="claim-strip">
          <span className={`portrait ${claimer.team ? 'blue' : 'red'}`}><Portrait atlas={atlas} cls={claimer.cls} team={claimer.team} state={0} /></span>
          <span className="claim-who"><b>{cap(claimer.cls)}{claimer.team === viewer.team ? '' : ' (enemy)'}</b><small>{pend!.decoy ? 'Body double, 1 HP' : 'In person'}</small></span>
          <span className="claim-when">NEXT TURN</span>
        </div>
      )}
    </div>
  );
}
