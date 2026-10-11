# Layer 1 — Combat math

Generated 2026-09-30 from `engine/numbers.ts`. Deterministic: these are exact for the current rules and numbers.

## How to read this

**Stages** are assumed skill and gear budgets (the economy simulation will map them to turn numbers later):

| Stage | XP spent | Gear | Elements available |
| --- | --- | --- | --- |
| Start | 0 | starting weapon, no shield | 1 |
| Early | 45 | starting weapon, no shield | 1 |
| Early-mid | 90 | Blacksmith +1, both weapons, shield 1 | 1 |
| Mid | 150 | Blacksmith +1, both weapons, shield 1 | 2 |
| Late | 240 | Blacksmith + Refinery (+2), shield 2+1 = 3, Monastery | 3 |
| Endgame | 390 | Blacksmith + Refinery (+2), shield 2+1 = 3, Monastery | 3 |

- **Burst** = the most damage one hero deals to one target in one turn (2 actions, at most one attack, plus free actions). For each cell the simulator tries **every** build that fits the XP budget and keeps the best one, so it is the worst case for the defender.
- **Approach** = the attacker spends one action moving, then attacks (a real dive). **In position** = already in range, so both actions go to fighting (e.g. Empower, then attack).
- **Armored** target = a defence-minded hero at that gear tier: shield (one-handed classes only), plus Stoneskin at Late/Endgame, plus Intimidate for barbarians. **Open** = no defences.
- **Bold** = one-turn KO from full HP. Target HP: Knight 22, Barbarian 16, Archer 16, Mage 15, Thief 15.
- Vengeance (barbarian below half HP) is left out of the main tables and shown in its own section below.

## Solo burst vs OPEN targets

Cells: **approach** / in position.

### Start

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| Barbarian | 7 / 7 | 7 / 7 | 7 / 7 | 7 / 7 | 7 / 7 |
| Archer | 3 / 3 | 3 / 3 | 3 / 3 | 3 / 3 | 3 / 3 |
| Mage | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| Thief | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 |

### Early

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 8 / 8 | 8 / 8 | 8 / 8 | 8 / 8 | 8 / 8 |
| Barbarian | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 |
| Archer | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| Mage | 6 / 7 | 6 / 7 | 6 / 7 | 6 / 7 | 6 / 7 |
| Thief | 7 / 7 | 7 / 7 | 7 / 7 | 7 / 7 | 7 / 7 |

### Early-mid

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 10 / 10 | 10 / 10 | 10 / 10 | 10 / 10 | 10 / 10 |
| Barbarian | 12 / 12 | 12 / 12 | 12 / 12 | 12 / 12 | 12 / 12 |
| Archer | 10 / 10 | 10 / 10 | 10 / 10 | 10 / 10 | 10 / 10 |
| Mage | 6 / 7 | 6 / 7 | 6 / 7 | 6 / 7 | 6 / 7 |
| Thief | 9 / 9 | 9 / 9 | 9 / 9 | 9 / 9 | 9 / 9 |

### Mid

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 10 / 10 | 10 / 10 | 10 / 10 | 10 / 10 | 10 / 10 |
| Barbarian | 18 / 18 | **18** / **18** | **18** / **18** | **18** / **18** | **18** / **18** |
| Archer | 14 / 14 | 14 / 14 | 14 / 14 | 14 / 14 | 14 / 14 |
| Mage | 12 / 14 | 12 / 14 | 12 / 14 | 12 / 14 | 12 / 14 |
| Thief | 18 / 18 | **18** / **18** | **18** / **18** | **18** / **18** | **18** / **18** |

### Late

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 |
| Barbarian | 20 / 20 | **20** / **20** | **20** / **20** | **20** / **20** | **20** / **20** |
| Archer | 16 / 16 | **16** / **16** | **16** / **16** | **16** / **16** | **16** / **16** |
| Mage | 14 / 16 | 14 / **16** | 14 / **16** | 14 / **16** | 14 / **16** |
| Thief | 20 / 20 | **20** / **20** | **20** / **20** | **20** / **20** | **20** / **20** |

