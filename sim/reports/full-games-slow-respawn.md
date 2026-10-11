# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: respawn wait +2 per death, cap 6 turns, Mage bolt 5, Fireball 3.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.0 | 1% | 41% | 28 (22–34) | 48% | 4 | 50% |
| 3v3 | 150 | 6.7 | 1% | 12% | 32 (28–36) | 48% | 5 | 44% |
| 4v4 | 150 | 9.2 | 2% | 0% | — | 47% | 5 | 46% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Few games end in a wipe, so games still running at round 40 count for the team that was **ahead**: kills (x3) plus landmarks held. 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 37% | 33% | 45% | 39% |
| Crusader | Knight | 47% | 49% | 43% | 46% |
| Berserker | Barbarian | 73% | 80% | 73% | 75% |
| Warlord | Barbarian | 65% | 53% | 62% | 59% |
| Sniper | Archer | 50% | 53% | 54% | 53% |
| Hunter | Archer | 47% | 56% | 50% | 51% |
| Artillery | Mage | 47% | 42% | 35% | 40% |
| Enchanter | Mage | 29% | 35% | 35% | 34% |
| Assassin | Thief | 70% | 66% | 63% | 66% |
| Profiteer | Thief | 37% | 33% | 40% | 37% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 42% | 42% | 44% | 43% |
| Barbarian | 68% | 65% | 67% | 66% |
| Archer | 49% | 54% | 52% | 52% |
| Mage | 38% | 38% | 35% | 37% |
| Thief | 52% | 49% | 51% | 50% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.4 | 0.9 | 11.9 | 34.1 | 20.1 | 60.5 | 9.3 | 555.6 | 7.9 | 15 (99% get one) |
| Crusader | 0.9 | 1.4 | 36.5 | 20.1 | 58.4 | 60.7 | 12.6 | 652.3 | 7.9 | 15 (99% get one) |
| Berserker | 3.0 | 1.4 | 75.2 | 4.8 | 171.0 | 37.4 | 12.2 | 826.3 | 6.9 | 12 (99% get one) |
| Warlord | 1.4 | 1.1 | 40.2 | 5.2 | 114.6 | 30.9 | 12.6 | 741.4 | 7.0 | 14 (99% get one) |
| Sniper | 0.9 | 0.8 | 39.3 | 2.1 | 97.5 | 22.4 | 9.5 | 736.0 | 5.9 | 14 (99% get one) |
| Hunter | 0.8 | 0.8 | 22.8 | 3.1 | 113.8 | 23.9 | 9.8 | 706.6 | 7.0 | 14 (100% get one) |
| Artillery | 1.2 | 1.1 | 41.5 | 6.3 | 110.8 | 29.5 | 4.7 | 585.7 | 6.0 | 17 (99% get one) |
| Enchanter | 0.3 | 0.9 | 12.0 | 7.4 | 54.8 | 30.7 | 5.0 | 502.7 | 7.0 | 17 (100% get one) |
| Assassin | 2.3 | 1.4 | 52.9 | 1.3 | 29.4 | 33.2 | 14.9 | 706.0 | 5.0 | 14 (100% get one) |
| Profiteer | 0.1 | 1.2 | 0.5 | 2.6 | 14.0 | 31.9 | 16.8 | 1008.6 | 5.0 | 12 (99% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.8 | 236.7 | 461.9 |
| 3v3 | 80.1 | 242.7 | 469.9 |
| 4v4 | 81.6 | 247.2 | 476.3 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 28.6, attack:weapon 7.9, cast:selfHeal 6.4, rest 3.0, cast:crossHeal 1.6, attack:holyStrike 0.8, attack:charge 0.6, cast:fortify 0.2
- **Crusader:** move 31.9, attack:weapon 6.2, attack:charge 4.8, rest 4.1, cast:selfHeal 2.9, attack:holyStrike 2.6, cast:smite 1.4, cast:crossHeal 0.1
- **Berserker:** move 33.9, attack:weapon 12.5, attack:heavyStrike 6.0, attack:doubleStrike 4.4, rest 2.7
- **Warlord:** move 35.0, attack:weapon 13.1, attack:heavyStrike 10.5, rest 2.8
- **Sniper:** move 33.3, attack:weapon 29.4, attack:arrowRain 1.9, rest 1.1
- **Hunter:** move 33.8, attack:weapon 27.4, hunter's mark 1.8, rest 1.6, cast:iceBlock 1.1
- **Artillery:** move 31.8, cast:mageBolt 21.8, rest 4.4, doublecast 1.9, attack:weapon 1.0, cast:fireball 0.1
- **Enchanter:** move 29.8, cast:mageBolt 13.2, rest 8.0, cast:empower 3.2, attack:weapon 1.7, cast:iceBlock 1.0, teleport 0.7, cast:cleanse 0.0
- **Assassin:** move 41.5, cast:invisibility 11.8, attack:weapon 10.0, rest 0.7
- **Profiteer:** move 50.8, attack:weapon 6.1, rest 1.4

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 80% | 71% | 1.28 |
| Berserker + Paladin | 75 | 76% | 40% | 0.09 |
| Artillery + Paladin | 75 | 29% | 19% | 0.25 |
| Sniper + Warlord | 75 | 66% | 32% | 0.03 |
| Assassin + Profiteer | 75 | 67% | 23% | 0.08 |
