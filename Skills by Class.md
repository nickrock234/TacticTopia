# Skills by Class

A reorganized view of `Tactics Game – Confirmed Design Decisions.md` for cross-checking. Numbers come from the design doc's "Starting numbers" section, **plus Nick's rulings from 2026-09-29** (marked ✎, listed at the bottom). This file wins where the two disagree.

Cost key (✎ 2026-09-30): class line nodes are **15 / 30 / 60 XP**; element nodes are **15 (passive) / 30 (spell)**; hybrids **60 XP**. The tables below show these (updated 2026-10-02). `engine/numbers.ts` is the source.
Type key: **Passive** = always on, no mana, no action. **Attack** = replaces a normal attack (uses the turn's one attack). **Spell** = costs an action and mana. A damaging spell counts as the turn's attack (Doublecast excepted).

---

## Knight — melee defense, healing

**Stats:** 22 HP · 3 movement ✎ · **3 max mana** · vision 3
**Starting perk:** starts with a shield ✎ (2026-09-30)
**Weapons:** Sword 5 damage (start) · Flail 4 damage to every adjacent enemy, one-handed

| Line | Node | Skill | XP | Mana | Type | Effect |
| --- | --- | --- | --- | --- | --- | --- |
| Offense | 1 | Holy strike | 15 | 2 | Attack | Weapon attack +2 damage; knight heals 1 HP on hit ✎ |
| Offense | 2 | Charge | 30 | 2 | Attack | Weapon attack +1 damage per tile moved in a straight line this turn, max +3 |
| Offense | 3 ★ | Smite | 60 | 3 | Spell (damaging) | Cross, 2 tiles each direction: 6 damage; cures the knight's own status effects |
| Defense | 1 | Self-heal | 15 | 2 | Spell | Heal self 4 |
| Defense | 2 | Cross heal | 30 | 3 | Spell | Cross, 1 tile each direction: heal 3 to each ally, knight included |
| Defense | 3 ★ | Resurrection | 60 | 3 ✎ | Spell | Within 4 tiles of the body ✎: instant revive on that tile at half HP |

## Barbarian — melee offense

**Stats:** 14 HP ✎ · 4 movement ✎ · 3 max mana · vision 3
**Starting perk:** none
**Weapons:** Greataxe 7 damage, two-handed (start) · Spear 5 damage, reach 2, two-handed

| Line | Node | Skill | XP | Mana | Type | Effect |
| --- | --- | --- | --- | --- | --- | --- |
| Offense | 1 | Heavy strike | 15 | 2 | Attack | Weapon attack +3 damage ✎ |
| Offense | 2 | Vengeance ✎ | 30 | — | Passive | At or below 75% HP (10 of 14): +2 damage per hit ✎ |
| Offense | 3 ★ | Double strike ✎ | 60 | 2 | Attack | Two weapon hits in one action |
| Defense | 1 | Intimidate | 15 | — | Passive | Enemies deal 1 less damage to the barbarian |
| Defense | 2 | Counterattack | 30 | — | Passive | Hits back melee attackers for half weapon damage, rounded up; once per attack; not vs ranged |
| Defense | 3 ★ | Inspire Berserkers | 60 | 3 | Spell | The barbarian and allies within 4: +2 damage for 2 turns ✎ |

## Archer — ranged physical

**Stats:** 16 HP · 4 movement ✎ · 3 max mana · vision 3
**Starting perk:** a pre-built Training dummy at base (+1 XP per turn)
**Weapons:** Bow 3 damage, range 4 (start) · Crossbow 2 arrows of 3 damage, range 3

| Line | Node | Skill | XP | Mana | Type | Effect |
| --- | --- | --- | --- | --- | --- | --- |
| Offense | 1 | Take Aim | 15 | — | Passive | +1 range if the archer hasn't moved this turn |
| Offense | 2 | Armor pierce | 30 | — | Passive | Shots ignore shield block |
| Offense | 3 ★ | Arrow Rain | 60 | 3 | Attack | Weapon damage to every enemy in range |
| Defense | 1 | Scout's eye | 15 | — | Passive | Sees invisible enemies |
| Defense | 2 | Pinning shot | 30 | 2 | Attack | Normal weapon damage, and target loses 2 movement next turn ✎ |
| Defense | 3 ★ | Hunter's mark | 60 | 3 | Free ✎ | No damage, no action, not an attack. Target within weapon range: takes +2 damage from all allies, and the archer's whole team gets +1 movement, for 2 turns ✎ |

## Mage — ranged magic, support

**Stats:** 15 HP · 3 movement ✎ · 6 max mana ✎ (+2 with Staff, so 8 = one Teleport) · vision 3
**Starting perk:** Mage bolt — 2 mana, range 3, 5 damage, flavored to the chosen element
**Weapons:** Staff 2 damage, +2 max mana (start) · Orb 1 damage, spells +1 range

| Line | Node | Skill | XP | Mana | Type | Effect |
| --- | --- | --- | --- | --- | --- | --- |
| Offense | 1 | Deep rest | 15 | — | Passive | Resting restores +2 extra mana (5 total) |
| Offense | 2 | Mana surge | 30 | 0 | Free | Restore 3 mana without an action, once every 3 turns ✎ |
| Offense | 3 ★ | Doublecast | 60 | — | Passive | Two spells in one action, each paying its own mana |
| Defense | 1 | Empower | 15 | 2 | Spell | Range 3: ally or self gets +1 attack and +1 block for 2 turns |
| Defense | 2 | Cleanse & status ward | 30 | 2 | Spell | Range 3: removes status effects; ward blocks the next one |
| Defense | 3 ★ | Telepuppet ✎ (was Teleport ally) | 60 | 8 ✎ | Spell | One action. Move an ally within 3 to any visible tile within 5 of the mage. The mage's player then immediately takes **one action as the ally** (the mage's second action: attack, spell or rest, not a move, or skip it); its turn ends. It keeps its normal turn. The mage's turn ends ✎ |

