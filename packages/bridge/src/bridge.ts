// Public bridge API: quote, send, status, resume (T-033).
// Bridge Kit (behind BridgeKitPort) is the only transfer path (ADR 0013); there is
// no raw CrossChainTokenService code in this module.
import { formatUnits, toBaseUnits } from "./amount";
import { resolveRoute, type DeploymentsInput, type ResolvedRoute } from "./config";
import {
  BridgeError,
  DestinationFailedError,
  InsufficientGasError,
  InvalidAddressError,
  NotImplementedError,
  QuoteRejectedError,
  SourceTxRevertedError,
  TOKEN_NOT_REGISTERED_SELECTOR,
  TokenNotRegisteredError,
  classifyError,
} from "./errors";
import type { BridgeKitPort, KitEstimate, KitFee, KitToken, KitTransferRequest, RpcPort } from "./ports";
import { isTerminal, newRecord, transition, type TransferEvent, type TransferRecord } from "./state";
import type { Address, AmountInput, RouteId, TransferSpeed } from "./types";

export interface BridgeDeps {
  readonly kit: BridgeKitPort;
  readonly rpc: RpcPort;
  /** Parsed deployments/<network>.json per chain. */
  readonly deployments: DeploymentsInput;
  readonly now?: () => number;
  readonly newId?: () => string;
  /** Called after every state change (T-036 hooks persistence here). */
  readonly onTransition?: (record: TransferRecord) => void;
}

export interface TransferRequest {
  readonly route: string;
  readonly amount: AmountInput;
  readonly sender: Address;
  /** Defaults to the sender. */
  readonly recipient?: Address;
}

export interface Quote {
  readonly route: RouteId;
  readonly speed: TransferSpeed;
  readonly amount: bigint;
  readonly amountDecimal: string;
  readonly decimals: number;
  readonly fees: readonly KitFee[];
  /** Native base units on the source chain: estimated gas plus fees paid in native gas. */
  readonly sourceNativeRequired: bigint;
  readonly sourceChain: string;
  readonly destinationChain: string;
}

