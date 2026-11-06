"use client";

import { useEffect, useRef, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useConnection, useReadContract } from "wagmi";
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
import { ARC_CHAIN_ID, SEPOLIA_CHAIN_ID, SEPOLIA_MNVDA, WNVDA, explorerTx } from "@/lib/config";

const chainName = (id: number) => (id === ARC_CHAIN_ID ? "Arc" : "Sepolia");
const LABEL: Record<string, string> = {
  approve: "Approve",
  burn: "Burn / lock",
  attestation: "Attestation",
  mint: "Mint / release",
};
const STATE_TEXT: Record<string, string> = {
  pending: "Waiting",
  active: "In progress",
  done: "Done",
  error: "Failed",
};
const DIRECTION_TEXT: Record<BridgeDirection, string> = {
  "sepolia-to-arc": "Sepolia → Arc",
  "arc-to-sepolia": "Arc → Sepolia",
};

const upsert = (ls: BridgeLeg[], l: BridgeLeg) =>
  ls.some((x) => x.id === l.id) ? ls.map((x) => (x.id === l.id ? l : x)) : [l, ...ls];

const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-6)}`;

function Timeline({ steps }: { steps: BridgeStep[] }) {
  return (
    <ol className="bridge-steps">
      {steps.map((s) => (
        <li key={s.name} className={s.state}>
          <i />
          <div className="bridge-step-body">
            <span className="bridge-step-name">{LABEL[s.name]}</span>
            <span className="bridge-step-meta">
              {STATE_TEXT[s.state]}
              {s.txHash && s.chainId !== undefined && (
                <>
                  {" · "}
                  <a href={explorerTx(s.chainId, s.txHash)} target="_blank" rel="noreferrer">
                    {short(s.txHash)}
                  </a>
                </>
              )}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function BridgePanel() {
  const { address, isConnected } = useConnection();
  const [direction, setDirection] = useState<BridgeDirection>("sepolia-to-arc");
  const [amount, setAmount] = useState("1");
  const [legs, setLegs] = useState<BridgeLeg[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resumed = useRef(new Set<string>());
  const { from, to } = chainsFor(direction);

  // Read-only balance of the token on the source chain, for the max hint.
  const token = direction === "sepolia-to-arc" ? SEPOLIA_MNVDA.address : WNVDA.address;
  const { data: rawBalance } = useReadContract({
    chainId: from as typeof ARC_CHAIN_ID | typeof SEPOLIA_CHAIN_ID,
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const balance = rawBalance === undefined ? null : formatUnits(rawBalance, 18);
  const balanceText = balance === null ? "—" : Number(balance).toLocaleString(undefined, { maximumFractionDigits: 6 });
  const sourceSymbol = direction === "sepolia-to-arc" ? SEPOLIA_MNVDA.symbol : WNVDA.symbol;

  const onUpdate = (l: BridgeLeg) => setLegs((ls) => upsert(ls, l));

  // Load saved legs when a wallet connects. Legs whose burn was sent but whose mint is not done
  // are resumed once (a poll of the attestation and forwarded mint; no new transaction is sent).
  useEffect(() => {
    if (!address) {
      setLegs([]);
      return;
    }
    let cancelled = false;
    bridgeClient.list(address).then((saved) => {
      if (cancelled) return;
      setLegs(saved);
      for (const l of saved) {
        const burned = l.steps.some((s) => s.name === "burn" && s.txHash);
        if (l.status === "running" && burned && !resumed.current.has(l.id)) {
          resumed.current.add(l.id);
          bridgeClient.resume(l, onUpdate).catch((e) => setErr(e instanceof Error ? e.message : "resume failed"));
        }
      }
    });
    return () => {
      cancelled = true;
    };
    // onUpdate only calls a state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  async function start() {
    if (!address || busy) return;
    setErr(null);
    setBusy(true);
    try {
      await bridgeClient.start({ direction, amount, recipient: address }, onUpdate);
    } catch (e) {
      // The client has already saved the failed leg and reported it through onUpdate.
      setErr(e instanceof Error ? e.message : "bridge failed");
    } finally {
      setBusy(false);
    }
  }

  function retry(l: BridgeLeg) {
    setErr(null);
    bridgeClient.resume(l, onUpdate).catch((e) => setErr(e instanceof Error ? e.message : "resume failed"));
  }

  return (
    <>
      <section className="bridge-card">
        <div className="bridge-card-head">
          <h2>Bridge {SEPOLIA_MNVDA.symbol} ↔ wNVDA</h2>
          <span className="bridge-pill">CCTP · Bridge Kit</span>
        </div>

        <div className="bridge-seg" role="tablist" aria-label="Direction">
          {(Object.keys(DIRECTION_TEXT) as BridgeDirection[]).map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={direction === d}
              className={direction === d ? "on" : ""}
              onClick={() => setDirection(d)}
            >
              {DIRECTION_TEXT[d]}
            </button>
          ))}
        </div>

        <div className="bridge-route">
          <span>{chainName(from)}</span>
          <i aria-hidden="true">→</i>
          <span>{chainName(to)}</span>
        </div>

        <label className="bridge-field">
          <span className="bridge-field-top">
            <span>Amount</span>
            <span className="bridge-balance">
              Balance {balanceText}{" "}
              <button
                type="button"
                className="bridge-max"
                disabled={balance === null}
                onClick={() => balance !== null && setAmount(balance)}
              >
                Max
              </button>
            </span>
          </span>
          <span className="bridge-input">
            <input inputMode="decimal" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <b>{sourceSymbol}</b>
          </span>
        </label>

        <dl className="bridge-meta">
          <div>
            <dt>Estimated time</dt>
            <dd>{BRIDGE_ETA[direction]}</dd>
          </div>
          <div>
            <dt>Transfer</dt>
            <dd>Standard (slow) · forwarder</dd>
          </div>
          <div>
            <dt>Network fee</dt>
            <dd>Gas on {chainName(from)}</dd>
          </div>
        </dl>

        <button className="bridge-submit" disabled={!isConnected || busy || !(Number(amount) > 0)} onClick={start}>
          {!isConnected ? "Connect wallet to bridge" : busy ? "Bridging…" : "Bridge"}
        </button>
        {err && <div className="bridge-error">{err}</div>}

        <div className="bridge-preview">
          <div className="bridge-label">What happens</div>
          <Timeline steps={emptySteps()} />
        </div>
      </section>

      <section className="bridge-card">
        <div className="bridge-card-head">
          <h2>Recent legs</h2>
        </div>
        {legs.length === 0 ? (
          <p className="bridge-empty">No bridge legs yet. Legs you start show up here with a transaction link per step.</p>
        ) : (
          <ul className="bridge-legs">
            {legs.map((l) => (
              <li key={l.id} className="bridge-leg">
                <div className="bridge-leg-head">
                  <b>
                    {l.request.amount} {l.request.direction === "sepolia-to-arc" ? SEPOLIA_MNVDA.symbol : WNVDA.symbol}
                  </b>
                  <span>{DIRECTION_TEXT[l.request.direction]}</span>
                  <time>{new Date(l.createdAt).toLocaleTimeString()}</time>
                </div>
                <Timeline steps={BRIDGE_STEP_ORDER.map((n) => l.steps.find((s) => s.name === n)!)} />
                {l.status === "error" && l.error && <div className="bridge-error">{l.error}</div>}
                {l.status === "error" && l.steps.some((s) => s.name === "burn" && s.txHash) && (
                  <button type="button" className="bridge-max" onClick={() => retry(l)}>
                    Resume
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
