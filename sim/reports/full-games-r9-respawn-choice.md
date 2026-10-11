# Layer 4 — Full games between bots

Generated 2026-10-01. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.3 | 0% | 84% | 23 (18–29) | 49% | 4 | 51% |
| 3v3 | 300 | 7.6 | 1% | 69% | 29 (25–34) | 61% | 5 | 54% |
| 4v4 | 300 | 10.6 | 1% | 55% | 30 (26–35) | 68% | 5 | 53% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 30% | 52% | 66% | 76% | 84% | 16% |
| 3v3 | 6% | 18% | 39% | 56% | 69% | 31% |
| 4v4 | 3% | 14% | 29% | 43% | 55% | 45% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 39% | 36% | 37% | 38% |
| Crusader | Knight | 53% | 50% | 50% | 50% |
| Berserker | Barbarian | 71% | 72% | 67% | 70% |
| Warlord | Barbarian | 60% | 54% | 53% | 55% |
| Sniper | Archer | 45% | 50% | 45% | 47% |
| Hunter | Archer | 44% | 48% | 51% | 48% |
| Artillery | Mage | 53% | 49% | 54% | 52% |
| Enchanter | Mage | 33% | 36% | 40% | 37% |
| Assassin | Thief | 56% | 59% | 56% | 57% |
| Profiteer | Thief | 48% | 47% | 49% | 48% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 46% | 43% | 44% | 44% |
| Barbarian | 65% | 62% | 59% | 62% |
| Archer | 44% | 49% | 48% | 47% |
| Mage | 42% | 42% | 47% | 44% |
| Thief | 51% | 52% | 52% | 52% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.6 | 1.2 | 18.2 | 37.0 | 15.0 | 59.7 | 7.0 | 429.0 | 12.5 | 15 (95% get one) |
| Crusader | 1.2 | 1.4 | 36.3 | 20.7 | 31.8 | 52.5 | 8.2 | 466.2 | 12.7 | 15 (90% get one) |
| Berserker | 2.2 | 1.4 | 54.0 | 4.7 | 76.9 | 30.4 | 7.3 | 490.1 | 12.2 | 12 (86% get one) |
| Warlord | 1.7 | 1.3 | 40.5 | 6.6 | 85.0 | 29.8 | 8.5 | 557.6 | 13.6 | 14 (88% get one) |
| Sniper | 0.8 | 1.1 | 31.3 | 6.2 | 75.4 | 27.4 | 7.8 | 580.8 | 15.2 | 14 (92% get one) |
| Hunter | 1.1 | 1.2 | 27.6 | 5.8 | 91.1 | 29.2 | 7.1 | 537.6 | 13.8 | 14 (89% get one) |
| Artillery | 1.4 | 1.1 | 40.9 | 11.0 | 70.2 | 29.2 | 4.0 | 452.3 | 12.5 | 16 (87% get one) |
| Enchanter | 0.6 | 1.0 | 19.6 | 8.6 | 54.6 | 32.0 | 4.2 | 417.7 | 12.2 | 17 (90% get one) |
| Assassin | 1.8 | 1.4 | 38.4 | 2.6 | 16.0 | 30.0 | 11.0 | 552.1 | 13.8 | 13 (93% get one) |
| Profiteer | 1.0 | 1.3 | 23.6 | 2.6 | 31.7 | 29.3 | 10.9 | 723.1 | 15.6 | 13 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.7 | 238.1 | 459.8 |
| 3v3 | 81.2 | 246.2 | 472.5 |
| 4v4 | 82.1 | 248.2 | 473.3 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 19.7, attack:weapon 6.8, cast:selfHeal 5.9, rest 2.7, cast:crossHeal 1.0, cast:resurrection 0.9, attack:holyStrike 0.6, attack:charge 0.2, cast:smite 0.2, cast:lightning 0.2, cast:firewall 0.1, cast:fortify 0.1, cast:nature 0.1, cast:poison 0.1, cast:quake 0.1, cast:iceBlock 0.1, cast:fireball 0.1
- **Crusader:** move 19.1, attack:weapon 4.9, rest 3.9, attack:holyStrike 2.8, cast:selfHeal 2.6, attack:charge 2.3, cast:smite 0.5, cast:resurrection 0.2, cast:lightning 0.2, cast:firewall 0.2, cast:fireball 0.1, cast:iceBlock 0.1, cast:crossHeal 0.1, cast:poison 0.0, cast:quake 0.0, cast:nature 0.0
- **Berserker:** move 18.7, attack:weapon 6.0, attack:heavyStrike 4.7, rest 2.6, attack:doubleStrike 1.8, cast:fireball 0.4, cast:lightning 0.3, cast:firewall 0.1, cast:iceBlock 0.1, cast:poison 0.0, cast:quake 0.0, cast:nature 0.0
- **Warlord:** move 22.2, attack:weapon 8.5, attack:heavyStrike 5.9, rest 3.7, attack:doubleStrike 1.9, cast:lightning 0.4, cast:iceBlock 0.1, cast:firewall 0.1, cast:quake 0.1, cast:fireball 0.1, cast:fortify 0.1, cast:nature 0.1, cast:poison 0.1
- **Sniper:** move 24.6, attack:weapon 22.7, rest 3.3, hunter's mark 0.9, attack:arrowRain 0.7, cast:iceBlock 0.3, cast:lightning 0.3, cast:fireball 0.2, cast:nature 0.2, cast:firewall 0.1, cast:quake 0.1, cast:poison 0.0, cast:fortify 0.0
- **Hunter:** move 22.7, attack:weapon 19.9, rest 3.1, hunter's mark 1.1, cast:iceBlock 0.5, attack:arrowRain 0.1, cast:lightning 0.1, cast:firewall 0.1, cast:fireball 0.0, cast:quake 0.0, cast:nature 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 23.0, cast:mageBolt 14.4, rest 9.6, doublecast 1.3, attack:weapon 0.7, cast:firewall 0.2, teleport 0.2, cast:empower 0.2, cast:fireball 0.1, cast:iceBlock 0.1, cast:cleanse 0.1, cast:lightning 0.0, cast:poison 0.0, cast:quake 0.0
- **Enchanter:** move 22.1, cast:mageBolt 12.7, rest 7.8, cast:empower 2.6, cast:iceBlock 1.2, attack:weapon 1.0, doublecast 0.6, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.1, cast:fortify 0.0, cast:quake 0.0, cast:fireball 0.0
- **Assassin:** move 28.2, cast:invisibility 6.7, attack:weapon 6.6, rest 1.4, cast:lightning 0.5, cast:fireball 0.4, cast:firewall 0.4, cast:quake 0.2, cast:iceBlock 0.1, cast:poison 0.1, cast:nature 0.0
- **Profiteer:** move 31.0, attack:weapon 5.7, cast:invisibility 5.5, rest 1.4, cast:lightning 0.9, cast:quake 0.7, cast:firewall 0.5, cast:nature 0.3, cast:iceBlock 0.2, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.0

(900 games in total.)

## 6. Set duos (2v2)

Each duo plays 150 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 150 | 66% | 90% | 0.27 |
| Berserker + Paladin | 150 | 66% | 92% | 0.03 |
| Artillery + Paladin | 150 | 50% | 75% | 0.23 |
| Sniper + Warlord | 150 | 63% | 88% | 0.07 |
| Assassin + Profiteer | 150 | 49% | 89% | 0.09 |
