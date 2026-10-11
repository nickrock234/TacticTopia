// Copies the art Claude Design returned (docs/design/packets/*/return/sprites)
// into public/art so the app can load it. Later packets overwrite earlier ones.
import { cpSync, existsSync, readdirSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const packets = new URL('../../docs/design/packets/', import.meta.url);
const out = new URL('../public/art/', import.meta.url);
mkdirSync(out, { recursive: true });
let n = 0;
for (const p of readdirSync(packets).sort()) {
  const src = join(packets.pathname.replace(/^\/(\w:)/, '$1'), p, 'return', 'sprites');
  if (!existsSync(src)) continue;
  // Design's _preview_* images are for people, not the game: leave them out
  cpSync(src, out.pathname.replace(/^\/(\w:)/, '$1'), { recursive: true, filter: s => !/[\\/]_preview[^\\/]*$/.test(s) });
  n++;
}
// manifest: every sheet (path without .png) so the app can load them all
const root = out.pathname.replace(/^\/(\w:)/, '$1');
const list = [];
const walk = (dir, rel) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, rel + f + '/'); else if (f.endsWith('.png') && existsSync(p.slice(0, -4) + '.json')) list.push(rel + f.slice(0, -4)); } }; // a sheet = .png + its .json
walk(root, '');
writeFileSync(join(root, 'manifest.json'), JSON.stringify(list));
console.log(`sync-art: copied sprites from ${n} packet(s) into public/art (${list.length} sheets)`);
