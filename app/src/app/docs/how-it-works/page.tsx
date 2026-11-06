import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHead } from "@/components/docs/parts";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorks() {
  return (
    <>
      <PageHead
        eyebrow="Start"
        title="How it works"
        lead="An oracle-priced inventory market: the contract holds USDC and wNVDA, and trades with you at the oracle price plus or minus a spread."
      />

      <h2>The trade flow</h2>
      <ol>
        <li>You hold USDC on Arc. USDC is also Arc gas, so there is nothing else to fund.</li>
        <li>The terminal reads a quote from the InventoryMarket contract: price, spread, session and the amount you would get.</li>
        <li>
          <b>Buy:</b> you approve USDC, then call <code>buy(usdcIn, minWnvdaOut)</code>. You pay USDC and receive wNVDA at the ask.
        </li>
        <li>
          <b>Sell:</b> you approve wNVDA, then call <code>sell(wnvdaIn, minUsdcOut)</code>. You pay wNVDA and receive USDC at the bid.
        </li>
        <li>Both are a single transaction on Arc. The terminal sets 1% slippage protection through the min-out argument.</li>
      </ol>

      <h2>Why an inventory market</h2>
      <p>
        arcusa does not mint stock exposure. All wNVDA comes from locking a provider token on its home chain, which is too slow to do
        per trade (about 16 minutes into Arc, see <Link href="/docs/bridge">Bridge</Link>). So inventory is moved to Arc ahead of time
        and the contract trades against it. The design record is ADR 0014 in the repo.
      </p>
      <p>
        The trade-off: the market is the counterparty to every trade. Whoever owns the inventory carries the price risk, and the
        market can run out of one side. A sold-out state is a normal outcome, not a failure.
      </p>

      <h2>Pricing</h2>
      <pre>
        <code>{`ask (you buy)  = oracle price x (1 + spread)
bid (you sell) = oracle price x (1 - spread)`}</code>
      </pre>
      <p>
        The oracle price is USD per whole token with 8 decimals. USDC has 6 decimals and wNVDA has 18; the contract handles the
        conversion and rounds in the pool's favour. See <Link href="/docs/oracle">Oracle and price</Link> for where the price comes from.
      </p>

      <h2>Spread, sessions and caps</h2>
      <p>
        The spread and the maximum trade size depend on the market session reported by the oracle. These are the defaults set in the
        InventoryMarket constructor (<code>contracts/arc/src/InventoryMarket.sol</code>).
      </p>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Spread</th>
              <th>Trade cap (share of max trade)</th>
              <th>Trading</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Regular</td><td>30 bps (0.30%)</td><td>100%</td><td>Open</td></tr>
            <tr><td>Pre-market, post-market, overnight</td><td>90 bps (0.90%)</td><td>25%</td><td>Open if the oracle reports that session</td></tr>
            <tr><td>Closed</td><td>200 bps (2.00%)</td><td>10%</td><td>Only when <code>offHoursTrading</code> is on (demo mode)</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        The default max trade is 100 USDC, the default max net exposure is 1,000 USDC, and a spread can never be set above 20%. The
        owner can change these and can pause the market. The values currently set on the deployed contract were not re-read for these
        docs, except that the sample trade confirmed the 2% closed-session spread.
      </p>
      <Callout kind="note" title="Off-hours demo mode">
        <p>
          US regular hours are 09:30 to 16:00 New York time. Outside them the market only trades because demo mode is on, at the last
          known price with the wide closed-session spread. Every price is then indicative. In a production deployment this flag would
          be off.
        </p>
      </Callout>

      <h2>Guards on every trade</h2>
      <ul>
        <li>The oracle price must be fresh, unless the oracle is in demo mode.</li>
        <li>A trade larger than the session cap reverts.</li>
        <li>A trade that would push net USDC flow past the exposure limit reverts.</li>
        <li>A buy cannot take the pool below its minimum wNVDA inventory; a sell cannot take it below its minimum USDC reserve.</li>
        <li>A result below your min-out argument reverts.</li>
        <li>Reentrancy guard, and an owner-only pause.</li>
      </ul>

      <h2>Settlement</h2>
      <p>
        Settlement is atomic and on Arc: the contract pulls your tokens with <code>transferFrom</code> and sends you the other side in
        the same transaction, in USDC. There is no clearing step and no off-chain matching. A blocklisted USDC address cannot move USDC
        on Arc, so its trade reverts cleanly.
      </p>
      <p>
        Selling returns USDC. If you want the underlying provider token back on its home chain, you bridge wNVDA back, which takes
        about 28 seconds from Arc in the one test we ran.
      </p>
    </>
  );
}
