# 0012. Asset model: provider tokens locked on their home chain, wrapped on Arc

- Status: proposed
- Date: 2026-11-06
- Deciders: alle, user
- Supersedes: 0002

## Context
The user decided that arcusa does not issue its own stock token. Tokenized stocks come from providers (Ondo, xStocks and similar). arcusa locks the provider's token on its home chain and mints a wrapped version on Arc. This replaces ADR 0002, which had arcusa issuing a synthetic `tAAPL`.

Mechanism (Circle CCTP for non-USDC assets, sources in ADR 0001, fetched 2026-11-05/06):
- The ownerless path: `registerOwnerlessToken` on one home chain with a LOCK_UNLOCK token manager. An Iris quote (`DeployTokenMessage`) then lets anyone call `deployRemoteOwnerlessToken` on each destination chain. The destination token is minted and burned by its manager.
- `resolveTokenAddress` and `resolveTokenManager` find the contracts. The remote rate limit must be above 0.
- Tokens are locked, not burned, on the home chain. Supply on Arc is therefore always backed 1:1 by locked provider tokens.

## Options considered
1. **Ownerless lock-and-mint of the real provider token (chosen)**
   - Pros: no issuer needed; backing is the provider's token; matches the user's decision and the Bridge Kit track.
   - Cons: the provider token may be permissioned (allowlist, geo-limit, transfer hooks), so the lock manager may not be allowed to hold it. Unverified.
2. **Own synthetic token (ADR 0002)**
   - Rejected by the user.
3. **Wait for a provider to register its token on Arc**
   - None found on Arc as of 2026-11-05. Out of our control.

## Decision
- Real design: home-chain provider token (for example AAPLx on Ethereum), locked in an ownerless LOCK_UNLOCK manager; wrapped token `wAAPL` on Arc.
- Testnet demo: no provider has tokens on Sepolia, so we deploy a **mock provider token** `mAAPL` on Sepolia as a fixture. It stands in for the provider token, is labelled as a mock everywhere, and is not our product. `wAAPL` is its wrapped version on Arc.
- 18 decimals on both sides unless the real provider token differs; the wrapped token copies the home token's decimals.
- Spikes: T-022 proves the mock flow on testnet. T-023 checks whether real provider tokens can be locked at all (read-only research).

## Consequences
- arcusa never mints stock exposure by itself. All `wAAPL` supply comes from lock-and-mint.
- If real provider tokens cannot be held by the manager, the real-token claim drops to "design for production", and the demo still runs on the mock. The README must say so.
- Redeeming `wAAPL` for the home token means bridging back (ADR 0013).

## Not verified
- Whether the ownerless LOCK_UNLOCK manager can hold permissioned provider tokens.
- Whether an ownerless token can be registered by anyone for a token we do not control, and what Circle's registry (Iris `GET /v2/cctpx/tokens`) lists for it.
- Whether the wrapped token decimals follow the home token.
