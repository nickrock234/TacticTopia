// The in-game screen: map + HUD + collapsible action bar.
//
// Turn flow: tap the map first. Tapping something you can hit selects Attack,
// tapping a tile you can reach selects Move; either way the confirm box opens
// above the action bar (Nick preferred a confirm box over tapping the tile twice).
// The menu is for actions with no map target, or to pick an attack skill.
//   Move   — blue tiles you can reach with one move action; faint tiles are within
//            range but blocked (terrain, units, or no path).
//   Attack — targets in reach pulse red, the rest of the reach is tinted; the box
//            previews the damage.
//   Skills — opens the sheet: attack skills (then pick a target) and self spells.
//   Rest   — +mana and a little HP (can share a turn with an attack).

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Atlas } from './art/sprites.ts';
import { MapCanvas } from './map/MapCanvas.tsx';
import type { Rot } from './map/view.ts';
import type { Highlights } from './map/renderer.ts';
import { Portrait } from './ui/Portrait.tsx';
import { SkillTree } from './ui/SkillTree.tsx';
import { BaseScreen } from './ui/BaseScreen.tsx';
import { ItemsPanel } from './ui/ItemsPanel.tsx';
import { ShopPanel } from './ui/ShopPanel.tsx';
import { QuestsPanel } from './ui/QuestsPanel.tsx';
import { HeroPanel } from './ui/HeroPanel.tsx';
import { LandmarkPanel } from './ui/LandmarkPanel.tsx';
import { IncomePopup } from './ui/IncomePopup.tsx';
import { NpcPanel, type NpcRef } from './ui/NpcPanel.tsx';
import type { GameSession } from './game/session.ts';
import { isHidden } from './game/remote.ts';
import { destinations, reachable, visibleTo, canAttack, decoySpot, canCast, moveBudget, previewAttack, weaponRange, attackEffects, spellEffects, inSpellArea, aimedEffects, AREA_SPELLS, SPELL_INFO, DAMAGING, type AttackOpt, type Target, type Spell, type AreaSpell, type Effect, type CastArgs } from '@engine/rules.ts';
import { AIMED, aimOptions, aimPreview, aimAction, firewallDefault, type Aim, type Aimable } from './game/aim.ts';
import { previewUnits } from './game/preview.ts';
import { cap } from './ui/items.ts';
import { AttackPanel, type PanelAction } from './ui/AttackPanel.tsx';
import { maxHp, maxManaOf, idx, hasStatus } from '@engine/state.ts';
import { TURN_LIMIT, SKILL, MANA, WEAPONS } from '@engine/numbers.ts';
import { skillIcon } from './ui/info.ts';
import { SKILL_NODES } from '@engine/skills.ts';

type Mode = 'move' | 'attack' | null;

const ATTACK_SKILLS = ['holyStrike', 'heavyStrike', 'charge', 'doubleStrike', 'pinningShot', 'arrowRain'] as const;
const SELF_SPELLS: Spell[] = ['selfHeal', 'crossHeal', 'iceBlock', 'invisibility', 'inspire', 'smite', 'quake'];
const isArea = (s: Spell): s is AreaSpell => (AREA_SPELLS as Spell[]).includes(s);

/** A spell's display name (Mage bolt is a starting spell, not a skill-tree node). */
const spellName = (s: string) => SKILL_NODES[s]?.name ?? (s === 'mageBolt' ? 'Mage bolt' : s);

/** Confirm-box summary of several effects. */
function summary(fx: Effect[], spell?: Spell): string {
  if (!fx.length) return 'No targets';
  const total = fx.reduce((n, e) => n + e.amount, 0);
  if (spell === 'inspire') return `+${fx[0].amount} attack, ${fx.length} ${fx.length === 1 ? 'hero' : 'heroes'}`;
  if (spell === 'crossHeal') return `+${total} HP`;
  const k = fx.filter(e => e.kills).length;
  return `${total} damage${k ? `, defeats ${k}` : ''}`;
}

