import { LIVE_ASSETS } from "./assets";
import type { Provider } from "./provider-rank";

export type { Provider, ProviderQuote, Side } from "./provider-rank";

/**
 * Provider registry (ADR 0026). Today every live asset has exactly one provider: its own market.
 * With NEXT_PUBLIC_DEMO_PROVIDERS=1, TSLA gets two extra simulated providers (our own test tokens, quotes
 * calculated from the oracle, no market) so the comparison and the selector can be seen and tested.
 */
const real: Provider[] = LIVE_ASSETS.map((a) => ({
  id: `${a.ticker.toLowerCase()}-arcusa`,
  assetTicker: a.ticker,
  label: a.live.token.symbol,
  tokenSymbol: a.live.token.symbol,
  premiumBps: 0,
  spreadBps: 0, // the real market quotes its own live spread
  market: { oracle: a.live.oracle, market: a.live.market, token: a.live.token.address },
  simulated: false,
}));

const demo: Provider[] =
  process.env.NEXT_PUBLIC_DEMO_PROVIDERS === "1"
    ? [
        { id: "tsla-on", assetTicker: "TSLA", label: "TSLAon", tokenSymbol: "TSLAon", premiumBps: 8, spreadBps: 30, simulated: true },
        { id: "tsla-x", assetTicker: "TSLA", label: "TSLAx", tokenSymbol: "TSLAx", premiumBps: -5, spreadBps: 45, simulated: true },
      ]
    : [];

export const PROVIDERS: Provider[] = [...real, ...demo];

export function providersFor(ticker: string): Provider[] {
  return PROVIDERS.filter((p) => p.assetTicker === ticker);
}
