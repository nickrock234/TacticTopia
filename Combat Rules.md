# Combat Rules

The damage pipeline and related rulings, agreed with Nick on 2026-09-29. Where these disagree with the design doc, this file wins.

## Offensive element passives follow the weapon

Flaming weapon, Chilling weapon and Shattering weapon apply to **weapon attacks**, including attack skills that use the weapon (Holy strike, Heavy strike, Charge, Double strike, Pinning shot, Arrow Rain).

- **Knight, barbarian, archer, thief:** their spells don't get these passives.
- **Mage:** their damaging spells count as their weapon and **do** get them.

This replaces the doc's line that these passives apply to "all your damaging actions (weapon or spell)."

## Damage pipeline (per hit)

**Attacker side: build the hit**
1. **Base damage:** the weapon (with blacksmith and Refinery upgrades) or the spell's number.
2. **Attack skill:** Holy strike +2, Heavy strike +3, or Charge +1 to +3. Only one; attack skills don't stack.
3. **Flat bonuses, added together:** Flaming weapon +1 (see above), Empower +1, Inspire +2, Ambush +3, Vengeance +3, Hunter's mark +2 against a marked target, Territory tier 3 +1, Monastery +2 (spells only).

**Defender side: reduce the hit**
4. **Block** (weapon hits only; **spells ignore block**): shield 1 or 2, plus Stoneskin +1, Empower +1 and Territory tier 3 +1, minus Shattering −1. Armor pierce ignores only the shield part.
5. **Terrain:** −1 if the defender stands on water, mountain or hot desert (applies to spells too).
6. **Intimidate:** −1 if the defender is a barbarian with the skill.
7. **Ice block:** halve, rounding down.
8. **Minimum 1 damage per hit.**

**After the action**
9. **Reactions:** Burning aura (1 per hit), Counterattack (half weapon damage rounded up, through the attacker's own pipeline), NPC retaliation (once per attack action, if the NPC survives).
10. **Effects:** Chilling, Shattering, Pinning, Pickpocket and Lightning's paralysis apply after the whole action, not between hits.

Poison's damage over time skips the pipeline: a flat 2 per turn.

**Area spells:** flat bonuses apply to every target hit.

## Mana and resting (2026-09-30)

- Every hero regains +1 mana at the start of their turn.
- Resting (+3 mana, +5 with Deep rest) takes an action. It can share a turn with an attack, in either order (Nick, 2026-09-30, replacing "only on a turn you don't attack").
- Mana surge (mage): +3 mana, no action, once every 3 turns.

## Fog and visibility (2026-09-30)

Polytopia-style: a revealed tile stays revealed for the whole team, and enemies on revealed tiles can be seen and attacked. Only unexplored tiles and invisible thieves are hidden.

**The fog line (Nick, 2026-10-01):** you can only walk on tiles your team has revealed. A move into the unknown stops at the edge of what's revealed; arriving reveals more (vision), so the next move can go further. In new ground every hero explores at most their vision per move: 3 tiles, the thief 4 (his vision was raised for this). Ground a teammate revealed can be crossed at full movement. Pushes (Tidal wave), Teleport and respawning aren't walking and ignore the rule.

**Invisible enemies (Nick, 2026-09-30):** standing next to an invisible enemy does **not** reveal him. Instead a small "!" shows over your hero: something is next to you, not which tile. Moving onto or through his tile reveals him (invisibility ends) and cancels the move; the action is not spent. A hidden enemy doesn't engage you (no move penalty). Scout's eye still sees invisible enemies within vision.

## Firewall (replaces Phoenix blessing)

**Firewall**: place a U of 5 burning tiles around yourself or an ally within 3, open on the side you choose. Enemies in it take 2 damage at the end of your turn, and 2 when they enter it or start their turn in it. Lasts until your next turn. Counts as your attack (damaging spell). Spell damage, so it ignores block; terrain −1 and minimum 1 still apply. First fix if too strong: drop the enter/start-of-turn tick to 1.
