// The game server: a WebSocket endpoint around the Hub (hub.ts), plus a health check for Fly.io.
// Messages are JSON written with engine/serialize.ts. Games are saved under DATA_DIR (a Fly volume).
//   PORT       (default 8080)
//   DATA_DIR   (default ./data)
//   STEP_MS    pause between bot turns, so phones can watch them (default 450)

import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { Hub, type Conn, type ClientMsg } from './hub.ts';
import { Store } from './store.ts';
import { toJSON, fromJSON } from '../../engine/serialize.ts';
import { botTurn, botRespawn } from '../../sim/bots.ts';

const PORT = Number(process.env.PORT ?? 8080);
const hub = new Hub(new Store(process.env.DATA_DIR ?? './data'), { turn: botTurn, respawn: botRespawn }, undefined, Number(process.env.STEP_MS ?? 450));

const http = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
  res.end('tactic-topia server ok');
});
const wss = new WebSocketServer({ server: http });

wss.on('connection', ws => {
  const conn: Conn = { send: m => { if (ws.readyState === ws.OPEN) ws.send(toJSON(m)); } };
  ws.on('message', data => {
    let msg: ClientMsg;
    try { msg = fromJSON<ClientMsg>(String(data)); } catch { conn.send({ type: 'error', message: 'bad message' }); return; }
    hub.handle(conn, msg);
  });
  ws.on('close', () => hub.disconnect(conn));
});

http.listen(PORT, () => console.log(`tactic-topia server on :${PORT}`));
