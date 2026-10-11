# Layer 4 — Full games between bots

Generated 2026-10-01. 300 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), respawn after one full round, Resurrection range 4, Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 14 HP, movement 3/4/4/3/5, maps 32/42/48.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 300 | 4.1 | 0% | 78% | 25 (19–31) | 48% | 5 | 53% |
| 3v3 | 300 | 6.6 | 1% | 47% | 31 (25–36) | 56% | 6 | 47% |
| 4v4 | 300 | 8.8 | 1% | 31% | 32 (26–36) | 57% | 7 | 45% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 24% | 43% | 58% | 67% | 78% | 22% |
| 3v3 | 4% | 12% | 22% | 34% | 47% | 53% |
| 4v4 | 1% | 5% | 13% | 22% | 31% | 69% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 40% | 39% | 41% | 40% |
| Crusader | Knight | 59% | 51% | 48% | 51% |
| Berserker | Barbarian | 75% | 58% | 65% | 65% |
| Warlord | Barbarian | 56% | 58% | 53% | 56% |
| Sniper | Archer | 48% | 48% | 43% | 46% |
| Hunter | Archer | 41% | 51% | 57% | 51% |
| Artillery | Mage | 55% | 56% | 51% | 53% |
| Enchanter | Mage | 41% | 41% | 42% | 41% |
| Assassin | Thief | 49% | 52% | 54% | 52% |
| Profiteer | Thief | 38% | 46% | 47% | 45% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 49% | 45% | 44% | 46% |
| Barbarian | 64% | 58% | 59% | 60% |
| Archer | 45% | 50% | 50% | 49% |
| Mage | 48% | 48% | 47% | 47% |
| Thief | 43% | 49% | 50% | 48% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.5 | 1.0 | 16.6 | 30.8 | 17.1 | 47.7 | 5.5 | 466.5 | 13.2 | 15 (96% get one) |
| Crusader | 1.1 | 1.4 | 35.0 | 22.0 | 43.2 | 53.6 | 8.0 | 558.6 | 14.4 | 15 (95% get one) |
| Berserker | 2.1 | 1.5 | 50.3 | 4.8 | 84.0 | 30.7 | 7.3 | 582.8 | 13.5 | 12 (90% get one) |
| Warlord | 1.4 | 1.1 | 34.1 | 6.3 | 115.0 | 25.9 | 7.0 | 633.7 | 15.6 | 14 (94% get one) |
| Sniper | 0.6 | 0.7 | 19.8 | 4.9 | 104.5 | 19.7 | 5.1 | 619.9 | 15.7 | 15 (97% get one) |
| Hunter | 0.9 | 0.8 | 22.6 | 4.9 | 127.7 | 21.2 | 5.0 | 604.8 | 15.2 | 14 (96% get one) |
| Artillery | 1.2 | 0.8 | 31.4 | 13.4 | 76.0 | 27.7 | 3.4 | 508.5 | 13.7 | 16 (91% get one) |
| Enchanter | 0.5 | 0.8 | 14.7 | 11.5 | 65.6 | 31.4 | 3.2 | 455.7 | 12.9 | 17 (93% get one) |
| Assassin | 1.6 | 1.4 | 37.1 | 2.7 | 17.3 | 31.0 | 10.8 | 659.7 | 14.5 | 13 (94% get one) |
| Profiteer | 0.9 | 1.1 | 23.1 | 3.5 | 45.6 | 28.2 | 10.6 | 882.7 | 17.0 | 12 (97% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 81.2 | 242.4 | 467.2 |
| 3v3 | 81.2 | 245.1 | 474.6 |
| 4v4 | 81.1 | 245.4 | 475.1 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 23.7, attack:weapon 6.7, rest 4.7, cast:selfHeal 4.4, cast:crossHeal 1.1, cast:resurrection 0.8, attack:holyStrike 0.7, attack:charge 0.3, cast:smite 0.2, cast:firewall 0.2, cast:lightning 0.1, cast:nature 0.1, cast:fortify 0.1, cast:poison 0.1, cast:quake 0.1, cast:iceBlock 0.0, cast:fireball 0.0
- **Crusader:** move 22.2, attack:weapon 5.2, rest 4.5, attack:charge 3.5, cast:selfHeal 2.7, attack:holyStrike 2.5, cast:smite 0.6, cast:lightning 0.3, cast:resurrection 0.3, cast:firewall 0.3, cast:fireball 0.2, cast:iceBlock 0.1, cast:crossHeal 0.1, cast:quake 0.0, cast:nature 0.0, cast:poison 0.0
- **Berserker:** move 21.9, attack:weapon 5.6, attack:heavyStrike 4.9, rest 2.8, attack:doubleStrike 2.1, cast:fireball 0.4, cast:lightning 0.3, cast:firewall 0.2, cast:iceBlock 0.1, cast:inspire 0.1, cast:poison 0.1, cast:quake 0.0, cast:nature 0.0
- **Warlord:** move 27.2, attack:weapon 9.4, attack:heavyStrike 6.5, rest 3.8, attack:doubleStrike 2.8, cast:lightning 0.4, cast:inspire 0.4, cast:firewall 0.2, cast:iceBlock 0.1, cast:quake 0.1, cast:fireball 0.1, cast:nature 0.1, cast:poison 0.1
- **Sniper:** move 27.5, attack:weapon 26.9, rest 2.7, hunter's mark 0.6, attack:arrowRain 0.4, cast:lightning 0.3, cast:fireball 0.2, cast:iceBlock 0.2, cast:nature 0.1, cast:poison 0.1, cast:firewall 0.1, cast:quake 0.1
- **Hunter:** move 27.6, attack:weapon 24.7, rest 2.9, hunter's mark 1.0, cast:iceBlock 0.5, attack:arrowRain 0.1, cast:lightning 0.1, cast:nature 0.0, cast:firewall 0.0, cast:quake 0.0, cast:fireball 0.0, cast:fortify 0.0, cast:poison 0.0
- **Artillery:** move 26.3, cast:mageBolt 14.4, rest 11.8, doublecast 1.2, attack:weapon 0.9, cast:firewall 0.2, cast:empower 0.1, teleport 0.1, cast:fireball 0.1, cast:iceBlock 0.1, cast:cleanse 0.0, cast:lightning 0.0, cast:poison 0.0, cast:quake 0.0
- **Enchanter:** move 25.3, cast:mageBolt 14.0, rest 10.5, cast:empower 1.5, cast:iceBlock 1.1, attack:weapon 0.9, doublecast 0.6, teleport 0.4, cast:cleanse 0.1, cast:firewall 0.1, cast:lightning 0.0, cast:fireball 0.0, cast:quake 0.0, cast:fortify 0.0, cast:poison 0.0
- **Assassin:** move 29.7, cast:invisibility 6.8, attack:weapon 6.6, rest 1.4, cast:lightning 0.7, cast:firewall 0.5, cast:fireball 0.4, cast:iceBlock 0.2, cast:quake 0.2, cast:nature 0.0, cast:poison 0.0
- **Profiteer:** move 33.1, attack:weapon 6.9, cast:invisibility 6.7, rest 2.0, cast:lightning 1.1, cast:quake 0.7, cast:firewall 0.6, cast:nature 0.6, cast:iceBlock 0.3, cast:fireball 0.2, cast:poison 0.1, cast:fortify 0.0

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
