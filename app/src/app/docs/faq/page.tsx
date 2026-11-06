import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/docs/parts";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqDocs() {
  return (
    <>
      <PageHead eyebrow="Reference" title="FAQ" lead="Short answers. Follow the links for detail." />

      <dl className="docs-faq">
        <dt>Is this real money?</dt>
        <dd>No. It runs on Arc testnet and Ethereum Sepolia with tokens that have no value. See <Link href="/docs/risks">Risks</Link>.</dd>

        <dt>Does arcusa issue stock tokens?</dt>
        <dd>No. The design locks a stock-token provider&apos;s token on its home chain and mints a wrapper on Arc. The demo uses a mock token in place of a provider.</dd>

        <dt>What do I need to trade?</dt>
        <dd>USDC on Arc, which is also the gas token. You do not need to bridge anything.</dd>

        <dt>Who needs the bridge?</dt>
        <dd>Liquidity providers who move stock tokens between chains to stock the market. See <Link href="/docs/bridge">Bridge</Link>.</dd>

        <dt>What price do I get?</dt>
        <dd>The oracle price plus a spread when you buy, minus a spread when you sell. The spread is 0.30% in the regular session by default and 2% when the market is closed. See <Link href="/docs/how-it-works">How it works</Link>.</dd>

        <dt>Why can I trade when the US market is closed?</dt>
        <dd>The demo has an off-hours mode that trades at the last known price with a wider spread. Prices are indicative. See <Link href="/docs/oracle">Oracle and price</Link>.</dd>

        <dt>Where does the price come from?</dt>
        <dd>The xstocks.fi NVDAx price endpoint, polled by our price service and pushed on-chain by a relayer when it moves more than 0.1% or every 60 seconds.</dd>

        <dt>How long does bridging take?</dt>
        <dd>About 16 minutes from Sepolia to Arc and about 28 seconds back, on Standard transfers in our tests. Fast transfers did not work for the mock token.</dd>

        <dt>Which chains are supported?</dt>
        <dd>Arc testnet and Ethereum Sepolia. Ethereum mainnet, BNB Chain, Base and Solana are roadmap and not deployed. See <Link href="/docs/contracts">Contracts</Link>.</dd>

        <dt>Which stocks?</dt>
        <dd>NVDA only.</dd>

        <dt>Are the contracts audited?</dt>
        <dd>No.</dd>

        <dt>Where is the code?</dt>
        <dd>In the neelansh15/arcusa repository on GitHub. Decisions are written up as ADRs in <code>docs/adr</code>.</dd>
      </dl>
    </>
  );
}
