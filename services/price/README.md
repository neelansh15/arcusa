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

## Relayer
`relayer.mjs` (separate systemd unit `arcusa-relayer`, needs `viem` and `RELAYER_KEY` in an env file on the server only) reads `/api/price` and calls `PriceOracle.updatePrice` when the price moves more than 0.1% or every 60s. Session is Regular during US market hours (Mon-Fri 09:30-16:00 New York), else Closed. The relayer address is authorised on the oracle via `setRelayer`.