### Endgame

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 |
| Barbarian | 20 / 20 | **20** / **20** | **20** / **20** | **20** / **20** | **20** / **20** |
| Archer | 16 / 16 | **16** / **16** | **16** / **16** | **16** / **16** | **16** / **16** |
| Mage | 14 / 16 | 14 / **16** | 14 / **16** | 14 / **16** | 14 / **16** |
| Thief | 20 / 20 | **20** / **20** | **20** / **20** | **20** / **20** | **20** / **20** |

## Solo burst vs ARMORED targets

Cells: **approach** / in position.

### Start

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| Barbarian | 7 / 7 | 7 / 7 | 7 / 7 | 7 / 7 | 7 / 7 |
| Archer | 3 / 3 | 3 / 3 | 3 / 3 | 3 / 3 | 3 / 3 |
| Mage | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| Thief | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 |

### Early

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 8 / 8 | 8 / 8 | 8 / 8 | 8 / 8 | 8 / 8 |
| Barbarian | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 |
| Archer | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| Mage | 6 / 7 | 6 / 7 | 6 / 7 | 6 / 7 | 6 / 7 |
| Thief | 7 / 7 | 7 / 7 | 7 / 7 | 7 / 7 | 7 / 7 |

### Early-mid

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 9 / 9 | 9 / 9 | 9 / 9 | 9 / 9 | 9 / 9 |
| Barbarian | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 |
| Archer | 10 / 10 | 8 / 8 | 10 / 10 | 10 / 10 | 10 / 10 |
| Mage | 6 / 7 | 5 / 6 | 6 / 7 | 6 / 7 | 6 / 7 |
| Thief | 8 / 8 | 8 / 8 | 8 / 8 | 8 / 8 | 8 / 8 |

### Mid

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 9 / 9 | 9 / 9 | 9 / 9 | 9 / 9 | 9 / 9 |
| Barbarian | 16 / 16 | **16** / **16** | **16** / **16** | **16** / **16** | **16** / **16** |
| Archer | 12 / 12 | 12 / 12 | 12 / 12 | 12 / 12 | 12 / 12 |
| Mage | 12 / 14 | 10 / 12 | 12 / 14 | 12 / 14 | 12 / 14 |
| Thief | 16 / 16 | **16** / **16** | **16** / **16** | **16** / **16** | **16** / **16** |

### Late

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 7 / 7 | 9 / 9 | 7 / 7 | 7 / 7 | 7 / 7 |
| Barbarian | 12 / 12 | **16** / **16** | 12 / 12 | 12 / 12 | 12 / 12 |
| Archer | 14 / 14 | 12 / 12 | 14 / 14 | 14 / 14 | 14 / 14 |
| Mage | 14 / 16 | 12 / 14 | 14 / **16** | 14 / **16** | 14 / **16** |
| Thief | 12 / 12 | **16** / **16** | 12 / 12 | 12 / 12 | 12 / 12 |

### Endgame

| Attacker ↓ Target → | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Knight | 7 / 7 | 9 / 9 | 7 / 7 | 7 / 7 | 7 / 7 |
| Barbarian | 12 / 12 | **16** / **16** | 12 / 12 | 12 / 12 | 12 / 12 |
| Archer | 14 / 14 | 12 / 12 | 14 / 14 | 14 / 14 | 14 / 14 |
| Mage | 14 / 16 | 12 / 14 | 14 / **16** | 14 / **16** | 14 / **16** |
| Thief | 12 / 12 | **16** / **16** | 12 / 12 | 12 / 12 | 12 / 12 |

## One-turn KOs from full HP (single hero)

