"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet } from "@/lib/config";
import { SiteNav } from "./site-nav";
import { ThemeToggle } from "./theme-toggle";
import { Toast, type ToastMsg } from "./toast";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function Header({ extra }: { extra?: ReactNode }) {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const chainId = useChainId();
  const { connect, isPending, error, reset: resetConnect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, error: switchError, reset: resetSwitch } = useSwitchChain();
  const [toast, setToast] = useState<ToastMsg | null>(null);

  async function switchTo(id: typeof arcTestnet.id) {
    try {
      await switchChainAsync({ chainId: id });
    } catch (e) {
      // Wallets that don't know Arc: add it explicitly, then retry.
      if (id === arcTestnet.id && window.ethereum) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${arcTestnet.id.toString(16)}`,
              chainName: arcTestnet.name,
              nativeCurrency: arcTestnet.nativeCurrency,
              rpcUrls: arcTestnet.rpcUrls.default.http,
              blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
            },
          ],
        });
      } else {
        throw e;
      }
    }
  }

  const onArc = (walletChainId ?? chainId) === arcTestnet.id;
  const msg = [error?.message, switchError?.message].find((m) => m && !/reject|denied/i.test(m));

  // Wallet errors are shown as a toast, not inline in the header. They clear once the wallet is connected.
  useEffect(() => {
    if (isConnected) {
      setToast(null);
      resetConnect();
      return;
    }
    if (!msg) return;
    const pending = /already pending|-32002/i.test(msg);
    setToast({
      id: Date.now(), kind: "err",
      title: pending ? "Wallet request already open" : "Wallet error",
      text: pending ? "Open your wallet extension and approve or reject the pending request, then try again." : msg.split("\n")[0].slice(0, 140),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg, isConnected]);

  useEffect(() => {
    if (isConnected && onArc) resetSwitch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, onArc]);

  // Users only ever need Arc: move the wallet there as soon as it connects.
  useEffect(() => {
    if (isConnected && walletChainId !== undefined && walletChainId !== arcTestnet.id) switchTo(arcTestnet.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, walletChainId]);

  return (
    <header className="header">
      <div className="brand">
        <Link href="/" className="logo"><i />arcusa</Link>
      </div>
      <SiteNav className="nav" />
      <div className="header-right">
        <span className="badge net">Arc Testnet</span>
        <span className="badge warn" title="Off-hours demo mode: indicative price, testnet only">DEMO</span>
        {extra}
        <ThemeToggle />
        {isConnected && !onArc && <button onClick={() => switchTo(arcTestnet.id).catch(() => {})}>Switch to Arc</button>}
        {isConnected && address ? (
          <button className="wallet" onClick={() => disconnect()} title="Disconnect"><i />{short(address)}</button>
        ) : (
          <button className="primary" disabled={isPending} onClick={() => connect({ connector: injected() })}>
            {isPending ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </header>
  );
}

declare global {
  interface Window {
    ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
  }
}