/** session: a local game (game/session.ts) or an online one (game/remote.ts). onExit: back to Home. */
export default function App({ session, atlas, onExit }: { session: GameSession; atlas: Atlas; onExit: () => void }) {
  const version = useSyncExternalStore(cb => session.subscribe(cb), () => session.version);
  const [mode, setMode] = useState<Mode>('move');
  const [attackOpt, setAttackOpt] = useState<AttackOpt>('weapon');
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  // non-map actions waiting for confirmation (Rest, self spells)
  const [ask, setAsk] = useState<null | { kind: 'rest' } | { kind: 'surge' } | { kind: 'cure' } | { kind: 'decoy' } | { kind: 'launder'; gold: number } | { kind: 'spell'; spell: Spell }>(null);
  // an aimed spell from the Skills menu (game/aim.ts): tap a target / tile / direction, then confirm
  const [aim, setAim] = useState<Aim | null>(null);
  // Doublecast in progress: after the 1st spell is aimed and confirmed it waits here for the 2nd
  const [dc, setDc] = useState<null | { first?: { spell: Spell; args: CastArgs } }>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focus, setFocus] = useState<{ x: number; y: number; n: number } | null>(null);
  const [rot, setRot] = useState<Rot>(0);
  // full-screen pages over the map: skill tree (tap XP), base (tap gold)
  const [screen, setScreen] = useState<null | 'tree' | 'base'>(null);
  // bottom panels over the map: Items (H13), Shop (H12)
  const [panel, setPanel] = useState<null | 'items' | 'shop' | 'quests' | 'hero' | 'lm' | 'npc'>(null);
  const [npcInfo, setNpcInfo] = useState<NpcRef>({ kind: 'camp', idx: 0 }); // the monster the NPC panel shows
  const [infoId, setInfoId] = useState(0); // the hero (H9) or landmark (H15) the panel shows
  const [shopHint, setShopHint] = useState(false); // the locked-shop dialogue
  const [, bump] = useState(0);
  const [incomeSeen, setIncomeSeen] = useState(-1); // g.turnCounter of the last income summary dismissed

  useEffect(() => { session.start(); }, [session]);
  // Online the result of an action arrives a moment later: settle the mode once it has (offline,
  // after() already did this).
  useEffect(() => {
    if (!session.isHumanTurn) return;
    if (!me.pos || me.actionsLeft <= 0) setMode(null);
    else if (mode === 'attack' && me.attacked) setMode('move');
  }, [version]);

  const g = session.g;
  // HP lost since last render, as a red -X by the HP counter, so the number never just changes on its own
  const humanHp = session.humanHero.hp;
  const lastHp = useRef(humanHp);
  const [hurt, setHurt] = useState<{ n: number; k: number } | null>(null);
  useEffect(() => {
    if (humanHp < lastHp.current) setHurt({ n: lastHp.current - humanHp, k: Date.now() });
    lastHp.current = humanHp;
  }, [humanHp]);
  // Telepuppet: while you take the ally's one action, the screen works as that ally
  const puppet = session.puppet;
  const me = puppet ?? session.humanHero;
  const myTurn = session.isHumanTurn && !!me.pos && me.actionsLeft > 0;
  // Back from death with more than one place to come back (base + owned landmarks):
  // the options light up, tap one, confirm.
  const respawn = session.respawnChoice;

  // When the human's turn starts: reset the mode, centre the camera.
  const turnKey = `${g.round}:${session.turnIndex}:${!!me.pos}`; // :pos re-runs this after picking a respawn spot
  useEffect(() => {
    if (!session.isHumanTurn || !me.pos) return;
    setMode('move'); setAttackOpt('weapon'); setAim(null); setDc(null); setPending(null);
    // always re-centre at the start of your turn (also after respawning at base)
    setFocus(f => ({ ...me.pos!, n: (f?.n ?? 0) + 1 }));
    bump(n => n + 1);
  }, [turnKey]);

  // Telepuppet: the ally can attack or cast (not move); look at it
  useEffect(() => {
    if (!puppet?.pos) return;
    setMode('attack'); setAttackOpt('weapon'); setAim(null); setDc(null); setPending(null); setAsk(null);
    setFocus(f => ({ ...puppet.pos!, n: (f?.n ?? 0) + 1 }));
  }, [puppet?.id]);

  // Respawn choice: show the base first.
  useEffect(() => {
    if (!respawn) return;
    setPending(null); setAsk(null); setAim(null); setDc(null); setSheetOpen(false);
    setFocus(f => ({ ...respawn[0], n: (f?.n ?? 0) + 1 }));
  }, [respawn]);

  const highlights = useMemo(() => {
    const out: Highlights = { selected: me.pos, pending };
    if (respawn) { out.move = new Set(respawn.map(p => idx(g, p))); out.pulseMove = true; return out; }
    // landmark panel open: its territory pulses (stand on any of it to claim)
    if (panel === 'lm') {
      const m = g.map.landmarks[infoId];
      out.claim = new Set();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = m.x + dx, y = m.y + dy;
        if (x >= 0 && y >= 0 && x < g.map.w && y < g.map.h) out.claim.add(y * g.map.w + x);
      }
    }
    if (!myTurn || !me.pos) return out;
    if (mode === 'move') {
      out.move = new Set(destinations(g, me).filter(i => i !== idx(g, me.pos!)));
      // tiles within movement distance that can't be reached (terrain, units, detours)
      const b = moveBudget(g, me), blocked = new Set<number>();
      for (let dy = -b; dy <= b; dy++) for (let dx = -b; dx <= b; dx++) {
        const x = me.pos.x + dx, y = me.pos.y + dy;
        if ((dx || dy) && x >= 0 && y >= 0 && x < g.map.w && y < g.map.h && g.fog[me.team][y * g.map.w + x] && !out.move.has(y * g.map.w + x)) blocked.add(y * g.map.w + x);
      }
      out.blocked = blocked;
      // the route a pending move would take, for the path arrows
      if (pending) {
        const r = reachable(g, me), path: { x: number; y: number }[] = [];
        for (let c = idx(g, pending); r.has(c) && c !== -1; c = r.get(c)!.prev) path.unshift({ x: c % g.map.w, y: Math.floor(c / g.map.w) });
        if (path.length > 1) out.path = path;
      }
    }
    const tileSet = (pred: (x: number, y: number) => boolean, r: number) => {
      const s = new Set<number>();
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = me.pos!.x + dx, y = me.pos!.y + dy;
        if (x >= 0 && y >= 0 && x < g.map.w && y < g.map.h && g.fog[me.team][y * g.map.w + x] && pred(x, y)) s.add(y * g.map.w + x);
      }
      return s;
    };
    const showEffects = (fx: Effect[]) => {
      out.attack = new Set(fx.map(e => idx(g, e.pos)));
      // each affected unit glows and its HP bar previews the result (handoff 007)
      out.preview = new Map(previewUnits(g, me, fx).map(u => [u.tile, u.view]));
    };
    // Body double: where the decoy will stand
    if (ask?.kind === 'decoy') { const s = decoySpot(g, me); if (s) { out.area = new Set([idx(g, s)]); out.help = true; } return out; }
    // Aimed spells: first the choices (targets pulse; Fireball's reach and Tidal wave's 8 lines are
    // tinted), then, once one is picked, its area and everyone affected with a number over them.
    if (aim) {
      const kind = AIMED[aim.spell], opts = aimOptions(g, me, aim);
      out.help = kind === 'ally' || kind === 'body' || kind === 'teleport';
      if (kind === 'tile' || (kind === 'teleport' && aim.center !== undefined)) out.range = new Set(opts.map(o => o.tile));
      else if (kind === 'dir') out.area = new Set(opts.map(o => o.tile));
      else out.attack = new Set(opts.map(o => o.tile));
      const pick = pending && opts.find(o => o.tile === idx(g, pending));
      if (pick) {
        const { tiles, effects } = aimPreview(g, me, aim, pick.args);
        out.area = new Set(tiles.map(p => idx(g, p)));
        showEffects(effects);
        out.help = effects.length > 0 && effects.every(e => e.help);
      }
      return out;
    }
    // Area spells: the whole area lights up, everyone affected pulses with a number over them.
    if (ask?.kind === 'spell' && isArea(ask.spell)) {
      const s = ask.spell;
      out.area = tileSet((x, y) => inSpellArea(s, me.pos!, { x, y }), 4);
      out.help = s === 'crossHeal' || s === 'inspire';
      showEffects(spellEffects(g, me, s));
      return out;
    }
    if (mode === 'attack') {
      out.range = tileSet((x, y) => x !== me.pos!.x || y !== me.pos!.y, weaponRange(g, me, !!me.moved));
      const t = pending && targets(attackOpt).find(o => o.tile === pending.y * g.map.w + pending.x);
      // a target picked: show everything the attack hits (Flail, Arrow Rain: more than one)
      if (t) showEffects(attackEffects(g, me, t.t, attackOpt));
      else out.attack = new Set(targets(attackOpt).map(t => t.tile));
    }
    return out;
  }, [version, mode, attackOpt, pending, ask, aim, myTurn, respawn, panel, infoId]);

  function targets(opt: AttackOpt): { tile: number; t: Target }[] {
    const list: { tile: number; t: Target }[] = [];
    const add = (t: Target, x: number, y: number) => { if (canAttack(g, me, t, opt)) list.push({ tile: y * g.map.w + x, t }); };
    for (const h of g.heroes) if (h.pos) add({ kind: 'hero', id: h.id }, h.pos.x, h.pos.y);
    g.camps.forEach((c, i) => { if (c.respawn === 0) add({ kind: 'camp', id: i }, g.map.camps[i].x, g.map.camps[i].y); });
    g.landmarks.forEach((l, i) => {
      const m = g.map.landmarks[i];
      if (m.bonus === 'lair' && l.bossRespawn === 0) add({ kind: 'boss', id: i }, m.x, m.y);
      if (l.pending?.decoy) add({ kind: 'decoy', id: i }, l.pending.decoy.x, l.pending.decoy.y);
    });
    return list;
  }

  function after() {
    setPending(null);
    setAsk(null);
    if (aim) { setAim(null); setDc(null); if (me.actionsLeft > 0 && me.pos) setMode('move'); }
    session.changed();
    if (me.actionsLeft <= 0 || !me.pos) setMode(null);
    else if (mode === 'attack' && me.attacked) setMode('move');
  }

  // Tapping the map picks the action: something you can hit → Attack (with the
  // chosen skill, if one is armed), a tile you can reach → Move. The confirm box
  // below does it.
  /** What a tap could show details of: a hero you can see (H9), else a landmark territory (H15). */
  function infoAt(x: number, y: number): { hero: number } | { npc: NpcRef } | { lm: number } | null {
    const h = g.heroes.find(o => o.pos && o.pos.x === x && o.pos.y === y && (o.team === me.team || visibleTo(g, o, me.team)));
    if (h) return { hero: h.id };
    if (!g.fog[me.team][y * g.map.w + x]) return null;
    const camp = g.camps.find(c => c.respawn === 0 && g.map.camps[c.idx].x === x && g.map.camps[c.idx].y === y);
    if (camp) return { npc: { kind: 'camp', idx: camp.idx } };
    const lair = g.landmarks.find(l => g.map.landmarks[l.idx].bonus === 'lair' && l.bossRespawn === 0 && l.owner !== null && g.map.landmarks[l.idx].x === x && g.map.landmarks[l.idx].y === y);
    if (lair) return { npc: { kind: 'boss', idx: lair.idx } };
    const lm = g.map.landmarks.findIndex(m => Math.max(Math.abs(m.x - x), Math.abs(m.y - y)) <= 1);
    return lm >= 0 ? { lm } : null;
  }
  function openInfo(info: { hero: number } | { npc: NpcRef } | { lm: number } | null) {
    if (!info) return;
    if ('hero' in info) {
      const h = g.heroes[info.hero];
      if (h.team !== me.team && !visibleTo(g, h, me.team)) return; // hidden enemies stay hidden
      setInfoId(info.hero); setPanel('hero');
    } else if ('npc' in info) { setNpcInfo(info.npc); setPanel('npc'); }
    else { setInfoId(info.lm); setPanel('lm'); }
    setSheetOpen(false); setAsk(null); setAim(null); setDc(null); setPending(null);
  }

  // Tapping the map: an action first (attack a target, move to a tile, aim a spell). A tap that isn't
  // an action opens details: a hero (H9) or the landmark whose territory it is (H15). Off your turn,
  // every tap is a look.
  function onTapTile(x: number, y: number) {
    if (respawn) { setPending(respawn.some(p => p.x === x && p.y === y) ? { x, y } : null); return; }
    if (!myTurn || !me.pos) { openInfo(infoAt(x, y)); return; }
    const i = y * g.map.w + x;
    setAsk(null); setSheetOpen(false);
    // aiming a spell: a tap on one of its options picks it; anywhere else cancels the spell
    if (aim) {
      const opt = aimOptions(g, me, aim).find(o => o.tile === i);
      if (opt && AIMED[aim.spell] === 'teleport' && aim.center === undefined) { setAim({ ...aim, center: opt.args.hero! }); setPending(null); return; } // then where it lands
      if (opt && AIMED[aim.spell] === 'firewall' && aim.center === undefined) {
        // Firewall, first tap: the centre. The U starts open toward the caster; tap around it to turn it.
        const center = opt.args.hero!, def = firewallDefault(g, me, center);
        const next = { ...aim, center };
        setAim(next);
        const o = aimOptions(g, me, next).find(oo => oo.args.open === def.open) ?? aimOptions(g, me, next)[0];
        setPending(o ? { x: o.tile % g.map.w, y: Math.floor(o.tile / g.map.w) } : null);
        return;
      }
      if (opt) { setPending({ x, y }); return; }
      setAim(null); setDc(null);
    }
    const opt: AttackOpt = mode === 'attack' ? attackOpt : 'weapon';
    if (targets(opt).some(t => t.tile === i)) { setMode('attack'); setAttackOpt(opt); setPending({ x, y }); return; }
    if (!puppet && i !== idx(g, me.pos) && destinations(g, me).includes(i)) {
      setMode('move'); setAttackOpt('weapon'); setPending({ x, y });
      // a landmark's ground you can walk to: its details open too, with Move here? still asked below them
      const info = infoAt(x, y);
      if (info && 'lm' in info) { setInfoId(info.lm); setPanel('lm'); }
      return;
    }
    setPending(null);
    openInfo(infoAt(x, y)); // not an action: show what's there
  }

  function confirmPending() {
    if (panel === 'lm') setPanel(null); // a move confirmed from over the landmark panel closes it
    if (respawn) { if (pending) { const p = pending; setPending(null); session.act({ t: 'respawn', pos: p }); } return; }
    if (ask?.kind === 'rest') { session.act({ t: 'rest' }); return after(); }
    if (ask?.kind === 'surge') { session.act({ t: 'surge' }); return after(); }
    if (ask?.kind === 'cure') { session.act({ t: 'cure' }); return after(); }
    if (ask?.kind === 'decoy') { session.act({ t: 'decoy' }); return after(); }
    if (ask?.kind === 'launder') { session.act({ t: 'launder', gold: ask.gold }); return after(); }
    if (ask?.kind === 'spell') { session.act({ t: 'cast', spell: ask.spell, args: {} }); return after(); }
    if (!pending) return;
    if (aim) {
      const opt = aimOptions(g, me, aim).find(o => o.tile === idx(g, pending));
      if (opt && dc && !dc.first && aim.spell !== 'huntersMark') {
        // Doublecast, 1st spell chosen: keep it and pick the 2nd
        setAim(null); setDc({ first: { spell: aim.spell, args: opt.args } }); setPending(null); setSheetOpen(true);
        return;
      }
      if (opt && dc?.first && aim.spell !== 'huntersMark') session.act({ t: 'doublecast', s1: dc.first.spell, a1: dc.first.args, s2: aim.spell, a2: opt.args });
      else if (opt) session.act(aimAction(aim, opt.args));
      return after();
    }
    const i = pending.y * g.map.w + pending.x;
    if (mode === 'move') session.act({ t: 'move', to: pending });
    if (mode === 'attack') {
      const t = targets(attackOpt).find(o => o.tile === i);
      if (t) session.act({ t: 'attack', target: t.t, opt: attackOpt });
      setAttackOpt('weapon');
    }
    after();
  }

  /** The attack panel's content (handoff 007) for whatever is waiting for confirmation, if it hits or
   *  heals anyone: an attack on a picked target, a picked aimed spell, or an area spell. */
  function panelAction(): { act: PanelAction; units: ReturnType<typeof previewUnits> } | null {
    if (!myTurn || !me.pos || respawn) return null;
    let fx: Effect[] = [], act: PanelAction | null = null;
    if (aim && pending && aim.spell !== 'huntersMark') {
      const opt = aimOptions(g, me, aim).find(o => o.tile === idx(g, pending));
      if (!opt) return null;
      fx = aimPreview(g, me, aim, opt.args).effects;
      act = { name: spellName(aim.spell), icon: aim.spell === 'mageBolt' ? 'icons/icon_skill_mage_bolt' : skillIcon(aim.spell), mana: SPELL_INFO[aim.spell].mana, btn: 'CAST' };
    } else if (ask?.kind === 'spell' && isArea(ask.spell)) {
      fx = spellEffects(g, me, ask.spell);
      act = { name: spellName(ask.spell), icon: skillIcon(ask.spell), mana: SPELL_INFO[ask.spell].mana, btn: 'CAST' };
    } else if (mode === 'attack' && pending && !aim && !ask) {
      const t = targets(attackOpt).find(o => o.tile === idx(g, pending));
      if (!t) return null;
      fx = attackEffects(g, me, t.t, attackOpt);
      const pv = previewAttack(g, me, me.pos, me.moved, t.t, attackOpt);
      const holy = attackOpt === 'holyStrike' && fx.some(e => e.amount > 0) ? SKILL.holyStrike.healOnHit * WEAPONS[me.weapon].hits : 0;
      act = { name: attackOpt === 'weapon' ? 'Attack' : SKILL_NODES[attackOpt].name, icon: attackOpt === 'weapon' ? `icons/icon_item_${me.weapon}` : skillIcon(attackOpt),
        mana: attackOpt === 'weapon' ? 0 : SKILL[attackOpt].mana, btn: 'ATTACK', self: { dmg: pv?.selfDmg ?? 0, heal: holy } };
    }
    if (!act) return null;
    // a heal on yourself that comes with a hit (Nature) goes on your row, not the target list
    const harm = fx.some(e => !e.help);
    const mine = harm ? fx.find(e => e.help && e.pos.x === me.pos!.x && e.pos.y === me.pos!.y) : undefined;
    if (mine) { act.self = { dmg: act.self?.dmg ?? 0, heal: (act.self?.heal ?? 0) + mine.amount }; fx = fx.filter(e => e !== mine); }
    const units = previewUnits(g, me, fx);
    return units.length ? { act, units } : null;
  }

  /** What the confirm box says about the selected tile. */
  function pendingText(): string {
    if (ask?.kind === 'rest') {
      const mana = Math.min(maxManaOf(g, me) - me.mana, MANA.restAmount + (me.skills.has('deepRest') ? MANA.deepRestBonus : 0));
      const hp = Math.min(maxHp(g, me) - me.hp, MANA.restHeal);
      return `Rest? +${mana} mana, +${hp} HP`;
    }
    if (ask?.kind === 'cure') return 'Cure poison? −3 gold';
    if (ask?.kind === 'decoy') return 'Leave a Body double?';
    if (ask?.kind === 'launder') return `Launder? −${ask.gold} gold, +${ask.gold / 3} XP`;
    if (ask?.kind === 'surge') return `Mana surge? +${Math.min(maxManaOf(g, me) - me.mana, SKILL.manaSurge.amount)} mana`;
    if (ask?.kind === 'spell' && isArea(ask.spell)) return `${SKILL_NODES[ask.spell].name}? ${summary(spellEffects(g, me, ask.spell), ask.spell)}`;
    if (ask?.kind === 'spell') return `Cast ${SKILL_NODES[ask.spell].name}?`;
    if (aim && pending) {
      const opt = aimOptions(g, me, aim).find(o => o.tile === idx(g, pending));
      if (!opt) return '';
      const fx = aimPreview(g, me, aim, opt.args).effects;
      const harm = fx.filter(e => !e.help), help = fx.filter(e => e.help && e.amount > 0);
      const parts: string[] = [];
      if (harm.length) parts.push(summary(harm));
      else if (aim.spell !== 'huntersMark' && DAMAGING.has(aim.spell) && !help.length) parts.push('No targets');
      if (help.length) parts.push(aim.spell === 'empower' ? `+${help[0].amount} attack` : `+${help.reduce((n, e) => n + e.amount, 0)} HP`);
      if (aim.spell === 'firewall' && harm.length) parts[0] += ' at turn end';
      if (aim.spell === 'huntersMark') parts.push(`+${SKILL.huntersMark.bonus} damage taken, team +1 move`);
      if (aim.spell === 'teleport' && opt.args.hero !== undefined) parts.push(`then you act as ${cap(g.heroes[opt.args.hero].cls)}`);
      return `${aim.spell === 'huntersMark' ? "Hunter's mark" : spellName(aim.spell)}? ${parts.join(', ')}`.trim();
    }
    if (respawn && pending) return 'Respawn here?';
    if (!pending || !me.pos) return '';
    if (mode === 'move') return 'Move here?';
    const t = targets(attackOpt).find(o => o.tile === pending.y * g.map.w + pending.x);
    if (!t) return '';
    const name = t.t.kind === 'hero' ? `enemy ${g.heroes[t.t.id].cls}` : t.t.kind === 'camp' ? 'monster' : t.t.kind === 'boss' ? 'lair boss' : 'Body double';
    const pv = previewAttack(g, me, me.pos, me.moved, t.t, attackOpt);
    const label = attackOpt === 'weapon' ? 'Attack' : SKILL_NODES[attackOpt].name;
    const fx = attackEffects(g, me, t.t, attackOpt);
    if (fx.length > 1) return `${label}? ${summary(fx)}${pv?.selfDmg ? `, you take ${pv.selfDmg}` : ''}`;
    if (!pv) return `${label} ${name}?`;
    return `${label} ${name}? ${pv.kills ? 'Defeats it' : `${pv.dmg} damage`}${pv.selfDmg ? `, you take ${pv.selfDmg}` : ''}`;
  }


  const pl = g.players[me.player];
  const skillsOwned = [...me.skills];
  const current = session.current;
  // aimed spells this hero can use (Mage bolt comes with the mage)
  const aimedOwned = (Object.keys(AIMED) as Aimable[]).filter(s => s === 'mageBolt' ? me.cls === 'mage' : me.skills.has(s));
  // spells Doublecast can pair: the aimed ones you have, except Hunter's mark (not a spell) and Telepuppet (ends the turn)
  const dcSpells = aimedOwned.filter((s): s is Spell => s !== 'huntersMark' && s !== 'teleport');
  const hasActives = aimedOwned.length > 0 || me.skills.has('manaSurge') || me.skills.has('launder') || hasStatus(me, 'poison') || (me.cls === 'thief' && !!decoySpot(g, me)) || skillsOwned.some(s => (ATTACK_SKILLS as readonly string[]).includes(s) || SELF_SPELLS.includes(s as Spell));
  // At the turn limit the team with the most kills wins (tie: draw).
  const teamKills = [0, 1].map(t => g.heroes.filter(h => h.team === t).reduce((n, h) => n + g.stats.kills[h.id], 0));
  const result = g.winner ?? (teamKills[0] === teamKills[1] ? null : teamKills[0] > teamKills[1] ? 0 : 1);
  // End turn glows once both actions are spent (or the hero is down). With Rest
  // allowed after an attack, any action left can always be used.
  // the start-of-turn income summary, once per turn (not while picking a respawn spot: income comes after)
  const rawReport = g.players[session.humanHero.player].report;
  const incomeReport = session.isHumanTurn && !respawn && !session.over && rawReport && rawReport.turn !== incomeSeen ? rawReport : null;
  const nothingLeft = session.isHumanTurn && !myTurn && !respawn;
  // anything waiting for confirmation that hits or heals someone gets the attack panel (handoff 007)
  const pa = panelAction();
  // the shop opens with an owned merchant landmark or a forge (the Armory needs the forge)
  const shopOpen = g.landmarks.some(l => l.owner === me.player && g.map.landmarks[l.idx].bonus === 'merchant') || g.players[me.player].buildings.has('forge');
  // the landmark panel is open over a pending move: keep the Move here? box visible above the backdrop
  const lmMove = panel === 'lm' && !!pending && mode === 'move' && myTurn;

  return (
    <div className="app">
      <MapCanvas atlas={atlas} game={g} version={version} viewerTeam={me.team} highlights={highlights} focus={focus} rot={rot} onTapTile={onTapTile} />

      {/* ---------- top: turn strip + resources ---------- */}
      <div className="hud-top">
        <div className="row">
          <div className="window turn-strip">
            <div className="turn-no"><span>TURN</span><b>{Math.min(g.round, TURN_LIMIT)}</b></div>
            {g.order.map(id => {
              const h = g.heroes[id];
              const cls = ['portrait', h.team ? 'blue' : 'red', id === current.id ? 'current' : '', !h.pos && !isHidden(h) ? 'dead' : '', h.eliminated ? 'out' : ''].join(' ');
              const state = !h.pos && !isHidden(h) ? 2 : h.hp <= maxHp(g, h) / 2 ? 1 : 0;
              return <div key={id} className={cls} onClick={() => openInfo({ hero: id })}><Portrait atlas={atlas} cls={h.cls} team={h.team} state={state} /></div>;
            })}
          </div>
          <button className={`end-turn${nothingLeft ? ' glow' : ''}`} disabled={!session.isHumanTurn || !!respawn} onClick={() => { setSheetOpen(false); session.act({ t: 'end' }); }}>{puppet ? 'SKIP' : <>END<br />TURN</>}</button>
        </div>
        <div className="window resources">
          <span className="res-hp"><img src="art/icons/icon_hp.png" alt="HP" /><b>{me.hp}</b><small>/{maxHp(g, me)}</small>{hurt && <i key={hurt.k} className="hp-hit">−{hurt.n}</i>}</span>
          <span><img src="art/icons/icon_mana.png" alt="Mana" /><b>{me.mana}</b><small>/{maxManaOf(g, me)}</small></span>
          <button className="res-btn" onClick={() => setScreen('base')}><img src="art/icons/icon_gold.png" alt="Gold" /><b>{pl.gold}</b></button>
          <button className="res-btn" onClick={() => setScreen('tree')}><img src="art/icons/icon_xp.png" alt="XP" /><b>{pl.xp}</b></button>
          <span className="pips">{[0, 1].map(k => <i key={k} className={k < me.actionsLeft && myTurn ? 'on' : ''} />)}</span>
        </div>
        <div className="rotate">
          <button className={`shop-btn${shopOpen ? '' : ' locked'}`} aria-label="Shop" onClick={() => { setSheetOpen(false); if (shopOpen) { setAim(null); setDc(null); setAsk(null); setPending(null); setPanel('shop'); } else setShopHint(true); }}><img src="art/icons/icon_landmark_merchant.png" alt="" /></button>
          <button className="quest-btn" aria-label="Quests" onClick={() => { setPanel('quests'); setSheetOpen(false); }}><img src="art/icons/icon_quest_explorer.png" alt="" /></button>
          <button aria-label="Rotate left" onClick={() => setRot(r => ((r + 3) % 4) as Rot)}>⟲</button>
          <button aria-label="Rotate right" onClick={() => setRot(r => ((r + 1) % 4) as Rot)}>⟳</button>
        </div>
        {!session.isHumanTurn && !session.over && <div className="banner">{session.nameOf(current.id) ?? (current.team === me.team ? 'Ally' : 'Enemy')} {current.cls}</div>}
        {puppet && <div className="banner">Telepuppet · {cap(puppet.cls)}</div>}
        {session.notice && <div className="banner notice">{session.notice}</div>}
        {respawn && <div className="banner">Respawn</div>}
      </div>

      {/* ---------- bottom: collapsible action bar ---------- */}
      <div className={`hud-bottom${lmMove ? ' over-panel' : ''}`} style={(panel && !lmMove) || pa ? { display: 'none' } : undefined}>
        {!lmMove && sheetOpen && myTurn && dc && (
          // Doublecast: pick the 1st spell, aim and confirm it, then the 2nd; both go off in one action
          <div className="window sheet">
            <div className="sheet-title">DOUBLECAST · {dc.first ? `2ND (after ${spellName(dc.first.spell)})` : '1ST'}</div>
            {dcSpells.map(s => (
              <button key={s} className="row-btn" disabled={!aimOptions(g, me, { spell: s }).length || SPELL_INFO[s].mana > me.mana - (dc.first ? SPELL_INFO[dc.first.spell].mana : 0)}
                onClick={() => { setAim({ spell: s }); setAsk(null); setPending(null); setSheetOpen(false); }}>
                {spellName(s)}<small>{SPELL_INFO[s].mana} MP</small>
              </button>
            ))}
            <button className="row-btn" onClick={() => { setDc(null); setSheetOpen(false); }}>Cancel<small /></button>
          </div>
        )}
        {!lmMove && sheetOpen && myTurn && !dc && (
          <div className="window sheet">
            <div className="sheet-title">SKILLS</div>
            {hasStatus(me, 'poison') && (
              <button className="row-btn" disabled={g.players[me.player].gold < 3}
                onClick={() => { setAsk({ kind: 'cure' }); setAim(null); setDc(null); setPending(null); setSheetOpen(false); }}>
                Cure poison<small className="gold">3 G</small>
              </button>
            )}
            {me.cls === 'thief' && decoySpot(g, me) && (
              <button className="row-btn" onClick={() => { setAsk({ kind: 'decoy' }); setAim(null); setDc(null); setPending(null); setSheetOpen(false); }}>
                Body double<small>free</small>
              </button>
            )}
            {me.skills.has('launder') && (
              <button className="row-btn" disabled={g.players[me.player].gold < 3}
                onClick={() => { setAsk({ kind: 'launder', gold: Math.floor(g.players[me.player].gold / 3) * 3 }); setAim(null); setDc(null); setPending(null); setSheetOpen(false); }}>
                {SKILL_NODES.launder.name}<small>free</small>
              </button>
            )}
            {me.skills.has('doublecast') && (
              <button className="row-btn" disabled={me.attacked || dcSpells.every(s => !aimOptions(g, me, { spell: s }).length)}
                onClick={() => { setAim(null); setDc({}); setAsk(null); setPending(null); }}>
                {SKILL_NODES.doublecast.name}<small>›</small>
              </button>
            )}
            {ATTACK_SKILLS.filter(s => me.skills.has(s)).map(s => (
              <button key={s} className="row-btn" disabled={me.attacked || me.mana < SKILL[s].mana}
                onClick={() => {
                  setAttackOpt(s); setMode('attack'); setAsk(null); setAim(null); setDc(null); setSheetOpen(false);
                  // Arrow Rain hits everyone in range, so it needs no aiming: pick its target
                  // (a monster or lair first, since those are only hit as the main target).
                  const ts = s === 'arrowRain' ? targets(s) : [];
                  const t = ts.find(o => o.t.kind !== 'hero') ?? ts[0];
                  setPending(t ? { x: t.tile % g.map.w, y: Math.floor(t.tile / g.map.w) } : null);
                }}>
                {SKILL_NODES[s].name}<small>{SKILL[s].mana} MP</small>
              </button>
            ))}
            {SELF_SPELLS.filter(s => me.skills.has(s)).map(s => (
              <button key={s} className="row-btn" disabled={!canCast(g, me, s, {})}
                onClick={() => { setAsk({ kind: 'spell', spell: s }); setAim(null); setDc(null); setPending(null); setSheetOpen(false); }}>
                {SKILL_NODES[s].name}<small>{SKILL[s as keyof typeof SKILL] && 'mana' in SKILL[s as keyof typeof SKILL] ? (SKILL[s as keyof typeof SKILL] as { mana: number }).mana : ''} MP</small>
              </button>
            ))}
            {me.skills.has('manaSurge') && (
              <button className="row-btn" disabled={me.surgeCd > 0}
                onClick={() => { setAsk({ kind: 'surge' }); setAim(null); setDc(null); setPending(null); setSheetOpen(false); }}>
                {SKILL_NODES.manaSurge.name}<small>{me.surgeCd > 0 ? `${me.surgeCd} turns` : 'free'}</small>
              </button>
            )}
            {aimedOwned.map(s => (
              <button key={s} className="row-btn" disabled={!aimOptions(g, me, { spell: s }).length}
                onClick={() => { setAim({ spell: s }); setAsk(null); setPending(null); setSheetOpen(false); }}>
                {spellName(s)}<small>{s === 'huntersMark' ? SKILL.huntersMark.mana : SPELL_INFO[s].mana} MP</small>
              </button>
            ))}
          </div>
        )}
        {(myTurn || respawn) && (pending || ask) && (
          <div className="window confirm">
            <span>{pendingText()}</span>
            {ask?.kind === 'launder' && (
              // how much to launder, 3 gold at a time
              <span className="stepper">
                <button disabled={ask.gold <= 3} onClick={() => setAsk({ kind: 'launder', gold: ask.gold - 3 })}>−</button>
                <button disabled={ask.gold + 3 > g.players[me.player].gold} onClick={() => setAsk({ kind: 'launder', gold: ask.gold + 3 })}>+</button>
              </span>
            )}
            <button className="confirm-yes" onClick={confirmPending}>OK</button>
            <button className="confirm-no" onClick={() => { setPending(null); setAsk(null); setAim(null); setDc(null); }}>✕</button>
          </div>
        )}
        {!lmMove && <div className="window action-bar">
          <button className={mode === 'move' ? 'on' : ''} disabled={!myTurn || !!puppet} onClick={() => { setMode('move'); setAim(null); setDc(null); setPending(null); setSheetOpen(false); }}>Move</button>
          <button className={mode === 'attack' && attackOpt === 'weapon' ? 'on' : ''} disabled={!myTurn || me.attacked || (me.rested && !MANA.restWithAttack)} onClick={() => { setMode('attack'); setAttackOpt('weapon'); setAim(null); setDc(null); setPending(null); setSheetOpen(false); }}>Attack</button>
          <button className={sheetOpen ? 'on' : ''} disabled={!myTurn || !hasActives} onClick={() => setSheetOpen(o => !o)}>Skills</button>
          <button className={ask?.kind === 'rest' ? 'on' : ''} disabled={!myTurn || (me.attacked && !MANA.restWithAttack)} onClick={() => { setAsk({ kind: 'rest' }); setAim(null); setDc(null); setPending(null); setSheetOpen(false); }}>Rest</button>
          <button onClick={() => { setPanel('items'); setAim(null); setDc(null); setAsk(null); setPending(null); setSheetOpen(false); }}>Items</button>
        </div>}
      </div>

      {pa && !panel && <AttackPanel g={g} me={me} atlas={atlas} act={pa.act} units={pa.units} canAct={myTurn} onOk={confirmPending} onCancel={() => { setPending(null); setAsk(null); if (dc) { setAim(null); setDc(null); } }} />}
      {/* any panel closes on a tap outside it */}
      {panel && <div className="backdrop" onPointerDown={() => setPanel(null)} />}
      {panel === 'quests' && <QuestsPanel g={g} hero={me} />}
      {panel === 'hero' && <HeroPanel g={g} hero={g.heroes[infoId]} viewer={me} atlas={atlas} onTree={() => { setPanel(null); setScreen('tree'); }} />}
      {panel === 'npc' && <NpcPanel g={g} npc={npcInfo} />}
      {panel === 'lm' && <LandmarkPanel g={g} idx={infoId} viewer={me} atlas={atlas} onShop={() => setPanel('shop')} />}
      {panel === 'items' && <ItemsPanel g={g} hero={me} atlas={atlas} canAct={session.isHumanTurn} act={a => session.act(a) === null} />}
      {panel === 'shop' && <ShopPanel g={g} hero={me} canAct={session.isHumanTurn} act={a => session.act(a) === null} />}
      {screen === 'tree' && <SkillTree g={g} hero={me} atlas={atlas} canBuy={session.isHumanTurn} onClose={() => setScreen(null)} act={a => session.act(a) === null} />}
      {screen === 'base' && <BaseScreen g={g} hero={me} atlas={atlas} canBuy={session.isHumanTurn} onClose={() => setScreen(null)} act={a => session.act(a) === null} />}

      {shopHint && (
        <div className="overlay income-overlay" onPointerDown={() => setShopHint(false)}>
          <div className="window income-popup" onPointerDown={e => e.stopPropagation()}>
            <span>Shop unlocked with merchant landmark or forge</span>
            <button className="confirm-yes income-ok" onClick={() => setShopHint(false)}>OK</button>
          </div>
        </div>
      )}
      {incomeReport && <IncomePopup lines={incomeReport.lines} onClose={() => setIncomeSeen(incomeReport.turn)} />}

      {session.over && (
        <div className="overlay">
          <div className="window result">
            <h1>{result === me.team ? 'VICTORY' : result === null ? 'DRAW' : 'DEFEAT'}</h1>
            <button className="end-turn" onClick={onExit}>HOME</button>
          </div>
        </div>
      )}
    </div>
  );
}
