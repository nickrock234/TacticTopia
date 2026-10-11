// Layer 1: combat math. Deterministic, so every number here is exact for the
// rules and numbers as currently written.
//
// Run:  node sim/combat-matrix.ts      → writes sim/reports/combat-matrix.md
//
// Questions it answers:
//   1. Burst: the most damage one hero can deal to one target in one turn.
//   2. Which one-turn KOs from full HP exist, and how.
//   3. Team focus: which PAIRS of heroes can KO a target from full in one round.
//   4. Mana: over 4 turns, does mana force choices, with and without +1 regen?

import { writeFileSync, mkdirSync } from 'node:fs';
import { CLASSES, HERO_STATS, MANA, type ClassId } from '../engine/numbers.ts';
import { evaluate, describe, defender, maxMana, type Stage, type Plan } from '../engine/attacks.ts';
import { STAGES, cap, plansFor as enumeratePlans, bestSolo, sustained, defaultWeapon } from './lib.ts';

const out: string[] = [];
const say = (s = '') => out.push(s);

const kos: { stage: string; att: ClassId; tgt: ClassId; armored: boolean; approach: boolean; dmg: number; how: string }[] = [];

say('# Layer 1 — Combat math');
say();
say(`Generated ${new Date().toISOString().slice(0, 10)} from \`engine/numbers.ts\`. Deterministic: these are exact for the current rules and numbers.`);
say();
say('## How to read this');
say();
say('**Stages** are assumed skill and gear budgets (the economy simulation will map them to turn numbers later):');
say();
say('| Stage | XP spent | Gear | Elements available |');
say('| --- | --- | --- | --- |');
const gearText = ['starting weapon, no shield', 'Blacksmith +1, both weapons, shield 1', 'Blacksmith + Refinery (+2), shield 2+1 = 3, Monastery'];
for (const s of STAGES) say(`| ${s.name} | ${s.xp} | ${gearText[s.gear]} | ${s.elements} |`);
say();
say('- **Burst** = the most damage one hero deals to one target in one turn (2 actions, at most one attack, plus free actions). For each cell the simulator tries **every** build that fits the XP budget and keeps the best one, so it is the worst case for the defender.');
say('- **Approach** = the attacker spends one action moving, then attacks (a real dive). **In position** = already in range, so both actions go to fighting (e.g. Empower, then attack).');
say('- **Armored** target = a defence-minded hero at that gear tier: shield (one-handed classes only), plus Stoneskin at Late/Endgame, plus Intimidate for barbarians. **Open** = no defences.');
say('- **Bold** = one-turn KO from full HP. Target HP: ' + CLASSES.map(c => `${cap(c)} ${HERO_STATS[c].hp}`).join(', ') + '.');
say('- Vengeance (barbarian below half HP) is left out of the main tables and shown in its own section below.');
say();

for (const armored of [false, true]) {
  say(`## Solo burst vs ${armored ? 'ARMORED' : 'OPEN'} targets`);
  say();
  say('Cells: **approach** / in position.');
  say();
  for (const stage of STAGES) {
    say(`### ${stage.name}`);
    say();
    say(`| Attacker ↓ Target → | ${CLASSES.map(cap).join(' | ')} |`);
    say(`| --- | ${CLASSES.map(() => '---').join(' | ')} |`);
    for (const att of CLASSES) {
      const cells = CLASSES.map(tgt => {
        const hp = HERO_STATS[tgt].hp;
        const a = bestSolo(att, tgt, stage, armored, true);
        const p = bestSolo(att, tgt, stage, armored, false);
        if (a.dmg >= hp) kos.push({ stage: stage.name, att, tgt, armored, approach: true, dmg: a.dmg, how: describe(a.plan!) });
        else if (p.dmg >= hp) kos.push({ stage: stage.name, att, tgt, armored, approach: false, dmg: p.dmg, how: describe(p.plan!) });
        const f = (n: number) => (n >= hp ? `**${n}**` : `${n}`);
        return `${f(a.dmg)} / ${f(p.dmg)}`;
      });
      say(`| ${cap(att)} | ${cells.join(' | ')} |`);
    }
    say();
  }
}

say('## One-turn KOs from full HP (single hero)');
say();
if (!kos.length) say('None.');
else {
  say('| Stage | Attacker | Target | Target defences | Damage | How |');
  say('| --- | --- | --- | --- | --- | --- |');
  for (const k of kos) say(`| ${k.stage} | ${cap(k.att)} | ${cap(k.tgt)} (${HERO_STATS[k.tgt].hp}) | ${k.armored ? 'armored' : 'open'} | ${k.dmg}${k.approach ? '' : ' (in position only)'} | ${k.how} |`);
}
say();

// Vengeance
say('## Vengeance (barbarian at or below the Vengeance threshold)');
say();
say('Barbarian burst on the approach while Vengeance is active, vs open / armored targets.');
say();
say(`| Stage | ${CLASSES.map(cap).join(' | ')} |`);
say(`| --- | ${CLASSES.map(() => '---').join(' | ')} |`);
for (const stage of STAGES.filter(s => s.xp >= 150)) {
  const cells = CLASSES.map(t => {
    const hp = HERO_STATS[t].hp;
    const o = bestSolo('barbarian', t, stage, false, true, true).dmg;
    const a = bestSolo('barbarian', t, stage, true, true, true).dmg;
    const f = (n: number) => (n >= hp ? `**${n}**` : `${n}`);
    return `${f(o)} / ${f(a)}`;
  });
  say(`| ${stage.name} | ${cells.join(' | ')} |`);
}
say();

// ---------- 3. team focus ----------

