"use client";

import { useAccount } from "wagmi";

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Balance hero (Nixtrade-style). Value only; no PnL because we do not track cost basis. */
export function Position({ usdc, nvda, quote }: { usdc: number | null; nvda: number | null; quote: number | null }) {
  const { isConnected } = useAccount();
  const value = nvda !== null && quote ? nvda * quote : null;
  return (
    <section className="card position">
      <div className="pos-label">Your position</div>
      {isConnected ? (
        <>
          <div className="pos-big">{value === null ? "—" : usd(value)}</div>
          <div className="pos-sub">{nvda === null ? "—" : nvda.toLocaleString(undefined, { maximumFractionDigits: 6 })} wNVDA at the live price</div>
          <div className="pos-row"><span>USDC available</span><b>{usdc === null ? "—" : usd(usdc)}</b></div>
        </>
      ) : (
        <div className="pos-sub">Connect a wallet to see your position.</div>
      )}
    </section>
  );
}
