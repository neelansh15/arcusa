# 0023. Custom wallet connect modal on wagmi 3 (not RainbowKit)

- Status: proposed
- Date: 2026-11-07
- Deciders: user, laptop

## Context
The user wants a customizable connect-wallet UI and suggested RainbowKit. Checked on 2026-11-07 (`pnpm view`): `@rainbow-me/rainbowkit` latest is 2.2.11 with peer `wagmi ^2.9.0`; ConnectKit 1.9.2 needs `wagmi 2.x` and React 17 or 18. The app is on wagmi 3.7.11 and React 19.3.1, so neither installs cleanly. `@reown/appkit-adapter-wagmi` 1.8.24 peers `wagmi >=2.19.5` (works with 3) but needs a project ID and is heavy. Today the app connects with a single `injected()` connector (`header.tsx`, `order-ticket.tsx`), and clicking the address pill disconnects immediately.

## Options considered
1. RainbowKit with a downgrade to wagmi 2: familiar UI, but a downgrade touches trade and Bridge Kit, and non-injected wallets need a WalletConnect project ID.
2. Reown AppKit: supports wagmi 3, needs a project ID, larger bundle, less control over the look.
3. A custom modal on wagmi 3 using our own `Modal` and wagmi's `useConnect` with EIP-6963 wallet discovery.

## Decision (user chose option 3 on 2026-11-07)
- **Detected wallets.** `createConfig` keeps wagmi's default EIP-6963 discovery. The modal lists the discovered wallets (name and icon from the connector). The generic `injected()` connector is a fallback row, "Browser wallet", shown only when no wallet is discovered.
- **Connect modal.** Title "Connect a wallet". One row per wallet. Clicking connects; the row shows "Confirm in your wallet…" and the others are disabled while pending. Errors show inline in the modal (rejected, already pending, other), not in the header. On success the modal closes. If no wallet is found: a short message with MetaMask and Rabby install links.
- **Account modal.** The address pill opens an account modal (address, copy, view on ArcScan, network with switch-to-Arc if wrong, Disconnect). Clicking the pill no longer disconnects directly.
- **One opener.** A `WalletModalProvider` in `Providers` exposes `openConnect()` and `openAccount()`. The header button and the order ticket's "Connect wallet" both call `openConnect()`.
- **Theme.** Built on the shared `Modal` (dark and light, bottom sheet on mobile, focus trap, Escape).
- **Unchanged.** Auto-switch to Arc after connect, reconnect on reload, the toast for the pending-request case becomes inline modal text.
- **Later.** WalletConnect (mobile deep links, any wallet) needs a Reown project ID, which the user must create. The modal list is data-driven, so adding the `walletConnect` connector is a small change.

## Consequences
- No new dependency and no wagmi downgrade.
- We own the wallet UI: accessibility and edge cases are ours to test.
- Without WalletConnect, phone users need a wallet's in-app browser or an injected provider; this is a known limit for the demo.
- Not verified: how many EIP-6963 wallets show up with real extensions installed; behaviour with several wallets at once.
