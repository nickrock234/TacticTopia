// Saving games to disk: one JSON file per game in DATA_DIR/games (a Fly volume in production), so
// games survive restarts and can last days. Writes go to a temp file first and are renamed into
// place, so a crash mid-write can't leave a half-written game.

import { mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export class Store {
  private dir: string;
  constructor(dataDir: string) {
    this.dir = join(dataDir, 'games');
    mkdirSync(this.dir, { recursive: true });
  }
  save(id: string, text: string) {
    const file = join(this.dir, `${id}.json`), tmp = `${file}.tmp`;
    writeFileSync(tmp, text);
    renameSync(tmp, file);
  }
  load(id: string): string | null {
    const file = join(this.dir, `${id}.json`);
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  }
  ids(): string[] {
    return readdirSync(this.dir).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
  }
}

/** For tests: keeps games in memory. */
export class MemoryStore {
  private files = new Map<string, string>();
  save(id: string, text: string) { this.files.set(id, text); }
  load(id: string) { return this.files.get(id) ?? null; }
  ids() { return [...this.files.keys()]; }
}
