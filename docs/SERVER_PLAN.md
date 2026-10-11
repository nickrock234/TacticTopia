# Online play — plan (2026-10-02)

Nick's calls (2026-10-02): **the server hides fog** (each team only receives what it can see), **no
turn timer** (a game waits for its player), **bots fill empty seats**, **invite link + name** (no
accounts). Mechanics are all in the app first (done, `2bed2b6`).

## Shape

- **One action list** (`engine/match.ts`): every move, attack, cast, purchase, end turn is an
  `Action`. `applyAction(match, heroId, action)` checks it's that hero's turn and applies it with the
  rules engine. `Match` also runs the turn flow (round upkeep, respawn choice, next hero) and
  `stepAuto` plays bot turns. The offline app (`webapp/src/game/session.ts`) and the server both use
  it, so they can't disagree.
- **Saving** (`engine/serialize.ts`): game state ↔ JSON (Sets and fog arrays tagged).
- **Server** (`server/`, Node 24 + `ws`, Fly.io like the dice game, a volume for saves):
  - Lobby: create a game (2v2 / 3v3 / 4v4) → an invite link; friends open it, enter a name, pick a seat
    and a hero; the host starts; empty seats become bots.
  - Each player gets a secret token stored on their phone (rejoin = open the link again).
  - Actions arrive over a WebSocket, are applied with `applyAction`, then bots run until a person is
    up; the game is saved to disk after every change.
  - **Per-team views:** each team receives a copy with unseen enemies, enemy mana and bags, the other team's gold / XP /
    fog, unrevealed terrain and events it couldn't see stripped out. Enemy skills stay (damage previews need the defender's passives); the app doesn't list them.
- **App:** a remote session with the same `act()` as the local one (sends the action, draws the view
  it gets back), plus lobby screens (Design has `Lobby Phone` mock-ups).

## Phases

1. ✅ Shared actions + turn flow + saving; offline app switched over (tests: `tests/match.test.ts`).
2. ✅ Server (`server/`): hub (lobby, start, act, bots, saving), per-team views, store, WebSocket wrapper; `server/tests/hub.test.ts` (7 tests incl. a whole game and a restart); `server/tests/_smoke.mjs` checks the real server over sockets. Dockerfile + `fly.toml` written, not deployed.
3. 🟡 App online mode + lobby screens — **built, not tried on a phone, not deployed** (2026-10-02, late):
   - Server: bot turns are paced (`STEP_MS`, default 450 ms; each turn is its own message so phones
     watch them), a game loaded after a restart resumes its bots, games have a title, a `list`
     message feeds the home screen, the lobby says which seat hosts. Message types live in
     `server/src/protocol.ts` (types only, so the app imports them). 44 tests + `_smoke.mjs` OK.
   - App: `Root.tsx` picks the screen (Home → New game / invite link → Lobby → game; or Vs bots).
     `net/online.ts` (socket that reconnects, tokens in localStorage, `?g=<id>` invite links),
     `game/remote.ts` (RemoteSession: same surface as the local Session; draws the team view;
     running event list by `seq`, history not replayed; one action in flight; refusals flash as a
     banner), `ui/Home.tsx` (name, your games + whose turn, New game, Vs bots, Join),
     `ui/Lobby.tsx` (seats by team, tap an open seat to move, Invite = share sheet / copy, class →
     archetype pick, Start n/m for the host). Hidden enemies aren't shown as dead. ‹ in the HUD = Home.
   - Local test: `node server/src/index.ts` (port 8080) + the dev server; the app connects to
     ws://<same host>:8080 unless `VITE_SERVER_URL` is set at build time.
   - Next: Nick tries it on the phone(s); then deploy (Fly.io server + Netlify app, **ask first**).
4. "Your turn" notifications (web push: Android, and iPhone 16.4+ once added to the Home Screen),
   installable web app (manifest, icon).

## Open points

- ~~Teleport online~~ settled 2026-10-03: renamed **Telepuppet**; the caster's player takes the ally's action (`Match.puppet`), so nothing waits on the ally's player.
- Replays of what happened while you were away (Design has `replay` mock-ups): the event list is the
  basis; later.

## Deploying

**LIVE since 2026-10-03:** app https://tactic-topia.netlify.app · server https://tactic-topia-server.fly.dev
(Fly app `tactic-topia-server`, volume `tt_data` in dfw, shared IPv4 + IPv6 — the first deploy failed to
allocate IPs; fixed with `fly ips allocate-v4 --shared` + `fly ips allocate-v6`, no dedicated IPv4 = no /mo).
Both CLIs are logged in on Nick's PC. **Redeploy:** server `fly deploy` (project root); app `npm.cmd run build`
then `npx.cmd netlify-cli deploy --prod --dir=dist` (webapp/, already linked).

First-time steps, for reference:

Server, from `projects/tactic-topia` (one time: login, create the app and its 1 GB volume ≈ $0.15/month):
1. `fly auth login`
2. `fly apps create tactic-topia-server` (if the name is taken, pick another and put it in `fly.toml` and
   `webapp/.env.production`)
3. `fly volumes create tt_data --size 1 --region dfw`
4. `fly deploy` (also every later server update)
5. Check: `https://tactic-topia-server.fly.dev` shows "tactic-topia server ok".

Web app, from `projects/tactic-topia/webapp` (like the dice game: Netlify CLI, no git remote):
1. `npm.cmd run build` (bakes in `VITE_SERVER_URL` from `.env.production`)
2. `npx.cmd netlify-cli login`, then `npx.cmd netlify-cli deploy --prod --dir=dist` (first time: create a
   new site; the URL it prints is the one to send friends).
