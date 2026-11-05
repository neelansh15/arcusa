# 0008. Frontend, stack and wallet

- Status: proposed
- Date: 2026-11-06
- Deciders: alle, user

## Context
The terminal UI needs four things:
- A wallet that can sign on Arc testnet and Ethereum Sepolia.
- Bridge Kit flows in the browser.
- Reads from our contracts.
- An oracle relayer (backend).

The UI scaffold comes from Arc Studio (ADR 0006), so the framework partly depends on what Studio generates.

Sources (fetched 2026-11-06 IST):
- App Kit installation and adapters:
  - https://docs.arc.io/app-kit/tutorials/installation.md
  - https://docs.arc.io/app-kit/tutorials/adapter-setups.md
  - The viem adapter is `@circle-fin/adapter-viem-v2` (npm 1.20.1).
- Bridge Kit: `@circle-fin/bridge-kit` 1.17.1, depending on `@circle-fin/provider-cctpx` 1.0.7 and `@circle-fin/provider-cctp-v2` (npm, published 2026-11-05).
- Arc connect page: https://docs.arc.io/arc/references/connect-to-arc.md
  - Arc testnet: chain id 5042002, RPC `https://rpc.testnet.arc.io`, explorer `https://explorer.testnet.arc.io`. Gas is paid in USDC.
- Arc EVM differences: https://docs.arc.io/arc/references/evm-differences.md
  - The 20 Gwei `maxFeePerGas` floor.
  - Native USDC has 18 decimals; the ERC-20 interface has 6.
- Arc Foundry: https://docs.arc.io/arc/tutorials/install-arc-foundry.md
  - Recommended for Arc contract work (`arc-forge`, `arc-cast`, `arc-anvil`).

## Options considered
1. **Keep whatever React-based scaffold Studio generates; add wagmi + viem for the wallet and Bridge Kit with the viem adapter in the browser; injected wallet (MetaMask or Rabby)**
   - Pros: least friction with Studio; matches Circle's adapter.
   - Cons: framework not known until T-003.
2. **Next.js app written on the laptop; Studio used only for contracts**
   - Pros: a known stack.
   - Cons: weaker "built in Studio" story; duplicate scaffolding.
3. **Circle Wallets (user-controlled or modular) instead of an injected wallet**
   - Pros: no browser extension.
   - Cons: adds credentials and setup; not needed for the demo.

## Decision
Proposed: option 1.
- Wallet: an injected EIP-1193 wallet through wagmi, with chains Arc testnet (5042002) and Ethereum Sepolia.
- Bridge Kit runs in the browser with `@circle-fin/adapter-viem-v2`. If browser use fails, a small backend endpoint is not an option, because it would need user keys. Instead, fall back to raw CCTS calls from the browser (ADR 0001, option 2).
- Backend: one small Node service, the oracle relayer (ADR 0004), in `services/oracle-relayer/`.
- Contracts: Studio-generated Arc contracts. Laptop scripts use Arc Foundry or viem in TypeScript.
- Package manager and versions are pinned in lockfiles. Re-check the Bridge Kit version before the demo (fast-moving).

This becomes `accepted` once T-003 shows the Studio scaffold and T-006 shows that Bridge Kit works in the browser.

## Consequences
- Gas settings on Arc must respect the 20 Gwei floor. Check wagmi and viem defaults.
- Decimal handling for USDC must be explicit across the UI.

## Not verified
- The framework Studio generates.
- Bridge Kit CCTPx in a browser bundle (Node-only dependencies, bundle size).
- Wallet support for adding Arc testnet automatically (`wallet_addEthereumChain`).
