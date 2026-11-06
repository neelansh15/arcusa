"use client";

import { SESSIONS } from "@/lib/market";
import type { MarketState } from "@/lib/use-market";

const f = (n: number | null | undefined, d = 2) => (n === null || n === undefined ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }));

export function MarketInfo({ m, indicative, symbol }: { m: MarketState; indicative: number | null; symbol: string }) {
  const mid = m.bid && m.ask ? (m.bid + m.ask) / 2 : null;
  return (
    <section className="panel">
      <h2>Market</h2>
      <div className="quote">
        <div className="side-q ask"><span>Ask</span><b>{f(m.ask)}</b></div>
        <div className="mid">{f(mid)}<small>{m.spreadBps !== null ? ` · ${m.spreadBps / 100}% spread` : ""}</small></div>
        <div className="side-q bid"><span>Bid</span><b>{f(m.bid)}</b></div>
      </div>
      <div className="kv"><span>Oracle price</span><span>${f(m.oracle?.price)}</span></div>
      <div className="kv"><span>Oracle age</span><span className={m.oracle?.stale ? "warn" : ""}>{m.oracle ? `${m.oracle.age < 3600 ? Math.round(m.oracle.age / 60) + " min" : Math.round(m.oracle.age / 3600) + " h"}${m.oracle.stale ? " (stale)" : ""}` : "—"}</span></div>
      <div className="kv"><span>Session</span><span>{m.oracle ? SESSIONS[m.oracle.session] : "—"}</span></div>
      <div className="kv"><span>Live indicative</span><span>${f(indicative)}</span></div>
      <h2 style={{ marginTop: 12 }}>Inventory</h2>
      <div className="kv"><span>{symbol}</span><span>{f(m.inventory?.wnvda, 4)}</span></div>
      <div className="kv"><span>USDC</span><span>{f(m.inventory?.usdc)}</span></div>
      <div className="kv"><span>Net USDC flow</span><span>{f(m.inventory?.flow)}</span></div>
      <div className="kv"><span>Status</span><span className={m.inventory?.paused ? "neg" : "pos"}>{m.inventory ? (m.inventory.paused ? "Paused" : "Active") : "—"}</span></div>
    </section>
  );
}
