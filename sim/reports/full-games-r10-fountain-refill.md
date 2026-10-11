# Layer 4 — Full games between bots

Generated 2026-10-01. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.3 | 0% | 84% | 23 (18–29) | 49% | 4 | 49% |
| 3v3 | 300 | 7.5 | 0% | 66% | 30 (24–34) | 63% | 5 | 54% |
| 4v4 | 300 | 10.7 | 1% | 56% | 32 (27–36) | 67% | 5 | 55% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 30% | 51% | 64% | 75% | 84% | 16% |
| 3v3 | 6% | 19% | 36% | 53% | 66% | 34% |
| 4v4 | 1% | 10% | 24% | 40% | 56% | 44% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 38% | 39% | 42% | 40% |
| Crusader | Knight | 55% | 54% | 52% | 53% |
| Berserker | Barbarian | 67% | 69% | 65% | 67% |
| Warlord | Barbarian | 63% | 55% | 54% | 57% |
| Sniper | Archer | 39% | 50% | 49% | 47% |
| Hunter | Archer | 46% | 46% | 46% | 46% |
| Artillery | Mage | 59% | 49% | 53% | 53% |
| Enchanter | Mage | 32% | 35% | 37% | 35% |
| Assassin | Thief | 57% | 58% | 55% | 56% |
| Profiteer | Thief | 45% | 46% | 48% | 47% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 47% | 46% | 47% | 47% |
| Barbarian | 65% | 61% | 59% | 61% |
| Archer | 43% | 48% | 47% | 47% |
| Mage | 44% | 42% | 45% | 44% |
| Thief | 50% | 51% | 51% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.6 | 1.2 | 18.9 | 36.9 | 15.3 | 58.7 | 7.2 | 434.3 | 12.5 | 15 (95% get one) |
| Crusader | 1.2 | 1.4 | 36.5 | 21.4 | 32.3 | 53.7 | 8.4 | 479.3 | 12.6 | 15 (90% get one) |
| Berserker | 2.3 | 1.4 | 54.0 | 4.8 | 78.8 | 30.7 | 7.6 | 510.8 | 12.4 | 12 (86% get one) |
| Warlord | 1.6 | 1.3 | 40.5 | 6.6 | 84.2 | 29.7 | 8.7 | 559.3 | 13.6 | 14 (88% get one) |
| Sniper | 0.8 | 1.1 | 31.5 | 6.3 | 75.6 | 28.4 | 7.7 | 585.2 | 14.8 | 14 (92% get one) |
| Hunter | 1.1 | 1.2 | 28.9 | 6.2 | 93.5 | 29.7 | 7.1 | 551.9 | 13.9 | 14 (89% get one) |
| Artillery | 1.5 | 1.1 | 41.5 | 11.1 | 70.7 | 29.4 | 4.1 | 461.1 | 12.6 | 16 (87% get one) |
| Enchanter | 0.6 | 1.0 | 18.6 | 8.8 | 56.6 | 31.8 | 4.2 | 428.1 | 12.1 | 17 (89% get one) |
| Assassin | 1.8 | 1.4 | 38.9 | 2.6 | 16.2 | 29.8 | 11.3 | 563.2 | 13.9 | 14 (94% get one) |
| Profiteer | 1.0 | 1.3 | 23.7 | 2.8 | 31.8 | 30.1 | 11.2 | 745.8 | 15.8 | 13 (95% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.8 | 237.9 | 462.7 |
| 3v3 | 81.2 | 245.9 | 471.6 |
| 4v4 | 82.1 | 247.8 | 472.9 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 20.0, attack:weapon 7.0, cast:selfHeal 6.0, rest 2.6, cast:crossHeal 0.9, cast:resurrection 0.8, attack:holyStrike 0.7, attack:charge 0.3, cast:smite 0.2, cast:lightning 0.1, cast:fortify 0.1, cast:firewall 0.1, cast:nature 0.1, cast:iceBlock 0.1, cast:fireball 0.1, cast:quake 0.1, cast:poison 0.0
- **Crusader:** move 19.4, attack:weapon 4.9, rest 3.9, attack:holyStrike 2.8, cast:selfHeal 2.6, attack:charge 2.4, cast:smite 0.5, cast:resurrection 0.2, cast:lightning 0.2, cast:firewall 0.2, cast:fireball 0.2, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Berserker:** move 19.2, attack:weapon 6.1, attack:heavyStrike 4.8, rest 2.7, attack:doubleStrike 1.8, cast:fireball 0.4, cast:lightning 0.3, cast:firewall 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Warlord:** move 22.3, attack:weapon 8.7, attack:heavyStrike 5.9, rest 3.7, attack:doubleStrike 1.9, cast:lightning 0.3, cast:quake 0.1, cast:firewall 0.1, cast:iceBlock 0.1, cast:fireball 0.1, cast:poison 0.1, cast:nature 0.1, cast:fortify 0.0
- **Sniper:** move 24.6, attack:weapon 22.8, rest 3.3, hunter's mark 0.8, attack:arrowRain 0.7, cast:iceBlock 0.3, cast:lightning 0.2, cast:fireball 0.2, cast:firewall 0.1, cast:nature 0.1, cast:quake 0.1, cast:poison 0.0, cast:fortify 0.0
- **Hunter:** move 23.0, attack:weapon 20.5, rest 3.3, hunter's mark 1.1, cast:iceBlock 0.6, attack:arrowRain 0.2, cast:lightning 0.1, cast:firewall 0.1, cast:nature 0.0, cast:quake 0.0, cast:fireball 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 23.2, cast:mageBolt 14.5, rest 9.5, doublecast 1.4, attack:weapon 0.7, cast:firewall 0.3, teleport 0.2, cast:empower 0.2, cast:fireball 0.1, cast:iceBlock 0.1, cast:cleanse 0.1, cast:lightning 0.0, cast:poison 0.0, cast:quake 0.0
- **Enchanter:** move 22.3, cast:mageBolt 13.0, rest 7.8, cast:empower 2.6, cast:iceBlock 1.2, attack:weapon 1.1, doublecast 0.6, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.1, cast:fortify 0.0, cast:lightning 0.0, cast:fireball 0.0, cast:quake 0.0
- **Assassin:** move 29.1, cast:invisibility 7.0, attack:weapon 6.7, rest 1.3, cast:lightning 0.5, cast:fireball 0.4, cast:firewall 0.3, cast:iceBlock 0.2, cast:quake 0.2, cast:poison 0.0, cast:nature 0.0
- **Profiteer:** move 31.8, attack:weapon 5.7, cast:invisibility 5.5, rest 1.5, cast:lightning 0.9, cast:quake 0.8, cast:firewall 0.6, cast:nature 0.3, cast:iceBlock 0.2, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.1

(900 games in total.)

## 6. Set duos (2v2)

Each duo plays 150 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 150 | 65% | 93% | 0.24 |
| Berserker + Paladin | 150 | 69% | 92% | 0.05 |
| Artillery + Paladin | 150 | 48% | 74% | 0.25 |
| Sniper + Warlord | 150 | 57% | 85% | 0.07 |
| Assassin + Profiteer | 150 | 48% | 90% | 0.10 |
