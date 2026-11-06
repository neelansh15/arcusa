"use client";

import { BridgePanel } from "@/components/bridge-panel";
import { Header } from "@/components/header";

export default function BridgePage() {
  return (
    <div className="terminal">
      <Header />
      <main style={{ flex: 1, overflowY: "auto" }}>
        <section className="panel" style={{ maxWidth: 640, margin: "32px auto", width: "100%" }}>
          <h2>Bridge · liquidity providers</h2>
          <p className="muted small">Move NVDA inventory between Sepolia and Arc to seed the market. Traders only need USDC on Arc.</p>
          <BridgePanel />
        </section>
      </main>
    </div>
  );
}
