// Test-only deployments fixtures. The addresses and token id are obviously fake
// patterns, not real deployments.
import type { DeploymentsInput } from "../src/config";

export const FAKE = {
  usdcSepolia: "0x1111111111111111111111111111111111111111",
  usdcArc: "0x2222222222222222222222222222222222222222",
  mNVDA: "0x3333333333333333333333333333333333333333",
  wNVDA: "0x4444444444444444444444444444444444444444",
  tokenId: `0x${"ab".repeat(32)}`,
  sender: "0x5555555555555555555555555555555555555555",
  recipient: "0x6666666666666666666666666666666666666666",
} as const;

export function fullDeployments(): DeploymentsInput {
  return {
    sepolia: {
      chainId: 11155111,
      tokens: {
        USDC: { address: FAKE.usdcSepolia, decimals: 6 },
        mNVDA: { address: FAKE.mNVDA, decimals: 18, tokenId: FAKE.tokenId },
      },
    },
    arcTestnet: {
      chainId: 5042002,
      tokens: {
        USDC: { address: FAKE.usdcArc, decimals: 6 },
        wNVDA: { address: FAKE.wNVDA, decimals: 18, tokenId: FAKE.tokenId },
      },
    },
  };
}
