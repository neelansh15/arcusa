import type { Metadata } from "next";
import { Callout, ContractTable, PageHead, TxTable } from "@/components/docs/parts";
import { ETH_SEPOLIA, MNVDA_TOKEN_ID, SEPOLIA_CONTRACTS, SEPOLIA_TXS } from "@/lib/docs-contracts";

export const metadata: Metadata = { title: "Ethereum Sepolia contracts" };

export default function SepoliaContracts() {
  return (
    <>
      <PageHead
        eyebrow="Contracts"
        title="Ethereum Sepolia"
        lead="Chain ID 11155111. Home chain for the mock stock token. Inventory is locked here while its wrapped version circulates on Arc."
      />

      <p>
        Explorer: <a href={ETH_SEPOLIA.explorer} target="_blank" rel="noreferrer">{ETH_SEPOLIA.explorer}</a>.
      </p>

      <h2>Contracts</h2>
      <ContractTable chain={ETH_SEPOLIA} rows={SEPOLIA_CONTRACTS} />

      <h3>Bridge Kit token id</h3>
      <p>Bridge Kit identifies the token by this bytes32 id rather than by address.</p>
      <pre>
        <code>{MNVDA_TOKEN_ID}</code>
      </pre>

      <Callout kind="note" title="USDC on Sepolia">
        <p>
          USDC bridge-in uses Circle&apos;s own CCTP contracts. The repo records the test and its transactions but no Sepolia USDC or
          CCTP contract addresses, so none are listed here.
        </p>
      </Callout>

      <h2>Notable transactions</h2>
      <TxTable chain={ETH_SEPOLIA} rows={SEPOLIA_TXS} />
    </>
  );
}
