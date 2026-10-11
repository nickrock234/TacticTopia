# Tactics Game – Confirmed Design Decisions

Sep 28, 2026 · @Nick Rock

A mobile, turn-based strategy game for playing with friends, inspired by Polytopia and Final Fantasy Tactics. Each player controls a single hero on a tiled map with fog of war, grows an economy from a home base, and fights on teams set up from the start. This document records confirmed decisions only; open items are listed at the end.

## Design pillars

- **Simple systems, many combinations.** Every system should be explainable in one sentence; depth comes from how systems combine. New mechanics are added only if they don't bloat the game.
- **Deterministic combat.** No random rolls anywhere.
- **Growth funds growth.** As in Polytopia, the proceeds of the economy are reinvested into engines that produce more.
- **Team-first.** The design is tuned for team play; free-for-all should still work.

## Game setup

- Target length: about 30 turns.
- Modes: 2v2 up to 4v4. Free-for-all is supported on maps sized for the equivalent number of players.
- Victory (teams): a team wins when every member of the opposing team is dead at the same time. There is no elimination; players can resign when far behind, and a simple AI takes over for players who leave, as in Polytopia.
  - Victory (free-for-all): a player is eliminated when an enemy controls their home base for 3 turns. All players are notified when a base is under siege, so the sieger, stuck in place, becomes a target.
- Intended dynamics: teams face an early-to-midgame choice between grouping up to ambush and disrupt, or building the economy carefully for longer. Larger teams and maps give more time to reach expensive capstone skills, which enable teamwork.

## Turn structure & combat

- Each player controls one hero, their only unit. Class and elemental affinity are chosen before the game.
- **2 actions per turn**, split freely between moving, casting and attacking (move twice, move + attack, attack + move, etc.).
- **At most one action per turn can be an attack.** Multi-hit skills (Double strike, Doublecast, double dagger) deliver two hits within that one action.
- Movement is higher than a Polytopia unit's. Revealing tiles through fog doesn't stop movement.
- Vision is shared across the team. Heroes can't attack into fog: the target must be visible to someone on the team.
- Heroes have mana pools. Spells cost mana; recovering mana costs an action.
- One-turn KOs are acceptable when earned, e.g. against a hero who engages without allies, disabling abilities or defensive investment.
- No hero levels. Heroes grow only through skills and equipment.

## Classes

| Class | Role | Starting perk |
| --- | --- | --- |
| Knight | Melee defense, healing | — |
| Barbarian | Melee offense | — |
| Archer | Ranged physical | Target practice area in base: a pre-built training dummy (+1 XP per turn) |
| Mage | Ranged magic, support | Offensive spell of their chosen element dealing 5 damage |
| Thief | Stealth, assassination, economy | Body double: can claim a landmark without lingering (see Landmarks) |

The turn-one NPC (see Map) is balanced around these perks: knight, barbarian and mage can kill it on turn 1; archers can kill it over two turns; the thief trades it for speed.

## Skill trees

All skills are bought with XP. Each hero has two kinds of skills: **element branches** and **class core lines**.

### Elements

| Element | Made from | Hybrid skill effect |
| --- | --- | --- |
| Fire | Base | — |
| Water (includes ice) | Base | — |
| Earth | Base | — |
| Lightning | Fire + Water | Paralysis (-1 action) plus some damage |
| Poison | Fire + Earth | 1–2 damage per turn; cured only by spending gold and an action |
| Nature | Earth + Water | Leeching |

- Each base element has **1 offensive and 1 defensive branch, 2 nodes each**.
- Node 1 of each branch is a **passive**: no mana, applies to all your damaging actions (weapon or spell), the same for every class. Node 2 is a **spell**: costs mana, doesn't depend on a weapon, and any class can cast it once learned. Non-casters have small mana pools, so the mage stands out through capacity (a large mana pool, Doublecast, Temple, Monastery) rather than unique effects.
- **Unlocking:** the hero's chosen element is available from the start. Other base elements unlock by claiming their landmark (e.g. a sea landmark unlocks water).
- **Hybrids:** reaching the 2nd node of either branch in both parent elements unlocks a single hybrid spell, which can cost more than base element skills.

