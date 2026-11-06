// Injected dependencies of the bridge layer.
//
// BridgeKitPort is OUR minimal interface, not the real @circle-fin/bridge-kit API.
// T-024 writes a small adapter from the real package to this port once the real
// call names, parameters, return values and error shapes have been checked.
// Nothing in this file states how the real SDK looks.
import type { Address, Bytes32, ChainKey, FeePayment, Hex, RouteId, TransferSpeed } from "./types";

/** How the token is named to the kit: USDC, or a non-USDC token by its bytes32 CCTPx token id (ADR 0013). */
export type KitToken = { readonly kind: "USDC" } | { readonly kind: "CCTPX"; readonly tokenId: Bytes32 };

export interface KitTransferRequest {
  readonly route: RouteId;
  readonly from: { readonly chain: string; readonly address: Address };
  readonly to: { readonly chain: string; readonly recipient: Address; readonly useForwarder: true };
  readonly token: KitToken;
  /** Source-token base units. */
  readonly amount: bigint;
  readonly decimals: number;
  /** Same amount as a decimal string, for adapters whose kit takes human amounts. */
  readonly amountDecimal: string;
  /** Always STANDARD (ADR 0013 amendment: Fast is rejected with FX_SYMBOL_NOT_CONFIGURED). */
  readonly speed: TransferSpeed;
  readonly feePayment: FeePayment;
}

export interface KitFee {
  readonly kind: string;
  /** "native": paid in source-chain gas token base units. "token": in source-token base units. */
  readonly paidIn: "native" | "token";
  readonly amount: bigint;
}

export interface KitEstimate {
  /** Speed the kit actually quoted. Anything but STANDARD is rejected by the module. */
  readonly speed: string;
  readonly fees: readonly KitFee[];
  /** Estimated source-chain gas, native base units. */
  readonly sourceGas: bigint;
}

export interface KitSubmitResult {
  readonly sourceTxHash: Hex;
}

export type KitTransferStatus =
  | { readonly state: "pending" }
  | { readonly state: "complete"; readonly destinationTxHash?: Hex }
  | { readonly state: "failed"; readonly reason: string };

export interface KitStatusQuery {
  readonly route: RouteId;
  readonly sourceChain: string;
  readonly destinationChain: string;
  readonly sourceTxHash: Hex;
  readonly token: KitToken;
}

export interface BridgeKitPort {
  /** Price the transfer without sending. May throw (e.g. FX_SYMBOL_NOT_CONFIGURED, TokenNotRegistered). */
  estimate(req: KitTransferRequest): Promise<KitEstimate>;
  /** Ask the wallet to sign and broadcast the source-chain transaction(s). Resolves once broadcast. */
  submit(req: KitTransferRequest): Promise<KitSubmitResult>;
  /** Destination-side progress for a broadcast transfer (attestation and forwarded mint). */
  getStatus(query: KitStatusQuery): Promise<KitTransferStatus>;
}

export interface TxReceipt {
  readonly status: "success" | "reverted";
  readonly blockNumber: bigint;
  /** Revert data if the RPC provides it. */
  readonly revertData?: Hex;
}

/** Read-only chain access. */
export interface RpcPort {
  getNativeBalance(chain: ChainKey, address: Address): Promise<bigint>;
  /** null while the transaction is not mined. */
  getTransactionReceipt(chain: ChainKey, txHash: Hex): Promise<TxReceipt | null>;
}
