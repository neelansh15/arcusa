# 0026. Provider selector: choose between providers of the same stock, shown only when there are two or more

- Status: accepted
- Date: 2026-11-07
- Deciders: user (request relayed by the Presentation Prep session on 2026-11-07), laptop

## Context
A stock can have more than one provider (issuer token and market). Today every asset has exactly one. The FE session is adding quote data per provider (`app/src/lib/providers.ts`, `use-provider-quotes.ts`) and the ticket wiring. This ADR covers only the selection UI, in the style of the asset selector (ADR 0022) and the simple-by-default rule (ADR 0019).

## Decision
- **Component.** `app/src/components/provider-selector.tsx`. It returns `null` when fewer than two providers are given, so with one provider today nothing renders and nothing changes visually.
- **Control (in the order ticket, near Pay and Receive).** One button: "Provider: <label>" with a small chevron, same hover tint (`--hover`) and focus ring as the asset selector, plus a "Best price" pill when the selected provider is the best. Mounting it in the ticket is the FE session's wiring; this component takes plain props.
- **Modal.** Reuses `Modal` (ADR 0022: centered dialog on desktop, bottom sheet under 768px by CSS). A list of providers, single select.
  - Simple default row: label and token symbol, "you receive" amount, a delta pill versus the best (the best row gets the lime "Best price" pill).
  - Pro mode adds effective price and spread (ADR 0019).
  - Rows are real buttons with an accessible name such as "TSLAon, receive 4.82 tokens, best price"; the selected row has a ring and a check (`aria-pressed`). Tab, Enter and Space only.
  - A provider that is not tradable shows a "Quote only" pill and stays selectable; the CTA explains why it is disabled (FE).
- **States.** Loading skeleton, stale (pill with age, selectable), unavailable (greyed, `aria-disabled`, not selectable), empty amount ("Enter an amount to compare"), error (message and retry).
- **Copy.** "Best among these providers", never "best price in the market". The ADR 0016 line stays visible in the modal: "Testnet demo. Not a security, no real shares, no real value."
- **Styling.** Theme tokens only, both themes, tabular numbers, no hex colours.
- **Types.** Fields of `ProviderQuote` as agreed with the FE session (`providerId`, `label`, `tokenSymbol`, `amountOut`, `effectivePrice`, `spreadBps`, `deltaVsBestPct`, `isBest`, `tradable`, `status`, `updatedAt`). Until `providers.ts` lands, a local mirror in `provider-selector-types.ts` is used and swapped for the import.
- **Verification without the FE flag.** A development-only page `/dev/providers` (404 in production) renders the selector from fixtures in every state, so the UI can be screenshotted before the FE wiring and the `NEXT_PUBLIC_DEMO_PROVIDERS` flag exist.

## Consequences
- No visual change with one provider.
- The FE session must mount `ProviderSelector` in the ticket and pass quotes, selection and the Pro flag.
- Not verified at the time of writing: the real `providers.ts` types, how amounts are typed, and the ticket mount.
