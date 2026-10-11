# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.2 | 0% | 84% | 25 (17–30) | 50% | 4 | 57% |
| 3v3 | 150 | 7.6 | 1% | 55% | 31 (25–36) | 63% | 5 | 54% |
| 4v4 | 150 | 10.8 | 1% | 46% | 33 (28–36) | 66% | 5 | 53% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 27% | 43% | 65% | 77% | 84% | 16% |
| 3v3 | 3% | 15% | 27% | 41% | 55% | 45% |
| 4v4 | 3% | 8% | 17% | 31% | 46% | 54% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 46% | 38% | 41% | 41% |
| Crusader | Knight | 44% | 37% | 48% | 43% |
| Berserker | Barbarian | 61% | 69% | 64% | 65% |
| Warlord | Barbarian | 69% | 62% | 59% | 62% |
| Sniper | Archer | 44% | 55% | 47% | 49% |
| Hunter | Archer | 36% | 40% | 41% | 40% |
| Artillery | Mage | 52% | 59% | 50% | 53% |
| Enchanter | Mage | 39% | 38% | 41% | 40% |
| Assassin | Thief | 59% | 51% | 48% | 51% |
| Profiteer | Thief | 47% | 46% | 57% | 51% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 45% | 38% | 45% | 42% |
| Barbarian | 65% | 65% | 61% | 63% |
| Archer | 41% | 49% | 44% | 45% |
| Mage | 45% | 49% | 46% | 47% |
| Thief | 52% | 48% | 53% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.7 | 1.1 | 18.7 | 40.2 | 17.1 | 59.3 | 6.8 | 446.9 | 13.0 | 15 (95% get one) |
| Crusader | 1.1 | 1.5 | 29.3 | 16.8 | 36.5 | 52.8 | 8.3 | 489.1 | 12.8 | 15 (90% get one) |
| Berserker | 2.2 | 1.5 | 51.3 | 2.8 | 88.1 | 30.0 | 8.2 | 555.0 | 13.7 | 12 (92% get one) |
| Warlord | 1.7 | 1.3 | 39.0 | 3.1 | 101.3 | 27.4 | 9.3 | 600.2 | 15.0 | 14 (92% get one) |
| Sniper | 0.9 | 1.0 | 29.0 | 1.7 | 85.7 | 23.9 | 8.1 | 636.2 | 16.2 | 14 (95% get one) |
| Hunter | 0.9 | 1.3 | 26.8 | 2.1 | 107.6 | 27.9 | 7.2 | 594.8 | 14.9 | 14 (90% get one) |
| Artillery | 1.5 | 1.0 | 38.8 | 7.4 | 67.2 | 25.4 | 4.1 | 480.7 | 13.2 | 17 (92% get one) |
| Enchanter | 0.7 | 0.9 | 18.5 | 6.3 | 54.1 | 29.3 | 4.1 | 439.2 | 12.5 | 17 (89% get one) |
| Assassin | 1.7 | 1.4 | 36.4 | 0.9 | 18.3 | 29.0 | 11.5 | 577.3 | 14.3 | 13 (91% get one) |
| Profiteer | 1.1 | 1.3 | 24.9 | 1.3 | 37.6 | 29.5 | 11.4 | 797.5 | 16.7 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.6 | 237.6 | 462.1 |
| 3v3 | 80.2 | 243.5 | 469.1 |
| 4v4 | 81.6 | 247.9 | 476.6 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 20.6, attack:weapon 7.2, cast:selfHeal 6.4, rest 2.5, cast:crossHeal 1.2, cast:resurrection 0.9, attack:holyStrike 0.7, attack:charge 0.2, cast:lightning 0.2, cast:smite 0.2, cast:nature 0.1, cast:fortify 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.1, cast:iceBlock 0.1, cast:fireball 0.0
- **Crusader:** move 20.7, attack:weapon 5.3, attack:charge 2.5, cast:selfHeal 2.4, rest 2.3, attack:holyStrike 2.3, cast:smite 0.3, cast:lightning 0.3, cast:resurrection 0.2, cast:fireball 0.1, cast:crossHeal 0.1, cast:firewall 0.1, cast:iceBlock 0.1, cast:poison 0.0, cast:nature 0.0, cast:quake 0.0
- **Berserker:** move 21.6, attack:weapon 6.9, attack:heavyStrike 4.7, attack:doubleStrike 1.8, rest 1.6, cast:fireball 0.5, cast:lightning 0.4, cast:iceBlock 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.1, cast:nature 0.0
- **Warlord:** move 26.0, attack:weapon 9.3, attack:heavyStrike 6.3, attack:doubleStrike 2.2, rest 1.7, cast:lightning 0.5, cast:iceBlock 0.1, cast:quake 0.1, cast:fireball 0.1, cast:firewall 0.1, cast:poison 0.1, cast:nature 0.1, cast:fortify 0.0
- **Sniper:** move 27.2, attack:weapon 24.8, rest 0.9, hunter's mark 0.9, attack:arrowRain 0.6, cast:iceBlock 0.3, cast:lightning 0.2, cast:fireball 0.1, cast:nature 0.1, cast:poison 0.1, cast:quake 0.1, cast:firewall 0.0, cast:fortify 0.0
- **Hunter:** move 26.0, attack:weapon 22.4, rest 1.1, hunter's mark 0.9, cast:iceBlock 0.5, attack:arrowRain 0.1, cast:lightning 0.1, cast:nature 0.0, cast:fireball 0.0, cast:firewall 0.0, cast:fortify 0.0, cast:quake 0.0
- **Artillery:** move 25.5, cast:mageBolt 13.8, rest 7.7, doublecast 1.3, attack:weapon 0.6, cast:empower 0.2, teleport 0.2, cast:firewall 0.2, cast:iceBlock 0.1, cast:fireball 0.1, cast:cleanse 0.1, cast:lightning 0.0, cast:poison 0.0, cast:quake 0.0
- **Enchanter:** move 24.1, cast:mageBolt 12.4, rest 6.9, cast:empower 2.5, attack:weapon 1.1, cast:iceBlock 1.1, doublecast 0.6, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.1, cast:fortify 0.0, cast:lightning 0.0
- **Assassin:** move 29.2, cast:invisibility 7.1, attack:weapon 6.5, cast:lightning 0.6, rest 0.4, cast:fireball 0.4, cast:firewall 0.2, cast:iceBlock 0.2, cast:quake 0.1, cast:poison 0.0, cast:nature 0.0
- **Profiteer:** move 33.0, cast:invisibility 6.4, attack:weapon 6.3, cast:lightning 1.0, cast:quake 0.7, rest 0.5, cast:firewall 0.5, cast:nature 0.4, cast:fireball 0.3, cast:iceBlock 0.2, cast:poison 0.1, cast:fortify 0.1

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 63% | 88% | 0.35 |
| Berserker + Paladin | 75 | 69% | 92% | 0.07 |
| Artillery + Paladin | 75 | 57% | 65% | 0.32 |
| Sniper + Warlord | 75 | 65% | 85% | 0.04 |
| Assassin + Profiteer | 75 | 56% | 85% | 0.08 |
