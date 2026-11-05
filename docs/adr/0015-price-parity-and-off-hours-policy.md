# 0015. Price parity and off-hours policy

- Status: proposed
- Date: 2026-11-06
- Update 2026-11-06: demo stock is NVDA, demo mode is approved by the user, and Ondo's API is the first-choice price source (below). The AAPL facts in Context were researched before this change and are kept as examples.
- Deciders: alle, user
- Supersedes: 0004

## Context
The user's main concern: how do we keep the price right? Several gaps can open between what `wNVDA` costs on Arc and what AAPL is worth.

Sources (fetched 2026-11-05 ~21:00 UTC unless noted):
- Pyth Core exists on Arc **mainnet** only (`0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a`, validTimePeriod 60s). Pyth Pro (`0xACeA761c27A909d4D3895128EBe6370FDE2dF481`) is on testnet and mainnet and needs a token. Pyth Hermes now returns 401 without a key.
- Pyth Pro AAPL feed id 922 has a `marketSession` field: regular, preMarket, postMarket, overNight, closed. The regular-hours feed goes stale at the close.
- Chainlink has no equity feeds on Arc. Its 24/5 feeds freeze at the last value; Data Streams carry `marketStatus`.
- Stork (`0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62`) has `AAPL_24_5` and `AAPLXUSD`. Its 24/7 feeds switch to a perp price with a deviation cap. It needs a key.
- A provider token can trade away from the stock: AAPLx was ~353.6 against a Yahoo close of 344.17 (~2.7% premium) on that date.
- US regular hours are 09:30-16:00 New York, which is 20:00-02:30 IST. Daytime judging in Mumbai is outside the session.
- Not checked: RedStone and Chronicle equity coverage, live Pyth or Stork prices, Chainlink Data Streams verifiers on Arc.

## The gaps and how each is handled
| Gap | Cause | Control |
| - | - | - |
| Stale price | oracle not updated | `maxAge` (60s in session); revert when older |
| Stale-price arbitrage | trader sees the real move before the oracle | spread ≥ expected move over `maxAge`; per-trade and exposure caps; no trading in the 5 minutes around open and close |
| Market closed | nights, weekends, holidays | session policy below |
| Gap at the open | price jumps overnight | per-update deviation cap (±10%); a larger move needs a two-step admin `acceptGap` |
| Bad data | zero, negative or wide-confidence price | revert if price ≤ 0 or confidence/price above 1%; publish times must increase |
| Wrapped vs home token | wrapped is backed 1:1 by locked tokens, redeemable by bridge | no discount if the lock contract holds the full supply; show it in the UI; alert if locked < wrapped supply |
| Provider token vs the stock | provider premium or discount (~2.7% seen) | price off the NVDA oracle; the spread covers small gaps; post-MVP reads the provider's own feed or rate; show both prices when known |
| Inventory runs out or skews | one-way flow | caps, `minInventory`, skew-based spread widening, pause |

## Session policy
Session comes from the oracle's `marketSession` (Pyth Pro 922) or the schedule.
| Session | Trading | Spread | Size cap |
| - | - | - | - |
| regular | open | base (30 bps) | full |
| preMarket, postMarket, overNight | open if the feed gives a session price, else closed | 3× base | 25% |
| closed (only the regular-hours price exists) | **paused by default** | n/a | n/a |

**Demo mode (decision for the user, T-001):** with `offHoursTrading = true` the market trades at the last regular price with a 200 bps spread and a small cap, and every screen shows "Market closed. Indicative price from <time>". This lets judges trade in daytime Mumbai. It is a flag, off in any production deployment.

## Oracle source
Demo stock: **NVDA** (`NVDAon` is on Ondo's 24/7 mint and redeem list, so a price can exist off-hours).

Ondo API (fetched 2026-11-06 from docs.ondo.finance; see T-025):
- Base `https://api.gm.ondo.finance`, header `x-api-key`. Key from onboarding@ondo.finance; not obtained yet. Not found: a sandbox or testnet.
- `/v1/assets/{symbol}/prices/latest` returns on-chain token price, underlying stock price and a timestamp. `/v1/assets/{symbol}/market` adds `sharesMultiplier` and `tradableSessions`. `/v1/status/market` returns `isOpen`, `marketStatus` (regular, premarket, postmarket, overnight, offhours, paused, closed), next open and close. `/v1/status/assets` lists pauses (dividends, splits, earnings, maintenance).
- Sessions (ET): pre-market 4:01-9:29, core 9:31-15:59, post-market 16:01-19:59, overnight 20:05-03:55 Sunday to Friday, plus an off-hours session for weekends and holidays on select assets.
- Every price endpoint says "intended for display only"; for trading Ondo points to the Soft Attestation Quote API (not read). Docs also say an official oracle is in development.
- 24/7 mint and redeem is live for SPYon, QQQon, CRCLon, NVDAon, TSLAon, GOOGLon (Ondo blog, 2026-06-25). A press summary claims 25+ assets including Apple; Ondo's own page lists six and no Apple (discrepancy, trust Ondo).
- Chainlink feeds for SPYon, QQQon, TSLAon are live on Ethereum (Cointelegraph, 2026-02-11). No Arc feed found.

Decision (proposed):
- **Primary:** the relayer reads `NVDAon` price and `/v1/status/market` from Ondo and pushes price, stock price, session and timestamp into our `PriceOracle` on Arc. The relayer is trusted, and the README says so.
- Because Ondo calls the price "display only", the market keeps its spread, caps and `maxAge`, and the UI labels the price "indicative". If T-025 shows the Soft Attestation Quote suits us, switch to quotes in a new ADR.
- The oracle also stores the underlying stock price, so the UI can show the token-vs-stock gap.
- **Cross-check, if keys exist:** Pyth Pro and Stork NVDA feeds.
- **Fallback:** a labelled fixed or last-known price, in demo mode only.
- `sharesMultiplier` and asset pauses: the market reverts while `updateSharesMultiplier` is set or the asset is paused.

## Consequences
- The oracle contract keeps last price, publish time, session, confidence. The UI shows all four.
- Parity monitoring (T-030): oracle age, session, spread, inventory, locked vs wrapped supply, provider token price when known.
- We cannot guarantee parity. We bound the loss per trade and in total, and say so.

## Not verified
- Ondo API key and real payloads; whether NVDAon has off-hours limits above zero; the Soft Attestation Quote API.
- Pyth Pro testnet access terms, and NVDA feed ids.
- What the feeds publish at night and on weekends.
- Whether `marketSession` is available onchain or only in the API payload.
