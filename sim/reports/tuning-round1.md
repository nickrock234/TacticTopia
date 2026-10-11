# Tuning round 1

Generated 2026-09-30 from `engine/numbers.ts`, plus the variants named in each section. Stages as in `combat-matrix.md` (Start 0 XP … Endgame 260 XP).

## 1. Kiting: does range keep the archer safe?

A ranged hero tries to shoot every turn and step away; a melee hero chases. One straight line of open plains, no map edge, no teammates, 8 rounds, the ranged hero moving first from the edge of its range. Cells: **hits landed by the ranged hero – hits taken**.

**Vision matters here.** Vision radius is 3 and you can't attack what your team can't see, so a lone archer's range 4 bow effectively has range 3. The "with a spotter" table assumes a teammate can see the target.

### Alone (vision 3)

| Ranged ↓  Melee → | Knight (move 3) | Barbarian, greataxe (move 4) | Barbarian, spear (move 4) | Thief, dagger (move 5) |
| --- | --- | --- | --- | --- |
| Archer, bow (range 4) (move 4) | **8–0** | 8–7 | 8–7 | 8–7 |
| Archer, bow + Take Aim (move 4) | **8–0** | 8–7 | 8–7 | 8–7 |
| Archer, bow + Take Aim + Pinning shot (2 mana each) (move 4) | **6–0** | 8–2 | 8–2 | 8–3 |
| Archer, crossbow (range 3) (move 4) | **8–0** | 8–7 | 8–7 | 8–7 |
| Mage, bolt (range 3) (move 3) | 8–7 | 8–7 | 8–8 | 8–8 |
| Mage, bolt + Orb (range 4) (move 3) | 8–7 | 8–7 | 8–8 | 8–8 |
| Thief, throwing knives (range 2) (move 5) | **8–0** | **8–0** | 8–4 | 8–7 |

### With a spotter (full range)

| Ranged ↓  Melee → | Knight (move 3) | Barbarian, greataxe (move 4) | Barbarian, spear (move 4) | Thief, dagger (move 5) |
| --- | --- | --- | --- | --- |
| Archer, bow (range 4) (move 4) | **8–0** | 8–7 | 8–7 | 8–7 |
| Archer, bow + Take Aim (move 4) | **8–0** | 8–7 | 8–7 | 8–7 |
| Archer, bow + Take Aim + Pinning shot (2 mana each) (move 4) | **7–0** | 8–2 | 8–2 | 8–3 |
| Archer, crossbow (range 3) (move 4) | **8–0** | 8–7 | 8–7 | 8–7 |
| Mage, bolt (range 3) (move 3) | 8–7 | 8–7 | 8–8 | 8–8 |
| Mage, bolt + Orb (range 4) (move 3) | 8–7 | 8–7 | 8–7 | 8–7 |
| Thief, throwing knives (range 2) (move 5) | **8–0** | **8–0** | 8–4 | 8–7 |

### With a spotter, ranged hero has boots (+1 move)

| Ranged ↓  Melee → | Knight (move 3) | Barbarian, greataxe (move 4) | Barbarian, spear (move 4) | Thief, dagger (move 5) |
| --- | --- | --- | --- | --- |
| Archer, bow (range 4) (move 5) | **8–0** | **8–0** | 8–4 | 8–7 |
| Archer, bow + Take Aim (move 5) | **8–0** | **8–0** | 8–4 | 8–7 |
| Archer, bow + Take Aim + Pinning shot (2 mana each) (move 5) | **6–0** | **7–0** | 7–1 | 8–2 |
| Archer, crossbow (range 3) (move 5) | **8–0** | **8–0** | 8–4 | 8–7 |
| Mage, bolt (range 3) (move 4) | **8–0** | 8–7 | 8–7 | 8–7 |
| Mage, bolt + Orb (range 4) (move 4) | **8–0** | 8–7 | 8–7 | 8–7 |
| Thief, throwing knives (range 2) (move 6) | **8–0** | **8–0** | **8–0** | **8–0** |

Bold = the ranged hero is never hit.

