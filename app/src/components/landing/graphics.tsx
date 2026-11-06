import type { ReactNode } from "react";

/* Decorative graphics for the landing page. All colours are theme tokens (the logo keeps literals, ADR 0020).
   Everything here is aria-hidden: the copy next to it carries the meaning. */

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#c3dc4e" />
      <path d="M7.5 23 A8.5 8.5 0 0 1 24.5 23" fill="none" stroke="#10130a" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="13.5" r="2.4" fill="#10130a" />
    </svg>
  );
}

export const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/* ---------- Story visuals (one per step) ---------- */

export function Vis1() {
  return (
    <div className="lp-vis v1" aria-hidden="true">
      <div className="lp-wallet">
        <div className="lp-wallet-top"><i className="lp-ic us">$</i><div><small>Wallet</small><b>USDC</b></div></div>
        <div className="lp-wallet-bal">120.00</div>
        <span className="lp-coin c1">$</span><span className="lp-coin c2">$</span><span className="lp-coin c3">$</span>
      </div>
    </div>
  );
}

export function Vis2() {
  return (
    <div className="lp-vis v2" aria-hidden="true">
      <div className="lp-pick">
        <div className="lp-pick-row sel"><i className="lp-ic nv">N</i><div><b>NVDA</b><small>Mock NVIDIA token</small></div><span>Selected</span></div>
        <div className="lp-pick-more"><span /><span /><small>More stocks on the roadmap</small></div>
      </div>
    </div>
  );
}

export function Vis3() {
  return (
    <div className="lp-vis v3" aria-hidden="true">
      <div className="lp-press">
        <div className="lp-press-btn">Buy NVDA</div>
        <svg className="lp-press-ok" viewBox="0 0 52 52"><circle cx="26" cy="26" r="23" pathLength="1" /><path d="M15 27l8 8 15-17" pathLength="1" /></svg>
        <small>Settled in one transaction</small>
      </div>
    </div>
  );
}

/* ---------- Bento tile graphics ---------- */

export function GOne() {
  return (
    <svg className="lp-g" viewBox="0 0 220 120" aria-hidden="true">
      <circle className="g-coin" cx="110" cy="60" r="34" />
      <text x="110" y="68" textAnchor="middle" className="g-coin-t">USDC</text>
      <g className="g-chip g-chip-a"><rect x="6" y="14" width="64" height="26" rx="13" /><text x="38" y="31" textAnchor="middle">price</text></g>
      <g className="g-chip g-chip-b"><rect x="150" y="80" width="64" height="26" rx="13" /><text x="182" y="97" textAnchor="middle">fee</text></g>
    </svg>
  );
}

export function GPrice() {
  return (
    <svg className="lp-g" viewBox="0 0 220 120" aria-hidden="true">
      <path className="g-spark" pathLength="1" d="M4 86 C28 80 38 96 62 78 S100 40 124 56 S160 84 178 46 S192 34 198 30" fill="none" />
      <circle className="g-ping" cx="198" cy="30" r="5" />
      <circle className="g-ring" cx="198" cy="30" r="5" />
    </svg>
  );
}

export function GCost() {
  return (
    <svg className="lp-g" viewBox="0 0 220 120" aria-hidden="true">
      <rect className="g-bar g-bid" x="20" y="22" width="120" height="22" rx="11" />
      <text x="30" y="37" className="g-lbl">Sell</text>
      <rect className="g-bar g-ask" x="20" y="76" width="150" height="22" rx="11" />
      <text x="30" y="91" className="g-lbl">Buy</text>
      <g className="g-gap"><path d="M150 50v20" /><path d="M144 56l6-6 6 6M144 64l6 6 6-6" /></g>
    </svg>
  );
}

export function GPhone() {
  return (
    <svg className="lp-g" viewBox="0 0 220 120" aria-hidden="true">
      <rect className="g-ph" x="78" y="6" width="64" height="124" rx="12" />
      <rect className="g-ph-in" x="84" y="14" width="52" height="30" rx="5" />
      <rect className="g-sheet" x="84" y="52" width="52" height="66" rx="8" />
      <rect className="g-ph-btn" x="90" y="98" width="40" height="12" rx="6" />
    </svg>
  );
}

export function GBridge() {
  return (
    <svg className="lp-g" viewBox="0 0 220 120" aria-hidden="true">
      <circle className="g-node" cx="28" cy="60" r="14" />
      <text x="28" y="92" textAnchor="middle" className="g-lbl2">Sepolia</text>
      <path className="g-track" d="M46 60H174" />
      <circle className="g-packet" cx="46" cy="60" r="5" />
      <circle className="g-node g-arc" cx="192" cy="60" r="14" />
      <text x="192" y="92" textAnchor="middle" className="g-lbl2">Arc</text>
    </svg>
  );
}

export function GChain() {
  return (
    <div className="lp-receipt" aria-hidden="true">
      <div className="lp-receipt-top"><i>✓</i><b>Bought NVDA</b><span>Illustration</span></div>
      <div className="lp-receipt-row"><small>Transaction</small><code>0x7f3a…c91e</code></div>
      <div className="lp-receipt-link">View in the Arc explorer ↗</div>
    </div>
  );
}

export function Tile({ id, title, body, children, wide }: { id: string; title: string; body: string; children: ReactNode; wide?: boolean }) {
  return (
    <article className={`lp-tile t-${id}${wide ? " wide" : ""}`} data-reveal data-live-root>
      <div className="lp-tile-art">{children}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
