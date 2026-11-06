// Shared types for the bridge layer (T-033).

/** 0x-prefixed hex string. */
export type Hex = `0x${string}`;
/** 20-byte EVM address, 0x-prefixed. */
export type Address = `0x${string}`;
/** 32-byte value, 0x-prefixed (CCTPx token id). */
export type Bytes32 = `0x${string}`;

/** Internal chain keys. The Bridge Kit chain names live in config (`kitChainName`). */
export type ChainKey = "sepolia" | "arcTestnet";

/** Internal token keys. */
export type TokenKey = "USDC" | "mNVDA" | "wNVDA";

/** The three supported routes (TASKS.md T-033). */
export type RouteId =
  | "usdc-sepolia-to-arc"
  | "wnvda-arc-to-sepolia"
  | "mnvda-sepolia-to-arc";

/**
 * Transfer speed. The module always requests STANDARD: Circle rejects Fast quotes
 * for tokens without an FX symbol (FX_SYMBOL_NOT_CONFIGURED, ADR 0013 amendment).
 */
export type TransferSpeed = "STANDARD";

/** Who pays the bridge fee. ADR 0003 and ADR 0013: always the source chain. */
export type FeePayment = "source";

/** Transfer states (pure state machine in state.ts). */
export type TransferState = "PENDING" | "SENT" | "CONFIRMED" | "COMPLETE" | "FAILED";

/** Amount given either as a human decimal string ("1.5") or as base units. */
export type AmountInput = { decimal: string } | { baseUnits: bigint };
