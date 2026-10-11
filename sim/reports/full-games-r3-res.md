# Layer 4 — Full games between bots

Generated 2026-09-30. 150 games per mode on generated maps (2v2 24×24, 3v3 32×32, 4v4 36×36), every rule in `engine/`, teams drawn at random from the ten archetypes in `Archetypes.md`. Games end when a whole team is dead at once, or are stopped after round 40. **The bots are rule-based and far from expert**: trust big patterns (who never wins, what never gets used, how long games run), not small differences.

Variant: elimination on death 2 (2v2/3v3) or 2 (4v4), resurrected deaths excluded, respawn wait +1 per death (cap 3), Mage bolt 5, Fireball 3, Monastery +2, engaged move penalty 2, Vengeance +2 at 75%, Double strike 2 mana, barbarian 16 HP.

## 1. How games go

| Mode | Games | Deaths per game | Deaths at the respawn cap | Ended by a team wipe | End round (median, middle half) | Unfinished games: most of one team dead at once (avg) | First hero-vs-hero damage (median round) | First-moving team wins or leads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 150 | 4.1 | 0% | 69% | 23 (19–31) | 45% | 4 | 50% |
| 3v3 | 150 | 6.4 | 0% | 41% | 31 (26–37) | 52% | 5 | 52% |
| 4v4 | 150 | 8.8 | 0% | 23% | 34 (30–37) | 54% | 5 | 52% |

Games ending by elimination (a whole team out or dead at once), by round:

| Mode | By round 20 | By 25 | By 30 | By 35 | By 40 (limit) | Went to the limit |
| --- | --- | --- | --- | --- | --- | --- |
| 2v2 | 25% | 37% | 51% | 61% | 69% | 31% |
| 3v3 | 5% | 10% | 18% | 26% | 41% | 59% |
| 4v4 | 1% | 2% | 7% | 15% | 23% | 77% |

## 2. Win rate by archetype

Share of games won by teams that included this archetype (a team can include it twice). Games still running at the turn limit go to the team with the most kills (tie: most landmarks held). 50% is even; within about ±5% is noise.

| Archetype | Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- | --- |
| Paladin | Knight | 46% | 48% | 45% | 46% |
| Crusader | Knight | 50% | 53% | 50% | 51% |
| Berserker | Barbarian | 76% | 76% | 62% | 70% |
| Warlord | Barbarian | 68% | 50% | 54% | 56% |
| Sniper | Archer | 47% | 53% | 50% | 50% |
| Hunter | Archer | 39% | 46% | 52% | 48% |
| Artillery | Mage | 56% | 60% | 50% | 55% |
| Enchanter | Mage | 33% | 37% | 36% | 36% |
| Assassin | Thief | 55% | 57% | 63% | 59% |
| Profiteer | Thief | 31% | 23% | 36% | 31% |

| Class | 2v2 | 3v3 | 4v4 | All |
| --- | --- | --- | --- | --- |
| Knight | 48% | 51% | 48% | 49% |
| Barbarian | 72% | 62% | 58% | 62% |
| Archer | 43% | 50% | 51% | 49% |
| Mage | 44% | 49% | 44% | 46% |
| Thief | 42% | 39% | 49% | 44% |

## 3. What each archetype does in a game (averages per game, all modes)

