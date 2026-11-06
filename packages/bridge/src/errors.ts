// Typed errors for the bridge layer. Every error has a stable `code`.

export type BridgeErrorCode =
  | "CONFIG_MISSING"
  | "CONFIG_INVALID"
  | "UNSUPPORTED_ROUTE"
  | "INVALID_AMOUNT"
  | "INVALID_TRANSITION"
  | "TOKEN_NOT_REGISTERED"
  | "QUOTE_REJECTED"
  | "INSUFFICIENT_GAS"
  | "USER_REJECTED"
  | "SOURCE_TX_REVERTED"
  | "DESTINATION_FAILED"
  | "NOT_IMPLEMENTED"
  | "UNKNOWN";

export abstract class BridgeError extends Error {
  abstract readonly code: BridgeErrorCode;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** A value that must come from deployments/<network>.json is not there yet. */
export class ConfigMissingError extends BridgeError {
  readonly code = "CONFIG_MISSING" as const;
  constructor(readonly path: string) {
    super(`missing config value: ${path} (fill it from deployments/<network>.json)`);
  }
}

/** A config value is present but malformed or inconsistent. */
export class ConfigInvalidError extends BridgeError {
  readonly code = "CONFIG_INVALID" as const;
  constructor(readonly path: string, reason: string) {
    super(`invalid config value at ${path}: ${reason}`);
  }
}

/** The requested route is not one of the three supported routes. */
export class UnsupportedRouteError extends BridgeError {
  readonly code = "UNSUPPORTED_ROUTE" as const;
  constructor(readonly route: string) {
    super(`unsupported route: ${route}`);
  }
}

/** Amount is not a positive value representable at the token's decimals. */
export class InvalidAmountError extends BridgeError {
  readonly code = "INVALID_AMOUNT" as const;
}

/** The state machine was asked for a move it does not allow. */
export class InvalidTransitionError extends BridgeError {
  readonly code = "INVALID_TRANSITION" as const;
  constructor(readonly from: string, readonly event: string) {
    super(`invalid transition: ${event} from ${from}`);
  }
}

/** Selector of the CCTPx `TokenNotRegistered()` custom error (FEEDBACK.md 2.3, ADR 0013). */
export const TOKEN_NOT_REGISTERED_SELECTOR = "0x5d0028cf";

/** The CCTPx token id is not registered (revert `TokenNotRegistered`, 0x5d0028cf). */
export class TokenNotRegisteredError extends BridgeError {
  readonly code = "TOKEN_NOT_REGISTERED" as const;
  readonly selector = TOKEN_NOT_REGISTERED_SELECTOR;
  constructor(readonly tokenId: string | undefined, options?: { cause?: unknown }) {
    super(`token not registered in CCTPx${tokenId ? `: ${tokenId}` : ""} (${TOKEN_NOT_REGISTERED_SELECTOR})`, options);
  }
}

/** Circle refused the quote. Known reason: FX_SYMBOL_NOT_CONFIGURED (Fast asked for a token with no FX symbol). */
export class QuoteRejectedError extends BridgeError {
  readonly code = "QUOTE_REJECTED" as const;
  constructor(readonly reason: "FX_SYMBOL_NOT_CONFIGURED" | "OTHER", message: string, options?: { cause?: unknown }) {
    super(`quote rejected (${reason}): ${message}`, options);
  }
}

/** The sender's native balance on the source chain does not cover the estimated gas. */
export class InsufficientGasError extends BridgeError {
  readonly code = "INSUFFICIENT_GAS" as const;
  constructor(
    readonly chain: string,
    /** Native base units; undefined when only the wallet/RPC said so. */
    readonly required: bigint | undefined,
    readonly available: bigint | undefined,
    options?: { cause?: unknown },
  ) {
    super(
      `insufficient gas on ${chain}` +
        (required !== undefined && available !== undefined ? `: need ${required}, have ${available} (native base units)` : ""),
      options,
    );
  }
}

/** The user rejected the signature or transaction in the wallet. */
export class UserRejectedError extends BridgeError {
  readonly code = "USER_REJECTED" as const;
  constructor(options?: { cause?: unknown }) {
    super("user rejected the request in the wallet", options);
  }
}

/** The source-chain transaction was mined but reverted. */
export class SourceTxRevertedError extends BridgeError {
  readonly code = "SOURCE_TX_REVERTED" as const;
  constructor(readonly txHash: string, options?: { cause?: unknown }) {
    super(`source transaction reverted: ${txHash}`, options);
  }
}

/** The kit reported that the destination side failed. */
export class DestinationFailedError extends BridgeError {
  readonly code = "DESTINATION_FAILED" as const;
}

/** Feature exists as a signature only (resume: T-036). */
export class NotImplementedError extends BridgeError {
  readonly code = "NOT_IMPLEMENTED" as const;
}

/** Anything the classifier does not recognise. The original error is kept as `cause`. */
export class UnknownBridgeError extends BridgeError {
  readonly code = "UNKNOWN" as const;
}

// ---------------------------------------------------------------------------
// Classifier: maps an error thrown by the Bridge Kit adapter, the wallet or the
// RPC into a typed error. The matching is heuristic on purpose (codes, names,
// revert data, messages); the real shapes must be checked against the real
// Bridge Kit in T-024.
// ---------------------------------------------------------------------------

export interface ClassifyContext {
  readonly sourceChain: string;
  readonly tokenId?: string;
}

/** Walk an error, its `cause` chain and nested `error`/`data` fields, collecting strings and codes. */
function collect(err: unknown, depth = 0, out: { strings: string[]; codes: unknown[]; names: string[] } = { strings: [], codes: [], names: [] }) {
  if (depth > 6 || err === null || err === undefined) return out;
  if (typeof err === "string") {
    out.strings.push(err);
    return out;
  }
  if (typeof err !== "object") return out;
  const o = err as Record<string, unknown>;
  if (typeof o.name === "string") out.names.push(o.name);
  if ("code" in o) out.codes.push(o.code);
  for (const k of ["message", "shortMessage", "details", "reason", "data", "errorName", "signature"]) {
    if (typeof o[k] === "string") out.strings.push(o[k] as string);
  }
  for (const k of ["cause", "error", "data", "originalError"]) {
    if (typeof o[k] === "object") collect(o[k], depth + 1, out);
  }
  return out;
}

export function classifyError(err: unknown, ctx: ClassifyContext): BridgeError {
  if (err instanceof BridgeError) return err;
  const { strings, codes, names } = collect(err);
  const text = strings.join("\n");
  const lower = text.toLowerCase();

  if (
    codes.includes(4001) ||
    codes.includes("ACTION_REJECTED") ||
    names.includes("UserRejectedRequestError") ||
    /user (rejected|denied)/i.test(text)
  ) {
    return new UserRejectedError({ cause: err });
  }
  if (lower.includes(TOKEN_NOT_REGISTERED_SELECTOR) || text.includes("TokenNotRegistered")) {
    return new TokenNotRegisteredError(ctx.tokenId, { cause: err });
  }
  if (text.includes("FX_SYMBOL_NOT_CONFIGURED")) {
    return new QuoteRejectedError("FX_SYMBOL_NOT_CONFIGURED", firstLine(text), { cause: err });
  }
  if (/insufficient funds/i.test(text) || codes.includes("INSUFFICIENT_FUNDS")) {
    return new InsufficientGasError(ctx.sourceChain, undefined, undefined, { cause: err });
  }
  return new UnknownBridgeError(firstLine(text) || "unknown bridge error", { cause: err });
}

function firstLine(s: string): string {
  return s.split("\n")[0] ?? "";
}
