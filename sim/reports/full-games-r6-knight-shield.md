# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.3 | 0% | 85% | 25 (20–30) | 48% | 4 | 56% |
| 3v3 | 150 | 7.5 | 0% | 53% | 31 (27–35) | 61% | 5 | 46% |
| 4v4 | 150 | 10.8 | 1% | 42% | 32 (28–36) | 65% | 5 | 47% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 22% | 45% | 66% | 79% | 85% | 15% |
| 3v3 | 3% | 11% | 26% | 41% | 53% | 47% |
| 4v4 | 2% | 7% | 15% | 29% | 42% | 58% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 41% | 39% | 46% | 43% |
| Crusader | Knight | 52% | 54% | 50% | 52% |
| Berserker | Barbarian | 59% | 69% | 65% | 65% |
| Warlord | Barbarian | 66% | 54% | 49% | 55% |
| Sniper | Archer | 46% | 53% | 45% | 48% |
| Hunter | Archer | 36% | 41% | 48% | 43% |
| Artillery | Mage | 56% | 59% | 46% | 52% |
| Enchanter | Mage | 41% | 35% | 35% | 37% |
| Assassin | Thief | 59% | 51% | 60% | 57% |
| Profiteer | Thief | 41% | 40% | 55% | 47% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 47% | 48% | 48% | 48% |
| Barbarian | 63% | 61% | 56% | 59% |
| Archer | 42% | 48% | 46% | 46% |
| Mage | 48% | 48% | 41% | 45% |
| Thief | 49% | 45% | 57% | 51% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.8 | 1.0 | 19.8 | 39.9 | 17.5 | 57.1 | 7.0 | 458.9 | 13.7 | 15 (96% get one) |
| Crusader | 1.1 | 1.5 | 32.1 | 18.7 | 40.4 | 52.8 | 8.9 | 528.4 | 14.2 | 15 (94% get one) |
| Berserker | 2.2 | 1.5 | 51.2 | 3.1 | 88.7 | 30.1 | 8.1 | 566.3 | 13.6 | 12 (91% get one) |
| Warlord | 1.6 | 1.3 | 36.5 | 3.2 | 105.6 | 27.7 | 9.4 | 620.2 | 15.2 | 14 (93% get one) |
| Sniper | 0.8 | 1.1 | 29.2 | 2.0 | 84.8 | 25.3 | 8.1 | 635.5 | 16.1 | 14 (95% get one) |
| Hunter | 0.9 | 1.3 | 25.6 | 2.1 | 108.2 | 28.3 | 7.5 | 601.9 | 15.0 | 14 (91% get one) |
| Artillery | 1.4 | 1.0 | 39.1 | 7.4 | 66.9 | 25.1 | 4.1 | 475.4 | 13.3 | 17 (92% get one) |
| Enchanter | 0.7 | 0.9 | 18.5 | 6.5 | 53.5 | 28.5 | 4.3 | 443.0 | 12.4 | 17 (91% get one) |
| Assassin | 1.9 | 1.4 | 35.8 | 0.8 | 20.2 | 28.6 | 11.7 | 590.7 | 14.5 | 13 (93% get one) |
| Profiteer | 1.1 | 1.4 | 24.3 | 1.2 | 40.1 | 30.3 | 11.4 | 818.6 | 16.9 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.8 | 236.9 | 469.0 |
| 3v3 | 80.7 | 245.5 | 472.2 |
| 4v4 | 82.1 | 250.3 | 481.1 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 21.0, attack:weapon 7.2, cast:selfHeal 6.3, rest 2.4, cast:crossHeal 1.3, cast:resurrection 0.9, attack:holyStrike 0.8, attack:charge 0.3, cast:smite 0.2, cast:lightning 0.2, cast:nature 0.1, cast:fortify 0.1, cast:iceBlock 0.1, cast:fireball 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.1
- **Crusader:** move 21.8, attack:weapon 5.8, attack:charge 2.7, cast:selfHeal 2.6, attack:holyStrike 2.5, rest 2.3, cast:smite 0.4, cast:lightning 0.4, cast:resurrection 0.3, cast:fireball 0.2, cast:firewall 0.1, cast:crossHeal 0.1, cast:iceBlock 0.1, cast:quake 0.0, cast:nature 0.0, cast:poison 0.0
- **Berserker:** move 21.7, attack:weapon 6.9, attack:heavyStrike 4.7, attack:doubleStrike 1.8, rest 1.8, cast:fireball 0.5, cast:lightning 0.4, cast:iceBlock 0.2, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.1, cast:nature 0.0
- **Warlord:** move 26.4, attack:weapon 9.6, attack:heavyStrike 6.3, attack:doubleStrike 2.2, rest 1.7, cast:lightning 0.5, cast:iceBlock 0.2, cast:quake 0.1, cast:fireball 0.1, cast:nature 0.1, cast:firewall 0.1, cast:poison 0.1, cast:fortify 0.0
- **Sniper:** move 27.3, attack:weapon 24.3, rest 1.0, hunter's mark 0.9, attack:arrowRain 0.6, cast:iceBlock 0.3, cast:lightning 0.3, cast:fireball 0.2, cast:nature 0.1, cast:firewall 0.1, cast:poison 0.1, cast:quake 0.0
- **Hunter:** move 26.1, attack:weapon 22.1, rest 1.1, hunter's mark 0.9, cast:iceBlock 0.5, attack:arrowRain 0.2, cast:lightning 0.1, cast:firewall 0.0, cast:fireball 0.0, cast:nature 0.0, cast:quake 0.0
- **Artillery:** move 25.5, cast:mageBolt 13.8, rest 7.5, doublecast 1.4, attack:weapon 0.6, cast:empower 0.2, teleport 0.2, cast:firewall 0.1, cast:fireball 0.1, cast:iceBlock 0.1, cast:cleanse 0.1, cast:lightning 0.0
- **Enchanter:** move 24.6, cast:mageBolt 12.4, rest 7.2, cast:empower 2.5, attack:weapon 1.2, cast:iceBlock 1.1, doublecast 0.5, teleport 0.5, cast:cleanse 0.2, cast:firewall 0.1, cast:fortify 0.0
- **Assassin:** move 29.9, cast:invisibility 7.2, attack:weapon 6.6, cast:lightning 0.6, rest 0.4, cast:fireball 0.3, cast:firewall 0.3, cast:iceBlock 0.2, cast:quake 0.2, cast:poison 0.0, cast:nature 0.0
- **Profiteer:** move 33.0, cast:invisibility 6.6, attack:weapon 6.5, cast:lightning 1.1, cast:quake 0.7, cast:firewall 0.5, rest 0.5, cast:nature 0.3, cast:fireball 0.3, cast:iceBlock 0.3, cast:poison 0.1, cast:fortify 0.1

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 60% | 89% | 0.35 |
| Berserker + Paladin | 75 | 71% | 92% | 0.08 |
| Artillery + Paladin | 75 | 60% | 69% | 0.28 |
| Sniper + Warlord | 75 | 61% | 84% | 0.05 |
| Assassin + Profiteer | 75 | 50% | 87% | 0.05 |
