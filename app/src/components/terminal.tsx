"use client";

import { useMemo, useState } from "react";
import { Balances, useBalances } from "./balances";
import { PriceChart } from "./chart";
import { AssetSelector } from "./asset-selector";
import { BottomSheet } from "./bottom-sheet";
import { Header } from "./header";
import { MarketInfo } from "./market-info";
import { MarketTable } from "./market-table";
import { OrderTicket } from "./order-ticket";
import { Position, PositionBody } from "./position";
import { ProToggle, usePro } from "./pro-toggle";
import { Trades } from "./trades";
import { useMarket } from "@/lib/use-market";
import { usePrice } from "@/lib/use-price";
import { useMedia } from "@/lib/use-media";
import { DEFAULT_LIVE, type Asset, type LiveAsset } from "@/lib/assets";

const RANGES = { "1h": 3600, "24h": 86_400, "1w": 604_800, All: 0 } as const;
type Range = keyof typeof RANGES;

export function Terminal() {
  const [asset, setAsset] = useState<LiveAsset>(DEFAULT_LIVE);
  const p = usePrice(asset.live.priceSymbol);
  const m = useMarket(asset);
  const bal = useBalances(asset);
  const sym = asset.live.token.symbol;
  const [range, setRange] = useState<Range>("All");
  const mobile = useMedia("(max-width: 767px)");
  const [proPref, setPro] = usePro();
  const pro = proPref && !mobile; // Pro is desktop only
  const [slip, setSlip] = useState(100);
  const [tab, setTab] = useState<"balances" | "trades">("balances");
  // Provider chosen per asset (ADR 0026). Unset = the ticket follows the best quote.
  const [picked, setPicked] = useState<Record<string, string>>({});
  const pickProps = { selectedProviderId: picked[asset.ticker], onProviderChange: (id: string) => setPicked((s) => ({ ...s, [asset.ticker]: id })) };
  const [sheet, setSheet] = useState<"buy" | "sell" | null>(null);

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
      <Header extra={!mobile && <ProToggle pro={proPref} onChange={setPro} />} />
      <main className="trade">
        <section className="card chart-card">
          <div className="pair-head">
            <h1><AssetSelector asset={asset} onSelect={(a: Asset) => { if (a.live) setAsset(a as LiveAsset); }} /></h1>
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
          {pro && (
            <div className="pro-stats">
              <div><span>Bid</span><b>{m.bid ? m.bid.toFixed(2) : "—"}</b></div>
              <div><span>Ask</span><b>{m.ask ? m.ask.toFixed(2) : "—"}</b></div>
              <div><span>Oracle</span><b>{m.oracle ? m.oracle.price.toFixed(2) : "—"}</b></div>
              <div><span>Oracle age</span><b className={m.oracle?.stale ? "warn" : ""}>{m.oracle ? `${m.oracle.age < 3600 ? Math.round(m.oracle.age / 60) + " min" : Math.round(m.oracle.age / 3600) + " h"}` : "—"}</b></div>
              <div><span>Fee tier (spread)</span><b>{m.spreadBps !== null ? `${m.spreadBps / 100}%` : "—"}</b></div>
              <div><span>Feed</span><b className={p.stale ? "warn" : "pos"}>{p.stale ? "STALE" : "LIVE"}</b></div>
            </div>
          )}
          <div className="chart-slot"><PriceChart history={view} variant={pro ? "candles" : "line"} ticker={asset.ticker} /></div>
          {mobile ? (
            <details className="mdetails"><summary>Market details</summary><MarketTable m={m} stale={p.stale} /></details>
          ) : !pro ? (
            <MarketTable m={m} stale={p.stale} />
          ) : null}
          {pro && (
            <div className="pro-tabs">
              <div className="seg">
                {(["balances", "trades"] as const).map((x) => (<button key={x} className={tab === x ? "on" : ""} onClick={() => setTab(x)}>{x[0].toUpperCase() + x.slice(1)}</button>))}
              </div>
              <div className="pro-tab-body">{tab === "balances" ? <Balances usdc={bal.usdc} nvda={bal.nvda} quote={p.quote} symbol={sym} /> : <Trades asset={asset} />}</div>
            </div>
          )}
        </section>
        <aside className="side">
          {mobile && <Position usdc={bal.usdc} nvda={bal.nvda} quote={p.quote} symbol={sym} />}
          {!mobile && <OrderTicket key={asset.ticker} asset={asset} market={m} usdcBal={bal.usdc} nvdaBal={bal.nvda} {...pickProps} slippageBps={slip} onSlippage={pro ? setSlip : undefined} summaryHead={<PositionBody usdc={bal.usdc} nvda={bal.nvda} quote={p.quote} symbol={sym} />} />}
          {pro && <MarketInfo m={m} indicative={p.quote} symbol={sym} />}
        </aside>
      </main>
      {mobile && (
        <>
          <div className="buybar">
            <button className="buy" onClick={() => setSheet("buy")}>Buy</button>
            <button className="sell" onClick={() => setSheet("sell")}>Sell</button>
          </div>
          {sheet && (
            <BottomSheet label={`${sheet} ${asset.ticker}`} onClose={() => setSheet(null)}>
              <OrderTicket key={sheet + asset.ticker} asset={asset} initialSide={sheet} market={m} usdcBal={bal.usdc} nvdaBal={bal.nvda} {...pickProps} onDone={() => setSheet(null)} />
            </BottomSheet>
          )}
        </>
      )}
    </div>
  );
}
