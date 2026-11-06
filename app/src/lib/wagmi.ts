import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet, sepolia } from "./config";

export const wagmiConfig = createConfig({
  chains: [arcTestnet, sepolia],
  connectors: [injected()],
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
