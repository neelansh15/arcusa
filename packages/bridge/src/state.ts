// Pure transfer state machine (T-033). No I/O; persistence is T-036.
//
//   PENDING --SUBMITTED--> SENT --SOURCE_CONFIRMED--> CONFIRMED --DESTINATION_COMPLETE--> COMPLETE
//      \                     \                           \
//       +------FAILED---------+----------FAILED-----------+--> FAILED
//
// COMPLETE and FAILED are terminal.
import { InvalidTransitionError, type BridgeError } from "./errors";
import type { Hex, RouteId, TransferState } from "./types";

export interface TransferRecord {
  readonly id: string;
  readonly route: RouteId;
  /** Base units of the source token. */
  readonly amount: bigint;
  readonly decimals: number;
  readonly sender: Hex;
  readonly recipient: Hex;
  readonly state: TransferState;
  readonly sourceTxHash?: Hex;
  readonly sourceBlockNumber?: bigint;
  readonly destinationTxHash?: Hex;
  readonly error?: BridgeError;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type TransferEvent =
  | { type: "SUBMITTED"; sourceTxHash: Hex }
  | { type: "SOURCE_CONFIRMED"; blockNumber?: bigint }
  | { type: "DESTINATION_COMPLETE"; destinationTxHash?: Hex }
  | { type: "FAILED"; error: BridgeError };

const NEXT: Readonly<Record<TransferState, Partial<Record<TransferEvent["type"], TransferState>>>> = {
  PENDING: { SUBMITTED: "SENT", FAILED: "FAILED" },
  SENT: { SOURCE_CONFIRMED: "CONFIRMED", FAILED: "FAILED" },
  CONFIRMED: { DESTINATION_COMPLETE: "COMPLETE", FAILED: "FAILED" },
  COMPLETE: {},
  FAILED: {},
};

export function isTerminal(state: TransferState): boolean {
  return state === "COMPLETE" || state === "FAILED";
}

export function canTransition(state: TransferState, event: TransferEvent["type"]): boolean {
  return NEXT[state][event] !== undefined;
}

/** Apply one event. Returns a new record; throws InvalidTransitionError for an illegal move. */
export function transition(record: TransferRecord, event: TransferEvent, now: number): TransferRecord {
  const to = NEXT[record.state][event.type];
  if (to === undefined) throw new InvalidTransitionError(record.state, event.type);
  const base = { ...record, state: to, updatedAt: now };
  switch (event.type) {
    case "SUBMITTED":
      return { ...base, sourceTxHash: event.sourceTxHash };
    case "SOURCE_CONFIRMED":
      return event.blockNumber === undefined ? base : { ...base, sourceBlockNumber: event.blockNumber };
    case "DESTINATION_COMPLETE":
      return event.destinationTxHash === undefined ? base : { ...base, destinationTxHash: event.destinationTxHash };
    case "FAILED":
      return { ...base, error: event.error };
  }
}

export function newRecord(
  init: Omit<TransferRecord, "state" | "createdAt" | "updatedAt" | "sourceTxHash" | "sourceBlockNumber" | "destinationTxHash" | "error">,
  now: number,
): TransferRecord {
  return { ...init, state: "PENDING", createdAt: now, updatedAt: now };
}
