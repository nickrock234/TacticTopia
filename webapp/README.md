# Tactic-Topia web app

Phone-first React app. The rules come straight from `../engine` (the same code the simulations use), and the other heroes are played by the simulation bots (`../sim/bots.ts`).

## Run it

In PowerShell:

```
cd webapp
npm.cmd run dev
```

Vite prints two addresses. **Local** is for this PC. **Network** (e.g. `http://192.168.x.x:5174`) opens it on a phone on the same Wi-Fi.

`npm run dev` first copies the art from `docs/design/packets/*/return/sprites` into `public/art`, so new Claude Design returns show up after a restart.

## Structure

```
src/
  art/sprites.ts      loads sprite sheets + their JSON, team-colour swap, frame timing
  map/iso.ts          isometric maths (tile ↔ screen)
  map/renderer.ts     draws terrain, objects, heroes, fog, highlights, hit effects
  map/MapCanvas.tsx   the canvas: whole-pixel zoom steps, drag to pan, pinch/wheel zoom, tap a tile
  game/session.ts     a local game: you are hero 0, bots play the rest, bot turns play out visibly
  App.tsx             HUD, collapsible action bar, tap-to-select / tap-again-to-confirm
  styles.css          the UI kit from the style guide
```

## Current state (milestone 1: local play against bots)

Try another hero with `?hero=Sniper` (any archetype name from `Archetypes.md`) on the URL.

Works: a generated 2v2 map with fog, terrain, landmarks and flags, camps, bases, roads and territory. Move, attack, attack skills, self spells, rest and end turn. Bots take their turns one at a time. Hit and heal numbers, game over.

**Placeholders until the art arrives:** non-fire landmarks are coloured plinths, the medium monster is a Mushling with a crown, and the lair boss is a double-size Mushling.

**Temporary:** your hero buys skills and buildings automatically at the start of your turn, using its archetype's plan (`Crusader`). The skill tree and base screens replace this later. Targeted spells (Mage bolt, Fireball…) and items aren't in the menu yet.
