# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 3 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 3.7 | 0% | 55% | 29 (24–35) | 41% | 4 | 50% |
| 3v3 | 150 | 5.8 | 0% | 27% | 34 (28–37) | 48% | 5 | 51% |
| 4v4 | 150 | 10.1 | 0% | 3% | 37 (36–37) | 42% | 5 | 45% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 8% | 19% | 34% | 43% | 55% | 45% |
| 3v3 | 0% | 3% | 8% | 16% | 27% | 73% |
| 4v4 | 0% | 0% | 0% | 0% | 3% | 97% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 33% | 30% | 42% | 36% |
| Crusader | Knight | 55% | 42% | 45% | 46% |
| Berserker | Barbarian | 77% | 73% | 72% | 73% |
| Warlord | Barbarian | 57% | 55% | 49% | 53% |
| Sniper | Archer | 59% | 51% | 55% | 54% |
| Hunter | Archer | 39% | 49% | 52% | 48% |
| Artillery | Mage | 55% | 55% | 46% | 51% |
| Enchanter | Mage | 31% | 48% | 39% | 40% |
| Assassin | Thief | 60% | 66% | 63% | 63% |
| Profiteer | Thief | 33% | 33% | 39% | 36% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 45% | 37% | 43% | 41% |
| Barbarian | 66% | 63% | 59% | 62% |
| Archer | 50% | 50% | 54% | 52% |
| Mage | 43% | 51% | 43% | 46% |
| Thief | 45% | 48% | 50% | 48% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.3 | 0.9 | 11.2 | 32.9 | 20.2 | 59.5 | 9.1 | 538.1 | 7.8 | 15 (98% get one) |
| Crusader | 1.1 | 1.3 | 37.5 | 19.3 | 57.0 | 56.6 | 12.1 | 629.5 | 7.8 | 15 (97% get one) |
| Berserker | 2.6 | 1.3 | 65.1 | 4.4 | 157.0 | 33.9 | 11.6 | 776.0 | 6.7 | 12 (96% get one) |
| Warlord | 1.3 | 1.1 | 38.6 | 5.3 | 113.0 | 30.5 | 12.3 | 730.4 | 6.9 | 14 (97% get one) |
| Sniper | 0.8 | 0.7 | 39.4 | 2.0 | 96.0 | 21.3 | 9.6 | 721.4 | 5.9 | 14 (100% get one) |
| Hunter | 0.8 | 0.9 | 22.1 | 3.1 | 115.0 | 25.0 | 9.5 | 702.8 | 6.9 | 14 (99% get one) |
| Artillery | 1.4 | 1.0 | 43.6 | 6.2 | 118.6 | 28.2 | 4.5 | 582.6 | 5.9 | 17 (97% get one) |
| Enchanter | 0.2 | 0.9 | 12.5 | 6.6 | 52.9 | 30.6 | 5.2 | 490.7 | 6.9 | 17 (97% get one) |
| Assassin | 2.2 | 1.4 | 49.6 | 1.2 | 27.7 | 32.0 | 14.1 | 663.8 | 4.9 | 14 (98% get one) |
| Profiteer | 0.1 | 1.2 | 0.6 | 2.9 | 11.5 | 31.4 | 16.7 | 960.1 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.7 | 236.9 | 455.6 |
| 3v3 | 80.3 | 243.2 | 468.8 |
| 4v4 | 81.8 | 248.1 | 478.3 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 28.3, attack:weapon 7.8, cast:selfHeal 6.1, rest 3.1, cast:crossHeal 1.7, attack:holyStrike 0.7, attack:charge 0.6, cast:fortify 0.2
- **Crusader:** move 31.0, attack:weapon 6.0, attack:charge 4.4, rest 4.1, cast:selfHeal 2.7, attack:holyStrike 2.7, cast:smite 1.6, cast:crossHeal 0.1
- **Berserker:** move 31.8, attack:weapon 11.6, attack:heavyStrike 5.7, attack:doubleStrike 3.8, rest 2.5
- **Warlord:** move 34.2, attack:weapon 12.9, attack:heavyStrike 10.2, rest 2.8
- **Sniper:** move 32.8, attack:weapon 29.2, attack:arrowRain 2.0, rest 1.0
- **Hunter:** move 33.7, attack:weapon 27.1, hunter's mark 1.7, rest 1.6, cast:iceBlock 1.1
- **Artillery:** move 30.8, cast:mageBolt 22.0, rest 4.4, doublecast 1.7, attack:weapon 1.3, cast:fireball 0.1
- **Enchanter:** move 29.4, cast:mageBolt 12.8, rest 7.3, cast:empower 3.2, attack:weapon 1.6, cast:iceBlock 1.3, teleport 0.7, cast:cleanse 0.0
- **Assassin:** move 39.2, cast:invisibility 11.0, attack:weapon 9.5, rest 0.6
- **Profiteer:** move 49.3, attack:weapon 5.5, rest 1.5

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 80% | 83% | 0.88 |
| Berserker + Paladin | 75 | 69% | 64% | 0.11 |
| Artillery + Paladin | 75 | 48% | 37% | 0.25 |
| Sniper + Warlord | 75 | 69% | 36% | 0.08 |
| Assassin + Profiteer | 75 | 41% | 48% | 0.16 |
