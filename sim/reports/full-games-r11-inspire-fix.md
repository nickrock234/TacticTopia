# Layer 4 — Full games between bots

Generated 2026-10-01. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.3 | 0% | 85% | 24 (18–31) | 49% | 4 | 48% |
| 3v3 | 300 | 7.4 | 0% | 67% | 30 (25–35) | 62% | 5 | 54% |
| 4v4 | 300 | 10.8 | 1% | 55% | 32 (28–37) | 67% | 5 | 54% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 29% | 50% | 63% | 76% | 85% | 15% |
| 3v3 | 6% | 20% | 35% | 53% | 67% | 33% |
| 4v4 | 1% | 8% | 21% | 38% | 55% | 45% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 42% | 37% | 42% | 40% |
| Crusader | Knight | 57% | 52% | 50% | 52% |
| Berserker | Barbarian | 65% | 68% | 65% | 66% |
| Warlord | Barbarian | 61% | 56% | 52% | 55% |
| Sniper | Archer | 38% | 48% | 50% | 47% |
| Hunter | Archer | 46% | 48% | 46% | 46% |
| Artillery | Mage | 58% | 51% | 55% | 54% |
| Enchanter | Mage | 33% | 38% | 37% | 37% |
| Assassin | Thief | 56% | 57% | 54% | 55% |
| Profiteer | Thief | 44% | 46% | 49% | 47% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 49% | 44% | 46% | 46% |
| Barbarian | 63% | 61% | 58% | 60% |
| Archer | 42% | 48% | 48% | 47% |
| Mage | 45% | 45% | 47% | 46% |
| Thief | 50% | 51% | 52% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.6 | 1.2 | 19.4 | 37.6 | 15.4 | 59.7 | 7.1 | 439.6 | 12.5 | 15 (95% get one) |
| Crusader | 1.2 | 1.4 | 36.9 | 21.5 | 33.1 | 53.3 | 8.5 | 485.2 | 12.7 | 15 (90% get one) |
| Berserker | 2.2 | 1.5 | 54.1 | 4.8 | 79.0 | 31.0 | 7.6 | 520.1 | 12.4 | 12 (86% get one) |
| Warlord | 1.6 | 1.3 | 39.7 | 6.5 | 82.8 | 29.8 | 8.8 | 562.6 | 13.7 | 14 (87% get one) |
| Sniper | 0.8 | 1.1 | 31.4 | 6.2 | 75.8 | 28.5 | 7.7 | 585.5 | 14.9 | 14 (93% get one) |
| Hunter | 1.1 | 1.2 | 29.2 | 6.2 | 94.8 | 29.9 | 7.2 | 558.5 | 14.0 | 14 (89% get one) |
| Artillery | 1.4 | 1.0 | 41.2 | 11.3 | 71.2 | 29.3 | 4.2 | 469.1 | 13.0 | 17 (87% get one) |
| Enchanter | 0.6 | 1.0 | 19.0 | 8.9 | 57.5 | 31.7 | 4.2 | 432.2 | 12.3 | 17 (89% get one) |
| Assassin | 1.8 | 1.4 | 39.3 | 2.6 | 16.6 | 30.1 | 11.4 | 574.8 | 14.1 | 14 (94% get one) |
| Profiteer | 1.0 | 1.3 | 24.3 | 2.8 | 32.5 | 30.3 | 11.2 | 755.4 | 15.8 | 13 (95% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.9 | 238.1 | 462.8 |
| 3v3 | 81.2 | 245.9 | 470.2 |
| 4v4 | 82.1 | 247.8 | 472.7 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 19.9, attack:weapon 7.1, cast:selfHeal 6.2, rest 2.6, cast:crossHeal 0.9, cast:resurrection 0.8, attack:holyStrike 0.7, attack:charge 0.2, cast:smite 0.2, cast:fortify 0.2, cast:firewall 0.1, cast:lightning 0.1, cast:nature 0.1, cast:fireball 0.1, cast:quake 0.1, cast:iceBlock 0.1, cast:poison 0.0
- **Crusader:** move 19.5, attack:weapon 4.9, rest 3.9, attack:holyStrike 2.8, cast:selfHeal 2.7, attack:charge 2.4, cast:smite 0.5, cast:resurrection 0.2, cast:firewall 0.2, cast:lightning 0.2, cast:fireball 0.2, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Berserker:** move 19.2, attack:weapon 6.1, attack:heavyStrike 4.8, rest 2.6, attack:doubleStrike 1.8, cast:fireball 0.4, cast:lightning 0.3, cast:iceBlock 0.2, cast:inspire 0.1, cast:firewall 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Warlord:** move 22.1, attack:weapon 8.8, attack:heavyStrike 5.6, rest 3.7, attack:doubleStrike 1.8, cast:inspire 0.5, cast:lightning 0.3, cast:firewall 0.1, cast:quake 0.1, cast:iceBlock 0.1, cast:fireball 0.1, cast:nature 0.1, cast:poison 0.1, cast:fortify 0.0
- **Sniper:** move 24.6, attack:weapon 22.9, rest 3.3, hunter's mark 0.8, attack:arrowRain 0.8, cast:iceBlock 0.3, cast:lightning 0.2, cast:fireball 0.2, cast:firewall 0.1, cast:nature 0.1, cast:quake 0.1, cast:poison 0.1, cast:fortify 0.0
- **Hunter:** move 23.3, attack:weapon 20.6, rest 3.3, hunter's mark 1.1, cast:iceBlock 0.5, attack:arrowRain 0.2, cast:lightning 0.1, cast:firewall 0.1, cast:nature 0.0, cast:quake 0.0, cast:fireball 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 23.6, cast:mageBolt 14.6, rest 9.8, doublecast 1.4, attack:weapon 0.7, cast:firewall 0.2, cast:empower 0.2, teleport 0.2, cast:fireball 0.1, cast:iceBlock 0.1, cast:cleanse 0.1, cast:lightning 0.0, cast:poison 0.0, cast:quake 0.0
- **Enchanter:** move 22.6, cast:mageBolt 13.2, rest 7.9, cast:empower 2.6, cast:iceBlock 1.2, attack:weapon 1.0, doublecast 0.6, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.1, cast:fortify 0.0, cast:lightning 0.0, cast:fireball 0.0, cast:quake 0.0
- **Assassin:** move 29.4, cast:invisibility 7.0, attack:weapon 6.7, rest 1.3, cast:lightning 0.5, cast:fireball 0.4, cast:firewall 0.4, cast:iceBlock 0.2, cast:quake 0.2, cast:poison 0.0, cast:nature 0.0
- **Profiteer:** move 31.8, attack:weapon 5.9, cast:invisibility 5.6, rest 1.5, cast:lightning 0.9, cast:quake 0.8, cast:firewall 0.6, cast:nature 0.3, cast:iceBlock 0.2, cast:fireball 0.2, cast:poison 0.2, cast:fortify 0.1

(900 games in total.)

## 6. Set duos (2v2)

Each duo plays 150 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 150 | 65% | 94% | 0.26 |
| Berserker + Paladin | 150 | 68% | 91% | 0.04 |
| Artillery + Paladin | 150 | 49% | 75% | 0.25 |
| Sniper + Warlord | 150 | 53% | 83% | 0.09 |
| Assassin + Profiteer | 150 | 49% | 90% | 0.11 |
