"use client";

import { useEffect, useState } from "react";

const BASE = 182.4;

/** Simulated bid/ask preview for the hero card. Purely illustrative. */
export function LiveQuote() {
  const [mid, setMid] = useState(BASE);
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setMid((m) => {
        const step = (Math.random() - 0.48) * 0.18;
        const next = Math.min(BASE + 2.5, Math.max(BASE - 2.5, m + step));
        setDir(next >= m ? 1 : -1);
        return next;
      });
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  const spread = 0.09;
  const bid = mid - spread / 2;
  const ask = mid + spread / 2;
  const change = ((mid - 178.92) / 178.92) * 100;

  return (
    <div className="lp-quote">
      <div className="lp-quote-main">
        <span className={`lp-quote-px ${dir > 0 ? "up" : "down"}`} key={mid.toFixed(2)}>
          {mid.toFixed(2)}
        </span>
        <span className={`lp-chip ${change >= 0 ? "up" : "down"}`}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>
      <div className="lp-quote-book">
        <div>
          <span>Bid</span>
          <b className="lp-bid">{bid.toFixed(2)}</b>
        </div>
        <div>
          <span>Ask</span>
          <b className="lp-ask">{ask.toFixed(2)}</b>
        </div>
        <div>
          <span>Spread</span>
          <b>{spread.toFixed(2)}</b>
        </div>
      </div>
    </div>
  );
}
