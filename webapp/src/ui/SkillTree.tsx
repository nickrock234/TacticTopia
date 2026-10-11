// Skill tree (packet 006, "Skill Tree Phone"): a radial tree on a 390×844 board.
//   Inner ring round the portrait: the two class lines (offense curls down the
//   left from the top, defense up the right from the bottom); the starting perk
//   fills the bottom gap as an owned node.
//   Outer wheel, fixed spots: Fire top-left, Earth top-right, Water bottom, each
//   with two branches of two nodes on a tinted wedge.
//   Hybrids sit in the gaps, locked in two halves: owning either outer node of a
//   parent element opens the half facing it.
// Drag to pan, pinch or wheel to zoom. Tap a node for its sheet (Learn).

import { useRef, useState } from 'react';
import type { GameState, Hero } from '@engine/state.ts';
import type { Element } from '@engine/numbers.ts';
import { SKILL_NODES, hybridUnlocked } from '@engine/skills.ts';
import { canLearn, skillCost, elementsAvailable } from '@engine/rules.ts';
import type { Action } from '@engine/match.ts';
import { SkillPreview } from './SkillPreview.tsx';
import type { Atlas } from '../art/sprites.ts';
import { SKILL_TEXT, skillMana, skillIcon, START_PERK } from './info.ts';

const CX = 195, CY = 456, R_RING = 96, R1 = 222, R2 = 300, RH = 236, SPREAD = 13;
const POS: Record<Element, number> = { fire: 300, earth: 60, water: 180 };
const ELS: Element[] = ['earth', 'water', 'fire'];
const COL: Record<string, [string, string]> = {
  cls: ['#a8203e', '#ff9aa8'], fire: ['#b2482a', '#ffb020'], water: ['#2160b8', '#7ae0ff'], earth: ['#5c3a24', '#b08a3a'],
  lightning: ['#8a7a20', '#fff45a'], poison: ['#5a2478', '#b8e02a'], nature: ['#1d6b30', '#a6f06a'],
};
const BRANCHES: Record<Element, [[string, string], [string, string]]> = {
  fire: [['flaming', 'fireball'], ['burningAura', 'firewall']],
  water: [['chilling', 'tidalWave'], ['windchill', 'iceBlock']],
  earth: [['shattering', 'quake'], ['stoneskin', 'fortify']],
};
const HYBRID: Record<string, string> = { 'fire|water': 'lightning', 'earth|fire': 'poison', 'earth|water': 'nature' };
const ELEMENT_NAME: Record<Element, string> = { fire: 'Fire', water: 'Water', earth: 'Earth' };

const pt = (deg: number, r: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [Math.round(CX + r * Math.cos(a)), Math.round(CY + r * Math.sin(a))];
};
const wedge = (a1: number, a2: number, r0: number, r1: number) => {
  const p = (a: number, r: number) => pt(a, r).join(' ');
  return `M${p(a1, r0)} L${p(a1, r1)} A${r1} ${r1} 0 0 1 ${p(a2, r1)} L${p(a2, r0)} A${r0} ${r0} 0 0 0 ${p(a1, r0)} Z`;
};

type State = 'owned' | 'avail' | 'pricey' | 'locked';
interface NodeView {
  id: string; x: number; y: number; state: State; cost: number; pad?: boolean;
  half?: { polyA: string; polyB: string; openA: boolean; openB: boolean; glow: string | null };
}

/** Everything canLearn checks except XP. */
function reachableNode(g: GameState, h: Hero, id: string): boolean {
  const n = SKILL_NODES[id];
  if (n.cls && n.cls !== h.cls) return false;
  if (n.requires.some(r => !h.skills.has(r))) return false;
  if (n.element && !elementsAvailable(g, h).has(n.element)) return false;
  if (n.hybridOf && !hybridUnlocked(id, h.skills)) return false;
  return true;
}

