"use client";

import { useState } from "react";
import { Balances, useBalances } from "./balances";
import { PriceChart } from "./chart";
import { Header } from "./header";
import { MarketInfo } from "./market-info";
import { OrderTicket } from "./order-ticket";
import { Trades } from "./trades";
import { useMarket } from "@/lib/use-market";
import { usePrice } from "@/lib/use-price";

type Tab = "balances" | "trades";

export function Terminal() {
  const p = usePrice();
  const m = useMarket();
  const bal = useBalances();
  const [tab, setTab] = useState<Tab>("balances");
  const first = p.history[0]?.value;
  const chg = p.quote && first ? ((p.quote - first) / first) * 100 : null;

  return (
    <div className="terminal">
      <Header />
      <div className="stats">
        <div className="pair"><b>NVDA</b><span className="muted">/ USDC</span></div>
        <div className="stat big"><span>Last</span><b className={chg !== null && chg < 0 ? "neg" : "pos"}>{p.quote ? p.quote.toFixed(2) : "—"}</b></div>
        <div className="stat"><span>Session change</span><b className={chg !== null && chg < 0 ? "neg" : "pos"}>{chg === null ? "—" : `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`}</b></div>
        <div className="stat"><span>Bid</span><b>{m.bid ? m.bid.toFixed(2) : "—"}</b></div>
        <div className="stat"><span>Ask</span><b>{m.ask ? m.ask.toFixed(2) : "—"}</b></div>
        <div className="stat"><span>Oracle</span><b>{m.oracle ? m.oracle.price.toFixed(2) : "—"}</b></div>
        <div className="stat"><span>Feed</span><b className={p.stale ? "warn" : "pos"}>{p.stale ? "STALE" : "LIVE"}</b></div>
      </div>
      <main className="layout">
        <section className="panel chart-panel"><PriceChart history={p.history} /></section>
        <aside className="col">
          <OrderTicket market={m} usdcBal={bal.usdc} nvdaBal={bal.nvda} />
          <MarketInfo m={m} indicative={p.quote} />
        </aside>
        <section className="panel bottom">
          <div className="seg tabs-b">
            {(["balances", "trades"] as Tab[]).map((t) => (
              <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          <div className="tab-body">
            {tab === "balances" && <Balances usdc={bal.usdc} nvda={bal.nvda} quote={p.quote} />}
            {tab === "trades" && <Trades />}
          </div>
        </section>
      </main>
    </div>
  );
}
