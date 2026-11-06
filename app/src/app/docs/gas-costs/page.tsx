import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHead, Short } from "@/components/docs/parts";

export const metadata: Metadata = { title: "Gas costs" };

const SEPOLIA_TX = "https://sepolia.etherscan.io/tx/";

const REGISTER = "0x3b946d738e4db14994bda7037e180f33d9e9bd0bb973b0931367194799b5e1bc";
const DEPLOY_REMOTE = "0x4fd4052e56e5b9d38a178cc0d612715a4770db311195e1daaf71cec552b58cc0";
const MOCK_DEPLOY = "0xb138a26cd1213dd6a8e7320fc87fd995e7b0d9f963c8de4d3f600d4d21342337";

function SepoliaTx({ hash }: { hash: string }) {
  return (
    <a className="docs-addr" href={`${SEPOLIA_TX}${hash}`} target="_blank" rel="noreferrer">
      <Short hash={hash} />
    </a>
  );
}

export default function GasCosts() {
  return (
    <>
      <PageHead
        eyebrow="Guides"
        title="Gas costs"
        lead="Gas used by the main contract transactions: creating the wrapper token, bridging, and the market contracts."
      />

      <Callout kind="note" title="How this was measured">
        <p>
          Measured on 2026-11-06 from the receipts of the deployer wallet{" "}
          <code>0x07621e39424914f633D478DdE751f3FF728CB351</code>. Gas used is exact. Fees in wei are testnet-specific: Sepolia gas was
          about 20 wei, so ETH fees there are near zero and only the gas units and fixed fees carry over to mainnet. Arc charges gas in
          USDC. Sources: Sepolia receipts via eth-sepolia.blockscout.com, Arc receipts via testnet.arcscan.app, and the project log.
        </p>
      </Callout>

      <h2>1. Creating the wrapper token (one-time per token)</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr><th>Step</th><th>Chain</th><th>Tx</th><th>Gas used</th></tr>
          </thead>
          <tbody>
            <tr><td><code>registerOwnerlessToken</code></td><td>Sepolia</td><td><SepoliaTx hash={REGISTER} /></td><td>2,515,786</td></tr>
            <tr><td><code>deployRemoteOwnerlessToken</code> (creates wNVDA on Arc)</td><td>Sepolia</td><td><SepoliaTx hash={DEPLOY_REMOTE} /></td><td>305,443</td></tr>
          </tbody>
        </table>
      </div>
      <ul>
        <li>Total: about 2.82M gas on the source chain.</li>
        <li>
          Fixed fee: the deploy transaction carries a signed quote from Circle&apos;s Iris API of 142,720,395,729,835 wei (0.00014272
          ETH). It does not depend on gas price.
        </li>
        <li>The Arc side of the deployment needed no transaction from us.</li>
        <li>
          Not part of production cost: deploying the mock mNVDA token (4,742,009 gas, <SepoliaTx hash={MOCK_DEPLOY} />) and minting it
          (241,011 gas). A real token already exists.
        </li>
        <li>
          Result: wNVDA on Arc at <code>0x5ad2862787d5C7F42a09014CE4C973d162878a16</code>. See{" "}
          <Link href="/docs/contracts/arc-testnet">Arc testnet contracts</Link>.
        </li>
      </ul>

      <h2>2. Bridging tokens (cost is per transfer, not per amount)</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr><th>Leg</th><th>Step</th><th>Tx</th><th>Gas used</th><th>Fee</th></tr>
          </thead>
          <tbody>
            <tr><td>Sepolia to Arc (lock)</td><td>approve (first approval)</td><td><code>0xa23dddd0…2fc557</code></td><td>128,309</td><td>About 0 on testnet</td></tr>
            <tr><td>Sepolia to Arc (lock)</td><td>approve</td><td><code>0xb771e0a6…a1ebbf</code></td><td>20,389</td><td>About 0 on testnet</td></tr>
            <tr><td>Sepolia to Arc (lock)</td><td><code>crossChainTransfer</code></td><td><code>0xd5deba9d…495b06</code></td><td>445,229</td><td>8,459,351 wei (testnet)</td></tr>
            <tr><td>Arc to Sepolia (burn)</td><td>approve</td><td><code>0xdb41d721…</code></td><td>44,197</td><td>0.00089 USDC</td></tr>
            <tr><td>Arc to Sepolia (burn)</td><td><code>crossChainTransfer</code></td><td><code>0x459d52fa…</code></td><td>354,297</td><td>0.00713 USDC</td></tr>
          </tbody>
        </table>
      </div>
      <p className="docs-sub">
        Transaction hashes in this table are shortened in the source measurements and are shown as recorded, without explorer links.
      </p>
      <ul>
        <li>
          Rule of thumb for a top-up from Ethereum: about 0.45M gas per transfer plus an approve (20k, or 128k on a first-ever approval).
          At 1 gwei that is about 0.00045 ETH. This is an estimate, not a measurement on mainnet.
        </li>
        <li>Arc legs cost under one cent in USDC.</li>
        <li>The destination mint is paid by the forwarder (<code>useForwarder: true</code>).</li>
        <li>
          Not captured: Circle&apos;s forwarding fee for the mNVDA legs. Bridge Kit returned <code>fees: null</code>. The earlier USDC
          bridge test cost about 0.017 USDC per 1 USDC transfer, which is the closest reference.
        </li>
        <li>
          Standard (SLOW) transfers take about 16 minutes Sepolia to Arc and about 28 seconds Arc to Sepolia. Fast reverted in
          simulation and is untested. See <Link href="/docs/bridge">Bridge</Link>.
        </li>
      </ul>

      <h2>3. Market contract transactions on Arc testnet</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr><th>Action</th><th>Gas used</th><th>Fee (USDC)</th></tr>
          </thead>
          <tbody>
            <tr><td>Deploy <code>PriceOracle</code></td><td>959,335</td><td>0.0201</td></tr>
            <tr><td>Deploy <code>InventoryMarket</code></td><td>1,671,971</td><td>0.0351</td></tr>
            <tr><td><code>setRelayer</code></td><td>47,904</td><td>0.0010</td></tr>
            <tr><td><code>deposit</code> (owner, USDC)</td><td>59,838</td><td>0.0013</td></tr>
            <tr><td><code>deposit</code> (owner, wNVDA)</td><td>106,363</td><td>0.0022</td></tr>
            <tr><td><code>buy</code></td><td>157,186</td><td>0.0033</td></tr>
            <tr><td><code>sell</code></td><td>139,824</td><td>0.0029</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Arc enforces a 20 gwei fee floor, so these fees are representative of real-world cost on Arc. Transaction hashes for these
        actions are not recorded here, so no explorer links are given. Deployed addresses are on <Link href="/docs/contracts/arc-testnet">Arc testnet</Link>.
      </p>

      <h2>Not measured</h2>
      <ul>
        <li>Mainnet gas prices and the Circle forwarding fee for non-USDC tokens.</li>
        <li>Gas for oracle price pushes by the relayer (it pushes when the price moves more than 0.1%, or every 60 seconds).</li>
      </ul>
    </>
  );
}
