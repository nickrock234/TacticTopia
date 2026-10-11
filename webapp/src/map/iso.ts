// Isometric projection, in art pixels (before zoom).
// Map tile (x, y): x runs down-right on screen, y runs down-left.
// A tile is a 32×16 diamond; its centre is at (sx, sy) below.

export const TILE_W = 32, TILE_H = 16;

export function tileCenter(x: number, y: number): { sx: number; sy: number } {
  return { sx: (x - y) * (TILE_W / 2), sy: (x + y) * (TILE_H / 2) + TILE_H / 2 };
}

/** The tile under a point in art pixels (may be off the map). */
export function tileAt(sx: number, sy: number): { x: number; y: number } {
  const a = sx / (TILE_W / 2), b = (sy - TILE_H / 2) / (TILE_H / 2);
  return { x: Math.round((a + b) / 2), y: Math.round((b - a) / 2) };
}

/** Bounding box of the whole map in art pixels. */
export function mapBounds(w: number, h: number) {
  return {
    left: -(h - 1) * (TILE_W / 2) - TILE_W / 2,
    right: (w - 1) * (TILE_W / 2) + TILE_W / 2,
    top: 0,
    bottom: (w + h - 2) * (TILE_H / 2) + TILE_H + 13, // + board side face (terrain/map_edge hangs 13 px below)
  };
}
