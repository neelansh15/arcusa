"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { ARC_CHAIN_ID } from "./config";
import { marketAbi, oracleAbi } from "./market";
import type { LiveAsset } from "./assets";
import { providersFor } from "./providers";
import { rankQuotes, simulateQuote, type ProviderQuote, type RawQuote, type Side } from "./provider-rank";

const DEBOUNCE_MS = 300;

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Quotes from every provider of this asset for the typed amount, ranked and the best one marked (ADR 0026).
 * Providers with a market get the real on-chain quote; simulated ones are calculated from the asset's oracle price.
 */
export function useProviderQuotes(asset: LiveAsset, side: Side, amountIn: string): { quotes: ProviderQuote[]; best: ProviderQuote | undefined } {
  const typed = useDebounced(amountIn, DEBOUNCE_MS);
  const providers = useMemo(() => providersFor(asset.ticker), [asset.ticker]);
  const inDec = side === "buy" ? 6 : 18;
  const outDec = side === "buy" ? 18 : 6;

  let parsed: bigint | null = null;
  try {
    parsed = typed && Number(typed) > 0 ? parseUnits(typed, inDec) : null;
  } catch {
    parsed = null;
  }

  const withMarket = providers.filter((p) => p.market);
  const oracle = useReadContract({ chainId: ARC_CHAIN_ID, address: asset.live.oracle, abi: oracleAbi, functionName: "latestRound", query: { refetchInterval: 5_000 } });
  const { data } = useReadContracts({
    allowFailure: true,
    query: { enabled: parsed !== null && withMarket.length > 0, refetchInterval: 5_000 },
    contracts: withMarket.map((p) => ({
      chainId: ARC_CHAIN_ID,
      address: p.market!.market,
      abi: marketAbi,
      functionName: side === "buy" ? ("quoteBuy" as const) : ("quoteSell" as const),
      args: [parsed ?? 0n] as const,
    })),
  });

  return useMemo(() => {
    const round = oracle.data ? (oracle.data as readonly [bigint, bigint, number, number, bigint, boolean]) : null;
    const oraclePrice = round ? Number(round[0]) / 1e8 : null;
    const updatedAt = round ? Number(round[1]) * 1000 : 0;
    const amount = parsed !== null ? Number(formatUnits(parsed, inDec)) : 0;

    const raw: RawQuote[] = providers.map((provider) => {
      const base = { provider, updatedAt };
      if (!round || oraclePrice === null) return { ...base, out: 0, price: 0, spreadBps: provider.spreadBps, status: "unavailable" as const };
      const stale = round[5];
      if (provider.market) {
        const i = withMarket.indexOf(provider);
        const r = parsed !== null ? data?.[i] : undefined;
        if (parsed !== null && r?.status !== "success") {
          // The market refuses to quote on a stale oracle, so a read error with a stale oracle is "stale", not broken.
          return { ...base, out: 0, price: 0, spreadBps: provider.spreadBps, status: stale ? ("stale" as const) : ("unavailable" as const) };
        }
        const res = r?.status === "success" ? (r.result as readonly [bigint, bigint, bigint, number]) : null;
        const out = res ? Number(formatUnits(res[0], outDec)) : 0;
        const price = out > 0 ? (side === "buy" ? amount / out : out / amount) : oraclePrice;
        return { ...base, out, price, spreadBps: res ? Number(res[2]) : provider.spreadBps, status: stale ? ("stale" as const) : ("ok" as const) };
      }
      const s = simulateQuote(provider, side, amount, oraclePrice);
      return { ...base, out: s.out, price: s.price, spreadBps: provider.spreadBps, status: stale ? ("stale" as const) : ("ok" as const) };
    });
    return rankQuotes(raw, side);
  }, [data, oracle.data, providers, withMarket, parsed, inDec, outDec, side]);
}
