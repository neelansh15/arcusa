"use client";

import { useConnection, useSwitchChain } from "wagmi";
import { arcTestnet } from "./config";

export const isRejection = (e: unknown) => {
  const x = e as { code?: number; cause?: { code?: number }; message?: string } | undefined;
  return x?.code === 4001 || x?.cause?.code === 4001 || /reject|denied|cancel/i.test(x?.message ?? "");
};

/** Switch the connected wallet to Arc. If the wallet does not know Arc, add it through the active connector's own provider (never window.ethereum). */
export function useSwitchToArc() {
  const { connector } = useConnection();
  const { switchChainAsync } = useSwitchChain();
  return async () => {
    try {
      await switchChainAsync({ chainId: arcTestnet.id });
    } catch (e) {
      if (isRejection(e)) throw e;
      const provider = (await connector?.getProvider()) as { request?: (a: { method: string; params?: unknown[] }) => Promise<unknown> } | undefined;
      if (!provider?.request) throw e;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${arcTestnet.id.toString(16)}`,
            chainName: arcTestnet.name,
            nativeCurrency: arcTestnet.nativeCurrency,
            rpcUrls: arcTestnet.rpcUrls.default.http,
            blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
          },
        ],
      });
    }
  };
}
