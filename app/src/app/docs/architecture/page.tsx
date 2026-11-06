import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/docs/parts";

export const metadata: Metadata = { title: "Architecture" };

export default function Architecture() {
  return (
    <>
      <PageHead
        eyebrow="Start"
        title="Architecture"
        lead="Two on-chain contracts on Arc, a small off-chain price pipeline, a Next.js app, and Circle's cross-chain token path for inventory."
      />

      <pre>
        <code>{`xStocks price API
      |  poll every 5s
      v
 price service (SQLite, /api/price, /api/candles)
      |  push if price moves >0.1% or every 60s
      v
 relayer ---> PriceOracle (Arc) ---> InventoryMarket (Arc) <--- trader (USDC)
                                          ^
        mNVDA (Sepolia) --lock--> wNVDA (Arc) deposited as inventory
                 Bridge Kit + Circle CCTPx`}</code>
      </pre>

      <h2>Contracts on Arc</h2>
      <ul>
        <li>
          <b>PriceOracle.</b> Holds the latest price, publish time and session. Only authorised relayers can update it. Guards reject
          non-positive prices, wide confidence, non-increasing publish times and moves above a per-update deviation cap.
        </li>
        <li>
          <b>InventoryMarket.</b> Holds USDC and wNVDA, quotes and executes buy and sell, applies spreads, caps and exposure limits. It
          has owner functions to deposit, withdraw, set parameters and pause.
        </li>
      </ul>
      <p>
        Addresses are on <Link href="/docs/contracts">Contracts</Link>. Sources are in <code>contracts/arc/src</code>, compiled with
        solc 0.8 (cancun, optimizer 200). A separate contract, the mock provider token mNVDA, lives on Sepolia in{" "}
        <code>contracts/sepolia/src</code>, with Foundry tests for its accounting.
      </p>

      <h2>Oracle and relayer</h2>
      <p>
        The relayer (<code>services/price/relayer.mjs</code>) is a small Node process. It reads the price service and calls{" "}
        <code>updatePrice</code> on the oracle. It is a trusted component: the oracle does not verify the price itself. Details are in{" "}
        <Link href="/docs/oracle">Oracle and price</Link>.
      </p>

      <h2>Price service</h2>
      <p>
        <code>services/price/server.mjs</code> polls the xStocks NVDAx price endpoint every 5 seconds, stores each tick with our receive
        time in SQLite, and serves <code>/api/price</code>, <code>/api/candles</code> and <code>/api/ticks</code>. It runs as a
        systemd unit behind Caddy. The upstream returns only a number with no timestamp and has no history API, which is why we ingest
        ticks ourselves.
      </p>

      <h2>App</h2>
      <p>
        A Next.js App Router app (TypeScript, wagmi and viem). It reads quotes, inventory and trades straight from the Arc contracts,
        reads the price from the price service for the chart, and sends buy and sell transactions from an injected wallet. When a
        wallet connects, the app moves it to Arc. The app also hosts the landing page, the <Link href="/bridge">bridge page</Link> and
        these docs.
      </p>

      <h2>Bridge</h2>
      <p>
        Inventory moves between Sepolia and Arc through Circle&apos;s cross-chain token service (CCTPx) using Bridge Kit, by token id. The
        library in <code>packages/bridge</code> wraps Bridge Kit behind typed ports and is tested against mocks. The /bridge page in the
        app has the full interface, but its client is still a stub that rejects, so it does not send transfers yet. See{" "}
        <Link href="/docs/bridge">Bridge</Link>.
      </p>

      <h2>Design records</h2>
      <p>
        Decisions are written as ADRs in <code>docs/adr</code> in the repository (asset model, bridging path, inventory market, price
        parity, compliance stance). Some early ADRs were superseded; the status line at the top of each says so.
      </p>
    </>
  );
}
