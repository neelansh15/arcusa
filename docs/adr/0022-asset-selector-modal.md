# 0022. Asset selector in the pair header, with a modal list

- Status: proposed
- Date: 2026-11-07
- Deciders: user, laptop

## Context
The trade page header shows one hard-coded pair, "NVDA / USDC". The user says arcusa will support many assets, and wants a selector there. ADR 0018 (proposed) already says: a list of assets, live rows are the wrapped stocks we have on Arc (today only wNVDA), planned stocks are shown greyed out, labelled planned, not selectable. This ADR is the first, small step of that: the control and the list, without multi-asset trading.

## Decision
**Control.** After "NVDA / USDC" in the pair header, a vertical up-and-down chevron icon. The whole group (token logos, name, icon) is one button. On hover or keyboard focus its background tints with a little white (about 6 to 8 percent opacity in dark, a small dark tint in light), with rounded corners that grow around the group, no layout shift. `aria-haspopup="dialog"`, accessible name "Choose asset, currently NVDA / USDC".

**Modal.** Opens on click or Enter or Space.
- Desktop: a centered dialog, about 440px wide, rounded like the cards, on a scrim. Mobile (under 768px): the existing `BottomSheet` (drag to dismiss).
- Contents: title "Select an asset", a search field (filters by ticker and name), a list of rows. Each row: two-logo badge, ticker and name, price for the live one (indicative, from the same quote), a status pill.
- Live rows (NVDA): selectable, show a check when current. Selecting closes the modal and sets the current asset.
- Planned rows: greyed, `aria-disabled`, pill "Coming soon", not selectable, not focusable as actions. A single note under the list: "More stocks are planned. Only NVDA trades today."
- Empty search shows "No assets match".
- Esc, the scrim, and a close button dismiss. Focus moves to the search field on open, is trapped inside, and returns to the button on close. Body scroll is locked while open.

**Data.** `app/src/lib/assets.ts` holds the registry: `{ ticker, name, status: "live" | "planned", ... }`. Live assets carry what the trade page needs (token addresses later). The registry is the single place the list comes from. The trade page keeps `asset` in state, default NVDA. Today it only feeds the header label; market, oracle, ticket and chart stay single-asset (ADR 0018 consequences). Because only one asset is live, selecting NVDA again is a no-op.

**Planned names.** The planned list shows a short, fixed set of well-known US tickers. They are a roadmap claim, so every one is labelled "Coming soon", cannot be opened, and has no price or logo claim beyond a neutral letter badge. No provider names or logos (ADR 0016). The set is easy to edit in `assets.ts`.

## Consequences
- New components: `AssetSelector` (button plus modal), `Modal` (desktop dialog, mobile sheet).
- `terminal.tsx` header uses `AssetSelector`; the static `h1` text becomes the button label.
- Real multi-asset trading needs per-asset market and oracle config; out of scope.
- Not verified: how many assets can be live on testnet, and whether each needs its own wrapper.
