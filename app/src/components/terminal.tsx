"use client";

import { useMemo, useState } from "react";
import { Balances, useBalances } from "./balances";
import { PriceChart } from "./chart";
import { Header } from "./header";
import { MarketTable } from "./market-table";
import { OrderTicket } from "./order-ticket";
import { useMarket } from "@/lib/use-market";
import { usePrice } from "@/lib/use-price";

const RANGES = { "1h": 3600, "24h": 86_400, "1w": 604_800, All: 0 } as const;
type Range = keyof typeof RANGES;

export function Terminal() {
  const p = usePrice();
  const m = useMarket();
  const bal = useBalances();
  const [range, setRange] = useState<Range>("All");

  // A range chip is enabled only when the price history actually spans it; no fabricated history.
  const span = p.history.length > 1 ? p.history[p.history.length - 1].time - p.history[0].time : 0;
  const enabled = (r: Range) => r === "All" || span >= RANGES[r] * 0.9;
  const active: Range = enabled(range) ? range : "All";

  const view = useMemo(() => {
    if (!p.history.length) return [];
    const last = p.history[p.history.length - 1].time;
    return active === "All" ? p.history : p.history.filter((h) => h.time >= last - RANGES[active]);
  }, [p.history, active]);

  const first = view[0]?.value;
  const chg = p.quote && first ? ((p.quote - first) / first) * 100 : null;
  const down = chg !== null && chg < 0;

  return (
    <div className="trade-app">
      <Header />
      <main className="trade">
        <section className="card chart-card">
          <div className="pair-head">
            <div className="pair-icons"><i className="ic nvda">N</i><i className="ic usdc">$</i></div>
            <h1>NVDA <span className="muted">/ USDC</span></h1>
          </div>
          <div className="price-row">
            <span className="price">${p.quote ? p.quote.toFixed(2) : "—"}</span>
            {chg !== null && <span className={`pill ${down ? "down" : "up"}`}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}%{active === "All" ? " session" : ` ${active}`}</span>}
            <div className="chips" role="tablist" aria-label="Range">
              {(Object.keys(RANGES) as Range[]).map((r) => (
                <button key={r} className={active === r ? "on" : ""} disabled={!enabled(r)} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className="chart-slot"><PriceChart history={view} /></div>
          <MarketTable m={m} stale={p.stale} />
        </section>
        <aside className="side">
          <OrderTicket market={m} usdcBal={bal.usdc} nvdaBal={bal.nvda} />
          <Balances usdc={bal.usdc} nvda={bal.nvda} quote={p.quote} />
        </aside>
      </main>
    </div>
  );
}
