// The first screen (Design's "Lobby Phone", games variant): your name, the online games this phone
// holds (whose turn it is in each), New game (title + 2v2 / 3v3 / 4v4), and a local game against bots.
// Join: what an invite link (?g=<id>) opens on a phone that isn't in that game yet.

import { useEffect, useState, type JSX } from 'react';
import type { Online } from '../net/online.ts';
import type { GameSummary } from '../../../server/src/protocol.ts';

/** The player's name, saved on the phone as it's typed. */
function useName(online: Online): [string, JSX.Element] {
  const [name, setName] = useState(online.name);
  return [name.trim(), (
    <label className="field">
      <span>Name</span>
      <input value={name} maxLength={16} placeholder="Your name" onChange={e => { setName(e.target.value); online.name = e.target.value; }} />
    </label>
  )];
}

function status(gm: GameSummary): [string, string] {
  if (!gm.started) return ['Lobby', ''];
  if (gm.over) return gm.winner === null ? ['Over', 'done'] : gm.winner === gm.team ? ['Won', 'won'] : ['Lost', 'done'];
  if (gm.turn === gm.you) return ['Your turn', 'up'];
  return [gm.turnName ? `${gm.turnName}'s turn` : 'Waiting', ''];
}

function Connection({ online }: { online: Online }) {
  if (online.status === 'open') return null;
  return <div className="menu-note">{online.status === 'connecting' ? 'Connecting…' : 'Server offline, retrying…'}</div>;
}

export function Home({ online, onBots }: { online: Online; onBots: (perTeam: number, big: boolean) => void }) {
  const [creating, setCreating] = useState(false);
  const [big, setBig] = useState(false); // vs bots only: a 80x80 4v4 with everything twice as far apart
  const [botting, setBotting] = useState(false); // choosing a team size for a game against bots
  const [perTeam, setPerTeam] = useState(2);
  const [title, setTitle] = useState('');
  // the list, now and every 15 s while this screen is up (whose turn it is changes)
  useEffect(() => { online.refresh(); const t = setInterval(() => online.refresh(), 15000); return () => clearInterval(t); }, [online]);
  const [named, nameField] = useName(online);

  return (
    <div className="menu">
      <div className="menu-head"><span className="menu-title">Tactic-Topia</span></div>
      {nameField}
      <Connection online={online} />
      {online.error && <div className="menu-note bad">{online.error}</div>}

      <div className="game-list">
        {(online.games ?? []).map(gm => {
          const [text, cls] = status(gm);
          return (
            <button key={gm.gameId} className={`window game-card ${cls}`} onClick={() => online.open(gm.gameId)}>
              <span className="gc-title">{gm.title}</span>
              <span className={`gc-status ${cls}`}>{text}</span>
              <small>{gm.perTeam}v{gm.perTeam}{gm.started ? ` · T${gm.round}` : ''}</small>
            </button>
          );
        })}
      </div>

      {creating ? (
        <div className="window new-game">
          <label className="field"><span>Game</span><input value={title} maxLength={24} placeholder="Friday night" onChange={e => setTitle(e.target.value)} /></label>
          <div className="seg">
            {[2, 3, 4].map(n => <button key={n} className={perTeam === n ? 'on' : ''} onClick={() => setPerTeam(n)}>{n}v{n}</button>)}
          </div>
          <div className="menu-row">
            <button className="menu-btn alt" onClick={() => setCreating(false)}>Cancel</button>
            <button className="menu-btn" disabled={!named} onClick={() => online.create(perTeam, title)}>Create</button>
          </div>
        </div>
      ) : (
        <button className="menu-btn" disabled={!named} onClick={() => { setCreating(true); setBotting(false); }}>New game</button>
      )}
      {botting ? (
        <div className="window new-game">
          <div className="seg">
            {[2, 3, 4].map(n => <button key={n} className={!big && perTeam === n ? 'on' : ''} onClick={() => { setPerTeam(n); setBig(false); }}>{n}v{n}</button>)}
            <button className={big ? 'on' : ''} onClick={() => { setPerTeam(4); setBig(true); }}>4v4 BIG</button>
          </div>
          <div className="menu-row">
            <button className="menu-btn alt" onClick={() => setBotting(false)}>Cancel</button>
            <button className="menu-btn" onClick={() => onBots(perTeam, big)}>Start</button>
          </div>
        </div>
      ) : (
        <button className="menu-btn alt" onClick={() => { setBotting(true); setCreating(false); }}>Vs bots</button>
      )}
    </div>
  );
}

export function Join({ online, gameId, onHome }: { online: Online; gameId: string; onHome: () => void }) {
  const [named, nameField] = useName(online);
  return (
    <div className="menu">
      <div className="menu-head">
        <button className="back" onClick={onHome}>‹</button>
        <span className="menu-title">Join game</span>
      </div>
      {nameField}
      <Connection online={online} />
      {online.error && <div className="menu-note bad">{online.error}</div>}
      <button className="menu-btn" disabled={!named} onClick={() => online.open(gameId)}>Join</button>
    </div>
  );
}
