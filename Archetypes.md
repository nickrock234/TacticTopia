# Player Archetypes

How a real player might build and play each class. Two per class: one per class line, since the two lines pull a hero in different directions. The Layer 4 bots play these; each archetype is a build plan plus a behavior profile.

Every archetype gets a first element that fits it. Other elements come from claiming landmarks. Gold build orders use the building names from the design doc.

## Knight

**Paladin (support).** Self-heal → Cross heal → Resurrection. Earth (Stoneskin, then Fortify on allies). Sword and shield, early shield upgrade. Faith branch early (Shrine for mana, Apothecary). Stays next to the most valuable teammate, heals anyone below about 60%, and bodies up for fragile allies. Fights only when an enemy comes to them.

**Crusader (front line).** Holy strike → Charge → Smite. Fire (Flaming weapon). Sword and shield, later Flail when fighting groups. Smithing branch (Forge, Armory, Refinery). Walks at the front of the team, Charges into whoever is closest, holds landmarks.

## Barbarian

**Berserker (glass-cannon diver).** Heavy strike → Vengeance → Double strike. Fire (Flaming weapon). Greataxe. XP-first economy to reach Double strike fast. Hunts fragile heroes (mage, thief, archer) who are alone or badly placed. Pairs with a Teleport mage.

**Warlord (brawler and buffer).** Intimidate → Counterattack → Inspire Berserkers. Earth (Stoneskin). Spear, so he can hit from 2 tiles. Stays with the team, takes the first hits, and casts Inspire before a team push.

## Archer

**Sniper (damage from range).** Take Aim → Armor pierce → Arrow Rain. Fire (Flaming weapon). Bow. Buys boots early so it can kite. Shoots from maximum range, retreats from anyone fast enough to catch it, and picks off wounded heroes.

**Hunter (control and team enabler).** Scout's eye → Pinning shot → Hunter's mark. Water (Chilling weapon, Windchill). Crossbow. Pins divers coming at teammates, marks the team's target before a push, and escorts teammates to counter thieves.

## Mage

**Artillery (burst caster).** Deep rest → Mana surge → Doublecast. Fire (Flaming weapon applies to spells, Fireball). Staff, Learning branch (Library, then Monastery). Stays 3 tiles behind the front line and double-casts at whoever is exposed. Rests on turns with nothing in range.

**Enchanter (support and Teleport).** Empower → Cleanse & status ward → Teleport ally. Water (Ice block for survival). Staff (the Orb can't reach 8 mana for Teleport). Faith branch (Shrine, then Temple). Buffs the team's damage dealer, cleanses poison and paralysis, and Teleports a diver onto an exposed enemy when it's set up.

## Thief

**Assassin (stealth burst).** Invisibility → Ambush → Double dagger. Fire (Flaming weapon). Dagger, boots early. Goes invisible out of sight, walks up on fragile targets, and strikes from invisibility. Retreats and re-cloaks afterwards.

**Profiteer (economy and landmarks).** Investor → Pickpocket → Launder, then uses the faster XP to buy into the offense line (Invisibility → Ambush → Double dagger) and the rest of the tree. Earth (Stoneskin, for survival while claiming). Throwing knives. Trade branch first (Market, tier 2, the discount). Uses Body double decoys to claim landmarks without standing guard, farms NPC camps, steals base income from undefended enemy bases, and buys gear to hand to teammates.

## How the bots use this

Each archetype defines:

- **Skill order:** the XP spending list, with elements unlocked via landmarks inserted when available. After the list, every bot keeps buying the rest of the tree: its class's other skills, element passives, element spells (all unlocked elements), then hybrids.
- **Gold order:** buildings and items in priority order.
- **Behavior weights:** how much it values claiming, farming, fighting, supporting and staying safe; its retreat threshold (fraction of HP); whether it stays near teammates.

Teams in the simulation are random archetype combinations, plus a few set duos worth testing directly (e.g. Berserker + Enchanter for the Teleport combo, Paladin + Artillery).
