"use client";

import { useConnection } from "wagmi";

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
type P = { usdc: number | null; nvda: number | null; quote: number | null };

/** Balance hero (Nixtrade-style). Value only; no PnL because we do not track cost basis. */
export function PositionBody({ usdc, nvda, quote }: P) {
  const { isConnected } = useConnection();
  const value = nvda !== null && quote ? nvda * quote : null;
  if (!isConnected) return <div className="pos-sub">Connect a wallet to see your position.</div>;
  return (
    <>
      <div className="pos-label">Your position</div>
      <div className="pos-big">{value === null ? "—" : usd(value)}</div>
      <div className="pos-sub">{nvda === null ? "—" : nvda.toLocaleString(undefined, { maximumFractionDigits: 6 })} wNVDA at the live price · {usdc === null ? "—" : usd(usdc)} USDC available</div>
    </>
  );
}

export function Position(p: P) {
  return (
    <section className="card position">
      <PositionBody {...p} />
    </section>
  );
}
