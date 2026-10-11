# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 16 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.6 | 0% | 89% | 25 (20–31) | 44% | 4 | 53% |
| 3v3 | 150 | 7.5 | 0% | 61% | 30 (26–35) | 59% | 5 | 48% |
| 4v4 | 150 | 10.1 | 0% | 37% | 33 (30–37) | 61% | 5 | 46% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 24% | 46% | 66% | 75% | 89% | 11% |
| 3v3 | 3% | 14% | 31% | 46% | 61% | 39% |
| 4v4 | 1% | 4% | 10% | 22% | 37% | 63% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 40% | 52% | 44% | 46% |
| Crusader | Knight | 48% | 49% | 42% | 46% |
| Berserker | Barbarian | 71% | 67% | 66% | 68% |
| Warlord | Barbarian | 61% | 62% | 54% | 58% |
| Sniper | Archer | 46% | 47% | 52% | 49% |
| Hunter | Archer | 40% | 48% | 42% | 43% |
| Artillery | Mage | 48% | 53% | 57% | 54% |
| Enchanter | Mage | 44% | 35% | 37% | 38% |
| Assassin | Thief | 59% | 51% | 51% | 53% |
| Profiteer | Thief | 40% | 36% | 53% | 45% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 45% | 50% | 43% | 46% |
| Barbarian | 66% | 64% | 59% | 62% |
| Archer | 43% | 48% | 48% | 47% |
| Mage | 46% | 44% | 48% | 46% |
| Thief | 48% | 43% | 52% | 48% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.7 | 1.2 | 20.8 | 32.3 | 18.3 | 61.8 | 7.2 | 457.4 | 13.5 | 15 (96% get one) |
| Crusader | 1.1 | 1.5 | 32.2 | 17.8 | 36.4 | 55.0 | 8.6 | 499.2 | 13.3 | 15 (93% get one) |
| Berserker | 2.3 | 1.4 | 53.3 | 2.9 | 100.2 | 31.4 | 8.0 | 587.3 | 13.9 | 12 (92% get one) |
| Warlord | 1.6 | 1.3 | 40.3 | 3.2 | 103.2 | 31.3 | 9.3 | 613.5 | 15.0 | 14 (93% get one) |
| Sniper | 0.8 | 1.1 | 30.1 | 1.9 | 87.2 | 25.6 | 8.2 | 642.6 | 16.2 | 14 (97% get one) |
| Hunter | 1.0 | 1.2 | 28.8 | 2.1 | 114.8 | 27.9 | 7.8 | 628.0 | 15.4 | 14 (94% get one) |
| Artillery | 1.4 | 1.0 | 39.7 | 7.3 | 67.4 | 25.9 | 4.1 | 488.0 | 13.8 | 17 (91% get one) |
| Enchanter | 0.5 | 1.0 | 19.2 | 6.5 | 53.0 | 30.7 | 4.2 | 440.0 | 12.4 | 17 (92% get one) |
| Assassin | 1.8 | 1.4 | 37.2 | 0.9 | 18.7 | 28.8 | 11.7 | 581.9 | 14.1 | 13 (94% get one) |
| Profiteer | 1.1 | 1.3 | 25.2 | 1.4 | 38.8 | 29.4 | 11.4 | 790.2 | 16.5 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.6 | 236.9 | 451.4 |
| 3v3 | 80.5 | 245.2 | 473.5 |
| 4v4 | 81.9 | 249.0 | 477.5 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 21.6, attack:weapon 7.4, cast:selfHeal 6.6, rest 2.6, cast:crossHeal 1.1, attack:holyStrike 0.9, cast:smite 0.3, attack:charge 0.2, cast:lightning 0.2, cast:firewall 0.1, cast:fortify 0.1, cast:nature 0.1, cast:iceBlock 0.1, cast:quake 0.1, cast:fireball 0.1, cast:poison 0.1
- **Crusader:** move 21.4, attack:weapon 5.6, cast:selfHeal 3.0, rest 2.6, attack:holyStrike 2.5, attack:charge 2.5, cast:smite 0.3, cast:lightning 0.3, cast:firewall 0.1, cast:fireball 0.1, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:nature 0.0, cast:poison 0.0
- **Berserker:** move 22.9, attack:weapon 7.8, attack:heavyStrike 4.9, attack:doubleStrike 2.0, rest 1.6, cast:lightning 0.5, cast:fireball 0.5, cast:firewall 0.1, cast:poison 0.1, cast:iceBlock 0.1, cast:quake 0.1, cast:nature 0.0
- **Warlord:** move 26.7, attack:weapon 9.6, attack:heavyStrike 6.3, attack:doubleStrike 2.4, rest 1.7, cast:lightning 0.5, cast:iceBlock 0.2, cast:nature 0.1, cast:fireball 0.1, cast:quake 0.1, cast:firewall 0.1, cast:poison 0.1, cast:fortify 0.1
- **Sniper:** move 28.1, attack:weapon 25.1, rest 0.9, hunter's mark 0.8, attack:arrowRain 0.7, cast:iceBlock 0.3, cast:lightning 0.2, cast:fireball 0.2, cast:nature 0.2, cast:firewall 0.1, cast:poison 0.0, cast:quake 0.0, cast:fortify 0.0
- **Hunter:** move 27.4, attack:weapon 23.1, rest 1.1, hunter's mark 1.0, cast:iceBlock 0.5, attack:arrowRain 0.2, cast:lightning 0.1, cast:nature 0.1, cast:fireball 0.0, cast:quake 0.0, cast:firewall 0.0, cast:poison 0.0, cast:fortify 0.0
- **Artillery:** move 26.6, cast:mageBolt 13.9, rest 8.0, doublecast 1.4, attack:weapon 0.7, teleport 0.2, cast:firewall 0.2, cast:empower 0.2, cast:iceBlock 0.1, cast:fireball 0.1, cast:cleanse 0.1, cast:poison 0.0, cast:lightning 0.0, cast:quake 0.0
- **Enchanter:** move 24.4, cast:mageBolt 12.4, rest 6.8, cast:empower 2.7, cast:iceBlock 1.3, attack:weapon 1.1, doublecast 0.6, teleport 0.4, cast:cleanse 0.3, cast:firewall 0.0, cast:fortify 0.0
- **Assassin:** move 29.6, cast:invisibility 7.4, attack:weapon 6.7, cast:lightning 0.6, rest 0.4, cast:fireball 0.4, cast:iceBlock 0.2, cast:firewall 0.2, cast:quake 0.1, cast:poison 0.1, cast:nature 0.0
- **Profiteer:** move 33.5, cast:invisibility 6.5, attack:weapon 6.4, cast:lightning 1.1, cast:quake 0.7, rest 0.6, cast:firewall 0.5, cast:nature 0.4, cast:iceBlock 0.3, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.1

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 73% | 97% | 0.41 |
| Berserker + Paladin | 75 | 75% | 92% | 0.01 |
| Artillery + Paladin | 75 | 52% | 67% | 0.32 |
| Sniper + Warlord | 75 | 64% | 77% | 0.13 |
| Assassin + Profiteer | 75 | 68% | 96% | 0.09 |