export function SkillTree({ g, hero, atlas, canBuy, onClose, act }: {
  g: GameState; hero: Hero; atlas: Atlas; canBuy: boolean; onClose: () => void; act: (a: Action) => boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [view, setView] = useState({ s: 0.78, x: 0, y: 0 });
  const xp = g.players[hero.player].xp;

  const stateOf = (id: string): State => {
    if (hero.skills.has(id)) return 'owned';
    if (!reachableNode(g, hero, id)) return 'locked';
    return xp >= skillCost(g, hero, id) ? 'avail' : 'pricey';
  };

  // ---------- layout ----------
  const nodes: NodeView[] = [];
  const lines: { a: [number, number]; b: [number, number]; on: boolean; dash: boolean }[] = [];
  const hub: [number, number] = [CX, CY];
  const classLines = Object.values(SKILL_NODES).filter(n => n.cls === hero.cls);
  const lineIds = [classLines.slice(0, 3).map(n => n.id), classLines.slice(3, 6).map(n => n.id)];
  const ringAng = [[-36, -90, -144], [144, 90, 36]];
  lineIds.forEach((ids, li) => {
    let prev = hub;
    ids.forEach((id, i) => {
      const p = pt(ringAng[li][i], R_RING);
      const st = stateOf(id);
      lines.push({ a: prev, b: p, on: st === 'owned', dash: false });
      nodes.push({ id, x: p[0], y: p[1], state: st, cost: skillCost(g, hero, id) });
      prev = p;
    });
  });
  const perk = START_PERK[hero.cls];
  const perkPos = pt(180, R_RING);
  if (perk) lines.push({ a: hub, b: perkPos, on: true, dash: false });

  const open = elementsAvailable(g, hero);
  const wedges = ELS.map(e => ({ d: wedge(POS[e] - 34, POS[e] + 34, 166, 340), c: COL[e][1], op: open.has(e) ? 0.14 : 0.06 }));
  const outer: Partial<Record<Element, boolean>> = {};
  for (const e of ELS) {
    const isOpen = open.has(e);
    [-SPREAD, SPREAD].forEach((off, b) => {
      const a1 = pt(POS[e] + off, R1), a2 = pt(POS[e] + off * 1.15, R2);
      const [n1, n2] = BRANCHES[e][b];
      const s1 = stateOf(n1), s2 = stateOf(n2);
      lines.push({ a: a1, b: a2, on: s1 === 'owned' && s2 === 'owned', dash: !isOpen });
      nodes.push({ id: n1, x: a1[0], y: a1[1], state: s1, cost: skillCost(g, hero, n1), pad: !isOpen });
      nodes.push({ id: n2, x: a2[0], y: a2[1], state: s2, cost: skillCost(g, hero, n2) });
      if (s2 === 'owned') outer[e] = true;
    });
  }
  ELS.forEach((e, ei) => {
    const f = ELS[(ei + 1) % 3];
    const id = HYBRID[[e, f].sort().join('|')];
    const aA = POS[e], aB = POS[f] < aA ? POS[f] + 360 : POS[f], ang = (aA + aB) / 2;
    const p = pt(ang, RH);
    const okA = !!outer[e], okB = !!outer[f];
    const st = stateOf(id);
    if ((okA && okB) || st === 'owned') { nodes.push({ id, x: p[0], y: p[1], state: st, cost: skillCost(g, hero, id) }); return; }
    const rad = (ang * Math.PI) / 180, d = [Math.sin(rad), -Math.cos(rad)], nB = [Math.cos(rad), Math.sin(rad)];
    const poly = (sg: number) => [
      [24 + d[0] * 99, 24 + d[1] * 99], [24 + d[0] * 99 + sg * nB[0] * 99, 24 + d[1] * 99 + sg * nB[1] * 99],
      [24 - d[0] * 99 + sg * nB[0] * 99, 24 - d[1] * 99 + sg * nB[1] * 99], [24 - d[0] * 99, 24 - d[1] * 99],
    ].map(q => q.map(Math.round).join(',')).join(' ');
    const glow = okA ? COL[e][1] : okB ? COL[f][1] : null;
    nodes.push({ id, x: p[0], y: p[1], state: 'locked', cost: skillCost(g, hero, id), half: { polyA: poly(-1), polyB: poly(1), openA: okA, openB: okB, glow } });
  });

  // ---------- pan / zoom ----------
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);
  const pinch = useRef({ d: 0, s: 1 });
  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 1) moved.current = 0;
    if (ptrs.current.size === 2) { const [a, b] = [...ptrs.current.values()]; pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s }; }
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = ptrs.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    ptrs.current.set(e.pointerId, cur);
    if (ptrs.current.size === 1) {
      moved.current += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y);
      setView(v => ({ ...v, x: v.x + cur.x - prev.x, y: v.y + cur.y - prev.y }));
    } else if (ptrs.current.size === 2) {
      moved.current = 999;
      const [a, b] = [...ptrs.current.values()];
      const s = Math.min(1.4, Math.max(0.45, pinch.current.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d)));
      setView(v => ({ ...v, s }));
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const wasTap = ptrs.current.size === 1 && moved.current < 8;
    ptrs.current.delete(e.pointerId);
    if (!wasTap) return;
    // which node is under the finger? (nodes are 48 px at board scale)
    const board = (e.currentTarget as HTMLElement).querySelector('.tree-board')!.getBoundingClientRect();
    const k = board.width / 390;
    const bx = (e.clientX - board.left) / k, by = (e.clientY - board.top) / k;
    const hit = nodes.find(n => Math.abs(n.x - bx) <= 28 && Math.abs(n.y - by) <= 28);
    if (hit) setSel(hit.id);
    else if (perk && Math.abs(perkPos[0] - bx) <= 28 && Math.abs(perkPos[1] - by) <= 28) setSel('#perk');
    else setSel(null);
  };
  const onWheel = (e: React.WheelEvent) => setView(v => ({ ...v, s: Math.min(1.4, Math.max(0.45, v.s * (e.deltaY < 0 ? 1.1 : 0.9))) }));

  // Icons still missing from packet 005 show the skill's initials.
  const initials = (id: string) => SKILL_NODES[id].name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const icon = (id: string, cls = '') => atlas.has(skillIcon(id))
    ? <img className={`node-icon ${cls}`} src={`art/${skillIcon(id)}.png`} alt="" draggable={false} />
    : <div className={`node-icon node-blank ${cls}`}>{initials(id)}</div>;

  // ---------- detail sheet ----------
  const selNode = sel && sel !== '#perk' ? SKILL_NODES[sel] : null;
  const lockReason = (id: string): string => {
    const n = SKILL_NODES[id];
    if (n.element && !open.has(n.element)) return `Claim a ${ELEMENT_NAME[n.element]} landmark.`;
    if (n.hybridOf) return n.hybridOf.map(e => BRANCHES[e].map(b => SKILL_NODES[b[1]].name).join(' or ')).join(' + ');
    return `Needs ${n.requires.map(r => SKILL_NODES[r].name).join(', ')}.`;
  };

  return (
    <div className="screen tree" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={e => ptrs.current.delete(e.pointerId)} onWheel={onWheel}>
      <div className="tree-viewport">
        <div className="tree-board" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
          <svg width="390" height="844" className="tree-svg">
            {wedges.map((w, i) => <path key={i} d={w.d} fill={w.c} fillOpacity={w.op} stroke={w.c} strokeOpacity={0.5} strokeWidth={2} />)}
            <circle cx={CX} cy={CY} r={146} fill="#0b0d2a" fillOpacity={0.45} stroke="#6f80d8" strokeOpacity={0.5} strokeWidth={2} />
            {lines.map((l, i) => <line key={i} x1={l.a[0]} y1={l.a[1]} x2={l.b[0]} y2={l.b[1]} stroke={l.on ? '#f4c030' : '#a8b8ff'} strokeOpacity={l.on ? 0.45 : 0.16} strokeWidth={2} strokeDasharray={l.dash ? '3 5' : undefined} />)}
          </svg>
          <div className={`tree-portrait ${hero.team ? 'blue' : 'red'}`}><img src={`art/portraits/portrait_${hero.cls}.png`} alt="" draggable={false} /></div>
          {perk && (
            <div className="tree-node" style={{ left: perkPos[0], top: perkPos[1] }}>
              {perk.icon && atlas.has(perk.icon) ? <img className="node-icon owned" src={`art/${perk.icon}.png`} alt="" draggable={false} /> : <div className="node-icon node-blank owned">{perk.name[0]}</div>}
            </div>
          )}
          {nodes.map(n => (
            <div key={n.id} className={`tree-node${sel === n.id ? ' sel' : ''}`} style={{ left: n.x, top: n.y }}>
              {n.half ? (
                <div className="node-half" style={{ filter: n.half.glow ? `drop-shadow(0 0 6px ${n.half.glow})` : undefined }}>
                  {icon(n.id, 'locked')}
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <defs>
                      <clipPath id={`${n.id}A`}><polygon points={n.half.polyA} /></clipPath>
                      <clipPath id={`${n.id}B`}><polygon points={n.half.polyB} /></clipPath>
                    </defs>
                    {([['A', n.half.openA], ['B', n.half.openB]] as const).map(([k, isOpen]) => (
                      <g key={k} clipPath={`url(#${n.id}${k})`}>
                        {isOpen && atlas.has(skillIcon(n.id)) && <image href={`art/${skillIcon(n.id)}.png`} x={0} y={0} width={48} height={48} style={{ imageRendering: 'pixelated' }} />}
                        {!isOpen && <Padlock />}
                      </g>
                    ))}
                  </svg>
                </div>
              ) : (
                <div className="node-wrap">
                  {icon(n.id, n.state)}
                  {n.state === 'locked' && n.pad && <svg className="node-pad" width="48" height="48" viewBox="0 0 48 48"><Padlock /></svg>}
                  {n.state !== 'owned' && !n.pad && <span className={`node-cost ${n.state}`}>{n.cost}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="screen-head" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
        <button className="back" onClick={onClose}>‹</button>
        <span className="screen-title">{hero.cls[0].toUpperCase() + hero.cls.slice(1)}</span>
        <span className="chip xp"><img src="art/icons/icon_xp.png" alt="XP" />{xp}</span>
      </div>

      {sel === '#perk' && perk && (
        <div className="window detail" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
          <div className="detail-head"><span className="detail-name">{perk.name}</span></div>
          <span>{perk.text}</span>
        </div>
      )}
      {selNode && (
        <div className="window detail" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
          <div className="detail-head">
            {atlas.has(skillIcon(selNode.id)) ? <img className="detail-icon" src={`art/${skillIcon(selNode.id)}.png`} alt="" /> : <div className="detail-icon node-blank">{initials(selNode.id)}</div>}
            <span className="detail-name">{selNode.name}</span>
            {skillMana(selNode.id) !== null && <span className="detail-mana">{skillMana(selNode.id)}<img src="art/icons16/icon16_mana.png" alt="mana" /></span>}
          </div>
          <SkillPreview atlas={atlas} skill={selNode.id} cls={hero.cls} element={hero.element} />
          <span>{SKILL_TEXT[selNode.id] ?? ''}</span>
          {stateOf(selNode.id) === 'locked' && <span className="detail-lock">{lockReason(selNode.id)}</span>}
          <div className="detail-buttons">
            <button className="detail-x" onClick={() => setSel(null)}>✕</button>
            {/* Design (handoff 006): ✓ owned · LEARN + cost · LEARN with the cost in red when short · padlock + cost when locked */}
            {stateOf(selNode.id) === 'owned' ? <span className="detail-go owned">✓</span>
              : stateOf(selNode.id) === 'locked' ? <span className="detail-go locked"><svg className="lock-svg" viewBox="10 8 28 32"><Padlock /></svg><img src="art/icons16/icon16_xp.png" alt="XP" />{skillCost(g, hero, selNode.id)}</span>
              : <button className={`detail-go${stateOf(selNode.id) === 'pricey' ? ' short' : ''}`} disabled={!canBuy || !canLearn(g, hero, selNode.id)}
                  onClick={() => { act({ t: 'learn', id: selNode.id }); }}>
                  LEARN <img src="art/icons16/icon16_xp.png" alt="XP" /><span className="cost">{skillCost(g, hero, selNode.id)}</span>
                </button>}
          </div>
        </div>
      )}
    </div>
  );
}

function Padlock() {
  return (
    <g>
      <path d="M18 22 V17 a6 6 0 0 1 12 0 V22" fill="none" stroke="#0b0d2a" strokeWidth={5} />
      <path d="M18 22 V17 a6 6 0 0 1 12 0 V22" fill="none" stroke="#c3c8d6" strokeWidth={3} />
      <rect x={13} y={21} width={22} height={16} rx={2} fill="#0b0d2a" />
      <rect x={14} y={22} width={20} height={14} rx={2} fill="#c3c8d6" />
    </g>
  );
}
