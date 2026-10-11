# Layer 4 — Full games between bots

Generated 2026-10-01. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP, movement 3/4/4/3/5, maps 24/32/36.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.2 | 0% | 87% | 25 (20–31) | 46% | 3 | 53% |
| 3v3 | 300 | 7.6 | 1% | 67% | 27 (23–34) | 65% | 4 | 51% |
| 4v4 | 300 | 10.7 | 1% | 57% | 30 (26–35) | 67% | 4 | 51% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 23% | 47% | 65% | 79% | 87% | 13% |
| 3v3 | 10% | 27% | 40% | 53% | 67% | 33% |
| 4v4 | 1% | 13% | 29% | 44% | 57% | 43% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 43% | 36% | 37% | 38% |
| Crusader | Knight | 58% | 51% | 58% | 55% |
| Berserker | Barbarian | 68% | 69% | 64% | 67% |
| Warlord | Barbarian | 57% | 56% | 50% | 54% |
| Sniper | Archer | 42% | 47% | 44% | 44% |
| Hunter | Archer | 45% | 44% | 48% | 46% |
| Artillery | Mage | 54% | 61% | 49% | 54% |
| Enchanter | Mage | 41% | 38% | 43% | 41% |
| Assassin | Thief | 51% | 51% | 58% | 54% |
| Profiteer | Thief | 43% | 48% | 49% | 47% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 50% | 43% | 47% | 47% |
| Barbarian | 62% | 62% | 56% | 59% |
| Archer | 44% | 45% | 46% | 45% |
| Mage | 47% | 50% | 47% | 48% |
| Thief | 46% | 49% | 54% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.6 | 1.2 | 20.6 | 37.8 | 14.9 | 58.9 | 8.2 | 435.9 | 12.3 | 15 (91% get one) |
| Crusader | 1.3 | 1.3 | 39.8 | 20.8 | 39.5 | 51.7 | 10.1 | 486.3 | 13.2 | 14 (88% get one) |
| Berserker | 2.2 | 1.5 | 51.8 | 4.0 | 83.2 | 30.5 | 7.7 | 486.8 | 11.7 | 12 (80% get one) |
| Warlord | 1.5 | 1.3 | 36.5 | 5.4 | 85.5 | 27.8 | 9.3 | 528.5 | 13.5 | 14 (87% get one) |
| Sniper | 0.8 | 1.1 | 29.0 | 5.6 | 80.2 | 28.1 | 8.7 | 592.3 | 15.1 | 14 (94% get one) |
| Hunter | 1.1 | 1.2 | 29.0 | 5.5 | 98.8 | 29.3 | 8.4 | 558.1 | 14.3 | 14 (90% get one) |
| Artillery | 1.5 | 1.1 | 42.6 | 10.4 | 61.6 | 30.1 | 5.5 | 453.3 | 12.4 | 16 (84% get one) |
| Enchanter | 0.7 | 1.1 | 21.1 | 7.4 | 50.4 | 31.1 | 5.8 | 439.5 | 12.4 | 16 (85% get one) |
| Assassin | 1.8 | 1.4 | 36.1 | 2.0 | 16.0 | 28.9 | 11.6 | 531.8 | 13.4 | 14 (92% get one) |
| Profiteer | 1.1 | 1.3 | 23.4 | 2.1 | 28.3 | 28.8 | 12.2 | 708.4 | 16.1 | 13 (97% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 81.1 | 242.4 | 462.9 |
| 3v3 | 83.0 | 247.5 | 472.1 |
| 4v4 | 84.2 | 249.9 | 473.6 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 19.7, attack:weapon 7.2, cast:selfHeal 5.8, rest 2.4, cast:crossHeal 1.1, cast:resurrection 0.9, attack:holyStrike 0.6, attack:charge 0.3, cast:smite 0.2, cast:lightning 0.1, cast:firewall 0.1, cast:quake 0.1, cast:fortify 0.1, cast:nature 0.1, cast:fireball 0.1, cast:poison 0.1, cast:iceBlock 0.0
- **Crusader:** move 20.3, attack:weapon 4.9, rest 4.2, attack:charge 3.8, attack:holyStrike 2.9, cast:selfHeal 2.2, cast:smite 0.5, cast:lightning 0.3, cast:resurrection 0.2, cast:fireball 0.2, cast:firewall 0.2, cast:iceBlock 0.1, cast:crossHeal 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Berserker:** move 19.1, attack:weapon 6.8, attack:heavyStrike 4.6, rest 2.2, attack:doubleStrike 1.7, cast:fireball 0.4, cast:lightning 0.3, cast:firewall 0.1, cast:iceBlock 0.1, cast:poison 0.1, cast:inspire 0.0, cast:quake 0.0, cast:nature 0.0
- **Warlord:** move 23.0, attack:weapon 9.1, attack:heavyStrike 5.5, rest 3.0, attack:doubleStrike 1.8, cast:inspire 0.3, cast:lightning 0.3, cast:quake 0.1, cast:fireball 0.1, cast:iceBlock 0.1, cast:firewall 0.1, cast:nature 0.1, cast:poison 0.1
- **Sniper:** move 25.8, attack:weapon 23.7, rest 3.0, attack:arrowRain 0.7, hunter's mark 0.7, cast:iceBlock 0.3, cast:lightning 0.3, cast:fireball 0.2, cast:nature 0.1, cast:firewall 0.1, cast:quake 0.1, cast:poison 0.1, cast:fortify 0.0
- **Hunter:** move 24.6, attack:weapon 21.6, rest 2.9, hunter's mark 0.9, cast:iceBlock 0.7, attack:arrowRain 0.2, cast:lightning 0.1, cast:firewall 0.0, cast:quake 0.0, cast:nature 0.0, cast:fireball 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 22.7, cast:mageBolt 13.5, rest 8.2, doublecast 1.4, attack:weapon 0.7, cast:firewall 0.2, cast:iceBlock 0.1, cast:empower 0.1, cast:fireball 0.1, teleport 0.1, cast:cleanse 0.0, cast:lightning 0.0, cast:poison 0.0, cast:quake 0.0
- **Enchanter:** move 23.3, cast:mageBolt 12.0, rest 6.9, cast:empower 2.4, cast:iceBlock 1.4, attack:weapon 1.2, doublecast 0.7, teleport 0.3, cast:cleanse 0.2, cast:firewall 0.1, cast:lightning 0.0, cast:quake 0.0
- **Assassin:** move 30.1, cast:invisibility 7.1, attack:weapon 6.3, rest 1.0, cast:fireball 0.4, cast:lightning 0.4, cast:firewall 0.3, cast:iceBlock 0.2, cast:quake 0.2, cast:poison 0.0, cast:nature 0.0
- **Profiteer:** move 34.7, cast:invisibility 5.5, attack:weapon 5.3, rest 1.1, cast:quake 0.7, cast:lightning 0.7, cast:firewall 0.5, cast:nature 0.2, cast:iceBlock 0.2, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.0

(900 games in total.)

## 6. Set duos (2v2)

Each duo plays 150 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 150 | 67% | 95% | 0.16 |
| Berserker + Paladin | 150 | 71% | 91% | 0.02 |
| Artillery + Paladin | 150 | 47% | 70% | 0.13 |
| Sniper + Warlord | 150 | 57% | 87% | 0.07 |
| Assassin + Profiteer | 150 | 47% | 95% | 0.03 |
