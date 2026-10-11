# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 16 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.3 | 0% | 84% | 25 (20–32) | 48% | 4 | 52% |
| 3v3 | 150 | 7.1 | 0% | 53% | 30 (25–35) | 57% | 5 | 53% |
| 4v4 | 150 | 9.9 | 0% | 35% | 33 (30–37) | 61% | 5 | 45% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 23% | 45% | 60% | 73% | 84% | 16% |
| 3v3 | 4% | 15% | 28% | 41% | 53% | 47% |
| 4v4 | 1% | 2% | 11% | 20% | 35% | 65% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 40% | 51% | 45% | 46% |
| Crusader | Knight | 48% | 47% | 44% | 46% |
| Berserker | Barbarian | 75% | 71% | 71% | 72% |
| Warlord | Barbarian | 64% | 60% | 54% | 58% |
| Sniper | Archer | 46% | 53% | 51% | 50% |
| Hunter | Archer | 38% | 42% | 46% | 43% |
| Artillery | Mage | 54% | 57% | 53% | 54% |
| Enchanter | Mage | 44% | 41% | 37% | 40% |
| Assassin | Thief | 57% | 57% | 54% | 56% |
| Profiteer | Thief | 34% | 25% | 44% | 35% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 44% | 49% | 44% | 46% |
| Barbarian | 69% | 65% | 62% | 64% |
| Archer | 42% | 48% | 49% | 47% |
| Mage | 49% | 49% | 45% | 47% |
| Thief | 44% | 39% | 49% | 45% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.7 | 1.1 | 22.0 | 31.9 | 18.4 | 60.8 | 7.3 | 465.6 | 13.6 | 15 (96% get one) |
| Crusader | 1.1 | 1.5 | 33.2 | 16.8 | 37.3 | 53.9 | 8.8 | 503.8 | 13.4 | 15 (93% get one) |
| Berserker | 2.4 | 1.3 | 55.9 | 2.9 | 102.6 | 30.7 | 8.4 | 584.1 | 14.1 | 12 (92% get one) |
| Warlord | 1.6 | 1.2 | 40.8 | 3.1 | 105.7 | 29.1 | 9.5 | 624.5 | 15.4 | 14 (93% get one) |
| Sniper | 0.8 | 1.0 | 30.9 | 1.9 | 87.4 | 24.2 | 8.4 | 655.3 | 16.5 | 14 (97% get one) |
| Hunter | 1.0 | 1.1 | 28.8 | 2.2 | 121.6 | 27.1 | 7.7 | 645.8 | 15.9 | 14 (94% get one) |
| Artillery | 1.2 | 0.9 | 38.6 | 7.6 | 67.4 | 24.6 | 4.1 | 496.3 | 13.6 | 17 (90% get one) |
| Enchanter | 0.5 | 0.9 | 17.9 | 6.3 | 54.4 | 27.8 | 4.3 | 445.6 | 12.4 | 17 (92% get one) |
| Assassin | 2.0 | 1.3 | 40.4 | 0.9 | 19.0 | 28.5 | 11.9 | 589.7 | 14.5 | 13 (94% get one) |
| Profiteer | 0.5 | 1.3 | 8.4 | 1.0 | 26.3 | 28.8 | 13.2 | 826.4 | 16.8 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.6 | 236.8 | 454.9 |
| 3v3 | 80.5 | 245.1 | 472.7 |
| 4v4 | 81.9 | 248.6 | 478.0 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 22.2, attack:weapon 7.6, cast:selfHeal 6.6, rest 2.7, cast:crossHeal 1.0, attack:holyStrike 0.9, cast:smite 0.3, attack:charge 0.2, cast:nature 0.2, cast:lightning 0.1, cast:fortify 0.1, cast:firewall 0.1, cast:iceBlock 0.1, cast:quake 0.1, cast:fireball 0.1, cast:poison 0.1
- **Crusader:** move 21.9, attack:weapon 5.6, cast:selfHeal 2.8, rest 2.6, attack:charge 2.6, attack:holyStrike 2.5, cast:smite 0.4, cast:lightning 0.3, cast:fireball 0.2, cast:firewall 0.1, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:poison 0.0, cast:quake 0.0, cast:nature 0.0
- **Berserker:** move 23.4, attack:weapon 8.0, attack:heavyStrike 5.0, attack:doubleStrike 2.2, rest 1.6, cast:lightning 0.6, cast:fireball 0.5, cast:firewall 0.2, cast:poison 0.1, cast:iceBlock 0.1, cast:quake 0.1, cast:nature 0.0
- **Warlord:** move 27.3, attack:weapon 10.0, attack:heavyStrike 6.6, attack:doubleStrike 2.4, rest 1.7, cast:lightning 0.5, cast:iceBlock 0.2, cast:fireball 0.1, cast:firewall 0.1, cast:quake 0.1, cast:nature 0.1, cast:poison 0.1, cast:fortify 0.1
- **Sniper:** move 28.6, attack:weapon 25.6, rest 1.0, hunter's mark 0.8, attack:arrowRain 0.7, cast:lightning 0.3, cast:iceBlock 0.3, cast:fireball 0.2, cast:nature 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.0, cast:fortify 0.0
- **Hunter:** move 28.4, attack:weapon 24.2, rest 1.1, hunter's mark 1.0, cast:iceBlock 0.5, attack:arrowRain 0.2, cast:lightning 0.1, cast:nature 0.0, cast:quake 0.0, cast:firewall 0.0, cast:fireball 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 27.0, cast:mageBolt 13.8, rest 8.4, doublecast 1.3, attack:weapon 0.7, cast:empower 0.2, teleport 0.2, cast:firewall 0.2, cast:fireball 0.1, cast:iceBlock 0.1, cast:cleanse 0.1, cast:poison 0.0, cast:lightning 0.0
- **Enchanter:** move 24.7, cast:mageBolt 12.6, rest 6.9, cast:empower 2.8, attack:weapon 1.2, cast:iceBlock 1.2, doublecast 0.5, teleport 0.5, cast:cleanse 0.2, cast:firewall 0.0, cast:fortify 0.0
- **Assassin:** move 30.2, cast:invisibility 7.6, attack:weapon 6.8, cast:lightning 0.6, rest 0.4, cast:fireball 0.4, cast:firewall 0.3, cast:iceBlock 0.2, cast:quake 0.2, cast:poison 0.1, cast:nature 0.0
- **Profiteer:** move 38.1, attack:weapon 4.8, cast:invisibility 3.3, cast:lightning 0.9, rest 0.5, cast:iceBlock 0.4, cast:firewall 0.4, cast:nature 0.3, cast:quake 0.2, cast:fortify 0.1, cast:fireball 0.1, cast:poison 0.1

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 77% | 97% | 0.51 |
| Berserker + Paladin | 75 | 77% | 95% | 0.01 |
| Artillery + Paladin | 75 | 56% | 64% | 0.31 |
| Sniper + Warlord | 75 | 65% | 72% | 0.12 |
| Assassin + Profiteer | 75 | 43% | 81% | 0.17 |
