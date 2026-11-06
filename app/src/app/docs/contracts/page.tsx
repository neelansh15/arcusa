import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHead, PlannedTable, Tag } from "@/components/docs/parts";
import { ARC_CONTRACTS, ARC_TESTNET, ETH_SEPOLIA, PLANNED_CHAINS, SEPOLIA_CONTRACTS } from "@/lib/docs-contracts";

export const metadata: Metadata = { title: "Contracts" };

export default function ContractsIndex() {
  return (
    <>
      <PageHead
        eyebrow="Contracts"
        title="Contract index"
        lead="Where arcusa is deployed. Every address in these docs comes from the repository and was compared against its source."
      />

      <Callout kind="warn" title="Testnet only">
        <p>
          Nothing is deployed on any mainnet. Testnet tokens, including the mock NVDA, have no value. Do not send real funds to any
          address on these pages.
        </p>
      </Callout>

      <h2>Deployed chains</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Chain</th>
              <th>Chain ID</th>
              <th>Status</th>
              <th>Contracts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><Link href="/docs/contracts/arc-testnet"><b>{ARC_TESTNET.name}</b></Link></td>
              <td>{ARC_TESTNET.chainId}</td>
              <td><Tag status="testnet" /></td>
              <td>{ARC_CONTRACTS.length} listed (PriceOracle, InventoryMarket, wNVDA and the Circle and Arc contracts they rely on)</td>
            </tr>
            <tr>
              <td><Link href="/docs/contracts/ethereum-sepolia"><b>{ETH_SEPOLIA.name}</b></Link></td>
              <td>{ETH_SEPOLIA.chainId}</td>
              <td><Tag status="testnet" /></td>
              <td>{SEPOLIA_CONTRACTS.length} listed (mock mNVDA and the Circle contracts that lock it)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Planned chains</h2>
      <p>
        These are roadmap items. <b>None of them is deployed.</b> They are listed so the direction is clear, not because anything
        exists there.
      </p>
      <PlannedTable rows={PLANNED_CHAINS} />

      <h2>Gas costs</h2>
      <p>
        Gas used by the wrapper creation, the bridging legs and the market contract transactions is on{" "}
        <Link href="/docs/gas-costs">Gas costs</Link>.
      </p>

      <h2>How addresses were checked</h2>
      <ul>
        <li>Each address was compared with <code>deployments/arc-testnet.json</code>, <code>app/src/lib/config.ts</code>, <code>app/src/lib/market.ts</code> and <code>LOG.md</code>. The source is shown next to every row.</li>
        <li>Explorer links assume the standard <code>/address/</code> and <code>/tx/</code> paths. Only the <code>/tx/</code> path is used by the app itself; the <code>/address/</code> path was not opened.</li>
        <li>Rows owned by Circle or Arc are third-party contracts that arcusa uses and does not control.</li>
        <li>Anything not recorded in the repository is marked as such instead of guessed.</li>
      </ul>
    </>
  );
}
