# Layer 4 — Full games between bots

Generated 2026-09-30. 120 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 3 (4v4), respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 1, Vengeance +3 at 75%, Double strike 2 mana, barbarian 16 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 120 | 3.8 | 0% | 56% | 27 (20–31) | 43% | 4 | 52% |
| 3v3 | 120 | 5.8 | 0% | 28% | 33 (27–37) | 48% | 5 | 58% |
| 4v4 | 120 | 10.3 | 0% | 4% | 35 (30–36) | 42% | 5 | 44% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 15% | 25% | 38% | 48% | 56% | 44% |
| 3v3 | 2% | 4% | 13% | 17% | 28% | 73% |
| 4v4 | 0% | 0% | 2% | 3% | 4% | 96% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 35% | 33% | 41% | 37% |
| Crusader | Knight | 54% | 49% | 40% | 46% |
| Berserker | Barbarian | 70% | 80% | 66% | 72% |
| Warlord | Barbarian | 66% | 61% | 55% | 59% |
| Sniper | Archer | 51% | 51% | 54% | 53% |
| Hunter | Archer | 39% | 49% | 51% | 48% |
| Artillery | Mage | 49% | 49% | 47% | 48% |
| Enchanter | Mage | 25% | 36% | 41% | 36% |
| Assassin | Thief | 67% | 56% | 64% | 62% |
| Profiteer | Thief | 39% | 33% | 41% | 38% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 46% | 42% | 40% | 42% |
| Barbarian | 68% | 69% | 60% | 65% |
| Archer | 46% | 50% | 53% | 51% |
| Mage | 37% | 43% | 44% | 42% |
| Thief | 51% | 44% | 52% | 49% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.5 | 1.0 | 14.6 | 32.3 | 17.8 | 60.8 | 8.8 | 515.6 | 7.7 | 15 (97% get one) |
| Crusader | 1.1 | 1.5 | 37.9 | 17.5 | 49.3 | 56.9 | 10.7 | 581.1 | 7.5 | 15 (92% get one) |
| Berserker | 2.7 | 1.3 | 66.0 | 4.6 | 163.2 | 34.8 | 11.2 | 775.8 | 6.8 | 12 (98% get one) |
| Warlord | 1.2 | 1.1 | 37.5 | 5.0 | 113.3 | 29.4 | 12.0 | 726.8 | 6.9 | 14 (98% get one) |
| Sniper | 0.8 | 0.8 | 36.1 | 2.1 | 94.1 | 22.0 | 9.5 | 704.3 | 5.9 | 14 (99% get one) |
| Hunter | 0.8 | 0.8 | 24.9 | 3.4 | 110.4 | 23.9 | 9.7 | 704.5 | 6.9 | 14 (97% get one) |
| Artillery | 1.4 | 1.2 | 44.7 | 5.7 | 113.2 | 30.2 | 4.2 | 558.0 | 5.8 | 17 (93% get one) |
| Enchanter | 0.3 | 1.0 | 13.7 | 6.6 | 54.3 | 30.4 | 5.0 | 490.1 | 6.8 | 17 (95% get one) |
| Assassin | 2.2 | 1.3 | 43.7 | 1.3 | 27.7 | 29.6 | 13.6 | 652.8 | 5.0 | 14 (98% get one) |
| Profiteer | 0.1 | 1.1 | 1.2 | 3.0 | 13.2 | 31.1 | 16.4 | 991.2 | 5.0 | 12 (100% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.5 | 236.7 | 461.5 |
| 3v3 | 80.5 | 244.1 | 471.9 |
| 4v4 | 81.8 | 248.8 | 481.2 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 26.4, attack:weapon 8.4, cast:selfHeal 6.3, rest 2.9, cast:crossHeal 1.5, attack:holyStrike 0.8, attack:charge 0.4, cast:fortify 0.2
- **Crusader:** move 28.1, attack:weapon 6.2, attack:charge 3.8, rest 3.4, attack:holyStrike 2.6, cast:selfHeal 2.5, cast:smite 1.3, cast:crossHeal 0.2
- **Berserker:** move 32.2, attack:weapon 12.4, attack:heavyStrike 5.7, attack:doubleStrike 3.8, rest 2.5
- **Warlord:** move 34.1, attack:weapon 12.7, attack:heavyStrike 10.1, rest 2.7
- **Sniper:** move 32.3, attack:weapon 28.4, attack:arrowRain 1.8, rest 1.1
- **Hunter:** move 33.5, attack:weapon 27.1, hunter's mark 1.8, rest 1.8, cast:iceBlock 1.1
- **Artillery:** move 29.7, cast:mageBolt 21.3, rest 4.2, doublecast 1.7, attack:weapon 1.0, cast:fireball 0.1
- **Enchanter:** move 28.3, cast:mageBolt 13.2, rest 7.3, cast:empower 3.4, attack:weapon 1.9, cast:iceBlock 1.3, teleport 0.5, cast:cleanse 0.1
- **Assassin:** move 38.6, cast:invisibility 10.8, attack:weapon 9.1, rest 0.6
- **Profiteer:** move 48.9, attack:weapon 6.2, rest 1.5

(360 games in total.)

## 6. Set duos (2v2)

Each duo plays 60 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 60 | 78% | 90% | 0.50 |
| Berserker + Paladin | 60 | 60% | 68% | 0.05 |
| Artillery + Paladin | 60 | 52% | 45% | 0.12 |
| Sniper + Warlord | 60 | 68% | 48% | 0.10 |
| Assassin + Profiteer | 60 | 52% | 50% | 0.15 |
