# arcusa price service

Polls the xStocks NVDAx `price-data` endpoint (returns only `{"quote": n}`, no timestamp, no history API) every 5s, stores ticks with our receive time in SQLite, and serves them.

Run: `node server.mjs` (Node >= 22.5, no dependencies). Env: `PORT` (4300), `DB_PATH` (./ticks.db), `POLL_MS` (5000), `STALE_S` (60).

Endpoints (CORS open):
- `GET /api/price` latest quote, age, stale flag
- `GET /api/candles?interval=1m|5m|15m|1h&limit=300`
- `GET /api/ticks?since=<unix>&limit=1000`
- `GET /health`

Deployed on superd.app as the `arcusa-price` systemd unit behind Caddy at arcusa-api.superd.app (port 4301).
The oracle relayer is a separate step and is not part of this service yet.
