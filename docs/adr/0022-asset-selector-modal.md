# 0022. Asset selector in the pair header, with a modal list

- Status: accepted
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

## Revisions after devil's advocate review (2026-11-07)
Accepted with these changes. They override anything above that conflicts.
1. **Named tickers.** ADR 0021's "no named tickers" rule applies to the landing page only. In the app, ADR 0018 (user decision 2026-11-06) allows greyed planned rows. The fixed planned set is `AAPL`, `TSLA`, `MSFT`, `AMZN`, shown as ticker only (no company name, no logo, neutral text), each labelled "Coming soon" in visible text, not selectable, with no price. The modal carries the ADR 0016 line: "Testnet demo. Not a security, no real shares, no real value."
2. **The live row is a mock.** Its label is "Mock NVDA token (wNVDA)", never "NVIDIA". It shows the same two-logo group as the header.
3. **Own `Modal`, `BottomSheet` untouched.** A new `Modal` component (portal to `body`, z-index 70, below the toast at 1000) with one Escape handler, a focus trap, focus return to the opener, inert background and body scroll lock with restore. On desktop it is a centered dialog; under 768px the same component is styled as a bottom sheet by CSS (no drag). It is mounted only when open, so nothing renders during SSR.
4. **Search focus.** The search field takes focus on desktop only; on mobile the dialog itself is focused so the keyboard does not open and shrink the viewport. The sheet uses `dvh` units. Acceptance in T-052 says this explicitly.
5. **Semantics.** The button lives inside the `h1`; its name is the pair text plus visually hidden "choose asset", with `aria-haspopup="dialog"`. Disabled rows are `li` elements with `aria-disabled="true"` and visible "Coming soon" text (no `disabled` buttons, no opacity-only dimming: muted text colour). Search is `input type="search"` with a label and a polite live region ("N results", "No assets match"). Plain buttons, no listbox; Tab only, no arrow-key navigation for now.
6. **Hover and focus.** A `--hover` token in both themes (white 7 percent in dark, dark 6 percent in light), padding reserved so nothing shifts, and a visible `:focus-visible` ring in addition to the tint.
7. **Display only.** `asset` in the trade page is display-only state that feeds the header label. Picking NVDA is a no-op. It is not a working switch until per-asset market config exists (ADR 0018).
8. **Cut for now.** Prices in rows, arrow-key navigation, per-row logo badges for planned rows, token addresses in `assets.ts`.
9. **Acceptance additions.** Escape fires once and closes only the topmost layer; screenshots in dark and light at 1440 and 375; the mobile sheet's pull-down is not used here (no drag), so list scrolling cannot dismiss it.
