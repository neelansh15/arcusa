import { parseAbi } from "viem";

export const MARKET_DEPLOY_BLOCK = 71030220n;
export const ORACLE_ADDRESS = "0xcd92cc2ff8d630a93090c203463843ffd685f83d" as const;
export const MARKET_ADDRESS = "0x8046c2bcb05c8750772bfcc2109659c85f3b10f4" as const;

export const marketAbi = parseAbi([
  "function buy(uint256 usdcIn, uint256 minWnvdaOut) returns (uint256 wnvdaOut)",
  "function sell(uint256 wnvdaIn, uint256 minUsdcOut) returns (uint256 usdcOut)",
  "function quoteBuy(uint256 usdcIn) view returns (uint256 wnvdaOut, uint256 price, uint256 spreadBps, uint8 session)",
  "function quoteSell(uint256 wnvdaIn) view returns (uint256 usdcOut, uint256 price, uint256 spreadBps, uint8 session)",
  "function inventory() view returns (uint256 wnvdaBalance, uint256 usdcBalance, int256 flow, bool isPaused)",
  "function maxTradeUsdc() view returns (uint256)",
  "function offHoursTrading() view returns (bool)",
  "event Bought(address trader, uint256 usdcIn, uint256 wnvdaOut, uint256 price, uint256 spreadBps, uint8 session)",
  "event Sold(address trader, uint256 wnvdaIn, uint256 usdcOut, uint256 price, uint256 spreadBps, uint8 session)",
]);

export const oracleAbi = parseAbi([
  "function latestRound() view returns (uint256 price, uint64 publishTime, uint8 session, uint32 confidenceBps, uint256 age, bool stale)",
]);

export const SESSIONS = ["Closed", "Regular", "Pre-market", "Post-market", "Overnight"] as const;

// Arc enforces a 20 Gwei fee floor.
export const ARC_FEES = { maxFeePerGas: 25_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n } as const;
