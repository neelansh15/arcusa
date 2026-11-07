import {
  bytesToHex,
  CronCapability,
  consensusIdenticalAggregation,
  encodeCallMsg,
  EVMClient,
  getNetwork,
  handler,
  HTTPClient,
  LAST_FINALIZED_BLOCK_NUMBER,
  LATEST_BLOCK_NUMBER,
  ok,
  Runner,
  type HTTPSendRequester,
  type Runtime,
} from "@chainlink/cre-sdk";
import { type Address, decodeFunctionResult, encodeFunctionData, parseAbi, zeroAddress } from "viem";

// Parity monitor: lock-versus-wrap on Ethereum Sepolia + Arc Testnet, and oracle-versus-source price.
// Read-only. It does not write onchain and does not feed the oracle (ADR 0028).

type AssetConfig = {
  symbol: string;
  sourceToken: string; // mNVDA / mTSLA on Ethereum Sepolia
  tokenManager: string; // CCTP token manager that holds the lock
  wrappedToken: string; // wNVDA / wTSLA on Arc Testnet
  priceOracle: string; // Studio PriceOracle on Arc Testnet
  priceUrl: string; // xStocks price endpoint (same one services/price/server.mjs polls)
};

export type Config = {
  schedule: string;
  asset: AssetConfig;
  sourceChain: string;
  arcChain: string;
  thresholds: { maxOracleAgeSeconds: number; maxDeviationBps: number };
};

const erc20Abi = parseAbi(["function balanceOf(address) view returns (uint256)", "function totalSupply() view returns (uint256)"]);
const oracleAbi = parseAbi([
  "function latestRound() view returns (uint256 price, uint64 publishTime, uint8 session, uint32 confidenceBps, uint256 age, bool stale)",
]);

const client = (chainSelectorName: string) => {
  const network = getNetwork({ chainFamily: "evm", chainSelectorName, isTestnet: true });
  if (!network) throw new Error(`Network not found: ${chainSelectorName}`);
  return new EVMClient(network.chainSelector.selector);
};

const call = (runtime: Runtime<Config>, evm: EVMClient, to: string, data: `0x${string}`, finalized: boolean) =>
  evm
    .callContract(runtime, {
      call: encodeCallMsg({ from: zeroAddress, to: to as Address, data }),
      blockNumber: finalized ? LAST_FINALIZED_BLOCK_NUMBER : LATEST_BLOCK_NUMBER,
    })
    .result();

// xStocks returns {"quote": number}. Each node fetches; the quote is returned as a string so
// identical-value consensus applies (nodes see the same API response within the same second).
const fetchQuote = (sendRequester: HTTPSendRequester, url: string): string => {
  const resp = sendRequester.sendRequest({ url, method: "GET" as const }).result();
  if (!ok(resp)) throw new Error(`price API returned ${resp.statusCode}`);
  const body = JSON.parse(new TextDecoder().decode(resp.body)) as { quote?: number };
  if (typeof body.quote !== "number" || !(body.quote > 0)) throw new Error("price API returned no valid quote");
  return String(body.quote);
};

const fmt = (v: bigint, dec: number): string => {
  const s = v.toString().padStart(dec + 1, "0");
  return `${s.slice(0, -dec)}.${s.slice(-dec)}`;
};

export const onCronTrigger = (runtime: Runtime<Config>): string => {
  const { asset, thresholds } = runtime.config;
  const sepolia = client(runtime.config.sourceChain);
  const arc = client(runtime.config.arcChain);

  // (a) locked: mToken.balanceOf(tokenManager) on Ethereum Sepolia
  const locked = decodeFunctionResult({
    abi: erc20Abi,
    functionName: "balanceOf",
    data: bytesToHex(call(runtime, sepolia, asset.sourceToken, encodeFunctionData({ abi: erc20Abi, functionName: "balanceOf", args: [asset.tokenManager as Address] }), true).data),
  }) as bigint;

  // (b) wrapped: wToken.totalSupply() on Arc Testnet
  const wrapped = decodeFunctionResult({
    abi: erc20Abi,
    functionName: "totalSupply",
    data: bytesToHex(call(runtime, arc, asset.wrappedToken, encodeFunctionData({ abi: erc20Abi, functionName: "totalSupply" }), false).data),
  }) as bigint;

  // (c) oracle round on Arc Testnet (price has 8 decimals)
  const [oraclePrice, publishTime, , , oracleAge, oracleStale] = decodeFunctionResult({
    abi: oracleAbi,
    functionName: "latestRound",
    data: bytesToHex(call(runtime, arc, asset.priceOracle, encodeFunctionData({ abi: oracleAbi, functionName: "latestRound" }), false).data),
  }) as readonly [bigint, bigint, number, number, bigint, boolean];

  // (d) source price over HTTP
  const quoteStr = new HTTPClient()
    .sendRequest(runtime, fetchQuote, consensusIdenticalAggregation<string>())(asset.priceUrl)
    .result();
  const sourcePrice = Number(quoteStr);

  const oracleUsd = Number(oraclePrice) / 1e8;
  const deviationBps = Math.round(((oracleUsd - sourcePrice) / sourcePrice) * 10000 * 100) / 100;
  const delta = locked - wrapped; // both 18 decimals

  const checks = {
    lockCoversWrapped: delta >= 0n,
    oracleFresh: !oracleStale && Number(oracleAge) <= thresholds.maxOracleAgeSeconds,
    deviationWithinLimit: Math.abs(deviationBps) <= thresholds.maxDeviationBps,
  };
  const report = {
    symbol: asset.symbol,
    chains: { source: runtime.config.sourceChain, arc: runtime.config.arcChain },
    locked: fmt(locked, 18),
    wrapped: fmt(wrapped, 18),
    lockedMinusWrapped: delta < 0n ? `-${fmt(-delta, 18)}` : fmt(delta, 18),
    oracle: { priceUsd: oracleUsd, publishTime: Number(publishTime), ageSeconds: Number(oracleAge), stale: oracleStale },
    source: { priceUsd: sourcePrice, url: asset.priceUrl },
    deviationBps,
    thresholds,
    checks,
    healthy: checks.lockCoversWrapped && checks.oracleFresh && checks.deviationWithinLimit,
  };
  runtime.log(`parity-monitor ${asset.symbol}: healthy=${report.healthy}`);
  return JSON.stringify(report);
};

export const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
