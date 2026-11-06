// Setup file: any attempt to use the network in unit tests fails loudly.
import { beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubGlobal("fetch", () => {
    throw new Error("network access is not allowed in unit tests");
  });
  vi.stubGlobal("WebSocket", class {
    constructor() {
      throw new Error("network access is not allowed in unit tests");
    }
  });
});
