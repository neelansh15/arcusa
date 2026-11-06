# 0027. Multiple providers per stock and best-price comparison

- Status: accepted
- Date: 2026-11-07
- Deciders: user (request relayed by the Presentation Prep session on 2026-11-07), laptop

## Context
A stock can have more than one provider (an issuer's token and market). Today each asset has one. ADR 0026 covers the selector UI. This ADR covers the data and logic behind it: the registry, comparing quotes, which provider is selected, and what can be executed.

## Decision
- **Registry.** `app/src/lib/providers.ts` exports `PROVIDERS` and `providersFor(ticker)`. Today it holds one provider per live asset (NVDA, TSLA), built from the existing market config. Types (`Provider`, `ProviderQuote`) live in `provider-rank.ts` (no runtime imports, so they are unit-testable) and are re-exported from `providers.ts`.
- **Demo flag.** `NEXT_PUBLIC_DEMO_PROVIDERS=1` adds two extra TSLA providers, labelled TSLAon and TSLAx. They are `simulated: true` with no market. Off by default, so nothing visible changes. The names are our own test tokens and only amend the wording of ADR 0016 and ADR 0022 (which say no provider names); they are not real issuers' products.
- **Quotes.** `useProviderQuotes(asset, side, amountIn)` debounces typing by 300 ms. A provider with a market gets the real on-chain `quoteBuy`/`quoteSell`. A simulated provider is calculated from the asset's oracle price: `price = oracle * (1 + premiumBps)`, then `* (1 + spreadBps)` for a buy and `* (1 - spreadBps)` for a sell. These are calculations, not separate markets.
- **Best.** Most tokens out for a buy, most USDC out for a sell. Only `ok` quotes compete; if none is ok, `stale` ones do; `unavailable` never wins. Ties go to a tradable provider, then registry order. With one provider that provider is always best, so the single-provider path is unchanged.
- **Status.** `stale` when the oracle is older than its `maxStaleness` (the oracle's own `stale` flag). `unavailable` when the oracle or the quote read fails with a fresh oracle.
- **Selection.** Selected provider is state per asset on the trade page. Unset means "follow the best". The ticket executes only if the selected provider has a market. A quote-only provider disables the button, labelled "Quote only", with the reason "Quote only. This provider has no market yet."
- **One provider per order.** An order goes to a single provider. No splitting across providers.

## Consequences
- With one provider nothing new appears: the ticket reads the same market it did before.
- The ticket takes an optional `providerPicker` render prop (ADR 0026's component mounts there) and `selectedProviderId` / `onProviderChange`.
- Simulated quotes can show a better price than the real market. That is why they are never tradable and are labelled quote only.
- Tests: `app/src/lib/provider-rank.test.ts` (node:test, `pnpm --filter @arcusa/app test`). The hook and the ticket wiring are not unit-tested.
