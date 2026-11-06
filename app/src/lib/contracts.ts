import type { Address } from "viem";

/**
 * Which deployed set of oracle and market contracts the app trades against (ADR 0025).
 * `current`: the first set, same source deployed by script. `studio`: the set built, tested and deployed in Arc Studio.
 * Default is `studio` (T-057). Override with NEXT_PUBLIC_CONTRACT_SET=current at build time to use the first set.
 * Every other file reads addresses from here, so the switch is one value.
 */
export type ContractSet = "current" | "studio";

export interface AssetContracts {
  oracle: Address;
  market: Address;
  /** Block the market was deployed in; the trades list scans logs from here. */
  marketDeployBlock: bigint;
}

export const CONTRACT_SETS: Record<ContractSet, { nvda: AssetContracts; tsla: AssetContracts }> = {
  current: {
    nvda: { oracle: "0xcd92cc2ff8d630a93090c203463843ffd685f83d", market: "0x8046c2bcb05c8750772bfcc2109659c85f3b10f4", marketDeployBlock: 71030220n },
    tsla: { oracle: "0xf17f5449be304de315e48eee44cf889e8e47867d", market: "0x7872ad4bb1a18b63140d4df0fe31af451470f0f3", marketDeployBlock: 71085047n },
  },
  // Deployed 2026-11-06 by Arc Studio, owner 0x0762…B351. Verified on-chain 2026-11-07. Owner setup and funding done (T-056); the app default since T-057.
  studio: {
    nvda: { oracle: "0x8503bb2d15f88bb31a9363bc0dfbe9391028ebda", market: "0x0e0d70183cfdf6192e0f43cea39d5567f3698d13", marketDeployBlock: 71093406n },
    tsla: { oracle: "0x1b53204d9d873b74760fd1933e8151220995de05", market: "0x3fb35049ebee5618538214bb504743cdf4f0b5f2", marketDeployBlock: 71093934n },
  },
};

const DEFAULT_SET: ContractSet = "studio";
export const CONTRACT_SET: ContractSet = process.env.NEXT_PUBLIC_CONTRACT_SET === "studio" ? "studio" : process.env.NEXT_PUBLIC_CONTRACT_SET === "current" ? "current" : DEFAULT_SET;
export const ACTIVE = CONTRACT_SETS[CONTRACT_SET];
