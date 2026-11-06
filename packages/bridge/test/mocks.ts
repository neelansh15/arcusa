// Mocked Bridge Kit port and RPC port. No network.
import { vi } from "vitest";
import type { BridgeKitPort, KitEstimate, KitTransferStatus, RpcPort, TxReceipt } from "../src/ports";
import { createBridge, type BridgeDeps } from "../src/bridge";
import type { TransferRecord } from "../src/state";
import { fullDeployments } from "./fixtures";

export const SRC_TX = `0x${"aa".repeat(32)}` as const;
export const DST_TX = `0x${"bb".repeat(32)}` as const;

export const ONE_ETH = 10n ** 18n;

export function mockKit(overrides: Partial<{ estimate: KitEstimate; status: KitTransferStatus }> = {}) {
  return {
    estimate: vi.fn<BridgeKitPort["estimate"]>(async () =>
      overrides.estimate ?? { speed: "STANDARD", sourceGas: 1_000n, fees: [{ kind: "forwarding", paidIn: "token", amount: 50_000n }] },
    ),
    submit: vi.fn<BridgeKitPort["submit"]>(async () => ({ sourceTxHash: SRC_TX })),
    getStatus: vi.fn<BridgeKitPort["getStatus"]>(async () => overrides.status ?? { state: "pending" }),
  };
}

export function mockRpc(balance: bigint = ONE_ETH, receipt: TxReceipt | null = null) {
  return {
    getNativeBalance: vi.fn<RpcPort["getNativeBalance"]>(async () => balance),
    getTransactionReceipt: vi.fn<RpcPort["getTransactionReceipt"]>(async () => receipt),
  };
}

export function setup(opts: { kit?: ReturnType<typeof mockKit>; rpc?: ReturnType<typeof mockRpc>; deps?: Partial<BridgeDeps> } = {}) {
  const kit = opts.kit ?? mockKit();
  const rpc = opts.rpc ?? mockRpc();
  const transitions: TransferRecord[] = [];
  let t = 1_000;
  let id = 0;
  const bridge = createBridge({
    kit,
    rpc,
    deployments: fullDeployments(),
    now: () => ++t,
    newId: () => `t${++id}`,
    onTransition: (r) => transitions.push(r),
    ...opts.deps,
  });
  return { bridge, kit, rpc, transitions };
}
