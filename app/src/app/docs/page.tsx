import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHead, Tag } from "@/components/docs/parts";
import { DOCS_FLAT } from "@/lib/docs-nav";

export const metadata: Metadata = { title: "Overview" };

export default function DocsOverview() {
  return (
    <>
      <PageHead
        eyebrow="Documentation"
        title="arcusa overview"
        lead="A stock terminal settled on Arc. Trade tokenized US equities against USDC, with the stock tokens coming from many chains."
      />

      <Callout kind="warn" title="Testnet demo">
        <p>
          Everything that runs today is on Arc testnet and Ethereum Sepolia. The stock token is a mock with no backing and no
          value. No real shares, no real money, not investment advice. See <Link href="/docs/risks">Risks</Link>.
        </p>
      </Callout>

      <h2>What arcusa is</h2>
      <p>
        arcusa is built so that people outside the US can get exposure to US stocks by holding USDC on Arc. You fund with USDC,
        and you buy or sell a tokenized stock on Arc at an oracle price, settled instantly in USDC.
      </p>
      <p>
        arcusa does not issue stock tokens. The design is that a stock-token provider (for example Ondo or xStocks) keeps its token
        on its home chain, arcusa locks it there, and a wrapped version is minted on Arc. See{" "}
        <Link href="/docs/bridge">Bridge</Link>.
      </p>

      <h2>The production goal</h2>
      <p>
        Tokenized US equities from many chains, brought onto Arc, and settled in USDC on Arc. Liquidity providers bring stock
        tokens in from wherever they live. Traders only ever need USDC on Arc.
      </p>
      <Callout kind="roadmap" title="Roadmap">
        <p>
          Multi-chain support is a goal and is not live. Today there is one stock (NVDA), one home chain (Ethereum Sepolia) and one
          settlement chain (Arc testnet). See the <Link href="/docs/contracts">planned chains</Link>.
        </p>
      </Callout>

      <h2>Live today versus roadmap</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Piece</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>PriceOracle and InventoryMarket</b></td>
              <td><Tag status="testnet" /></td>
              <td>Deployed on Arc testnet. A real buy and sell were made on-chain. <Link href="/docs/contracts/arc-testnet">Addresses</Link>.</td>
            </tr>
            <tr>
              <td><b>Price service and oracle relayer</b></td>
              <td><Tag status="testnet" /></td>
              <td>Run on our server. The relayer pushes the NVDA price to the oracle. <Link href="/docs/oracle">Oracle and price</Link>.</td>
            </tr>
            <tr>
              <td><b>Trading terminal</b></td>
              <td><Tag status="testnet" /></td>
              <td>Live quotes and inventory from the contracts; the ticket does approve then buy or sell. The repo notes it was not yet tested with a wallet in a browser.</td>
            </tr>
            <tr>
              <td><b>Lock-and-mint of mock NVDA</b></td>
              <td><Tag status="testnet" /></td>
              <td>Proven by script in both directions between Sepolia and Arc. The /bridge page in the app is not connected to it yet.</td>
            </tr>
            <tr>
              <td><b>Fast bridge transfers</b></td>
              <td><Tag status="unverified" /></td>
              <td>One attempt reverted in simulation for the mock token. Standard (slow) works.</td>
            </tr>
            <tr>
              <td><b>Real provider tokens (Ondo, xStocks)</b></td>
              <td><Tag status="roadmap" /></td>
              <td>Not tested. Whether a provider token can be locked by a contract we do not control is an open question.</td>
            </tr>
            <tr>
              <td><b>Mainnet and more chains</b></td>
              <td><Tag status="roadmap" /></td>
              <td>Ethereum mainnet, BNB Chain, Base, Solana and others. Nothing deployed.</td>
            </tr>
            <tr>
              <td><b>Indexer, automatic inventory rebalancing, audit, KYC</b></td>
              <td><Tag status="roadmap" /></td>
              <td>Post-MVP items in the plan. Not built.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Who it is for</h2>
      <ul>
        <li><b>Traders</b> hold USDC on Arc and trade against the market. No bridging needed.</li>
        <li><b>Liquidity providers</b> move stock tokens to Arc and deposit them, with USDC, as the inventory traders trade against.</li>
      </ul>

      <h2>Where to go next</h2>
      <div className="docs-cards">
        {DOCS_FLAT.filter((l) => l.href !== "/docs").map((l) => (
          <Link key={l.href} href={l.href} className="docs-card">
            <b>{l.title}</b>
            <span>{l.summary}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
