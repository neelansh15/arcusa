import type { Metadata } from "next";
import { Callout, PageHead } from "@/components/docs/parts";

export const metadata: Metadata = { title: "Risks" };

export default function RisksDocs() {
  return (
    <>
      <PageHead
        eyebrow="Reference"
        title="Risks"
        lead="arcusa is a testnet demo. This page lists what can go wrong and what has not been checked."
      />

      <Callout kind="warn" title="Not a security, not advice">
        <p>
          The tokens in the demo are not shares, are not backed by or redeemable for real shares, and have no monetary value. Nothing
          here is investment advice. No legal or compliance review has been done.
        </p>
      </Callout>

      <h2>Testnet mock tokens</h2>
      <ul>
        <li>mNVDA is a mock with a public faucet (100 per call, once a day per address). It has no issuer, no backing and no allowlist or pause.</li>
        <li>wNVDA is only a wrapper of that mock. Its value is whatever the demo says it is.</li>
        <li>Real provider tokens usually have allowlists, geo-limits or pauses. Whether a contract we do not control can hold and lock them is untested.</li>
      </ul>

      <h2>Oracle trust</h2>
      <ul>
        <li>The price comes from one public endpoint through one relayer. The relayer is trusted; the oracle cannot verify the price.</li>
        <li>If the relayer stops, the price goes stale. In demo mode the market keeps trading at the last price.</li>
        <li>A trader who sees a real move before the oracle updates can trade against the stale price. Spread, caps and the update cadence bound this; they do not remove it.</li>
        <li>A provider token can trade away from the stock price. The market prices off the stock quote, so that gap is not captured.</li>
      </ul>

      <h2>Inventory limits</h2>
      <ul>
        <li>The market is the counterparty. Whoever supplied the inventory carries the price risk.</li>
        <li>One-way flow can empty one side. Trades then revert with an inventory error, or hit the minimum-inventory and exposure limits.</li>
        <li>Refilling inventory is manual. An automatic rebalancer is not built.</li>
        <li>Moving inventory into Arc takes about 16 minutes on the one test we ran, so a refill is not instant.</li>
      </ul>

      <h2>Off-hours trading</h2>
      <ul>
        <li>Outside US regular hours the market only trades in demo mode, at the last price with a 2% spread by default. Prices are then indicative, not live.</li>
        <li>The relayer does not model holidays or extended hours, so those periods are treated as closed.</li>
        <li>Demo mode is a flag for the demo and should be off in production.</li>
      </ul>

      <h2>Bridge</h2>
      <ul>
        <li>Fast transfers failed in simulation for the mock token. Only Standard has worked.</li>
        <li>The token managers are owned by an address we do not control and could not identify.</li>
        <li>The /bridge page does not send transfers yet; the tested transfers were run with scripts.</li>
      </ul>

      <h2>Not audited, not fully tested</h2>
      <ul>
        <li>The contracts have <b>not been audited</b>.</li>
        <li>The Arc contracts were exercised on-chain with one buy and one sell. The log lists pause, owner withdraw, caps and slippage reverts as not tested, and the repo does not show a passing unit test suite for them.</li>
        <li>The order ticket was not yet tested with a wallet in a browser at the time of the last log entry.</li>
        <li>Foundry tests exist for the mock token and its lock-and-mint accounting on Sepolia; results are not recorded in the log.</li>
        <li>The relayer and deployer keys are throwaway testnet keys on our server. Anything that matters would need real key management.</li>
      </ul>

      <h2>Compliance</h2>
      <p>
        A production version would need the stock-token provider&apos;s agreement, a holder that meets the provider&apos;s restrictions,
        KYC and AML, sanctions screening, geo-restrictions, and handling of Arc&apos;s USDC blocklist and Circle&apos;s token denylist. None
        of that is built.
      </p>
    </>
  );
}
