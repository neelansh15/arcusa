import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHead } from "@/components/docs/parts";

export const metadata: Metadata = { title: "Oracle and price" };

export default function OracleDocs() {
  return (
    <>
      <PageHead
        eyebrow="Guides"
        title="Oracle and price"
        lead="Where the NVDA price comes from, how it reaches Arc, and what happens when it goes stale or the US market is closed."
      />

      <Callout kind="warn" title="The price is indicative">
        <p>
          The source is a public price endpoint with no timestamp and no service guarantee that we know of. The relayer that writes it
          on-chain is trusted. Do not treat this price as a verified market price.
        </p>
      </Callout>

      <h2>The pipeline</h2>
      <ol>
        <li>
          <b>Source.</b> The price service polls <code>api.xstocks.fi</code> (NVDAx price-data) every 5 seconds. The response is only{" "}
          <code>{`{"quote": n}`}</code>: no timestamp, and no history endpoint was found.
        </li>
        <li>
          <b>Price service.</b> Stores each tick with our receive time in SQLite and serves <code>/api/price</code>,{" "}
          <code>/api/candles</code>, <code>/api/ticks</code> and <code>/health</code>.
        </li>
        <li>
          <b>Relayer.</b> Reads <code>/api/price</code> and calls <code>updatePrice</code> on the PriceOracle on Arc.
        </li>
        <li>
          <b>Oracle.</b> Validates and stores it. The market reads it on every quote and trade.
        </li>
      </ol>

      <h2>Relayer cadence</h2>
      <p>The relayer checks every 5 seconds and pushes only when one of these is true:</p>
      <ul>
        <li>the price moved by 0.1% (10 bps) or more since the last push, or</li>
        <li>60 seconds have passed since the last push (heartbeat).</li>
      </ul>
      <p>It skips a push when the price service reports the quote as stale. Transactions use a 25 gwei fee because Arc enforces a 20 gwei floor.</p>

      <h2>Staleness</h2>
      <ul>
        <li>
          <b>Price service:</b> a quote older than 60 seconds (by our receive time) is flagged stale, and the app shows it as stale.
        </li>
        <li>
          <b>Oracle:</b> <code>maxStaleness</code> is 300 seconds on the deployed oracle (from the deploy log). Outside demo mode,{" "}
          <code>getPrice</code> reverts for an older price, so trading stops.
        </li>
        <li>
          <b>Demo mode:</b> the deployed oracle has demo mode on, which serves the last price even when it is stale. This is what allows
          trading off-hours and it must be off in any production deployment.
        </li>
      </ul>

      <h2>Sessions</h2>
      <p>
        The oracle stores a session with each price: closed, regular, pre-market, post-market or overnight. The relayer only reports two
        of them. It sets <b>regular</b> from Monday to Friday between 09:30 and 16:00 New York time and <b>closed</b> otherwise. It does
        not model holidays or extended hours. The market then applies the spread and cap for that session (see{" "}
        <Link href="/docs/how-it-works">How it works</Link>).
      </p>

      <h2>Oracle guards</h2>
      <ul>
        <li>Only addresses authorised by the owner can update the price.</li>
        <li>Rejects a zero or invalid price, a confidence wider than the configured limit, and a publish time that does not increase or lies in the future.</li>
        <li>Rejects a move larger than the per-update deviation cap unless the owner armed a one-shot override for a gap at the open.</li>
        <li>The relayer currently sends a confidence of 0, so the confidence guard does not do anything useful with this source.</li>
      </ul>

      <h2>Limits of this setup</h2>
      <ul>
        <li>One source, one relayer. No cross-check against a second feed.</li>
        <li>No timestamp from the source, so freshness is measured from when we received the quote.</li>
        <li>A token price from a provider can differ from the stock price. The plan notes premiums of a few percent have been seen; arcusa does not read a provider feed yet.</li>
        <li>
          The plan chose Ondo&apos;s API as the first-choice source, but no key was obtained, so the xStocks endpoint is what runs. Pyth
          Pro and Stork were researched and not integrated.
        </li>
        <li>Parity with the real stock is bounded by the spread, caps and staleness limits. It is not guaranteed.</li>
      </ul>
    </>
  );
}
