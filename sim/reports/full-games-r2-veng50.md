# Layer 4 — Full games between bots

Generated 2026-09-30. 120 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 3 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 1, Vengeance +3 at 50%, Double strike 2 mana, barbarian 16 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 120 | 3.8 | 0% | 57% | 27 (20–31) | 43% | 4 | 52% |
| 3v3 | 120 | 5.8 | 0% | 31% | 31 (26–36) | 48% | 5 | 55% |
| 4v4 | 120 | 10.5 | 0% | 4% | 35 (34–36) | 42% | 5 | 51% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 15% | 23% | 38% | 52% | 57% | 43% |
| 3v3 | 2% | 7% | 14% | 22% | 31% | 69% |
| 4v4 | 0% | 0% | 0% | 3% | 4% | 96% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 35% | 35% | 44% | 39% |
| Crusader | Knight | 56% | 47% | 42% | 47% |
| Berserker | Barbarian | 71% | 78% | 69% | 72% |
| Warlord | Barbarian | 65% | 60% | 48% | 56% |
| Sniper | Archer | 46% | 53% | 47% | 49% |
| Hunter | Archer | 39% | 51% | 54% | 50% |
| Artillery | Mage | 52% | 50% | 51% | 51% |
| Enchanter | Mage | 27% | 40% | 42% | 38% |
| Assassin | Thief | 65% | 54% | 64% | 61% |
| Profiteer | Thief | 39% | 33% | 41% | 38% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 47% | 42% | 43% | 43% |
| Barbarian | 68% | 68% | 58% | 63% |
| Archer | 43% | 52% | 50% | 49% |
| Mage | 39% | 45% | 47% | 44% |
| Thief | 50% | 42% | 52% | 48% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.4 | 1.0 | 14.2 | 32.9 | 18.4 | 60.2 | 8.7 | 512.5 | 7.8 | 15 (98% get one) |
| Crusader | 1.1 | 1.4 | 37.7 | 17.8 | 50.6 | 56.7 | 10.6 | 578.2 | 7.5 | 15 (93% get one) |
| Berserker | 2.6 | 1.4 | 65.9 | 4.4 | 142.5 | 35.3 | 11.3 | 744.7 | 6.8 | 12 (97% get one) |
| Warlord | 1.3 | 1.1 | 37.4 | 5.4 | 104.6 | 29.4 | 12.2 | 711.5 | 6.9 | 14 (98% get one) |
| Sniper | 0.9 | 0.8 | 36.4 | 2.1 | 93.0 | 23.2 | 9.4 | 697.6 | 5.9 | 14 (99% get one) |
| Hunter | 0.8 | 0.9 | 24.5 | 3.2 | 109.8 | 24.3 | 9.7 | 696.2 | 6.9 | 14 (97% get one) |
| Artillery | 1.4 | 1.1 | 44.2 | 5.7 | 113.5 | 29.2 | 4.2 | 552.9 | 5.8 | 17 (93% get one) |
| Enchanter | 0.3 | 1.0 | 14.5 | 6.6 | 53.3 | 30.9 | 5.0 | 486.3 | 6.8 | 17 (95% get one) |
| Assassin | 2.3 | 1.3 | 45.7 | 1.3 | 27.3 | 30.2 | 14.0 | 655.0 | 5.0 | 14 (98% get one) |
| Profiteer | 0.1 | 1.1 | 1.2 | 3.0 | 12.8 | 30.1 | 16.4 | 971.7 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.4 | 235.9 | 460.5 |
| 3v3 | 80.5 | 243.5 | 469.8 |
| 4v4 | 81.7 | 247.8 | 478.1 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 26.5, attack:weapon 8.3, cast:selfHeal 6.5, rest 2.9, cast:crossHeal 1.5, attack:holyStrike 0.7, attack:charge 0.5, cast:fortify 0.2
- **Crusader:** move 28.1, attack:weapon 6.3, attack:charge 3.8, rest 3.2, attack:holyStrike 2.8, cast:selfHeal 2.6, cast:smite 1.2, cast:crossHeal 0.2
- **Berserker:** move 31.0, attack:weapon 10.0, attack:heavyStrike 7.1, attack:doubleStrike 3.5, rest 2.4
- **Warlord:** move 34.0, attack:weapon 12.6, attack:heavyStrike 9.8, rest 2.9
- **Sniper:** move 32.0, attack:weapon 28.2, attack:arrowRain 1.7, rest 1.1
- **Hunter:** move 33.2, attack:weapon 26.8, hunter's mark 1.8, rest 1.6, cast:iceBlock 1.1
- **Artillery:** move 29.7, cast:mageBolt 21.4, rest 4.2, doublecast 1.7, attack:weapon 1.0, cast:fireball 0.1
- **Enchanter:** move 28.0, cast:mageBolt 13.1, rest 7.4, cast:empower 3.5, attack:weapon 1.9, cast:iceBlock 1.4, teleport 0.6, cast:cleanse 0.1
- **Assassin:** move 38.9, cast:invisibility 10.8, attack:weapon 9.2, rest 0.6
- **Profiteer:** move 48.9, attack:weapon 6.1, rest 1.6

(360 games in total.)

## 6. Set duos (2v2)

Each duo plays 60 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 60 | 72% | 85% | 0.50 |
| Berserker + Paladin | 60 | 64% | 58% | 0.05 |
| Artillery + Paladin | 60 | 50% | 42% | 0.12 |
| Sniper + Warlord | 60 | 64% | 45% | 0.07 |
| Assassin + Profiteer | 60 | 54% | 52% | 0.10 |
