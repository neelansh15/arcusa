"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";
import type { Connector } from "wagmi";
import { arcTestnet } from "@/lib/config";
import { isRejection, useSwitchToArc } from "@/lib/use-switch-to-arc";
import { Modal } from "./modal";

type View = "connect" | "account" | null;
interface Ctx { openConnect: () => void; openAccount: () => void }
const WalletModalContext = createContext<Ctx>({ openConnect: () => {}, openAccount: () => {} });
export const useWalletModal = () => useContext(WalletModalContext);

const KNOWN = ["io.metamask", "io.rabby", "app.phantom", "com.coinbase.wallet"];
const rank = (c: Connector) => {
  const i = KNOWN.indexOf(((c as { rdns?: string | readonly string[] }).rdns as string) ?? c.id);
  return i === -1 ? 99 : i;
};
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** EIP-6963 icons are untrusted: only data-URI images or https URLs of sane size, rendered in an <img>. */
function safeIcon(icon?: string): string | null {
  if (!icon || icon.length > 200_000) return null;
  if (/^data:image\/(png|jpeg|webp|svg\+xml|gif);base64,/i.test(icon)) return icon;
  if (/^https:\/\//i.test(icon)) return icon;
  return null;
}

function WalletIcon({ name, icon }: { name: string; icon?: string }) {
  const [bad, setBad] = useState(false);
  const src = safeIcon(icon);
  if (!src || bad) return <span className="wl-icon wl-fallback" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="wl-icon" src={src} alt="" width={32} height={32} referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={() => setBad(true)} />;
}

function describeError(e: unknown): { tone: "info" | "err"; text: string } {
  const x = e as { code?: number; cause?: { code?: number }; message?: string };
  if (isRejection(e)) return { tone: "info", text: "Request cancelled." };
  if (x?.code === -32002 || x?.cause?.code === -32002 || /already pending/i.test(x?.message ?? "")) {
    return { tone: "err", text: "A request is already open in your wallet. Open the extension, approve or reject it, then try again." };
  }
  return { tone: "err", text: (x?.message ?? "Could not connect.").split("\n")[0].slice(0, 160) };
}

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(false);
  const firstRow = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setView(null);
    setHint(false);
  }, []);
  const requestClose = useCallback(() => {
    if (busy) setHint(true); // a pending wallet request cannot be aborted; keep the modal open
    else close();
  }, [busy, close]);

  const ctx = useMemo<Ctx>(() => ({ openConnect: () => setView("connect"), openAccount: () => setView("account") }), []);

  return (
    <WalletModalContext.Provider value={ctx}>
      {children}
      {view && (
        <Modal label={view === "connect" ? "Connect a wallet" : "Account"} onClose={requestClose} initialFocus={firstRow}>
          <div className="modal-head">
            <h2>{view === "connect" ? "Connect a wallet" : "Account"}</h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={requestClose}>×</button>
          </div>
          {view === "connect" ? <ConnectView onDone={close} setBusy={setBusy} hint={hint} firstRow={firstRow} /> : <AccountView onDone={close} />}
        </Modal>
      )}
    </WalletModalContext.Provider>
  );
}

