// Contract data for the docs. Every address below comes from the repo:
// deployments/arc-testnet.json, app/src/lib/config.ts, app/src/lib/market.ts or LOG.md.
// Nothing here is a mainnet address that arcusa deployed.

export interface ChainInfo {
  slug: string;
  name: string;
  chainId: number;
  explorer: string;
}

export const ARC_TESTNET: ChainInfo = {
  slug: "arc-testnet",
  name: "Arc testnet",
  chainId: 5042002,
  explorer: "https://testnet.arcscan.app",
};

export const ETH_SEPOLIA: ChainInfo = {
  slug: "ethereum-sepolia",
  name: "Ethereum Sepolia",
  chainId: 11155111,
  explorer: "https://sepolia.etherscan.io",
};

export interface ContractRow {
  name: string;
  address: string;
  purpose: string;
  /** Who deployed it. "arcusa" for our contracts, otherwise the third party. */
  owner: "arcusa" | "Arc" | "Circle" | "wrapper";
  /** Deploy transaction hash when the repo records one. */
  deployTx?: string;
  /** Where in the repo the address was verified. */
  source: string;
  /** Anything we could not verify. */
  note?: string;
}

export const ARC_CONTRACTS: ContractRow[] = [
  {
    name: "PriceOracle",
    address: "0xcd92cc2ff8d630a93090c203463843ffd685f83d",
    purpose: "Stores the relayed NVDA price (8 decimals), publish time and session. Guards: staleness, confidence, per-update deviation.",
    owner: "arcusa",
    deployTx: "0x00af89531f97fbea3c63115bfd7edd388e1a50fabf561e7a23774f1b10ed489f",
    source: "deployments/arc-testnet.json, app/src/lib/market.ts (ORACLE_ADDRESS), LOG.md",
  },
  {
    name: "InventoryMarket",
    address: "0x8046c2bcb05c8750772bfcc2109659c85f3b10f4",
    purpose: "Swaps USDC and wNVDA at the oracle price plus or minus a spread, against pre-positioned inventory.",
    owner: "arcusa",
    deployTx: "0xa01b539e5f78fb5df9e6d33baac2c1ac982924cfe4bbfa711a763f3f3e699b07",
    source: "deployments/arc-testnet.json, app/src/lib/market.ts (MARKET_ADDRESS), LOG.md",
    note: "Deployed at block 71030220 (app/src/lib/market.ts).",
  },
  {
    name: "wNVDA",
    address: "0x5ad2862787d5C7F42a09014CE4C973d162878a16",
    purpose: "Wrapped mock NVDA on Arc (18 decimals). Minted when mNVDA is locked on Sepolia, burned when it is released.",
    owner: "wrapper",
    source: "deployments/arc-testnet.json, app/src/lib/config.ts (WNVDA), LOG.md",
    note: "Created by Circle's cross-chain token service from a Sepolia message, not by a direct deploy, so the repo records no Arc deploy tx.",
  },
  {
    name: "USDC (ERC-20 interface)",
    address: "0x3600000000000000000000000000000000000000",
    purpose: "Arc's system USDC. 6 decimals through the ERC-20 interface; it is also the native gas token with 18 decimals.",
    owner: "Arc",
    source: "deployments/arc-testnet.json, app/src/lib/config.ts (ARC_USDC), docs/adr/0014",
    note: "Not deployed by arcusa.",
  },
  {
    name: "mTSLA (mock provider token)",
    address: "0xbd0ae58afe2d6c42a3b31f8d97b31093fcbc8bdf",
    purpose: "Mock stand-in for a provider's tokenized TSLA (18 decimals, public faucet). To be locked here and wrapped on Arc (second wrapped token, runbook deploy-wrapped-token).",
    owner: "arcusa",
    deployTx: "0x1e20e2a08ae39939ee1bcef7c867661e4dadc3496cc4eacfe96885550cfa8130",
    source: "LOG.md (2026-11-06 mTSLA entry)",
    note: "Testnet mock with no backing and no value. Source: contracts/sepolia/src/MockTSLAToken.sol. The Arc wrapper was still pending when this was written; it is not listed until it is verified onchain.",
  },
  {
    name: "mTSLA TokenManager (LOCK_UNLOCK, Sepolia)",
    address: "0xc49A72ceF1c4cDA64A4a12aBA9859a0E3BFE877f",
    purpose: "Holds locked mTSLA once bridged. Read from resolveTokenManager(tokenId) on Sepolia after registration.",
    owner: "Circle",
    source: "LOG.md (2026-11-06 mTSLA entry)",
    note: "Differs from the mNVDA manager address, so the manager is not the same for every token. Not yet checked on Arc.",
  },
  {
    name: "CrossChainTokenService (CCTPx)",
    address: "0x63753E722bd2C2A5DF6EE19C5106662208B81077",
    purpose: "Circle's service for non-USDC cross-chain tokens. Resolves token managers and wrapped token addresses.",
    owner: "Circle",
    source: "deployments/arc-testnet.json (ccts), LOG.md, PLAN.md",
    note: "Code presence on Arc testnet and Sepolia was checked on Nov 6 (PLAN.md). Not deployed by arcusa.",
  },
  {
    name: "Ownerless TokenManager",
    address: "0x276fACA17FA1C19A0d9B4f1B190C89c2d28C601b",
    purpose: "Mints and burns wNVDA on Arc. Same address as the manager on Sepolia, which locks and unlocks mNVDA.",
    owner: "Circle",
    source: "deployments/arc-testnet.json (ownerlessTokenManager), LOG.md",
    note: "Its owner is 0x173d00f7e8702d176628963FbD4E1Bcc18B29F94, not an arcusa wallet. Who controls that address is unconfirmed (LOG.md).",
  },
];

