# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 3 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +1.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 3.5 | 0% | 51% | 29 (23–33) | 41% | 4 | 50% |
| 3v3 | 150 | 5.5 | 0% | 21% | 34 (28–35) | 48% | 5 | 51% |
| 4v4 | 150 | 9.8 | 0% | 3% | 37 (34–38) | 41% | 5 | 42% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 7% | 17% | 33% | 42% | 51% | 49% |
| 3v3 | 0% | 3% | 7% | 15% | 21% | 79% |
| 4v4 | 0% | 0% | 0% | 1% | 3% | 97% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 31% | 34% | 42% | 37% |
| Crusader | Knight | 53% | 43% | 44% | 46% |
| Berserker | Barbarian | 79% | 78% | 76% | 77% |
| Warlord | Barbarian | 59% | 58% | 50% | 55% |
| Sniper | Archer | 58% | 53% | 54% | 54% |
| Hunter | Archer | 44% | 56% | 51% | 51% |
| Artillery | Mage | 49% | 49% | 41% | 45% |
| Enchanter | Mage | 32% | 46% | 40% | 40% |
| Assassin | Thief | 63% | 62% | 65% | 64% |
| Profiteer | Thief | 32% | 26% | 38% | 33% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 43% | 39% | 43% | 42% |
| Barbarian | 67% | 67% | 61% | 65% |
| Archer | 52% | 54% | 53% | 53% |
| Mage | 40% | 47% | 40% | 43% |
| Thief | 46% | 43% | 51% | 47% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.4 | 0.8 | 11.7 | 33.3 | 20.0 | 57.8 | 9.2 | 539.7 | 7.8 | 15 (98% get one) |
| Crusader | 0.9 | 1.3 | 34.9 | 19.1 | 56.7 | 56.2 | 12.2 | 630.7 | 7.8 | 15 (98% get one) |
| Berserker | 2.6 | 1.2 | 64.1 | 4.6 | 161.6 | 33.1 | 11.7 | 789.7 | 6.7 | 12 (96% get one) |
| Warlord | 1.3 | 1.1 | 40.2 | 5.2 | 113.0 | 29.6 | 12.4 | 732.3 | 6.9 | 14 (97% get one) |
| Sniper | 0.8 | 0.7 | 38.4 | 2.2 | 95.8 | 20.9 | 9.4 | 720.9 | 5.9 | 14 (100% get one) |
| Hunter | 0.8 | 0.8 | 22.2 | 3.1 | 117.1 | 22.7 | 9.7 | 712.2 | 6.9 | 14 (99% get one) |
| Artillery | 1.1 | 1.0 | 39.2 | 6.6 | 111.9 | 29.0 | 4.7 | 586.0 | 5.9 | 17 (97% get one) |
| Enchanter | 0.3 | 0.8 | 11.8 | 6.9 | 54.4 | 30.0 | 5.0 | 487.2 | 6.9 | 17 (97% get one) |
| Assassin | 2.2 | 1.3 | 49.2 | 1.3 | 29.2 | 30.4 | 14.4 | 674.6 | 4.9 | 14 (98% get one) |
| Profiteer | 0.0 | 1.2 | 0.5 | 3.0 | 11.9 | 31.0 | 16.5 | 961.8 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.7 | 236.6 | 454.2 |
| 3v3 | 80.3 | 242.9 | 468.0 |
| 4v4 | 81.8 | 248.2 | 478.5 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 28.5, attack:weapon 7.7, cast:selfHeal 6.1, rest 2.9, cast:crossHeal 1.7, attack:holyStrike 0.8, attack:charge 0.6, cast:fortify 0.2
- **Crusader:** move 31.0, attack:weapon 6.2, attack:charge 4.5, rest 4.2, attack:holyStrike 2.6, cast:selfHeal 2.6, cast:smite 1.3, cast:crossHeal 0.1
- **Berserker:** move 32.3, attack:weapon 11.9, attack:heavyStrike 5.9, attack:doubleStrike 3.8, rest 2.6
- **Warlord:** move 34.4, attack:weapon 12.9, attack:heavyStrike 10.3, rest 2.8
- **Sniper:** move 32.6, attack:weapon 29.1, attack:arrowRain 1.9, rest 1.1
- **Hunter:** move 34.1, attack:weapon 27.4, hunter's mark 1.7, rest 1.6, cast:iceBlock 1.1
- **Artillery:** move 30.7, cast:mageBolt 21.9, rest 4.6, doublecast 1.8, attack:weapon 1.0, cast:fireball 0.1
- **Enchanter:** move 29.3, cast:mageBolt 13.1, rest 7.5, cast:empower 3.3, attack:weapon 1.6, cast:iceBlock 1.2, teleport 0.7, cast:cleanse 0.0
- **Assassin:** move 39.9, cast:invisibility 11.3, attack:weapon 9.7, rest 0.7
- **Profiteer:** move 49.7, attack:weapon 5.6, rest 1.5

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 80% | 85% | 0.88 |
| Berserker + Paladin | 75 | 73% | 60% | 0.08 |
| Artillery + Paladin | 75 | 48% | 37% | 0.25 |
| Sniper + Warlord | 75 | 68% | 37% | 0.08 |
| Assassin + Profiteer | 75 | 47% | 44% | 0.11 |
