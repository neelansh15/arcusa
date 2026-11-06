# 0013. Bridging path for the wrapped stock token

- Status: accepted (2026-11-06, by the user)
- Date: 2026-11-06
- Deciders: alle, user
- Supersedes: 0001

## Context
ADR 0001 assumed arcusa's own native CrossChainToken, burned and minted both ways. With ADR 0012 the home side is lock/unlock and the Arc side is mint/burn. The user wants the bridge shown as its own demo step.

Facts (fetched 2026-11-05/06, see ADR 0001 for links):
- Bridge Kit takes a bytes32 CCTPx token id, not an address. Its CCTPx provider always forwards and rejects `feePayment: 'destination'`. The token must be in Iris `GET /v2/cctpx/tokens`.
- Timing for CCTP v2 USDC: Fast ~20s from Ethereum and ~8s from Base; Standard ~15-19 min from Ethereum and Base; Arc as source Standard ~0.5s. Fast for non-USDC is not covered by the docs.
- The Bridge page says "USDC and EURC only"; the quickstart expects a zero address where the contract reverts with `TokenNotRegistered` (`0x5d0028cf`).
- Fees for non-USDC are paid in native gas (USDC on Arc). The source chain still needs its own gas.

## Decision
- User path: **Bridge Kit by token id is required** (the track needs Bridge Kit). Raw `CrossChainTokenService` calls are a debugging aid only, not a shipped path.
- **Direction shown in the demo: Arc to Sepolia** (`wNVDA` burned on Arc, `mNVDA` unlocked on Sepolia). Arc as source settles in about 0.5s on Standard. This is the redeem direction and it is fast.
- **Sepolia to Arc** (lock and mint) is slow on Standard and may or may not have Fast. It is used only for **pre-positioning inventory before the demo** (ADR 0014), not live.
- The demo shows the bridge as its own step (ADR 0017), not hidden inside a trade.

## Consequences
- A trade never waits for a bridge. Trades settle against inventory already on Arc.
- Timing numbers shown in the UI or video must be measured in T-024, not quoted from docs.
- If Bridge Kit rejects the token, T-024 reports it as a blocker with the revert and doc evidence. We do not switch to raw calls without a new decision from the user.

## Not verified
- Fast Transfer for non-USDC tokens, in either direction.
- Whether Bridge Kit lists our token ids without the token being in the Iris registry.
- Real timings on Arc testnet for the mock token (T-024).
