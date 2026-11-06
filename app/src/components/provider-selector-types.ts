/**
 * Local mirror of the quote shape agreed with the FE session (ADR 0026).
 * Swap this import for `@/lib/providers` once that file lands; the field names are the same.
 */
export type ProviderStatus = "ok" | "stale" | "unavailable";

export interface ProviderQuote {
  providerId: string;
  label: string;
  tokenSymbol: string;
  /** What the user receives for the entered amount (tokens on a buy, USDC on a sell). */
  amountOut: number;
  /** USDC per token actually paid or received, spread included. */
  effectivePrice: number;
  spreadBps: number;
  /** Percent versus the best quote; 0 for the best, negative when worse. */
  deltaVsBestPct: number;
  isBest: boolean;
  tradable: boolean;
  status: ProviderStatus;
  /** Quote time: unix ms, an ISO string or a Date. */
  updatedAt: number | string | Date;
}
