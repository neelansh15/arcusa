// Pure types and ranking for multi-provider quotes (ADR 0026). No runtime imports, so the unit tests run under plain node.
import type { Address } from "viem";

export type Side = "buy" | "sell";

export type Provider = {
  id: string;
  assetTicker: string;
  label: string;
  tokenSymbol: string;
  /** Simulated providers only: premium over the oracle price, in basis points. */
  premiumBps: number;
  /** Simulated providers only: spread on top of the premium. Real providers quote their own live spread. */
  spreadBps: number;
  market?: { oracle: Address; market: Address; token: Address };
  simulated: boolean;
};

export type ProviderQuote = {
  providerId: string;
  label: string;
  tokenSymbol: string;
  /** Tokens out for a buy, USDC out for a sell. Decimal string. */
  amountOut: string;
  /** USDC per token, spread included. */
  effectivePrice: string;
  spreadBps: number;
  /** 0 for the best quote, negative for worse ones (percent of the best amount out). */
  deltaVsBestPct: number;
  isBest: boolean;
  /** True only when the provider has a market to execute against. */
  tradable: boolean;
  status: "ok" | "stale" | "unavailable";
  updatedAt: number;
};

export type RawQuote = {
  provider: Provider;
  out: number;
  price: number;
  spreadBps: number;
  status: ProviderQuote["status"];
  updatedAt: number;
};

/** Quote for a simulated provider, calculated from the oracle price (no separate market). */
export function simulateQuote(p: Pick<Provider, "premiumBps" | "spreadBps">, side: Side, amountIn: number, oraclePrice: number): { out: number; price: number } {
  const base = oraclePrice * (1 + p.premiumBps / 10_000);
  const price = side === "buy" ? base * (1 + p.spreadBps / 10_000) : base * (1 - p.spreadBps / 10_000);
  if (!(price > 0) || !(amountIn > 0)) return { out: 0, price: price > 0 ? price : 0 };
  return { out: side === "buy" ? amountIn / price : amountIn * price, price };
}

/**
 * Rank quotes and mark the best. Best = most tokens out for a buy, most USDC out for a sell, i.e. the largest `out`.
 * Only "ok" quotes compete; if none is ok, stale ones do; unavailable ones never win.
 * Ties go to a tradable provider, then to registry order. With a single provider that provider is always best,
 * so the one-provider path behaves exactly as before.
 */
export function rankQuotes(raw: RawQuote[], side: Side): { quotes: ProviderQuote[]; best: ProviderQuote | undefined } {
  const dp = side === "buy" ? 6 : 4;
  const pool = raw.some((r) => r.status === "ok") ? raw.filter((r) => r.status === "ok") : raw.filter((r) => r.status === "stale");
  let winner: RawQuote | undefined;
  for (const r of pool) {
    if (!winner || r.out > winner.out || (r.out === winner.out && !!r.provider.market && !winner.provider.market)) winner = r;
  }
  if (!winner && raw.length === 1) winner = raw[0];
  const bestOut = winner?.out ?? 0;
  const quotes = raw.map<ProviderQuote>((r) => ({
    providerId: r.provider.id,
    label: r.provider.label,
    tokenSymbol: r.provider.tokenSymbol,
    amountOut: r.out.toFixed(dp),
    effectivePrice: r.price.toFixed(4),
    spreadBps: r.spreadBps,
    deltaVsBestPct: r.status === "unavailable" || !(bestOut > 0) ? 0 : ((r.out - bestOut) / bestOut) * 100,
    isBest: r === winner,
    tradable: !!r.provider.market,
    status: r.status,
    updatedAt: r.updatedAt,
  }));
  return { quotes, best: quotes.find((q) => q.isBest) };
}

/**
 * The provider to select by default: the best tradable one (so the user can trade at once), falling back to the best
 * overall only when none is tradable. "Best" and its pill stay on the overall winner, so the comparison is still visible.
 */
export function defaultQuote(quotes: ProviderQuote[], best: ProviderQuote | undefined): ProviderQuote | undefined {
  const pool = quotes.some((q) => q.tradable && q.status === "ok") ? quotes.filter((q) => q.tradable && q.status === "ok") : quotes.filter((q) => q.tradable && q.status === "stale");
  let pick: ProviderQuote | undefined;
  for (const q of pool) if (!pick || Number(q.amountOut) > Number(pick.amountOut)) pick = q;
  return pick ?? best;
}

export type LastGood = { raw: RawQuote; at: number };

/**
 * Keep the last good quote for a short time when a single read fails (for example an RPC 429), so a tradable provider
 * does not flip to Unavailable for one bad poll. Only "unavailable" results are replaced, and only within `ttlMs`.
 */
export function holdLastGood(next: RawQuote, last: LastGood | undefined, now: number, ttlMs: number): RawQuote {
  if (next.status !== "unavailable" || !last || last.raw.status === "unavailable" || now - last.at > ttlMs) return next;
  return last.raw;
}
