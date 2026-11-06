// ADR 0013: Bridge Kit is the only transfer path. Guard against raw CCTPx calls in src.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(import.meta.dirname, "..", "src");

describe("Bridge Kit only (ADR 0013)", () => {
  it("src has no raw CrossChainTokenService usage outside comments", () => {
    const offenders: string[] = [];
    for (const f of readdirSync(SRC).filter((n) => n.endsWith(".ts"))) {
      readFileSync(join(SRC, f), "utf8")
        .split("\n")
        .forEach((line, i) => {
          const code = line.replace(/\/\/.*$/, "").trim();
          if (code.startsWith("*") || code.startsWith("/*")) return;
          if (/CrossChainTokenService|crossChainTransfer|depositForBurn|receiveMessage/.test(code)) {
            offenders.push(`${f}:${i + 1}: ${line.trim()}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("the module does not import a chain client or the real Bridge Kit (injected instead)", () => {
    for (const f of readdirSync(SRC).filter((n) => n.endsWith(".ts"))) {
      const imports = readFileSync(join(SRC, f), "utf8").match(/from "([^"]+)"/g) ?? [];
      for (const imp of imports) expect(imp, f).toMatch(/from "\.\//);
    }
  });
});
