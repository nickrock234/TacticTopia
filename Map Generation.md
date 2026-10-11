# Map Generation — DRAFT

Status: **draft for Nick's review, 2026-09-29.** Implemented in `engine/mapgen.ts` (2026-09-30). **Map sizes (Nick, 2026-10-01): 2v2 28×28, 3v3 36×36, 4v4 42×42** (were 24 / 32 / 36; grown with the +1 movement). "Each element within 8 tiles" loosened to 10, because 8 couldn't be satisfied. Values marked *(guess)* are starting points for the map simulation. Nothing here is confirmed yet.

## What a map should feel like

- Mostly open plains. Terrain comes as **thin features**: rivers and small lakes (water), mountain ridges (earth) and strips of glowing-hot desert (fire). They cross small parts of the map, create detours and chokepoints, and never wall anything off.
- Each element landmark sits **at the edge** of its feature. Its 3×3 territory includes 1–3 feature tiles, e.g. one corner touching a river. Everything else in the territory is walkable.
- Every team has a fair start, but the two halves of the map don't look alike.

## The pipeline

The generator runs these steps in order. If the finished map fails validation (step 6), it discards it and tries again.

### 1. Home bases

Every player has their own base, in team games and free-for-all alike.

- **Teams:** each team holds one edge of the map (edges chosen at random). Its bases are spread evenly along the whole back row, all 2 tiles in from the edge, 3 tiles from the corners; the two teams mirror each other (Nick, 2026-10-03; was clustered, teammates 6–8 apart).
- **Free-for-all:** bases spread evenly across the map, with every player's nearest rival about the same distance away.
- Nearest enemy base ≥ *X* tiles away. *X* is the main output of the map simulation; the doc's 16 is probably too short.
- Nothing but plains within 2 tiles of a base.
- **Regions:** each base owns the tiles closer to it than to any other base. The later steps and the fairness check work per region, which is why one generator handles teams and FFA.

### 2. Terrain features

Features are placed in pairs, so each one can hold **two** landmarks, one at each end. This halves the terrain needed.

| Feature | Element | Shape | Length *(guess)* |
| --- | --- | --- | --- |
| River | Water | 1-wide meandering line; may end in a lake (2×2 to 3×3 blob) | 7–12 tiles |
| Ridge | Earth | 1-wide line, occasionally 2-wide for a tile or two | 6–10 tiles |
| Hot desert | Fire | Irregular strip 2 wide | 5–8 tiles long |

- **How many:** (number of players ÷ 2) of each type, rounded up. 2v2 → 2 rivers, 2 ridges, 2 deserts.
- **Gaps:** a line longer than 6 tiles gets a 1-tile walkable gap (a ford or pass) so heroes without boots don't face long detours. *(guess)*
- **Keep-outs:** features stay ≥ 3 tiles from any base and don't touch each other.
- **Overall share:** impassable terrain ≈ **10–18%** of the map. This replaces the doc's 40%, which assumed large terrain regions.

### 3. Landmarks

Per player: one landmark of each base element (3), plus half a standalone bonus landmark (1 mine + 1 fountain per 2 players). In 2v2 that's 14 landmarks, down from the doc's 16, and merchants and lairs ride on element landmarks instead.

- **Element landmarks:** placed so their 3×3 territory overlaps 1–3 tiles of a matching feature, has its center on a walkable tile, and keeps ≥ 6 walkable tiles.
- **Merchants and lairs (Nick, 2026-09-29): 1 merchant and 1 lair per player** (4 of each in 2v2). Most sit on element landmarks as **combined landmarks** (about two-thirds of element landmarks carry one), so they add no territory. They can be near home or contested; each player's region gets about the same share, enforced by the fairness check. Starting value, to be lowered if gear arrives too early in simulation.
- **Standalone bonus landmarks:** gold mines and mana fountains only, one of each per 2 players *(guess)*. They never combine with an element landmark: they feed the economy every turn, and doubling one up would snowball.
- **Spacing:** territories never overlap and stay ≥ 1 tile apart.
- **Nearby elements:** every base has at least one landmark of each element within about 8 walking tiles *(guess)*. Teammates' bases may share one. Nobody has to cross the map to unlock an element.
- **Contested landmarks:** all remaining landmarks (extra element landmarks, bonus landmarks and combos) go on the ground between rival regions.

### 4. Roads

A road appears instantly when a landmark is claimed, along the shortest route **over plains** to the claimer's base (Nick, 2026-09-29).

- Roads never cross water, mountains or desert. Crossing those always needs the matching boots.
- Nothing can be built on a road.
- Road movement bonus: only once the road's owner has built **Stables**; then the owner and their allies get +1 movement when starting a turn on any of that owner's roads. Enemies never get it. (Nick, 2026-09-29)
- If the landmark is captured, the old road disappears and a new one is built to the new owner's base. (Nick, 2026-09-29)

### 5. NPC camps

| Camp | Count | Where |
| --- | --- | --- |
| Weak (turn-one) | 1 per player | Exactly 3 tiles from that player's base (the doc said 4; moved to 3 after the movement cut so the knight can reach it on turn 1 — Nick, 2026-09-30) |
| Weak | 1 per player | 5–8 tiles from that player's base |
| Medium | 1 per player | 8–12 tiles out, toward the midfield |
| Lair boss | 1 per player (one per lair landmark) | At its lair landmark, which follows the landmark rules above |

Camps don't sit inside landmark territories.

### 6. Validation

A map is rejected and regenerated if any of these fail:

- **Connectivity:** every base, landmark and camp is reachable on foot (no boots needed).
- **Fairness:** for each team, add up the walking distances from each base to its nearest landmark of each element and its nearest camps. The two teams' totals must be within **±10%**. *(guess)*
- **Distances:** the base and camp distance rules above hold.
- **Terrain share** is within the target range.

## Why not a mirrored map?

Mirroring (the enemy half is the rotated copy of yours) guarantees fairness. But with fog of war it **leaks information**: once you've scouted your own half, you know exactly where the enemy's landmarks and camps are. Polytopia doesn't mirror for this reason. Generating each half separately and then checking fairness (step 6) keeps scouting meaningful.

## Open questions for Nick

None. Everything here is waiting on the map simulation.
