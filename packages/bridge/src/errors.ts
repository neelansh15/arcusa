// Typed errors for the bridge layer. Every error has a stable `code`.

export type BridgeErrorCode =
  | "CONFIG_MISSING"
  | "CONFIG_INVALID"
  | "UNSUPPORTED_ROUTE"
  | "INVALID_AMOUNT"
  | "INVALID_TRANSITION";

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
