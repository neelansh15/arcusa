import { describe, expect, it } from "vitest";
import { CHAINS, ROUTE_IDS, ROUTES, TOKENS, getRoute, resolveRoute, resolveToken } from "../src/config";
import { ConfigInvalidError, ConfigMissingError, UnsupportedRouteError } from "../src/errors";
import { FAKE, fullDeployments } from "./fixtures";

type Json = Record<string, any>;

function withEdit(edit: (d: Json) => void) {
  const d = fullDeployments() as Json;
  edit(d);
  return d;
}

describe("static config", () => {
  it("has exactly the three routes", () => {
    expect(ROUTE_IDS.sort()).toEqual(["mnvda-sepolia-to-arc", "usdc-sepolia-to-arc", "wnvda-arc-to-sepolia"]);
  });

  it("routes use Standard speed, source fee payment and forwarding", () => {
    for (const r of Object.values(ROUTES)) {
      expect(r.speed).toBe("STANDARD");
      expect(r.feePayment).toBe("source");
      expect(r.useForwarder).toBe(true);
    }
  });

  it("route directions match the task", () => {
    expect(ROUTES["usdc-sepolia-to-arc"]).toMatchObject({ source: "sepolia", destination: "arcTestnet", sourceToken: "USDC" });
    expect(ROUTES["wnvda-arc-to-sepolia"]).toMatchObject({ source: "arcTestnet", destination: "sepolia", sourceToken: "wNVDA", destinationToken: "mNVDA" });
    expect(ROUTES["mnvda-sepolia-to-arc"]).toMatchObject({ source: "sepolia", destination: "arcTestnet", sourceToken: "mNVDA", destinationToken: "wNVDA" });
  });

  it("chain and token facts from the ADRs", () => {
    expect(CHAINS.arcTestnet.chainId).toBe(5042002);
    expect(CHAINS.arcTestnet.rpcUrl).toBe("https://rpc.testnet.arc.io");
    expect(TOKENS.USDC.expectedDecimals).toBe(6);
    expect(TOKENS.mNVDA.expectedDecimals).toBe(18);
    expect(TOKENS.wNVDA.expectedDecimals).toBe(18);
  });

  it("getRoute rejects unknown routes", () => {
    expect(() => getRoute("usdc-arc-to-sepolia")).toThrow(UnsupportedRouteError);
    expect(() => getRoute("toString")).toThrow(UnsupportedRouteError);
  });
});

describe("resolveRoute", () => {
  it("resolves all three routes from complete deployments", () => {
    const d = fullDeployments();
    const usdc = resolveRoute("usdc-sepolia-to-arc", d);
    expect(usdc.sourceTokenResolved.address).toBe(FAKE.usdcSepolia);
    expect(usdc.destinationTokenResolved.address).toBe(FAKE.usdcArc);
    expect(usdc.tokenId).toBeUndefined();

    const w = resolveRoute("wnvda-arc-to-sepolia", d);
    expect(w.tokenId).toBe(FAKE.tokenId);
    expect(w.sourceChain.kitChainName).toBe("Arc_Testnet");
    expect(w.destinationTokenResolved.address).toBe(FAKE.mNVDA);

    const m = resolveRoute("mnvda-sepolia-to-arc", d);
    expect(m.sourceTokenResolved.decimals).toBe(18);
  });

  it("USDC route works before the mNVDA deployment exists", () => {
    const d = withEdit((x) => {
      delete x.sepolia.tokens.mNVDA;
      delete x.arcTestnet.tokens.wNVDA;
    });
    expect(resolveRoute("usdc-sepolia-to-arc", d).id).toBe("usdc-sepolia-to-arc");
    expect(() => resolveRoute("mnvda-sepolia-to-arc", d)).toThrow(ConfigMissingError);
  });

  it("missing file, chainId, tokens, entry, address, decimals and tokenId are ConfigMissingError with a path", () => {
    const cases: Array<[(d: Json) => void, string]> = [
      [(d) => delete d.arcTestnet, "deployments/arc-testnet.json"],
      [(d) => delete d.sepolia.chainId, "deployments/sepolia.json:chainId"],
      [(d) => delete d.sepolia.tokens, "deployments/sepolia.json:tokens"],
      [(d) => delete d.sepolia.tokens.mNVDA, "deployments/sepolia.json:tokens.mNVDA"],
      [(d) => (d.sepolia.tokens.mNVDA.address = ""), "deployments/sepolia.json:tokens.mNVDA.address"],
      [(d) => delete d.sepolia.tokens.mNVDA.decimals, "deployments/sepolia.json:tokens.mNVDA.decimals"],
      [(d) => delete d.sepolia.tokens.mNVDA.tokenId, "deployments/sepolia.json:tokens.mNVDA.tokenId"],
    ];
    for (const [edit, path] of cases) {
      const err = catchErr(() => resolveRoute("mnvda-sepolia-to-arc", withEdit(edit)));
      expect(err, path).toBeInstanceOf(ConfigMissingError);
      expect((err as ConfigMissingError).code).toBe("CONFIG_MISSING");
      expect((err as ConfigMissingError).path).toBe(path);
    }
  });

  it("malformed or inconsistent values are ConfigInvalidError", () => {
    const cases: Array<(d: Json) => void> = [
      (d) => (d.sepolia = "nope"),
      (d) => (d.sepolia.chainId = 1),
      (d) => (d.sepolia.tokens.mNVDA.address = "0x1234"),
      (d) => (d.sepolia.tokens.mNVDA.address = `0x${"0".repeat(40)}`),
      (d) => (d.sepolia.tokens.mNVDA.decimals = 6),
      (d) => (d.sepolia.tokens.mNVDA.tokenId = "0xabc"),
      (d) => (d.sepolia.tokens.mNVDA.tokenId = `0x${"0".repeat(64)}`),
      (d) => (d.arcTestnet.tokens.wNVDA.tokenId = `0x${"cd".repeat(32)}`),
    ];
    for (const edit of cases) {
      expect(() => resolveRoute("mnvda-sepolia-to-arc", withEdit(edit))).toThrow(ConfigInvalidError);
    }
  });

  it("USDC with 18 decimals in the file is rejected (app uses the 6-decimal interface)", () => {
    const d = withEdit((x) => (x.arcTestnet.tokens.USDC.decimals = 18));
    expect(() => resolveToken(d, "arcTestnet", "USDC")).toThrow(ConfigInvalidError);
  });

  it("unknown route is UnsupportedRouteError", () => {
    expect(() => resolveRoute("eurc-sepolia-to-arc", fullDeployments())).toThrow(UnsupportedRouteError);
  });
});

function catchErr(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error("expected a throw");
}
