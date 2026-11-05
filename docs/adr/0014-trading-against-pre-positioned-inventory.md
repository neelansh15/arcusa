# 0014. Trading: oracle-priced market against pre-positioned wNVDA inventory

- Status: proposed
- Date: 2026-11-06
- Deciders: alle, user
- Supersedes: 0005

## Context
ADR 0005 had the market mint and burn tAAPL against USDC. arcusa no longer issues tokens (ADR 0012), so the market cannot mint stock exposure. Lock-and-mint needs a bridge, which is too slow per trade (ADR 0013). The user chose pre-positioned inventory.

## Options considered
1. **Inventory market: pool holds `wNVDA` and USDC, trades at the oracle price plus a spread (chosen)**
   - Pros: instant settlement on Arc; simple; no AMM curve to attack.
   - Cons: the pool carries inventory and price risk; it can run out.
2. **Bridge on every buy**
   - Cons: minutes of waiting on Standard, and unverified Fast; bad UX.
3. **AMM pool (Uniswap-style)**
   - Cons: price drifts from the oracle with no market to arbitrage it when US is closed; more code.

## Decision
- `InventoryMarket` on Arc holds `wNVDA` and USDC (ERC-20 at `0x3600000000000000000000000000000000000000`).
- Buy: user pays USDC, receives `wNVDA` at `ask = oracle × (1 + spread)`. Sell: user pays `wNVDA`, receives USDC at `bid = oracle × (1 − spread)`.
- Parameters (admin-set, bounded): `maxAge`, per-session `spreadBps`, `maxTradeUsdc`, `maxExposureUsdc` (net inventory delta), `minInventory`, pause. Values and session rules: ADR 0015.
- Inventory is pre-positioned by bridging `mNVDA` from Sepolia before the demo (T-028). Refill is manual for the MVP; an automated rebalancer is post-MVP.
- Reverts cleanly when inventory is short, the oracle is stale, the session is not tradable, or a USDC transfer fails (blocklisted address).

## Consequences
- The market is a counterparty. The README states who bears the price risk: the inventory holder.
- Running out of inventory is a visible state in the UI ("sold out"), not a failure.
- Selling more than the pool's USDC is capped by `minInventory` on the USDC side too.

## Not verified
- Arc gas cost per trade on testnet.
- Whether a 6-decimal USDC ERC-20 and an 18-decimal `wNVDA` need extra rounding rules (tests in T-027).
