"use client";

import { useMemo, useRef, useState } from "react";
import { ASSETS, type Asset } from "@/lib/assets";
import { Modal } from "./modal";

/** Pair header control: logos, pair name and a chevron form one button that opens the asset list (ADR 0022). */
export function AssetSelector({ asset, onSelect }: { asset: Asset; onSelect: (a: Asset) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="asset-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <span className="pair-icons" aria-hidden="true"><i className="ic nvda">N</i><i className="ic usdc">$</i></span>
        <span className="asset-name">{asset.pair.split(" / ")[0]} <span className="muted">/ USDC</span></span>
        <span className="sr-only">, choose asset</span>
        <svg className="asset-chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" /></svg>
      </button>
      {open && (
        <AssetModal
          current={asset}
          onClose={() => setOpen(false)}
          onSelect={(a) => {
            onSelect(a);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function AssetModal({ current, onClose, onSelect }: { current: Asset; onClose: () => void; onSelect: (a: Asset) => void }) {
  const [q, setQ] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? ASSETS.filter((a) => a.ticker.toLowerCase().includes(n) || a.label.toLowerCase().includes(n)) : ASSETS;
  }, [q]);

  return (
    <Modal label="Select an asset" onClose={onClose} initialFocus={search}>
      <div className="modal-head">
        <h2>Select an asset</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <input ref={search} className="modal-search" type="search" aria-label="Search assets" placeholder="Search by ticker" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      <p className="sr-only" role="status">{list.length ? `${list.length} ${list.length === 1 ? "result" : "results"}` : "No assets match"}</p>
      <ul className="asset-list">
        {list.map((a) =>
          a.status === "live" ? (
            <li key={a.ticker}>
              <button type="button" className="asset-row" onClick={() => onSelect(a)}>
                <span className="pair-icons" aria-hidden="true"><i className="ic nvda">N</i><i className="ic usdc">$</i></span>
                <span className="asset-row-main"><b>{a.ticker}</b><small>{a.label}</small></span>
                {a.ticker === current.ticker && <span className="asset-check" aria-label="Selected">✓</span>}
              </button>
            </li>
          ) : (
            <li key={a.ticker} className="asset-row planned" aria-disabled="true">
              <span className="asset-dot" aria-hidden="true" />
              <span className="asset-row-main"><b>{a.ticker}</b></span>
              <span className="asset-soon">Coming soon</span>
            </li>
          ),
        )}
      </ul>
      {!list.length && <p className="asset-empty">No assets match.</p>}
      <p className="asset-note">More stocks are planned. Only NVDA trades today. Testnet demo. Not a security, no real shares, no real value.</p>
    </Modal>
  );
}