## 2. Defense race: can fragile heroes protect themselves in time?

For each one-turn KO threat against a fragile hero (15–16 HP), the cheapest defense (in the order listed) that lets them survive a full-strength dive from full HP. The attacker is re-optimized against each defense, so this is the attacker's best answer to it. Shields need a one-handed weapon (all three fragile classes have one). "Upgraded shield" counts the Forge and the upgrade.

Defense ladder: nothing → shield (7g) → Stoneskin (10 XP) → shield + Stoneskin (7g, 10 XP) → upgraded shield (23g) → upgraded shield + Stoneskin (23g, 10 XP) → Ice block cast last turn (30 XP) → Ice block + shield (7g, 30 XP).

| Stage | Attacker | Attacker XP used | Target | Damage vs no defense | Cheapest defense that survives |
| --- | --- | --- | --- | --- | --- |
| Early-mid | Barbarian | 40 XP | Archer (16) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Early-mid | Barbarian | 40 XP | Mage (15) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Early-mid | Barbarian | 40 XP | Thief (15) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Mid | Barbarian | 40 XP | Archer (16) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Mid | Barbarian | 40 XP | Mage (15) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Mid | Barbarian | 40 XP | Thief (15) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Mid | Thief | 85 XP | Archer (16) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Mid | Thief | 85 XP | Mage (15) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Mid | Thief | 85 XP | Thief (15) | 18 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Late | Barbarian | 40 XP | Archer (16) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Late | Barbarian | 40 XP | Mage (15) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Late | Barbarian | 40 XP | Thief (15) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Late | Archer | 85 XP | Archer (16) | 16 | Stoneskin (10 XP) → takes 14 |
| Late | Archer | 85 XP | Mage (15) | 16 | Stoneskin (10 XP) → takes 14 |
| Late | Archer | 85 XP | Thief (15) | 16 | Stoneskin (10 XP) → takes 14 |
| Late | Mage | 95 XP | Archer (16) | 16 (in position only) | Ice block cast last turn (30 XP) → takes 8 |
| Late | Mage | 95 XP | Mage (15) | 16 (in position only) | Ice block cast last turn (30 XP) → takes 8 |
| Late | Mage | 95 XP | Thief (15) | 16 (in position only) | Ice block cast last turn (30 XP) → takes 8 |
| Late | Thief | 85 XP | Archer (16) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Late | Thief | 85 XP | Mage (15) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Late | Thief | 85 XP | Thief (15) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Endgame | Barbarian | 40 XP | Archer (16) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Endgame | Barbarian | 40 XP | Mage (15) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Endgame | Barbarian | 40 XP | Thief (15) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Endgame | Archer | 85 XP | Archer (16) | 16 | Stoneskin (10 XP) → takes 14 |
| Endgame | Archer | 85 XP | Mage (15) | 16 | Stoneskin (10 XP) → takes 14 |
| Endgame | Archer | 85 XP | Thief (15) | 16 | Stoneskin (10 XP) → takes 14 |
| Endgame | Mage | 95 XP | Archer (16) | 16 (in position only) | Ice block cast last turn (30 XP) → takes 8 |
| Endgame | Mage | 95 XP | Mage (15) | 16 (in position only) | Ice block cast last turn (30 XP) → takes 8 |
| Endgame | Mage | 95 XP | Thief (15) | 16 (in position only) | Ice block cast last turn (30 XP) → takes 8 |
| Endgame | Thief | 85 XP | Archer (16) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Endgame | Thief | 85 XP | Mage (15) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |
| Endgame | Thief | 85 XP | Thief (15) | 20 | shield + Stoneskin (7g, 10 XP) → takes 14 |

## 3. Mana variants

Best damage over **6 turns** (mage also over 10) against an armored knight, starting at full mana. Cells: **damage** (turns that spent mana / turns spent only resting). A rest-only turn is always allowed. In "standing" the hero is in range every turn; in "moving" the spare action is a move every turn.

