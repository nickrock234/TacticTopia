# Layer 4 — Full games between bots

Generated 2026-09-30. 120 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 3 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 1, Vengeance +3 at 75%, Double strike 2 mana, barbarian 15 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 120 | 3.9 | 0% | 60% | 28 (20–35) | 45% | 4 | 58% |
| 3v3 | 120 | 6.0 | 0% | 33% | 32 (27–36) | 51% | 5 | 54% |
| 4v4 | 120 | 10.3 | 0% | 4% | 38 (38–39) | 42% | 5 | 49% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 16% | 23% | 35% | 50% | 60% | 40% |
| 3v3 | 2% | 3% | 15% | 23% | 33% | 67% |
| 4v4 | 0% | 0% | 0% | 1% | 4% | 96% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 41% | 36% | 40% | 39% |
| Crusader | Knight | 54% | 55% | 45% | 50% |
| Berserker | Barbarian | 82% | 71% | 60% | 68% |
| Warlord | Barbarian | 54% | 54% | 51% | 53% |
| Sniper | Archer | 57% | 53% | 48% | 51% |
| Hunter | Archer | 36% | 47% | 57% | 50% |
| Artillery | Mage | 48% | 57% | 53% | 53% |
| Enchanter | Mage | 23% | 36% | 32% | 31% |
| Assassin | Thief | 63% | 49% | 65% | 59% |
| Profiteer | Thief | 40% | 40% | 48% | 44% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 48% | 47% | 42% | 45% |
| Barbarian | 67% | 61% | 56% | 60% |
| Archer | 48% | 50% | 52% | 51% |
| Mage | 35% | 46% | 43% | 42% |
| Thief | 50% | 45% | 56% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.5 | 1.0 | 14.9 | 32.1 | 17.5 | 60.0 | 8.4 | 507.5 | 7.6 | 15 (96% get one) |
| Crusader | 1.2 | 1.4 | 38.7 | 18.0 | 50.7 | 56.4 | 10.9 | 584.0 | 7.6 | 15 (94% get one) |
| Berserker | 2.7 | 1.4 | 63.3 | 4.3 | 145.7 | 33.4 | 10.7 | 754.7 | 6.7 | 12 (96% get one) |
| Warlord | 1.3 | 1.2 | 37.1 | 5.0 | 110.1 | 29.9 | 11.7 | 715.3 | 6.9 | 14 (98% get one) |
| Sniper | 0.7 | 0.8 | 35.1 | 2.1 | 95.2 | 22.8 | 9.3 | 711.8 | 5.9 | 14 (99% get one) |
| Hunter | 0.8 | 0.9 | 22.8 | 2.8 | 112.1 | 24.7 | 9.7 | 707.4 | 6.9 | 14 (97% get one) |
| Artillery | 1.5 | 1.1 | 46.0 | 6.0 | 111.5 | 29.1 | 4.4 | 551.1 | 5.8 | 17 (92% get one) |
| Enchanter | 0.3 | 1.0 | 14.5 | 6.5 | 54.7 | 31.6 | 5.1 | 490.4 | 6.9 | 17 (97% get one) |
| Assassin | 2.3 | 1.4 | 46.2 | 1.3 | 26.6 | 31.4 | 13.4 | 648.9 | 4.9 | 14 (97% get one) |
| Profiteer | 0.1 | 1.0 | 1.2 | 2.8 | 12.5 | 29.1 | 16.6 | 976.6 | 5.0 | 12 (99% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.3 | 237.7 | 462.6 |
| 3v3 | 80.5 | 244.3 | 471.0 |
| 4v4 | 81.8 | 248.3 | 479.0 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 26.1, attack:weapon 8.4, cast:selfHeal 6.4, rest 2.9, cast:crossHeal 1.3, attack:holyStrike 0.8, attack:charge 0.4, cast:fortify 0.2
- **Crusader:** move 28.2, attack:weapon 6.3, attack:charge 3.8, rest 3.3, attack:holyStrike 2.8, cast:selfHeal 2.7, cast:smite 1.3, cast:crossHeal 0.2
- **Berserker:** move 30.3, attack:weapon 10.9, attack:heavyStrike 5.9, attack:doubleStrike 3.5, rest 2.4
- **Warlord:** move 33.3, attack:weapon 12.7, attack:heavyStrike 9.6, rest 2.8
- **Sniper:** move 32.2, attack:weapon 28.5, attack:arrowRain 1.7, rest 1.0
- **Hunter:** move 33.6, attack:weapon 27.1, hunter's mark 1.7, rest 1.5, cast:iceBlock 1.0
- **Artillery:** move 29.7, cast:mageBolt 21.1, rest 4.3, doublecast 1.8, attack:weapon 1.0, cast:fireball 0.1
- **Enchanter:** move 28.4, cast:mageBolt 13.4, rest 7.4, cast:empower 3.6, attack:weapon 1.9, cast:iceBlock 1.5, teleport 0.5, cast:cleanse 0.1
- **Assassin:** move 37.7, cast:invisibility 10.4, attack:weapon 9.3, rest 0.7
- **Profiteer:** move 49.2, attack:weapon 6.0, rest 1.4

(360 games in total.)

## 6. Set duos (2v2)

Each duo plays 60 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 60 | 70% | 87% | 0.63 |
| Berserker + Paladin | 60 | 61% | 65% | 0.07 |
| Artillery + Paladin | 60 | 55% | 43% | 0.12 |
| Sniper + Warlord | 60 | 75% | 40% | 0.13 |
| Assassin + Profiteer | 60 | 53% | 52% | 0.15 |