export interface Bridge {
  /** Price a transfer. Throws a typed BridgeError (UnsupportedRoute, ConfigMissing, InvalidAmount, QuoteRejected, TokenNotRegistered, ...). */
  quote(req: TransferRequest): Promise<Quote>;
  /**
   * Start a transfer. Invalid input (route, config, amount, address) throws before a record exists.
   * Once a PENDING record exists, failures do not throw: the returned record is FAILED with `error` set.
   */
  send(req: TransferRequest): Promise<TransferRecord>;
  /** Advance a record as far as the chain and the kit allow. Terminal records are returned unchanged. */
  status(record: TransferRecord): Promise<TransferRecord>;
  /** Continue an in-flight transfer after a restart. Signature only: the behaviour and storage are T-036. */
  resume(record: TransferRecord): Promise<TransferRecord>;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function kitToken(r: ResolvedRoute): KitToken {
  return r.tokenId ? { kind: "CCTPX", tokenId: r.tokenId } : { kind: "USDC" };
}

function nativeRequired(est: KitEstimate): bigint {
  return est.fees.filter((f) => f.paidIn === "native").reduce((sum, f) => sum + f.amount, est.sourceGas);
}

export function createBridge(deps: BridgeDeps): Bridge {
  const now = deps.now ?? (() => Date.now());
  const newId = deps.newId ?? (() => globalThis.crypto.randomUUID());

  function prepare(req: TransferRequest): { route: ResolvedRoute; kitReq: KitTransferRequest } {
    const route = resolveRoute(req.route, deps.deployments);
    const decimals = route.sourceTokenResolved.decimals;
    const amount = toBaseUnits(req.amount, decimals);
    if (!ADDRESS_RE.test(req.sender)) throw new InvalidAddressError("sender", req.sender);
    const recipient = req.recipient ?? req.sender;
    if (!ADDRESS_RE.test(recipient)) throw new InvalidAddressError("recipient", recipient);
    return {
      route,
      kitReq: {
        route: route.id,
        from: { chain: route.sourceChain.kitChainName, address: req.sender },
        to: { chain: route.destinationChain.kitChainName, recipient, useForwarder: route.useForwarder },
        token: kitToken(route),
        amount,
        decimals,
        amountDecimal: formatUnits(amount, decimals),
        speed: route.speed,
        feePayment: route.feePayment,
      },
    };
  }

  async function estimate(route: ResolvedRoute, kitReq: KitTransferRequest): Promise<KitEstimate> {
    let est: KitEstimate;
    try {
      est = await deps.kit.estimate(kitReq);
    } catch (e) {
      throw classifyError(e, { sourceChain: route.source, tokenId: route.tokenId });
    }
    if (est.speed !== route.speed) {
      throw new QuoteRejectedError("OTHER", `requested ${route.speed}, kit quoted ${est.speed}`);
    }
    return est;
  }

  function step(record: TransferRecord, event: TransferEvent): TransferRecord {
    const next = transition(record, event, now());
    deps.onTransition?.(next);
    return next;
  }

  return {
    async quote(req) {
      const { route, kitReq } = prepare(req);
      const est = await estimate(route, kitReq);
      return {
        route: route.id,
        speed: route.speed,
        amount: kitReq.amount,
        amountDecimal: kitReq.amountDecimal,
        decimals: kitReq.decimals,
        fees: est.fees,
        sourceNativeRequired: nativeRequired(est),
        sourceChain: route.sourceChain.kitChainName,
        destinationChain: route.destinationChain.kitChainName,
      };
    },

    async send(req) {
      const { route, kitReq } = prepare(req);
      let record = newRecord(
        {
          id: newId(),
          route: route.id,
          amount: kitReq.amount,
          decimals: kitReq.decimals,
          sender: kitReq.from.address,
          recipient: kitReq.to.recipient,
        },
        now(),
      );
      deps.onTransition?.(record);
      const ctx = { sourceChain: route.source, tokenId: route.tokenId };
      try {
        const est = await estimate(route, kitReq);
        const required = nativeRequired(est);
        let available: bigint;
        try {
          available = await deps.rpc.getNativeBalance(route.source, kitReq.from.address);
        } catch (e) {
          throw classifyError(e, ctx);
        }
        if (available < required) throw new InsufficientGasError(route.source, required, available);
        const { sourceTxHash } = await deps.kit.submit(kitReq);
        record = step(record, { type: "SUBMITTED", sourceTxHash });
      } catch (e) {
        record = step(record, { type: "FAILED", error: classifyError(e, ctx) });
      }
      return record;
    },

    async status(record) {
      if (isTerminal(record.state) || record.state === "PENDING" || !record.sourceTxHash) return record;
      const route = resolveRoute(record.route, deps.deployments);
      const ctx = { sourceChain: route.source, tokenId: route.tokenId };
      let current = record;

      if (current.state === "SENT") {
        let receipt;
        try {
          receipt = await deps.rpc.getTransactionReceipt(route.source, record.sourceTxHash);
        } catch (e) {
          throw classifyError(e, ctx);
        }
        if (receipt === null) return current;
        if (receipt.status === "reverted") {
          const error: BridgeError = receipt.revertData?.toLowerCase().startsWith(TOKEN_NOT_REGISTERED_SELECTOR)
            ? new TokenNotRegisteredError(route.tokenId)
            : new SourceTxRevertedError(record.sourceTxHash);
          return step(current, { type: "FAILED", error });
        }
        current = step(current, { type: "SOURCE_CONFIRMED", blockNumber: receipt.blockNumber });
      }

      let st;
      try {
        st = await deps.kit.getStatus({
          route: route.id,
          sourceChain: route.sourceChain.kitChainName,
          destinationChain: route.destinationChain.kitChainName,
          sourceTxHash: record.sourceTxHash,
          token: kitToken(route),
        });
      } catch (e) {
        // Keep progress already made in this call (SENT -> CONFIRMED); report the error otherwise.
        if (current !== record) return current;
        throw classifyError(e, ctx);
      }
      if (st.state === "complete") {
        return step(current, {
          type: "DESTINATION_COMPLETE",
          ...(st.destinationTxHash ? { destinationTxHash: st.destinationTxHash } : {}),
        });
      }
      if (st.state === "failed") {
        return step(current, { type: "FAILED", error: new DestinationFailedError(st.reason) });
      }
      return current;
    },

    async resume(_record) {
      throw new NotImplementedError("resume is implemented in T-036 (persistence and resume)");
    },
  };
}
