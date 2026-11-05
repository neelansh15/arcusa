# 0015. Price parity and off-hours policy

- Status: proposed
- Date: 2026-11-06
- Deciders: alle, user
- Supersedes: 0004

## Context
The user's main concern: how do we keep the price right? Several gaps can open between what `wAAPL` costs on Arc and what AAPL is worth.

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
| Provider token vs the stock | provider premium or discount (~2.7% seen) | price off the AAPL oracle; the spread covers small gaps; post-MVP reads the provider's own feed or rate; show both prices when known |
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
- Preferred: **Pyth Pro AAPL (id 922)**, verified onchain if testnet access works; else **Stork `AAPL_24_5`**.
- Fallback: a relayer pushes the price into our `PriceOracle` (trusted, not verified onchain) and the README says so.
- Hardcoded prices are a last resort and must be labelled.
- Spike T-025 checks the key requirements and what each feed does outside regular hours.

## Consequences
- The oracle contract keeps last price, publish time, session, confidence. The UI shows all four.
- Parity monitoring (T-030): oracle age, session, spread, inventory, locked vs wrapped supply, provider token price when known.
- We cannot guarantee parity. We bound the loss per trade and in total, and say so.

## Not verified
- Pyth Pro testnet access terms, and the 922 id on testnet.
- What the feeds publish at night and on weekends.
- Whether `marketSession` is available onchain or only in the API payload.
