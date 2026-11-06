import { describe, expect, it } from "vitest";
import { convertDecimals, formatUnits, parseUnits, toBaseUnits } from "../src/amount";
import { InvalidAmountError } from "../src/errors";

describe("parseUnits", () => {
  it("parses 6-decimal USDC amounts exactly", () => {
    expect(parseUnits("1", 6)).toBe(1_000_000n);
    expect(parseUnits("0.000001", 6)).toBe(1n);
    expect(parseUnits("123.45", 6)).toBe(123_450_000n);
    expect(parseUnits(" 10.5 ", 6)).toBe(10_500_000n);
  });

  it("parses 18-decimal token amounts beyond float precision", () => {
    expect(parseUnits("1", 18)).toBe(10n ** 18n);
    expect(parseUnits("0.000000000000000001", 18)).toBe(1n);
    // 2^53 + 1 whole tokens: a float would lose the last digit.
    expect(parseUnits("9007199254740993.000000000000000001", 18)).toBe(
      9007199254740993n * 10n ** 18n + 1n,
    );
    expect(parseUnits("0.1", 18) + parseUnits("0.2", 18)).toBe(parseUnits("0.3", 18));
  });

  it("rejects more fractional digits than the token has (no rounding)", () => {
    expect(() => parseUnits("0.0000001", 6)).toThrow(InvalidAmountError);
    expect(() => parseUnits("1.0000000000000000001", 18)).toThrow(InvalidAmountError);
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "-1", "1e6", "1.", ".5", "abc", "1,000", "0x10", "NaN", "Infinity"]) {
      expect(() => parseUnits(bad, 6), bad).toThrow(InvalidAmountError);
    }
  });

  it("rejects invalid decimals", () => {
    expect(() => parseUnits("1", -1)).toThrow(InvalidAmountError);
    expect(() => parseUnits("1", 1.5)).toThrow(InvalidAmountError);
  });
});

describe("formatUnits", () => {
  it("formats and round-trips", () => {
    expect(formatUnits(1_500_000n, 6)).toBe("1.5");
    expect(formatUnits(1n, 18)).toBe("0.000000000000000001");
    expect(formatUnits(0n, 18)).toBe("0");
    expect(formatUnits(12n * 10n ** 18n, 18)).toBe("12");
    expect(formatUnits(-1n, 6)).toBe("-0.000001");
    for (const s of ["1", "0.000001", "123.456789"]) expect(formatUnits(parseUnits(s, 6), 6)).toBe(s);
  });
});

describe("toBaseUnits", () => {
  it("accepts decimal strings and base units", () => {
    expect(toBaseUnits({ decimal: "2.5" }, 6)).toBe(2_500_000n);
    expect(toBaseUnits({ baseUnits: 7n }, 18)).toBe(7n);
  });

  it("rejects zero and negative amounts", () => {
    expect(() => toBaseUnits({ decimal: "0" }, 6)).toThrow(InvalidAmountError);
    expect(() => toBaseUnits({ baseUnits: 0n }, 6)).toThrow(InvalidAmountError);
    expect(() => toBaseUnits({ baseUnits: -1n }, 6)).toThrow(InvalidAmountError);
  });

  it("rejects non-bigint base units at runtime", () => {
    expect(() => toBaseUnits({ baseUnits: 1 as unknown as bigint }, 6)).toThrow(InvalidAmountError);
  });
});

describe("convertDecimals", () => {
  it("converts Arc native 18-decimal USDC to the 6-decimal ERC-20 scale", () => {
    expect(convertDecimals(10n ** 18n, 18, 6)).toBe(1_000_000n);
    expect(convertDecimals(1_000_000n, 6, 18)).toBe(10n ** 18n);
    expect(convertDecimals(5n, 6, 6)).toBe(5n);
  });

  it("refuses lossy down-scaling", () => {
    expect(() => convertDecimals(1n, 18, 6)).toThrow(InvalidAmountError);
  });
});
