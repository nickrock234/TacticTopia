// Loads the sprite sheets Claude Design delivered (public/art, copied from
// docs/design/packets/*/return/sprites) and draws frames from them.
//
// Every sheet is one row of equal frames plus a JSON with frame size, per-frame
// durations, loop flag and the anchor pixel (tile centre or hero feet).
// Sprites are authored in red team colours; blue is made by swapping exact hexes.

export interface SheetMeta {
  frameW: number; frameH: number; frames: number;
  order: number[]; durations: number[]; loop?: boolean;
  anchor: [number, number];
  events?: { hit?: number; spawnVfx?: number };
  masks?: number[];                  // 47-blob autotile sets: column → neighbour mask
  indicatorSlot?: [number, number];  // landmark_marker: where the element add-on goes
  addonSlot?: [number, number];      // landmark_marker: merchant / lair add-on
  flagSlot?: [number, number];       // landmark_marker: flag pole foot, top of the pillar
  names?: string[];                  // ui/overlays, ui/path_arrows: frame index by name
}

export interface Sheet { img: CanvasImageSource; meta: SheetMeta }

// From packet 001's README: red → blue swap. (Player-accent slots stay as drawn for now.)
const RED_TO_BLUE: Record<string, string> = {
  '#5e1234': '#1a1d5c', '#a8203e': '#3040b0', '#e04a68': '#5c74e6', '#ff9aa8': '#a8b8ff',
  '#e0304a': '#3a5ae8', '#8a1e34': '#232a78',
};

// decode() can reject on phones when many images decode at once, even though the
// image itself is fine; fall back to waiting for the load event.
async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  const loaded = new Promise<void>((ok, fail) => { img.onload = () => ok(); img.onerror = () => fail(new Error(`image ${src}`)); });
  img.src = src;
  try { await img.decode(); } catch { await loaded; }
  return img;
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

// Darker palette: every art colour ×0.82 (the default since 2026-10-01, Nick).
// ?dark=1 shows the art as drawn; ?dark=0.7 tries another factor.
// Applied once at load, so it costs nothing per frame. UI overlays (HP bars, highlights,
// damage numbers) are drawn in code and stay at full brightness.
export const DARK: number = (() => {
  const v = new URLSearchParams(location.search).get('dark');
  const n = Number(v);
  return v !== null && v !== '' && n > 0 && n <= 1 ? n : 0.82;
})();

const toned = new Map<string, string>();
/** A hex colour with the darker palette applied (for art drawn in code). */
export function tone(hex: string): string {
  if (DARK === 1) return hex;
  let out = toned.get(hex);
  if (!out) {
    const v = parseInt(hex.slice(1), 16);
    const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(x => Math.round(x * DARK));
    out = '#' + ((c[0] << 16) | (c[1] << 8) | c[2]).toString(16).padStart(6, '0');
    toned.set(hex, out);
  }
  return out;
}

function recolor(img: HTMLImageElement, swap: Record<string, string>): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const ctx = cv.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, cv.width, cv.height);
  const px = data.data;
  const table = new Map<number, [number, number, number]>();
  for (const [from, to] of Object.entries(swap)) {
    const f = parseInt(from.slice(1), 16), t = parseInt(to.slice(1), 16);
    table.set(f, [(t >> 16) & 255, (t >> 8) & 255, t & 255]);
  }
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
    const to = table.get(key);
    if (to) { px[i] = to[0]; px[i + 1] = to[1]; px[i + 2] = to[2]; }
    if (DARK !== 1) { px[i] = Math.round(px[i] * DARK); px[i + 1] = Math.round(px[i + 1] * DARK); px[i + 2] = Math.round(px[i + 2] * DARK); }
  }
  ctx.putImageData(data, 0, 0);
  return cv;
}

export class Atlas {
  private sheets = new Map<string, Sheet>();
  /** Sheets that still failed after retrying, with the reason (shown on screen). */
  failed: { path: string; reason: string }[] = [];

  /** Load `path` (e.g. "terrain/water"). With team 1, also builds a blue-swapped copy. */
  async load(path: string, opts: { blue?: boolean } = {}) {
    const [img, meta] = await Promise.all([
      loadImage(`art/${path}.png`),
      fetchJson<SheetMeta>(`art/${path}.json`),
    ]);
    // UI overlays (highlights, path arrows) stay at full brightness so they read on the darker map
    this.sheets.set(path, { img: DARK === 1 || path.startsWith('ui/') ? img : recolor(img, {}), meta });
    if (opts.blue) this.sheets.set(`${path}#blue`, { img: recolor(img, RED_TO_BLUE), meta });
  }

