"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { INVENTORY_MARKET_ADDRESS } from "@/lib/config";

export function OrderTicket({ quote, stale }: { quote: number | null; stale: boolean }) {
  const { isConnected } = useAccount();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [usdc, setUsdc] = useState("100");
  const [note, setNote] = useState<string | null>(null);

  const amount = Number(usdc);
  const valid = Number.isFinite(amount) && amount > 0;
  const est = valid && quote ? amount / quote : null;

  function submit() {
    // TODO(contract): call InventoryMarket.buy / sell on Arc once deployed (ADR 0014).
    // Needs: USDC approve (6 decimals), min-out from oracle price + spread, 20 Gwei maxFeePerGas floor.
    setNote(
      INVENTORY_MARKET_ADDRESS
        ? "Contract call not implemented yet."
        : "UI only: the Arc market contract is not deployed yet. No transaction was sent.",
    );
  }

  return (
    <section className="panel">
      <h2>Order ticket</h2>
      <div className="seg full">
        <button className={side === "buy" ? "on buy" : ""} onClick={() => setSide("buy")}>Buy</button>
        <button className={side === "sell" ? "on sell" : ""} onClick={() => setSide("sell")}>Sell</button>
      </div>
      <div className="seg full" style={{ marginTop: 8 }}>
        <button className="on" disabled>Market</button>
      </div>
      <label className="field">
        <span>{side === "buy" ? "Pay (USDC)" : "Receive (USDC)"}</span>
        <input inputMode="decimal" value={usdc} onChange={(e) => setUsdc(e.target.value)} />
      </label>
      <div className="row"><span className="muted">Indicative price</span><span>{quote ? `$${quote.toFixed(2)}` : "—"}</span></div>
      <div className="row"><span className="muted">Est. {side === "buy" ? "receive" : "sell"} NVDA</span><span>{est ? est.toFixed(6) : "—"}</span></div>
      <div className="row"><span className="muted">Spread (off-hours demo)</span><span>200 bps</span></div>
      {stale && <div className="warn small">Price is stale.</div>}
      <button className={`submit ${side}`} disabled={!valid || !isConnected || stale} onClick={submit}>
        {isConnected ? `${side === "buy" ? "Buy" : "Sell"} NVDA` : "Connect wallet"}
      </button>
      {note && <div className="small muted note">{note}</div>}
    </section>
  );
}
