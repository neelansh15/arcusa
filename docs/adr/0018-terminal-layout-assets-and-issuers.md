# 0018. Terminal layout: assets list, issuer comparison, bridge as a liquidity-provider page

- Status: proposed
- Date: 2026-11-06
- Deciders: alle, user

## Context
The terminal trades one asset (wNVDA) against USDC. The production goal is tokenized US stocks from many issuers and chains, settled in USDC on Arc. Two user decisions on 2026-11-06 shape the layout. Bridging is mainly done by liquidity providers who top up inventory on Arc, so it does not belong in the trader's terminal.

## Options considered
1. Keep one hard-coded pair and a bridge tab in the terminal: simplest, but does not show the multi-asset goal and puts an LP action in front of traders.
2. Asset list on the left, issuer comparison in the right pane, bridge on its own page: shows the roadmap and keeps the trader view focused.

## Decision
Option 2.
- **Bridge:** lives on `/bridge`, framed for liquidity providers. Done (commits b9f9cde, 84b6e17).
- **Assets list (next):** a full-height list on the left of the chart. Live rows are the mock stocks we have wrapped on Arc (today wNVDA). Planned stocks are shown greyed out and not selectable. Selecting a live row switches the chart, ticket and market panel.
- **Issuer selection and comparison (later):** in the right pane, mostly. A user picks among US stock token issuers for the same underlying and compares price, spread, depth and fees. Needs more than one issuer integrated, so it is post-demo.

## Consequences
- The market, oracle and ticket code is currently single-asset. A multi-asset version needs a per-asset market and oracle address in config, not constants in `market.ts`.
- Greyed-out rows must be labelled planned, not live (no claims about unshipped assets).
- Follow-ups are not yet in `TASKS.md`; add tasks when the work is scheduled.
- Unverified: how many issuers can be listed on testnet, and whether each needs its own wrapper (see `docs/gas-costs.md` for the one-time wrapper cost per token).
