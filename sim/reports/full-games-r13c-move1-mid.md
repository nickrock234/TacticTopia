# Layer 4 — Full games between bots

Generated 2026-10-01. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP, movement 3/4/4/3/5, maps 28/36/42.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.3 | 0% | 84% | 25 (19–32) | 47% | 4 | 49% |
| 3v3 | 300 | 7.3 | 1% | 61% | 29 (24–34) | 61% | 5 | 53% |
| 4v4 | 300 | 10.2 | 1% | 45% | 32 (27–36) | 64% | 5 | 49% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 25% | 45% | 61% | 74% | 84% | 16% |
| 3v3 | 8% | 19% | 35% | 49% | 61% | 39% |
| 4v4 | 1% | 7% | 20% | 31% | 45% | 55% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 45% | 40% | 37% | 40% |
| Crusader | Knight | 59% | 55% | 46% | 52% |
| Berserker | Barbarian | 67% | 61% | 63% | 63% |
| Warlord | Barbarian | 58% | 56% | 52% | 54% |
| Sniper | Archer | 35% | 47% | 41% | 42% |
| Hunter | Archer | 49% | 50% | 53% | 51% |
| Artillery | Mage | 53% | 58% | 57% | 57% |
| Enchanter | Mage | 35% | 38% | 43% | 39% |
| Assassin | Thief | 54% | 53% | 58% | 55% |
| Profiteer | Thief | 46% | 42% | 51% | 47% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 52% | 48% | 41% | 46% |
| Barbarian | 62% | 58% | 57% | 58% |
| Archer | 42% | 48% | 47% | 46% |
| Mage | 43% | 48% | 50% | 48% |
| Thief | 50% | 47% | 54% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.7 | 1.2 | 21.0 | 37.7 | 15.0 | 57.8 | 6.9 | 448.7 | 12.9 | 15 (93% get one) |
| Crusader | 1.3 | 1.4 | 40.5 | 21.5 | 38.6 | 53.5 | 9.3 | 525.0 | 13.7 | 14 (92% get one) |
| Berserker | 2.1 | 1.5 | 51.6 | 4.1 | 81.8 | 31.2 | 7.1 | 523.5 | 11.9 | 12 (82% get one) |
| Warlord | 1.5 | 1.3 | 37.2 | 6.3 | 96.6 | 28.5 | 8.3 | 582.8 | 14.2 | 14 (90% get one) |
| Sniper | 0.7 | 1.0 | 24.6 | 5.5 | 91.0 | 25.0 | 6.9 | 602.7 | 15.3 | 14 (97% get one) |
| Hunter | 1.0 | 1.1 | 26.2 | 5.5 | 106.0 | 27.2 | 7.0 | 569.1 | 14.6 | 14 (92% get one) |
| Artillery | 1.5 | 1.0 | 39.9 | 11.5 | 70.3 | 29.7 | 4.4 | 475.4 | 12.8 | 16 (89% get one) |
| Enchanter | 0.6 | 1.0 | 17.3 | 9.1 | 57.5 | 31.9 | 4.4 | 436.5 | 12.3 | 17 (88% get one) |
| Assassin | 1.8 | 1.4 | 37.0 | 2.5 | 16.8 | 29.8 | 11.4 | 583.1 | 14.1 | 13 (95% get one) |
| Profiteer | 1.1 | 1.2 | 24.7 | 2.7 | 35.6 | 29.1 | 11.2 | 779.0 | 16.6 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 79.9 | 239.2 | 460.0 |
| 3v3 | 82.5 | 246.7 | 472.6 |
| 4v4 | 82.4 | 246.7 | 472.9 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 21.2, attack:weapon 7.3, cast:selfHeal 5.8, rest 3.1, cast:crossHeal 1.2, cast:resurrection 0.8, attack:holyStrike 0.7, attack:charge 0.4, cast:smite 0.3, cast:lightning 0.1, cast:firewall 0.1, cast:nature 0.1, cast:fortify 0.1, cast:quake 0.1, cast:iceBlock 0.1, cast:poison 0.0, cast:fireball 0.0
- **Crusader:** move 20.8, attack:weapon 5.0, rest 4.2, attack:charge 3.5, attack:holyStrike 2.9, cast:selfHeal 2.4, cast:smite 0.6, cast:resurrection 0.3, cast:firewall 0.3, cast:lightning 0.2, cast:fireball 0.2, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:poison 0.0, cast:nature 0.0
- **Berserker:** move 20.0, attack:weapon 6.3, attack:heavyStrike 4.7, rest 2.3, attack:doubleStrike 1.9, cast:lightning 0.4, cast:fireball 0.4, cast:firewall 0.1, cast:iceBlock 0.1, cast:inspire 0.1, cast:poison 0.1, cast:quake 0.0, cast:nature 0.0
- **Warlord:** move 24.5, attack:weapon 8.9, attack:heavyStrike 6.0, rest 3.6, attack:doubleStrike 2.2, cast:inspire 0.4, cast:lightning 0.3, cast:quake 0.2, cast:iceBlock 0.1, cast:firewall 0.1, cast:fireball 0.1, cast:nature 0.1, cast:poison 0.1, cast:fortify 0.0
- **Sniper:** move 26.7, attack:weapon 25.0, rest 2.9, attack:arrowRain 0.6, hunter's mark 0.6, cast:lightning 0.3, cast:iceBlock 0.3, cast:fireball 0.2, cast:nature 0.1, cast:quake 0.1, cast:firewall 0.1, cast:poison 0.0
- **Hunter:** move 25.3, attack:weapon 22.4, rest 3.0, hunter's mark 1.0, cast:iceBlock 0.6, attack:arrowRain 0.2, cast:lightning 0.1, cast:nature 0.1, cast:firewall 0.0, cast:fireball 0.0, cast:quake 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 24.0, cast:mageBolt 14.3, rest 9.6, doublecast 1.4, attack:weapon 0.8, cast:firewall 0.2, cast:empower 0.1, cast:fireball 0.1, teleport 0.1, cast:iceBlock 0.1, cast:cleanse 0.0, cast:lightning 0.0, cast:quake 0.0, cast:poison 0.0
- **Enchanter:** move 23.7, cast:mageBolt 13.0, rest 8.3, cast:empower 2.0, cast:iceBlock 1.2, attack:weapon 1.1, doublecast 0.5, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.1, cast:lightning 0.0, cast:quake 0.0, cast:fireball 0.0, cast:poison 0.0
- **Assassin:** move 30.1, cast:invisibility 7.2, attack:weapon 6.3, rest 1.3, cast:lightning 0.6, cast:fireball 0.5, cast:firewall 0.3, cast:iceBlock 0.3, cast:quake 0.1, cast:poison 0.0, cast:nature 0.0
- **Profiteer:** move 33.5, cast:invisibility 6.1, attack:weapon 5.8, rest 1.5, cast:lightning 0.9, cast:quake 0.8, cast:firewall 0.6, cast:nature 0.4, cast:iceBlock 0.2, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.0

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