| Element | Offense 1 (passive) | Offense 2 (spell) | Defense 1 (passive) | Defense 2 (spell) |
| --- | --- | --- | --- | --- |
| Fire | Flaming weapon: +1 damage | Fireball: range 3, 3 damage to the target and adjacent tiles | Burning aura: attackers who hit you (melee or ranged) take 1 damage per hit | Phoenix blessing: you or an ally survive the next lethal hit at 1 HP |
| Water | Chilling weapon: targets you hit lose 1 movement next turn | Tidal wave: line of 3 tiles, damages and pushes enemies 2 tiles | Windchill: ranged attacks against you have -1 range | Ice block: halve damage taken until your next turn (shield block applies first, round down) |
| Earth | Shattering weapon: targets you hit lose 1 block for 2 turns | Quake: centered on you, 5 damage to adjacent enemies, 3 at 2 tiles, 1 at 3 tiles | Stoneskin: +1 block | Fortify: you or an ally become immune to status effects and pushes until your next turn |

Area spells hit enemies only; there is no friendly fire.

### Class core lines

Each class has two element-independent lines of 3 nodes: one offensive, one defensive or buff-oriented. The 3rd node is an expensive capstone. Names are working titles.

| Class | Offensive line | Defensive / buff line |
| --- | --- | --- |
| Knight | Holy strike → Charge → Smite | Self-heal → Cross heal → Resurrection |
| Barbarian | Heavy strike → Double strike → Vengeance | Intimidate → Counterattack → Inspire Berserkers |
| Archer | Take Aim → Armor pierce → Arrow Rain | Scout's eye → Pinning shot → Hunter's mark |
| Mage | Deep rest → Mana surge → Doublecast | Empower → Cleanse & status ward → Teleport ally |
| Thief | Invisibility → Ambush → Double dagger | Investor → Pickpocket → Launder |

**Knight**

- Smite and Cross heal both use a cross-shaped area. Cross heal is an area heal for allies. Healing is kept special to the knight; the mage buffs instead.
- Resurrection is instant but requires the knight to be in range of where the ally died. Otherwise the body stays on the map until the ally respawns at a spawn point, then disappears.

**Barbarian**

- Double strike: attack twice with one action.
- Vengeance: passive damage bonus while the barbarian's own HP is low.
- Intimidate: always-on passive (working interpretation: enemies deal 1 less damage to the barbarian).
- Counterattack: the barbarian hits back against melee attackers for half his normal damage, rounded up. Triggers once per attack (a Double strike triggers it once); ranged attacks don't trigger it.
- Inspire Berserkers: team damage buff. May need +3 and/or to apply to all allies on the map.

**Archer**

- Take Aim: passive, +1 range if the archer hasn't moved this turn.
- Armor pierce: shots ignore shield block.
- Arrow Rain: one action hits every enemy in range.
- Scout's eye: passive, sees invisible enemies.
- Pinning shot: target loses 2 movement on their next turn.
- Hunter's mark: target is visible to the whole team and takes extra damage from all allies.

**Mage**

- Empower (working name): buff spell giving an ally or the mage a temporary +1 attack and +1 defense.
- Deep rest: resting restores more mana.
- Mana surge: restore mana without using an action, at limited frequency (e.g. once every 2 turns).
- Doublecast: cast two spells with one action.
- Cleanse & status ward: cures status effects (e.g. poison, paralysis) and places a shield against status effects that the opponent has to break first, so the mage's help doesn't depend on turn order.
- Teleport ally: expensive; places an ally in a favorable position at the cost of most of the mage's own turn.

**Thief**