## Thief — stealth, assassination, economy

**Stats:** 15 HP · 5 movement ✎ · 4 max mana · vision 4 ✎
**Starting perk:** Body double ✎ — the thief can leave a 1 HP decoy in a territory to hold the claim, so the thief can walk away. The claim completes at the start of the thief's next turn unless the enemy destroys the decoy (one hit) **and** the thief isn't in the territory either. One decoy at a time.
**Weapons:** Dagger 4 damage (start) · Throwing knives 3 damage, range 2

| Line | Node | Skill | XP | Mana | Type | Effect |
| --- | --- | --- | --- | --- | --- | --- |
| Offense | 1 | Invisibility | 15 | 2 | Spell | Can't be cast with an enemy hero within 2 tiles ✎. Invisible for 2 turns; adjacent enemies get a "!" cue and reveal him by bumping into his tile ✎; attacking ends it |
| Offense | 2 | Ambush | 30 | — | Passive | +3 damage when attacking from invisibility |
| Offense | 3 ★ | Double dagger | 60 | — | Passive | Two hits when attacking from invisibility |
| Economy | 1 | Investor | 15 | — | Passive | +1 gold for every 3 XP generated |
| Economy | 2 | Pickpocket | 30 | — | Passive | Steal 2 gold per hit |
| Economy | 3 ★ | Launder | 60 | — | Free ✎ | Convert 3 gold into 1 XP, any amount, no action (like buying buildings) |

---

## Shared: element skills (any class, once the element is unlocked)

Your chosen element is unlocked from the start; others unlock by claiming their landmark.

