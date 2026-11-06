import type { Address } from "viem";
import { WNVDA, WTSLA } from "./config";
import { ACTIVE } from "./contracts";

/**
 * Asset registry for the selector and the trade page (ADR 0022, ADR 0024).
 * Live assets carry their own market, oracle and wrapped token on Arc. Planned rows are ticker-only,
 * labelled "Coming soon", not selectable. They are a roadmap claim, so keep that list short and fixed.
 */
export interface LiveConfig {
  /** Wrapped token on Arc (18 decimals). */
  token: { address: Address; symbol: string; decimals: 18 };
  /** Symbol the price service understands (`/api/price?symbol=`). */
  priceSymbol: string;
  market: Address;
  oracle: Address;
  marketDeployBlock: bigint;
}

export interface Asset {
  ticker: string;
  /** Header label, e.g. "NVDA / USDC". */
  pair: string;
  /** Row label. Live assets are mock tokens, never the company name. */
  label: string;
  status: "live" | "planned";
  live?: LiveConfig;
}

export const ASSETS: Asset[] = [
  {
    ticker: "NVDA",
    pair: "NVDA / USDC",
    label: "Mock NVDA token (wNVDA)",
    status: "live",
    live: { token: WNVDA, priceSymbol: "NVDA", market: ACTIVE.nvda.market, oracle: ACTIVE.nvda.oracle, marketDeployBlock: ACTIVE.nvda.marketDeployBlock },
  },
  {
    ticker: "TSLA",
    pair: "TSLA / USDC",
    label: "Mock TSLA token (wTSLA)",
    status: "live",
    live: {
      token: WTSLA,
      priceSymbol: "TSLA",
      market: ACTIVE.tsla.market,
      oracle: ACTIVE.tsla.oracle,
      marketDeployBlock: ACTIVE.tsla.marketDeployBlock,
    },
  },
  { ticker: "AAPL", pair: "AAPL / USDC", label: "Coming soon", status: "planned" },
  { ticker: "MSFT", pair: "MSFT / USDC", label: "Coming soon", status: "planned" },
  { ticker: "AMZN", pair: "AMZN / USDC", label: "Coming soon", status: "planned" },
];

export const DEFAULT_ASSET = ASSETS[0];

/** A live asset's config. Only live assets reach the trade components. */
export type LiveAsset = Asset & { live: LiveConfig };
export const LIVE_ASSETS = ASSETS.filter((a): a is LiveAsset => a.status === "live" && !!a.live);
export const DEFAULT_LIVE = LIVE_ASSETS[0];
