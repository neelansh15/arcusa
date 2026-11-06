import { describe, expect, it } from "vitest";
import { BRIDGE_PACKAGE } from "../src/index";

describe("bridge package", () => {
  it("exports its name", () => {
    expect(BRIDGE_PACKAGE).toBe("@arcusa/bridge");
  });
});