// B's best damage depends only on the context A leaves behind (16 combinations),
// so it is computed once per context instead of once per A plan.
function bestPair(a: ClassId, b: ClassId, tgt: ClassId, stage: Stage, armored: boolean): { dmg: number; how: string } {
  const d = defender(tgt, stage.gear, armored);
  const plansA = enumeratePlans(a, stage, { team: true });
  const plansB = enumeratePlans(b, stage, { team: true }).filter(p => p.pre !== 'empowerAlly');
  const bBest = new Map<string, { dmg: number; plan: Plan | null }>();
  const forCtx = (emp: boolean, insp: boolean, mark: boolean, shat: boolean) => {
    const key = `${emp}${insp}${mark}${shat}`;
    let v = bBest.get(key);
    if (!v) {
      v = { dmg: 0, plan: null };
      const d2 = { ...d, marked: d.marked || mark, shattered: d.shattered + (shat ? 1 : 0) };
      for (const pb of plansB) {
        const ob = evaluate(pb, stage, d2, { empowered: emp, inspired: insp, fromInvis: true });
        if (ob.damage > v.dmg) v = { dmg: ob.damage, plan: pb };
      }
      bBest.set(key, v);
    }
    return v;
  };
  let best = { dmg: 0, how: '' };
  for (const pa of plansA) {
    const oa = evaluate(pa, stage, d, { fromInvis: true });
    const vb = forCtx(oa.empowersAlly, oa.inspires, oa.marks, oa.shatters);
    if (oa.damage + vb.dmg > best.dmg) best = { dmg: oa.damage + vb.dmg, how: `${cap(a)}: ${describe(pa)} ⇒ ${cap(b)}: ${describe(vb.plan!)}` };
  }
  return best;
}

say('## Team focus: can two heroes KO a target from full in one round?');
say();
say('Two teammates act back to back on one target, both **in position**. The first one\'s effects (Hunter\'s mark, Inspire, Empower on the ally, Shattering) help the second. Order is tried both ways. Cell = how many of the 15 possible attacker pairs (duplicates allowed) can KO that target from full.');
say();
const pairs: [ClassId, ClassId][] = [];
CLASSES.forEach((a, i) => CLASSES.slice(i).forEach(b => pairs.push([a, b])));
const pairDetail: string[] = [];
for (const armored of [false, true]) {
  say(`### vs ${armored ? 'armored' : 'open'} targets`);
  say();
  say(`| Stage | ${CLASSES.map(c => `${cap(c)} (${HERO_STATS[c].hp})`).join(' | ')} |`);
  say(`| --- | ${CLASSES.map(() => '---').join(' | ')} |`);
  for (const stage of STAGES) {
    const cells = CLASSES.map(tgt => {
      let n = 0;
      let weakest: { dmg: number; pair: string } | null = null;
      for (const [a, b] of pairs) {
        const r1 = bestPair(a, b, tgt, stage, armored);
        const r2 = a === b ? r1 : bestPair(b, a, tgt, stage, armored);
        const r = r1.dmg >= r2.dmg ? r1 : r2;
        if (r.dmg >= HERO_STATS[tgt].hp) n++;
        if (!weakest || r.dmg < weakest.dmg) weakest = { dmg: r.dmg, pair: `${cap(a)}+${cap(b)}` };
      }
      if (armored && (stage.name === 'Start' || stage.name === 'Mid' || stage.name === 'Endgame'))
        pairDetail.push(`| ${stage.name} | ${cap(tgt)} | ${n}/15 | ${weakest!.pair} (${weakest!.dmg}) |`);
      return `${n}/15`;
    });
    say(`| ${stage.name} | ${cells.join(' | ')} |`);
  }
  say();
}
say('Weakest pair against each armored target (the pair with the lowest best damage):');
say();
say('| Stage | Target | Pairs that KO | Weakest pair (its damage) |');
say('| --- | --- | --- | --- |');
pairDetail.forEach(l => say(l));
say();

// ---------- 4. mana over several turns ----------

say('## Mana over 4 turns: does it force choices?');
say();
say('Best total damage over 4 turns against an armored knight, starting at full mana. "Skill turns" = turns that spent mana. Two situations:');
say();
say('- **Standing** = in range every turn, so the second action is free (Empower, Inspire, or Rest).');
say('- **Moving** = the second action is a move every turn (chasing, kiting, repositioning), so there is never a spare action to rest.');
say();
say('Compares the current rule (+1 mana per turn) with the no-regen fallback.');
say();
say('| Stage | Class | Max mana | Standing, +1 regen | Standing, no regen | Moving, +1 regen | Moving, no regen |');
say('| --- | --- | --- | --- | --- | --- | --- |');
const seqs: string[] = [];
for (const stage of STAGES.filter(s => ['Early', 'Mid', 'Late'].includes(s.name))) {
  for (const cls of CLASSES) {
    const cells = [false, true].flatMap(mobile => [1, 0].map(regen => sustained(cls, stage, { turns: 4, regen, mobile, restWithAttack: MANA.restWithAttack })));
    const mm = maxMana(cls, defaultWeapon(cls), stage.gear);
    say(`| ${stage.name} | ${cap(cls)} | ${mm} | ${cells.map(c => `${c.total} (${c.skillTurns}/4)`).join(' | ')} |`);
    seqs.push(`| ${stage.name} | ${cap(cls)} | ${cells[2].line} | ${cells[3].line} |`);
  }
}
say();
say('Best 4-turn sequences while moving:');
say();
say('| Stage | Class | +1 regen | No regen |');
say('| --- | --- | --- | --- |');
seqs.forEach(l => say(l));
say();

mkdirSync(new URL('./reports/', import.meta.url), { recursive: true });
writeFileSync(new URL('./reports/combat-matrix.md', import.meta.url), out.join('\n'));
console.log(`wrote sim/reports/combat-matrix.md (${out.length} lines, ${kos.length} solo KO cases)`);
