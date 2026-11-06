import { createPublicClient, createWalletClient, custom, defineChain, http } from "viem";
import type { Address, Chain, EIP1193Provider, Hex, WalletClient } from "viem";
import { getConnection, switchChain } from "wagmi/actions";
import { ARC_CHAIN_ID, SEPOLIA_CHAIN_ID, SEPOLIA_MNVDA, arcTestnet, sepolia } from "./config";
import { ARC_FEES } from "./market";
import { wagmiConfig } from "./wagmi";

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

export type BridgeLegStatus = "running" | "done" | "error";

export interface BridgeLeg {
  id: string;
  request: BridgeRequest;
  steps: BridgeStep[];
  createdAt: number;
  /** Overall state. Absent only on legs written by older code; treat as "running". */
  status?: BridgeLegStatus;
  error?: string;
}

/** Options passed to Bridge Kit. FAST reverts for this token, so the speed is SLOW. */
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
  /** Runs one leg end to end. Resolves when the mint is done, rejects on failure (the leg is saved with the error). */
  start(req: BridgeRequest, onUpdate: (leg: BridgeLeg) => void): Promise<BridgeLeg>;
  /** Saved legs for an account, newest first. Legs that cannot be resumed are marked as errors. */
  list(account: Address): Promise<BridgeLeg[]>;
  /** Re-drives the attestation and mint of a leg whose burn was already sent. Never re-sends the burn. */
  resume(leg: BridgeLeg, onUpdate: (leg: BridgeLeg) => void): Promise<BridgeLeg>;
}

// ---------------------------------------------------------------------------
// Bridge Kit wiring (browser). Everything heavy is imported dynamically so the
// kit stays out of the landing and trade bundles.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "arcusa.bridge.legs.v1";
const MAX_SAVED_LEGS = 50;

const KIT_CHAIN: Record<number, "Arc_Testnet" | "Ethereum_Sepolia"> = {
  [ARC_CHAIN_ID]: "Arc_Testnet",
  [SEPOLIA_CHAIN_ID]: "Ethereum_Sepolia",
};

/** Bridge Kit step names (CCTPx provider) mapped to the UI steps. */
const KIT_STEP: Record<string, BridgeStepName> = {
  approve: "approve",
  transfer: "burn",
  fetchAttestation: "attestation",
  forward: "mint",
};

// Arc enforces a 20 gwei fee floor, so every Arc transaction gets the app's fixed fees.
const arcWithFeeFloor = defineChain({
  ...arcTestnet,
  fees: {
    estimateFeesPerGas: async () => ({
      maxFeePerGas: ARC_FEES.maxFeePerGas,
      maxPriorityFeePerGas: ARC_FEES.maxPriorityFeePerGas,
    }),
  },
});

/** Legs this page is currently driving, so a leg is never started or resumed twice. */
const active = new Set<string>();

function readSaved(): BridgeLeg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BridgeLeg[]) : [];
  } catch {
    return [];
  }
}

function writeSaved(legs: BridgeLeg[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legs.slice(0, MAX_SAVED_LEGS)));
  } catch {
    // Storage full or blocked: the on-screen state still works, only reload recovery is lost.
  }
}

function save(leg: BridgeLeg) {
  const rest = readSaved().filter((l) => l.id !== leg.id);
  writeSaved([leg, ...rest].sort((a, b) => b.createdAt - a.createdAt));
}

const errMessage = (e: unknown) => (e instanceof Error ? e.message : typeof e === "string" ? e : "bridge failed");

/** Wallet client for the connected wallet on `chainId`: switches the wallet there first. */
async function walletClientFor(chainId: number) {
  const conn = getConnection(wagmiConfig);
  if (!conn.address || !conn.connector) throw new Error("Connect a wallet to bridge.");
  if (conn.chainId !== chainId) {
    await switchChain(wagmiConfig, { chainId: chainId as typeof ARC_CHAIN_ID | typeof SEPOLIA_CHAIN_ID });
  }
  const provider = (await conn.connector.getProvider()) as EIP1193Provider;
  const chain: Chain = chainId === ARC_CHAIN_ID ? arcWithFeeFloor : sepolia;
  return createWalletClient({ account: conn.address, chain, transport: custom(provider) });
}