- Invisibility: costs mana and an action, lasts a limited number of turns. An invisible thief can be discovered by enemies who come close enough. Attacking ends invisibility.
- Ambush: bonus damage when attacking from invisibility.
- Double dagger: two hits when revealed by attacking.
- Investor: small production bonus, e.g. +1 gold for every 3 XP generated.
- Pickpocket: steal gold on hit.
- Launder: convert gold into XP. The only crossover between the two currencies.

## Economy

### Currencies

- **Gold** builds the base and buys gear: every building, expansion and equipment purchase costs gold.
- **XP** buys skills and nothing else.
- Both come from buildings, landmarks and finds on the map (drops, NPC encounters). Buildings produce both, some leaning toward gold and others toward XP.

### Home base

- All building happens at the home base. It is the main income engine and starts at **3 XP per turn**.
- Buildings aren't duplicated. Each sits on an upgrade branch like a skill tree, with deeper nodes costing more (roughly double).
- Every building produces at least 1 XP as well as its main output.
- There is no vision building.
- The home base can never be lost. Owners can always respawn at their base, even under siege, so dying can double as a way home. An enemy who ends their turn on it steals the base's gold income for that turn, up to 5 gold (the thief can steal up to 8). XP is untouched. Enough to be worth the trip, but recoverable, and too small to fund a big instant purchase.
- Players get natural bonuses on their home turf, similar to the Territory branch's bonus for landmarks.

| Branch | Tier 1 | Tier 2 | Tier 3 |
| --- | --- | --- | --- |
| Smithing | Forge: +2 gold, +1 XP; enables blacksmith upgrades | Armory: unlocks crafting (the deterministic way to get a full set) | Refinery: weapons and shields +1 |
| Learning | Library: +3 XP (pure XP building) | Monastery: all magic-based skills +1 | — |
| Training | Training dummy: +1 XP, costs about half the turn-one NPC reward | Sparring ring: +2 XP | Arena: NPC rewards +50% |
| Faith | Shrine: +1 mana per turn | Apothecary: +1 HP per turn (fallback if too strong: a potion purchasing system) | Temple: +2 max mana |
| Trade | Market | +2 gold | All future gold purchases cost 33% less, including gear (can be more generous if saving up for it proves too costly) |
| Territory | Stables: +1 movement when starting a turn on a road | +1 income from each claimed landmark | +1 damage and shield block within your landmarks' territory |

### Landmarks

Claimed territory is static landmarks, not towns. Each landmark's territory is a 5x5 square around it, with room for environmental features while staying traversable. Claiming one:

- Requires the hero to stay in the territory for a turn, vulnerable to attack (the thief's body double is the exception).
- Instantly builds a road from it to the home base.
- Adds a spawn point.
- Adds a small amount of income (e.g. +2 XP), which matters less and less as the base grows.
- Can be taken by an enemy. The previous owner keeps skills already learned from it but can't learn new ones from that line. The new owner gains its bonus; if it unlocks an element, they can immediately buy those skills.
- Grants its bonus, which is equally important: an element unlock, a gold mine, a mana fountain (reduces upgrade costs), an equipment merchant (weapon, shield or boots, bought with gold), a one-time treasure chest, or a quest.

### Quests

Quests grow the economy and give players direction.

**Base quests:** the same list for every player, visible from turn one, completed individually.

| Quest | Goal | Reward |
| --- | --- | --- |
| Explorer | Reveal a large share of the map | 15 XP |
| Conqueror | Claim 3 landmarks | +2 max HP |
| Hunter | Defeat 5 NPCs | NPC kills give +1 gold |
| Builder | Own 5 buildings | +1 XP per turn |
| Treasurer | Hold 30 gold at once | +2 gold per turn |
| Scholar | Learn 5 skills | Next skill costs half |
| First blood | Defeat an enemy hero | 10 gold |

**Lairs:** a quest landmark whose owner can defeat a strong NPC nearby for a treasure chest containing gold and one truly random piece of equipment, possibly for another class. Equipment you can't or don't want to use can be sold for gold. (Loot randomness doesn't conflict with deterministic combat.)

## Equipment & terrain

Three equipment slots, each with one job: weapon is offense, shield is defense, boots are mobility.

| Slot | Base effect | One upgrade |
| --- | --- | --- |
| Weapon | Damage | Permanent damage boost |
| Shield | Block (flat reduction per hit) | Block boost |
| Boots | +1 movement | Choose: walk in water, on mountains, or on hot desert |

- Classes have no base block; block comes only from shields.
- Weapons are class-specific, two options per class (see below). "Melee" means attacking from an adjacent tile.
- Boots are a timing choice, like riders in Polytopia: everyone gets them eventually, but some buy early for scouting while others grow their economy first.
- Each base element has an equivalent terrain type with the same behavior: water, mountains, and a glowing-hot desert for fire. Each is impassable without the matching boots, and a hero standing on one takes 1 less damage per hit (stacks with shields). Melee heroes can still attack a hero on such terrain from an adjacent tile. Each element's landmark sits at the edge of its terrain.

**Weapons**

Each class has two weapon options with a clear trade-off. Heroes start with the first and can switch by buying or crafting the second. Each weapon has one number and at most one trait. Two-handed weapons can't be used with a shield.

| Class | Option 1 (starting) | Option 2 |
| --- | --- | --- |
| Knight | Sword: 5 damage | Flail: 4 damage to every adjacent enemy, one-handed (keeps the shield) |
| Barbarian | Greataxe: 7 damage, two-handed (strongest single-target weapon) | Spear: 5 damage, reach 2, two-handed |
| Archer | Bow: 3 damage, range 4 | Crossbow: 2 arrows of 3 damage, range 3 |
| Mage | Staff: 2 damage, +2 max mana | Orb: 1 damage, spells +1 range |
| Thief | Dagger: 4 damage | Throwing knives: 3 damage, range 2 |

**Trading gear between teammates**

- Equipment (found, bought or crafted) can be given to a teammate. It takes an action, and the heroes must be adjacent.
- No direct gold transfers, only items.
- Upgrades travel with the item. Building bonuses (e.g. the Refinery's +1) apply only to the building owner's own gear.
- Unwanted equipment can be sold for half its normal price.
- This lets a teammate specialize as the team's gold earner and crafter.

The blacksmith upgrade gives weapons +1 damage; for mage weapons it boosts the trait instead (Staff +1 more mana, Orb +1 more range). The Refinery's +1 applies to all.

## Map, NPCs, death

**Map & NPCs**

- Heroes explore for landmarks, equipment drops, gold drops and NPC enemies.
- NPC encounters drop XP, gold and loot, at the cost of actions, HP and mana. There are enough NPCs that farming is always a viable route.
- NPCs stay in place and only fight back against attackers standing next to them.
- Each start has a 5 HP NPC 4 tiles away, like Bardur's turn-one animals in Polytopia.

**Death & respawn**

- Each death adds 1 turn to that player's respawn wait, capped at 3 turns.
- While dead, a player still collects XP and gold each turn and can spend it.
- Heroes respawn at spawn points (home base and claimed landmarks). A resurrected hero's death still counts toward their respawn timer.

## Starting numbers

A concrete starting set for simulation. **Every value is a guess unless marked (confirmed).** The simulation exists to correct these.

### Hero stats

| Class | HP | Movement | Max mana | Vision radius |
| --- | --- | --- | --- | --- |
| Knight | 22 | 3 | 3 | 3 |
| Barbarian | 20 | 4 | 3 | 3 |
| Archer | 16 | 4 | 3 | 3 |
| Mage | 15 | 3 | 8 (+2 with Staff) | 3 |
| Thief | 15 | 5 | 4 | 3 |

- Fragile classes have 15 HP so a 7-damage Double strike (14) can't KO them from full in one action.
- Resting (one action) restores 3 mana for every class. Deep rest adds +2.
- Heroes start with their option-1 weapon (confirmed), and no shield or boots.
- Death costs nothing beyond the respawn wait (dead players keep collecting income, confirmed).

### Weapons and shields

| Item | Numbers |
| --- | --- |
| Sword | 5 damage (confirmed) |
| Flail | 4 damage to each adjacent enemy (confirmed) |
| Greataxe | 7 damage, two-handed (confirmed) |
| Spear | 5 damage, reach 2, two-handed (confirmed) |
| Bow | 3 damage, range 4 (confirmed) |
| Crossbow | 2 arrows of 3 damage, range 3 (confirmed) |
| Staff | 2 damage, +2 max mana (confirmed) |
| Orb | 1 damage, spells +1 range (confirmed) |
| Dagger | 4 damage (confirmed) |
| Throwing knives | 3 damage, range 2 (confirmed) |
| Shield | Block 1; upgraded block 2 |

### Skill XP costs

| Node | XP cost |
| --- | --- |
| Element node 1 (passive) | 10 |
| Element node 2 (spell) | 20 |
| Hybrid spell | 35 |
| Class line node 1 | 10 |
| Class line node 2 | 20 |
| Class line capstone | 45 |

Target pacing: about 300 XP earned per player over 30 turns, enough for two elements, a hybrid, the first two nodes of both class lines and one capstone, reached around turn 20–24.

### Spells and active skills

Range is in tiles. "Attack" skills replace a normal attack and use the attack action.

| Skill | Mana | Range | Numbers |
| --- | --- | --- | --- |
| Mage bolt (starting spell) | 2 | 3 | 5 damage (confirmed) |
| Fireball | 3 | 3 | 3 damage to target and adjacent tiles (confirmed) |
| Tidal wave | 3 | Line of 3 from caster | 2 damage, push 2 |
| Quake | 3 | Self | 5 adjacent, 3 at 2 tiles, 1 at 3 tiles (confirmed) |
| Phoenix blessing | 3 | 3 | Lasts until triggered or 2 turns |
| Ice block | 2 | Self | Halve damage until next turn (confirmed) |
| Fortify | 3 | 2 | Status and push immunity until next turn (confirmed) |
| Lightning | 4 | 3 | 3 damage, paralysis (-1 action next turn) |
| Poison | 4 | 3 | 1 damage, then 2 per turn until cured |
| Nature | 4 | 3 | 4 damage, heal half the damage dealt (round up) |
| Holy strike | 2 | Weapon | Attack +2 damage |
| Charge | 2 | Weapon | Attack +1 damage per tile moved in a straight line this turn, max +3 |
| Smite | 3 | Cross, 2 tiles each direction | 6 damage; cures the knight's own status effects |
| Self-heal | 2 | Self | Heal 4 |
| Cross heal | 3 | Cross, 1 tile each direction | Heal 3 to each ally in the area, including the knight |
| Resurrection | 5 | 2 from the body | Instant revive at the body's tile with half HP |
| Heavy strike | 2 | Weapon | Attack +2 damage |
| Double strike | 2 | Weapon | Two hits in one action |
| Inspire Berserkers | 3 | Allies within 4 | +2 damage for 2 turns |
| Pinning shot | 2 | Weapon | Target loses 2 movement next turn (confirmed) |
| Arrow Rain | 3 | Weapon | Weapon damage to every enemy in range |
| Hunter's mark | 3 | Weapon | Target visible to the team and takes +2 damage from all allies for 2 turns |
| Empower | 2 | 3 | +1 attack and +1 block for 2 turns (confirmed +1/+1) |
| Cleanse & status ward | 2 | 3 | Removes status effects; ward blocks the next one |
| Teleport ally | 6 | 3 | Move an ally to any visible tile within 5 tiles of the mage |
| Mana surge | 0 | Self | Restore 3 mana, no action, once every 2 turns |
| Invisibility | 2 | Self | Lasts 2 turns; enemies adjacent to the thief detect them |

### Passives

| Skill | Numbers |
| --- | --- |
| Flaming weapon | +1 damage (confirmed) |
| Chilling weapon | Target loses 1 movement next turn (confirmed) |
| Shattering weapon | Target loses 1 block for 2 turns (confirmed) |
| Burning aura | Attackers take 1 damage per hit (confirmed) |
| Windchill | Ranged attacks against you have -1 range (confirmed) |
| Stoneskin | +1 block (confirmed) |
| Take Aim | +1 range if the archer hasn't moved (confirmed) |
| Armor pierce | Ignores shield block |
| Scout's eye | Sees invisible enemies (confirmed) |
| Vengeance | Below half HP: +3 damage per hit (alternative to test: double damage) |
| Intimidate | Enemies deal 1 less damage to the barbarian |
| Counterattack | Half weapon damage, rounded up, against melee attackers (confirmed) |
| Deep rest | Resting restores +2 extra mana |
| Doublecast | Two spells in one action, each paying its own mana (confirmed two spells) |
| Ambush | +3 damage when attacking from invisibility (keeps a double dagger hit at 14, under fragile HP) |
| Double dagger | Two hits when attacking from invisibility (confirmed) |
| Investor | +1 gold for every 3 XP generated (confirmed as an example) |
| Pickpocket | Steal 2 gold per hit |
| Launder | Convert 3 gold into 1 XP, any amount |

### Economy

| Item | Numbers |
| --- | --- |
| Home base income | 3 XP (confirmed) + 2 gold per turn |
| Landmark income | +2 XP (confirmed as an example) |
| Building tier 1 | 8 gold (Training dummy 3; Market 6) |
| Building tier 2 | 16 gold |
| Building tier 3 | 32 gold |
| Every building | +1 XP per turn on top of its effect (confirmed); Library +3 XP (confirmed) |
| Market (Trade tier 1) | +1 gold, +1 XP |
| Forge | +2 gold, +1 XP (confirmed) |
| Blacksmith upgrade | 8 gold |
| Merchant item | 7 gold |
| Crafted item | 10 gold |
| Boots | 6 gold; boots upgrade 8 gold |
| Selling | Half the item's price (confirmed) |
| Poison cure | 3 gold + an action |
| Siege theft | Base gold income, max 5 per turn (8 for thieves) (confirmed) |
| Trade tier 3 discount | 33% off all gold purchases (confirmed) |

### NPCs

| Tier | HP | Damage (only against adjacent attackers, confirmed) | Reward |
| --- | --- | --- | --- |
| Weak (incl. turn-one NPC) | 5 (confirmed for turn-one) | 2 | 2 XP + 6 gold |
| Medium | 10 | 3 | 5 XP + 8 gold |
| Lair boss | 25 | 5 | 10 XP + 15 gold + one random item (confirmed gold + item) |

- Per player: 2 weak camps near the start (one exactly 4 tiles away, confirmed), 1 medium camp; 1 lair per 2 players.
- Weak and medium camps respawn 5 turns after being cleared, so farming stays viable all game.

### Map

| Item | Value |
| --- | --- |
| Grid | Square (fits 5x5 territories and cross shapes) |
| Map size | 2v2: 20×20; 3v3: 24×24; 4v4: 28×28 |
| Landmarks per player | 4: one of each base element, plus one of mine, mana fountain, merchant or lair |
| Landmark spacing | At least 5 tiles apart, so territories never overlap |
| Terrain share | Plains 60%, water 15%, mountains 13%, hot desert 12% |
| Home bases | Teammates 6–8 tiles apart; nearest enemy base at least 16 tiles away |

## Open questions

- [ ] **Play format:** live (everyone online at once) or async (Polytopia-style, take your turn whenever and get notified)?
- [ ] **Turn order:** one player at a time, or each team moves together? This affects balance (e.g. the mage's status ward was designed so help doesn't depend on turn order).
- [ ] **All numbers in Starting numbers** are guesses to test in simulation, except those marked confirmed.

## Deferred

- Elemental effects on terrain (freezing, burning).
- Weapon design, e.g. a barbarian spear that hits 2 tiles away to punish ranged attackers who get too close.
- Later classes: lancer, monk (needs a workable no-shield design), bard (support; may need team play).