| Archetype | Kills | Deaths | Damage to heroes | Healing | Damage to NPCs | Damage taken | Landmarks claimed | XP earned | Skills | First capstone (median round) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Paladin | 0.6 | 1.0 | 18.7 | 32.9 | 16.7 | 61.1 | 7.9 | 490.8 | 7.7 | 15 (96% get one) |
| Crusader | 1.2 | 1.3 | 38.4 | 18.2 | 43.7 | 52.5 | 9.4 | 547.5 | 7.5 | 15 (93% get one) |
| Berserker | 2.5 | 1.1 | 57.1 | 3.6 | 120.4 | 28.7 | 9.1 | 655.8 | 6.4 | 12 (92% get one) |
| Warlord | 1.3 | 1.1 | 37.1 | 3.6 | 95.1 | 27.7 | 10.3 | 651.8 | 6.7 | 14 (93% get one) |
| Sniper | 0.8 | 0.8 | 34.4 | 1.8 | 90.0 | 21.5 | 8.7 | 686.9 | 5.8 | 14 (97% get one) |
| Hunter | 0.7 | 0.9 | 19.2 | 2.4 | 104.4 | 23.3 | 8.6 | 647.2 | 6.8 | 14 (94% get one) |
| Artillery | 1.3 | 1.0 | 39.2 | 5.6 | 108.8 | 26.3 | 4.0 | 530.9 | 5.8 | 17 (90% get one) |
| Enchanter | 0.4 | 1.0 | 16.2 | 6.3 | 50.3 | 30.1 | 4.7 | 467.3 | 6.7 | 17 (93% get one) |
| Assassin | 1.9 | 1.2 | 38.6 | 1.1 | 23.0 | 26.7 | 12.4 | 582.3 | 4.9 | 13 (93% get one) |
| Profiteer | 0.1 | 1.2 | 1.5 | 2.3 | 10.5 | 29.2 | 14.1 | 849.6 | 4.9 | 12 (96% get one) |

## 4. Economy pace in real games

Average XP earned per player by round 10 / 20 / 30, among games still going at that point. Compare with the no-fighting upper bound from `economy.md` (roughly 100 / 250 / 480 on the Balanced profile).

| Mode | Round 10 | Round 20 | Round 30 |
| --- | --- | --- | --- |
| 2v2 | 78.6 | 235.0 | 449.4 |
| 3v3 | 80.5 | 243.4 | 466.8 |
| 4v4 | 81.9 | 247.3 | 471.4 |

## 5. What gets used

Times per game each archetype used an action (all modes). Anything near zero is a skill the bots never find worth using: either the skill is weak or the bot logic misses it.

- **Paladin:** move 23.5, attack:weapon 8.2, cast:selfHeal 6.8, rest 2.5, attack:holyStrike 1.3, cast:crossHeal 1.2, attack:charge 0.4, cast:fortify 0.2
- **Crusader:** move 23.6, attack:weapon 6.2, attack:charge 3.2, cast:selfHeal 3.0, attack:holyStrike 3.0, rest 2.8, cast:smite 0.8, cast:crossHeal 0.1
- **Berserker:** move 25.8, attack:weapon 9.9, attack:heavyStrike 5.2, attack:doubleStrike 2.7, rest 2.0
- **Warlord:** move 28.7, attack:weapon 11.4, attack:heavyStrike 9.3, rest 2.0
- **Sniper:** move 29.9, attack:weapon 27.1, attack:arrowRain 1.6, rest 0.9
- **Hunter:** move 29.7, attack:weapon 24.9, rest 1.3, hunter's mark 1.2, cast:iceBlock 0.6
- **Artillery:** move 27.0, cast:mageBolt 20.5, rest 4.0, doublecast 1.4, attack:weapon 1.0, cast:fireball 0.1
- **Enchanter:** move 25.3, cast:mageBolt 12.7, rest 6.7, cast:empower 3.4, attack:weapon 2.1, cast:iceBlock 1.6, teleport 0.4, cast:cleanse 0.1
- **Assassin:** move 33.3, cast:invisibility 8.7, attack:weapon 8.3, rest 0.6
- **Profiteer:** move 42.7, attack:weapon 5.1, rest 1.2

(450 games in total.)

## 6. Set duos (2v2)

Each duo plays 75 2v2 games against random opposing pairs. Win-or-lead rate as in section 2.

| Duo | Games | Wins or leads | Games ending in a wipe | Teleports per game |
| --- | --- | --- | --- | --- |
| Berserker + Enchanter | 75 | 72% | 88% | 0.64 |
| Berserker + Paladin | 75 | 79% | 87% | 0.05 |
| Artillery + Paladin | 75 | 55% | 55% | 0.19 |
| Sniper + Warlord | 75 | 64% | 60% | 0.07 |
| Assassin + Profiteer | 75 | 46% | 51% | 0.07 |