  has(path: string) { return this.sheets.has(path); }

  get(path: string, team = 0): Sheet | undefined {
    return (team === 1 && this.sheets.get(`${path}#blue`)) || this.sheets.get(path);
  }
}

/** Frame index at time `t` ms (looping sheets cycle; one-shots hold the last frame). */
export function frameAt(meta: SheetMeta, t: number): number {
  const total = meta.durations.reduce((a, b) => a + b, 0);
  if (!total) return meta.order[0] ?? 0;
  if (!meta.loop && t >= total) return meta.order[meta.order.length - 1];
  let tt = t % total, i = 0;
  while (tt >= meta.durations[i]) { tt -= meta.durations[i]; i++; }
  return meta.order[i];
}

export const durationOf = (meta: SheetMeta) => meta.durations.reduce((a, b) => a + b, 0);

/** Draw one frame with its anchor at (x, y) in art pixels. A missing sheet draws nothing. */
export function drawSheet(ctx: CanvasRenderingContext2D, s: Sheet | undefined, frame: number, x: number, y: number, flip = false, alpha = 1) {
  if (!s) return;
  const { frameW: w, frameH: h, anchor: [ax, ay] } = s.meta;
  if (alpha !== 1) ctx.globalAlpha = alpha;
  if (flip) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(s.img, frame * w, 0, w, h, -ax, y - ay, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(s.img, frame * w, 0, w, h, x - ax, y - ay, w, h);
  }
  if (alpha !== 1) ctx.globalAlpha = 1;
}

/** Draw cell (col, row) of a grid sheet (autotile sets: column = piece, row = animation frame or variant). */
export function drawCell(ctx: CanvasRenderingContext2D, s: Sheet | undefined, col: number, row: number, x: number, y: number) {
  if (!s) return;
  const { frameW: w, frameH: h, anchor: [ax, ay] } = s.meta;
  ctx.drawImage(s.img, col * w, row * h, w, h, x - ax, y - ay, w, h);
}

/** 47-tile blob autotile column (Design's rule, packet 003). `same(dx, dy)` says whether the
 *  neighbour at that VIEW offset matches. Bits: NE=1 E=2 SE=4 S=8 SW=16 W=32 NW=64 N=128;
 *  a corner bit only counts when both edges beside it match. Returns the column in `masks`. */
export function blobColumn(masks: number[], same: (dx: number, dy: number) => boolean): number {
  const ne = same(0, -1), se = same(1, 0), sw = same(0, 1), nw = same(-1, 0);
  let m = (ne ? 1 : 0) | (se ? 4 : 0) | (sw ? 16 : 0) | (nw ? 64 : 0);
  if (ne && se && same(1, -1)) m |= 2;
  if (se && sw && same(1, 1)) m |= 8;
  if (sw && nw && same(-1, 1)) m |= 32;
  if (nw && ne && same(-1, -1)) m |= 128;
  const c = masks.indexOf(m);
  return c < 0 ? masks.length - 1 : c;
}

/** Load every sheet listed in public/art/manifest.json (written by scripts/sync-art.mjs).
 *  Heroes and bases also get a blue-team copy. Loads a few at a time (hundreds of
 *  requests at once overwhelm a phone on the dev server), retries failures twice,
 *  and records anything still missing in atlas.failed. */
export async function loadAtlas(): Promise<Atlas> {
  const atlas = new Atlas();
  const list = await fetchJson<string[]>('art/manifest.json');
  const BATCH = 12, TRIES = 3;
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const path = list[next++];
      const blue = path.startsWith('heroes/') || path.startsWith('portraits/') || path.startsWith('objects/home_base_');
      for (let attempt = 1; ; attempt++) {
        try { await atlas.load(path, { blue }); break; }
        catch (e) {
          if (attempt >= TRIES) { atlas.failed.push({ path, reason: e instanceof Error ? e.message : String(e) }); break; }
          await new Promise(ok => setTimeout(ok, 250 * attempt));
        }
      }
    }
  };
  await Promise.all(Array.from({ length: BATCH }, worker));
  if (atlas.failed.length) console.error('Art failed to load:', atlas.failed);
  return atlas;
}
