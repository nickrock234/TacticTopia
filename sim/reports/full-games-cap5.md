# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: respawn wait +1 per death, cap 5 turns, Mage bolt 5, Fireball 3.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.9 | 0% | 22% | 31 (24–34) | 44% | 4 | 51% |
| 3v3 | 150 | 7.2 | 0% | 1% | 32 (32–32) | 39% | 5 | 48% |
| 4v4 | 150 | 10.1 | 0% | 1% | 37 (37–37) | 35% | 5 | 44% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Few games end in a wipe, so games still running at round 40 count for the team that was **ahead**: kills (x3) plus landmarks held. 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 34% | 39% | 41% | 39% |
| Crusader | Knight | 55% | 46% | 50% | 50% |
| Berserker | Barbarian | 78% | 78% | 73% | 76% |
| Warlord | Barbarian | 62% | 53% | 50% | 54% |
| Sniper | Archer | 57% | 51% | 49% | 51% |
| Hunter | Archer | 38% | 42% | 54% | 47% |
| Artillery | Mage | 46% | 42% | 34% | 39% |
| Enchanter | Mage | 23% | 38% | 36% | 33% |
| Assassin | Thief | 67% | 61% | 70% | 66% |
| Profiteer | Thief | 40% | 46% | 45% | 44% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 45% | 43% | 46% | 45% |
| Barbarian | 69% | 65% | 60% | 64% |
| Archer | 49% | 48% | 51% | 49% |
| Mage | 34% | 40% | 35% | 36% |
| Thief | 52% | 53% | 57% | 54% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.4 | 0.9 | 12.1 | 34.4 | 21.4 | 62.0 | 9.5 | 574.5 | 7.9 | 15 (99% get one) |
| Crusader | 1.1 | 1.6 | 39.9 | 21.3 | 63.9 | 66.0 | 13.4 | 682.2 | 8.0 | 15 (100% get one) |
| Berserker | 3.3 | 1.6 | 82.9 | 5.1 | 182.5 | 42.8 | 13.1 | 868.1 | 7.0 | 12 (100% get one) |
| Warlord | 1.5 | 1.3 | 45.8 | 5.4 | 120.2 | 35.2 | 13.1 | 773.7 | 7.0 | 14 (99% get one) |
| Sniper | 0.9 | 0.9 | 42.3 | 2.2 | 99.4 | 24.3 | 9.7 | 751.3 | 5.9 | 14 (100% get one) |
| Hunter | 0.8 | 0.9 | 24.7 | 3.3 | 122.2 | 25.8 | 10.2 | 741.4 | 7.0 | 14 (100% get one) |
| Artillery | 1.2 | 1.2 | 44.3 | 6.8 | 118.7 | 32.0 | 5.0 | 614.7 | 6.0 | 17 (100% get one) |
| Enchanter | 0.3 | 1.0 | 12.4 | 7.0 | 56.8 | 33.0 | 5.3 | 515.1 | 7.0 | 17 (100% get one) |
| Assassin | 2.8 | 1.7 | 60.7 | 1.5 | 33.7 | 39.6 | 15.7 | 740.7 | 5.0 | 14 (100% get one) |
| Profiteer | 0.1 | 1.3 | 0.6 | 3.1 | 13.7 | 34.5 | 17.5 | 1027.3 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.8 | 237.6 | 459.4 |
| 3v3 | 80.3 | 243.3 | 472.1 |
| 4v4 | 81.8 | 248.2 | 478.9 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 30.4, attack:weapon 8.0, cast:selfHeal 6.2, rest 3.1, cast:crossHeal 1.8, attack:holyStrike 0.9, attack:charge 0.6, cast:fortify 0.2
- **Crusader:** move 34.3, attack:weapon 6.8, attack:charge 5.1, rest 4.5, cast:selfHeal 2.9, attack:holyStrike 2.8, cast:smite 1.5, cast:crossHeal 0.2
- **Berserker:** move 36.9, attack:weapon 13.5, attack:heavyStrike 6.6, attack:doubleStrike 4.7, rest 2.9
- **Warlord:** move 37.1, attack:weapon 13.8, attack:heavyStrike 11.3, rest 2.9
- **Sniper:** move 34.5, attack:weapon 30.4, attack:arrowRain 2.1, rest 1.1
- **Hunter:** move 35.9, attack:weapon 28.8, hunter's mark 2.0, rest 1.7, cast:iceBlock 1.2
- **Artillery:** move 33.2, cast:mageBolt 23.1, rest 4.8, doublecast 2.1, attack:weapon 1.1, cast:fireball 0.0
- **Enchanter:** move 31.3, cast:mageBolt 13.7, rest 8.0, cast:empower 3.5, attack:weapon 1.6, cast:iceBlock 1.3, teleport 0.9, cast:cleanse 0.0
- **Assassin:** move 44.7, cast:invisibility 13.0, attack:weapon 11.2, rest 0.7
- **Profiteer:** move 53.6, attack:weapon 6.3, rest 1.6

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 78% | 60% | 1.83 |
| Berserker + Paladin | 75 | 81% | 25% | 0.12 |
| Artillery + Paladin | 75 | 27% | 7% | 0.32 |
| Sniper + Warlord | 75 | 64% | 16% | 0.12 |
| Assassin + Profiteer | 75 | 56% | 17% | 0.21 |
