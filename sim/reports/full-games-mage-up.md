# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: respawn wait +1 per death, cap 3 turns, Mage bolt 6, Fireball 4.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 5.2 | 5% | 18% | 28 (21–32) | 44% | 4 | 48% |
| 3v3 | 150 | 7.6 | 4% | 3% | 34 (32–39) | 41% | 5 | 44% |
| 4v4 | 150 | 10.5 | 4% | 0% | — | 36% | 5 | 48% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Few games end in a wipe, so games still running at round 40 count for the team that was **ahead**: kills (x3) plus landmarks held. 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 35% | 27% | 36% | 33% |
| Crusader | Knight | 53% | 52% | 51% | 52% |
| Berserker | Barbarian | 74% | 80% | 69% | 74% |
| Warlord | Barbarian | 63% | 52% | 47% | 52% |
| Sniper | Archer | 55% | 52% | 52% | 53% |
| Hunter | Archer | 31% | 43% | 52% | 45% |
| Artillery | Mage | 50% | 43% | 43% | 45% |
| Enchanter | Mage | 23% | 44% | 31% | 33% |
| Assassin | Thief | 65% | 61% | 71% | 67% |
| Profiteer | Thief | 42% | 41% | 45% | 43% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 45% | 41% | 44% | 43% |
| Barbarian | 68% | 64% | 57% | 62% |
| Archer | 45% | 48% | 52% | 49% |
| Mage | 36% | 43% | 37% | 39% |
| Thief | 53% | 51% | 57% | 54% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.3 | 0.9 | 10.7 | 33.7 | 21.3 | 60.5 | 9.3 | 568.0 | 7.9 | 15 (99% get one) |
| Crusader | 1.1 | 1.5 | 39.4 | 21.3 | 64.7 | 65.3 | 13.1 | 683.7 | 8.0 | 15 (100% get one) |
| Berserker | 3.3 | 1.7 | 84.0 | 4.9 | 185.3 | 43.8 | 13.2 | 878.1 | 7.0 | 12 (100% get one) |
| Warlord | 1.6 | 1.4 | 45.9 | 5.4 | 119.9 | 37.9 | 13.0 | 778.7 | 7.0 | 14 (99% get one) |
| Sniper | 0.9 | 0.8 | 41.9 | 2.2 | 100.1 | 24.6 | 9.6 | 754.5 | 5.9 | 14 (100% get one) |
| Hunter | 0.8 | 1.0 | 23.5 | 3.4 | 121.2 | 27.9 | 10.6 | 742.9 | 7.0 | 14 (100% get one) |
| Artillery | 1.6 | 1.3 | 50.5 | 6.3 | 126.7 | 33.8 | 4.9 | 616.5 | 6.0 | 17 (100% get one) |
| Enchanter | 0.3 | 1.1 | 16.7 | 4.8 | 68.0 | 33.0 | 5.3 | 525.3 | 7.0 | 17 (100% get one) |
| Assassin | 2.8 | 1.8 | 58.5 | 1.6 | 32.2 | 39.8 | 15.7 | 730.1 | 5.0 | 13 (99% get one) |
| Profiteer | 0.1 | 1.3 | 0.6 | 3.0 | 15.2 | 35.5 | 17.8 | 1052.6 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.9 | 238.0 | 463.0 |
| 3v3 | 80.7 | 244.8 | 474.8 |
| 4v4 | 82.2 | 249.6 | 481.8 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 30.4, attack:weapon 7.7, cast:selfHeal 6.1, rest 3.3, cast:crossHeal 1.9, attack:holyStrike 0.8, attack:charge 0.5, cast:fortify 0.2
- **Crusader:** move 34.1, attack:weapon 7.1, attack:charge 5.1, rest 4.2, cast:selfHeal 3.0, attack:holyStrike 2.8, cast:smite 1.6, cast:crossHeal 0.2
- **Berserker:** move 37.2, attack:weapon 13.5, attack:heavyStrike 6.5, attack:doubleStrike 5.1, rest 2.8
- **Warlord:** move 37.0, attack:weapon 13.9, attack:heavyStrike 11.2, rest 2.9
- **Sniper:** move 34.5, attack:weapon 30.4, attack:arrowRain 2.1, rest 1.1
- **Hunter:** move 35.8, attack:weapon 28.3, hunter's mark 1.8, rest 1.8, cast:iceBlock 1.4
- **Artillery:** move 33.5, cast:mageBolt 23.3, rest 4.5, doublecast 2.1, attack:weapon 1.2, cast:fireball 0.1
- **Enchanter:** move 31.3, cast:mageBolt 15.3, rest 6.5, cast:empower 2.9, attack:weapon 1.6, cast:iceBlock 1.3, teleport 0.8, cast:cleanse 0.0
- **Assassin:** move 44.7, cast:invisibility 13.0, attack:weapon 11.0, rest 0.8
- **Profiteer:** move 53.5, attack:weapon 6.6, rest 1.5

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 83% | 63% | 1.85 |
| Berserker + Paladin | 75 | 78% | 29% | 0.09 |
| Artillery + Paladin | 75 | 21% | 9% | 0.28 |
| Sniper + Warlord | 75 | 66% | 13% | 0.11 |
| Assassin + Profiteer | 75 | 61% | 16% | 0.19 |
