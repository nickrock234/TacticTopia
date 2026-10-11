# Multi-tile attacks (reach + projectiles)

## Tiled pieces (spear, and anything that physically spans tiles)
- An attack that reaches N tiles ships as N+1 sheets: `_p0` (the hero's tile) … `_pN` (the tile N steps along the facing).
- All pieces are 32×40 with anchor (16,36) and share the same frame count, durations and `events`.
- Draw piece i at the hero anchor + `pixelOffset` (SE: +16i,+8i; NE: +16i,−8i; negate x for SW/NW), depth-sorted with **that** tile, so occlusion is correct.
- Every pixel is in exactly one piece, so the pieces never overlap.
- Barbarian spear: `barbarian_spear_attack_r1_*` (adjacent target) and `_r2_*` (two tiles). Use r1 or r2 depending on the target's distance.

## Shield overlays (Archer, and later Mage and Thief)
- Every sheet `X` has a matching `X_shield` with the same frames. The base sheet is the no-shield hero. Once a shield is bought, draw the overlay too: behind the hero for SE/SW, over the hero for NE/NW (see `layer` in its JSON).

## Arrows, bolts, throwing knives
- The hero sheet holds only the draw/release. The projectile is its own small sprite (one per facing) that the renderer moves tile to tile from `events.release` to impact.
- This covers any range (Archer 4, Crossbow 3, Knives 2) without a sheet per distance. The same tiled-piece method is available if a fixed, hand-timed flight is ever wanted.