| Variant | Rule |
| --- | --- |
| A | Current: mage 8, +1 regen, rest alongside an attack |
| B | Mage 6, +1 regen |
| C | Mage 7, no regen |
| D | Mage 8, +1 regen, rest only on a turn you don't attack |
| E | Mage 6, +1 regen, rest only on a non-attack turn |
| F | Mage 7, no regen, rest only on a non-attack turn |
| G | E, plus Mana surge only every 3 turns (was 2) |

### Mage at Mid (100 XP)

| Variant | Max mana (Staff / Orb) | Standing, 6 turns | Moving, 6 turns | Moving, 10 turns |
| --- | --- | --- | --- | --- |
| A | 11 / 8 | 84 (6/6, 0 rest) | 72 (6/6, 0 rest) | 108 (9/10, 1 rest) |
| B | 9 / 6 | 84 (6/6, 0 rest) | 66 (6/6, 0 rest) | 102 (9/10, 1 rest) |
| C | 10 / 7 | 82 (6/6, 0 rest) | 60 (5/6, 1 rest) | 96 (8/10, 2 rest) |
| D | 11 / 8 | 72 (6/6, 0 rest) | 72 (6/6, 0 rest) | 108 (9/10, 1 rest) |
| E | 9 / 6 | 68 (5/6, 1 rest) | 66 (6/6, 0 rest) | 102 (9/10, 1 rest) |
| F | 10 / 7 | 64 (5/6, 1 rest) | 60 (5/6, 1 rest) | 96 (8/10, 2 rest) |
| G | 9 / 6 | 68 (5/6, 1 rest) | 62 (5/6, 0 rest) | 98 (8/10, 1 rest) |

Best line while moving:

| Variant | Turn by turn |
| --- | --- |
| A | Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| B | Doublecast Mage bolt + Mage bolt → [flaming] ; Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| C | Doublecast Mage bolt + Mage bolt → [flaming] ; REST ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| D | Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| E | Doublecast Mage bolt + Mage bolt → [flaming] ; Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| F | Doublecast Mage bolt + Mage bolt → [flaming] ; REST ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| G | Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; weapon attack → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |

### Mage at Late (160 XP)

| Variant | Max mana (Staff / Orb) | Standing, 6 turns | Moving, 6 turns | Moving, 10 turns |
| --- | --- | --- | --- | --- |
| A | 11 / 8 | 96 (6/6, 0 rest) | 84 (6/6, 0 rest) | 126 (9/10, 1 rest) |
| B | 9 / 6 | 96 (6/6, 0 rest) | 77 (6/6, 0 rest) | 119 (9/10, 1 rest) |
| C | 10 / 7 | 94 (6/6, 0 rest) | 70 (5/6, 1 rest) | 112 (8/10, 2 rest) |
| D | 11 / 8 | 84 (6/6, 0 rest) | 84 (6/6, 0 rest) | 126 (9/10, 1 rest) |
| E | 9 / 6 | 78 (5/6, 1 rest) | 77 (6/6, 0 rest) | 119 (9/10, 1 rest) |
| F | 10 / 7 | 74 (5/6, 1 rest) | 70 (5/6, 1 rest) | 112 (8/10, 2 rest) |
| G | 9 / 6 | 78 (5/6, 1 rest) | 71 (5/6, 0 rest) | 113 (8/10, 1 rest) |

Best line while moving:

| Variant | Turn by turn |
| --- | --- |
| A | Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| B | Doublecast Mage bolt + Mage bolt → [flaming] ; Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| C | Doublecast Mage bolt + Mage bolt → [flaming] ; REST ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| D | Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| E | Doublecast Mage bolt + Mage bolt → [flaming] ; Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| F | Doublecast Mage bolt + Mage bolt → [flaming] ; REST ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |
| G | Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; weapon attack (+surge) ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] ; Doublecast Mage bolt + Mage bolt → [flaming] (+surge) |

### Weapon classes: does the "rest only on a non-attack turn" rule matter?

Standing still is where it bites: under the current rule a hero in range can attack and rest every turn.

