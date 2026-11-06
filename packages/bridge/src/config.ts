// Chain, token and route config in one place (T-033).
//
// Static facts come from accepted ADRs. Every deployment-specific value (token
// addresses, the CCTPx token id, on-chain decimals) is a placeholder filled from
// deployments/<network>.json at runtime. Nothing here is guessed: a missing value
// raises ConfigMissingError, a malformed or inconsistent one ConfigInvalidError.
import { ConfigInvalidError, ConfigMissingError, UnsupportedRouteError } from "./errors";
import type { Address, Bytes32, ChainKey, FeePayment, RouteId, TokenKey, TransferSpeed } from "./types";

export interface ChainConfig {
  readonly key: ChainKey;
  /** Chain name passed to the Bridge Kit adapter. Source: ADR 0003, PLAN.md. Check exact spelling in T-024. */
  readonly kitChainName: string;
  readonly chainId: number;
  /** Decimals of the native gas token (Arc native USDC is 18, ADR 0003). */
  readonly nativeDecimals: number;
  readonly nativeSymbol: string;
  /** Public RPC if one is fixed by an ADR; otherwise the caller supplies one. */
  readonly rpcUrl?: string;
  /** Repo-relative file holding addresses and the token id for this chain (ADR 0010). */
  readonly deploymentsFile: string;
}

export const CHAINS: Readonly<Record<ChainKey, ChainConfig>> = {
  sepolia: {
    key: "sepolia",
    kitChainName: "Ethereum_Sepolia",
    chainId: 11155111,
    nativeDecimals: 18,
    nativeSymbol: "ETH",
    deploymentsFile: "deployments/sepolia.json",
  },
  arcTestnet: {
    key: "arcTestnet",
    kitChainName: "Arc_Testnet",
    // ADR 0003: chain id 5042002, confirmed with eth_chainId on 2026-11-06.
    chainId: 5042002,
    nativeDecimals: 18,
    nativeSymbol: "USDC",
    rpcUrl: "https://rpc.testnet.arc.io",
    deploymentsFile: "deployments/arc-testnet.json",
  },
};

export interface TokenConfig {
  readonly key: TokenKey;
  /** "usdc": CCTP v2 USDC. "cctpx": non-USDC token addressed by its bytes32 CCTPx token id (ADR 0013). */
  readonly transport: "usdc" | "cctpx";
  /** Decimals the app expects. The deployments file must agree, otherwise ConfigInvalidError. */
  readonly expectedDecimals: number;
  readonly note: string;
}

export const TOKENS: Readonly<Record<TokenKey, TokenConfig>> = {
  USDC: {
    key: "USDC",
    transport: "usdc",
    expectedDecimals: 6,
    note: "App amounts use the 6-decimal ERC-20 interface on both chains (ADR 0003).",
  },
  mNVDA: {
    key: "mNVDA",
    transport: "cctpx",
    expectedDecimals: 18,
    note: "Mock provider token on Sepolia, LOCK_UNLOCK home side (ADR 0012). 18 decimals like Ondo NVDAon.",
  },
  wNVDA: {
    key: "wNVDA",
    transport: "cctpx",
    expectedDecimals: 18,
    note: "Wrapped mNVDA on Arc. Expected to copy the home token's decimals; T-022 records the real value.",
  },
};

export interface RouteConfig {
  readonly id: RouteId;
  readonly source: ChainKey;
  readonly destination: ChainKey;
  readonly sourceToken: TokenKey;
  readonly destinationToken: TokenKey;
  /** ADR 0003 for USDC; ADR 0013 says the CCTPx provider always forwards. */
  readonly useForwarder: true;
  readonly feePayment: FeePayment;
  readonly speed: TransferSpeed;
}

export const ROUTES: Readonly<Record<RouteId, RouteConfig>> = {
  "usdc-sepolia-to-arc": {
    id: "usdc-sepolia-to-arc",
    source: "sepolia",
    destination: "arcTestnet",
    sourceToken: "USDC",
    destinationToken: "USDC",
    useForwarder: true,
    feePayment: "source",
    speed: "STANDARD",
  },
  "wnvda-arc-to-sepolia": {
    id: "wnvda-arc-to-sepolia",
    source: "arcTestnet",
    destination: "sepolia",
    sourceToken: "wNVDA",
    destinationToken: "mNVDA",
    useForwarder: true,
    feePayment: "source",
    speed: "STANDARD",
  },
  "mnvda-sepolia-to-arc": {
    id: "mnvda-sepolia-to-arc",
    source: "sepolia",
    destination: "arcTestnet",
    sourceToken: "mNVDA",
    destinationToken: "wNVDA",
    useForwarder: true,
    feePayment: "source",
    speed: "STANDARD",
  },
};

export const ROUTE_IDS = Object.keys(ROUTES) as RouteId[];

export function isRouteId(value: string): value is RouteId {
  return Object.prototype.hasOwnProperty.call(ROUTES, value);
}

export function getRoute(route: string): RouteConfig {
  if (!isRouteId(route)) throw new UnsupportedRouteError(route);
  return ROUTES[route];
}

