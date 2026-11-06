// arcusa price service: polls xStocks, stores ticks, serves candles. Node >= 22.5 (node:sqlite), no deps.
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.PORT ?? 4300);
const DB = process.env.DB_PATH ?? './ticks.db';
const UPSTREAM = process.env.UPSTREAM ?? 'https://api.xstocks.fi/api/v2/public/assets/NVDAx/price-data';
const POLL_MS = Number(process.env.POLL_MS ?? 5000);
const STALE_S = Number(process.env.STALE_S ?? 60);
const INTERVALS = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600 };

const db = new DatabaseSync(DB);
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS ticks (t INTEGER PRIMARY KEY, p REAL NOT NULL);');
const insert = db.prepare('INSERT OR REPLACE INTO ticks (t, p) VALUES (?, ?)');

let last = null; // {t, p}
let lastError = null;

async function poll() {
  try {
    const res = await fetch(UPSTREAM, { signal: AbortSignal.timeout(8000) });
    const body = await res.json();
    if (!res.ok || typeof body.quote !== 'number') throw new Error(`bad response ${res.status}`);
    const t = Math.floor(Date.now() / 1000);
    insert.run(t, body.quote);
    last = { t, p: body.quote };
    lastError = null;
  } catch (e) {
    lastError = String(e.message ?? e);
  }
}
poll();
setInterval(poll, POLL_MS);

function candles(interval, limit) {
  const step = INTERVALS[interval];
  const from = Math.floor(Date.now() / 1000 / step) * step - (limit - 1) * step;
  const rows = db.prepare('SELECT t, p FROM ticks WHERE t >= ? ORDER BY t').all(from);
  const out = [];
  for (const { t, p } of rows) {
    const time = Math.floor(t / step) * step;
    const c = out[out.length - 1];
    if (c && c.time === time) { c.high = Math.max(c.high, p); c.low = Math.min(c.low, p); c.close = p; }
    else out.push({ time, open: p, high: p, low: p, close: p });
  }
  return out;
}

const send = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
};

http
  .createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/api/price') {
      if (!last) return send(res, 503, { error: 'no price yet', lastError });
      const age = Math.floor(Date.now() / 1000) - last.t;
      return send(res, 200, { symbol: 'NVDA', quote: last.p, time: last.t, age, stale: age > STALE_S, source: 'xstocks.fi', lastError });
    }
    if (u.pathname === '/api/candles') {
      const interval = u.searchParams.get('interval') ?? '1m';
      if (!(interval in INTERVALS)) return send(res, 400, { error: 'interval must be 1m|5m|15m|1h' });
      const limit = Math.min(Number(u.searchParams.get('limit') ?? 300), 2000);
      return send(res, 200, { interval, candles: candles(interval, limit) });
    }
    if (u.pathname === '/api/ticks') {
      const since = Number(u.searchParams.get('since') ?? 0);
      const limit = Math.min(Number(u.searchParams.get('limit') ?? 1000), 5000);
      const rows = db.prepare('SELECT t AS time, p AS value FROM ticks WHERE t > ? ORDER BY t DESC LIMIT ?').all(since, limit).reverse();
      return send(res, 200, { ticks: rows });
    }
    if (u.pathname === '/health') return send(res, 200, { ok: true, last, lastError });
    send(res, 404, { error: 'not found' });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`price service on :${PORT}`));
