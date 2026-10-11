// Shared helpers for the simulations: stages, cached plan lists, best-burst
// search, and the multi-turn mana search.

import { HERO_STATS, MANA, SKILL, type ClassId } from '../engine/numbers.ts';
import { xpOf, elementsUsed } from '../engine/skills.ts';
import { enumeratePlans as enumerateRaw, evaluate, describe, defender, maxMana, type Stage, type Plan } from '../engine/attacks.ts';
import type { DefenderState } from '../engine/combat.ts';

export const STAGES: Stage[] = [
  // XP budgets scaled 1.5x on 2026-09-30 along with skill costs, so each stage
  // still buys roughly the same skills.
  { name: 'Start', xp: 0, gear: 0, elements: 1 },
  { name: 'Early', xp: 45, gear: 0, elements: 1 },
  { name: 'Early-mid', xp: 90, gear: 1, elements: 1 },
  { name: 'Mid', xp: 150, gear: 1, elements: 2 },
  { name: 'Late', xp: 240, gear: 2, elements: 3 },
  { name: 'Endgame', xp: 390, gear: 2, elements: 3 },
];
export const stage = (name: string) => STAGES.find(s => s.name === name)!;

export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export class Report {
  lines: string[] = [];
  say = (s = '') => { this.lines.push(s); };
  table(head: string[], rows: (string | number)[][]) {
    this.say(`| ${head.join(' | ')} |`);
    this.say(`| ${head.map(() => '---').join(' | ')} |`);
    rows.forEach(r => this.say(`| ${r.join(' | ')} |`));
    this.say();
  }
}

// Plan lists depend on the numbers (e.g. max mana), so the key includes them.
const planCache = new Map<string, Plan[]>();
export function plansFor(cls: ClassId, st: Stage, opts: { team?: boolean; approach?: boolean } = {}): Plan[] {
  const key = `${cls}|${st.name}|${!!opts.team}|${!!opts.approach}|${HERO_STATS[cls].mana}`;
  let v = planCache.get(key);
  if (!v) { v = enumerateRaw(cls, st, opts); planCache.set(key, v); }
  return v;
}

export interface Best { dmg: number; plan: Plan | null }

export function bestSolo(att: ClassId, tgt: ClassId, st: Stage, armored: boolean, approach: boolean, vengeance = false, target?: DefenderState): Best {
  const d = target ?? defender(tgt, st.gear, armored);
  let best: Best = { dmg: 0, plan: null };
  for (const plan of plansFor(att, st, { approach })) {
    const o = evaluate(plan, st, d, { vengeance, fromInvis: true });
    if (o.damage > best.dmg || (o.damage === best.dmg && best.plan && plan.xp < best.plan.xp)) best = { dmg: o.damage, plan };
  }
  return best;
}

export const defaultWeapon = (cls: ClassId) =>
  ({ knight: 'sword', barbarian: 'greataxe', archer: 'bow', mage: 'staff', thief: 'dagger' } as const)[cls];

// ---------- multi-turn mana search ----------

export interface SustainOpts {
  turns: number;
  regen: number;          // passive mana per turn
  mobile: boolean;        // must move every turn (no spare action)
  restWithAttack: boolean; // current rule: rest can be the 2nd action of an attack turn
}

export interface SustainResult { total: number; skillTurns: number; restTurns: number; line: string }

/**
 * Best total damage over several turns against an armored knight, starting at full
 * mana. A turn is either an ATTACK turn (one plan) or a REST-ONLY turn (no attack,
 * +rest mana; allowed in every mode, since you can always stop to rest).
 * If restWithAttack, a standing hero may also attack AND rest in the same turn.
 */
