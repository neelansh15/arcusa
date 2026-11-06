"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet } from "@/lib/config";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function Header() {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const chainId = useChainId();
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, error: switchError } = useSwitchChain();

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

  // Users only ever need Arc: move the wallet there as soon as it connects.
  useEffect(() => {
    if (isConnected && walletChainId !== undefined && walletChainId !== arcTestnet.id) switchTo(arcTestnet.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, walletChainId]);

  return (
    <header className="header">
      <div className="brand">
        <Link href="/" className="logo"><i />arcusa</Link>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/trade" className="on">Trade</Link>
        </nav>
        <span className="badge net">Arc Testnet</span>
        <span className="badge warn" title="Off-hours demo mode: indicative price, testnet only">DEMO</span>
      </div>
      <div className="header-right">
        {msg && <span className="neg small">{msg.slice(0, 80)}</span>}
        {isConnected && !onArc && <button onClick={() => switchTo(arcTestnet.id).catch(() => {})}>Switch to Arc</button>}
        {isConnected && address ? (
          <button className="wallet" onClick={() => disconnect()} title="Disconnect"><i />{short(address)}</button>
        ) : (
          <button className="primary" disabled={isPending} onClick={() => connect({ connector: injected() })}>
            {isPending ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </header>
  );
}

declare global {
  interface Window {
    ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
  }
}
