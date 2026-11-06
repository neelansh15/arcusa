"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import { ARC_CHAIN_ID, explorerTx } from "@/lib/config";
import type { LiveAsset } from "@/lib/assets";

interface Trade {
  hash: string;
  block: bigint;
  side: "Buy" | "Sell";
  nvda: number;
  usdc: number;
  price: number;
  trader: string;
}

const bought = parseAbiItem("event Bought(address trader, uint256 usdcIn, uint256 wnvdaOut, uint256 price, uint256 spreadBps, uint8 session)");
const sold = parseAbiItem("event Sold(address trader, uint256 wnvdaIn, uint256 usdcOut, uint256 price, uint256 spreadBps, uint8 session)");

export function Trades({ asset }: { asset: LiveAsset }) {
  const MARKET_ADDRESS = asset.live.market;
  const MARKET_DEPLOY_BLOCK = asset.live.marketDeployBlock;
  const client = usePublicClient({ chainId: ARC_CHAIN_ID });
  const [rows, setRows] = useState<Trade[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let alive = true;
    setRows(null);
    setErr(null);
    async function load() {
      try {
        const [b, s] = await Promise.all([
          client!.getLogs({ address: MARKET_ADDRESS, event: bought, fromBlock: MARKET_DEPLOY_BLOCK }),
          client!.getLogs({ address: MARKET_ADDRESS, event: sold, fromBlock: MARKET_DEPLOY_BLOCK }),
        ]);
        const all: Trade[] = [
          ...b.map((l) => {
            const nvda = Number(formatUnits(l.args.wnvdaOut!, 18));
            const usdc = Number(formatUnits(l.args.usdcIn!, 6));
            return { hash: l.transactionHash, block: l.blockNumber, side: "Buy" as const, nvda, usdc, price: usdc / nvda, trader: l.args.trader! };
          }),
          ...s.map((l) => {
            const nvda = Number(formatUnits(l.args.wnvdaIn!, 18));
            const usdc = Number(formatUnits(l.args.usdcOut!, 6));
            return { hash: l.transactionHash, block: l.blockNumber, side: "Sell" as const, nvda, usdc, price: usdc / nvda, trader: l.args.trader! };
          }),
        ].sort((x, y) => Number(y.block - x.block));
        if (alive) setRows(all.slice(0, 50));
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message.slice(0, 100) : "error");
      }
    }
    load();
    const id = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [client, MARKET_ADDRESS, MARKET_DEPLOY_BLOCK]);

  if (err) return <div className="neg small">{err}</div>;
  if (!rows) return <div className="muted small">Loading trades…</div>;
  if (!rows.length) return <div className="muted small">No trades yet.</div>;
  return (
    <table className="tbl">
      <thead>
        <tr><th>Side</th><th className="r">Price</th><th className="r">{asset.live.token.symbol}</th><th className="r">USDC</th><th>Trader</th><th>Tx</th></tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.hash + t.side}>
            <td className={t.side === "Buy" ? "pos" : "neg"}>{t.side}</td>
            <td className="r">${t.price.toFixed(2)}</td>
            <td className="r">{t.nvda.toFixed(6)}</td>
            <td className="r">{t.usdc.toFixed(2)}</td>
            <td className="muted">{t.trader.slice(0, 6)}…{t.trader.slice(-4)}</td>
            <td><a href={explorerTx(ARC_CHAIN_ID, t.hash)} target="_blank" rel="noreferrer">{t.hash.slice(0, 8)}…</a></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