export function sustained(cls: ClassId, st: Stage, o: SustainOpts): SustainResult {
  const target = defender('knight', st.gear, true);
  const plans = plansFor(cls, st).filter(p => (o.mobile ? p.pre === 'move' : p.pre !== 'move') && p.attack !== 'ambush');
  // Candidate builds: node sets of the 12 strongest single-turn plans, plus
  // affordable unions of any two (exhaustive over all builds is too slow).
  const scored = plans.filter(p => !p.surge).map(p => ({ p, dmg: evaluate(p, st, target).damage })).sort((x, y) => y.dmg - x.dmg);
  const top: Set<string>[] = [];
  const seen = new Set<string>();
  for (const { p } of scored) {
    const k = [...p.nodes].sort().join(',');
    if (seen.has(k)) continue;
    seen.add(k); top.push(p.nodes);
    if (top.length === 12) break;
  }
  const builds = new Map<string, Set<string>>();
  for (const a of top) for (const b of top) {
    const u = new Set([...a, ...b]);
    if (xpOf(u) <= st.xp && elementsUsed(u).size <= st.elements) builds.set([...u].sort().join(','), u);
  }
  if (cls === 'mage') for (const u of [...builds.values()]) {
    const w = new Set([...u, 'deepRest', 'manaSurge']);
    if (xpOf(w) <= st.xp) builds.set([...w].sort().join(','), w);
  }

  let best: SustainResult = { total: -1, skillTurns: 0, restTurns: 0, line: '' };
  for (const nodes of builds.values()) {
    const usable = plans.filter(p => [...p.nodes].every(n => nodes.has(n)) && !p.surge && p.pre !== 'empowerAlly');
    const weapon = usable[0]?.weapon;
    if (!weapon) continue;
    const wplans = usable.filter(p => p.weapon === weapon);
    const mm = maxMana(cls, weapon, st.gear);
    const surgeOwned = nodes.has('manaSurge');
    const restAmt = MANA.restAmount + (nodes.has('deepRest') ? MANA.deepRestBonus : 0);
    type R = { total: number; skill: number; rests: number; seq: string[] };
    const memo = new Map<string, R>();
    const go = (t: number, mana: number, emp: number, insp: number, mark: number, surgeCd: number): R => {
      if (t === o.turns) return { total: 0, skill: 0, rests: 0, seq: [] };
      const mk = `${t}|${mana}|${emp}|${insp}|${mark}|${surgeCd}`;
      const hit = memo.get(mk);
      if (hit) return hit;
      const m = Math.min(mm, mana + (t === 0 ? 0 : o.regen));
      const dec = (x: number) => Math.max(0, x - 1);
      // Rest-only turn
      let r: R = (() => {
        const n = go(t + 1, Math.min(mm, m + restAmt), dec(emp), dec(insp), dec(mark), dec(surgeCd));
        return { total: n.total, skill: n.skill, rests: n.rests + 1, seq: ['REST', ...n.seq] };
      })();
      const surgeOpts = surgeOwned && surgeCd === 0 ? [false, true] : [false];
      for (const useSurge of surgeOpts) {
        const avail = Math.min(mm, m + (useSurge ? SKILL.manaSurge.amount : 0));
        for (const p of wplans) {
          if (p.mana > avail) continue;
          const restOpts = !o.mobile && o.restWithAttack && p.pre === 'none' ? [false, true] : [false];
          for (const rest of restOpts) {
            const dmg = evaluate(p, st, { ...target, marked: mark > 0 }, { empowered: emp > 0, inspired: insp > 0 }).damage;
            const after = Math.min(mm, avail - p.mana + (rest ? restAmt : 0));
            const n = go(t + 1, after,
              p.pre === 'empowerSelf' ? SKILL.empower.turns - 1 : dec(emp),
              p.pre === 'inspire' ? SKILL.inspire.turns - 1 : dec(insp),
              p.mark ? SKILL.huntersMark.turns - 1 : dec(mark),
              useSurge ? SKILL.manaSurge.every - 1 : dec(surgeCd));
            if (dmg + n.total > r.total) {
              const tag = describe(p).replace(` (${p.weapon})`, '').replace(/^move → /, '') + (rest ? ' + rest' : '') + (useSurge ? ' (+surge)' : '');
              r = { total: dmg + n.total, skill: n.skill + (p.mana > 0 ? 1 : 0), rests: n.rests, seq: [tag, ...n.seq] };
            }
          }
        }
      }
      memo.set(mk, r);
      return r;
    };
    const res = go(0, mm, 0, 0, 0, 0);
    if (res.total > best.total) best = { total: res.total, skillTurns: res.skill, restTurns: res.rests, line: res.seq.join(' ; ') };
  }
  return best;
}
