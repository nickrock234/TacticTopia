# Tactic-Topia

A mobile, turn-based team tactics game for playing with friends. Each player controls one hero in a 2v2, 3v3 or 4v4 match on a generated map with fog of war, a home-base economy, landmarks, neutral monsters and deterministic combat. Inspired by *The Battle of Polytopia* and *Final Fantasy Tactics*.

**Play it:** https://tactic-topia.netlify.app (best on a phone; open a game, share the invite link with friends, and bots fill any empty seats)

## How it works

- **Rules engine** (`engine/`): all game rules as pure TypeScript with no UI or network code. Every move, attack, spell, purchase and end-turn is an `Action` applied with `applyAction`. The same code runs in the browser, on the server and in the simulations, so they can't disagree.
- **Web app** (`webapp/`): React + Vite, phone-first. Draws the isometric map on a canvas and plays against bots offline or joins an online game.
- **Game server** (`server/`): Node + `ws` WebSocket server hosted on Fly.io. Handles lobbies (invite link + name, no accounts), applies actions, runs bot turns, and saves games to disk. **Each team only receives what it can see:** unseen enemies, fog, enemy mana and unrevealed terrain are stripped out on the server, so the client can't cheat.
- **Simulations** (`sim/`): bots and batch-game scripts used to tune combat, economy and map generation before touching the real game.
- **Design docs** (`*.md` in the root, `docs/SERVER_PLAN.md`): the game's rules, archetypes, skills, map generation and the online-play plan.

## Run it

Needs Node 24 or later (it runs the TypeScript directly, with no build step for the engine and server).

```
# Tests (engine and server)
cd server && npm install && cd ..
npm test

# Web app
cd webapp
npm install
npm run dev        # prints a Local and a Network address; the Network one opens on a phone on the same Wi-Fi

# Game server (for online play)
cd server
npm start
```

The web app talks to the server named in `webapp/.env.production` for production builds. For local development, see the notes in `webapp/README.md`.

## Tech

TypeScript throughout · React 19 · Vite · Node 24 · WebSockets (`ws`) · Netlify (web app) · Fly.io (server) · Node's built-in test runner

## About this project

Game design and rulings are mine. I built it with AI assistance (Claude Code) as a way to practice directing, reviewing and testing AI-written code on a real project with a non-trivial rules engine and a server that must hide information from clients.

Sprite art lives under `docs/design/packets/*/return/sprites`.
