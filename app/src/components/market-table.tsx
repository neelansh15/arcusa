"use client";

import { SESSIONS } from "@/lib/market";
import type { MarketState } from "@/lib/use-market";

const f = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

/** Compact market summary for the simple view. Not an order book: the market quotes one oracle-priced bid and ask. */
export function MarketTable({ m, stale }: { m: MarketState; stale: boolean }) {
  const oracleStale = m.oracle?.stale ?? false;
  const spread = m.spreadBps !== null ? `${m.spreadBps / 100}% spread` : "—";
  return (
    <div className="mtable" role="table" aria-label="Market">
      <div className="mrow head" role="row"><span>Market</span><span>Price</span><span>Status</span></div>
      <div className="mrow" role="row"><span>Oracle</span><b>{f(m.oracle?.price)}</b><span className={`tag ${oracleStale ? "warn" : ""}`}>{m.oracle ? SESSIONS[m.oracle.session] : "—"}{oracleStale ? " · stale" : ""}</span></div>
      <div className="mrow" role="row"><span>Bid (you sell)</span><b>{f(m.bid)}</b><span className="tag">{spread}</span></div>
      <div className="mrow" role="row"><span>Ask (you buy)</span><b>{f(m.ask)}</b><span className="tag">{spread}</span></div>
      <div className="mrow" role="row"><span>Price feed</span><b>{stale ? "Stale" : "Live"}</b><span className={`tag ${stale ? "warn" : "ok"}`}>{stale ? "Delayed" : "xstocks.fi"}</span></div>
    </div>
  );
}
