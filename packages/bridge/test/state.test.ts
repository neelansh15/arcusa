import { describe, expect, it } from "vitest";
import { InvalidTransitionError, UnsupportedRouteError } from "../src/errors";
import { canTransition, isTerminal, newRecord, transition, type TransferEvent, type TransferRecord } from "../src/state";
import type { TransferState } from "../src/types";
import { FAKE } from "./fixtures";

const TX = `0x${"aa".repeat(32)}` as const;
const DTX = `0x${"bb".repeat(32)}` as const;
const err = new UnsupportedRouteError("x");

function pending(): TransferRecord {
  return newRecord(
    { id: "t1", route: "mnvda-sepolia-to-arc", amount: 5n, decimals: 18, sender: FAKE.sender, recipient: FAKE.recipient },
    1000,
  );
}

function at(state: TransferState): TransferRecord {
  let r = pending();
  if (state === "PENDING") return r;
  if (state === "FAILED") return transition(r, { type: "FAILED", error: err }, 1001);
  r = transition(r, { type: "SUBMITTED", sourceTxHash: TX }, 1001);
  if (state === "SENT") return r;
  r = transition(r, { type: "SOURCE_CONFIRMED", blockNumber: 7n }, 1002);
  if (state === "CONFIRMED") return r;
  return transition(r, { type: "DESTINATION_COMPLETE", destinationTxHash: DTX }, 1003);
}

const EVENTS: TransferEvent[] = [
  { type: "SUBMITTED", sourceTxHash: TX },
  { type: "SOURCE_CONFIRMED" },
  { type: "DESTINATION_COMPLETE" },
  { type: "FAILED", error: err },
];

const ALLOWED: Record<TransferState, TransferEvent["type"][]> = {
  PENDING: ["SUBMITTED", "FAILED"],
  SENT: ["SOURCE_CONFIRMED", "FAILED"],
  CONFIRMED: ["DESTINATION_COMPLETE", "FAILED"],
  COMPLETE: [],
  FAILED: [],
};

describe("state machine", () => {
  it("new records start PENDING with timestamps", () => {
    const r = pending();
    expect(r.state).toBe("PENDING");
    expect(r.createdAt).toBe(1000);
    expect(r.updatedAt).toBe(1000);
  });

  it("PENDING -> SENT records the source tx hash", () => {
    const r = transition(pending(), { type: "SUBMITTED", sourceTxHash: TX }, 2000);
    expect(r.state).toBe("SENT");
    expect(r.sourceTxHash).toBe(TX);
    expect(r.updatedAt).toBe(2000);
    expect(r.createdAt).toBe(1000);
  });

  it("SENT -> CONFIRMED records the block number", () => {
    const r = transition(at("SENT"), { type: "SOURCE_CONFIRMED", blockNumber: 42n }, 3000);
    expect(r.state).toBe("CONFIRMED");
    expect(r.sourceBlockNumber).toBe(42n);
    expect(r.sourceTxHash).toBe(TX);
  });

  it("CONFIRMED -> COMPLETE records the destination tx hash", () => {
    const r = transition(at("CONFIRMED"), { type: "DESTINATION_COMPLETE", destinationTxHash: DTX }, 4000);
    expect(r.state).toBe("COMPLETE");
    expect(r.destinationTxHash).toBe(DTX);
  });

  it.each(["PENDING", "SENT", "CONFIRMED"] as const)("%s -> FAILED keeps the typed error", (s) => {
    const r = transition(at(s), { type: "FAILED", error: err }, 5000);
    expect(r.state).toBe("FAILED");
    expect(r.error).toBe(err);
  });

  it("does not mutate the input record", () => {
    const r = pending();
    const copy = { ...r };
    transition(r, { type: "SUBMITTED", sourceTxHash: TX }, 2000);
    expect(r).toEqual(copy);
  });

  it("every disallowed (state, event) pair throws InvalidTransitionError", () => {
    for (const s of Object.keys(ALLOWED) as TransferState[]) {
      for (const e of EVENTS) {
        const allowed = ALLOWED[s].includes(e.type);
        expect(canTransition(s, e.type), `${s} ${e.type}`).toBe(allowed);
        if (!allowed) {
          expect(() => transition(at(s), e, 9), `${s} ${e.type}`).toThrow(InvalidTransitionError);
        }
      }
    }
  });

  it("only COMPLETE and FAILED are terminal", () => {
    expect(["PENDING", "SENT", "CONFIRMED", "COMPLETE", "FAILED"].filter((s) => isTerminal(s as TransferState))).toEqual([
      "COMPLETE",
      "FAILED",
    ]);
  });
});
