# 0005. Trading and settlement: oracle-priced mint and redeem against USDC on Arc

- Status: superseded by 0014
- Date: 2026-11-06
- Deciders: alle, user

## Context
Users buy and sell stock exposure with USDC on Arc. There is no outside liquidity for our self-issued `tAAPL` (ADR 0002), and the price comes from the oracle (ADR 0004).

Sources (fetched 2026-11-06 IST):
- Arc AMM porting guide: https://docs.arc.io/integrate/defi/amm-and-pools.md
  - Use the ERC-20 USDC interface (6 decimals) for all pool accounting.
  - Never pair native USDC against the ERC-20 interface.
- Arc EVM differences: https://docs.arc.io/arc/references/evm-differences.md
  - USDC has 18 decimals as the native asset and 6 through the ERC-20 interface.
  - Sending to `address(0)` reverts.
  - The mempool sets a 20 Gwei `maxFeePerGas` floor.
  - Blocklist reverts consume gas without a receipt.
- Arc DeFi track wording: "Trading apps, including trading with tokenized real-world assets (RWAs)", with settlement in USDC or EURC (see ADR 0007).

## Options considered
1. **Oracle-priced mint and redeem (a market contract that is the only minter on Arc)**
   - Buy: the user pays USDC, and the contract mints `qty = usdc / (price * (1 + spread))`.
   - Sell: the user's tAAPL is burned, and the contract pays `usdc = qty * price * (1 - spread)`.
   - Pros: always liquid; tracks the real price; little code; easy to explain.
   - Cons: the contract takes the other side of every trade, so it loses money when the price rises and must be seeded with USDC; the oracle is trusted; trades can be front-run around price updates.
2. **AMM pool tAAPL/USDC**
   - Pros: familiar; no oracle needed in the swap path.
   - Cons: needs seeded liquidity on both sides; the price drifts from AAPL unless someone arbitrages; ignores the oracle.
3. **Order book (onchain or offchain-matched)**
   - Pros: closest to a real terminal.
   - Cons: needs counterparties and much more code. Not feasible for the MVP.

## Decision
Proposed: option 1, with these rules.

Pricing and fees:
- The price must satisfy `block.timestamp - publishTime <= maxAge`, for example 120 s while the market is open.
- `spreadBps` is configurable, for example 30 bps.

Limits:
- `maxTradeUsdc` caps a single trade.
- `maxExposureUsdc` caps net exposure: total tAAPL supply on all chains times the price, minus the USDC held.

Market-closed behaviour (needs a user decision, T-001):
- Default: trading pauses while the market is closed.
- Demo switch: an owner-set `offHoursTrading` flag allows trading at the last close with a wider `offHoursSpreadBps`.
- This matters because judging will probably happen while the US market is closed (ADR 0004).

Accounting and safety:
- USDC accounting uses the ERC-20 interface `0x3600000000000000000000000000000000000000` with 6 decimals.
- tAAPL has 18 decimals.
- Rounding is always in favour of the contract.
- An owner-only `pause` exists. The owner can also seed and withdraw USDC to the treasury, and no further.
- Events `Bought(user, usdcIn, qty, price)` and `Sold(user, qty, usdcOut, price)` feed the UI and the later indexer (ADR 0011).

The contract is written and deployed with Arc Studio's Smart Contract mode (ADR 0006), with unit tests.

## Consequences
- The treasury needs testnet USDC to seed solvency. Demo only.
- Supply bridged to Sepolia still counts as a liability. Sellers must bridge back to Arc first.
- Main risks to list in the README:
  1. The oracle and relayer are trusted.
  2. The contract can become insolvent if the price rises sharply and seeding is too low.
  3. Users can front-run around stale prices; this is limited by `maxAge` and the spread.
  4. There is no real share behind tAAPL.

## Not verified
- Behaviour and gas of Arc Studio-generated contracts on Arc testnet.
- That `addMinter(market)` works on a native CrossChainToken (ADR 0002, T-005).
- Whether judges accept a synthetic oracle-priced token as "trading with tokenized RWAs". The track wording does not say.
