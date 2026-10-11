# Layer 4 — Full games between bots

Generated 2026-09-30. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

## 1. How games go

| Mode | Games | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 17% | 28 (22–34) | 44% | 4 | 47% |
| 3v3 | 300 | 1% | 34 (32–38) | 41% | 4 | 55% |
| 4v4 | 300 | 0% | — | 35% | 4 | 45% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Few games end in a wipe, so games still running at round 40 count for the team that was **ahead**: kills (x3) plus landmarks held. 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 32% | 39% | 40% | 38% |
| Crusader | Knight | 41% | 49% | 50% | 48% |
| Berserker | Barbarian | 71% | 71% | 68% | 70% |
| Warlord | Barbarian | 61% | 51% | 55% | 55% |
| Sniper | Archer | 54% | 47% | 47% | 48% |
| Hunter | Archer | 49% | 55% | 49% | 51% |
| Artillery | Mage | 43% | 34% | 40% | 39% |
| Enchanter | Mage | 27% | 34% | 35% | 33% |
| Assassin | Thief | 75% | 71% | 68% | 71% |
| Profiteer | Thief | 50% | 51% | 47% | 49% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 36% | 44% | 45% | 43% |
| Barbarian | 65% | 60% | 61% | 62% |
| Archer | 51% | 51% | 48% | 50% |
| Mage | 34% | 34% | 38% | 36% |
| Thief | 62% | 60% | 57% | 59% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.4 | 0.8 | 13.7 | 37.4 | 22.1 | 62.9 | 11.0 | 583.6 | 8.0 | 15 (100% get one) |
| Crusader | 1.1 | 1.6 | 41.1 | 21.3 | 62.4 | 66.7 | 14.5 | 679.8 | 7.9 | 15 (100% get one) |
| Berserker | 3.0 | 1.8 | 78.9 | 5.7 | 186.4 | 47.0 | 14.2 | 883.0 | 6.9 | 12 (100% get one) |
| Warlord | 1.5 | 1.3 | 48.6 | 6.1 | 131.8 | 36.5 | 14.6 | 797.1 | 7.0 | 14 (100% get one) |
| Sniper | 0.9 | 0.9 | 46.1 | 2.7 | 110.5 | 25.2 | 10.8 | 752.4 | 5.9 | 14 (100% get one) |
| Hunter | 0.9 | 0.9 | 27.5 | 3.8 | 129.9 | 26.8 | 11.5 | 749.9 | 7.0 | 14 (100% get one) |
| Artillery | 1.3 | 1.3 | 44.2 | 7.5 | 114.9 | 35.0 | 5.0 | 600.1 | 6.0 | 17 (100% get one) |
| Enchanter | 0.3 | 1.0 | 12.8 | 7.9 | 56.8 | 33.4 | 5.6 | 514.9 | 7.0 | 17 (100% get one) |
| Assassin | 3.2 | 1.8 | 73.1 | 5.0 | 47.0 | 45.8 | 18.7 | 758.9 | 5.0 | 13 (100% get one) |
| Profiteer | 0.2 | 1.2 | 11.7 | 11.3 | 31.8 | 45.3 | 26.4 | 1133.6 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 80.1 | 242.1 | 469.2 |
| 3v3 | 81.9 | 248.2 | 481.0 |
| 4v4 | 82.7 | 250.2 | 482.2 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 30.0, cast:selfHeal 6.7, attack:weapon 6.1, rest 3.6, cast:crossHeal 2.1, attack:holyStrike 1.0, attack:charge 0.7, cast:fortify 0.2
- **Crusader:** move 34.4, attack:weapon 5.8, attack:charge 5.0, rest 4.4, cast:selfHeal 2.9, attack:holyStrike 2.6, cast:smite 1.7, cast:crossHeal 0.2
- **Berserker:** move 37.1, attack:weapon 12.8, attack:heavyStrike 6.1, attack:doubleStrike 4.9, rest 3.1
- **Warlord:** move 37.6, attack:weapon 12.3, attack:heavyStrike 12.0, rest 3.3
- **Sniper:** move 34.7, attack:weapon 29.7, attack:arrowRain 2.1, rest 1.4
- **Hunter:** move 35.8, attack:weapon 27.7, rest 2.0, hunter's mark 1.8, cast:iceBlock 1.1
- **Artillery:** move 33.2, cast:mageBolt 22.5, rest 5.2, doublecast 2.1, attack:weapon 0.5, cast:fireball 0.1
- **Enchanter:** move 31.9, cast:mageBolt 13.8, rest 8.6, cast:empower 3.2, cast:iceBlock 1.4, teleport 0.7, attack:weapon 0.4, cast:cleanse 0.0
- **Assassin:** move 36.0, attack:weapon 14.3, cast:invisibility 13.6, rest 2.6
- **Profiteer:** move 36.2, attack:weapon 12.5, rest 5.9

(900 games in total.)

## 6. Set duos (2v2)

Each duo plays 150 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 150 | 70% | 40% | 1.76 |
| Berserker + Paladin | 150 | 63% | 19% | 0.11 |
| Artillery + Paladin | 150 | 25% | 7% | 0.27 |
| Sniper + Warlord | 150 | 55% | 14% | 0.10 |
| Assassin + Profiteer | 150 | 78% | 13% | 0.11 |
