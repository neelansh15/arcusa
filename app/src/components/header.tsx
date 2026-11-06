"use client";

import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet, sepolia } from "@/lib/config";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function Header() {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const chainId = useChainId();
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, error: switchError } = useSwitchChain();

  async function switchTo(id: typeof arcTestnet.id | typeof sepolia.id) {
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

  const active = walletChainId ?? chainId;
  const msg = error?.message ?? switchError?.message;

  return (
    <header className="header">
      <div className="brand">
        <b>arcusa</b>
        <span className="muted">NVDA / USDC</span>
        <span className="badge warn" title="Off-hours demo mode: indicative price, testnet only">
          OFF-HOURS DEMO
        </span>
      </div>
      <div className="header-right">
        {msg && <span className="neg small">{msg.slice(0, 80)}</span>}
        {isConnected && (
          <div className="seg">
            {[arcTestnet, sepolia].map((c) => (
              <button
                key={c.id}
                className={active === c.id ? "on" : ""}
                onClick={() => switchTo(c.id).catch(() => {})}
              >
                {c.id === arcTestnet.id ? "Arc" : "Sepolia"}
              </button>
            ))}
          </div>
        )}
        {isConnected && address ? (
          <button onClick={() => disconnect()}>{short(address)}</button>
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