| Stage | Attacker | Target | Target defences | Damage | How |
| --- | --- | --- | --- | --- | --- |
| Mid | Barbarian | Barbarian (16) | open | 18 | move → Double strike (greataxe) → [flaming] |
| Mid | Barbarian | Archer (16) | open | 18 | move → Double strike (greataxe) → [flaming] |
| Mid | Barbarian | Mage (15) | open | 18 | move → Double strike (greataxe) → [flaming] |
| Mid | Barbarian | Thief (15) | open | 18 | move → Double strike (greataxe) → [flaming] |
| Mid | Thief | Barbarian (16) | open | 18 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Mid | Thief | Archer (16) | open | 18 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Mid | Thief | Mage (15) | open | 18 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Mid | Thief | Thief (15) | open | 18 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Late | Barbarian | Barbarian (16) | open | 20 | move → Double strike (greataxe) → [flaming] |
| Late | Barbarian | Archer (16) | open | 20 | move → Double strike (greataxe) → [flaming] |
| Late | Barbarian | Mage (15) | open | 20 | move → Double strike (greataxe) → [flaming] |
| Late | Barbarian | Thief (15) | open | 20 | move → Double strike (greataxe) → [flaming] |
| Late | Archer | Barbarian (16) | open | 16 | Hunter's mark → move → weapon attack (crossbow) → [flaming] |
| Late | Archer | Archer (16) | open | 16 | Hunter's mark → move → weapon attack (crossbow) → [flaming] |
| Late | Archer | Mage (15) | open | 16 | Hunter's mark → move → weapon attack (crossbow) → [flaming] |
| Late | Archer | Thief (15) | open | 16 | Hunter's mark → move → weapon attack (crossbow) → [flaming] |
| Late | Mage | Barbarian (16) | open | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Late | Mage | Archer (16) | open | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Late | Mage | Mage (15) | open | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Late | Mage | Thief (15) | open | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Late | Thief | Barbarian (16) | open | 20 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Late | Thief | Archer (16) | open | 20 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Late | Thief | Mage (15) | open | 20 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Late | Thief | Thief (15) | open | 20 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Endgame | Barbarian | Barbarian (16) | open | 20 | move → Double strike (greataxe) → [flaming] |
| Endgame | Barbarian | Archer (16) | open | 20 | move → Double strike (greataxe) → [flaming] |
| Endgame | Barbarian | Mage (15) | open | 20 | move → Double strike (greataxe) → [flaming] |
| Endgame | Barbarian | Thief (15) | open | 20 | move → Double strike (greataxe) → [flaming] |
| Endgame | Archer | Barbarian (16) | open | 16 | Hunter's mark → move → weapon attack (crossbow) → [flaming] |
| Endgame | Archer | Archer (16) | open | 16 | Hunter's mark → move → weapon attack (crossbow) → [flaming] |
| Endgame | Archer | Mage (15) | open | 16 | Hunter's mark → move → weapon attack (crossbow) → [flaming] |
| Endgame | Archer | Thief (15) | open | 16 | Hunter's mark → move → weapon attack (crossbow) → [flaming] |
| Endgame | Mage | Barbarian (16) | open | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Endgame | Mage | Archer (16) | open | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Endgame | Mage | Mage (15) | open | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Endgame | Mage | Thief (15) | open | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Endgame | Thief | Barbarian (16) | open | 20 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Endgame | Thief | Archer (16) | open | 20 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Endgame | Thief | Mage (15) | open | 20 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Endgame | Thief | Thief (15) | open | 20 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Mid | Barbarian | Barbarian (16) | armored | 16 | move → Double strike (greataxe) → [flaming] |
| Mid | Barbarian | Archer (16) | armored | 16 | move → Double strike (greataxe) → [flaming] |
| Mid | Barbarian | Mage (15) | armored | 16 | move → Double strike (greataxe) → [flaming] |
| Mid | Barbarian | Thief (15) | armored | 16 | move → Double strike (greataxe) → [flaming] |
| Mid | Thief | Barbarian (16) | armored | 16 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Mid | Thief | Archer (16) | armored | 16 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Mid | Thief | Mage (15) | armored | 16 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Mid | Thief | Thief (15) | armored | 16 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Late | Barbarian | Barbarian (16) | armored | 16 | move → Double strike (greataxe) → [flaming] |
| Late | Mage | Archer (16) | armored | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Late | Mage | Mage (15) | armored | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Late | Mage | Thief (15) | armored | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Late | Thief | Barbarian (16) | armored | 16 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |
| Endgame | Barbarian | Barbarian (16) | armored | 16 | move → Double strike (greataxe) → [flaming] |
| Endgame | Mage | Archer (16) | armored | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Endgame | Mage | Mage (15) | armored | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Endgame | Mage | Thief (15) | armored | 16 (in position only) | Empower self → Doublecast Mage bolt + Mage bolt (staff) → [flaming] |
| Endgame | Thief | Barbarian (16) | armored | 16 | move → attack from invisibility (dagger) → [flaming, doubleDagger] |

## Vengeance (barbarian at or below the Vengeance threshold)

Barbarian burst on the approach while Vengeance is active, vs open / armored targets.

