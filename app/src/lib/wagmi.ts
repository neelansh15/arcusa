import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { arcTestnet, sepolia } from "./config";

// Public identifier (not a secret). WalletConnect is only offered when it is set.
const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [arcTestnet, sepolia],
  connectors: [
    injected(),
    ...(wcProjectId
      ? [walletConnect({ projectId: wcProjectId, showQrModal: true, metadata: { name: "arcusa", description: "Stock terminal on Arc", url: "https://arcusa.xyz", icons: [] } })]
      : []),
  ],
  transports: {
    [arcTestnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
