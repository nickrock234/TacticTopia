# Layer 4 — Full games between bots

Generated 2026-09-30. 120 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 3 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 16 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 120 | 4.0 | 0% | 64% | 24 (19–31) | 44% | 4 | 54% |
| 3v3 | 120 | 6.3 | 0% | 42% | 31 (26–37) | 51% | 5 | 57% |
| 4v4 | 120 | 11.3 | 0% | 3% | 36 (30–36) | 47% | 5 | 47% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 23% | 35% | 48% | 57% | 64% | 36% |
| 3v3 | 4% | 10% | 19% | 27% | 42% | 58% |
| 4v4 | 0% | 0% | 1% | 1% | 3% | 98% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 46% | 47% | 40% | 43% |
| Crusader | Knight | 52% | 50% | 51% | 51% |
| Berserker | Barbarian | 77% | 78% | 70% | 74% |
| Warlord | Barbarian | 73% | 51% | 50% | 56% |
| Sniper | Archer | 46% | 49% | 49% | 48% |
| Hunter | Archer | 36% | 44% | 48% | 44% |
| Artillery | Mage | 53% | 61% | 49% | 54% |
| Enchanter | Mage | 30% | 38% | 35% | 35% |
| Assassin | Thief | 50% | 57% | 66% | 59% |
| Profiteer | Thief | 34% | 28% | 41% | 35% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 49% | 49% | 46% | 48% |
| Barbarian | 75% | 63% | 59% | 64% |
| Archer | 41% | 47% | 48% | 47% |
| Mage | 41% | 49% | 42% | 44% |
| Thief | 42% | 41% | 53% | 46% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.6 | 1.1 | 18.0 | 31.5 | 17.5 | 61.8 | 8.3 | 518.2 | 7.7 | 15 (97% get one) |
| Crusader | 1.3 | 1.5 | 40.5 | 19.3 | 44.8 | 59.6 | 9.6 | 553.7 | 7.5 | 15 (93% get one) |
| Berserker | 2.9 | 1.3 | 66.7 | 3.8 | 135.4 | 33.8 | 9.9 | 715.4 | 6.6 | 12 (93% get one) |
| Warlord | 1.5 | 1.3 | 40.2 | 4.2 | 100.8 | 31.6 | 10.9 | 682.3 | 6.8 | 14 (94% get one) |
| Sniper | 0.8 | 0.9 | 34.6 | 1.9 | 92.6 | 23.0 | 9.0 | 701.6 | 5.8 | 14 (98% get one) |
| Hunter | 0.7 | 1.0 | 21.5 | 2.8 | 109.8 | 25.8 | 9.4 | 679.4 | 6.9 | 14 (97% get one) |
| Artillery | 1.4 | 1.1 | 42.7 | 5.7 | 113.7 | 28.2 | 4.0 | 546.4 | 5.8 | 17 (91% get one) |
| Enchanter | 0.3 | 1.1 | 16.7 | 6.2 | 52.0 | 31.9 | 4.8 | 475.7 | 6.7 | 17 (94% get one) |
| Assassin | 2.3 | 1.4 | 46.1 | 1.2 | 26.6 | 31.1 | 13.3 | 631.6 | 4.9 | 13 (96% get one) |
| Profiteer | 0.1 | 1.3 | 1.7 | 2.3 | 11.7 | 30.5 | 15.0 | 904.9 | 4.9 | 12 (98% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.3 | 235.5 | 452.0 |
| 3v3 | 80.6 | 243.7 | 467.0 |
| 4v4 | 81.9 | 248.3 | 477.4 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 25.5, attack:weapon 8.5, cast:selfHeal 6.2, rest 2.7, cast:crossHeal 1.3, attack:holyStrike 1.2, attack:charge 0.5, cast:fortify 0.3
- **Crusader:** move 24.9, attack:weapon 6.5, attack:charge 3.4, cast:selfHeal 3.2, attack:holyStrike 3.0, rest 2.9, cast:smite 1.0, cast:crossHeal 0.1
- **Berserker:** move 28.9, attack:weapon 11.0, attack:heavyStrike 5.8, attack:doubleStrike 3.3, rest 2.1
- **Warlord:** move 30.8, attack:weapon 12.0, attack:heavyStrike 9.9, rest 2.3
- **Sniper:** move 31.3, attack:weapon 27.9, attack:arrowRain 1.6, rest 1.0
- **Hunter:** move 31.8, attack:weapon 26.3, rest 1.4, hunter's mark 1.4, cast:iceBlock 0.8
- **Artillery:** move 28.5, cast:mageBolt 21.3, rest 4.1, doublecast 1.6, attack:weapon 1.0, cast:fireball 0.1
- **Enchanter:** move 26.5, cast:mageBolt 13.2, rest 6.8, cast:empower 3.4, attack:weapon 2.3, cast:iceBlock 1.7, teleport 0.5, cast:cleanse 0.1
- **Assassin:** move 36.8, cast:invisibility 9.9, attack:weapon 9.3, rest 0.6
- **Profiteer:** move 46.1, attack:weapon 5.9, rest 1.2

(360 games in total.)

## 6. Set duos (2v2)

Each duo plays 60 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 60 | 75% | 90% | 0.60 |
| Berserker + Paladin | 60 | 80% | 87% | 0.02 |
| Artillery + Paladin | 60 | 53% | 55% | 0.17 |
| Sniper + Warlord | 60 | 65% | 57% | 0.07 |
| Assassin + Profiteer | 60 | 50% | 50% | 0.08 |