| Element | Branch | Node | Skill | XP | Mana | Type | Effect |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fire | Offense | 1 | Flaming weapon | 15 | — | Passive | +1 damage on weapon attacks (a mage's damaging spells count as the weapon) ✎ |
| Fire | Offense | 2 | Fireball | 30 | 3 | Spell (damaging) | Range 3: 3 damage to target and adjacent tiles |
| Fire | Defense | 1 | Burning aura | 15 | — | Passive | Attackers who hit you take 1 damage per hit |
| Fire | Defense | 2 | Firewall ✎ | 30 | 3 | Spell (damaging) | Place a U of 5 burning tiles around yourself or an ally within 3, open on the side you choose. Enemies in it take 2 damage at the end of your turn, and 2 when they enter it or start their turn in it. Lasts until your next turn. Counts as your attack (damaging spell) |
| Water | Offense | 1 | Chilling weapon | 15 | — | Passive | Targets you hit with a weapon attack lose 1 movement next turn (mage: spells count) ✎ |
| Water | Offense | 2 | Tidal wave | 30 | 3 | Spell (damaging) | Line of 3 from caster: 2 damage, push 2 |
| Water | Defense | 1 | Windchill | 15 | — | Passive | Ranged attacks against you have -1 range |
| Water | Defense | 2 | Ice block | 30 | 2 | Spell | Self: halve damage taken until your next turn (block first, round down) |
| Earth | Offense | 1 | Shattering weapon | 15 | — | Passive | Targets you hit with a weapon attack lose 1 block for 2 turns (mage: spells count) ✎ |
| Earth | Offense | 2 | Quake | 30 | 3 | Spell (damaging) | Self-centered: 5 adjacent, 3 at 2 tiles, 1 at 3 tiles |
| Earth | Defense | 1 | Stoneskin | 15 | — | Passive | +1 block |
| Earth | Defense | 2 | Fortify | 30 | 3 | Spell | Range 2: you or an ally immune to status effects and pushes until your next turn |

## Shared: hybrid spells (any class)

Unlocked by reaching node 2 of either branch in both parent elements.

| Hybrid | Parents | XP | Mana | Effect |
| --- | --- | --- | --- | --- |
| Lightning | Fire + Water | 60 | 3 ✎ | Range 3: 3 damage, paralysis (-1 action next turn) |
| Poison | Fire + Earth | 60 | 3 ✎ | Range 3: 1 damage, then 2 per turn until cured (cure: 3 gold + an action) |
| Nature | Earth + Water | 60 | 3 ✎ | Range 3: 4 damage, heal half the damage dealt (round up) |

---

## Rulings (Nick, 2026-09-29)

Changes to the design doc, marked ✎ in the tables above:

- **Mana:** Resurrection and all three hybrids cost **3** (were 5 and 4), so a 3-mana weapon class can cast them. Intent: a 3-mana spell drains a weapon class for several turns; 2-mana spells allow two turns in a row, not three.
- **Holy strike:** +2 damage and the knight heals 1 HP on hit. **Heavy strike:** +3 damage (was +2).
- **Inspire Berserkers** buffs the barbarian too.
- **Pinning shot** deals normal weapon damage as well as the movement loss.
- **Hunter's mark** is not an attack: free (no action), 3 mana, no damage.
- **Teleport ally** is one action and costs **8 mana**, the mage's whole pool without the Staff. Giving up their own damage is the price.
- **Mana regen:** every hero regains **+1 mana per turn** passively (Shrine stacks to +2). Fallback if casting never forces a tradeoff: no passive regen, only resting and the Shrine.
- **Landmark territory:** 3×3 (was 5×5) as the starting value, pending the map simulation.
- **Launder** is free (no action), like buying buildings.
- **Invisibility** can't be cast with an enemy hero within 2 tiles. Stealth is for approaching, not for use mid-fight. This also rules out going invisible and attacking in the same turn: both of the thief's weapons need the target within 2 tiles.
- Earlier the same day: diagonals count; attack skills don't stack (passives always apply); building and shopping work from anywhere; claiming = end a turn in the territory and still be there at the start of your next; a damaging spell is the turn's one attack except under Doublecast; async play; one player at a time, alternating teams.

- **Phoenix blessing removed**, replaced by **Firewall** (Fire defense node 2): it undid kills, overlapped the knight and worked against the all-dead win condition.
- **Offensive element passives** apply to weapon attacks only; a mage's damaging spells count as their weapon. Damage order and other combat rules: see `Combat Rules.md`.

## Rulings (Nick, 2026-09-30), after the first combat simulations

- **Barbarian is a glass cannon:** 16 HP (was 20). **Vengeance** is now node 2 (20 XP) and triggers at or below 75% HP (was 50%), still +3 per hit. **Double strike** is now the capstone (45 XP), because as a cheap node 2 it let the barbarian one-shot fragile heroes at 40 XP.
- **Mage max mana 6** (was 8). With the Staff it's 8, so Teleport takes the full pool. An Orb mage can't Teleport without the Temple.
- **Resting:** ~~only on a turn you don't attack~~ → rest and attack can share a turn, in either order (Nick, 2026-09-30, later). ✎
- **Mana surge:** once every 3 turns (was 2). Passive +1 mana per turn stays.
- **Fog is Polytopia-style:** revealed tiles stay revealed for the whole team, and enemies on them are visible. Vision radius only sets how fast a hero explores; it never limits attack range.
- **Teleport ally** reworked: the mage casts it as the first action and gives the second to the ally, who acts once right away (it cuts into the turn order, then the next player goes as normal).
- **Hunter's mark:** the "visible to the team" half is replaced by **+1 movement for the archer's whole team** while the mark lasts (2 turns).

## Economy rulings (Nick, 2026-09-30), after the economy simulation

- Skill XP costs raised: class lines 15 / 30 / 60, element nodes 15 / 30, hybrids 60.
- Building costs ×1.5: tiers 12 / 24 / 48, Market 9, Training dummy 2 (half the weak NPC's gold; raised to 6 on 2026-10-01, see below).
- NPC gold: weak 4, medium 6 (were 6 and 8).
- Result: the doc's pacing target (two elements, a hybrid, both lines' first two nodes and a capstone) lands around turns 24–27 instead of 17–18.

## Healing and lairs (Nick, 2026-09-30)

- **Resting also heals a little** (+2 HP, amount to tune). The knight stays the main healer.
- **Building effects are global:** they apply wherever the hero is, not only at base (e.g. Apothecary +1 HP per turn anywhere).
- **Lair chests:** the item is rolled from what the owner's team can use (its classes' weapons, shields, boots) and comes pre-upgraded. In free-for-all the "team" is just you.
- **Lair bosses** (25 HP, hit back for 5) return 8 turns after being killed, so a lair is worth holding all game.

