# Pooled oracle-priced market with LP shares: handoff brief

Date: 2026-11-06. Status: idea, not decided. Written to hand the thinking to another Claude session on the laptop. Nothing here is built. A proper ADR (0019) should follow once the open questions are answered.

## Why this comes up
Today liquidity is one owner's pre-positioned inventory (ADR 0014). To scale, anyone who holds the issuer's stock token on its home chain should be able to bridge it to Arc and earn from trades, without us holding the inventory. Bridging (lock and mint, ADR 0012/0013) gives anyone wNVDA on Arc. It does not by itself put that wNVDA where traders can fill against it.

## What exists today (verified from source, contracts/arc/src)
`InventoryMarket.sol` (deployed `0x8046c2bcb05c8750772bfcc2109659c85f3b10f4` on Arc testnet):
- Swaps USDC (6 dec) and wNVDA (18 dec) at the oracle price plus/minus a spread. `buy(usdcIn, minWnvdaOut)`, `sell(wnvdaIn, minUsdcOut)`, `quoteBuy`, `quoteSell`, `inventory()`.
- Per-session spread and cap (sessions 0 closed, 1 regular, 2 pre, 3 post, 4 overnight). Defaults: regular 30 bps, extended hours 90 bps with 25% cap, closed 200 bps with 10% cap, closed only if `offHoursTrading`.
- Risk limits: `maxTradeUsdc` (100 USDC), `maxExposureUsdc` (1000 USDC, on `netUsdcFlow`), `minInventory`, `minUsdcReserve`, `pause`.
- Owner-only `deposit` / `withdraw`. The owner takes all price risk and all spread income. There are no shares, no fee accounting, no per-depositor balances.
- Anyone can also transfer tokens straight to the contract (a donation, no claim).
`PriceOracle.sol` (`0xcd92cc2ff8d630a93090c203463843ffd685f83d`): relayer-pushed price (8 dec), staleness limit, confidence limit, per-update deviation cap, `demoMode`. The relayer is trusted and the price is not verified on-chain. Our relayer pushes when the price moves more than 0.1% or every 60 s. Source: xstocks.fi indicative price.
Single asset only (NVDA).

## The idea (option 1): pooled, oracle-priced market
A pool where LPs deposit USDC and wNVDA and receive shares. Traders swap at the oracle price plus a spread, exactly as now. There is no price curve. The spread (and any fee) accrues to LPs pro rata. This is the "oracle-priced pool" or proactive/oracle market maker pattern. Stocks fit it because their real price lives off-chain and trades only in sessions; a constant-product AMM would be arbitraged against the oracle and has thin depth.

Not recommended: a constant-product AMM (price drifts from the true price, exploitable around the oracle and market close, poor depth).

## Core design questions
1. **Share accounting.** Two assets, one share token. Options: (a) share price = pool value in USDC at the oracle price (NAV = usdc + wNVDA * price); deposits and withdrawals priced at NAV, in either asset or both. (b) Two single-sided vaults (a USDC vault and a wNVDA vault), each ERC-4626, with the market drawing from both. (a) is simpler for users; (b) isolates risk per asset. Decide which.
2. **Oracle dependence of NAV.** NAV uses the oracle price, so a stale or manipulated price lets someone deposit or withdraw at a wrong NAV. Pause deposits/withdrawals when the oracle is stale, in an unsupported session, or the confidence is wide. Consider deposit/withdraw delays or a queue.
3. **Adverse selection (the main LP risk).** An LP-funded market quotes at the oracle price. When the real price moves and the oracle lags, informed traders buy or sell against LPs at stale quotes. Mitigations to evaluate: wider spread in extended hours and closed sessions (already per session), dynamic spread by inventory skew (widen when the pool is lopsided), dynamic spread by recent oracle movement or confidence, per-trade and per-block caps, a min oracle update interval, no trading at all when the market is closed (decide whether closed-session demo mode stays).
4. **Inventory skew.** If traders mostly buy, the pool ends up short stock and long USDC. LPs bear the exposure. Options: skew-based pricing (push the price toward rebalancing), exposure caps (we have `maxExposureUsdc`), an external hedger/rebalancer role, or accept it and disclose it.
5. **Incentives and fee split.** Spread to LPs pro rata by share, plus an optional protocol cut. Possibly a token reward early on, but first check whether spread income alone covers LP adverse-selection losses. Needs a simulation using real price data.
6. **Who can bridge in and deposit.** Bridging is a separate page for LPs (ADR 0018). A deposit flow could chain bridge, then deposit, with Bridge Kit then the pool deposit transaction (one UI, two stages; about 16 minutes Sepolia to Arc).
7. **Withdrawal liquidity.** Withdrawals can leave the pool too thin for traders. Consider a withdrawal cap per epoch or a cooldown.
8. **Multi-asset.** With ADR 0018 (assets list, issuers) each asset needs its own pool and oracle, or one pool with several assets and per-asset risk. Prefer one pool per asset first.
9. **Compliance.** Provider tokens may restrict who can hold them (ADR 0016). Pooled custody of tokens that need KYC, and LP shares as a security-like claim, need review. Not analysed here.
10. **Upgradeability and audits.** Testnet demo contracts are ownerable and unaudited. A pooled version holds third-party funds, so it needs an audit and a clear admin/pause model.

## Comparable designs to study (from memory, not freshly researched; verify before citing)
Oracle-priced pools exist in DeFi: GMX's GLP/GM pools (LPs take the other side of traders at oracle prices, fees to LPs, the main known risk is trader-versus-LP PnL), Gains Network's gDAI vault, and oracle/PMM-style AMMs (DODO's PMM, Maverick-style concentrated models). Study how they handle oracle lag, skew pricing and withdrawal limits, then check the current state of each before relying on it.

## Suggested next steps for the laptop session
1. Read `contracts/arc/src/InventoryMarket.sol`, `PriceOracle.sol`, ADR 0014, ADR 0015, ADR 0018 and `docs/gas-costs.md`.
2. Answer questions 1 to 4 above, write ADR 0019 with a recommendation.
3. Prototype the share accounting in Foundry (`contracts/arc` has sources but no Foundry project yet; `contracts/sepolia` has a working foundry.toml to copy). Include invariant tests: shares never claim more than the pool holds, deposit then withdraw at an unchanged price returns about the same value, a stale oracle blocks deposits and withdrawals.
4. Replay a day or two of NVDA price data against the spread schedule to estimate LP PnL versus spread income, including a gap open (the oracle lags, a trader sells into it).
5. Deploy to Arc testnet with a new relayer-fed oracle only after the above.

## Repo rules to carry over
GitHub only via the OneCLI gateway API (no tokens, no force push, plain commit messages without Claude/Anthropic branding). Use "track", never "prize". Contracts are viem-deployed on testnet, not yet through Arc Studio. See CLAUDE.md for the full list.
