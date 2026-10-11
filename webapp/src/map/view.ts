// Rotating the board in 90° steps (Nick, 2026-09-30: heroes in front can hide others).
//
// The game works in WORLD tiles (x, y). The renderer works in VIEW tiles: world
// tiles turned clockwise `rot` quarter-turns. Everything drawn goes through
// toView; everything tapped comes back through toWorld. Sprites don't rotate;
// heroes just pick the facing that matches their direction on screen.

export type Rot = 0 | 1 | 2 | 3;

/** World tile → view tile (fractional coordinates are fine: it's affine). */
export function toView(x: number, y: number, rot: Rot, w: number, h: number) {
  switch (rot) {
    case 0: return { x, y };
    case 1: return { x: h - 1 - y, y: x };
    case 2: return { x: w - 1 - x, y: h - 1 - y };
    case 3: return { x: y, y: w - 1 - x };
  }
}

/** View tile → world tile. */
export function toWorld(vx: number, vy: number, rot: Rot, w: number, h: number) {
  switch (rot) {
    case 0: return { x: vx, y: vy };
    case 1: return { x: vy, y: h - 1 - vx };
    case 2: return { x: w - 1 - vx, y: h - 1 - vy };
    case 3: return { x: w - 1 - vy, y: vx };
  }
}

/** A world direction as seen on screen. */
export function rotDelta(dx: number, dy: number, rot: Rot) {
  switch (rot) {
    case 0: return { dx, dy };
    case 1: return { dx: -dy, dy: dx };
    case 2: return { dx: -dx, dy: -dy };
    case 3: return { dx: dy, dy: -dx };
  }
}

/** View size (the board's width and height swap on odd rotations). */
export const viewSize = (rot: Rot, w: number, h: number) => (rot % 2 ? { w: h, h: w } : { w, h });
