import type { Address, Hex } from "viem";
import { ARC_CHAIN_ID, SEPOLIA_CHAIN_ID, SEPOLIA_MNVDA } from "./config";

export type BridgeDirection = "sepolia-to-arc" | "arc-to-sepolia";

export type BridgeStepName = "approve" | "burn" | "attestation" | "mint";
export type BridgeStepState = "pending" | "active" | "done" | "error";

export interface BridgeStep {
  name: BridgeStepName;
  state: BridgeStepState;
  txHash?: Hex;
  chainId?: number;
  at?: number;
}

export interface BridgeRequest {
  direction: BridgeDirection;
  /** Human amount, e.g. "1.5". */
  amount: string;
  recipient: Address;
}

export interface BridgeLeg {
  id: string;
  request: BridgeRequest;
  steps: BridgeStep[];
  createdAt: number;
}

/** Options that will be passed to Bridge Kit once wired. */
export const BRIDGE_KIT_OPTIONS = {
  token: SEPOLIA_MNVDA.tokenId,
  useForwarder: true,
  transferSpeed: "SLOW",
} as const;

/** Observed timings for this token (SLOW transfer). FAST reverts for this token. */
export const BRIDGE_ETA: Record<BridgeDirection, string> = {
  "sepolia-to-arc": "~16 min",
  "arc-to-sepolia": "~28 s",
};

export const BRIDGE_STEP_ORDER: BridgeStepName[] = ["approve", "burn", "attestation", "mint"];

export function chainsFor(direction: BridgeDirection): { from: number; to: number } {
  return direction === "sepolia-to-arc"
    ? { from: SEPOLIA_CHAIN_ID, to: ARC_CHAIN_ID }
    : { from: ARC_CHAIN_ID, to: SEPOLIA_CHAIN_ID };
}

export function emptySteps(): BridgeStep[] {
  return BRIDGE_STEP_ORDER.map((name) => ({ name, state: "pending" }));
}

export interface BridgeClient {
  start(req: BridgeRequest, onUpdate: (leg: BridgeLeg) => void): Promise<BridgeLeg>;
  list(account: Address): Promise<BridgeLeg[]>;
}

/**
 * TODO: wrap @circle-fin/bridge-kit (with @circle-fin/adapter-viem-v2) here.
 * Call it with BRIDGE_KIT_OPTIONS (token: tokenId, useForwarder: true, transferSpeed: 'SLOW').
 * Not wired yet: this stub always rejects.
 */
export const bridgeClient: BridgeClient = {
  async start() {
    throw new Error("Bridge not wired yet (Bridge Kit integration pending)");
  },
  async list() {
    return [];
  },
};