| Stage | Knight | Barbarian | Archer | Mage | Thief |
| --- | --- | --- | --- | --- | --- |
| Mid | **24** / **22** | **24** / **22** | **24** / **22** | **24** / **22** | **24** / **22** |
| Late | **26** / 18 | **26** / **22** | **26** / **18** | **26** / **18** | **26** / **18** |
| Endgame | **26** / 18 | **26** / **22** | **26** / **18** | **26** / **18** | **26** / **18** |

## Team focus: can two heroes KO a target from full in one round?

Two teammates act back to back on one target, both **in position**. The first one's effects (Hunter's mark, Inspire, Empower on the ally, Shattering) help the second. Order is tried both ways. Cell = how many of the 15 possible attacker pairs (duplicates allowed) can KO that target from full.

### vs open targets

| Stage | Knight (22) | Barbarian (16) | Archer (16) | Mage (15) | Thief (15) |
| --- | --- | --- | --- | --- | --- |
| Start | 0/15 | 0/15 | 0/15 | 0/15 | 0/15 |
| Early | 1/15 | 6/15 | 6/15 | 8/15 | 8/15 |
| Early-mid | 3/15 | 14/15 | 14/15 | 14/15 | 14/15 |
| Mid | 14/15 | 15/15 | 15/15 | 15/15 | 15/15 |
| Late | 15/15 | 15/15 | 15/15 | 15/15 | 15/15 |
| Endgame | 15/15 | 15/15 | 15/15 | 15/15 | 15/15 |

### vs armored targets

| Stage | Knight (22) | Barbarian (16) | Archer (16) | Mage (15) | Thief (15) |
| --- | --- | --- | --- | --- | --- |
| Start | 0/15 | 0/15 | 0/15 | 0/15 | 0/15 |
| Early | 1/15 | 6/15 | 6/15 | 8/15 | 8/15 |
| Early-mid | 1/15 | 11/15 | 13/15 | 14/15 | 14/15 |
| Mid | 14/15 | 15/15 | 15/15 | 15/15 | 15/15 |
| Late | 12/15 | 15/15 | 14/15 | 15/15 | 15/15 |
| Endgame | 12/15 | 15/15 | 14/15 | 15/15 | 15/15 |

Weakest pair against each armored target (the pair with the lowest best damage):

| Stage | Target | Pairs that KO | Weakest pair (its damage) |
| --- | --- | --- | --- |
| Start | Knight | 0/15 | Archer+Archer (6) |
| Start | Barbarian | 0/15 | Archer+Archer (6) |
| Start | Archer | 0/15 | Archer+Archer (6) |
| Start | Mage | 0/15 | Archer+Archer (6) |
| Start | Thief | 0/15 | Archer+Archer (6) |
| Mid | Knight | 14/15 | Knight+Knight (19) |
| Mid | Barbarian | 15/15 | Knight+Knight (18) |
| Mid | Archer | 15/15 | Knight+Knight (19) |
| Mid | Mage | 15/15 | Knight+Knight (19) |
| Mid | Thief | 15/15 | Knight+Knight (19) |
| Endgame | Knight | 12/15 | Knight+Knight (15) |
| Endgame | Barbarian | 15/15 | Knight+Knight (19) |
| Endgame | Archer | 14/15 | Knight+Knight (15) |
| Endgame | Mage | 15/15 | Knight+Knight (15) |
| Endgame | Thief | 15/15 | Knight+Knight (15) |

## Mana over 4 turns: does it force choices?

Best total damage over 4 turns against an armored knight, starting at full mana. "Skill turns" = turns that spent mana. Two situations:

- **Standing** = in range every turn, so the second action is free (Empower, Inspire, or Rest).
- **Moving** = the second action is a move every turn (chasing, kiting, repositioning), so there is never a spare action to rest.

Compares the current rule (+1 mana per turn) with the no-regen fallback.

