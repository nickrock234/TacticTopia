# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn wait +1 per death (cap 3), Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.6 | 0% | 85% | 26 (20–32) | 43% | 4 | 51% |
| 3v3 | 150 | 7.6 | 0% | 57% | 33 (28–37) | 61% | 5 | 46% |
| 4v4 | 150 | 10.3 | 0% | 39% | 32 (28–35) | 61% | 5 | 54% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 23% | 40% | 59% | 72% | 85% | 15% |
| 3v3 | 3% | 9% | 21% | 40% | 57% | 43% |
| 4v4 | 1% | 4% | 16% | 29% | 39% | 61% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 50% | 49% | 45% | 48% |
| Crusader | Knight | 48% | 44% | 44% | 45% |
| Berserker | Barbarian | 54% | 60% | 65% | 61% |
| Warlord | Barbarian | 66% | 55% | 52% | 56% |
| Sniper | Archer | 43% | 56% | 45% | 48% |
| Hunter | Archer | 31% | 47% | 49% | 44% |
| Artillery | Mage | 58% | 57% | 48% | 53% |
| Enchanter | Mage | 40% | 37% | 42% | 40% |
| Assassin | Thief | 66% | 49% | 58% | 57% |
| Profiteer | Thief | 40% | 45% | 52% | 47% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 49% | 46% | 44% | 46% |
| Barbarian | 60% | 57% | 58% | 58% |
| Archer | 38% | 52% | 46% | 46% |
| Mage | 49% | 47% | 45% | 47% |
| Thief | 52% | 47% | 55% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.7 | 1.1 | 20.3 | 32.0 | 18.6 | 60.9 | 7.0 | 455.7 | 13.3 | 15 (96% get one) |
| Crusader | 1.2 | 1.5 | 33.1 | 17.1 | 38.7 | 54.3 | 8.7 | 517.4 | 13.7 | 15 (92% get one) |
| Berserker | 2.2 | 1.5 | 50.9 | 2.8 | 94.7 | 30.5 | 8.2 | 576.0 | 13.6 | 12 (92% get one) |
| Warlord | 1.6 | 1.3 | 39.4 | 3.3 | 105.5 | 28.2 | 9.3 | 621.7 | 15.4 | 14 (93% get one) |
| Sniper | 0.9 | 1.0 | 29.4 | 1.9 | 89.7 | 24.5 | 8.2 | 650.5 | 16.2 | 14 (96% get one) |
| Hunter | 1.0 | 1.2 | 27.2 | 2.1 | 116.1 | 27.7 | 7.7 | 626.4 | 15.7 | 14 (96% get one) |
| Artillery | 1.3 | 1.0 | 37.9 | 7.2 | 68.6 | 25.2 | 4.0 | 494.2 | 13.5 | 17 (91% get one) |
| Enchanter | 0.6 | 1.1 | 18.6 | 6.0 | 55.0 | 30.8 | 4.4 | 444.2 | 12.5 | 17 (93% get one) |
| Assassin | 1.9 | 1.4 | 37.9 | 0.7 | 19.5 | 29.3 | 11.6 | 591.1 | 14.2 | 13 (96% get one) |
| Profiteer | 1.0 | 1.3 | 25.3 | 1.1 | 40.4 | 30.0 | 11.5 | 812.4 | 16.7 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.6 | 238.3 | 451.9 |
| 3v3 | 80.5 | 245.6 | 473.1 |
| 4v4 | 82.0 | 249.8 | 478.5 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 21.7, attack:weapon 7.5, cast:selfHeal 6.5, rest 2.6, cast:crossHeal 1.1, attack:holyStrike 0.7, cast:smite 0.3, attack:charge 0.2, cast:nature 0.1, cast:firewall 0.1, cast:lightning 0.1, cast:fortify 0.1, cast:fireball 0.1, cast:quake 0.1, cast:poison 0.1, cast:iceBlock 0.1
- **Crusader:** move 22.0, attack:weapon 5.8, cast:selfHeal 2.8, rest 2.6, attack:charge 2.5, attack:holyStrike 2.5, cast:smite 0.4, cast:lightning 0.3, cast:fireball 0.2, cast:firewall 0.2, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Berserker:** move 22.4, attack:weapon 7.2, attack:heavyStrike 5.0, attack:doubleStrike 1.8, rest 1.6, cast:lightning 0.5, cast:fireball 0.5, cast:iceBlock 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.1, cast:nature 0.0
- **Warlord:** move 26.8, attack:weapon 9.8, attack:heavyStrike 6.3, attack:doubleStrike 2.3, rest 1.8, cast:lightning 0.5, cast:iceBlock 0.2, cast:quake 0.2, cast:fireball 0.1, cast:poison 0.1, cast:nature 0.1, cast:firewall 0.1, cast:fortify 0.0
- **Sniper:** move 27.7, attack:weapon 25.4, rest 1.0, hunter's mark 0.9, attack:arrowRain 0.6, cast:iceBlock 0.3, cast:lightning 0.3, cast:nature 0.2, cast:fireball 0.1, cast:firewall 0.0, cast:quake 0.0, cast:poison 0.0, cast:fortify 0.0
- **Hunter:** move 27.5, attack:weapon 23.3, rest 1.1, hunter's mark 0.9, cast:iceBlock 0.6, attack:arrowRain 0.2, cast:lightning 0.1, cast:fireball 0.0, cast:firewall 0.0, cast:nature 0.0, cast:quake 0.0, cast:poison 0.0, cast:fortify 0.0
- **Artillery:** move 26.9, cast:mageBolt 14.1, rest 7.8, doublecast 1.3, attack:weapon 0.7, teleport 0.3, cast:firewall 0.2, cast:empower 0.2, cast:fireball 0.1, cast:iceBlock 0.1, cast:cleanse 0.1, cast:poison 0.0, cast:lightning 0.0, cast:quake 0.0
- **Enchanter:** move 24.2, cast:mageBolt 12.7, rest 6.4, cast:empower 2.7, cast:iceBlock 1.3, attack:weapon 1.3, doublecast 0.5, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.0, cast:fortify 0.0, cast:lightning 0.0, cast:poison 0.0
- **Assassin:** move 29.7, cast:invisibility 7.4, attack:weapon 6.8, cast:lightning 0.6, rest 0.4, cast:fireball 0.4, cast:firewall 0.2, cast:iceBlock 0.2, cast:quake 0.1, cast:poison 0.1, cast:nature 0.0
- **Profiteer:** move 33.7, cast:invisibility 6.8, attack:weapon 6.6, cast:lightning 1.2, cast:quake 0.7, cast:firewall 0.6, rest 0.5, cast:nature 0.4, cast:iceBlock 0.3, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.1

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 58% | 87% | 0.39 |
| Berserker + Paladin | 75 | 67% | 89% | 0.05 |
| Artillery + Paladin | 75 | 46% | 60% | 0.31 |
| Sniper + Warlord | 75 | 68% | 81% | 0.07 |
| Assassin + Profiteer | 75 | 69% | 95% | 0.07 |
