// Quests (packet 006, H14): the same seven for everyone, all active from turn one. Left box:
// progress (blank for yes/no goals), a gold check when done; done rows dim. Reward on the right.

import type { GameState, Hero } from '@engine/state.ts';
import { QUESTS } from '@engine/economy.ts';

export function QuestsPanel({ g, hero }: { g: GameState; hero: Hero }) {
  const p = g.players[hero.player];
  const owned = g.landmarks.filter(l => l.owner === hero.player).length;
  const rows: { id: string; name: string; goal: string; prog: string; icon: string; reward: string }[] = [
    { id: 'explorer', name: 'Explorer', goal: 'Reach the far map edge', prog: '', icon: 'xp', reward: `${QUESTS.explorer.xp}` },
    { id: 'conqueror', name: 'Conqueror', goal: 'Own 3 landmarks at once', prog: `${Math.min(owned, 3)}/3`, icon: 'hp', reward: '+2 max' },
    { id: 'hunter', name: 'Hunter', goal: `Defeat ${QUESTS.hunter.kills} monsters`, prog: `${Math.min(p.npcKills, QUESTS.hunter.kills)}/${QUESTS.hunter.kills}`, icon: 'gold', reward: `+${QUESTS.hunter.goldPerKill} a kill` },
    { id: 'builder', name: 'Builder', goal: `Own ${QUESTS.builder.buildings} buildings`, prog: `${Math.min(p.buildings.size, QUESTS.builder.buildings)}/${QUESTS.builder.buildings}`, icon: 'xp', reward: `+${QUESTS.builder.xpPerTurn} a turn` },
    { id: 'treasurer', name: 'Treasurer', goal: `Hold ${QUESTS.treasurer.hold} gold at once`, prog: `${Math.min(p.gold, QUESTS.treasurer.hold)}/${QUESTS.treasurer.hold}`, icon: 'gold', reward: `+${QUESTS.treasurer.goldPerTurn} a turn` },
    { id: 'scholar', name: 'Scholar', goal: `Learn ${QUESTS.scholar.skills} skills`, prog: `${Math.min(p.skillsBought, QUESTS.scholar.skills)}/${QUESTS.scholar.skills}`, icon: 'xp', reward: 'Next ½' },
    { id: 'firstBlood', name: 'First blood', goal: 'Defeat an enemy hero', prog: '', icon: 'gold', reward: `${QUESTS.firstBlood.gold}` },
  ];
  return (
    <div className="window panel quests">
      <div className="panel-head">
        <span className="panel-title">Quests</span>
      </div>
      {rows.map(q => {
        const done = p.quests.has(q.id);
        return (
          <div key={q.id} className={`quest-row${done ? ' done' : ''}`}>
            <span className={`quest-prog${q.prog.length > 4 ? ' long' : ''}`}>{done ? '✓' : q.prog}</span>
            <span className="quest-text"><b>{q.name}</b><small>{q.goal}</small></span>
            <span className="quest-reward"><img src={`art/icons/icon_${q.icon}.png`} alt="" />{q.reward}</span>
          </div>
        );
      })}
    </div>
  );
}
