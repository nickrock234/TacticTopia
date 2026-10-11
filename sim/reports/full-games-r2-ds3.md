# Layer 4 — Full games between bots

Generated 2026-09-30. 120 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 3 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 1, Vengeance +3 at 75%, Double strike 3 mana, barbarian 16 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 120 | 3.8 | 0% | 57% | 27 (20–33) | 43% | 4 | 52% |
| 3v3 | 120 | 5.8 | 0% | 30% | 31 (26–36) | 48% | 5 | 59% |
| 4v4 | 120 | 10.2 | 0% | 3% | 34 (28–34) | 41% | 5 | 44% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 15% | 25% | 38% | 48% | 57% | 43% |
| 3v3 | 3% | 4% | 14% | 20% | 30% | 70% |
| 4v4 | 0% | 0% | 1% | 2% | 3% | 98% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 38% | 35% | 41% | 39% |
| Crusader | Knight | 54% | 48% | 35% | 44% |
| Berserker | Barbarian | 69% | 75% | 65% | 69% |
| Warlord | Barbarian | 70% | 63% | 54% | 61% |
| Sniper | Archer | 50% | 55% | 51% | 52% |
| Hunter | Archer | 36% | 47% | 55% | 49% |
| Artillery | Mage | 50% | 54% | 52% | 52% |
| Enchanter | Mage | 25% | 30% | 44% | 35% |
| Assassin | Thief | 65% | 53% | 60% | 58% |
| Profiteer | Thief | 37% | 36% | 43% | 39% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 47% | 42% | 38% | 42% |
| Barbarian | 70% | 69% | 59% | 65% |
| Archer | 44% | 52% | 53% | 51% |
| Mage | 37% | 42% | 48% | 44% |
| Thief | 50% | 44% | 51% | 48% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.4 | 1.0 | 14.2 | 32.9 | 17.3 | 61.1 | 8.5 | 508.9 | 7.7 | 15 (97% get one) |
| Crusader | 1.1 | 1.4 | 37.5 | 17.8 | 50.6 | 55.4 | 10.6 | 578.8 | 7.5 | 15 (93% get one) |
| Berserker | 2.5 | 1.3 | 62.3 | 4.3 | 158.1 | 35.1 | 11.1 | 761.4 | 6.8 | 12 (98% get one) |
| Warlord | 1.3 | 1.0 | 38.4 | 4.9 | 111.8 | 28.9 | 12.0 | 724.0 | 6.9 | 14 (98% get one) |
| Sniper | 0.8 | 0.8 | 36.6 | 2.0 | 94.3 | 22.1 | 9.6 | 705.2 | 5.9 | 14 (99% get one) |
| Hunter | 0.8 | 0.8 | 24.1 | 3.3 | 109.7 | 23.1 | 9.7 | 700.9 | 6.9 | 14 (97% get one) |
| Artillery | 1.4 | 1.2 | 45.8 | 5.8 | 114.4 | 30.1 | 4.1 | 559.2 | 5.8 | 17 (92% get one) |
| Enchanter | 0.3 | 1.0 | 14.3 | 6.7 | 53.8 | 31.5 | 5.1 | 489.0 | 6.8 | 17 (95% get one) |
| Assassin | 2.2 | 1.3 | 44.4 | 1.2 | 27.8 | 29.4 | 13.6 | 652.7 | 5.0 | 14 (98% get one) |
| Profiteer | 0.1 | 1.1 | 1.0 | 2.9 | 12.7 | 31.2 | 16.7 | 986.8 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.5 | 236.4 | 460.0 |
| 3v3 | 80.5 | 243.9 | 469.8 |
| 4v4 | 81.8 | 248.5 | 479.8 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 26.1, attack:weapon 8.3, cast:selfHeal 6.5, rest 2.9, cast:crossHeal 1.5, attack:holyStrike 0.7, attack:charge 0.4, cast:fortify 0.2
- **Crusader:** move 28.2, attack:weapon 6.3, attack:charge 3.8, rest 3.4, attack:holyStrike 2.7, cast:selfHeal 2.6, cast:smite 1.2, cast:crossHeal 0.2
- **Berserker:** move 31.7, attack:weapon 12.3, attack:heavyStrike 6.4, attack:doubleStrike 2.9, rest 2.4
- **Warlord:** move 33.9, attack:weapon 12.6, attack:heavyStrike 10.0, rest 2.7
- **Sniper:** move 32.4, attack:weapon 28.4, attack:arrowRain 1.8, rest 1.0
- **Hunter:** move 33.3, attack:weapon 26.9, hunter's mark 1.8, rest 1.7, cast:iceBlock 1.1
- **Artillery:** move 29.9, cast:mageBolt 21.5, rest 4.2, doublecast 1.8, attack:weapon 1.1, cast:fireball 0.1
- **Enchanter:** move 28.4, cast:mageBolt 13.2, rest 7.5, cast:empower 3.5, attack:weapon 1.9, cast:iceBlock 1.4, teleport 0.5, cast:cleanse 0.1
- **Assassin:** move 38.7, cast:invisibility 10.9, attack:weapon 9.2, rest 0.6
- **Profiteer:** move 49.2, attack:weapon 6.1, rest 1.5

(360 games in total.)

## 6. Set duos (2v2)

Each duo plays 60 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 60 | 76% | 80% | 0.58 |
| Berserker + Paladin | 60 | 63% | 62% | 0.07 |
| Artillery + Paladin | 60 | 52% | 40% | 0.12 |
| Sniper + Warlord | 60 | 69% | 47% | 0.10 |
| Assassin + Profiteer | 60 | 53% | 48% | 0.12 |
