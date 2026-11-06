import { describe, expect, it } from "vitest";
import {
  BridgeError,
  InsufficientGasError,
  QuoteRejectedError,
  TOKEN_NOT_REGISTERED_SELECTOR,
  TokenNotRegisteredError,
  UnknownBridgeError,
  UnsupportedRouteError,
  UserRejectedError,
  classifyError,
} from "../src/errors";
import { FAKE } from "./fixtures";

const ctx = { sourceChain: "sepolia", tokenId: FAKE.tokenId };

describe("typed errors", () => {
  it("carry a stable code, a name and are BridgeErrors", () => {
    const e = new TokenNotRegisteredError(FAKE.tokenId);
    expect(e).toBeInstanceOf(BridgeError);
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe("TOKEN_NOT_REGISTERED");
    expect(e.name).toBe("TokenNotRegisteredError");
    expect(e.selector).toBe("0x5d0028cf");
    expect(e.message).toContain(FAKE.tokenId);
  });

  it("InsufficientGasError reports required and available", () => {
    const e = new InsufficientGasError("arcTestnet", 10n, 3n);
    expect(e.code).toBe("INSUFFICIENT_GAS");
    expect(e.message).toContain("need 10, have 3");
  });
});

describe("classifyError", () => {
  it("passes BridgeErrors through unchanged", () => {
    const e = new UnsupportedRouteError("x");
    expect(classifyError(e, ctx)).toBe(e);
  });

  it("revert data 0x5d0028cf -> TokenNotRegisteredError (nested in cause)", () => {
    const raw = { message: "execution reverted", cause: { data: `${TOKEN_NOT_REGISTERED_SELECTOR}` } };
    const e = classifyError(raw, ctx);
    expect(e).toBeInstanceOf(TokenNotRegisteredError);
    expect((e as TokenNotRegisteredError).tokenId).toBe(FAKE.tokenId);
    expect(e.cause).toBe(raw);
  });

  it("error name TokenNotRegistered -> TokenNotRegisteredError", () => {
    expect(classifyError(new Error('reverted with custom error "TokenNotRegistered()"'), ctx)).toBeInstanceOf(
      TokenNotRegisteredError,
    );
  });

  it("upper-case selector in revert data is matched", () => {
    expect(classifyError({ data: "0x5D0028CF" }, ctx)).toBeInstanceOf(TokenNotRegisteredError);
  });

  it("FX_SYMBOL_NOT_CONFIGURED -> QuoteRejectedError", () => {
    const e = classifyError({ error: { message: "quote failed: FX_SYMBOL_NOT_CONFIGURED" } }, ctx);
    expect(e).toBeInstanceOf(QuoteRejectedError);
    expect((e as QuoteRejectedError).reason).toBe("FX_SYMBOL_NOT_CONFIGURED");
  });

  it("insufficient funds -> InsufficientGasError on the source chain", () => {
    const e = classifyError(new Error("insufficient funds for gas * price + value"), ctx);
    expect(e).toBeInstanceOf(InsufficientGasError);
    expect((e as InsufficientGasError).chain).toBe("sepolia");
    expect(classifyError({ code: "INSUFFICIENT_FUNDS" }, ctx)).toBeInstanceOf(InsufficientGasError);
  });

  it("EIP-1193 4001, ACTION_REJECTED, UserRejectedRequestError and message -> UserRejectedError", () => {
    expect(classifyError({ code: 4001, message: "rejected" }, ctx)).toBeInstanceOf(UserRejectedError);
    expect(classifyError({ code: "ACTION_REJECTED" }, ctx)).toBeInstanceOf(UserRejectedError);
    const named = Object.assign(new Error("x"), { name: "UserRejectedRequestError" });
    expect(classifyError(named, ctx)).toBeInstanceOf(UserRejectedError);
    expect(classifyError(new Error("User denied transaction signature"), ctx)).toBeInstanceOf(UserRejectedError);
    expect(classifyError({ cause: { cause: { code: 4001 } } }, ctx)).toBeInstanceOf(UserRejectedError);
  });

  it("anything else -> UnknownBridgeError keeping the cause", () => {
    const raw = new Error("socket hang up");
    const e = classifyError(raw, ctx);
    expect(e).toBeInstanceOf(UnknownBridgeError);
    expect(e.message).toBe("socket hang up");
    expect(e.cause).toBe(raw);
    expect(classifyError(undefined, ctx)).toBeInstanceOf(UnknownBridgeError);
  });

  it("does not loop on cyclic causes", () => {
    const a: Record<string, unknown> = { message: "a" };
    a.cause = a;
    expect(classifyError(a, ctx)).toBeInstanceOf(UnknownBridgeError);
  });
});
