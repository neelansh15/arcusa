# 0017. Demo scope with the wrapped token

- Status: proposed
- Date: 2026-11-06
- Deciders: alle, user
- Supersedes: 0007 (demo scope section only; the track choice in 0007 still stands)

## Context
ADR 0007 listed a demo that buys a self-issued `tAAPL`. The asset model changed (ADR 0012), and the user wants the bridge shown as its own step.

## Decision
Primary track and stretch items stay as in ADR 0007. The MVP demo, in order:
1. Fresh wallet: bridge USDC Sepolia → Arc with Forwarding (ADR 0003).
2. Terminal: AAPL price, session status, oracle age, balances (ADR 0015).
3. Buy `wAAPL` with USDC from pre-positioned inventory (ADR 0014). If the market is closed, the off-hours banner shows (demo mode).
4. **Bridge `wAAPL` Arc → Sepolia** with Bridge Kit as its own visible step (ADR 0013), and show the unlocked `mAAPL` on Sepolia.
5. Show the lock-and-mint view: locked `mAAPL` on Sepolia equals `wAAPL` supply on Arc.
6. If time allows: sell back. Show Arc Studio and the architecture diagram.

Before recording, inventory is pre-positioned by bridging `mAAPL` Sepolia → Arc (T-028). The video says so.

## Consequences
- The pitch says "the stock token comes from a provider; we wrap and trade it", never "we issue stocks".
- Out of scope: more than one stock, indexer, mainnet, automated rebalancer, KYC.

## Not verified
- Whether judges accept a mock provider token (ask the Arc team).
