"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { ProviderSelector } from "@/components/provider-selector";
import type { ProviderQuote } from "@/lib/providers";

const now = Date.now();
const base: ProviderQuote[] = [
  { providerId: "tslaon", label: "TSLAon", tokenSymbol: "wTSLA", amountOut: "4.8213", effectivePrice: "207.40", spreadBps: 30, deltaVsBestPct: 0, isBest: true, tradable: true, status: "ok", updatedAt: now - 4000 },
  { providerId: "tslax", label: "TSLAx", tokenSymbol: "wTSLAx", amountOut: "4.7954", effectivePrice: "208.50", spreadBps: 45, deltaVsBestPct: -0.54, isBest: false, tradable: true, status: "ok", updatedAt: now - 9000 },
  { providerId: "tslab", label: "TSLAb", tokenSymbol: "wTSLAb", amountOut: "4.7611", effectivePrice: "210.00", spreadBps: 90, deltaVsBestPct: -1.25, isBest: false, tradable: true, status: "ok", updatedAt: now - 15000 },
];

type Scenario = "one" | "ok" | "stale" | "unavailable" | "quoteonly" | "loading" | "empty" | "error" | "bestnotselected";
const SCENARIOS: Scenario[] = ["one", "ok", "bestnotselected", "stale", "unavailable", "quoteonly", "loading", "empty", "error"];

export function ProviderHarness() {
  const [scenario, setScenario] = useState<Scenario>("ok");
  const [selected, setSelected] = useState("tslaon");
  const [pro, setPro] = useState(false);
  const [sell, setSell] = useState(false);

  let providers = base;
  if (scenario === "one") providers = base.slice(0, 1);
  if (scenario === "stale") providers = base.map((p, i) => (i === 1 ? { ...p, status: "stale" as const, updatedAt: now - 5 * 60_000 } : p));
  if (scenario === "unavailable") providers = base.map((p, i) => (i === 2 ? { ...p, status: "unavailable" as const } : p));
  if (scenario === "quoteonly") providers = base.map((p, i) => (i === 1 ? { ...p, tradable: false } : p));
  const sel = scenario === "bestnotselected" ? "tslax" : selected;

  return (
    <div className="trade-app">
      <Header />
      <main style={{ maxWidth: 520, margin: "24px auto", padding: "0 16px", display: "grid", gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <b>Dev harness (ADR 0026)</b>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {SCENARIOS.map((s) => (
              <button key={s} className={scenario === s ? "primary" : ""} onClick={() => setScenario(s)}>{s}</button>
            ))}
          </div>
          <label style={{ display: "inline-flex", gap: 6, marginTop: 10 }}><input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} /> Pro</label>{" "}
          <label style={{ display: "inline-flex", gap: 6, marginTop: 10 }}><input type="checkbox" checked={sell} onChange={(e) => setSell(e.target.checked)} /> Sell side</label>
        </div>
        <div className="card ticket" style={{ padding: 16 }}>
          <div className="tk-card"><div className="tk-top"><span>You pay</span></div><div className="tk-main"><output className="tk-out">5</output></div></div>
          <div style={{ margin: "10px 0" }}>
            <ProviderSelector
              providers={providers}
              selectedId={sel}
              onSelect={setSelected}
              loading={scenario === "loading"}
              error={scenario === "error" ? "Could not load quotes. Check your connection." : null}
              onRetry={() => setScenario("ok")}
              amountEmpty={scenario === "empty"}
              receiveSymbol={sell ? "USDC" : "wTSLA"}
              pro={pro}
            />
            {scenario === "one" && <p className="muted small">One provider: the selector renders nothing (this line is the harness, not the ticket).</p>}
          </div>
          <div className="tk-card"><div className="tk-top"><span>You receive</span></div><div className="tk-main"><output className="tk-out">0.0267</output></div></div>
        </div>
      </main>
    </div>
  );
}
