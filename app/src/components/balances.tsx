"use client";

import { erc20Abi, formatUnits } from "viem";
import { useConnection, useReadContracts } from "wagmi";
import { ARC_CHAIN_ID, ARC_USDC } from "@/lib/config";
import type { LiveAsset } from "@/lib/assets";

export function useBalances(asset: LiveAsset) {
  const { address } = useConnection();
  const { data, isLoading, error } = useReadContracts({
    allowFailure: true,
    query: { enabled: !!address, refetchInterval: 8_000 },
    contracts: [
      { chainId: ARC_CHAIN_ID, address: ARC_USDC.address, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { chainId: ARC_CHAIN_ID, address: asset.live.token.address, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
    ],
  });
  const n = (i: number, d: number) => (data?.[i]?.status === "success" ? Number(formatUnits(data[i].result as bigint, d)) : null);
  return { usdc: n(0, 6), nvda: n(1, 18), isLoading, error };
}

export function Balances({ usdc, nvda, quote, symbol }: { usdc: number | null; nvda: number | null; quote: number | null; symbol: string }) {
  const { isConnected } = useConnection();
  if (!isConnected) return <div className="muted small">Connect a wallet to see balances.</div>;
  const nv = nvda !== null && quote ? nvda * quote : null;
  return (
    <table className="tbl">
      <thead><tr><th>Asset</th><th className="r">Balance</th><th className="r">Value (USD)</th></tr></thead>
      <tbody>
        <tr><td>USDC</td><td className="r">{usdc === null ? "—" : usdc.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td><td className="r">{usdc === null ? "—" : `$${usdc.toFixed(2)}`}</td></tr>
        <tr><td>{symbol}</td><td className="r">{nvda === null ? "—" : nvda.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td><td className="r">{nv === null ? "—" : `$${nv.toFixed(2)}`}</td></tr>
        <tr className="total"><td>Total</td><td /><td className="r">{usdc === null || nv === null ? "—" : `$${(usdc + nv).toFixed(2)}`}</td></tr>
      </tbody>
    </table>
  );
}
