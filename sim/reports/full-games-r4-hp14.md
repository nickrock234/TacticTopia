# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.6 | 0% | 87% | 26 (20–32) | 42% | 4 | 51% |
| 3v3 | 150 | 7.6 | 0% | 55% | 33 (27–37) | 61% | 5 | 47% |
| 4v4 | 150 | 10.4 | 0% | 37% | 32 (28–36) | 61% | 5 | 54% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 23% | 40% | 59% | 73% | 87% | 13% |
| 3v3 | 3% | 9% | 19% | 39% | 55% | 45% |
| 4v4 | 1% | 5% | 15% | 27% | 37% | 63% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 48% | 53% | 44% | 47% |
| Crusader | Knight | 48% | 48% | 48% | 48% |
| Berserker | Barbarian | 55% | 66% | 61% | 61% |
| Warlord | Barbarian | 66% | 56% | 54% | 57% |
| Sniper | Archer | 44% | 52% | 44% | 47% |
| Hunter | Archer | 31% | 46% | 50% | 45% |
| Artillery | Mage | 58% | 56% | 53% | 55% |
| Enchanter | Mage | 40% | 37% | 42% | 40% |
| Assassin | Thief | 64% | 46% | 54% | 53% |
| Profiteer | Thief | 40% | 41% | 51% | 45% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 48% | 50% | 46% | 48% |
| Barbarian | 61% | 60% | 57% | 59% |
| Archer | 39% | 49% | 47% | 46% |
| Mage | 49% | 47% | 48% | 48% |
| Thief | 51% | 43% | 53% | 49% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.8 | 1.1 | 20.8 | 32.8 | 19.7 | 61.6 | 7.2 | 461.4 | 13.6 | 15 (96% get one) |
| Crusader | 1.2 | 1.5 | 33.8 | 17.4 | 39.4 | 54.3 | 8.7 | 524.4 | 13.7 | 15 (92% get one) |
| Berserker | 2.2 | 1.5 | 50.5 | 2.8 | 95.3 | 30.5 | 8.2 | 583.9 | 13.6 | 12 (92% get one) |
| Warlord | 1.6 | 1.3 | 38.6 | 3.3 | 105.0 | 28.5 | 9.3 | 625.2 | 15.3 | 14 (93% get one) |
| Sniper | 0.8 | 1.1 | 30.2 | 1.8 | 87.7 | 25.6 | 8.2 | 653.4 | 16.1 | 14 (96% get one) |
| Hunter | 1.0 | 1.2 | 26.8 | 2.1 | 117.8 | 27.4 | 7.7 | 632.5 | 15.6 | 14 (96% get one) |
| Artillery | 1.4 | 1.0 | 38.1 | 7.1 | 68.6 | 25.4 | 4.1 | 488.9 | 13.7 | 17 (91% get one) |
| Enchanter | 0.6 | 1.0 | 19.6 | 6.2 | 54.6 | 30.8 | 4.4 | 447.4 | 12.6 | 17 (93% get one) |
| Assassin | 1.9 | 1.4 | 38.5 | 0.7 | 19.2 | 29.6 | 11.7 | 597.0 | 14.2 | 13 (96% get one) |
| Profiteer | 1.1 | 1.3 | 25.2 | 1.2 | 40.7 | 30.1 | 11.5 | 812.3 | 16.7 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.6 | 238.3 | 452.1 |
| 3v3 | 80.5 | 245.7 | 472.2 |
| 4v4 | 82.0 | 249.8 | 478.0 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 21.9, attack:weapon 7.7, cast:selfHeal 6.8, rest 2.7, cast:crossHeal 1.1, attack:holyStrike 0.8, attack:charge 0.3, cast:smite 0.3, cast:nature 0.1, cast:firewall 0.1, cast:lightning 0.1, cast:quake 0.1, cast:fortify 0.1, cast:fireball 0.1, cast:iceBlock 0.1, cast:poison 0.1
- **Crusader:** move 22.2, attack:weapon 5.8, cast:selfHeal 2.9, attack:charge 2.6, rest 2.6, attack:holyStrike 2.5, cast:smite 0.4, cast:lightning 0.4, cast:fireball 0.2, cast:firewall 0.1, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Berserker:** move 22.3, attack:weapon 7.2, attack:heavyStrike 5.0, attack:doubleStrike 1.8, rest 1.6, cast:fireball 0.5, cast:lightning 0.5, cast:iceBlock 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.1, cast:nature 0.0
- **Warlord:** move 26.8, attack:weapon 9.8, attack:heavyStrike 6.3, attack:doubleStrike 2.2, rest 1.8, cast:lightning 0.5, cast:iceBlock 0.2, cast:quake 0.2, cast:fireball 0.1, cast:poison 0.1, cast:firewall 0.1, cast:nature 0.1, cast:fortify 0.0
- **Sniper:** move 27.6, attack:weapon 25.1, rest 0.9, hunter's mark 0.9, attack:arrowRain 0.7, cast:iceBlock 0.4, cast:lightning 0.3, cast:nature 0.2, cast:fireball 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.0, cast:fortify 0.0
- **Hunter:** move 27.6, attack:weapon 23.5, rest 1.1, hunter's mark 0.9, cast:iceBlock 0.6, attack:arrowRain 0.2, cast:lightning 0.1, cast:fireball 0.0, cast:poison 0.0, cast:nature 0.0, cast:quake 0.0, cast:fortify 0.0, cast:firewall 0.0
- **Artillery:** move 26.7, cast:mageBolt 14.1, rest 7.5, doublecast 1.3, attack:weapon 0.7, teleport 0.2, cast:firewall 0.2, cast:empower 0.2, cast:iceBlock 0.1, cast:fireball 0.1, cast:cleanse 0.1, cast:poison 0.0, cast:lightning 0.0, cast:quake 0.0
- **Enchanter:** move 24.3, cast:mageBolt 12.7, rest 6.5, cast:empower 2.8, cast:iceBlock 1.3, attack:weapon 1.3, doublecast 0.6, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.0, cast:fortify 0.0, cast:lightning 0.0, cast:poison 0.0
- **Assassin:** move 29.7, cast:invisibility 7.3, attack:weapon 6.8, cast:lightning 0.6, cast:fireball 0.4, rest 0.4, cast:firewall 0.2, cast:iceBlock 0.2, cast:quake 0.1, cast:poison 0.1, cast:nature 0.0
- **Profiteer:** move 33.6, cast:invisibility 6.8, attack:weapon 6.7, cast:lightning 1.2, cast:quake 0.7, cast:firewall 0.6, rest 0.5, cast:nature 0.3, cast:iceBlock 0.3, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.1

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 58% | 87% | 0.39 |
| Berserker + Paladin | 75 | 65% | 91% | 0.07 |
| Artillery + Paladin | 75 | 47% | 64% | 0.32 |
| Sniper + Warlord | 75 | 65% | 83% | 0.07 |
| Assassin + Profiteer | 75 | 70% | 95% | 0.07 |
