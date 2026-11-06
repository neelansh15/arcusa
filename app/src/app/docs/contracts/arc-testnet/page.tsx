import type { Metadata } from "next";
import { Callout, ContractTable, PageHead, AccountTable, TxTable } from "@/components/docs/parts";
import { ARC_ACCOUNTS, ARC_CONTRACTS, ARC_TESTNET, ARC_TXS } from "@/lib/docs-contracts";

export const metadata: Metadata = { title: "Arc testnet contracts" };

export default function ArcTestnetContracts() {
  return (
    <>
      <PageHead
        eyebrow="Contracts"
        title="Arc testnet"
        lead="Chain ID 5042002. Settlement chain: the market, the oracle and wNVDA live here. USDC is the gas token."
      />

      <p>
        Explorer: <a href={ARC_TESTNET.explorer} target="_blank" rel="noreferrer">{ARC_TESTNET.explorer}</a>. Deployed on 2026-11-06 by a
        throwaway wallet.
      </p>

      <h2>Contracts</h2>
      <ContractTable chain={ARC_TESTNET} rows={ARC_CONTRACTS} />

      <Callout kind="note" title="Not yet verified">
        <p>
          The repo does not record whether the contract sources are verified on the explorer, and the deployed parameter values (spreads,
          caps) were not re-read from the chain for these docs. The ABI used by the app lives in <code>app/src/lib/abi</code>.
        </p>
      </Callout>

      <h2>Accounts</h2>
      <p>Public addresses of throwaway testnet wallets. Their keys are not in the repository.</p>
      <AccountTable chain={ARC_TESTNET} rows={ARC_ACCOUNTS} />

      <h2>Notable transactions</h2>
      <TxTable chain={ARC_TESTNET} rows={ARC_TXS} />
    </>
  );
}
