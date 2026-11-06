"use client";

import { useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useConnection, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { useWalletModal } from "./wallet-modal";
import { usePublicClient } from "wagmi";
import { ARC_CHAIN_ID, ARC_USDC, explorerTx } from "@/lib/config";
import { ARC_FEES, marketAbi } from "@/lib/market";
import type { LiveAsset } from "@/lib/assets";
import { Toast, type ToastMsg } from "@/components/toast";
import { friendlyMarketError } from "@/lib/market-errors";
import { useQuote, type MarketState } from "@/lib/use-market";
import type { ReactNode } from "react";


// Native USDC left unspent on buys to cover gas for this and follow-up transactions.
const GAS_RESERVE_USDC = 0.1;

export function OrderTicket({ asset, market, usdcBal, nvdaBal, onDone, initialSide = "buy", slippageBps = 100, onSlippage, summaryHead }: { asset: LiveAsset; market: MarketState; usdcBal: number | null; nvdaBal: number | null; onDone?: () => void; initialSide?: "buy" | "sell"; slippageBps?: number; onSlippage?: (bps: number) => void; summaryHead?: ReactNode }) {
  const MARKET_ADDRESS = asset.live.market;
  const WNVDA = asset.live.token;
  const { address, isConnected, chainId } = useConnection();
  const { switchChainAsync } = useSwitchChain();
  const { openConnect } = useWalletModal();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient({ chainId: ARC_CHAIN_ID });
  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [amount, setAmount] = useState("5");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<ToastMsg | null>(null);

  const inDec = side === "buy" ? 6 : 18;
  const outDec = side === "buy" ? 18 : 6;
  const token = side === "buy" ? ARC_USDC.address : WNVDA.address;
  const q = useQuote(asset, side, amount, inDec);

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
  const quoteErr = q.error ? friendlyMarketError(q.error) : null;
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
        ? { id: Date.now(), kind: "ok", title: "Transaction confirmed", text: `${side === "buy" ? "Bought" : "Sold"} ${outText} ${side === "buy" ? WNVDA.symbol : "USDC"}`, href }
        : { id: Date.now(), kind: "err", title: "Transaction reverted", text: "The market rejected this order.", href });
    } catch (e) {
      const f = friendlyMarketError(e);
      setMsg({ id: Date.now(), kind: "err", title: f.title, text: f.text });
    } finally {
      setBusy(null);
    }
  }

  const setPct = (p: number) => {
    if (bal === null) return;
    // USDC is also Arc's gas token: keep a small reserve when paying with it, and truncate (never round up) so the amount never exceeds the balance.
    const usable = side === "buy" ? Math.max(0, bal - GAS_RESERVE_USDC) : bal;
    const dp = side === "buy" ? 2 : 6;
    const f = 10 ** dp;
    const v = Math.floor(((usable * p) / 100) * f + 1e-9) / f;
    setAmount(v.toFixed(dp));
  };

  const wrongNet = isConnected && chainId !== ARC_CHAIN_ID;
  const needsApproval = q.parsed !== null && ((allowance.data as bigint | undefined) ?? 0n) < q.parsed;
  const word = side === "buy" ? "Buy" : "Sell";
  const outSym = side === "buy" ? WNVDA.symbol : "USDC";
  const inSym = side === "buy" ? "USDC" : WNVDA.symbol;
  // Estimated spread cost in USDC: notional * spread. Notional is the pay amount (buy) or the proceeds grossed up (sell).
  const spreadFrac = market.spreadBps !== null ? market.spreadBps / 10_000 : null;
  const outUsdc = q.out !== null && side === "sell" ? Number(formatUnits(q.out, 6)) : null;
  const notional = side === "buy" ? (Number(amount) > 0 ? Number(amount) : null) : outUsdc !== null && spreadFrac !== null ? outUsdc / (1 - spreadFrac) : null;
  const spreadCost = !quoteErr && notional !== null && spreadFrac !== null ? notional * spreadFrac : null;

  let label: string;
  let action: (() => void) | undefined;
  let disabled = false;
  if (!isConnected) { label = "Connect wallet"; action = openConnect; }
  else if (wrongNet) { label = "Switch to Arc"; action = () => { switchChainAsync({ chainId: ARC_CHAIN_ID }).catch(() => {}); }; }
  else if (busy) { label = busy; disabled = true; }
  else { label = `${needsApproval ? "Approve & " : ""}${word} ${asset.ticker}`; action = submit; disabled = !canSubmit; }

  const payBal = bal === null ? "—" : bal.toLocaleString(undefined, { maximumFractionDigits: 4 });
  const recvBalNum = side === "buy" ? nvdaBal : usdcBal;
  const recvBal = recvBalNum === null ? "—" : recvBalNum.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <section className="card ticket">
      <div className="tk-tabs" role="tablist">
        <button role="tab" aria-selected={side === "buy"} className={side === "buy" ? "on" : ""} onClick={() => setSide("buy")}>Buy</button>
        <button role="tab" aria-selected={side === "sell"} className={side === "sell" ? "on" : ""} onClick={() => setSide("sell")}>Sell</button>
      </div>

      <div className="tk-card">
        <div className="tk-top">
          <span className={`tk-token ${side === "buy" ? "usdc" : "nvda"}`}><i>{side === "buy" ? "$" : asset.ticker[0]}</i>{inSym}</span>
          <span className="tk-label">You pay</span>
        </div>
        <div className="tk-main">
          <input aria-label="Amount to pay" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="tk-bal"><span>Balance</span><b>{payBal}</b></div>
        </div>
        <div className="tk-pct">
          {[25, 50, 75, 100].map((p) => (<button key={p} onClick={() => setPct(p)}>{p === 100 ? "Max" : `${p}%`}</button>))}
        </div>
      </div>

      <button className="tk-swap" aria-label="Flip buy and sell" onClick={() => { setSide(side === "buy" ? "sell" : "buy"); setAmount(""); }}>⇅</button>

      <div className="tk-card">
        <div className="tk-top">
          <span className={`tk-token ${side === "buy" ? "nvda" : "usdc"}`}><i>{side === "buy" ? asset.ticker[0] : "$"}</i>{outSym}</span>
          <span className="tk-label">You receive</span>
        </div>
        <div className="tk-main">
          <output className="tk-out">{outText}</output>
          <div className="tk-bal"><span>Balance</span><b>{recvBal}</b></div>
        </div>
      </div>

      <button className="tk-submit" disabled={disabled} onClick={action}>{label}</button>
      {overBal && <div className="tk-msg neg">Amount exceeds your balance.</div>}
      {quoteErr && !overBal && <div className={`tk-alert ${quoteErr.tone}`} role="alert"><i aria-hidden="true">{quoteErr.tone === "info" ? "i" : "!"}</i><div><b>{quoteErr.title}</b><span>{quoteErr.text}</span></div></div>}
      {market.oracle?.stale && <div className="tk-msg warn">Oracle price is stale; off-hours demo mode is on.</div>}

      <div className="tk-sum">
        {summaryHead && <div className="tk-sum-head">{summaryHead}</div>}
        <div className="tk-cols">
          <div><span>Estimated fee</span><b>{spreadCost !== null ? `${spreadCost.toFixed(2)} USDC` : "—"}</b></div>
          <div><span>You will receive</span><b>{outText} {outSym}</b></div>
          <div><span>Spread</span><b>{market.spreadBps !== null ? `${market.spreadBps / 100}%` : "—"}</b></div>
        </div>
        <div className="tk-sub">
          <span>Execution price <b>{px ? `$${px.toFixed(2)}` : "—"}</b></span>
          <span>Slippage <b>{slippageBps / 100}%</b></span>
          <span>Max per trade <b>{market.maxTradeUsdc !== null ? `${market.maxTradeUsdc} USDC` : "—"}</b></span>
        </div>
        {onSlippage && (
          <div className="tk-slip"><span>Set slippage</span>
            <div>{[50, 100, 200].map((b) => (<button key={b} className={slippageBps === b ? "on" : ""} onClick={() => onSlippage(b)}>{b / 100}%</button>))}</div>
          </div>
        )}
      </div>
      <Toast toast={msg} onClose={() => setMsg(null)} />
    </section>
  );
}
