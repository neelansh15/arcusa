"use client";

import Link from "next/link";
import { BridgePanel } from "@/components/bridge-panel";
import { Header } from "@/components/header";

export default function BridgePage() {
  return (
    <div className="terminal">
      <Header />
      <main className="bridge-main">
        <div className="bridge-wrap">
          <div className="bridge-intro">
            <h1>Bridge</h1>
            <p>
              For liquidity providers moving NVDA inventory between Ethereum Sepolia and Arc to seed the market.
              Traders only need USDC on Arc and never have to bridge.
            </p>
            <p className="bridge-links">
              <Link href="/trade">Back to trading</Link>
            </p>
          </div>
          <BridgePanel />
        </div>
      </main>
    </div>
  );
}
