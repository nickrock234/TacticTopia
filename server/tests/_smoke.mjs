// End-to-end smoke check: start the real server, talk to it over WebSockets, stop it. Not part of the
// test suite (it opens a port); run with: node server/tests/_smoke.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';

const dir = mkdtempSync(join(tmpdir(), 'tt-'));
const srv = spawn(process.execPath, ['server/src/index.ts'], { env: { ...process.env, PORT: '8799', DATA_DIR: dir, STEP_MS: '30' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise(r => srv.stdout.once('data', r));
const open = () => new Promise(r => { const ws = new WebSocket('ws://localhost:8799'); const got = []; ws.on('message', d => got.push(JSON.parse(String(d)))); ws.on('open', () => r({ ws, got })); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const a = await open(), b = await open();
a.ws.send(JSON.stringify({ type: 'create', name: 'Nick', perTeam: 2 }));
await wait(200);
const { gameId, token } = a.got.find(m => m.type === 'joined');
b.ws.send(JSON.stringify({ type: 'join', gameId, name: 'Sam' }));
await wait(200);
a.ws.send(JSON.stringify({ type: 'start', gameId, token }));
// bots play one turn per message (STEP_MS apart) until a person is up
const up = () => { const x = a.got.filter(m => m.type === 'state').pop(); return x && x.view.order[x.turnIndex]; };
for (let i = 0; i < 100 && up() !== 0 && up() !== 2; i++) await wait(50);
a.ws.send(JSON.stringify({ type: 'list', games: [{ gameId, token }] }));
await wait(200);
console.log('states for A:', a.got.filter(m => m.type === 'state').length, '| list:', JSON.stringify(a.got.find(m => m.type === 'list')?.games[0]));
const s = a.got.filter(m => m.type === 'state').pop();
console.log('lobby seen by B:', !!b.got.find(m => m.type === 'lobby'), '| state for A:', !!s, '| round', s?.view.round, '| up:', s?.view.order[s?.turnIndex], '| state for B:', !!b.got.find(m => m.type === 'state'));
a.ws.close(); b.ws.close(); srv.kill();