async function createKit() {
  const [{ BridgeKit }, { ViemAdapter }, { ArcTestnet, EthereumSepolia }] = await Promise.all([
    import("@circle-fin/bridge-kit"),
    import("@circle-fin/adapter-viem-v2"),
    import("@circle-fin/bridge-kit/chains"),
  ]);
  const adapter = new ViemAdapter(
    {
      getPublicClient: ({ chain }) => createPublicClient({ chain, transport: http() }),
      getWalletClient: async ({ chain }) => (await walletClientFor(chain.id)) as WalletClient,
    },
    { addressContext: "user-controlled", supportedChains: [ArcTestnet, EthereumSepolia] },
  );
  const chainDefs: Record<number, typeof ArcTestnet | typeof EthereumSepolia> = {
    [ARC_CHAIN_ID]: ArcTestnet,
    [SEPOLIA_CHAIN_ID]: EthereumSepolia,
  };
  return { kit: new BridgeKit(), adapter, chainDefs };
}

/** Pure update of a leg for one Bridge Kit step. Earlier steps that never reported are marked done. */
function applyKitStep(
  leg: BridgeLeg,
  kitName: string,
  state: "done" | "error",
  txHash: string | undefined,
): BridgeLeg {
  const name = KIT_STEP[kitName];
  if (!name) return leg;
  const idx = BRIDGE_STEP_ORDER.indexOf(name);
  const { from, to } = chainsFor(leg.request.direction);
  const chainId = name === "mint" ? to : name === "attestation" ? undefined : from;
  const now = Date.now();
  const steps = leg.steps.map((s, i): BridgeStep => {
    if (i < idx) return s.state === "done" ? s : { ...s, state: "done", at: s.at ?? now };
    if (i === idx) {
      if (s.state === "done" && state === "done" && !txHash) return s;
      return {
        ...s,
        state,
        at: now,
        ...(txHash ? { txHash: txHash as Hex } : {}),
        ...(chainId !== undefined ? { chainId } : {}),
      };
    }
    if (i === idx + 1 && state === "done" && s.state === "pending") return { ...s, state: "active" };
    return s;
  });
  return { ...leg, steps };
}

interface KitStepLike {
  name: string;
  state: string;
  txHash?: string;
  errorMessage?: string;
}

/** Fold a finished Bridge Kit result into the leg. Returns the leg and, if it failed, the error text. */
function applyKitResult(leg: BridgeLeg, result: { state: string; steps: KitStepLike[] }): BridgeLeg {
  let next = leg;
  for (const s of result.steps) {
    if (s.state === "success" || s.state === "noop") next = applyKitStep(next, s.name, "done", s.txHash);
  }
  if (result.state === "success") {
    // A successful result means every step finished, whether or not an event reported it.
    return {
      ...next,
      status: "done",
      error: undefined,
      steps: next.steps.map((s) => (s.state === "done" ? s : { ...s, state: "done" })),
    };
  }
  const failed = result.steps.find((s) => s.state === "error");
  if (failed) next = applyKitStep(next, failed.name, "error", failed.txHash);
  return {
    ...next,
    status: result.state === "error" ? "error" : "running",
    error: failed?.errorMessage ?? (result.state === "error" ? "Bridge Kit reported an error." : undefined),
  };
}

/** Marks the first unfinished step as failed (used when Bridge Kit throws before returning a result). */
function failLeg(leg: BridgeLeg, message: string): BridgeLeg {
  const i = leg.steps.findIndex((s) => s.state !== "done");
  const steps = leg.steps.map((s, j): BridgeStep => (j === (i === -1 ? 0 : i) ? { ...s, state: "error" } : s));
  return { ...leg, steps, status: "error", error: message };
}

function subscribe(
  kit: Awaited<ReturnType<typeof createKit>>["kit"],
  getLeg: () => BridgeLeg,
  setLeg: (leg: BridgeLeg) => void,
) {
  // Payloads look like { method: 'approve' | 'transfer' | 'fetchAttestation' | 'forward', values: { transactionHash?, ... } }.
  kit.on("*", (payload: unknown) => {
    try {
      const p = payload as { method?: string; values?: { transactionHash?: string } };
      if (!p.method) return;
      setLeg(applyKitStep(getLeg(), p.method, "done", p.values?.transactionHash));
    } catch {
      // A throwing subscriber would be blamed on the in-flight step by the kit; never let that happen.
    }
  });
}

