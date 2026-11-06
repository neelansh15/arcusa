// arcusa price service: polls xStocks, stores ticks, serves candles. Node >= 22.5 (node:sqlite), no deps.
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.PORT ?? 4300);
const DB = process.env.DB_PATH ?? './ticks.db';
// Symbols to ingest, comma separated. NVDA keeps the original `ticks` table; the others get `ticks_<SYMBOL>`.
const SYMBOLS = (process.env.SYMBOLS ?? 'NVDA,TSLA').split(',').map((x) => x.trim().toUpperCase()).filter((x) => /^[A-Z]{1,6}$/.test(x));
const DEFAULT_SYMBOL = SYMBOLS.includes('NVDA') ? 'NVDA' : SYMBOLS[0];
// UPSTREAM (legacy) overrides the NVDA URL only.
const upstream = (sym) => (sym === 'NVDA' && process.env.UPSTREAM) || `https://api.xstocks.fi/api/v2/public/assets/${sym}x/price-data`;
const POLL_MS = Number(process.env.POLL_MS ?? 5000);
const STALE_S = Number(process.env.STALE_S ?? 60);
const INTERVALS = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600 };

const db = new DatabaseSync(DB);
db.exec('PRAGMA journal_mode=WAL');
// Table names come from the validated SYMBOLS list only, never from request input.
const table = (sym) => (sym === 'NVDA' ? 'ticks' : `ticks_${sym}`);
const state = {}; // sym -> {insert, last: {t, p} | null, lastError}
for (const sym of SYMBOLS) {
  db.exec(`CREATE TABLE IF NOT EXISTS ${table(sym)} (t INTEGER PRIMARY KEY, p REAL NOT NULL)`);
  state[sym] = { insert: db.prepare(`INSERT OR REPLACE INTO ${table(sym)} (t, p) VALUES (?, ?)`), last: null, lastError: null };
}

async function poll(sym) {
  const st = state[sym];
  try {
    const res = await fetch(upstream(sym), { signal: AbortSignal.timeout(8000) });
    const body = await res.json();
    if (!res.ok || typeof body.quote !== 'number') throw new Error(`bad response ${res.status}`);
    const t = Math.floor(Date.now() / 1000);
    st.insert.run(t, body.quote);
    st.last = { t, p: body.quote };
    st.lastError = null;
  } catch (e) {
    st.lastError = String(e.message ?? e);
  }
}
for (const sym of SYMBOLS) {
  poll(sym);
  setInterval(() => poll(sym), POLL_MS);
}

function candles(sym, interval, limit) {
  const step = INTERVALS[interval];
  const from = Math.floor(Date.now() / 1000 / step) * step - (limit - 1) * step;
  const rows = db.prepare(`SELECT t, p FROM ${table(sym)} WHERE t >= ? ORDER BY t`).all(from);
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
    const sym = (u.searchParams.get('symbol') ?? DEFAULT_SYMBOL).toUpperCase();
    if (u.pathname.startsWith('/api/') && !(sym in state)) return send(res, 400, { error: `symbol must be one of ${SYMBOLS.join(',')}` });
    const { last, lastError } = state[sym] ?? {};
    if (u.pathname === '/api/price') {
      if (!last) return send(res, 503, { error: 'no price yet', lastError });
      const age = Math.floor(Date.now() / 1000) - last.t;
      return send(res, 200, { symbol: sym, quote: last.p, time: last.t, age, stale: age > STALE_S, source: 'xstocks.fi', lastError });
    }
    if (u.pathname === '/api/candles') {
      const interval = u.searchParams.get('interval') ?? '1m';
      if (!(interval in INTERVALS)) return send(res, 400, { error: 'interval must be 1m|5m|15m|1h' });
      const limit = Math.min(Number(u.searchParams.get('limit') ?? 300), 2000);
      return send(res, 200, { symbol: sym, interval, candles: candles(sym, interval, limit) });
    }
    if (u.pathname === '/api/ticks') {
      const since = Number(u.searchParams.get('since') ?? 0);
      const limit = Math.min(Number(u.searchParams.get('limit') ?? 1000), 5000);
      const rows = db.prepare(`SELECT t AS time, p AS value FROM ${table(sym)} WHERE t > ? ORDER BY t DESC LIMIT ?`).all(since, limit).reverse();
      return send(res, 200, { symbol: sym, ticks: rows });
    }
    if (u.pathname === '/health') return send(res, 200, { ok: true, symbols: Object.fromEntries(SYMBOLS.map((k) => [k, { last: state[k].last, lastError: state[k].lastError }])) });
    send(res, 404, { error: 'not found' });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`price service on :${PORT}`));