export interface AccountRow {
  name: string;
  address: string;
  purpose: string;
  source: string;
}

export const ARC_ACCOUNTS: AccountRow[] = [
  {
    name: "Deployer / owner wallet",
    address: "0x07621e39424914f633D478DdE751f3FF728CB351",
    purpose: "Throwaway testnet wallet that deployed the oracle and market, seeded the inventory and made the sample trades.",
    source: "deployments/arc-testnet.json (deployer), LOG.md",
  },
  {
    name: "Oracle relayer",
    address: "0xB4964152cD9A6f971446E40b23Ed7513da26faE0",
    purpose: "Throwaway testnet wallet authorised with setRelayer. Pushes prices to the oracle.",
    source: "LOG.md (19:20 entry)",
  },
];

export interface TxRow {
  label: string;
  hash: string;
  source: string;
}

export const ARC_TXS: TxRow[] = [
  { label: "Sample buy: 5 USDC for 0.025972 wNVDA", hash: "0xccbfdfa863c4cc2b962b2c40202b80ec4c5799f7b715240b7a8dfeddd3c600c6", source: "deployments/arc-testnet.json, LOG.md" },
  { label: "Sample sell: wNVDA back for 4.803921 USDC", hash: "0xf089a3b0117ddea968bb429dff8c6d35193e51f2227aabd4187d6106c54082ba", source: "deployments/arc-testnet.json, LOG.md" },
  { label: "First oracle update from the relayer", hash: "0xfa4cadbd36d40f343d50f7ed68e775e0c2ae86a19e88038a3c8e68d611cffe7f", source: "LOG.md" },
];

export const SEPOLIA_CONTRACTS: ContractRow[] = [
  {
    name: "mNVDA (mock provider token)",
    address: "0xecD2332b5E119C0a34dbd80043EC54cd1a9B7423",
    purpose: "Mock stand-in for a provider's tokenized NVDA (18 decimals, public faucet). Locked here, wrapped as wNVDA on Arc.",
    owner: "arcusa",
    deployTx: "0xb138a26cd1213dd6a8e7320fc87fd995e7b0d9f963c8de4d3f600d4d21342337",
    source: "app/src/lib/config.ts (SEPOLIA_MNVDA), LOG.md",
    note: "Testnet mock with no backing and no value. Source: contracts/sepolia/src/MockProviderToken.sol.",
  },
  {
    name: "CrossChainTokenService (CCTPx)",
    address: "0x63753E722bd2C2A5DF6EE19C5106662208B81077",
    purpose: "Circle's service. We called registerOwnerlessToken(mNVDA) and deployRemoteOwnerlessToken(mNVDA, 26, ...) on it.",
    owner: "Circle",
    source: "LOG.md (T-022 entries), PLAN.md",
    note: "Not deployed by arcusa. The registration tx hash is not recorded in the repo.",
  },
  {
    name: "Ownerless TokenManager (LOCK_UNLOCK)",
    address: "0x276fACA17FA1C19A0d9B4f1B190C89c2d28C601b",
    purpose: "Holds locked mNVDA while wNVDA exists on Arc. Same address as the Arc manager.",
    owner: "Circle",
    source: "LOG.md (T-022 entries)",
    note: "Owner 0x173d00f7e8702d176628963FbD4E1Bcc18B29F94; control unconfirmed (LOG.md).",
  },
];

export const SEPOLIA_TXS: TxRow[] = [
  { label: "deployRemoteOwnerlessToken (creates wNVDA on Arc)", hash: "0x4fd4052e56e5b9d38a178cc0d612715a4770db311195e1daaf71cec552b58cc0", source: "LOG.md" },
  { label: "registerOwnerlessToken (mTSLA)", hash: "0x88b72ca6d3fba249b967356c55673b296f06ca317d01e0dc050b8acdca06c1f7", source: "LOG.md" },
  { label: "deployRemoteOwnerlessToken (requests the mTSLA wrapper on Arc)", hash: "0xd4d0e7bae2699c651e80716035804c64d52e4c6244b1178878856fe67cd596f1", source: "LOG.md" },
  { label: "USDC bridge-in burn, 1 USDC to Arc with Forwarding (test T-004)", hash: "0x0fe962146b1f35f881d462196b6c94c47e317d5437448ceb1cc8a7883f77a899", source: "LOG.md" },
];

export const MTSLA_TOKEN_ID = "0x7f1c9fb53db47fd1c05448f8551ce0db9d2a30cdd4836c55ab890597f278f930";

export const MNVDA_TOKEN_ID = "0x9aba200723d57aa177e725ed5d5b230b9435824c339227e47b9ca552a16d218d";

export interface PlannedChain {
  name: string;
  status: string;
  note: string;
}

export const PLANNED_CHAINS: PlannedChain[] = [
  { name: "Ethereum mainnet", status: "Not deployed", note: "The likely home chain for real provider tokens such as Ondo's NVDAon (docs/adr/0012). Nothing deployed." },
  { name: "Arc mainnet", status: "Not deployed", note: "Settlement chain for production. Circle's docs list a CCTPx service at 0x431871229103b780868f8C6BB820cd16ECf942BC (PLAN.md, from docs, not checked onchain). arcusa has no contracts there." },
  { name: "BNB Chain", status: "Not deployed", note: "Roadmap only. The repo has no design, tests or addresses for it." },
  { name: "Base", status: "Not deployed", note: "Roadmap only. Circle's quickstarts use Base Sepolia (PLAN.md), but arcusa has not used it." },
  { name: "Solana", status: "Not deployed", note: "Roadmap only. The repo has no design for a non-EVM chain; it would need a different bridging path." },
];
