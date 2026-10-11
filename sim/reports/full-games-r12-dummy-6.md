# Layer 4 — Full games between bots

Generated 2026-10-01. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.3 | 0% | 85% | 24 (19–32) | 49% | 4 | 50% |
| 3v3 | 300 | 7.5 | 1% | 68% | 30 (25–35) | 60% | 5 | 55% |
| 4v4 | 300 | 10.7 | 1% | 50% | 31 (25–36) | 66% | 5 | 47% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 28% | 47% | 61% | 76% | 85% | 15% |
| 3v3 | 7% | 18% | 34% | 52% | 68% | 32% |
| 4v4 | 2% | 13% | 23% | 35% | 50% | 50% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 40% | 35% | 44% | 40% |
| Crusader | Knight | 58% | 50% | 48% | 51% |
| Berserker | Barbarian | 68% | 67% | 64% | 66% |
| Warlord | Barbarian | 58% | 56% | 53% | 55% |
| Sniper | Archer | 35% | 50% | 50% | 47% |
| Hunter | Archer | 44% | 49% | 49% | 48% |
| Artillery | Mage | 59% | 51% | 52% | 53% |
| Enchanter | Mage | 38% | 36% | 40% | 38% |
| Assassin | Thief | 57% | 57% | 53% | 55% |
| Profiteer | Thief | 44% | 49% | 47% | 47% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 49% | 42% | 46% | 46% |
| Barbarian | 62% | 61% | 58% | 60% |
| Archer | 39% | 50% | 50% | 47% |
| Mage | 48% | 44% | 46% | 46% |
| Thief | 50% | 52% | 50% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.6 | 1.2 | 19.9 | 38.7 | 15.6 | 60.4 | 7.1 | 434.5 | 12.5 | 15 (95% get one) |
| Crusader | 1.2 | 1.4 | 37.6 | 21.8 | 31.6 | 54.5 | 8.4 | 477.2 | 12.6 | 15 (89% get one) |
| Berserker | 2.2 | 1.5 | 53.6 | 4.8 | 78.1 | 31.2 | 7.7 | 508.1 | 12.2 | 12 (86% get one) |
| Warlord | 1.5 | 1.3 | 39.1 | 6.5 | 83.7 | 30.0 | 8.9 | 552.4 | 13.5 | 14 (86% get one) |
| Sniper | 0.8 | 1.1 | 31.8 | 6.3 | 76.0 | 27.8 | 7.8 | 588.6 | 14.9 | 14 (93% get one) |
| Hunter | 1.1 | 1.2 | 30.2 | 6.3 | 97.3 | 29.7 | 7.5 | 565.3 | 14.4 | 14 (89% get one) |
| Artillery | 1.4 | 1.0 | 40.3 | 11.3 | 71.7 | 29.6 | 4.2 | 457.8 | 12.7 | 17 (88% get one) |
| Enchanter | 0.6 | 1.0 | 18.6 | 9.0 | 54.8 | 31.7 | 4.2 | 416.0 | 12.0 | 17 (89% get one) |
| Assassin | 1.8 | 1.4 | 39.1 | 2.6 | 16.7 | 30.3 | 11.3 | 570.5 | 13.9 | 14 (94% get one) |
| Profiteer | 1.1 | 1.3 | 25.6 | 2.8 | 35.1 | 30.1 | 11.2 | 777.3 | 16.2 | 13 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.5 | 235.5 | 455.5 |
| 3v3 | 81.0 | 243.9 | 468.4 |
| 4v4 | 81.8 | 245.3 | 468.9 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 20.0, attack:weapon 7.2, cast:selfHeal 6.3, rest 2.6, cast:crossHeal 1.0, cast:resurrection 0.8, attack:holyStrike 0.7, attack:charge 0.3, cast:smite 0.2, cast:lightning 0.1, cast:firewall 0.1, cast:fortify 0.1, cast:nature 0.1, cast:quake 0.1, cast:fireball 0.1, cast:iceBlock 0.1, cast:poison 0.0
- **Crusader:** move 19.2, attack:weapon 4.9, rest 3.9, attack:holyStrike 2.8, cast:selfHeal 2.7, attack:charge 2.4, cast:smite 0.5, cast:resurrection 0.2, cast:firewall 0.2, cast:lightning 0.2, cast:fireball 0.1, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Berserker:** move 19.1, attack:weapon 6.1, attack:heavyStrike 4.7, rest 2.7, attack:doubleStrike 1.7, cast:fireball 0.4, cast:lightning 0.4, cast:iceBlock 0.1, cast:inspire 0.1, cast:firewall 0.1, cast:poison 0.0, cast:quake 0.0, cast:nature 0.0
- **Warlord:** move 22.3, attack:weapon 9.0, attack:heavyStrike 5.5, rest 3.6, attack:doubleStrike 1.8, cast:inspire 0.5, cast:lightning 0.3, cast:quake 0.1, cast:firewall 0.1, cast:iceBlock 0.1, cast:nature 0.1, cast:fireball 0.1, cast:poison 0.1, cast:fortify 0.0
- **Sniper:** move 25.0, attack:weapon 23.1, rest 3.3, hunter's mark 1.0, attack:arrowRain 0.8, cast:iceBlock 0.3, cast:lightning 0.2, cast:fireball 0.2, cast:firewall 0.1, cast:nature 0.1, cast:quake 0.0, cast:poison 0.0, cast:fortify 0.0
- **Hunter:** move 23.6, attack:weapon 21.0, rest 3.3, hunter's mark 1.1, cast:iceBlock 0.6, attack:arrowRain 0.2, cast:lightning 0.1, cast:firewall 0.1, cast:nature 0.0, cast:quake 0.0, cast:fireball 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 23.5, cast:mageBolt 14.6, rest 9.8, doublecast 1.3, attack:weapon 0.7, cast:firewall 0.2, cast:empower 0.2, teleport 0.2, cast:fireball 0.1, cast:cleanse 0.1, cast:iceBlock 0.1, cast:lightning 0.0, cast:poison 0.0
- **Enchanter:** move 22.4, cast:mageBolt 12.8, rest 8.0, cast:empower 2.6, cast:iceBlock 1.3, attack:weapon 1.0, doublecast 0.6, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.0, cast:fortify 0.0, cast:poison 0.0, cast:quake 0.0
- **Assassin:** move 29.4, cast:invisibility 7.0, attack:weapon 6.7, rest 1.3, cast:lightning 0.6, cast:fireball 0.4, cast:firewall 0.3, cast:iceBlock 0.2, cast:quake 0.2, cast:poison 0.1, cast:nature 0.0
- **Profiteer:** move 32.4, attack:weapon 6.2, cast:invisibility 5.8, rest 1.5, cast:lightning 0.9, cast:quake 0.8, cast:firewall 0.7, cast:nature 0.3, cast:fireball 0.2, cast:iceBlock 0.2, cast:poison 0.2, cast:fortify 0.0

(900 games in total.)

## 6. Set duos (2v2)

Each duo plays 150 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 150 | 65% | 93% | 0.23 |
| Berserker + Paladin | 150 | 74% | 93% | 0.03 |
| Artillery + Paladin | 150 | 50% | 71% | 0.24 |
| Sniper + Warlord | 150 | 56% | 86% | 0.09 |
| Assassin + Profiteer | 150 | 53% | 88% | 0.05 |
