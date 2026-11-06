"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  BRIDGE_ETA,
  BRIDGE_STEP_ORDER,
  bridgeClient,
  chainsFor,
  emptySteps,
  type BridgeDirection,
  type BridgeLeg,
  type BridgeStep,
} from "@/lib/bridge";
import { SEPOLIA_MNVDA } from "@/lib/config";

const chainName = (id: number) => (id === 5042002 ? "Arc" : "Sepolia");
const LABEL: Record<string, string> = {
  approve: "Approve",
  burn: "Burn / lock",
  attestation: "Attestation",
  mint: "Mint / release",
};

function Timeline({ steps }: { steps: BridgeStep[] }) {
  return (
    <ol className="timeline">
      {steps.map((s) => (
        <li key={s.name} className={s.state}>
          <i />
          <span>{LABEL[s.name]}</span>
        </li>
      ))}
    </ol>
  );
}

export function BridgePanel() {
  const { address, isConnected } = useAccount();
  const [direction, setDirection] = useState<BridgeDirection>("sepolia-to-arc");
  const [amount, setAmount] = useState("1");
  const [legs, setLegs] = useState<BridgeLeg[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const { from, to } = chainsFor(direction);

  async function start() {
    if (!address) return;
    setErr(null);
    const leg: BridgeLeg = {
      id: `${Date.now()}`,
      request: { direction, amount, recipient: address },
      steps: emptySteps(),
      createdAt: Date.now(),
    };
    try {
      await bridgeClient.start(leg.request, (l) => setLegs((ls) => [l, ...ls.filter((x) => x.id !== l.id)]));
    } catch (e) {
      leg.steps = leg.steps.map((s, i) => (i === 0 ? { ...s, state: "error" } : s));
      setLegs((ls) => [leg, ...ls]);
      setErr(e instanceof Error ? e.message : "bridge failed");
    }
  }

  return (
    <section className="panel">
      <h2>Bridge (CCTP)</h2>
      <div className="row"><span className="muted">Token</span><span>{SEPOLIA_MNVDA.symbol} ↔ wNVDA</span></div>
      <div className="seg full">
        <button className={direction === "sepolia-to-arc" ? "on" : ""} onClick={() => setDirection("sepolia-to-arc")}>Sepolia → Arc</button>
        <button className={direction === "arc-to-sepolia" ? "on" : ""} onClick={() => setDirection("arc-to-sepolia")}>Arc → Sepolia</button>
      </div>
      <label className="field">
        <span>Amount</span>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <div className="row small muted"><span>{chainName(from)} → {chainName(to)}</span><span>Slow · forwarder · ETA {BRIDGE_ETA[direction]}</span></div>
      <button className="submit" disabled={!isConnected || !(Number(amount) > 0)} onClick={start}>
        {isConnected ? "Bridge" : "Connect wallet"}
      </button>
      {err && <div className="neg small note">{err}</div>}
      <div className="legs">
        {legs.length === 0 ? (
          <>
            <div className="small muted">Preview of a leg:</div>
            <Timeline steps={emptySteps()} />
          </>
        ) : (
          legs.map((l) => (
            <div key={l.id} className="leg">
              <div className="small">
                {l.request.amount} · {l.request.direction === "sepolia-to-arc" ? "Sepolia → Arc" : "Arc → Sepolia"}
              </div>
              <Timeline steps={BRIDGE_STEP_ORDER.map((n) => l.steps.find((s) => s.name === n)!)} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
