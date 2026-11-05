# 0016. Compliance and legal stance with provider tokens

- Status: proposed
- Date: 2026-11-06
- Deciders: alle, user
- Supersedes: 0009

## Context
ADR 0009 assumed a synthetic test token. Real provider tokens are regulated products: providers typically restrict who may hold or transfer them (allowlists, geo-limits, KYC). Wrapping them on another chain may bypass those restrictions or be refused. This is not legal advice and nobody has checked it with a lawyer. Sources for the Arc and CCTPx compliance points are listed in ADR 0009.

## Decision
- The testnet demo uses a **mock provider token** (`mNVDA`) and its wrapped version. No real shares, no real provider tokens, no real value, no mainnet.
- Names and UI say "mock" and "test". Every screen states: "Testnet demo. Not a security, no real shares, no real value."
- Do not claim we hold or redeem real provider tokens. Do not use provider names or logos.
- The README says production use needs the provider's agreement, a holder that satisfies the provider's restrictions, KYC/AML, sanctions screening, geo-restrictions, the CCTPx token denylist and TokenManager pause, and Arc's USDC blocklist handling.
- T-023 records what each real provider's token restricts, as research only.

## Consequences
- A blocklisted address cannot move USDC on Arc, so the market reverts cleanly.
- If a provider forbids wrapping, the product vision needs that provider as a partner. This goes in the pitch as an open question.

## Not verified
- Any jurisdiction-specific analysis.
- Provider terms on wrapping or bridging their tokens.