// ---------------------------------------------------------------------------
// Deployments (proposed shape of deployments/<network>.json; the deploy scripts
// in T-022 own the file, see the open question in TASKS.md T-033):
//
// {
//   "chainId": 11155111,
//   "tokens": {
//     "USDC":  { "address": "0x...", "decimals": 6 },
//     "mNVDA": { "address": "0x...", "decimals": 18, "tokenId": "0x<64 hex>" }
//   }
// }
// ---------------------------------------------------------------------------

/** Raw, unvalidated deployments JSON per chain (as parsed from the files). */
export type DeploymentsInput = Partial<Record<ChainKey, unknown>>;

export interface ResolvedToken {
  readonly key: TokenKey;
  readonly chain: ChainKey;
  readonly address: Address;
  readonly decimals: number;
  /** Present for cctpx tokens. */
  readonly tokenId?: Bytes32;
}

export interface ResolvedRoute extends RouteConfig {
  readonly sourceChain: ChainConfig;
  readonly destinationChain: ChainConfig;
  readonly sourceTokenResolved: ResolvedToken;
  readonly destinationTokenResolved: ResolvedToken;
  /** CCTPx token id for cctpx routes; undefined for USDC. */
  readonly tokenId?: Bytes32;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const BYTES32_RE = /^0x[0-9a-fA-F]{64}$/;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Read and validate one token entry for one chain. */
export function resolveToken(deployments: DeploymentsInput, chain: ChainKey, token: TokenKey): ResolvedToken {
  const file = CHAINS[chain].deploymentsFile;
  const raw = deployments[chain];
  if (raw === undefined) throw new ConfigMissingError(file);
  if (!isObject(raw)) throw new ConfigInvalidError(file, "not a JSON object");

  if (raw.chainId === undefined) throw new ConfigMissingError(`${file}:chainId`);
  if (raw.chainId !== CHAINS[chain].chainId) {
    throw new ConfigInvalidError(`${file}:chainId`, `expected ${CHAINS[chain].chainId}, got ${String(raw.chainId)}`);
  }

  const tokens = raw.tokens;
  if (tokens === undefined) throw new ConfigMissingError(`${file}:tokens`);
  if (!isObject(tokens)) throw new ConfigInvalidError(`${file}:tokens`, "not a JSON object");
  const entry = tokens[token];
  const base = `${file}:tokens.${token}`;
  if (entry === undefined) throw new ConfigMissingError(base);
  if (!isObject(entry)) throw new ConfigInvalidError(base, "not a JSON object");

  const { address, decimals, tokenId } = entry;
  if (address === undefined || address === "") throw new ConfigMissingError(`${base}.address`);
  if (typeof address !== "string" || !ADDRESS_RE.test(address)) {
    throw new ConfigInvalidError(`${base}.address`, "not a 20-byte hex address");
  }
  if (/^0x0{40}$/.test(address)) throw new ConfigInvalidError(`${base}.address`, "zero address");

  if (decimals === undefined) throw new ConfigMissingError(`${base}.decimals`);
  const expected = TOKENS[token].expectedDecimals;
  if (decimals !== expected) {
    throw new ConfigInvalidError(`${base}.decimals`, `expected ${expected}, got ${String(decimals)}`);
  }

  let resolvedTokenId: Bytes32 | undefined;
  if (TOKENS[token].transport === "cctpx") {
    if (tokenId === undefined || tokenId === "") throw new ConfigMissingError(`${base}.tokenId`);
    if (typeof tokenId !== "string" || !BYTES32_RE.test(tokenId)) {
      throw new ConfigInvalidError(`${base}.tokenId`, "not a bytes32 hex value");
    }
    if (/^0x0{64}$/.test(tokenId)) throw new ConfigInvalidError(`${base}.tokenId`, "zero token id");
    resolvedTokenId = tokenId.toLowerCase() as Bytes32;
  }

  return {
    key: token,
    chain,
    address: address as Address,
    decimals: expected,
    ...(resolvedTokenId ? { tokenId: resolvedTokenId } : {}),
  };
}

/** Resolve everything a route needs. Throws a typed error for the first missing or bad value. */
export function resolveRoute(route: string, deployments: DeploymentsInput): ResolvedRoute {
  const r = getRoute(route);
  const src = resolveToken(deployments, r.source, r.sourceToken);
  const dst = resolveToken(deployments, r.destination, r.destinationToken);
  if (src.decimals !== dst.decimals) {
    throw new ConfigInvalidError(`${r.id}`, `source and destination decimals differ (${src.decimals} vs ${dst.decimals})`);
  }
  if (src.tokenId !== dst.tokenId) {
    throw new ConfigInvalidError(`${r.id}`, "source and destination CCTPx token ids differ");
  }
  return {
    ...r,
    sourceChain: CHAINS[r.source],
    destinationChain: CHAINS[r.destination],
    sourceTokenResolved: src,
    destinationTokenResolved: dst,
    ...(src.tokenId ? { tokenId: src.tokenId } : {}),
  };
}