function ConnectView({ onDone, setBusy, hint, firstRow }: { onDone: () => void; setBusy: (b: boolean) => void; hint: boolean; firstRow: React.MutableRefObject<HTMLElement | null> }) {
  const connectors = useConnectors();
  const { connect, isPending, variables, error, reset } = useConnect();
  const { connector: active } = useConnection();
  const [settled, setSettled] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 300); // discovered wallets arrive after mount
    setTouch(window.matchMedia("(hover: none)").matches);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    setBusy(isPending);
    return () => setBusy(false);
  }, [isPending, setBusy]);

  const discovered = connectors.filter((c) => c.id !== "injected").sort((a, b) => rank(a) - rank(b));
  const generic = connectors.find((c) => c.id === "injected");
  const hasEthereum = typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum;
  const list = discovered.length ? discovered : generic && hasEthereum ? [generic] : [];
  const pendingUid = isPending ? (variables?.connector as Connector | undefined)?.uid : undefined;
  const err = error && !isPending ? describeError(error) : null;

  function pick(c: Connector) {
    if (isPending) return;
    reset();
    connect({ connector: c }, { onSuccess: onDone });
  }

  return (
    <>
      {list.length > 0 && (
        <ul className="wl-list">
          {list.map((c, i) => {
            const isActive = active?.uid === c.uid;
            const pending = pendingUid === c.uid;
            const name = (c.id === "injected" ? "Browser wallet" : c.name).slice(0, 32);
            return (
              <li key={c.uid}>
                <button
                  type="button"
                  ref={i === 0 ? (el) => { firstRow.current = el; } : undefined}
                  className="wl-row"
                  aria-busy={pending}
                  aria-disabled={(isPending && !pending) || isActive}
                  onClick={() => (isActive ? undefined : pick(c))}
                >
                  <WalletIcon name={name} icon={c.icon} />
                  <span className="wl-name">{name}</span>
                  <span className="wl-state">{pending ? "Confirm in your wallet…" : isActive ? "Connected" : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {list.length === 0 && settled && (
        <div className="wl-none">
          <p>No wallet found in this browser.</p>
          {touch ? (
            <a className="wl-link" href={`https://metamask.app.link/dapp/${typeof window !== "undefined" ? window.location.host + window.location.pathname : ""}`}>Open in the MetaMask app ↗</a>
          ) : (
            <p><a className="wl-link" href="https://metamask.io/download" target="_blank" rel="noopener noreferrer">Get MetaMask ↗</a> <a className="wl-link" href="https://rabby.io" target="_blank" rel="noopener noreferrer">Get Rabby ↗</a></p>
          )}
        </div>
      )}
      {list.length === 0 && !settled && <p className="wl-note" role="status">Looking for wallets…</p>}
      <p className="sr-only" role="status">{isPending ? "Confirm the request in your wallet." : ""}</p>
      {hint && isPending && <p className="wl-msg info">Request still open in your wallet. Approve or reject it there.</p>}
      {err && <p className={`wl-msg ${err.tone}`} role="alert">{err.text}</p>}
      <p className="asset-note">Testnet demo. Not a security, no real shares, no real value. Only connect a wallet you use for testing.</p>
    </>
  );
}

function AccountView({ onDone }: { onDone: () => void }) {
  const { address, connector, chainId } = useConnection();
  const { disconnect } = useDisconnect();
  const switchToArc = useSwitchToArc();
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (!address) return <p className="wl-note">Not connected.</p>;
  const onArc = chainId === arcTestnet.id;

  async function copy() {
    try {
      await navigator.clipboard.writeText(address!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMsg("Could not copy. Select the address and copy it manually.");
    }
  }
  async function fix() {
    setMsg(null);
    try {
      await switchToArc();
    } catch (e) {
      setMsg(isRejection(e) ? "Network switch cancelled." : ((e as Error).message ?? "Could not switch.").split("\n")[0].slice(0, 140));
    }
  }

  return (
    <div className="acct">
      <div className="acct-wallet"><WalletIcon name={connector?.name ?? "Wallet"} icon={connector?.icon} /><span>{(connector?.name ?? "Wallet").slice(0, 32)}</span></div>
      <div className="acct-addr" title={address}>{short(address)}<small>{address}</small></div>
      <div className="acct-actions">
        <button type="button" onClick={copy}>{copied ? "Copied" : "Copy address"}</button>
        <a className="btn-link" href={`${arcTestnet.blockExplorers.default.url}/address/${address}`} target="_blank" rel="noopener noreferrer">View on ArcScan ↗</a>
      </div>
      <p className="sr-only" role="status">{copied ? "Address copied" : ""}</p>
      <div className="acct-net">
        <span>Network</span>
        <b className={onArc ? "" : "warn"}>{onArc ? "Arc Testnet" : "Wrong network"}</b>
        {!onArc && <button type="button" className="primary" onClick={fix}>Switch to Arc</button>}
      </div>
      {msg && <p className="wl-msg err" role="alert">{msg}</p>}
      <button type="button" className="acct-out" onClick={() => { disconnect(); onDone(); }}>Disconnect</button>
    </div>
  );
}