## Map rulings (Nick, 2026-09-30), after the map simulation

- ~~**Movement cut by 1 for every class:**~~ (undone 2026-10-01, see below) knight 2, barbarian 3, archer 3, mage 2, thief 4. Reaching the nearest enemy base now takes about 3–5 turns instead of 2–4, and the archer's range 4 now matches a barbarian's full reach per turn (move 3 + 1), so an alert archer always gets the first shot.
- **Map sizes:** 2v2 24×24, 3v3 32×32, 4v4 36×36 (grown to 28 / 36 / 42 on 2026-10-01, see below) (the doc's 20 / 24 / 28 can't fit the landmark and terrain rules).

## Body double (Nick, 2026-09-30)

Corrects my first reading ("claims instantly"). The Body double is a 1 HP placeholder. It holds the thief's claim while the thief moves away; a defender only has to reach it and hit it once. If the thief also stays in the territory, the defender has to deal with both to stop the claim.

## Game-end and tuning rulings (Nick, 2026-09-30), after the full-game simulations

- **Elimination:** a player is out of the game on their **2nd death** (all modes, 4v4 included). A team loses when all its players are out or dead at the same time.
- **Turn limit 40:** if no team is eliminated by then, the team with the **most kills** wins.
- **Engaged:** a move action that starts next to an enemy hero moves **2 less**, once per turn, and never below 1 tile. Escaping a melee fight costs something, but nobody is frozen.
- **Vengeance +2** (was +3): a small trim for the Berserker.
- **Monastery: spells +2** (was +1): a buff for mages, and for anyone casting spells.
- **Resurrection and elimination** (stated by Nick, not needed so far): a death undone by Resurrection shouldn't count toward elimination. It's implemented as a switch, but the bots never manage to Resurrect anyone, so it can't be tested yet.

## Death and respawn (Nick, 2026-09-30)

- **Respawn after one full round:** the body stays where the hero fell, and the hero respawns at base on their first turn after one full round of play since the death. Every death is the same (no longer +1 turn per death, capped at 3). An eliminated hero's body is removed at that same point.
- **Resurrection range 4** (was 2): with the knight's 2 movement first, it reaches bodies up to 6 tiles away, about two-thirds of ally deaths in simulation.
- **Barbarian 14 HP** (was 16): the glass cannon is now the easiest hero to kill.

