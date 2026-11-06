import { describe, expect, it } from "vitest";
import { createBridge } from "../src/bridge";
import {
  ConfigMissingError,
  DestinationFailedError,
  InsufficientGasError,
  InvalidAddressError,
  InvalidAmountError,
  NotImplementedError,
  QuoteRejectedError,
  SourceTxRevertedError,
  TokenNotRegisteredError,
  UnknownBridgeError,
  UnsupportedRouteError,
  UserRejectedError,
} from "../src/errors";
import { FAKE, fullDeployments } from "./fixtures";
import { DST_TX, ONE_ETH, SRC_TX, mockKit, mockRpc, setup } from "./mocks";

const mnvda = { route: "mnvda-sepolia-to-arc", amount: { decimal: "1.5" }, sender: FAKE.sender } as const;
const wnvda = { route: "wnvda-arc-to-sepolia", amount: { decimal: "2" }, sender: FAKE.sender, recipient: FAKE.recipient } as const;
const usdc = { route: "usdc-sepolia-to-arc", amount: { decimal: "10.25" }, sender: FAKE.sender } as const;

describe("quote", () => {
  it("USDC route: USDC token, 6 decimals, forwarding, fee on source, Standard", async () => {
    const { bridge, kit } = setup();
    const q = await bridge.quote(usdc);
    expect(q).toMatchObject({ route: "usdc-sepolia-to-arc", speed: "STANDARD", amount: 10_250_000n, amountDecimal: "10.25", decimals: 6 });
    expect(q.sourceChain).toBe("Ethereum_Sepolia");
    expect(q.destinationChain).toBe("Arc_Testnet");
    const req = kit.estimate.mock.calls[0]![0];
    expect(req.token).toEqual({ kind: "USDC" });
    expect(req.to).toEqual({ chain: "Arc_Testnet", recipient: FAKE.sender, useForwarder: true });
    expect(req.feePayment).toBe("source");
    expect(req.speed).toBe("STANDARD");
  });

  it("CCTPx routes pass the bytes32 token id and 18-decimal base units", async () => {
    const { bridge, kit } = setup();
    await bridge.quote(mnvda);
    await bridge.quote(wnvda);
    const [m, w] = kit.estimate.mock.calls.map((c) => c[0]);
    expect(m!.token).toEqual({ kind: "CCTPX", tokenId: FAKE.tokenId });
    expect(m!.amount).toBe(1_500_000_000_000_000_000n);
    expect(m!.from.chain).toBe("Ethereum_Sepolia");
    expect(w!.from.chain).toBe("Arc_Testnet");
    expect(w!.to.chain).toBe("Ethereum_Sepolia");
    expect(w!.to.recipient).toBe(FAKE.recipient);
    expect(w!.amount).toBe(2n * 10n ** 18n);
  });

  it("sourceNativeRequired = gas + fees paid in native gas only", async () => {
    const kit = mockKit({
      estimate: {
        speed: "STANDARD",
        sourceGas: 100n,
        fees: [
          { kind: "protocol", paidIn: "native", amount: 20n },
          { kind: "forwarding", paidIn: "token", amount: 999n },
        ],
      },
    });
    const { bridge } = setup({ kit });
    expect((await bridge.quote(wnvda)).sourceNativeRequired).toBe(120n);
  });

  it("FX_SYMBOL_NOT_CONFIGURED from the kit -> QuoteRejectedError", async () => {
    const kit = mockKit();
    kit.estimate.mockRejectedValueOnce(new Error("FX_SYMBOL_NOT_CONFIGURED"));
    const { bridge } = setup({ kit });
    const p = bridge.quote(mnvda);
    await expect(p).rejects.toBeInstanceOf(QuoteRejectedError);
    await expect(p).rejects.toMatchObject({ reason: "FX_SYMBOL_NOT_CONFIGURED" });
  });

  it("a quote at any speed other than the requested Standard is rejected", async () => {
    const { bridge } = setup({ kit: mockKit({ estimate: { speed: "FAST", sourceGas: 1n, fees: [] } }) });
    await expect(bridge.quote(mnvda)).rejects.toMatchObject({ code: "QUOTE_REJECTED", reason: "OTHER" });
  });

  it("TokenNotRegistered revert during the quote -> TokenNotRegisteredError", async () => {
    const kit = mockKit();
    kit.estimate.mockRejectedValueOnce({ message: "execution reverted", data: "0x5d0028cf" });
    const { bridge } = setup({ kit });
    await expect(bridge.quote(wnvda)).rejects.toBeInstanceOf(TokenNotRegisteredError);
  });

  it("input errors are typed and nothing reaches the kit", async () => {
    const { bridge, kit } = setup();
    await expect(bridge.quote({ ...mnvda, route: "mnvda-arc-to-base" })).rejects.toBeInstanceOf(UnsupportedRouteError);
    await expect(bridge.quote({ ...usdc, amount: { decimal: "0.0000001" } })).rejects.toBeInstanceOf(InvalidAmountError);
    await expect(bridge.quote({ ...usdc, amount: { decimal: "0" } })).rejects.toBeInstanceOf(InvalidAmountError);
    await expect(bridge.quote({ ...usdc, sender: "0x12" })).rejects.toBeInstanceOf(InvalidAddressError);
    await expect(bridge.quote({ ...usdc, recipient: "0xzz" })).rejects.toBeInstanceOf(InvalidAddressError);
    expect(kit.estimate).not.toHaveBeenCalled();
  });

  it("missing deployments values -> ConfigMissingError", async () => {
    const d = fullDeployments() as Record<string, any>;
    delete d.arcTestnet.tokens.wNVDA.tokenId;
    const { bridge } = setup({ deps: { deployments: d } });
    await expect(bridge.quote(mnvda)).rejects.toBeInstanceOf(ConfigMissingError);
  });
});

