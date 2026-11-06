# @arcusa/app

Dense dark single-screen NVDA/USDC terminal for Arc testnet (5042002) and Sepolia (11155111).
Next.js App Router, TypeScript, pnpm, oxlint, wagmi + viem, lightweight-charts.

## Run

```
pnpm install                        # from the repo root (pnpm workspace covers app/)
pnpm --filter @arcusa/app dev       # or: cd app && pnpm dev
pnpm --filter @arcusa/app build && pnpm --filter @arcusa/app start
pnpm --filter @arcusa/app lint && pnpm --filter @arcusa/app typecheck
```

Requires Node >= 22.12. No keys or secrets are used.

## Panels

- Header: injected-wallet connect, Arc/Sepolia switch (adds Arc via `wallet_addEthereumChain` if unknown), OFF-HOURS DEMO badge.
- Chart: polls `/api/price`, which proxies the xstocks.fi NVDAx price-data endpoint. The upstream has no timestamp, so the server records `fetchedAt` and the UI flags the quote STALE after 60 s.
- Order ticket: UI only. TODO stub for the InventoryMarket contract call (`src/components/order-ticket.tsx`).
- Balances: real on-chain reads of Arc USDC (ERC-20, 6 dec) and wNVDA (18 dec).
- Bridge: CCTP leg timeline UI for Sepolia mNVDA. `src/lib/bridge.ts` is a typed stub for later `@circle-fin/bridge-kit` use (`token: tokenId`, `useForwarder: true`, `transferSpeed: 'SLOW'`). Known timings: into Arc ~16 min, back ~28 s. FAST reverts for this token.

## Layout

`src/lib/config.ts` holds chains, addresses and constants. `src/app/api/price/route.ts` is the price proxy.

## Stubbed

Order submission, and the bridge client (it always rejects until Bridge Kit is wired).
