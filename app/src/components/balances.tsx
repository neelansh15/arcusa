"use client";

import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { ARC_CHAIN_ID, ARC_USDC, WNVDA } from "@/lib/config";

export function Balances({ quote }: { quote: number | null }) {
  const { address, isConnected } = useAccount();
  const { data, isLoading, error } = useReadContracts({
    allowFailure: true,
    query: { enabled: !!address, refetchInterval: 15_000 },
    contracts: [
      { chainId: ARC_CHAIN_ID, address: ARC_USDC.address, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { chainId: ARC_CHAIN_ID, address: WNVDA.address, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
    ],
  });

  const fmt = (r: { status: string; result?: unknown } | undefined, decimals: number) =>
    r?.status === "success" ? Number(formatUnits(r.result as bigint, decimals)) : null;
  const usdc = fmt(data?.[0], ARC_USDC.decimals);
  const nvda = fmt(data?.[1], WNVDA.decimals);

  return (
    <section className="panel">
      <h2>Balances (Arc)</h2>
      {!isConnected ? (
        <div className="muted small">Connect a wallet to read balances.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Asset</th><th className="r">Balance</th><th className="r">Value</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>USDC</td>
              <td className="r">{usdc === null ? (isLoading ? "…" : "—") : usdc.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
              <td className="r">{usdc === null ? "—" : `$${usdc.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td>wNVDA</td>
              <td className="r">{nvda === null ? (isLoading ? "…" : "—") : nvda.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
              <td className="r">{nvda === null || !quote ? "—" : `$${(nvda * quote).toFixed(2)}`}</td>
            </tr>
          </tbody>
        </table>
      )}
      {error && <div className="neg small">{error.message.slice(0, 100)}</div>}
    </section>
  );
}
