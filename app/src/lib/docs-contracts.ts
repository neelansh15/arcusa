import { CONTRACT_SET } from "./contracts";
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
    name: "PriceOracle (TSLA)",
    address: "0xf17f5449be304de315e48eee44cf889e8e47867d",
    purpose: "Stores the relayed TSLA price (8 decimals), publish time and session. Same contract as the NVDA oracle, separate instance.",
    owner: "arcusa",
    deployTx: "0xd8b694e1680fe544a2a84b14606751a420341b30329cbf9cdb1ffa07a665fb59",
    source: "deployments/arc-testnet.json (tsla), LOG.md",
    note: "First price 360.674 pushed by hand (xStocks TSLAx). The server relayer and price service are not yet configured for TSLA, so the price goes stale after 300 s.",
  },
  {
    name: "InventoryMarket (TSLA)",
    address: "0x7872ad4bb1a18b63140d4df0fe31af451470f0f3",
    purpose: "Swaps USDC and wTSLA at the TSLA oracle price plus or minus a spread, against pre-positioned inventory (5 wTSLA and 8 USDC deposited).",
    owner: "arcusa",
    deployTx: "0xff278d0295f5da914392d4a4900611eed1cf63b623eb4096f21a83b361c908b4",
    source: "deployments/arc-testnet.json (tsla), LOG.md",
    note: "No trade has been made on it yet and it is not wired into the app.",
  },
  {
    name: "PriceOracle (NVDA, Arc Studio set)",
    address: "0x8503bb2d15f88bb31a9363bc0dfbe9391028ebda",
    purpose: "Same PriceOracle source, built, tested and deployed in Arc Studio (ADR 0025). Owner is the arcusa deployer, staleness 300.",
    owner: "arcusa",
    deployTx: "0x8d8efb77b5151177c6d0c12b977e3e362d4efc347f65644fb5c43d0952a2dade",
    source: "deployments/arc-testnet.json (studio), app/src/lib/contracts.ts",
    note: CONTRACT_SET === "studio" ? "In use by the app." : "Verified on-chain, not used by the app yet: it still needs its owner setup (T-056).",
  },
  {
    name: "InventoryMarket (NVDA, Arc Studio set)",
    address: "0x0e0d70183cfdf6192e0f43cea39d5567f3698d13",
    purpose: "Same InventoryMarket source, deployed from Arc Studio, wired to the Studio NVDA oracle and the existing wNVDA.",
    owner: "arcusa",
    deployTx: "0x4016a613de4ce1eca593c86c6dca9d1d4f302d8a02a5dca4bec1e34b7b92c833",
    source: "deployments/arc-testnet.json (studio), app/src/lib/contracts.ts",
    note: CONTRACT_SET === "studio" ? "In use by the app." : "Verified on-chain, not used by the app yet. Deployed at block 71093406.",
  },
  {
    name: "PriceOracle (TSLA, Arc Studio set)",
    address: "0x1b53204d9d873b74760fd1933e8151220995de05",
    purpose: "PriceOracle for TSLA, deployed from Arc Studio. Staleness 301 instead of 300 so the deploy tool did not de-duplicate it against the NVDA oracle.",
    owner: "arcusa",
    deployTx: "0xca1d5a23bcb592e6b157ff3c3ef1a3d714313159a24a082f9a8c34bdc505c845",
    source: "deployments/arc-testnet.json (studio), app/src/lib/contracts.ts",
    note: CONTRACT_SET === "studio" ? "In use by the app." : "Verified on-chain, not used by the app yet (T-056).",
  },
  {
    name: "InventoryMarket (TSLA, Arc Studio set)",
    address: "0x3fb35049ebee5618538214bb504743cdf4f0b5f2",
    purpose: "InventoryMarket for wTSLA, deployed from Arc Studio, wired to the Studio TSLA oracle.",
    owner: "arcusa",
    deployTx: "0x35422af41a2e89c36b3c6daa6037e0af5813c720e91f39ff32c83152761851e7",
    source: "deployments/arc-testnet.json (studio), app/src/lib/contracts.ts",
    note: CONTRACT_SET === "studio" ? "In use by the app." : "Verified on-chain, not used by the app yet. Deployed at block 71093934.",
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
    name: "wTSLA",
    address: "0xD6bB2FFfCc37845fe44767E40569b801c9F9afd5",
    purpose: "Wrapped mock TSLA on Arc (18 decimals, name \"Mock Tesla (testnet)\", symbol mTSLA). Minted when mTSLA is locked on Sepolia, burned when it is released.",
    owner: "wrapper",
    source: "LOG.md (2026-11-06 mTSLA entry)",
    note: "Created by Circle's cross-chain token service from a Sepolia message, so there is no Arc deploy tx. 10 mTSLA bridged in, supply 10 and 10 locked on Sepolia. Its manager is 0xc49A72ceF1c4cDA64A4a12aBA9859a0E3BFE877f.",
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
    purpose: "Mock stand-in for a provider's tokenized TSLA (18 decimals, public faucet). Locked here, wrapped as wTSLA on Arc (second wrapped token, runbook deploy-wrapped-token).",
    owner: "arcusa",
    deployTx: "0x1e20e2a08ae39939ee1bcef7c867661e4dadc3496cc4eacfe96885550cfa8130",
    source: "LOG.md (2026-11-06 mTSLA entry)",
    note: "Testnet mock with no backing and no value. Source: contracts/sepolia/src/MockTSLAToken.sol.",
  },
  {
    name: "mTSLA TokenManager (LOCK_UNLOCK, Sepolia)",
    address: "0xc49A72ceF1c4cDA64A4a12aBA9859a0E3BFE877f",
    purpose: "Holds locked mTSLA once bridged. Read from resolveTokenManager(tokenId) on Sepolia after registration.",
    owner: "Circle",
    source: "LOG.md (2026-11-06 mTSLA entry)",
    note: "The ownerless manager is per token: same address on Sepolia and Arc for mTSLA, but different from the mNVDA manager.",
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
  { label: "Deposit 5 wTSLA into the TSLA market", hash: "0xb9a06452a4718f74dc5f200cf27562db133c9d9f575c57d5a5b9dc9e5d0d0781", source: "LOG.md" },
  { label: "Deposit 8 USDC into the TSLA market", hash: "0xff1ba387438fb2e90d8fb14c66e7a52026b7f9a47bb21089aea8c649b400867e", source: "LOG.md" },
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
  { label: "Bridge 10 mTSLA to Arc (Sepolia transfer step, SLOW, 1139 s)", hash: "0x7746bbbd6cfe7dc84668b5f95182a9ab90e0386ac640dae943333b3eeb04a22d", source: "LOG.md" },
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
