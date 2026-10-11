# Layer 2 — Economy curves

Generated 2026-09-30 from `engine/economy.ts`. One player, 30 turns, no fights and no deaths (so these are upper bounds on income). The map isn't simulated yet, so what the hero does each turn is a hand-written schedule.

**Hero activity profiles:**

- **Farmer:** Hunts NPC camps near home: a kill every 2 turns (weak, weak, medium), claims a lair on turn 10 and kills its boss on turn 14, one element landmark on turn 18.
- **Balanced:** Kills on turns 1, 3 and 6, then every 3 turns; claims landmarks on turns 5 (element + merchant), 9 (element), 14 (gold mine), 20 (element). Explorer quest on turn 18.
- **Claimer:** Races for landmarks: claims on turns 3, 6 (element + merchant), 9 (gold mine), 12, 16 (element + lair); kills on turn 1, then every 6 turns. Explorer quest on turn 15.

**Build orders** (gold is spent down the list as soon as the next item is affordable):

- **XP first:** Library → Training dummy → Market → Sparring ring → Forge → Monastery → Trade tier 2 → Shrine → Stables → Armory → Arena → Trade tier 3 → Refinery → Apothecary → Territory tier 2 → Temple → Territory tier 3
- **Gold first:** Market → Forge → Trade tier 2 → Library → Training dummy → Trade tier 3 → Sparring ring → Monastery → Armory → Arena → Refinery → Shrine → Stables → Territory tier 2 → Apothecary → Temple → Territory tier 3
- **Balanced:** Training dummy → Library → Forge → Market → Sparring ring → Trade tier 2 → Monastery → Armory → Shrine → Stables → Arena → Trade tier 3 → Refinery → Territory tier 2 → Apothecary → Temple → Territory tier 3
- **Shield first:** Forge → SHIELD → Library → Training dummy → Market → Sparring ring → Trade tier 2 → Armory → Monastery → Arena → Trade tier 3 → Refinery → Shrine → Stables → Territory tier 2 → Apothecary → Temple → Territory tier 3

Assumptions marked as guesses in `engine/economy.ts`: base gold 2/turn, gold mine +3 gold/turn, Territory tier 2 = +1 gold per landmark, Library 3 XP total (not 3 + 1). Mana fountain is left out because its bonus ("reduces upgrade costs") has no number yet.

## 1. Total XP earned by turn

| Profile | Build order | T5 | T10 | T15 | T20 | T25 | T30 | Gold earned by T30 | Buildings by T30 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Farmer | XP first | 32 | 76 | 162 | 257 | 373 | 495 | 284 | 13 |
| Farmer | Gold first | 26 | 57 | 142 | 240 | 364 | 505 | 333 | 17 |
| Farmer | Balanced | 34 | 79 | 166 | 263 | 380 | 504 | 297 | 13 |
| Farmer | Shield first | 26 | 73 | 165 | 259 | 369 | 486 | 295 | 13 |
| Balanced | XP first | 27 | 85 | 164 | 281 | 412 | 554 | 291 | 13 |
| Balanced | Gold first | 21 | 65 | 144 | 262 | 398 | 557 | 341 | 17 |
| Balanced | Balanced | 29 | 88 | 171 | 289 | 421 | 563 | 296 | 13 |
| Balanced | Shield first | 21 | 76 | 159 | 277 | 403 | 541 | 305 | 14 |
| Claimer | XP first | 24 | 83 | 185 | 301 | 439 | 578 | 257 | 12 |
| Claimer | Gold first | 23 | 68 | 168 | 286 | 426 | 584 | 319 | 16 |
| Claimer | Balanced | 25 | 83 | 189 | 304 | 441 | 580 | 258 | 12 |
| Claimer | Shield first | 22 | 71 | 178 | 297 | 431 | 567 | 286 | 13 |

## 2. When do the combat stages arrive?

Turn on which total XP earned first reaches each combat-stage budget from `combat-matrix.md`. 120 XP = a barbarian with Double strike + Flaming weapon, or a thief with Double dagger + Flaming weapon: the first one-shot threats to fragile heroes. The design doc pacing target (its "two elements, a hybrid, the first two nodes of both lines and a capstone" build around turns 20–24) is the 390 XP Endgame budget at current costs.

