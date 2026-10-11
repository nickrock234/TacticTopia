# Layer 4 — Full games between bots

Generated 2026-09-30. 120 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 3 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 1, Vengeance +2 at 75%, Double strike 2 mana, barbarian 16 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 120 | 3.7 | 0% | 53% | 27 (21–33) | 44% | 4 | 56% |
| 3v3 | 120 | 5.7 | 0% | 31% | 36 (30–38) | 47% | 5 | 57% |
| 4v4 | 120 | 10.5 | 0% | 10% | 34 (30–37) | 41% | 5 | 52% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 13% | 24% | 35% | 46% | 53% | 47% |
| 3v3 | 2% | 5% | 8% | 13% | 31% | 69% |
| 4v4 | 0% | 0% | 3% | 6% | 10% | 90% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 38% | 33% | 38% | 37% |
| Crusader | Knight | 56% | 47% | 48% | 49% |
| Berserker | Barbarian | 68% | 75% | 64% | 69% |
| Warlord | Barbarian | 59% | 57% | 46% | 53% |
| Sniper | Archer | 49% | 53% | 53% | 52% |
| Hunter | Archer | 44% | 47% | 53% | 49% |
| Artillery | Mage | 53% | 52% | 48% | 51% |
| Enchanter | Mage | 27% | 38% | 38% | 35% |
| Assassin | Thief | 67% | 58% | 68% | 64% |
| Profiteer | Thief | 37% | 37% | 43% | 39% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 48% | 41% | 43% | 44% |
| Barbarian | 63% | 65% | 54% | 60% |
| Archer | 47% | 50% | 53% | 51% |
| Mage | 40% | 45% | 43% | 43% |
| Thief | 50% | 47% | 55% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.4 | 1.0 | 14.4 | 33.5 | 17.7 | 61.1 | 8.6 | 512.3 | 7.7 | 15 (98% get one) |
| Crusader | 1.2 | 1.4 | 38.4 | 17.8 | 50.8 | 56.2 | 11.0 | 592.2 | 7.5 | 15 (92% get one) |
| Berserker | 2.6 | 1.3 | 65.6 | 4.4 | 150.1 | 35.1 | 11.1 | 755.9 | 6.8 | 12 (98% get one) |
| Warlord | 1.2 | 1.1 | 37.3 | 5.7 | 113.6 | 30.5 | 12.4 | 736.8 | 6.9 | 14 (99% get one) |
| Sniper | 0.8 | 0.8 | 36.7 | 1.9 | 93.7 | 22.3 | 9.4 | 707.0 | 5.9 | 14 (99% get one) |
| Hunter | 0.8 | 0.8 | 24.0 | 3.3 | 111.4 | 24.1 | 9.9 | 702.4 | 6.9 | 14 (97% get one) |
| Artillery | 1.4 | 1.2 | 44.5 | 5.7 | 113.4 | 30.4 | 4.2 | 556.6 | 5.9 | 17 (93% get one) |
| Enchanter | 0.3 | 0.9 | 14.3 | 6.7 | 54.0 | 31.0 | 5.0 | 486.7 | 6.8 | 17 (95% get one) |
| Assassin | 2.3 | 1.3 | 45.5 | 1.2 | 26.8 | 29.4 | 13.6 | 647.7 | 4.9 | 13 (98% get one) |
| Profiteer | 0.1 | 1.1 | 1.3 | 3.0 | 13.1 | 30.5 | 16.4 | 997.2 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.4 | 236.0 | 461.8 |
| 3v3 | 80.5 | 243.8 | 470.8 |
| 4v4 | 81.8 | 248.5 | 479.5 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 26.2, attack:weapon 8.3, cast:selfHeal 6.5, rest 2.9, cast:crossHeal 1.6, attack:holyStrike 0.8, attack:charge 0.4, cast:fortify 0.2
- **Crusader:** move 28.6, attack:weapon 6.3, attack:charge 3.9, rest 3.4, attack:holyStrike 2.7, cast:selfHeal 2.6, cast:smite 1.3, cast:crossHeal 0.1
- **Berserker:** move 31.5, attack:weapon 11.9, attack:heavyStrike 5.5, attack:doubleStrike 3.7, rest 2.4
- **Warlord:** move 34.7, attack:weapon 12.1, attack:heavyStrike 11.0, rest 3.0
- **Sniper:** move 32.1, attack:weapon 28.5, attack:arrowRain 1.8, rest 1.0
- **Hunter:** move 33.4, attack:weapon 26.8, hunter's mark 1.7, rest 1.7, cast:iceBlock 1.1
- **Artillery:** move 29.8, cast:mageBolt 21.5, rest 4.1, doublecast 1.7, attack:weapon 1.0, cast:fireball 0.1
- **Enchanter:** move 28.1, cast:mageBolt 13.2, rest 7.3, cast:empower 3.5, attack:weapon 2.0, cast:iceBlock 1.3, teleport 0.5, cast:cleanse 0.1
- **Assassin:** move 38.5, cast:invisibility 10.8, attack:weapon 9.1, rest 0.6
- **Profiteer:** move 49.3, attack:weapon 6.2, rest 1.5

(360 games in total.)

## 6. Set duos (2v2)

Each duo plays 60 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 60 | 77% | 92% | 0.55 |
| Berserker + Paladin | 60 | 64% | 67% | 0.02 |
| Artillery + Paladin | 60 | 55% | 47% | 0.13 |
| Sniper + Warlord | 60 | 71% | 43% | 0.12 |
| Assassin + Profiteer | 60 | 52% | 52% | 0.10 |
