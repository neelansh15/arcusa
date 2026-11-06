// Amount and decimals handling. bigint only, no float math.
import { InvalidAmountError } from "./errors";
import type { AmountInput } from "./types";

const DECIMAL_RE = /^(\d+)(?:\.(\d+))?$/;

/**
 * Parse a non-negative decimal string into base units.
 * Rejects more fractional digits than `decimals` (no silent rounding).
 */
export function parseUnits(value: string, decimals: number): bigint {
  assertDecimals(decimals);
  const trimmed = value.trim();
  const m = DECIMAL_RE.exec(trimmed);
  if (!m) throw new InvalidAmountError(`not a plain non-negative decimal: "${value}"`);
  const whole = m[1]!;
  const frac = m[2] ?? "";
  if (frac.length > decimals) {
    throw new InvalidAmountError(
      `"${value}" has ${frac.length} fractional digits, token allows ${decimals}`,
    );
  }
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, "0") || "0");
}

/** Format base units as a decimal string, trailing zeros removed ("1.5", "0", "12"). */
export function formatUnits(value: bigint, decimals: number): string {
  assertDecimals(decimals);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = (abs % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/** Resolve an AmountInput to base units; must be strictly positive. */
export function toBaseUnits(amount: AmountInput, decimals: number): bigint {
  const units = "decimal" in amount ? parseUnits(amount.decimal, decimals) : amount.baseUnits;
  if (typeof units !== "bigint") throw new InvalidAmountError("baseUnits must be a bigint");
  if (units <= 0n) throw new InvalidAmountError("amount must be greater than zero");
  return units;
}

/**
 * Convert base units between two decimal scales (for example 18-decimal native
 * USDC on Arc to the 6-decimal ERC-20 interface). Scaling down must be exact.
 */
export function convertDecimals(value: bigint, from: number, to: number): bigint {
  assertDecimals(from);
  assertDecimals(to);
  if (from === to) return value;
  if (to > from) return value * 10n ** BigInt(to - from);
  const factor = 10n ** BigInt(from - to);
  if (value % factor !== 0n) {
    throw new InvalidAmountError(`${value} at ${from} decimals is not exact at ${to} decimals`);
  }
  return value / factor;
}

function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 77) {
    throw new InvalidAmountError(`invalid decimals: ${decimals}`);
  }
}
