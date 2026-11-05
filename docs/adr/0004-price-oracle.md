# 0004. Price oracle: Pyth equity price relayed by our backend into an arcusa oracle contract on Arc

- Status: superseded by 0015
- Date: 2026-11-06
- Deciders: alle, user

## Context
The market contract (ADR 0005) needs an AAPL/USD price on Arc testnet. The price must be recent and must say whether the US market is open.

Sources (fetched 2026-11-06 IST):
- Arc oracles page: https://docs.arc.io/arc/tools/oracles.md
  - Lists Chainlink, Chronicle, Pyth, RedStone and Stork. It does not say which of them are live on Arc **testnet**.
- Pyth EVM contract addresses: https://docs.pyth.network/price-feeds/core/contract-addresses/evm
  - Arc mainnet: Pyth Pro `0xACeA761c27A909d4D3895128EBe6370FDE2dF481` and Pyth Core `0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a`.
  - "Arc Network Testnet": Pyth Pro `0xACeA...2dF481` only. There is no Pyth Core entry ("—").
  - Onchain on 2026-11-06: `0xACeA...` has code on Arc testnet; `0x8250...` has none.
- Stork EVM contract addresses: https://docs.stork.network/resources/contract-addresses/evm#arc
  - Arc testnet and mainnet: `0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62`. It has code on Arc testnet (checked 2026-11-06).
- Pyth Hermes feed list: `GET https://hermes.pyth.network/v2/price_feeds?query=AAPL&asset_type=equity` (fetched 2026-11-06).
  - `Equity.US.AAPL/USD` has id `0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688`.
  - The feed's schedule is `America/New_York;0930-1600` on weekdays, with holidays listed. The response includes `market_hours.is_open`, `next_open` and `next_close`.
- US regular trading hours are 09:30-16:00 New York time, which is **20:00-02:30 IST** after the US DST change on 2026-11-01. Daytime judging in Mumbai will most likely happen while the US market is closed.

Discrepancy: the Arc oracles page lists Pyth for Arc generally, but Pyth's own table shows no Pyth Core (pull-oracle) contract on Arc testnet. Only Pyth Pro is listed there.

## Options considered
1. **Backend relayer pushes the Pyth Hermes price into our own `PriceOracle` contract on Arc**
   - The contract stores price, exponent, publish time and a market-open flag, and accepts updates only from a relayer address.
   - Pros: works today with no third-party contract on Arc testnet; gives us the "backend" the track asks for; simple.
   - Cons: the relayer is trusted, so the price is not verified onchain; we must run a process; the relayer key can be lost.
2. **Pyth Pro (Lazer) contract on Arc testnet, signed updates verified onchain**
   - Pros: verifiable prices.
   - Cons: Pyth Pro access may need an access token (not checked); the AAPL channel on Pyth Pro and its testnet availability are not checked.
3. **Stork on Arc testnet**
   - Pros: contract is deployed and verified onchain.
   - Cons: equity (AAPL) coverage and API-key needs are not checked.
4. **Chainlink, RedStone or Chronicle**
   - Not checked for Arc testnet equity feeds today.
5. **Hardcoded or admin-set price**
   - Pros: trivial.
   - Cons: not a real terminal. Only acceptable as a last-resort demo fallback.

## Decision
Proposed: option 1 for the MVP.
- Read `Equity.US.AAPL/USD` from Hermes and push it to `PriceOracle` on Arc every N seconds, and on demand before a trade if needed.
- Store `publishTime` and `isMarketOpen`.
- The market contract rejects prices older than `maxAge` (ADR 0005).

Spike T-007 checks options 2 and 3. If either gives a verifiable AAPL price on Arc testnet with little effort, write a new ADR to move to it after the MVP.

This ADR becomes `accepted` after T-007 confirms that Hermes returns a live AAPL price from the laptop or server, and that no simpler verifiable option is ready.

## Consequences
- We need a long-running relayer (in `services/`) and a funded relayer wallet on Arc. Gas is paid in USDC.
- The UI must show "market closed, last price at <time>" outside US hours. See ADR 0005 for trading rules when the market is closed.
- Trust model to state in the README: prices are relayed by arcusa, not verified onchain.

## Not verified
- Hermes `/v2/updates/price/latest` for AAPL. The request from this server was intercepted by the credential gateway, so we have no live price reading today.
- Whether Hermes is reachable from the Arc Studio live-preview sandbox. Studio allowlists outbound hosts (npm, GitHub, Circle APIs, Hugging Face, Netlify). This matters only if the relayer runs inside Studio.
- Pyth Pro and Stork AAPL availability, and whether either needs credentials.
