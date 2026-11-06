# 0024. TSLA as the second live asset; the trade page switches per asset

- Status: accepted
- Date: 2026-11-07
- Deciders: user, laptop

## Context
ADR 0022 added the asset picker as display only, because the market, oracle and ticket were single-asset (ADR 0018, proposed). On 2026-11-07 the second wrapped token (wTSLA) was deployed with its own oracle and inventory market (LOG.md, docs/runbooks/deploy-wrapped-token.md), and the user asked for TSLA to appear in the picker and for the server to support it.

## Decision
- The market contracts stay one pair per asset (one `PriceOracle` and one `InventoryMarket` each). No multi-asset contract.
- `app/src/lib/assets.ts` is the registry. A live asset carries `{ token, priceSymbol, market, oracle, marketDeployBlock }`. Live assets are NVDA and TSLA. AAPL, MSFT and AMZN stay planned ("Coming soon", not selectable).
- The trade page keeps the selected asset in state (default NVDA, not persisted). Price, market reads, quotes, balances, trades and the ticket all take the asset. Switching remounts the ticket.
- The price service ingests several symbols (`SYMBOLS`, default `NVDA,TSLA`). `/api/price`, `/api/candles`, `/api/ticks` take `?symbol=` (default NVDA, so old clients keep working) and echo `symbol`. NVDA keeps the `ticks` table; other symbols use `ticks_<SYMBOL>`.
- The oracle relayer is not changed: run one instance per asset with `ORACLE` and `PRICE_URL=.../api/price?symbol=<SYM>`.
- The UI ignores a price or tick response whose `symbol` does not match the selected asset (an older ingest service ignores `?symbol`), and falls back to the app's own `/api/price?symbol=` route.

## Consequences
- Supersedes the "display only" part of ADR 0022 and decision 7 in its revisions. The rest of 0022 stands.
- The Bridge page is still NVDA only (mNVDA and wNVDA constants in `config.ts`). TSLA liquidity is moved with `contracts/scripts/second-token/bridge.mjs`.
- Until the server runs the new price service and a TSLA relayer, TSLA has no chart history and its oracle goes stale after 300 s, so the market stops quoting (T-054).
- Not verified: trading on the TSLA market from the browser with a wallet.
