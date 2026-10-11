// The lobby (Design's "Lobby Phone", new-game + hero-pick variants): both teams' seats, Invite (the
// share sheet, or copy the link), your hero (class, then one of its two archetypes), and Start for the
// host. Tapping an open seat moves you there. Seats still open at the start are played by bots.

import { useState } from 'react';
import { ARCHETYPES, ARCH } from '@sim/bots.ts';
import type { Atlas } from '../art/sprites.ts';
import { inviteLink, type Lobby as LobbyMsg, type Online } from '../net/online.ts';
import { Portrait } from './Portrait.tsx';

const CLASSES = ['knight', 'barbarian', 'archer', 'mage', 'thief'] as const;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function Lobby({ online, lobby, atlas }: { online: Online; lobby: LobbyMsg; atlas: Atlas | null }) {
  const mine = lobby.seats[lobby.you];
  const myTeam = mine.team;
  const [cls, setCls] = useState<string | null>(mine.archetype ? ARCH[mine.archetype].cls : null);
  const [copied, setCopied] = useState(false);
  const people = lobby.seats.filter(s => !s.open).length;

  async function invite() {
    const url = inviteLink(lobby.gameId);
    try {
      if (navigator.share) await navigator.share({ title: lobby.title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    } catch { /* share sheet closed */ }
  }

  const face = (archetype: string | null, team: number, name: string | null) =>
    archetype && atlas ? <Portrait atlas={atlas} cls={ARCH[archetype].cls} team={team} state={0} /> : <span className="seat-initial">{name?.[0] ?? '?'}</span>;

  return (
    <div className="menu">
      <div className="menu-head">
        <button className="back" onClick={() => online.home()}>‹</button>
        <span className="menu-title">{lobby.title}</span>
        <span className="chip">{lobby.perTeam}v{lobby.perTeam}</span>
      </div>

      <div className="teams">
        {[0, 1].map(t => (
          <div key={t} className={`team ${t ? 'blue' : 'red'}`}>
            {lobby.seats.map((s, i) => s.team !== t ? null : s.open ? (
              <button key={i} className="seat open" onClick={() => online.pick({ seat: i })}>
                <span className="seat-initial">+</span><span className="seat-name">Bot</span>
              </button>
            ) : (
              <div key={i} className={`seat${i === lobby.you ? ' you' : ''}`}>
                <span className={`portrait ${t ? 'blue' : 'red'}`}>{face(s.archetype, t, s.name)}</span>
                <span className="seat-name">{s.name}<small>{i === lobby.hostSeat ? 'Host' : s.archetype ?? ''}</small></span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <button className="menu-btn alt" onClick={invite}>{copied ? 'Link copied' : 'Invite'}</button>

      <div className="window hero-pick">
        <div className="pick-classes">
          {CLASSES.map(c => (
            <button key={c} className={`portrait ${myTeam ? 'blue' : 'red'}${cls === c ? ' current' : ''}`} onClick={() => setCls(c)} aria-label={cap(c)}>
              {atlas ? <Portrait atlas={atlas} cls={c} team={myTeam} state={0} /> : c[0].toUpperCase()}
            </button>
          ))}
        </div>
        {cls && (
          <div className="pick-archetypes">
            {ARCHETYPES.filter(a => a.cls === cls).map(a => (
              <button key={a.id} className={`row-btn${mine.archetype === a.id ? ' on' : ''}`} onClick={() => online.pick({ archetype: a.id })}>
                {a.id}<img src={`art/icons/icon_element_${a.element}.png`} alt={a.element} />
              </button>
            ))}
          </div>
        )}
      </div>

      {online.error && <div className="menu-note bad">{online.error}</div>}
      {lobby.host
        ? <button className="menu-btn" onClick={() => online.start()}>Start {people}/{lobby.seats.length}</button>
        : <div className="menu-note">Waiting for the host</div>}
    </div>
  );
}
