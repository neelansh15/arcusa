"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useChainId, useConnection } from "wagmi";
import { arcTestnet } from "@/lib/config";
import { isRejection, useSwitchToArc } from "@/lib/use-switch-to-arc";
import { Logo } from "./landing/graphics";
import { NavMenu } from "./nav-menu";
import { SiteNav } from "./site-nav";
import { ThemeToggle } from "./theme-toggle";
import { Toast, type ToastMsg } from "./toast";
import { useWalletModal } from "./wallet-modal";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function Header({ extra }: { extra?: ReactNode }) {
  const { address, isConnected, chainId: walletChainId, status } = useConnection();
  const chainId = useChainId();
  const { openConnect, openAccount } = useWalletModal();
  const switchToArc = useSwitchToArc();
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function switchTo() {
    try {
      await switchToArc();
    } catch (e) {
      // A declined switch is silent: the "Switch to Arc" control stays. Anything else is shown.
      if (!isRejection(e)) setToast({ id: Date.now(), kind: "err", title: "Could not switch network", text: ((e as Error).message ?? "").split("\n")[0].slice(0, 140) });
    }
  }

  const onArc = (walletChainId ?? chainId) === arcTestnet.id;

  // Users only ever need Arc: move the wallet there as soon as it connects.
  useEffect(() => {
    if (isConnected && walletChainId !== undefined && walletChainId !== arcTestnet.id) switchTo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, walletChainId]);

  // Before mount, and while the wallet reconnects after a reload, show a neutral placeholder instead of flashing "Connect wallet".
  const settling = !mounted || status === "reconnecting";

  return (
    <header className="header">
      <div className="brand">
        <Link href="/" className="logo" aria-label="arcusa home"><Logo size={30} /><span>arcusa</span></Link>
      </div>
      <SiteNav className="nav" />
      <div className="header-right">
        <span className="badge net"><span className="full">Arc Testnet</span><span className="short">Testnet</span></span>
        <span className="badge warn demo" title="Off-hours demo mode: indicative price, testnet only">DEMO</span>
        {extra}
        <ThemeToggle />
        {isConnected && !onArc && <button onClick={switchTo}>Switch to Arc</button>}
        {settling ? (
          <button className="wallet" disabled aria-label="Checking wallet"><i />…</button>
        ) : isConnected && address ? (
          <button className="wallet" onClick={openAccount} aria-haspopup="dialog"><i />{short(address)}</button>
        ) : (
          <button className="primary" onClick={openConnect} aria-haspopup="dialog">Connect wallet</button>
        )}
        <NavMenu>
          <p className="menu-status"><span className="badge net">Arc Testnet</span><span className="badge warn">DEMO</span><small>Indicative prices, no real money.</small></p>
        </NavMenu>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </header>
  );
}
