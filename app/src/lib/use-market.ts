"use client";

import { formatUnits, parseUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { ARC_CHAIN_ID } from "./config";
import { marketAbi, oracleAbi } from "./market";
import type { LiveAsset } from "./assets";

export interface MarketState {
  oracle: { price: number; publishTime: number; session: number; age: number; stale: boolean } | null;
  bid: number | null;
  ask: number | null;
  spreadBps: number | null;
  inventory: { wnvda: number; usdc: number; flow: number; paused: boolean } | null;
  maxTradeUsdc: number | null;
  loading: boolean;
}

const POLL = { refetchInterval: 5_000 };

export function useMarket(asset: LiveAsset): MarketState {
  const ORACLE_ADDRESS = asset.live.oracle;
  const MARKET_ADDRESS = asset.live.market;
  const { data, isLoading } = useReadContracts({
    allowFailure: true,
    query: POLL,
    contracts: [
      { chainId: ARC_CHAIN_ID, address: ORACLE_ADDRESS, abi: oracleAbi, functionName: "latestRound" },
      { chainId: ARC_CHAIN_ID, address: MARKET_ADDRESS, abi: marketAbi, functionName: "inventory" },
      { chainId: ARC_CHAIN_ID, address: MARKET_ADDRESS, abi: marketAbi, functionName: "quoteBuy", args: [parseUnits("1", 6)] },
      { chainId: ARC_CHAIN_ID, address: MARKET_ADDRESS, abi: marketAbi, functionName: "quoteSell", args: [parseUnits("0.001", 18)] },
      { chainId: ARC_CHAIN_ID, address: MARKET_ADDRESS, abi: marketAbi, functionName: "maxTradeUsdc" },
    ],
  });

  const ok = <T,>(i: number) => (data?.[i]?.status === "success" ? (data[i].result as T) : null);
  const round = ok<readonly [bigint, bigint, number, number, bigint, boolean]>(0);
  const inv = ok<readonly [bigint, bigint, bigint, boolean]>(1);
  const qb = ok<readonly [bigint, bigint, bigint, number]>(2);
  const qs = ok<readonly [bigint, bigint, bigint, number]>(3);
  const max = ok<bigint>(4);

  return {
    oracle: round
      ? { price: Number(round[0]) / 1e8, publishTime: Number(round[1]), session: round[2], age: Number(round[4]), stale: round[5] }
      : null,
    ask: qb && qb[0] > 0n ? 1 / Number(formatUnits(qb[0], 18)) : null,
    bid: qs ? Number(formatUnits(qs[0], 6)) / 0.001 : null,
    spreadBps: qb ? Number(qb[2]) : null,
    inventory: inv
      ? { wnvda: Number(formatUnits(inv[0], 18)), usdc: Number(formatUnits(inv[1], 6)), flow: Number(formatUnits(inv[2], 6)), paused: inv[3] }
      : null,
    maxTradeUsdc: max === null ? null : Number(formatUnits(max, 6)),
    loading: isLoading,
  };
}

export function useQuote(asset: LiveAsset, side: "buy" | "sell", amount: string, decimals: number) {
  let parsed: bigint | null = null;
  try {
    parsed = amount && Number(amount) > 0 ? parseUnits(amount, decimals) : null;
  } catch {
    parsed = null;
  }
  const r = useReadContract({
    chainId: ARC_CHAIN_ID,
    address: asset.live.market,
    abi: marketAbi,
    functionName: side === "buy" ? "quoteBuy" : "quoteSell",
    args: [parsed ?? 0n],
    query: { enabled: parsed !== null, refetchInterval: 5_000, retry: false },
  });
  return { parsed, out: r.data ? (r.data as readonly [bigint, bigint, bigint, number])[0] : null, error: r.error, loading: r.isLoading };
}