function startOnBrowser(
  req: BridgeRequest,
  onUpdate: (leg: BridgeLeg) => void,
): Promise<BridgeLeg> {
  const { from, to } = chainsFor(req.direction);
  let leg: BridgeLeg = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    request: req,
    steps: emptySteps().map((s, i) => (i === 0 ? { ...s, state: "active" as const } : s)),
    createdAt: Date.now(),
    status: "running",
  };
  const commit = (next: BridgeLeg) => {
    leg = next;
    save(leg);
    onUpdate(leg);
  };
  active.add(leg.id);
  commit(leg);

  return (async () => {
    try {
      // Switch to the source chain first so the wallet prompts here, before any kit work.
      await walletClientFor(from);
      const { kit, adapter } = await createKit();
      subscribe(kit, () => leg, commit);
      const result = await kit.bridge({
        from: { adapter, chain: KIT_CHAIN[from] },
        to: { chain: KIT_CHAIN[to], recipientAddress: req.recipient, useForwarder: true },
        amount: req.amount,
        token: BRIDGE_KIT_OPTIONS.token,
        config: { feePayment: "source", transferSpeed: BRIDGE_KIT_OPTIONS.transferSpeed, batchTransactions: false },
        // The token is a bytes32 CCTPx id, which the kit's static types do not model.
      } as never);
      commit(applyKitResult(leg, result as { state: string; steps: KitStepLike[] }));
      if (leg.status === "error") throw new Error(leg.error ?? "bridge failed");
      return leg;
    } catch (e) {
      if (leg.status !== "error") commit(failLeg(leg, errMessage(e)));
      throw e instanceof Error ? e : new Error(errMessage(e));
    } finally {
      active.delete(leg.id);
    }
  })();
}

function resumeOnBrowser(saved: BridgeLeg, onUpdate: (leg: BridgeLeg) => void): Promise<BridgeLeg> {
  const burn = saved.steps.find((s) => s.name === "burn");
  if (!burn?.txHash) {
    return Promise.reject(new Error("No burn transaction was recorded for this leg, so there is nothing to resume."));
  }
  // Already driven by this page (start or an earlier resume): nothing to do.
  if (active.has(saved.id)) return Promise.resolve(saved);
  const { from, to } = chainsFor(saved.request.direction);
  let leg: BridgeLeg = { ...saved, status: "running", error: undefined };
  const commit = (next: BridgeLeg) => {
    leg = next;
    save(leg);
    onUpdate(leg);
  };
  active.add(leg.id);
  commit(leg);

  return (async () => {
    try {
      await walletClientFor(from);
      const { kit, adapter, chainDefs } = await createKit();
      subscribe(kit, () => leg, commit);
      // Rebuild the partial result the kit would have returned: only the submitted source transfer is needed.
      const partial = {
        amount: saved.request.amount,
        token: BRIDGE_KIT_OPTIONS.token,
        state: "error",
        provider: "CCTPXBridgingProvider",
        config: { transferSpeed: BRIDGE_KIT_OPTIONS.transferSpeed },
        source: { address: saved.request.recipient, chain: chainDefs[from] },
        destination: {
          address: saved.request.recipient,
          chain: chainDefs[to],
          recipientAddress: saved.request.recipient,
          useForwarder: true,
        },
        steps: [{ name: "transfer", state: "success", txHash: burn.txHash }],
      };
      const result = await kit.retry(partial as never, { from: adapter } as never);
      commit(applyKitResult(leg, result as { state: string; steps: KitStepLike[] }));
      if (leg.status === "error") throw new Error(leg.error ?? "resume failed");
      return leg;
    } catch (e) {
      if (leg.status !== "error") commit(failLeg(leg, errMessage(e)));
      throw e instanceof Error ? e : new Error(errMessage(e));
    } finally {
      active.delete(leg.id);
    }
  })();
}

export const bridgeClient: BridgeClient = {
  start: startOnBrowser,
  resume: resumeOnBrowser,
  async list(account) {
    const mine = readSaved()
      .filter((l) => l.request.recipient.toLowerCase() === account.toLowerCase())
      .map((l): BridgeLeg => {
        const burned = l.steps.some((s) => s.name === "burn" && s.txHash);
        // A running leg that nothing on this page is driving, and that never sent a burn, was cut off
        // (reload or closed tab) before any funds moved. It cannot be resumed.
        if ((l.status ?? "running") === "running" && !active.has(l.id) && !burned) {
          const failed = failLeg(l, "Interrupted before the burn was sent (page reloaded). No funds moved; start again.");
          save(failed);
          return failed;
        }
        return l;
      });
    return mine.sort((a, b) => b.createdAt - a.createdAt);
  },
};
