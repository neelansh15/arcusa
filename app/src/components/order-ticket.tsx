"use client";

import { useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useConnect, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { usePublicClient } from "wagmi";
import { ARC_CHAIN_ID, ARC_USDC, WNVDA, explorerTx } from "@/lib/config";
import { ARC_FEES, MARKET_ADDRESS, marketAbi } from "@/lib/market";
import { Toast, type ToastMsg } from "@/components/toast";
import { useQuote, type MarketState } from "@/lib/use-market";


export function OrderTicket({ market, usdcBal, nvdaBal, onDone, initialSide = "buy", slippageBps = 100, onSlippage }: { market: MarketState; usdcBal: number | null; nvdaBal: number | null; onDone?: () => void; initialSide?: "buy" | "sell"; slippageBps?: number; onSlippage?: (bps: number) => void }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { connect, isPending: connecting } = useConnect();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient({ chainId: ARC_CHAIN_ID });
  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [amount, setAmount] = useState("5");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<ToastMsg | null>(null);

  const inDec = side === "buy" ? 6 : 18;
  const outDec = side === "buy" ? 18 : 6;
  const token = side === "buy" ? ARC_USDC.address : WNVDA.address;
  const q = useQuote(side, amount, inDec);

  const allowance = useReadContract({
    chainId: ARC_CHAIN_ID,
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", MARKET_ADDRESS],
    query: { enabled: !!address, refetchInterval: 8_000 },
  });

  const bal = side === "buy" ? usdcBal : nvdaBal;
  const outText = q.out !== null ? Number(formatUnits(q.out, outDec)).toLocaleString(undefined, { maximumFractionDigits: side === "buy" ? 6 : 4 }) : "—";
  const px = q.out && q.parsed ? (side === "buy" ? Number(formatUnits(q.parsed, 6)) / Number(formatUnits(q.out, 18)) : Number(formatUnits(q.out, 6)) / Number(formatUnits(q.parsed, 18))) : null;
  const overBal = bal !== null && Number(amount) > bal;
  const quoteErr = q.error ? "Outside session cap or inventory" : null;
  const canSubmit = isConnected && q.parsed !== null && q.out !== null && !overBal && !busy && !market.inventory?.paused;

  async function submit() {
    if (!address || !client || q.parsed === null || q.out === null) return;
    setMsg(null);
    try {
      if (chainId !== ARC_CHAIN_ID) await switchChainAsync({ chainId: ARC_CHAIN_ID });
      if (((allowance.data as bigint | undefined) ?? 0n) < q.parsed) {
        setBusy("Approving…");
        const h = await writeContractAsync({ chainId: ARC_CHAIN_ID, address: token, abi: erc20Abi, functionName: "approve", args: [MARKET_ADDRESS, q.parsed], ...ARC_FEES });
        await client.waitForTransactionReceipt({ hash: h });
        await allowance.refetch();
      }
      setBusy(side === "buy" ? "Buying…" : "Selling…");
      const min = (q.out * (10_000n - BigInt(slippageBps))) / 10_000n;
      const hash = await writeContractAsync({
        chainId: ARC_CHAIN_ID,
        address: MARKET_ADDRESS,
        abi: marketAbi,
        functionName: side,
        args: [q.parsed, min],
        ...ARC_FEES,
      });
      const r = await client.waitForTransactionReceipt({ hash });
      const href = explorerTx(ARC_CHAIN_ID, hash);
      if (r.status === "success") onDone?.();
      setMsg(r.status === "success"
        ? { id: Date.now(), kind: "ok", title: "Transaction confirmed", text: `${side === "buy" ? "Bought" : "Sold"} ${outText} ${side === "buy" ? "wNVDA" : "USDC"}`, href }
        : { id: Date.now(), kind: "err", title: "Transaction reverted", text: "The market rejected this order.", href });
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setMsg({ id: Date.now(), kind: "err", title: "Transaction failed", text: m.split("\n")[0].slice(0, 120) });
    } finally {
      setBusy(null);
    }
  }

  const setPct = (p: number) => {
    if (bal === null) return;
    const v = (bal * p) / 100;
    setAmount(side === "buy" ? v.toFixed(2) : v.toFixed(6));
  };

  const wrongNet = isConnected && chainId !== ARC_CHAIN_ID;
  const needsApproval = q.parsed !== null && ((allowance.data as bigint | undefined) ?? 0n) < q.parsed;
  const word = side === "buy" ? "Buy" : "Sell";
  const outSym = side === "buy" ? "wNVDA" : "USDC";
  const inSym = side === "buy" ? "USDC" : "wNVDA";
  // Estimated spread cost in USDC: notional * spread. Notional is the pay amount (buy) or the proceeds grossed up (sell).
  const spreadFrac = market.spreadBps !== null ? market.spreadBps / 10_000 : null;
  const outUsdc = q.out !== null && side === "sell" ? Number(formatUnits(q.out, 6)) : null;
  const notional = side === "buy" ? (Number(amount) > 0 ? Number(amount) : null) : outUsdc !== null && spreadFrac !== null ? outUsdc / (1 - spreadFrac) : null;
  const spreadCost = notional !== null && spreadFrac !== null ? notional * spreadFrac : null;

  let label: string;
  let action: (() => void) | undefined;
  let disabled = false;
  if (!isConnected) { label = connecting ? "Connecting…" : "Connect wallet"; action = () => connect({ connector: injected() }); disabled = connecting; }
  else if (wrongNet) { label = "Switch to Arc"; action = () => { switchChainAsync({ chainId: ARC_CHAIN_ID }).catch(() => {}); }; }
  else if (busy) { label = busy; disabled = true; }
  else { label = `${needsApproval ? "Approve & " : ""}${word} NVDA`; action = submit; disabled = !canSubmit; }

  return (
    <section className="card ticket">
      <div className="tk-head">
        <div className="tk-tabs">
          <button className={side === "buy" ? "on" : ""} onClick={() => setSide("buy")}>Buy</button>
          <button className={side === "sell" ? "on" : ""} onClick={() => setSide("sell")}>Sell</button>
        </div>
      </div>

      <div className="tk-card">
        <div className="tk-top"><span>You pay</span><span className="tk-bal">Balance {bal === null ? "—" : bal.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
        <div className="tk-main">
          <input aria-label="Amount to pay" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <span className={`tk-token ${side === "buy" ? "usdc" : "nvda"}`}><i>{side === "buy" ? "$" : "N"}</i>{inSym}</span>
        </div>
        <div className="tk-pct">
          {[25, 50, 75, 100].map((p) => (<button key={p} onClick={() => setPct(p)}>{p === 100 ? "Max" : `${p}%`}</button>))}
        </div>
      </div>

      <button className="tk-swap" aria-label="Flip buy and sell" onClick={() => { setSide(side === "buy" ? "sell" : "buy"); setAmount(""); }}>⇅</button>

      <div className="tk-card">
        <div className="tk-top"><span>You receive</span><span className="tk-bal">Balance {(side === "buy" ? nvdaBal : usdcBal) === null ? "—" : (side === "buy" ? nvdaBal : usdcBal)!.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
        <div className="tk-main">
          <output className="tk-out">{outText}</output>
          <span className={`tk-token ${side === "buy" ? "nvda" : "usdc"}`}><i>{side === "buy" ? "N" : "$"}</i>{outSym}</span>
        </div>
      </div>

      <button className="tk-submit" disabled={disabled} onClick={action}>{label}</button>
      {overBal && <div className="tk-msg neg">Amount exceeds your balance.</div>}
      {quoteErr && !overBal && <div className="tk-msg warn">{quoteErr}.</div>}
      {market.oracle?.stale && <div className="tk-msg warn">Oracle price is stale; off-hours demo mode is on.</div>}

      <div className="tk-sum">
        <div><span>Estimated spread cost</span><b>{spreadCost !== null ? `${spreadCost.toFixed(2)} USDC` : "—"}</b></div>
        <div><span>You will receive</span><b>{outText} {outSym}</b></div>
        <div><span>Spread</span><b>{market.spreadBps !== null ? `${market.spreadBps / 100}%` : "—"}</b></div>
        <div><span>Execution price</span><b>{px ? `$${px.toFixed(2)}` : "—"}</b></div>
        <div><span>Slippage tolerance</span><b>{slippageBps / 100}%</b></div>
        {onSlippage && (
          <div className="tk-slip"><span>Set slippage</span>
            <div>{[50, 100, 200].map((b) => (<button key={b} className={slippageBps === b ? "on" : ""} onClick={() => onSlippage(b)}>{b / 100}%</button>))}</div>
          </div>
        )}
        <div><span>Max per trade</span><b>{market.maxTradeUsdc !== null ? `${market.maxTradeUsdc} USDC` : "—"}</b></div>
      </div>
      <Toast toast={msg} onClose={() => setMsg(null)} />
    </section>
  );
}
