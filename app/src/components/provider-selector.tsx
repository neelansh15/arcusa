"use client";

import { useRef, useState } from "react";
import { Modal } from "./modal";
import type { ProviderQuote } from "./provider-selector-types";

export interface ProviderSelectorProps {
  /** One entry per provider. Fewer than two renders nothing (ADR 0026). */
  providers: ProviderQuote[];
  selectedId: string;
  onSelect: (providerId: string) => void;
  /** Quotes are being fetched. */
  loading?: boolean;
  /** Quote error message; shows a retry when `onRetry` is given. */
  error?: string | null;
  onRetry?: () => void;
  /** True while the user has not entered an amount, so there is nothing to compare yet. */
  amountEmpty?: boolean;
  /** Symbol of what the user receives, for example "wTSLA" on a buy or "USDC" on a sell. */
  receiveSymbol?: string;
  /** Pro mode adds effective price and spread columns (ADR 0019). */
  pro?: boolean;
}

const fmtAmount = (n: number, symbol?: string) => {
  const digits = symbol === "USDC" ? 2 : n < 1 ? 6 : 4;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
};
const fmtPct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(2)}%`;

function age(updatedAt: ProviderQuote["updatedAt"]): string {
  const t = updatedAt instanceof Date ? updatedAt.getTime() : typeof updatedAt === "string" ? Date.parse(updatedAt) : updatedAt;
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}

function rowName(q: ProviderQuote, receiveSymbol: string | undefined, amountEmpty: boolean | undefined) {
  const parts = [q.label];
  if (q.status === "unavailable") parts.push("unavailable");
  else if (amountEmpty) parts.push("enter an amount to compare");
  else parts.push(`receive ${fmtAmount(q.amountOut, receiveSymbol)} ${receiveSymbol ?? "tokens"}`);
  if (q.isBest && q.status !== "unavailable" && !amountEmpty) parts.push("best price");
  if (q.status === "stale") parts.push("stale quote");
  if (!q.tradable && q.status !== "unavailable") parts.push("quote only");
  return parts.join(", ");
}

/** Control for the order ticket plus the provider modal. Renders nothing with fewer than two providers. */
export function ProviderSelector(props: ProviderSelectorProps) {
  const { providers, selectedId, loading, amountEmpty } = props;
  const [open, setOpen] = useState(false);
  if (providers.length < 2) return null;
  const selected = providers.find((p) => p.providerId === selectedId) ?? providers[0];
  const showBest = selected.isBest && !loading && !amountEmpty && selected.status !== "unavailable";

  return (
    <>
      <button type="button" className="prov-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <span className="prov-btn-label">Provider:</span>
        <b>{selected.label}</b>
        {showBest && <span className="prov-pill best">Best price</span>}
        <svg className="prov-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" /></svg>
      </button>
      {open && (
        <ProviderModal
          {...props}
          selected={selected}
          onClose={() => setOpen(false)}
          onPick={(id) => {
            props.onSelect(id);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function ProviderModal({ providers, selected, loading, error, onRetry, amountEmpty, receiveSymbol, pro, onClose, onPick }: ProviderSelectorProps & { selected: ProviderQuote; onClose: () => void; onPick: (id: string) => void }) {
  const first = useRef<HTMLButtonElement | null>(null);
  const showAmounts = !loading && !error && !amountEmpty;

  return (
    <Modal label="Choose a provider" onClose={onClose} initialFocus={first}>
      <div className="modal-head">
        <h2>Choose a provider</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <p className="prov-lead">Quotes for your amount. Best among these providers, not the best price in the market.</p>

      {amountEmpty && !loading && !error && <p className="prov-state" role="status">Enter an amount to compare.</p>}
      {error && (
        <div className="prov-state err" role="alert">
          <span>{error}</span>
          {onRetry && <button type="button" className="prov-retry" onClick={onRetry}>Try again</button>}
        </div>
      )}
      {loading && <p className="sr-only" role="status">Loading quotes</p>}

      <ul className="prov-list" aria-busy={loading || undefined}>
        {loading
          ? providers.map((p) => (
              <li key={p.providerId} className="prov-row skeleton" aria-hidden="true">
                <span className="sk sk-a" /><span className="sk sk-b" /><span className="sk sk-c" />
              </li>
            ))
          : providers.map((q, i) => {
              const isSel = q.providerId === selected.providerId;
              const unavailable = q.status === "unavailable";
              return (
                <li key={q.providerId}>
                  <button
                    type="button"
                    ref={i === 0 ? first : undefined}
                    className={`prov-row${isSel ? " selected" : ""}${unavailable ? " off" : ""}`}
                    aria-pressed={isSel}
                    aria-disabled={unavailable || undefined}
                    aria-label={rowName(q, receiveSymbol, amountEmpty || !!error)}
                    onClick={() => (unavailable ? undefined : onPick(q.providerId))}
                  >
                    <span className="prov-main">
                      <b>{q.label}</b>
                      <small>{q.tokenSymbol}</small>
                    </span>
                    <span className="prov-nums">
                      <span className="prov-out">{unavailable || !showAmounts ? "—" : fmtAmount(q.amountOut, receiveSymbol)}</span>
                      {pro && showAmounts && !unavailable && (
                        <span className="prov-sub">
                          <span>${q.effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span>{(q.spreadBps / 100).toFixed(2)}% spread</span>
                        </span>
                      )}
                    </span>
                    <span className="prov-tags">
                      {unavailable ? <span className="prov-pill off">Unavailable</span> : (
                        <>
                          {showAmounts && (q.isBest ? <span className="prov-pill best">Best price</span> : <span className="prov-pill worse">{fmtPct(q.deltaVsBestPct)}</span>)}
                          {q.status === "stale" && <span className="prov-pill warn">Stale{age(q.updatedAt) ? ` · ${age(q.updatedAt)}` : ""}</span>}
                          {!q.tradable && <span className="prov-pill quote">Quote only</span>}
                        </>
                      )}
                    </span>
                    {isSel && <span className="prov-check" aria-hidden="true">✓</span>}
                  </button>
                </li>
              );
            })}
      </ul>
      <p className="asset-note">Testnet demo. Not a security, no real shares, no real value.</p>
    </Modal>
  );
}