describe("send", () => {
  it("PENDING -> SENT with the source tx hash; checks gas on the source chain", async () => {
    const { bridge, kit, rpc, transitions } = setup();
    const r = await bridge.send(mnvda);
    expect(r.state).toBe("SENT");
    expect(r.sourceTxHash).toBe(SRC_TX);
    expect(r.amount).toBe(1_500_000_000_000_000_000n);
    expect(r.decimals).toBe(18);
    expect(r.recipient).toBe(FAKE.sender);
    expect(transitions.map((t) => t.state)).toEqual(["PENDING", "SENT"]);
    expect(rpc.getNativeBalance).toHaveBeenCalledWith("sepolia", FAKE.sender);
    expect(kit.submit.mock.calls[0]![0].speed).toBe("STANDARD");
  });

  it("gas is checked on Arc for the wNVDA route", async () => {
    const { bridge, rpc } = setup();
    await bridge.send(wnvda);
    expect(rpc.getNativeBalance).toHaveBeenCalledWith("arcTestnet", FAKE.sender);
  });

  it("insufficient gas -> FAILED with InsufficientGasError, nothing submitted", async () => {
    const { bridge, kit, transitions } = setup({ rpc: mockRpc(999n) });
    const r = await bridge.send(mnvda);
    expect(r.state).toBe("FAILED");
    expect(r.error).toBeInstanceOf(InsufficientGasError);
    expect(r.error).toMatchObject({ chain: "sepolia", required: 1_000n, available: 999n });
    expect(kit.submit).not.toHaveBeenCalled();
    expect(transitions.map((t) => t.state)).toEqual(["PENDING", "FAILED"]);
  });

  it("balance exactly equal to the requirement is enough", async () => {
    const { bridge } = setup({ rpc: mockRpc(1_000n) });
    expect((await bridge.send(mnvda)).state).toBe("SENT");
  });

  it("insufficient funds reported by the wallet on submit -> InsufficientGasError", async () => {
    const kit = mockKit();
    kit.submit.mockRejectedValueOnce(new Error("insufficient funds for gas * price + value"));
    const { bridge } = setup({ kit });
    const r = await bridge.send(mnvda);
    expect(r.state).toBe("FAILED");
    expect(r.error).toBeInstanceOf(InsufficientGasError);
  });

  it("user rejection in the wallet -> FAILED with UserRejectedError", async () => {
    const kit = mockKit();
    kit.submit.mockRejectedValueOnce({ code: 4001, message: "User rejected the request." });
    const { bridge } = setup({ kit });
    const r = await bridge.send(usdc);
    expect(r.state).toBe("FAILED");
    expect(r.error).toBeInstanceOf(UserRejectedError);
    expect(r.sourceTxHash).toBeUndefined();
  });

  it("quote rejection during send -> FAILED with QuoteRejectedError", async () => {
    const kit = mockKit();
    kit.estimate.mockRejectedValueOnce(new Error("FX_SYMBOL_NOT_CONFIGURED"));
    const { bridge } = setup({ kit });
    const r = await bridge.send(mnvda);
    expect(r.error).toBeInstanceOf(QuoteRejectedError);
    expect(kit.submit).not.toHaveBeenCalled();
  });

  it("TokenNotRegistered on submit -> FAILED with TokenNotRegisteredError", async () => {
    const kit = mockKit();
    kit.submit.mockRejectedValueOnce(Object.assign(new Error("reverted"), { cause: { data: "0x5d0028cf" } }));
    const { bridge } = setup({ kit });
    const r = await bridge.send(wnvda);
    expect(r.error).toBeInstanceOf(TokenNotRegisteredError);
    expect((r.error as TokenNotRegisteredError).tokenId).toBe(FAKE.tokenId);
  });

  it("RPC failure while reading the balance -> FAILED with a typed error", async () => {
    const rpc = mockRpc();
    rpc.getNativeBalance.mockRejectedValueOnce(new Error("timeout"));
    const { bridge } = setup({ rpc });
    const r = await bridge.send(mnvda);
    expect(r.error).toBeInstanceOf(UnknownBridgeError);
  });

  it("invalid input throws before any record exists", async () => {
    const { bridge, transitions } = setup();
    await expect(bridge.send({ ...mnvda, route: "nope" })).rejects.toBeInstanceOf(UnsupportedRouteError);
    await expect(bridge.send({ ...mnvda, amount: { baseUnits: -5n } })).rejects.toBeInstanceOf(InvalidAmountError);
    expect(transitions).toEqual([]);
  });

  it("base-unit amounts pass through without conversion", async () => {
    const { bridge, kit } = setup();
    await bridge.send({ ...usdc, amount: { baseUnits: 1n } });
    expect(kit.submit.mock.calls[0]![0]).toMatchObject({ amount: 1n, amountDecimal: "0.000001", decimals: 6 });
  });

  it("works without the optional deps (default clock and id)", async () => {
    const bridge = createBridge({ kit: mockKit(), rpc: mockRpc(), deployments: fullDeployments() });
    const r = await bridge.send(mnvda);
    expect(r.state).toBe("SENT");
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("status", () => {
  async function sent(opts: Parameters<typeof setup>[0] = {}) {
    const s = setup(opts);
    const r = await s.bridge.send(mnvda);
    return { ...s, r };
  }

  it("SENT stays SENT while the source tx is not mined", async () => {
    const { bridge, r, kit } = await sent();
    const next = await bridge.status(r);
    expect(next).toBe(r);
    expect(kit.getStatus).not.toHaveBeenCalled();
  });

  it("SENT -> CONFIRMED when the source tx is mined and the destination is pending", async () => {
    const { bridge, r, rpc } = await sent();
    rpc.getTransactionReceipt.mockResolvedValue({ status: "success", blockNumber: 77n });
    const next = await bridge.status(r);
    expect(next.state).toBe("CONFIRMED");
    expect(next.sourceBlockNumber).toBe(77n);
    expect(rpc.getTransactionReceipt).toHaveBeenCalledWith("sepolia", SRC_TX);
  });

  it("SENT -> CONFIRMED -> COMPLETE in one call when the kit already reports complete", async () => {
    const { bridge, r, rpc, kit, transitions } = await sent();
    rpc.getTransactionReceipt.mockResolvedValue({ status: "success", blockNumber: 1n });
    kit.getStatus.mockResolvedValue({ state: "complete", destinationTxHash: DST_TX });
    const next = await bridge.status(r);
    expect(next.state).toBe("COMPLETE");
    expect(next.destinationTxHash).toBe(DST_TX);
    expect(transitions.map((t) => t.state)).toEqual(["PENDING", "SENT", "CONFIRMED", "COMPLETE"]);
    expect(kit.getStatus.mock.calls[0]![0]).toMatchObject({
      sourceTxHash: SRC_TX,
      sourceChain: "Ethereum_Sepolia",
      destinationChain: "Arc_Testnet",
      token: { kind: "CCTPX", tokenId: FAKE.tokenId },
    });
  });

  it("CONFIRMED -> COMPLETE without re-reading the receipt", async () => {
    const { bridge, r, rpc, kit } = await sent();
    rpc.getTransactionReceipt.mockResolvedValue({ status: "success", blockNumber: 1n });
    const confirmed = await bridge.status(r);
    rpc.getTransactionReceipt.mockClear();
    kit.getStatus.mockResolvedValue({ state: "complete" });
    const done = await bridge.status(confirmed);
    expect(done.state).toBe("COMPLETE");
    expect(done.destinationTxHash).toBeUndefined();
    expect(rpc.getTransactionReceipt).not.toHaveBeenCalled();
  });

  it("source revert -> FAILED with SourceTxRevertedError", async () => {
    const { bridge, r, rpc } = await sent();
    rpc.getTransactionReceipt.mockResolvedValue({ status: "reverted", blockNumber: 1n });
    const next = await bridge.status(r);
    expect(next.state).toBe("FAILED");
    expect(next.error).toBeInstanceOf(SourceTxRevertedError);
  });

  it("source revert with 0x5d0028cf data -> FAILED with TokenNotRegisteredError", async () => {
    const { bridge, r, rpc } = await sent();
    rpc.getTransactionReceipt.mockResolvedValue({ status: "reverted", blockNumber: 1n, revertData: "0x5d0028cf" });
    expect((await bridge.status(r)).error).toBeInstanceOf(TokenNotRegisteredError);
  });

  it("CONFIRMED -> FAILED when the kit reports a destination failure", async () => {
    const { bridge, r, rpc, kit } = await sent();
    rpc.getTransactionReceipt.mockResolvedValue({ status: "success", blockNumber: 1n });
    kit.getStatus.mockResolvedValue({ state: "failed", reason: "attestation expired" });
    const next = await bridge.status(r);
    expect(next.state).toBe("FAILED");
    expect(next.error).toBeInstanceOf(DestinationFailedError);
    expect(next.error!.message).toBe("attestation expired");
  });

  it("transient kit error after confirming keeps CONFIRMED; a later error with no progress throws", async () => {
    const { bridge, r, rpc, kit } = await sent();
    rpc.getTransactionReceipt.mockResolvedValue({ status: "success", blockNumber: 1n });
    kit.getStatus.mockRejectedValue(new Error("502"));
    const confirmed = await bridge.status(r);
    expect(confirmed.state).toBe("CONFIRMED");
    await expect(bridge.status(confirmed)).rejects.toBeInstanceOf(UnknownBridgeError);
  });

  it("RPC error while SENT throws a typed error and does not fail the transfer", async () => {
    const { bridge, r, rpc } = await sent();
    rpc.getTransactionReceipt.mockRejectedValue(new Error("rate limited"));
    await expect(bridge.status(r)).rejects.toBeInstanceOf(UnknownBridgeError);
  });

  it("terminal and PENDING records are returned unchanged with no I/O", async () => {
    const { bridge, rpc, kit } = setup({ rpc: mockRpc(0n) });
    const failed = await bridge.send(mnvda);
    expect(failed.state).toBe("FAILED");
    expect(await bridge.status(failed)).toBe(failed);
    const pending = { ...failed, state: "PENDING" as const, error: undefined };
    expect(await bridge.status(pending)).toBe(pending);
    expect(rpc.getTransactionReceipt).not.toHaveBeenCalled();
    expect(kit.getStatus).not.toHaveBeenCalled();
  });

  it("USDC route status uses the USDC token and Sepolia receipts", async () => {
    const { bridge, rpc, kit } = setup({ rpc: mockRpc(ONE_ETH, { status: "success", blockNumber: 3n }) });
    const r = await bridge.send(usdc);
    await bridge.status(r);
    expect(rpc.getTransactionReceipt).toHaveBeenCalledWith("sepolia", SRC_TX);
    expect(kit.getStatus.mock.calls[0]![0].token).toEqual({ kind: "USDC" });
  });
});

describe("resume", () => {
  it("is a signature only until T-036", async () => {
    const { bridge } = setup();
    const r = await bridge.send(mnvda);
    await expect(bridge.resume(r)).rejects.toBeInstanceOf(NotImplementedError);
  });
});

describe("no network", () => {
  it("fetch is blocked in unit tests", () => {
    expect(() => fetch("https://example.com")).toThrow(/not allowed/);
  });
});
