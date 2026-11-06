"use client";

import { Balances } from "./balances";
import { BridgePanel } from "./bridge-panel";
import { PriceChart } from "./chart";
import { Header } from "./header";
import { OrderTicket } from "./order-ticket";
import { usePrice } from "@/lib/use-price";

function age(ms: number | null, now: number) {
  if (ms === null) return "—";
  const s = Math.max(0, Math.round((now - ms) / 1000));
  return s < 90 ? `${s}s ago` : `${Math.round(s / 60)}m ago`;
}

export function Terminal() {
  const p = usePrice();
  const now = Date.now();
  return (
    <div className="terminal">
      <Header />
      <main className="grid">
        <section className="panel chart-panel">
          <div className="chart-head">
            <b>NVDA</b>
            <span className="price">{p.quote ? `$${p.quote.toFixed(2)}` : "—"}</span>
            <span className={`badge ${p.stale ? "warn" : "ok"}`}>
              {p.stale ? "STALE" : "LIVE"}
            </span>
            <span className="muted small">
              fetched {age(p.fetchedAt, now)} · indicative, xstocks.fi
            </span>
            {p.error && <span className="neg small">{p.error}</span>}
          </div>
          <PriceChart history={p.history} />
        </section>
        <div className="side">
          <OrderTicket quote={p.quote} stale={p.stale} />
          <Balances quote={p.quote} />
        </div>
        <div className="side">
          <BridgePanel />
        </div>
      </main>
    </div>
  );
}
