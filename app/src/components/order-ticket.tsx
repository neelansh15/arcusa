"use client";

import { useState } from "react";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { usePublicClient } from "wagmi";
import { ARC_CHAIN_ID, ARC_USDC, WNVDA, explorerTx } from "@/lib/config";
import { ARC_FEES, MARKET_ADDRESS, marketAbi } from "@/lib/market";
import { useQuote, type MarketState } from "@/lib/use-market";

const SLIPPAGE_BPS = 100n;

export function OrderTicket({ market, usdcBal, nvdaBal }: { market: MarketState; usdcBal: number | null; nvdaBal: number | null }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient({ chainId: ARC_CHAIN_ID });
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("5");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string; tx?: string } | null>(null);

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
      const min = (q.out * (10_000n - SLIPPAGE_BPS)) / 10_000n;
      const hash = await writeContractAsync({
        chainId: ARC_CHAIN_ID,
        address: MARKET_ADDRESS,
        abi: marketAbi,
        functionName: side,
        args: [q.parsed, min],
        ...ARC_FEES,
      });
      const r = await client.waitForTransactionReceipt({ hash });
      setMsg(r.status === "success" ? { kind: "ok", text: `${side === "buy" ? "Bought" : "Sold"} ${outText} ${side === "buy" ? "wNVDA" : "USDC"}`, tx: hash } : { kind: "err", text: "Transaction reverted", tx: hash });
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setMsg({ kind: "err", text: m.split("\n")[0].slice(0, 120) });
    } finally {
      setBusy(null);
    }
  }

  const setPct = (p: number) => {
    if (bal === null) return;
    const v = (bal * p) / 100;
    setAmount(side === "buy" ? v.toFixed(2) : v.toFixed(6));
  };

  return (
    <section className="panel ticket">
      <div className="seg full tabs">
        <button className={side === "buy" ? "on buy" : ""} onClick={() => setSide("buy")}>Buy</button>
        <button className={side === "sell" ? "on sell" : ""} onClick={() => setSide("sell")}>Sell</button>
      </div>
      <label className="field">
        <span>
          <em>{side === "buy" ? "Pay" : "Sell"}</em>
          <em>Bal {bal === null ? "—" : bal.toLocaleString(undefined, { maximumFractionDigits: 4 })}</em>
        </span>
        <div className="input">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <b>{side === "buy" ? "USDC" : "wNVDA"}</b>
        </div>
      </label>
      <div className="seg full pct">
        {[25, 50, 75, 100].map((p) => (
          <button key={p} onClick={() => setPct(p)}>{p === 100 ? "Max" : `${p}%`}</button>
        ))}
      </div>
      <div className="est">
        <span className="muted">You receive</span>
        <b>{outText} <small>{side === "buy" ? "wNVDA" : "USDC"}</small></b>
      </div>
      <div className="kv"><span>Exec. price</span><span>{px ? `$${px.toFixed(2)}` : "—"}</span></div>
      <div className="kv"><span>Spread</span><span>{market.spreadBps !== null ? `${market.spreadBps / 100}%` : "—"}</span></div>
      <div className="kv"><span>Slippage tolerance</span><span>1%</span></div>
      <div className="kv"><span>Max per trade</span><span>{market.maxTradeUsdc !== null ? `${market.maxTradeUsdc} USDC` : "—"}</span></div>
      {overBal && <div className="neg small">Amount exceeds balance.</div>}
      {quoteErr && !overBal && <div className="warn small">{quoteErr}.</div>}
      {market.oracle?.stale && <div className="warn small">Oracle price is stale; off-hours demo mode is on.</div>}
      <button className={`submit ${side}`} disabled={isConnected && !canSubmit} onClick={isConnected ? submit : undefined}>
        {!isConnected ? "Connect wallet to trade" : busy ?? `${side === "buy" ? "Buy" : "Sell"} NVDA`}
      </button>
      {msg && (
        <div className={`small note ${msg.kind === "err" ? "neg" : "pos"}`}>
          {msg.text}
          {msg.tx && (
            <>
              {" "}
              <a href={explorerTx(ARC_CHAIN_ID, msg.tx)} target="_blank" rel="noreferrer">view tx</a>
            </>
          )}
        </div>
      )}
    </section>
  );
}
