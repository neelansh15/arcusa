import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHead, Tag } from "@/components/docs/parts";

export const metadata: Metadata = { title: "Bridge" };

export default function BridgeDocs() {
  return (
    <>
      <PageHead
        eyebrow="Guides"
        title="Bridge"
        lead="How stock tokens get onto Arc. Built on Circle CCTP for non-USDC assets and Bridge Kit, as lock-and-mint."
      />

      <h2>Who it is for</h2>
      <p>
        The bridge is for <b>liquidity providers</b> moving inventory between Ethereum Sepolia and Arc. Traders do not need it: they
        hold USDC on Arc and trade against the market. The <Link href="/bridge">/bridge page</Link> is the interface for providers.
      </p>

      <h2>Lock and mint</h2>
      <p>
        arcusa does not issue the stock token. The token stays on its home chain and is locked there; a wrapped version is minted on
        Arc.
      </p>
      <ul>
        <li>
          <b>Sepolia to Arc:</b> mNVDA is locked in the token manager on Sepolia and wNVDA is minted on Arc.
        </li>
        <li>
          <b>Arc to Sepolia:</b> wNVDA is burned on Arc and mNVDA is unlocked on Sepolia.
        </li>
      </ul>
      <p>
        Supply on Arc is therefore backed one-to-one by locked tokens. After a round trip in testing, locked mNVDA and wNVDA supply
        matched (5 and 5). The mock token mNVDA stands in for a provider token; see <Link href="/docs/risks">Risks</Link>.
      </p>

      <h2>How it is set up</h2>
      <ol>
        <li>Deploy the token on its home chain (mNVDA on Sepolia).</li>
        <li>
          Register it with Circle&apos;s cross-chain token service as an ownerless token (<code>registerOwnerlessToken</code>). This was
          permissionless on testnet; the transaction was sent by an account that does not control the token.
        </li>
        <li>
          Deploy the Arc wrapper with <code>deployRemoteOwnerlessToken</code>. This is one-time per token and took about 23 minutes in
          our run, dominated by Sepolia finality.
        </li>
        <li>Transfer with Bridge Kit, passing the bytes32 token id.</li>
      </ol>
      <pre>
        <code>{`kit.bridge({
  from: { adapter, chain: "Ethereum_Sepolia" },
  to: { chain: "Arc_Testnet", recipientAddress, useForwarder: true },
  amount: "10",
  token: tokenId,
  config: { feePayment: "source", transferSpeed: "SLOW" },
})`}</code>
      </pre>

      <h2>Timings measured</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr><th>Leg</th><th>Mode</th><th>Time</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Sepolia to Arc, 10 mNVDA</td><td>Standard (SLOW)</td><td>965 s, about 16 min</td><td><Tag status="testnet" /></td></tr>
            <tr><td>Arc to Sepolia, 5 wNVDA</td><td>Standard (SLOW)</td><td>28 s</td><td><Tag status="testnet" /></td></tr>
            <tr><td>Both directions</td><td>Fast (FAST)</td><td>Reverted in simulation</td><td><Tag status="unverified" /></td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Into Arc is slow because it waits for Sepolia finality; out of Arc is fast because Arc finalises quickly. Each run was a
        single test, so treat the numbers as indicative.
      </p>

      <Callout kind="warn" title="Fast transfers are not working yet">
        <p>
          Bridge Kit defaults to FAST. With FAST, the transfer step reverted in simulation on both chains for mNVDA, with no revert
          reason. The likely cause is that Fast needs a quote item that is not configured for this token, but that is not proven. The
          app is set to SLOW and Fast should be treated as untested.
        </p>
      </Callout>

      <h2>USDC bridge-in</h2>
      <p>
        Separately from stock tokens, plain USDC can be bridged from Sepolia to Arc with Bridge Kit&apos;s Forwarding Service, so the
        recipient needs no Arc gas. In a test, 1 USDC arrived in 43 seconds and cost about 0.017 USDC on the source chain.
      </p>

      <Callout kind="roadmap" title="Status of the /bridge page">
        <p>
          The page shows the direction control, amount, estimated time and a step timeline with transaction links. Its client is a stub
          that rejects the request, so it does not send transfers yet. The transfers above were run with scripts in{" "}
          <code>contracts/scripts/spikes</code>. Running Bridge Kit inside a browser bundle is also unverified.
        </p>
      </Callout>

      <h2>Limits</h2>
      <ul>
        <li>The token managers have no operator and effectively unlimited rate limit and max transfer (read on testnet; the getters are not in Circle&apos;s reference page and could change).</li>
        <li>Both managers have an owner address that is not an arcusa wallet. Who controls it is unconfirmed.</li>
        <li>Right after registering a token, one public RPC returned <code>TokenNotRegistered</code> for several minutes. Scripts should retry.</li>
      </ul>
    </>
  );
}
