# 0009. Compliance and legal stance for the testnet demo

- Status: superseded by 0016
- Date: 2026-11-06
- Deciders: alle, user

## Context
Tokenized US stocks offered to non-US users are regulated products in most places (securities law, KYC and AML, sanctions, geo-restrictions). arcusa at ETHGlobal Mumbai is a testnet demo with no real money and no real shares. We need a clear stance so the demo does not imply otherwise, and so post-hackathon work starts from the right assumptions. This is not legal advice. Nobody on the team has checked it with a lawyer.

Sources (fetched 2026-11-06 IST):
- Arc blocklist monitoring: https://docs.arc.io/integrate/infrastructure/compliance.md
  - USDC on Arc enforces a blocklist at runtime.
  - Integrators should track `Blocklisted` and `UnBlocklisted` events.
- Arc compliance vendors: https://docs.arc.io/arc/tools/compliance-vendors.md
  - Lists Chainalysis, Elliptic and TRM Labs.
- CCTPx denylist layers: https://developers.circle.com/cctp/expanded-assets/concepts/denylist-layers
  - There is a service-level denylist, plus a per-token denylist on protocol-deployed CrossChainTokens.
- Circle's 2026-10-30 post, as reported by https://blockchain.news/news/circle-cctp-non-usdc-erc20-arc:
  - Arc mainnet is offered by Arc Network Services LLC with a permissioned validator set.
  - Arc testnet is offered by Circle Technology Services, LLC.
  - The post carries regulatory disclaimers.

## Options considered
1. **Testnet-only synthetic token, clearly labelled, no KYC, no real value**
   - Pros: honest and fast; no regulated activity.
   - Cons: does not show a compliant path.
2. **Add a KYC or geo gate now (vendor from the Arc list) plus the token denylist**
   - Pros: shows awareness.
   - Cons: vendor onboarding takes time; it adds credentials; it distracts from the MVP.
3. **Use a real tokenized-stock issuer**
   - Not possible on Arc today (ADR 0002).

## Decision
Use option 1.
- Names and UI say "test" or "synthetic": token name `arcusa test AAPL`, symbol `tAAPL`.
- Every screen states: "Testnet demo. Not a security, no real shares, no real value."
- No mainnet deployment of the market or token. No real USDC.
- The README has a "Compliance and limits" section. It explains that a production version needs a licensed issuer or broker holding the real shares, KYC/AML, sanctions screening, geo-restrictions, and use of the token denylist and TokenManager pause.

Option 2 is a post-MVP item, and only if the user wants to continue after the hackathon.

## Consequences
- A blocklisted address cannot move USDC on Arc, so it cannot buy. The market contract must handle failed USDC transfers by reverting cleanly.
- The pitch must describe the product vision ("US-stock exposure for non-US users") without implying that we offer it today.
- Do not use real company logos beyond the ticker text.

## Not verified
- Any jurisdiction-specific legal analysis (India, US or elsewhere).
- What the compliance vendors listed by Arc support on testnet.
