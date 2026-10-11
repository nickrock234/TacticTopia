# Packet 002: heroes (return notes)

All sheets are 32×40, feet anchor (16,36), SE and NE only (mirror in code for SW/NW), red team only. Durations and events are in each JSON.

## Naming
`<class>_[<weapon2>_]<anim>_<se|ne>_red.png`. Weapon 1 has no weapon tag.
- knight: sword (001) · `knight_flail_*`
- barbarian: greataxe · `barbarian_spear_*`
- archer: bow · `archer_crossbow_*`
- mage: staff · `mage_orb_*`
- thief: dagger · `thief_knives_*`

## New event keys
- `hit`: melee damage frame (as in 001).
- `release`: spawn a projectile. The attack JSON names it in `projectile`. The crossbow has two release frames, `[2,3]`.
- `spawnVfx`: as in 001.

## Class-specific
- **Barbarian spear** attacks come in tile pieces: `_r1_` (adjacent target) and `_r2_` (2 tiles). See `REACH.md`.
- **Barbarian Vengeance:** `barbarian_vengeance_aura_<se|ne>`, a 6-frame loop drawn under the hero.
- **Knight flail** attack: hit on frame 3 damages all adjacent enemies.
- **Shields** (archer, mage, thief): every sheet has a `_shield` overlay. Draw it only once the shield is bought. The `layer` field says behind or over.
- **Thief invisible:** `thief_[knives_]invisible_<idle|walk>_*` are semi-transparent PNGs. Only his own team should see them.
- **Projectiles:** `archer_arrow`, `archer_bolt`, `mage_bolt`, `mage_orb_bolt` (per facing), and `thief_knife` (spins, any facing). The anchor is the tip.

## Portraits
`portraits/portrait_<class>.png`: 3 frames of 32×32 (normal, hurt, defeated), transparent background.
