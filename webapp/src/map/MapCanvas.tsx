// The map canvas: pan (drag), zoom (pinch / wheel / buttons), tap a tile.
//
// Pixel art must stay crisp, so the zoom is always a whole number of DEVICE
// pixels per art pixel (the style guide's rule). On a 3× phone the steps are
// 3, 4, 6, 9 and 12 device px per art px = 1×, 1.33×, 2× (default), 3× and 4× CSS.
// (4× added 2026-09-30: Nick found 3× not close enough.)

import { useEffect, useRef, useState } from 'react';
import type { GameState } from '@engine/state.ts';
import { type Atlas, tone } from '../art/sprites.ts';
import { Renderer, type Highlights } from './renderer.ts';
import { tileAt, tileCenter, mapBounds } from './iso.ts';
import { toView, toWorld, viewSize, type Rot } from './view.ts';

const CSS_STEPS = [1, 4 / 3, 2, 3, 4];

interface Props {
  atlas: Atlas;
  game: GameState;
  version: number;           // changes whenever the game state changes
  viewerTeam: number;
  highlights: Highlights;
  focus: { x: number; y: number; n: number } | null; // tile to centre on; n changes to re-centre
  rot: Rot;
  onTapTile: (x: number, y: number) => void;
}

export function MapCanvas(p: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(p);
  live.current = p;
  const cam = useRef({ step: 2, cx: 0, cy: 0 }); // cx, cy = art px at the screen centre
  const renderer = useRef<Renderer | null>(null);
  // A frame that throws used to stop the loop silently (a grey screen). Now the loop
  // keeps going and the error shows on screen, with any art that failed to load.
  const [error, setError] = useState<string | null>(null);

  // centre on the focus tile
  useEffect(() => {
    if (!p.focus) return;
    const v = toView(p.focus.x, p.focus.y, p.rot, p.game.map.w, p.game.map.h);
    const c = tileCenter(v.x, v.y);
    cam.current.cx = c.sx; cam.current.cy = c.sy;
  }, [p.focus?.n]);

  // Rotating keeps the same world tile at the centre of the screen.
  const lastRot = useRef(p.rot);
  useEffect(() => {
    const { w, h } = p.game.map;
    const before = tileAt(cam.current.cx, cam.current.cy);
    const worldTile = toWorld(before.x, before.y, lastRot.current, w, h);
    const v = toView(worldTile.x, worldTile.y, p.rot, w, h);
    const c = tileCenter(v.x, v.y);
    cam.current.cx = c.sx; cam.current.cy = c.sy;
    lastRot.current = p.rot;
  }, [p.rot]);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    renderer.current = new Renderer(p.atlas);
    let raf = 0;
    const dpr = () => Math.max(1, Math.round(window.devicePixelRatio || 1));
    const scale = () => Math.max(1, Math.round(CSS_STEPS[cam.current.step] * dpr())); // device px per art px

    const resize = () => {
      cv.width = Math.round(cv.clientWidth * dpr());
      cv.height = Math.round(cv.clientHeight * dpr());
    };
    resize();
    window.addEventListener('resize', resize);

    let lastError = '';
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      try { draw(now); }
      catch (e) {
        const msg = e instanceof Error ? [e.message, ...(e.stack ?? '').split('\n').slice(1, 3)].join('\n') : String(e);
        if (msg !== lastError) { lastError = msg; console.error(e); setError(msg); }
      }
    };
    const draw = (now: number) => {
      const { game, viewerTeam, highlights } = live.current;
      const r = renderer.current!;
      r.rot = live.current.rot;
      r.sync(game, now);
      const s = scale();
      const vs = viewSize(live.current.rot, game.map.w, game.map.h);
      const b = mapBounds(vs.w, vs.h);
      // The camera can go as far as the map's edge reaching the middle of the screen,
      // so a hero on an edge tile can still be centred (sky shows past the edge).
      const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
      cam.current.cx = clamp(cam.current.cx, b.left, b.right);
      cam.current.cy = clamp(cam.current.cy, b.top, b.bottom);
      const ox = Math.round(cv.width / 2 - cam.current.cx * s), oy = Math.round(cv.height / 2 - cam.current.cy * s);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = tone('#7a92a4'); // the sky behind the board (packet 003); clouds drift in it
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(s, 0, 0, s, ox, oy);
      r.draw(ctx, game, viewerTeam, highlights, now);
    };
    raf = requestAnimationFrame(frame);

    // ---------- input ----------
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0, pinchStart = 0, stepAtPinch = 2;
    const toArt = (clientX: number, clientY: number) => {
      const rect = cv.getBoundingClientRect();
      const s = scale();
      const px = (clientX - rect.left) * dpr(), py = (clientY - rect.top) * dpr();
      return { ax: (px - cv.width / 2) / s + cam.current.cx, ay: (py - cv.height / 2) / s + cam.current.cy };
    };
    const onDown = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) moved = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y); stepAtPinch = cam.current.step;
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);
      if (pointers.size === 1) {
        const dx = cur.x - prev.x, dy = cur.y - prev.y;
        moved += Math.abs(dx) + Math.abs(dy);
        const s = scale() / dpr();
        cam.current.cx -= dx / s; cam.current.cy -= dy / s;
      } else if (pointers.size === 2) {
        moved = 999;
        const [a, b] = [...pointers.values()];
        const ratio = Math.hypot(a.x - b.x, a.y - b.y) / pinchStart;
        const target = CSS_STEPS[stepAtPinch] * ratio;
        let best = 0;
        CSS_STEPS.forEach((z, i) => { if (Math.abs(z - target) < Math.abs(CSS_STEPS[best] - target)) best = i; });
        cam.current.step = best;
      }
    };
    const onUp = (e: PointerEvent) => {
      const wasTap = pointers.size === 1 && moved < 8;
      pointers.delete(e.pointerId);
      if (!wasTap) return;
      const { ax, ay } = toArt(e.clientX, e.clientY);
      const g = live.current.game;
      // a unit drawn under the finger wins over the ground tile behind it
      const hit = renderer.current?.pick(ax, ay) ?? null;
      if (hit !== null) { live.current.onTapTile(hit % g.map.w, Math.floor(hit / g.map.w)); return; }
      const vt = tileAt(ax, ay);
      const vs = viewSize(live.current.rot, g.map.w, g.map.h);
      if (vt.x < 0 || vt.y < 0 || vt.x >= vs.w || vt.y >= vs.h) return;
      const t = toWorld(vt.x, vt.y, live.current.rot, g.map.w, g.map.h);
      live.current.onTapTile(t.x, t.y);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cam.current.step = Math.min(CSS_STEPS.length - 1, Math.max(0, cam.current.step + (e.deltaY < 0 ? 1 : -1)));
    };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', e => pointers.delete(e.pointerId));
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('wheel', onWheel);
    };
  }, [p.atlas]);

  const failed = p.atlas.failed;
  return (
    <>
      <canvas ref={ref} className="map-canvas" />
      {(error || failed.length > 0) && (
        <div className="map-error">
          {error && <div>Map error: {error}</div>}
          {failed.length > 0 && <div>Art failed to load ({failed.length}): {failed.slice(0, 6).map(f => `${f.path} (${f.reason})`).join(', ')}{failed.length > 6 ? ', …' : ''}</div>}
        </div>
      )}
    </>
  );
}
