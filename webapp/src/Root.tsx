// Which screen is up: Home → (New game | invite link) → Lobby → the game (App), online; or a local
// game against bots. The art loads once here for every screen.
//   ?g=<id>     an invite link: straight into that game if this phone is in it, else Join
//   ?hero=Name  a local game as that archetype (testing aid, case-sensitive); ?offline=1 a local game

import { useEffect, useState, useSyncExternalStore } from 'react';
import { loadAtlas, type Atlas } from './art/sprites.ts';
import { Session } from './game/session.ts';
import { Online } from './net/online.ts';
import { ARCH } from '@sim/bots.ts';
import App from './App.tsx';
import { Home, Join } from './ui/Home.tsx';
import { Lobby } from './ui/Lobby.tsx';

const params = new URLSearchParams(location.search);
const localGame = (perTeam = 2, big = false) => { const pick = params.get('hero'); return new Session(undefined, pick && ARCH[pick] ? pick : undefined, perTeam, big); };

export default function Root() {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  useEffect(() => { loadAtlas().then(setAtlas); }, []);
  const [online] = useState(() => new Online());
  useSyncExternalStore(cb => online.subscribe(cb), () => online.version);
  const [local, setLocal] = useState<Session | null>(() => (params.has('hero') || params.has('offline') ? localGame() : null));
  const [joinId, setJoinId] = useState(() => params.get('g'));
  useEffect(() => { if (joinId && online.hasToken(joinId)) online.open(joinId); }, []);

  const loading = <div className="loading">Loading…</div>;
  if (local) return atlas ? <App key="local" session={local} atlas={atlas} onExit={() => { setLocal(null); history.replaceState(null, '', location.pathname); }} /> : loading;
  if (online.session) return atlas ? <App key={online.gameId} session={online.session} atlas={atlas} onExit={() => { setJoinId(null); online.home(); }} /> : loading;
  if (online.lobby) return <Lobby online={online} lobby={online.lobby} atlas={atlas} />;
  if (online.gameId) return loading;
  if (joinId && !online.hasToken(joinId)) return <Join online={online} gameId={joinId} onHome={() => { setJoinId(null); online.home(); }} />;
  return <Home online={online} onBots={(perTeam, big) => setLocal(localGame(perTeam, big))} />;
}
