import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHead, Tag } from "@/components/docs/parts";

export const metadata: Metadata = { title: "Roadmap" };

export default function Roadmap() {
  return (
    <>
      <PageHead
        eyebrow="Reference"
        title="Roadmap"
        lead="Where the terminal and the bridge are heading. Everything below is roadmap unless it is marked done."
      />

      <Callout kind="roadmap" title="Roadmap, not product">
        <p>
          Nothing marked planned exists in the app today. The terminal trades one asset (mock wNVDA) against USDC on Arc testnet. This
          page follows the layout decision recorded in ADR 0018, which has status proposed.
        </p>
      </Callout>

      <h2>Terminal and bridge</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr><th>Item</th><th>Status</th><th>What it means</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Bridge page for liquidity providers</b></td>
              <td><Tag status="roadmap" /> <span className="docs-sub">Wired, untested in a browser</span></td>
              <td>
                Bridging has its own page at <Link href="/bridge">/bridge</Link>, framed for liquidity providers who top up inventory on
                Arc, not in the trader&apos;s terminal. The client now calls Bridge Kit through a connected browser wallet, but it has not been
                run in a browser yet. Transfers were proven with scripts; see <Link href="/docs/bridge">Bridge</Link>.
              </td>
            </tr>
            <tr>
              <td><b>Assets list</b></td>
              <td><Tag status="roadmap" /> <span className="docs-sub">Next</span></td>
              <td>
                A full-height list on the left of the chart. Live rows are the mock stocks wrapped on Arc (today wNVDA). Planned stocks
                are shown greyed out and cannot be selected. Selecting a live row switches the chart, ticket and market panel.
              </td>
            </tr>
            <tr>
              <td><b>Issuer selection and comparison</b></td>
              <td><Tag status="roadmap" /> <span className="docs-sub">Later</span></td>
              <td>
                Mostly in the right pane. A user picks among US stock token issuers for the same underlying and compares price, spread,
                depth and fees. It needs more than one issuer integrated, so it comes after the demo.
              </td>
            </tr>
            <tr>
              <td><b>Multi-chain sources</b></td>
              <td><Tag status="roadmap" /> <span className="docs-sub">Planned</span></td>
              <td>
                Stock tokens bridged to Arc from Ethereum, BNB Chain, Base and Solana. Only Ethereum Sepolia is used today. See the
                planned chains on the <Link href="/docs/contracts">contract index</Link>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What has to change first</h2>
      <ul>
        <li>
          The market, oracle and ticket code is single-asset. A multi-asset version needs a market and oracle address per asset in
          config rather than constants.
        </li>
        <li>Greyed-out rows will be labelled planned, not live. No claim is made about assets that have not shipped.</li>
        <li>
          Unverified: how many issuers can be listed on testnet, and whether each needs its own wrapper. The one-time wrapper cost per
          token is on <Link href="/docs/gas-costs">Gas costs</Link>.
        </li>
      </ul>
    </>
  );
}
