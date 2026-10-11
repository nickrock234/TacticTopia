# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 15 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.6 | 0% | 86% | 25 (19–32) | 45% | 4 | 53% |
| 3v3 | 150 | 7.5 | 0% | 65% | 33 (27–37) | 60% | 5 | 44% |
| 4v4 | 150 | 10.3 | 0% | 41% | 33 (31–36) | 61% | 5 | 54% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 25% | 43% | 60% | 75% | 86% | 14% |
| 3v3 | 4% | 11% | 27% | 41% | 65% | 35% |
| 4v4 | 1% | 3% | 10% | 26% | 41% | 59% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 48% | 47% | 44% | 46% |
| Crusader | Knight | 48% | 47% | 50% | 48% |
| Berserker | Barbarian | 64% | 71% | 64% | 66% |
| Warlord | Barbarian | 63% | 59% | 56% | 58% |
| Sniper | Archer | 48% | 51% | 46% | 48% |
| Hunter | Archer | 36% | 54% | 46% | 46% |
| Artillery | Mage | 55% | 53% | 50% | 52% |
| Enchanter | Mage | 37% | 37% | 40% | 38% |
| Assassin | Thief | 60% | 47% | 47% | 50% |
| Profiteer | Thief | 39% | 37% | 55% | 45% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 48% | 47% | 47% | 47% |
| Barbarian | 63% | 64% | 59% | 62% |
| Archer | 42% | 52% | 46% | 47% |
| Mage | 46% | 46% | 46% | 46% |
| Thief | 48% | 41% | 51% | 47% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.7 | 1.1 | 20.3 | 32.0 | 18.3 | 59.5 | 7.1 | 456.6 | 13.6 | 15 (97% get one) |
| Crusader | 1.1 | 1.5 | 32.4 | 17.2 | 38.0 | 54.4 | 8.6 | 505.5 | 13.4 | 15 (92% get one) |
| Berserker | 2.3 | 1.4 | 53.5 | 3.1 | 97.9 | 31.5 | 8.2 | 590.7 | 13.9 | 12 (92% get one) |
| Warlord | 1.5 | 1.3 | 39.1 | 3.4 | 107.5 | 29.3 | 9.5 | 626.1 | 15.5 | 14 (93% get one) |
| Sniper | 0.8 | 1.1 | 30.6 | 1.9 | 86.0 | 25.9 | 8.2 | 640.9 | 16.1 | 14 (96% get one) |
| Hunter | 1.0 | 1.2 | 27.4 | 2.0 | 113.6 | 27.3 | 7.8 | 624.8 | 15.7 | 14 (95% get one) |
| Artillery | 1.4 | 1.0 | 38.7 | 7.5 | 67.5 | 25.7 | 4.0 | 475.3 | 13.5 | 17 (92% get one) |
| Enchanter | 0.5 | 1.1 | 18.3 | 6.4 | 54.1 | 31.8 | 4.2 | 443.5 | 12.6 | 17 (94% get one) |
| Assassin | 1.8 | 1.4 | 37.3 | 0.8 | 18.8 | 28.6 | 11.5 | 586.0 | 14.1 | 13 (94% get one) |
| Profiteer | 1.1 | 1.3 | 24.9 | 1.1 | 38.4 | 30.0 | 11.4 | 787.8 | 16.5 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.5 | 237.4 | 452.7 |
| 3v3 | 80.5 | 245.4 | 471.7 |
| 4v4 | 81.9 | 249.5 | 478.4 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 21.7, attack:weapon 7.3, cast:selfHeal 6.5, rest 2.7, cast:crossHeal 1.2, attack:holyStrike 0.7, cast:smite 0.3, attack:charge 0.3, cast:lightning 0.2, cast:firewall 0.1, cast:fortify 0.1, cast:nature 0.1, cast:fireball 0.1, cast:quake 0.1, cast:poison 0.1, cast:iceBlock 0.1
- **Crusader:** move 21.6, attack:weapon 5.6, cast:selfHeal 2.9, rest 2.6, attack:charge 2.5, attack:holyStrike 2.4, cast:smite 0.4, cast:lightning 0.3, cast:fireball 0.2, cast:firewall 0.1, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:nature 0.0, cast:poison 0.0
- **Berserker:** move 22.8, attack:weapon 7.4, attack:heavyStrike 5.0, attack:doubleStrike 2.1, rest 1.7, cast:fireball 0.5, cast:lightning 0.5, cast:firewall 0.1, cast:iceBlock 0.1, cast:poison 0.1, cast:quake 0.1, cast:nature 0.0
- **Warlord:** move 27.1, attack:weapon 9.8, attack:heavyStrike 6.6, attack:doubleStrike 2.3, rest 1.8, cast:lightning 0.5, cast:quake 0.1, cast:fireball 0.1, cast:iceBlock 0.1, cast:firewall 0.1, cast:poison 0.1, cast:nature 0.1, cast:fortify 0.0
- **Sniper:** move 27.5, attack:weapon 24.9, rest 0.9, hunter's mark 0.8, attack:arrowRain 0.7, cast:iceBlock 0.3, cast:lightning 0.3, cast:nature 0.2, cast:fireball 0.2, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.0, cast:fortify 0.0
- **Hunter:** move 27.4, attack:weapon 23.1, rest 1.0, hunter's mark 0.9, cast:iceBlock 0.5, attack:arrowRain 0.2, cast:lightning 0.1, cast:nature 0.0, cast:firewall 0.0, cast:fireball 0.0, cast:quake 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 26.4, cast:mageBolt 13.9, rest 7.9, doublecast 1.3, attack:weapon 0.6, teleport 0.2, cast:firewall 0.2, cast:empower 0.2, cast:iceBlock 0.1, cast:fireball 0.1, cast:cleanse 0.1, cast:lightning 0.0, cast:poison 0.0, cast:quake 0.0
- **Enchanter:** move 24.5, cast:mageBolt 12.6, rest 7.0, cast:empower 2.7, cast:iceBlock 1.2, attack:weapon 1.2, doublecast 0.5, teleport 0.4, cast:cleanse 0.2, cast:firewall 0.0, cast:fortify 0.0
- **Assassin:** move 29.5, cast:invisibility 7.3, attack:weapon 6.7, cast:lightning 0.6, rest 0.4, cast:fireball 0.4, cast:iceBlock 0.2, cast:firewall 0.2, cast:quake 0.1, cast:poison 0.1, cast:nature 0.0
- **Profiteer:** move 33.3, cast:invisibility 6.6, attack:weapon 6.5, cast:lightning 1.1, cast:quake 0.6, cast:firewall 0.6, rest 0.5, cast:nature 0.3, cast:iceBlock 0.2, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.1

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 64% | 84% | 0.40 |
| Berserker + Paladin | 75 | 76% | 93% | 0.03 |
| Artillery + Paladin | 75 | 49% | 61% | 0.33 |
| Sniper + Warlord | 75 | 59% | 81% | 0.11 |
| Assassin + Profiteer | 75 | 69% | 95% | 0.08 |
