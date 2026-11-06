import { defineChain, type Address, type Hex } from "viem";
import { sepolia } from "viem/chains";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  // Native gas token is USDC with 18 decimals (the ERC-20 interface uses 6).
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.io"] } },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

export { sepolia };
export const CHAINS = [arcTestnet, sepolia] as const;

export const ARC_CHAIN_ID = arcTestnet.id;
export const SEPOLIA_CHAIN_ID = sepolia.id;

export const ARC_USDC = {
  address: "0x3600000000000000000000000000000000000000" as Address,
  decimals: 6,
  symbol: "USDC",
} as const;

export const WNVDA = {
  address: "0x5ad2862787d5C7F42a09014CE4C973d162878a16" as Address,
  decimals: 18,
  symbol: "wNVDA",
} as const;

export const SEPOLIA_MNVDA = {
  address: "0xecD2332b5E119C0a34dbd80043EC54cd1a9B7423" as Address,
  // Bridge Kit is called with `token: <tokenId>`.
  tokenId: "0x9aba200723d57aa177e725ed5d5b230b9435824c339227e47b9ca552a16d218d" as Hex,
  symbol: "mNVDA",
} as const;

// TODO: set once the Arc InventoryMarket (ADR 0014) is deployed.
export const INVENTORY_MARKET_ADDRESS: Address | null = null;

export const PRICE = {
  route: "/api/price",
  upstream: "https://api.xstocks.fi/api/v2/public/assets/NVDAx/price-data",
  // The upstream has no timestamp; a quote older than this (our fetchedAt) is stale.
  staleAfterMs: 60_000,
  pollMs: 10_000,
} as const;

export function explorerTx(chainId: number, hash: string): string {
  const base =
    chainId === ARC_CHAIN_ID
      ? arcTestnet.blockExplorers.default.url
      : sepolia.blockExplorers.default.url;
  return `${base}/tx/${hash}`;
}
