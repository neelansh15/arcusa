# 0003. USDC bridge-in: Bridge Kit with the Forwarding Service, fee paid on source

- Status: accepted
- Date: 2026-11-06
- Deciders: alle, user

## Context
Users fund their account with USDC they hold on another chain. A new user has no USDC on Arc, so they cannot pay Arc gas, which is paid in USDC. They should still be able to arrive on Arc in one step.

Sources (fetched 2026-11-06 IST):
- Forwarding Service concept: https://developers.circle.com/cctp/concepts/forwarding-service
  - Circle relays the destination mint, so the user needs no destination gas.
  - The fee is $0.05 for most destinations. Higher tiers apply only to HyperCore routes.
- Forwarding with USDC how-to: https://developers.circle.com/cctp/howtos/transfer-usdc-with-forwarding-service
- Arc App Kit tutorial: https://docs.arc.io/app-kit/tutorials/bridge/use-forwarding-service.md
  - Uses `to: { chain: "Arc_Testnet", useForwarder: true }`.
- Arc App Kit tutorial: https://docs.arc.io/app-kit/tutorials/bridge/pay-fees-on-source.md
  - Uses `config: { feePayment: "source" }`.
- Bridge Kit 2026 release notes: https://developers.circle.com/release-notes/bridge-kit-2026
  - Forwarding support was added on 2026-02-27. Bridge Kit moved to Arc App Kits on 2026-03-17.
- npm: `@circle-fin/bridge-kit` 1.17.1 and `@circle-fin/app-kit` 1.21.0, both published 2026-11-05.
- Arc connect page: https://docs.arc.io/arc/references/connect-to-arc.md
  - Testnet RPC is `https://rpc.testnet.arc.io` and the explorer is `https://explorer.testnet.arc.io`.
  - Chain id 5042002 (0x4cef52), confirmed with `eth_chainId` on 2026-11-06.
- Arc EVM differences: https://docs.arc.io/arc/references/evm-differences.md
  - Native USDC has 18 decimals. The ERC-20 interface at `0x3600000000000000000000000000000000000000` has 6 decimals.

Discrepancies:
- PLAN.md said the forwarding fee was "~$0.05-0.20". The docs say $0.05 for non-HyperCore destinations.
- The `rpc.testnet.arc.network` host is retired. The bridge-kit changelog (1.0.4) and the connect page use `rpc.testnet.arc.io`.

## Options considered
1. **Bridge Kit with `useForwarder: true` and `feePayment: "source"`**
   - Pros: one signature flow on the source chain; no Arc gas needed; this is Circle tooling that judges look for.
   - Cons: $0.05 fee; depends on Circle's relayer.
2. **Bridge Kit without forwarding**
   - Pros: no forwarding fee.
   - Cons: the user must call mint on Arc and needs USDC there for gas, which a new user does not have.
3. **Raw CCTP V2 contract calls**
   - Pros: full control.
   - Cons: more code and no added value.

## Decision
Use option 1.
- Source chain for the demo: Ethereum Sepolia. Other Bridge Kit-supported testnets can be added later as options.
- Amounts in app code use the 6-decimal ERC-20 USDC interface. Native 18-decimal values are only for gas.

## Consequences
- The app needs a source-chain wallet connection (Sepolia) as well as Arc.
- The user needs Sepolia ETH for the source transaction. They can get USDC from https://faucet.circle.com.
- A fresh-wallet test (T-004) is required before relying on this in the demo.

## Not verified
- An actual forwarded transfer from Sepolia to Arc testnet, run by us. This is covered by spike T-004.
- The current testnet forwarding fee. The docs list mainnet pricing.