| Profile | Build order | 45 (Early) | 90 (Early-mid) | 120 (dive threat) | 150 (Mid) | 240 (Late) | 390 (Endgame) | 450 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Farmer | XP first | 7 | 11 | 13 | 15 | 20 | 26 | 29 |
| Farmer | Gold first | 9 | 13 | 14 | 16 | 20 | 27 | 29 |
| Farmer | Balanced | 7 | 11 | 13 | 15 | 19 | 26 | 28 |
| Farmer | Shield first | 8 | 11 | 13 | 15 | 19 | 27 | 29 |
| Balanced | XP first | 7 | 11 | 13 | 15 | 18 | 25 | 27 |
| Balanced | Gold first | 8 | 12 | 14 | 16 | 19 | 25 | 27 |
| Balanced | Balanced | 7 | 11 | 13 | 14 | 18 | 24 | 27 |
| Balanced | Shield first | 8 | 12 | 13 | 15 | 19 | 25 | 27 |
| Claimer | XP first | 7 | 11 | 13 | 14 | 18 | 24 | 26 |
| Claimer | Gold first | 8 | 12 | 14 | 15 | 19 | 24 | 26 |
| Claimer | Balanced | 7 | 11 | 13 | 14 | 18 | 24 | 26 |
| Claimer | Shield first | 8 | 12 | 13 | 15 | 18 | 24 | 26 |

## 3. Defense race in turns

A fragile hero on the **Shield first** build order, with Stoneskin as their first skill (15 XP), against a diver on the same activity profile with the **XP first** order (the fastest way to 120 XP). "Protected" = has a shield and Stoneskin. The shield comes from a merchant landmark (7 gold) if the profile has claimed one, else it is crafted at the Armory (10 gold).

| Profile | Diver reaches 120 XP | Fragile hero has a shield | Has Stoneskin (15 XP) | Protected by turn | Margin |
| --- | --- | --- | --- | --- | --- |
| Farmer | 13 | 15 | 4 | 15 | -2 turns ahead |
| Balanced | 13 | 5 | 4 | 5 | 8 turns ahead |
| Claimer | 13 | 6 | 4 | 6 | 7 turns ahead |

## 4. Where the income comes from (turn 15)

### Balanced build order

| Profile | base XP / gold | buildings XP / gold | landmarks XP / gold | npcs XP / gold | quests XP / gold |
| --- | --- | --- | --- | --- | --- |
| Farmer | 3 / 2 | 9 / 5 | 2 / 0 | 2 / 5 | 1 / 2 |
| Balanced | 3 / 2 | 8 / 3 | 6 / 3 | 2 / 5 | 1 / 0 |
| Claimer | 3 / 2 | 8 / 3 | 8 / 3 | 0 / 0 | 16 / 0 |

### XP first build order

| Profile | base XP / gold | buildings XP / gold | landmarks XP / gold | npcs XP / gold | quests XP / gold |
| --- | --- | --- | --- | --- | --- |
| Farmer | 3 / 2 | 9 / 3 | 2 / 0 | 2 / 5 | 1 / 2 |
| Balanced | 3 / 2 | 8 / 3 | 6 / 3 | 2 / 5 | 1 / 2 |
| Claimer | 3 / 2 | 8 / 3 | 8 / 3 | 0 / 0 | 16 / 2 |

## 5. Build timelines (Balanced profile)

- **XP first:** T3 Library, T3 Training dummy, T6 Market, T12 Sparring ring, T13 Forge, T16 Monastery, T18 Trade tier 2, T19 Shrine, T20 Stables, T21 Armory, T25 Arena, T28 Trade tier 3, T30 Refinery
- **Gold first:** T3 Market, T6 Forge, T9 Trade tier 2, T11 Library, T11 Training dummy, T16 Trade tier 3, T17 Sparring ring, T18 Monastery, T19 Armory, T21 Arena, T24 Refinery, T24 Shrine, T24 Stables, T26 Territory tier 2, T27 Apothecary, T28 Temple, T30 Territory tier 3
- **Balanced:** T1 Training dummy, T3 Library, T6 Forge, T9 Market, T12 Sparring ring, T15 Trade tier 2, T18 Monastery, T19 Armory, T20 Shrine, T21 Stables, T24 Arena, T28 Trade tier 3, T30 Refinery
- **Shield first:** T3 Forge, T5 SHIELD, T6 Library, T7 Training dummy, T9 Market, T12 Sparring ring, T15 Trade tier 2, T18 Armory, T19 Monastery, T23 Arena, T26 Trade tier 3, T28 Refinery, T29 Shrine, T29 Stables, T30 Territory tier 2