## Economy and app rulings (Nick, 2026-09-30, late)
- **Building names:** Trade 2 = Bank, Trade 3 = Guildhall, Territory 2 = City hall, Territory 3 = Fortress.
- **Selling items:** half of (merchant price + upgrade), rounded down. Chest items are pre-upgraded, so a spare chest item sells for 7 gold.
- **No tutorial** for now: only if the game goes beyond the friend group.
- **Explorer quest:** a personal goal, "travel to the farthest edge of the map" (not a team share of the revealed map: a team bonus is too strong for the thief). ✎ 2026-10-01: stand on any tile in the edge row or column farthest from your base (either edge if two tie); 15 XP. Built (`checkExplorer`, after moves and at end of turn).

## Gear, respawn and info rulings (Nick, 2026-10-01)
- **Bag:** 5 spare items (equipped weapon, shield and boots don't count). A lair chest opened with a full bag is sold on the spot (my placeholder; Nick hasn't ruled on it).
- **Giving:** only spare items from the bag, never equipped gear; the heroes must be adjacent (diagonals count); **no action**; the receiver needs a free bag slot.
- **Buying the second weapon (Nick, 2026-10-02):** the weapon you had goes into your bag (and your shield too, if the new weapon is two-handed). With no room in the bag the purchase is refused *(my default)*. **Equipping** a spare from the bag swaps it with what you wear, at no action *(my default)*.
- **Respawn:** with more than one option, the player chooses where to come back: the base or any landmark they own. The hero appears on that tile, or the nearest free tile. (The original doc's "landmarks add a spawn point.") Bots pick the option nearest the closest enemy hero.
- **Enemy hero details:** hide mana and skills; show HP, movement, sight, gear and statuses (Design's proposal, agreed).
- **Mana fountain** (replaces "skills cost 20% less XP", my reading of the doc's "reduces upgrade costs"): a hero who ends a turn inside the territory of a fountain **their team** owns refills mana to full. A place to travel to, not a passive bonus; it doesn't duplicate the Shrine (+1 mana per turn) or the Temple (+2 max mana). Teammates benefit too *(my default; Nick can narrow it to the owner)*. Bots head there when 4+ mana short.
- **Starting perks in the skill tree:** the knight's shield and the archer's Training dummy are gear and a building, not skills, so they're not shown there.
- **Training dummy costs 6** (was 2): base income 2 + the turn-one monster's 4. A hero who kills that monster on turn one can buy it right away; the thief, who can't (dagger 4 vs 5 HP), waits until turn 3, a brake on his exploration lead. The archer still starts with one.

## Movement and map size (Nick, 2026-10-01)
- **+1 movement for every class** (undoes the 2026-09-30 cut): knight 3, barbarian 4, archer 4, mage 3, thief 5.
- **Maps 2v2 28×28, 3v3 36×36, 4v4 42×42** (were 24 / 32 / 36), for more room without more landmarks or camps. In simulation (r13c) this plays like before: first fights in rounds 4 / 5 / 5, class win rates 46–58%. Scaling the maps fully with movement (32 / 42 / 48, r13b) left them too empty: fights later, under a third of 4v4 games finished.
- **Bow range stays 4.** A barbarian (move 4 + 1) can now reach the archer for one turn; after that the archer (move 4) can always step away and the barbarian spends his turn catching up. (Briefly set to 5, reverted the same day.)
- **The fog line:** you can only walk on revealed tiles (rule in `Combat Rules.md`). **Thief vision 4** (was 3), so he still explores faster than the rest (4 tiles per move against 3) and opens ground for his team. Not simulated (Nick's call).

## Telepuppet (Nick, 2026-10-03)
- **Teleport ally is renamed Telepuppet**, and the **caster** takes the ally's one cut-in action, even when a friend plays that ally online (the mage is puppeteering it). The action can be an attack, a spell or a rest, not a move (as the bots already played it); it can be skipped. The ally's own turn is untouched. Bots still play the action when the caster is a bot. Internal id stays `teleport`.
- **A person ends their own turn** (applies online; offline already worked this way): spending both actions no longer ends it, so you can still shop or learn afterwards.

## Still open

Nothing. (2026-09-30: Vengeance stays at 75%; Teleport's bonus action is allowed even if the ally already attacked this round, since the mage has to stand near the fight to cast it.)
