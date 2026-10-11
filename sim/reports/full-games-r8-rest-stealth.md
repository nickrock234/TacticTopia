# Layer 4 — Full games between bots

Generated 2026-10-01. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.5 | 1% | 84% | 25 (21–32) | 49% | 4 | 51% |
| 3v3 | 300 | 7.7 | 1% | 61% | 31 (27–35) | 62% | 5 | 53% |
| 4v4 | 300 | 10.5 | 1% | 44% | 34 (29–37) | 64% | 5 | 49% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 19% | 44% | 59% | 74% | 84% | 16% |
| 3v3 | 1% | 9% | 29% | 47% | 61% | 39% |
| 4v4 | 0% | 6% | 13% | 27% | 44% | 56% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 40% | 41% | 43% | 42% |
| Crusader | Knight | 52% | 41% | 48% | 47% |
| Berserker | Barbarian | 63% | 70% | 64% | 66% |
| Warlord | Barbarian | 63% | 56% | 53% | 56% |
| Sniper | Archer | 50% | 47% | 55% | 51% |
| Hunter | Archer | 44% | 47% | 47% | 47% |
| Artillery | Mage | 50% | 58% | 52% | 53% |
| Enchanter | Mage | 32% | 36% | 37% | 35% |
| Assassin | Thief | 55% | 54% | 51% | 53% |
| Profiteer | Thief | 52% | 49% | 50% | 50% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 46% | 41% | 45% | 44% |
| Barbarian | 63% | 62% | 58% | 61% |
| Archer | 47% | 47% | 51% | 49% |
| Mage | 40% | 47% | 45% | 44% |
| Thief | 54% | 51% | 50% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.6 | 1.2 | 18.6 | 37.5 | 17.9 | 58.7 | 7.1 | 465.5 | 13.6 | 15 (98% get one) |
| Crusader | 1.2 | 1.5 | 35.7 | 22.2 | 40.6 | 55.1 | 8.9 | 526.2 | 14.3 | 15 (96% get one) |
| Berserker | 2.2 | 1.6 | 52.7 | 5.0 | 93.3 | 32.5 | 8.2 | 584.2 | 13.7 | 12 (92% get one) |
| Warlord | 1.7 | 1.3 | 40.3 | 6.8 | 101.5 | 29.8 | 9.3 | 627.4 | 15.4 | 14 (94% get one) |
| Sniper | 0.8 | 1.1 | 32.2 | 7.0 | 86.3 | 27.9 | 8.0 | 636.4 | 16.4 | 14 (97% get one) |
| Hunter | 1.2 | 1.2 | 30.5 | 6.2 | 114.5 | 29.3 | 7.7 | 625.1 | 15.8 | 14 (95% get one) |
| Artillery | 1.4 | 1.0 | 39.4 | 11.3 | 74.1 | 28.8 | 4.2 | 492.1 | 13.4 | 16 (91% get one) |
| Enchanter | 0.6 | 1.0 | 18.1 | 9.0 | 57.7 | 32.8 | 4.1 | 442.7 | 12.6 | 17 (93% get one) |
| Assassin | 1.9 | 1.5 | 41.1 | 2.6 | 19.4 | 30.8 | 11.9 | 619.9 | 15.2 | 13 (96% get one) |
| Profiteer | 1.1 | 1.3 | 25.5 | 2.8 | 38.5 | 30.1 | 11.5 | 790.7 | 17.0 | 13 (97% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 79.1 | 238.8 | 460.6 |
| 3v3 | 81.4 | 248.0 | 478.0 |
| 4v4 | 82.2 | 250.0 | 479.6 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 21.7, attack:weapon 6.9, cast:selfHeal 5.7, rest 2.9, cast:crossHeal 1.0, cast:resurrection 1.0, attack:holyStrike 0.7, attack:charge 0.3, cast:smite 0.2, cast:lightning 0.1, cast:firewall 0.1, cast:fortify 0.1, cast:nature 0.1, cast:quake 0.1, cast:fireball 0.1, cast:poison 0.1, cast:iceBlock 0.1
- **Crusader:** move 21.5, attack:weapon 5.5, rest 4.1, attack:holyStrike 2.9, cast:selfHeal 2.8, attack:charge 2.7, cast:smite 0.5, cast:lightning 0.3, cast:resurrection 0.3, cast:firewall 0.2, cast:fireball 0.2, cast:iceBlock 0.1, cast:crossHeal 0.1, cast:poison 0.0, cast:nature 0.0, cast:quake 0.0
- **Berserker:** move 21.4, attack:weapon 7.1, attack:heavyStrike 4.8, rest 2.8, attack:doubleStrike 2.0, cast:lightning 0.5, cast:fireball 0.4, cast:firewall 0.1, cast:iceBlock 0.1, cast:poison 0.1, cast:quake 0.0, cast:nature 0.0
- **Warlord:** move 25.2, attack:weapon 9.2, attack:heavyStrike 6.6, rest 3.8, attack:doubleStrike 2.3, cast:lightning 0.5, cast:iceBlock 0.2, cast:fireball 0.1, cast:quake 0.1, cast:firewall 0.1, cast:nature 0.1, cast:poison 0.1, cast:fortify 0.0
- **Sniper:** move 26.8, attack:weapon 25.0, rest 3.7, hunter's mark 1.0, attack:arrowRain 0.7, cast:lightning 0.3, cast:iceBlock 0.3, cast:fireball 0.2, cast:nature 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.0, cast:fortify 0.0
- **Hunter:** move 26.0, attack:weapon 23.1, rest 3.3, hunter's mark 1.1, cast:iceBlock 0.6, attack:arrowRain 0.2, cast:lightning 0.1, cast:firewall 0.1, cast:nature 0.0, cast:fireball 0.0, cast:quake 0.0, cast:poison 0.0, cast:fortify 0.0
- **Artillery:** move 25.1, cast:mageBolt 14.8, rest 10.2, doublecast 1.4, attack:weapon 0.7, cast:firewall 0.2, teleport 0.2, cast:empower 0.2, cast:fireball 0.1, cast:cleanse 0.1, cast:iceBlock 0.1, cast:poison 0.0, cast:lightning 0.0, cast:quake 0.0
- **Enchanter:** move 23.7, cast:mageBolt 13.1, rest 8.2, cast:empower 2.6, cast:iceBlock 1.2, attack:weapon 1.1, doublecast 0.6, teleport 0.5, cast:cleanse 0.2, cast:firewall 0.1, cast:fortify 0.0, cast:lightning 0.0
- **Assassin:** move 30.5, cast:invisibility 7.6, attack:weapon 6.8, rest 1.3, cast:lightning 0.7, cast:fireball 0.4, cast:firewall 0.4, cast:iceBlock 0.2, cast:quake 0.2, cast:poison 0.0, cast:nature 0.0
- **Profiteer:** move 33.1, cast:invisibility 6.6, attack:weapon 6.4, rest 1.5, cast:lightning 1.1, cast:quake 0.8, cast:firewall 0.4, cast:nature 0.4, cast:fireball 0.3, cast:iceBlock 0.2, cast:poison 0.1, cast:fortify 0.0

(900 games in total.)

## 6. Set duos (2v2)

Each duo plays 150 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 150 | 59% | 87% | 0.31 |
| Berserker + Paladin | 150 | 77% | 93% | 0.09 |
| Artillery + Paladin | 150 | 54% | 73% | 0.17 |
| Sniper + Warlord | 150 | 61% | 85% | 0.11 |
| Assassin + Profiteer | 150 | 54% | 87% | 0.05 |