| Stage | Class | Max mana | Standing, +1 regen | Standing, no regen | Moving, +1 regen | Moving, no regen |
| --- | --- | --- | --- | --- | --- | --- |
| Early | Knight | 3 | 30 (3/4) | 26 (1/4) | 30 (3/4) | 26 (1/4) |
| Early | Barbarian | 3 | 41 (3/4) | 35 (1/4) | 41 (3/4) | 35 (1/4) |
| Early | Archer | 3 | 16 (2/4) | 16 (0/4) | 16 (2/4) | 16 (0/4) |
| Early | Mage | 8 | 26 (4/4) | 24 (4/4) | 24 (4/4) | 24 (4/4) |
| Early | Thief | 4 | 20 (0/4) | 20 (0/4) | 20 (0/4) | 20 (0/4) |
| Mid | Knight | 3 | 30 (3/4) | 26 (1/4) | 33 (3/4) | 27 (1/4) |
| Mid | Barbarian | 3 | 56 (3/4) | 40 (1/4) | 56 (3/4) | 40 (1/4) |
| Mid | Archer | 3 | 22 (2/4) | 20 (1/4) | 22 (2/4) | 20 (1/4) |
| Mid | Mage | 9 | 42 (3/4) | 42 (3/4) | 42 (4/4) | 38 (3/4) |
| Mid | Thief | 4 | 20 (0/4) | 20 (0/4) | 20 (0/4) | 20 (0/4) |
| Late | Knight | 3 | 22 (3/4) | 19 (1/4) | 25 (3/4) | 19 (1/4) |
| Late | Barbarian | 3 | 42 (3/4) | 30 (1/4) | 42 (3/4) | 30 (1/4) |
| Late | Archer | 3 | 26 (2/4) | 24 (1/4) | 26 (2/4) | 24 (1/4) |
| Late | Mage | 9 | 49 (4/4) | 48 (3/4) | 49 (4/4) | 43 (3/4) |
| Late | Thief | 4 | 18 (2/4) | 15 (1/4) | 18 (2/4) | 15 (1/4) |

Best 4-turn sequences while moving:

| Stage | Class | +1 regen | No regen |
| --- | --- | --- | --- |
| Early | Knight | Holy strike → [flaming] ; weapon attack → [flaming] ; Holy strike → [flaming] ; Holy strike → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; Holy strike → [flaming] |
| Early | Barbarian | Heavy strike → [flaming] ; weapon attack → [flaming] ; Heavy strike → [flaming] ; Heavy strike → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; Heavy strike → [flaming] |
| Early | Archer | Quake (adjacent) ; weapon attack ; weapon attack ; Quake (adjacent) | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] |
| Early | Mage | Mage bolt → [flaming] ; Mage bolt → [flaming] ; Mage bolt → [flaming] ; Mage bolt → [flaming] | Mage bolt → [flaming] ; Mage bolt → [flaming] ; Mage bolt → [flaming] ; Mage bolt → [flaming] |
| Early | Thief | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] |
| Mid | Knight | Charge (3 tiles) → [flaming] ; weapon attack → [flaming] ; Charge (3 tiles) → [flaming] ; Charge (3 tiles) → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; Charge (3 tiles) → [flaming] |
| Mid | Barbarian | Double strike → [flaming] ; weapon attack → [flaming] ; Double strike → [flaming] ; Double strike → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; Double strike → [flaming] |
| Mid | Archer | Hunter's mark → move → weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; Hunter's mark → move → weapon attack → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; Hunter's mark → move → weapon attack → [flaming] ; weapon attack → [flaming] |
| Mid | Mage | Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) | weapon attack → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| Mid | Thief | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] |
| Late | Knight | Charge (3 tiles) → [flaming] ; weapon attack → [flaming] ; Charge (3 tiles) → [flaming] ; Charge (3 tiles) → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; Charge (3 tiles) → [flaming] |
| Late | Barbarian | Double strike → [flaming] ; weapon attack → [flaming] ; Double strike → [flaming] ; Double strike → [flaming] | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; Double strike → [flaming] |
| Late | Archer | Hunter's mark → move → weapon attack → [flaming, armorPierce] ; weapon attack → [flaming, armorPierce] ; weapon attack → [flaming, armorPierce] ; Hunter's mark → move → weapon attack → [flaming, armorPierce] | weapon attack → [flaming, armorPierce] ; weapon attack → [flaming, armorPierce] ; Hunter's mark → move → weapon attack → [flaming, armorPierce] ; weapon attack → [flaming, armorPierce] |
| Late | Mage | Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) | weapon attack ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| Late | Thief | weapon attack → [flaming] ; Quake (adjacent) ; weapon attack → [flaming] ; Quake (adjacent) | weapon attack → [flaming] ; weapon attack → [flaming] ; weapon attack → [flaming] ; Quake (adjacent) |
