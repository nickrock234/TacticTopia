# Layer 4 — Full games between bots

Generated 2026-09-30. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.6 | 0% | 82% | 25 (19–30) | 50% | 4 | 56% |
| 3v3 | 300 | 7.6 | 1% | 58% | 31 (26–35) | 61% | 5 | 54% |
| 4v4 | 300 | 10.6 | 1% | 43% | 33 (28–37) | 66% | 5 | 53% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 23% | 42% | 62% | 73% | 82% | 18% |
| 3v3 | 3% | 12% | 29% | 46% | 58% | 42% |
| 4v4 | 1% | 4% | 14% | 28% | 43% | 57% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 51% | 42% | 43% | 45% |
| Crusader | Knight | 52% | 51% | 47% | 49% |
| Berserker | Barbarian | 59% | 65% | 61% | 62% |
| Warlord | Barbarian | 59% | 54% | 54% | 55% |
| Sniper | Archer | 39% | 48% | 51% | 48% |
| Hunter | Archer | 43% | 49% | 48% | 47% |
| Artillery | Mage | 49% | 51% | 50% | 50% |
| Enchanter | Mage | 38% | 35% | 36% | 36% |
| Assassin | Thief | 68% | 60% | 58% | 61% |
| Profiteer | Thief | 43% | 46% | 51% | 48% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 52% | 46% | 45% | 47% |
| Barbarian | 59% | 59% | 57% | 58% |
| Archer | 41% | 49% | 50% | 47% |
| Mage | 43% | 43% | 43% | 43% |
| Thief | 55% | 53% | 54% | 54% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.7 | 1.1 | 18.9 | 38.3 | 19.2 | 58.1 | 7.2 | 476.4 | 13.7 | 15 (98% get one) |
| Crusader | 1.2 | 1.5 | 33.2 | 18.2 | 40.2 | 52.3 | 8.8 | 527.7 | 13.9 | 15 (92% get one) |
| Berserker | 2.2 | 1.6 | 51.1 | 3.0 | 89.7 | 30.7 | 8.0 | 579.6 | 13.5 | 12 (91% get one) |
| Warlord | 1.6 | 1.4 | 37.5 | 3.2 | 98.0 | 28.3 | 8.8 | 608.6 | 14.8 | 14 (91% get one) |
| Sniper | 0.8 | 1.1 | 28.9 | 2.0 | 86.3 | 25.1 | 8.0 | 638.1 | 16.3 | 14 (96% get one) |
| Hunter | 1.0 | 1.2 | 27.1 | 2.1 | 108.4 | 26.9 | 7.6 | 603.5 | 15.2 | 14 (96% get one) |
| Artillery | 1.5 | 1.1 | 38.7 | 7.7 | 66.1 | 26.1 | 4.2 | 492.0 | 13.5 | 17 (93% get one) |
| Enchanter | 0.5 | 1.0 | 17.1 | 6.3 | 52.1 | 29.2 | 4.2 | 434.9 | 12.4 | 17 (92% get one) |
| Assassin | 1.9 | 1.4 | 39.6 | 0.9 | 20.5 | 28.9 | 11.7 | 617.0 | 15.0 | 13 (95% get one) |
| Profiteer | 1.2 | 1.3 | 25.1 | 1.1 | 39.7 | 28.8 | 11.4 | 794.0 | 17.1 | 13 (97% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.9 | 237.6 | 456.2 |
| 3v3 | 81.0 | 247.2 | 476.2 |
| 4v4 | 81.9 | 249.0 | 477.0 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 22.4, attack:weapon 7.3, cast:selfHeal 6.0, rest 2.6, cast:crossHeal 1.1, cast:resurrection 0.9, attack:holyStrike 0.8, attack:charge 0.3, cast:smite 0.3, cast:lightning 0.2, cast:nature 0.2, cast:fortify 0.1, cast:iceBlock 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.1, cast:fireball 0.1
- **Crusader:** move 22.1, attack:weapon 5.5, attack:charge 2.7, attack:holyStrike 2.6, cast:selfHeal 2.6, rest 2.3, cast:smite 0.4, cast:lightning 0.3, cast:resurrection 0.3, cast:fireball 0.2, cast:firewall 0.1, cast:iceBlock 0.1, cast:crossHeal 0.1, cast:nature 0.0, cast:poison 0.0, cast:quake 0.0
- **Berserker:** move 21.7, attack:weapon 6.9, attack:heavyStrike 4.7, attack:doubleStrike 1.9, rest 1.6, cast:lightning 0.5, cast:fireball 0.4, cast:iceBlock 0.2, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.0, cast:nature 0.0
- **Warlord:** move 25.5, attack:weapon 9.2, attack:heavyStrike 6.0, attack:doubleStrike 2.1, rest 1.7, cast:lightning 0.4, cast:iceBlock 0.1, cast:quake 0.1, cast:nature 0.1, cast:poison 0.1, cast:fireball 0.1, cast:firewall 0.1, cast:fortify 0.0
- **Sniper:** move 27.5, attack:weapon 24.6, rest 1.0, hunter's mark 0.7, attack:arrowRain 0.6, cast:lightning 0.3, cast:iceBlock 0.3, cast:nature 0.2, cast:fireball 0.1, cast:quake 0.1, cast:firewall 0.0, cast:poison 0.0, cast:fortify 0.0
- **Hunter:** move 26.2, attack:weapon 22.3, rest 1.1, hunter's mark 1.0, cast:iceBlock 0.6, attack:arrowRain 0.1, cast:lightning 0.1, cast:firewall 0.0, cast:fireball 0.0, cast:quake 0.0, cast:nature 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 26.4, cast:mageBolt 13.6, rest 8.1, doublecast 1.3, attack:weapon 0.6, cast:empower 0.2, cast:firewall 0.2, teleport 0.2, cast:fireball 0.1, cast:iceBlock 0.1, cast:cleanse 0.1, cast:lightning 0.0, cast:quake 0.0, cast:poison 0.0
- **Enchanter:** move 24.8, cast:mageBolt 12.0, rest 7.1, cast:empower 2.5, cast:iceBlock 1.2, attack:weapon 1.0, doublecast 0.6, teleport 0.5, cast:cleanse 0.2, cast:firewall 0.1, cast:fortify 0.0, cast:lightning 0.0
- **Assassin:** move 30.5, cast:invisibility 7.5, attack:weapon 6.7, cast:lightning 0.7, rest 0.4, cast:fireball 0.4, cast:firewall 0.3, cast:iceBlock 0.2, cast:quake 0.2, cast:poison 0.1, cast:nature 0.0
- **Profiteer:** move 33.5, cast:invisibility 6.5, attack:weapon 6.4, cast:lightning 1.0, cast:quake 0.8, cast:firewall 0.5, rest 0.5, cast:nature 0.4, cast:fireball 0.2, cast:iceBlock 0.2, cast:poison 0.1, cast:fortify 0.1

(900 games in total.)

## 6. Set duos (2v2)

Each duo plays 150 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 150 | 63% | 85% | 0.36 |
| Berserker + Paladin | 150 | 73% | 93% | 0.06 |
| Artillery + Paladin | 150 | 56% | 67% | 0.24 |
| Sniper + Warlord | 150 | 57% | 78% | 0.08 |
| Assassin + Profiteer | 150 | 57% | 94% | 0.05 |
