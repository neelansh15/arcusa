import { parseAbi } from "viem";

import { ACTIVE } from "./contracts";

// NVDA instances. The addresses live in contracts.ts so the whole app switches contract set in one place (ADR 0025).
export const MARKET_DEPLOY_BLOCK = ACTIVE.nvda.marketDeployBlock;
export const ORACLE_ADDRESS = ACTIVE.nvda.oracle;
export const MARKET_ADDRESS = ACTIVE.nvda.market;

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
  // Custom errors, so viem can name a revert (from the market and from the oracle it calls).
  "error ZeroAmount()",
  "error SessionClosed(uint8 session)",
  "error TradeTooLarge(uint256 usdcValue, uint256 cap)",
  "error ExposureExceeded(int256 newFlow, uint256 maxExposure)",
  "error InventoryShort(uint256 available, uint256 needed)",
  "error SlippageExceeded(uint256 out, uint256 minOut)",
  "error EnforcedPause()",
  "error StalePrice(uint256 age, uint256 maxAge)",
  "error NoPrice()",
]);

export const oracleAbi = parseAbi([
  "function latestRound() view returns (uint256 price, uint64 publishTime, uint8 session, uint32 confidenceBps, uint256 age, bool stale)",
]);

export const SESSIONS = ["Closed", "Regular", "Pre-market", "Post-market", "Overnight"] as const;

// Arc enforces a 20 Gwei fee floor.
export const ARC_FEES = { maxFeePerGas: 25_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n } as const;
