# 0019. Simple trade UI by default, Pro mode as a toggle

- Status: accepted
- Date: 2026-11-06
- Deciders: user, laptop

## Context
The terminal (`app/src/components/terminal.tsx`) is a dense trading-terminal layout: stats strip, chart, ticket, market info, bottom tabs. The market is a pooled, oracle-priced inventory market (ADR 0014), so there is no order book or depth to fill a terminal. Judges and first-time users have about 30 seconds. The user chose a simple default and shared three references: LumaTrade (layout to follow), Nixtrade (balance hero, secondary), Kraken app (mobile pattern).

## Options considered
1. Keep the terminal and polish it: does not match the data we have, intimidating for first-time users.
2. Separate mobile and desktop UIs: two things to maintain.
3. One responsive layout, simple by default, Pro as a toggle that reveals extra panels in the same layout.

## Decision
Option 3.

**Simple mode (default), desktop, LumaTrade-style, one rounded dark card on the page background:**
- Top bar: logo, nav (Trade, Bridge, Docs), wallet chip with address, connect button.
- Left (about 2/3): pair header (NVDA/USDC with token icons, and the asset dropdown from ADR 0018 later), large last price, session-change pill, time-range chips (1h 24h 1w), the chart with hover tooltip.
- Left, below the chart: a compact "market" table (replaces LumaTrade's exchange table). Rows: Oracle price, Bid, Ask, Feed status (LIVE/STALE). Not an order book.
- Right (about 1/3): BUY/SELL tabs, a "You pay" card and a "You receive" card with the swap arrow between, balances on each card, one primary button (Buy NVDA / Sell NVDA / Connect wallet), and a summary card: estimated fee, you receive, spread.
- Accent colour is one lime or green, used for positive change, the active tab and the primary button. Keep the existing dark theme tokens; only the accent and radii change.

**Nixtrade ideas without a portfolio view:** a balance hero on the right card or above the ticket: "Your position" with NVDA value in USDC as the big number, USDC balance as the secondary line, and the PnL pill only if we can compute it from this session's trades (otherwise omit; do not fake it). Deposit and Buy pill pair maps to Bridge (LP) and Buy. Pill-style nav and the chart tooltip card follow Nixtrade.

**Mobile, Kraken-style (below 768px):** single column, same components. Order: header with price and change pill, chart (shorter), position card, sticky bottom bar with Buy and Sell buttons that open the ticket as a bottom sheet. Market table collapses to a "Market details" accordion. No Pro mode on mobile.

**Pro mode:** a toggle in the header (desktop only), persisted in `localStorage`, off by default. It adds, in the same layout: the stats strip (last, bid, ask, oracle, feed), the Balances and Trades tabs below the chart, slippage setting, oracle updated-at and staleness, pool inventory, fee tier, and explorer links on trades. It reuses the existing components (`MarketInfo`, `Balances`, `Trades`, `OrderTicket` slippage), no new data sources.

## Consequences
- `terminal.tsx` is restructured into a shared layout plus a Pro panel group; `order-ticket.tsx` is restyled into pay/receive cards.
- Time-range chips need history for 1h/24h/1w. If the price source only has the session history, show only the ranges we have; do not fake data.
- Token icons and an accent token are needed (NVDA, USDC).
- ADR 0018's asset list is not part of the first pass; the pair header leaves room for it.
- Not verified: whether `/api/price` can serve 24h and 1w history; whether the existing ticket can compute the fee and spread summary from `useQuote` alone.