| Stage | Class | Current rule (A) | Rest only on non-attack turns (D) |
| --- | --- | --- | --- |
| Early | Knight | 48 (6/6) | 44 (4/6, 0 rest) |
| Early | Barbarian | 84 (6/6) | 70 (4/6, 0 rest) |
| Early | Archer | 30 (6/6) | 24 (0/6, 0 rest) |
| Early | Thief | 30 (0/6) | 30 (0/6, 0 rest) |
| Mid | Knight | 48 (6/6) | 44 (4/6, 0 rest) |
| Mid | Barbarian | 96 (6/6) | 80 (4/6, 0 rest) |
| Mid | Archer | 36 (3/6) | 32 (2/6, 0 rest) |
| Mid | Thief | 30 (0/6) | 30 (0/6, 0 rest) |
| Late | Knight | 42 (6/6) | 32 (4/6, 0 rest) |
| Late | Barbarian | 72 (6/6) | 60 (4/6, 0 rest) |
| Late | Archer | 45 (6/6) | 38 (2/6, 0 rest) |
| Late | Thief | 36 (6/6) | 27 (3/6, 0 rest) |

### Teleport (8 mana): can the mage get locked out?

| Variant | Weapon | Max mana (Blacksmith) | Turns from empty to 8, resting every turn | Turns from empty, fighting (regen only) |
| --- | --- | --- | --- | --- |
| A | staff | 11 | 2 (Deep rest: 2) | 8 |
| A | orb | 8 | 2 (Deep rest: 2) | 8 |
| B | staff | 9 | 2 (Deep rest: 2) | 8 |
| B | orb | 6 | **never** (needs Temple +2) | — |
| C | staff | 10 | 3 (Deep rest: 2) | never |
| C | orb | 7 | **never** (needs Temple +2) | — |
| D | staff | 11 | 2 (Deep rest: 2) | 8 |
| D | orb | 8 | 2 (Deep rest: 2) | 8 |
| E | staff | 9 | 2 (Deep rest: 2) | 8 |
| E | orb | 6 | **never** (needs Temple +2) | — |
| F | staff | 10 | 3 (Deep rest: 2) | never |
| F | orb | 7 | **never** (needs Temple +2) | — |
| G | staff | 9 | 2 (Deep rest: 2) | 8 |
| G | orb | 6 | **never** (needs Temple +2) | — |

## 4. Barbarian as a glass cannon

| Variant | Barbarian HP | Vengeance | Active at or below |
| --- | --- | --- | --- |
| Current | 20 | +3 per hit | 10 HP (50%) |
| G1 | 18 | +3 per hit | 13 HP (75%) |
| G2 | 16 | +3 per hit | 12 HP (75%) |
| G3 | 16 | +2 per hit | 12 HP (75%) |
| G4 | 16 | +3 per hit | 16 HP (100%) |

### Mid (100 XP)

| Variant | Vengeance burst: open mage / armored knight | One-turn KO the barbarian (on the approach) | Duel vs Knight | Duel vs Barbarian | Duel vs Archer | Duel vs Mage | Duel vs Thief |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Current | 24 / 22 | nobody | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| G1 | 24 / 22 | nobody | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| G2 | 24 / 22 | Barbarian, Thief | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| G3 | 22 / 20 | Barbarian, Thief | 1/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| G4 | 24 / 22 | Barbarian, Thief | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |

### Late (160 XP)

| Variant | Vengeance burst: open mage / armored knight | One-turn KO the barbarian (on the approach) | Duel vs Knight | Duel vs Barbarian | Duel vs Archer | Duel vs Mage | Duel vs Thief |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Current | 26 / 18 | nobody | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| G1 | 26 / 18 | nobody | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| G2 | 26 / 18 | Barbarian, Thief | 1/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| G3 | 24 / 16 | Barbarian, Thief | 1/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| G4 | 26 / 18 | Barbarian, Thief | 1/2 | 2/2 | 2/2 | 2/2 | 2/2 |

Duels: 1v1, both armored, standing in range, each going first once; cell = duels the barbarian wins. Duels ignore movement, so the archer and mage can't kite here (section 1 shows how that goes).
