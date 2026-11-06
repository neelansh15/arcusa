# 0023. Custom wallet connect modal on wagmi 3 (not RainbowKit)

- Status: accepted
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

## Revisions after devil's advocate review (2026-11-07)
Accepted with these changes. They override anything above that conflicts. Sources: installed `@wagmi/core` 3.x sources (`createConfig`, `hydrate`, `connect`, `reconnect`) read on 2026-11-07, and the npm registry via `pnpm view` on the same date.
1. **No `window.ethereum`.** `header.tsx` calls `window.ethereum.request(wallet_addEthereumChain)` when a switch fails, which targets the wrong wallet once EIP-6963 wallets are in use. Replace it with the active connector's provider (`connector.getProvider()`), and delete the `Window.ethereum` global declaration. Acceptance: no `window.ethereum` reference remains except the fallback-row check. `bridge.ts` already uses `connector.getProvider()`, so Bridge Kit needs no change.
2. **Fallback row logic.** wagmi dedupes by `rdns`, and `injected()` has none, so the list will contain "Injected" plus discovered wallets. The modal shows connectors whose `id !== "injected"`; it shows the generic `injected` row, labelled "Browser wallet", only when that list is empty and `window.ethereum` exists. `injected()` stays in the config.
3. **Hydration.** With `ssr: true`, discovered wallets are added after mount. Use the reactive `useConnectors()` hook and decide "no wallet found" only after mount plus about 300 ms. The header pill shows a neutral placeholder before mount and while `status === "reconnecting"`.
4. **Hooks.** New code uses `useConnection` (and migrates `useAccount`, a deprecated alias, in the four files that use it).
5. **Connecting.** `connect({ connector })` with the connector object from `useConnectors()`, never a new `injected()`. The pending row is found by `connector.uid` from `useConnect().variables`; other rows get `aria-disabled` (not `disabled`) while one is pending; clicking the pending row is a no-op. The row of the already-connected wallet is shown as "Connected" and inert (avoids `ConnectorAlreadyConnectedError`). Rejection (code 4001) is a neutral "Request cancelled", "already pending" (code -32002 or message) is a friendly message, other errors show their first line.
6. **No cancel while connecting.** A pending `connect()` cannot be aborted. While pending, Escape, the backdrop and × do not close the modal; it says "Request still open in your wallet".
7. **One layer.** A `WalletModalProvider` holds `view: "connect" | "account" | null` and renders one `Modal`, so Escape closes one layer. No nested modals.
8. **Header effects stay.** The auto-switch-to-Arc effect stays in `Header` and runs whether or not a modal is open. A declined switch is silent and leaves a "Switch to Arc" control in the account modal and in the header. Switch errors other than a rejection show as a toast.
9. **Icons and names (security).** `connector.icon` is untrusted. Render only in an `<img>` (never `dangerouslySetInnerHTML` or CSS `url()`), accept only `data:image/(png|jpeg|webp|svg+xml|gif);base64,` data URIs or `https:` URLs under 200 KB, with `alt=""`, `referrerPolicy="no-referrer"`, a fixed 32px box, and a first-letter fallback on error. Names are plain text, truncated to 32 characters, no "verified" badge; known rdns (`io.metamask`, `io.rabby`, `app.phantom`, `com.coinbase.wallet`) sort first.
10. **Clipboard and links.** `navigator.clipboard.writeText` in try/catch with a polite live-region "Copied". The ArcScan link is built from the configured explorer URL plus `/address/` plus the checksummed address, `target="_blank"` and `rel="noopener noreferrer"`.
11. **No wallet, touch device.** On touch devices the no-wallet state also offers the MetaMask app deep link (`https://metamask.app.link/dapp/<host>`). Desktop shows install links for MetaMask and Rabby. WalletConnect stays deferred (needs a Reown project ID).
12. **Focus and layout.** The wallet list scrolls inside the modal body; initial focus is the first wallet button (desktop) or the dialog (touch).
13. **Acceptance additions.** Hydration state correct after mount; Escape closes one layer; wrong-chain path through the account modal; connecting while a different wallet is connected; the Result states which of these could not be tested without real extensions (a test with two extensions, MetaMask plus Rabby, is manual).
