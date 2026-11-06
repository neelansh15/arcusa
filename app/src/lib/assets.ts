/**
 * Asset registry for the selector (ADR 0022). Display only for now: the market, oracle and ticket are still single-asset (ADR 0018).
 * Planned rows are ticker-only, labelled "Coming soon", not selectable. They are a roadmap claim, so keep this list short and fixed.
 */
export interface Asset {
  ticker: string;
  /** Header label, e.g. "NVDA / USDC". */
  pair: string;
  /** Row label. The live asset is a mock token, never "NVIDIA". */
  label: string;
  status: "live" | "planned";
}

export const ASSETS: Asset[] = [
  { ticker: "NVDA", pair: "NVDA / USDC", label: "Mock NVDA token (wNVDA)", status: "live" },
  { ticker: "AAPL", pair: "AAPL / USDC", label: "Coming soon", status: "planned" },
  { ticker: "TSLA", pair: "TSLA / USDC", label: "Coming soon", status: "planned" },
  { ticker: "MSFT", pair: "MSFT / USDC", label: "Coming soon", status: "planned" },
  { ticker: "AMZN", pair: "AMZN / USDC", label: "Coming soon", status: "planned" },
];

export const DEFAULT_ASSET = ASSETS[0];
