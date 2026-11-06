# arcusa price service

Polls the xStocks `<SYMBOL>x` `price-data` endpoints (NVDAx and TSLAx by default) (returns only `{"quote": n}`, no timestamp, no history API) every 5s, stores ticks with our receive time in SQLite, and serves them.

Run: `node server.mjs` (Node >= 22.5, no dependencies). Env: `SYMBOLS` (`NVDA,TSLA`), `PORT` (4300), `DB_PATH` (./ticks.db), `POLL_MS` (5000), `STALE_S` (60).

Endpoints (CORS open):
- `GET /api/price` latest quote, age, stale flag
- `GET /api/candles?interval=1m|5m|15m|1h&limit=300`
- `GET /api/ticks?since=<unix>&limit=1000`
- `GET /health`

All three `/api/` endpoints take `?symbol=NVDA|TSLA` (default NVDA) and echo `symbol`. An unknown symbol is a 400. NVDA ticks stay in the original `ticks` table, other symbols in `ticks_<SYMBOL>`, so an existing `ticks.db` keeps working.

Deployed on superd.app as the `arcusa-price` systemd unit behind Caddy at arcusa-api.superd.app (port 4301).
The oracle relayer is a separate step and is not part of this service yet.

## Relayer
`relayer.mjs` (separate systemd unit `arcusa-relayer`, needs `viem` and `RELAYER_KEY` in an env file on the server only) reads `/api/price` and calls `PriceOracle.updatePrice` when the price moves more than 0.1% or every 60s. Session is Regular during US market hours (Mon-Fri 09:30-16:00 New York), else Closed. The relayer address is authorised on the oracle via `setRelayer`.

### One relayer per asset (ADR 0024)
`relayer.mjs` pushes one price to one oracle. For TSLA run a second unit with its own env (same `RELAYER_KEY`, which is already authorised on the TSLA oracle):

```
ORACLE=0xf17f5449be304de315e48eee44cf889e8e47867d
PRICE_URL=http://127.0.0.1:4301/api/price?symbol=TSLA
```

Unit name `arcusa-relayer-tsla`, otherwise a copy of `arcusa-relayer`. Restart `arcusa-price` first so it starts ingesting TSLA.
