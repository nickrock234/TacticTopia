// Hero details (packet 006, H9). Your hero: HP, mana, move, sight; gear with its numbers; statuses
// with turns left; learned skills as icons (tap for the name); SKILL TREE. An enemy shows what you can
// see: mana and skills stay hidden (agreed 2026-10-01). An ally shows everything but the tree button.

import { useState } from 'react';
import type { GameState, Hero } from '@engine/state.ts';
import { maxHp, maxManaOf } from '@engine/state.ts';
import { HERO_STATS } from '@engine/numbers.ts';
import { SKILL_NODES } from '@engine/skills.ts';
import type { Atlas } from '../art/sprites.ts';
import { Portrait } from './Portrait.tsx';
import { skillIcon } from './info.ts';
import { equipped, cap } from './items.ts';

export const STATUS: Record<string, [string, string]> = {
  empower: ['empower', 'Empowered'], inspire: ['inspire', 'Inspired'], marked: ['marked', 'Marked'], huntBoost: ['hunt_boost', 'Hunting'],
  shattered: ['shattered', 'Shattered'], chill: ['chilled', 'Chilled'], pinned: ['pinned', 'Pinned'], paralysis: ['paralysis', 'Paralysed'],
  poison: ['poison', 'Poisoned'], iceBlock: ['ice_block', 'Ice block'], fortify: ['fortify', 'Fortified'], ward: ['ward', 'Ward'], invisible: ['invisible', 'Invisible'],
};

export function HeroPanel({ g, hero, viewer, atlas, onTree }: {
  g: GameState; hero: Hero; viewer: Hero; atlas: Atlas; onTree: () => void;
}) {
  const [skillName, setSkillName] = useState<string | null>(null);
  const own = hero.id === viewer.id, ally = !own && hero.team === viewer.team, foe = hero.team !== viewer.team;
  const gear = equipped(g, hero);
  const move = HERO_STATS[hero.cls].move + (hero.boots ? 1 : 0);
  const skills = [...hero.skills].filter(s => SKILL_NODES[s]);
  return (
    <div className="window panel hero-panel">
      <div className="panel-head">
        <span className={`portrait big ${hero.team ? 'blue' : 'red'}`}><Portrait atlas={atlas} cls={hero.cls} team={hero.team} state={!hero.pos ? 2 : hero.hp <= maxHp(g, hero) / 2 ? 1 : 0} /></span>
        <span className="hero-title"><b>{cap(hero.cls)}</b>
          <small><img src={`art/icons/icon_element_${hero.element}.png`} alt="" />{own ? 'You' : ally ? 'Ally' : 'Enemy'}</small></span>
      </div>
      <div className="hero-stats">
        <span><img src="art/icons/icon_hp.png" alt="HP" /><b>{hero.hp}</b><small>/{maxHp(g, hero)}</small></span>
        <span><img src="art/icons/icon_mana.png" alt="Mana" /><b>{foe ? '?' : hero.mana}</b>{!foe && <small>/{maxManaOf(g, hero)}</small>}</span>
        <span><small>MOVE</small><b>{move}</b></span>
        <span><small>SIGHT</small><b>{HERO_STATS[hero.cls].vision}</b></span>
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
      {hero.statuses.length > 0 && (
        <div className="hero-statuses">
          {hero.statuses.filter(s => STATUS[s.kind] && !(foe && s.kind === 'invisible')).map((s, i) => (
            <span key={i} className="status-chip"><img src={`art/icons16/icon16_status_${STATUS[s.kind][0]}.png`} alt="" />{STATUS[s.kind][1]}<b>{s.turns < 99 ? s.turns : ''}</b></span>
          ))}
        </div>
      )}
      {!foe && (
        <div className="hero-skills">
          {skills.map(s => (
            <button key={s} className="skill-chip" onClick={() => setSkillName(n => n === SKILL_NODES[s].name ? null : SKILL_NODES[s].name)}>
              {atlas.has(skillIcon(s)) ? <img src={`art/${skillIcon(s)}.png`} alt={SKILL_NODES[s].name} /> : <span>{SKILL_NODES[s].name[0]}</span>}
            </button>
          ))}
          <span className="skill-name">{skillName ?? ''}</span>
          {own && <button className="btn-orange tree-btn" onClick={onTree}>SKILL TREE</button>}
        </div>
      )}
    </div>
  );
}
