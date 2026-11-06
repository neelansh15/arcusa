// Unit tests for check-supply. No network: reads and fetch are mocked.
// Run from the repo root: node --test contracts/scripts/test/check-supply.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  ConfigError, EXIT, decodeUint256, encodeBalanceOf, envPrefix, evaluate, formatUnits, loadConfig, makeRpcReader,
  report, runCheck,
} from "../check-supply/lib.mjs";

const E = 10n ** 18n;
const A = (n) => "0x" + String(n).repeat(40).slice(0, 40); // test-only fake addresses
const sample = (locked, ...supplies) => ({
  locked,
  wrapped: supplies.map((s, i) => ({ network: `net${i}`, supply: s })),
});
const noSleep = async () => {};
const seq = (...samples) => {
  let i = 0;
  return async () => {
    const s = samples[Math.min(i++, samples.length - 1)];
    if (s instanceof Error) throw s;
    return s;
  };
};

// ----------------------------------------------------------------- evaluate

test("evaluate: equal is ok with no surplus", () => {
  const r = evaluate(sample(10n * E, 10n * E));
  assert.equal(r.ok, true);
  assert.equal(r.surplus, 0n);
});

test("evaluate: sums supply across all wrapped deployments", () => {
  const r = evaluate(sample(10n * E, 4n * E, 6n * E));
  assert.equal(r.ok, true);
  assert.equal(r.totalWrapped, 10n * E);
  assert.equal(evaluate(sample(10n * E - 1n, 4n * E, 6n * E)).ok, false);
});

test("evaluate: surplus (in flight or direct send) is ok", () => {
  const r = evaluate(sample(13n * E, 10n * E));
  assert.equal(r.ok, true);
  assert.equal(r.surplus, 3n * E);
});

test("evaluate: one wei short fails", () => {
  const r = evaluate(sample(10n * E - 1n, 10n * E));
  assert.equal(r.ok, false);
  assert.equal(r.shortfall, 1n);
});

test("evaluate: zero everywhere is ok; no deployments means nothing to back", () => {
  assert.equal(evaluate(sample(0n, 0n)).ok, true);
  assert.equal(evaluate(sample(5n)).ok, true);
});

test("evaluate: rejects non-bigint values", () => {
  assert.throws(() => evaluate({ locked: 1, wrapped: [] }), TypeError);
  assert.throws(() => evaluate({ locked: 1n, wrapped: [{ network: "x", supply: "1" }] }), TypeError);
});

// ----------------------------------------------------------------- runCheck

test("runCheck: ok on first read, no retries", async () => {
  let reads = 0;
  const out = await runCheck({ read: async () => (reads++, sample(10n, 10n)), retries: 3, sleep: noSleep });
  assert.equal(out.status, "ok");
  assert.equal(out.exitCode, EXIT.OK);
  assert.equal(reads, 1);
});

test("runCheck: short-lived shortfall that clears on retry is ok", async () => {
  const out = await runCheck({ read: seq(sample(9n, 10n), sample(10n, 10n)), retries: 3, sleep: noSleep });
  assert.equal(out.status, "ok");
  assert.equal(out.attempts, 2);
  assert.equal(out.shortfallsSeen, 1);
});

test("runCheck: stable shortfall on every read is a deficit (fails)", async () => {
  const out = await runCheck({ read: seq(sample(9n, 10n)), retries: 3, sleep: noSleep });
  assert.equal(out.status, "deficit");
  assert.equal(out.exitCode, EXIT.DEFICIT);
  assert.equal(out.samples, 4);
});

test("runCheck: shortfall with moving numbers is pending, not a failure", async () => {
  const out = await runCheck({
    read: seq(sample(9n, 10n), sample(9n, 11n), sample(12n, 13n)),
    retries: 2,
    sleep: noSleep,
  });
  assert.equal(out.status, "pending");
  assert.equal(out.exitCode, EXIT.PENDING);
});

test("runCheck: retries=0 reads once", async () => {
  const out = await runCheck({ read: seq(sample(9n, 10n)), retries: 0, sleep: noSleep });
  assert.equal(out.status, "deficit");
  assert.equal(out.attempts, 1);
});

test("runCheck: sleeps between attempts with the configured delay", async () => {
  const slept = [];
  await runCheck({ read: seq(sample(9n, 10n)), retries: 2, retryDelayMs: 1234, sleep: async (ms) => slept.push(ms) });
  assert.deepEqual(slept, [1234, 1234]);
});

test("runCheck: read errors are retried; all failing is a read error", async () => {
  const out = await runCheck({ read: seq(new Error("boom")), retries: 2, sleep: noSleep });
  assert.equal(out.status, "error");
  assert.equal(out.exitCode, EXIT.READ_ERROR);
  assert.equal(out.errors.length, 3);
});

test("runCheck: an error then a good read is ok", async () => {
  const out = await runCheck({ read: seq(new Error("timeout"), sample(10n, 10n)), retries: 2, sleep: noSleep });
  assert.equal(out.status, "ok");
});

test("runCheck: stable shortfall with an error in between is still a deficit", async () => {
  const out = await runCheck({
    read: seq(sample(9n, 10n), new Error("x"), sample(9n, 10n)),
    retries: 2,
    sleep: noSleep,
  });
  assert.equal(out.status, "deficit");
});

// ------------------------------------------------------------------ report

test("report: names the outcome", async () => {
  assert.match(report(await runCheck({ read: seq(sample(10n * E, 10n * E)), sleep: noSleep })), /OK: locked equals/);
  assert.match(report(await runCheck({ read: seq(sample(13n * E, 10n * E)), sleep: noSleep })), /exceeds wrapped by 3 /);
  assert.match(report(await runCheck({ read: seq(sample(9n, 10n)), retries: 1, sleep: noSleep })), /^FAIL/m);
  assert.match(
    report(await runCheck({ read: seq(sample(9n, 10n), sample(8n, 10n)), retries: 1, sleep: noSleep })),
    /^PENDING/m,
  );
});

test("formatUnits", () => {
  assert.equal(formatUnits(0n), "0");
  assert.equal(formatUnits(15n * 10n ** 17n), "1.5");
  assert.equal(formatUnits(1n), "0.000000000000000001");
});

// ------------------------------------------------------------------ config

const DIR = "/deployments";
const files = (map) => (f) => {
  const k = path.basename(f);
  if (!(k in map)) {
    const e = new Error("ENOENT");
    e.code = "ENOENT";
    throw e;
  }
  return map[k];
};
const goodEnv = { SEPOLIA_RPC_URL: "https://sepolia.example", ARC_TESTNET_RPC_URL: "https://arc.example" };
const goodFiles = {
  "sepolia.json": JSON.stringify({ chainId: 11155111, mNVDA: { address: A(1), tokenManager: A(2) } }),
  "arc-testnet.json": JSON.stringify({ chainId: 999, wNVDA: { address: A(3) } }),
};

test("loadConfig: reads deployments files and env RPC URLs", () => {
  const c = loadConfig({ env: goodEnv, deploymentsDir: DIR, readFile: files(goodFiles) });
  assert.equal(c.home.token, A(1));
  assert.equal(c.home.manager, A(2));
  assert.equal(c.home.expectedChainId, 11155111);
  assert.equal(c.wrapped.length, 1);
  assert.equal(c.wrapped[0].token, A(3));
  assert.equal(c.wrapped[0].rpcUrl, "https://arc.example");
  assert.equal(c.retries, 5);
});

test("loadConfig: env overrides JSON", () => {
  const c = loadConfig({
    env: { ...goodEnv, MNVDA_ADDRESS: A(4), ARC_TESTNET_WNVDA_ADDRESS: A(5) },
    deploymentsDir: DIR,
    readFile: files(goodFiles),
  });
  assert.equal(c.home.token, A(4));
  assert.equal(c.wrapped[0].token, A(5));
});

test("loadConfig: env alone works without any deployments file", () => {
  const c = loadConfig({
    env: { ...goodEnv, MNVDA_ADDRESS: A(1), MNVDA_TOKEN_MANAGER_ADDRESS: A(2), ARC_TESTNET_WNVDA_ADDRESS: A(3) },
    deploymentsDir: DIR,
    readFile: files({}),
  });
  assert.equal(c.home.expectedChainId, null);
});

test("loadConfig: missing everything lists every problem clearly", () => {
  try {
    loadConfig({ env: {}, deploymentsDir: DIR, readFile: files({}) });
    assert.fail("should throw");
  } catch (e) {
    assert.ok(e instanceof ConfigError);
    const msg = e.message;
    for (const s of ["SEPOLIA_RPC_URL", "MNVDA_ADDRESS", "MNVDA_TOKEN_MANAGER_ADDRESS", "ARC_TESTNET_RPC_URL", "ARC_TESTNET_WNVDA_ADDRESS"]) {
      assert.match(msg, new RegExp(s));
    }
    assert.match(msg, /file not found/);
  }
});

test("loadConfig: rejects bad and zero addresses, bad JSON, bad numbers", () => {
  const bad = (env, f) => assert.throws(() => loadConfig({ env: { ...goodEnv, ...env }, deploymentsDir: DIR, readFile: files(f) }), ConfigError);
  bad({ MNVDA_ADDRESS: "0x1234" }, goodFiles);
  bad({ MNVDA_ADDRESS: "0x0000000000000000000000000000000000000000" }, goodFiles);
  bad({}, { ...goodFiles, "sepolia.json": "{not json" });
  bad({}, { ...goodFiles, "sepolia.json": JSON.stringify({ mNVDA: { address: A(1), tokenManager: null } }) });
  bad({ CHECK_SUPPLY_RETRIES: "-1" }, goodFiles);
  bad({ CHECK_SUPPLY_WRAPPED_NETWORKS: "arc-testnet,arc-testnet" }, goodFiles);
  bad({ SEPOLIA_RPC_URL: "sepolia.example" }, goodFiles);
});

test("loadConfig: several wrapped networks", () => {
  const c = loadConfig({
    env: { ...goodEnv, CHECK_SUPPLY_WRAPPED_NETWORKS: "arc-testnet, other-chain", OTHER_CHAIN_RPC_URL: "https://o.example", OTHER_CHAIN_WNVDA_ADDRESS: A(6) },
    deploymentsDir: DIR,
    readFile: files(goodFiles),
  });
  assert.deepEqual(c.wrapped.map((w) => w.network), ["arc-testnet", "other-chain"]);
  assert.equal(envPrefix("arc-testnet"), "ARC_TESTNET");
});

// ------------------------------------------------------------------ RPC reader (mocked fetch)

const word = (n) => "0x" + n.toString(16).padStart(64, "0");

function mockFetch(handlers) {
  const calls = [];
  const f = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, ...body });
    const result = handlers(url, body);
    if (result instanceof Error) return { ok: true, json: async () => ({ jsonrpc: "2.0", id: body.id, error: { code: -32000, message: result.message } }) };
    return { ok: true, json: async () => ({ jsonrpc: "2.0", id: body.id, result }) };
  };
  f.calls = calls;
  return f;
}

const cfg = () => loadConfig({ env: goodEnv, deploymentsDir: DIR, readFile: files(goodFiles) });

test("encodeBalanceOf / decodeUint256", () => {
  assert.equal(encodeBalanceOf(A(2)), "0x70a08231" + "0".repeat(24) + "2".repeat(40));
  assert.equal(decodeUint256(word(7n), "x"), 7n);
  assert.throws(() => decodeUint256("0x", "x"), /contract at that address/);
});

test("makeRpcReader: reads balanceOf(manager) and totalSupply with the right calldata", async () => {
  const f = mockFetch((url, b) => {
    if (b.method === "eth_chainId") return url.includes("sepolia") ? "0xaa36a7" : "0x3e7";
    if (url.includes("sepolia")) return word(10n * E);
    return word(10n * E);
  });
  const c = cfg();
  const s = await makeRpcReader(c, f)();
  assert.equal(s.locked, 10n * E);
  assert.equal(s.wrapped[0].supply, 10n * E);
  const call = f.calls.find((x) => x.method === "eth_call" && x.url.includes("sepolia"));
  assert.equal(call.params[0].to, A(1));
  assert.equal(call.params[0].data, encodeBalanceOf(A(2)));
  const arc = f.calls.find((x) => x.method === "eth_call" && x.url.includes("arc"));
  assert.equal(arc.params[0].to, A(3));
  assert.equal(arc.params[0].data, "0x18160ddd");
});

test("makeRpcReader: wrong chain id is an error", async () => {
  const f = mockFetch((url, b) => (b.method === "eth_chainId" ? "0x1" : word(1n)));
  await assert.rejects(makeRpcReader(cfg(), f)(), /RPC is on chain 1/);
});

test("makeRpcReader: no contract at address (empty return) is an error", async () => {
  const f = mockFetch((url, b) => (b.method === "eth_chainId" ? (url.includes("sepolia") ? "0xaa36a7" : "0x3e7") : "0x"));
  await assert.rejects(makeRpcReader(cfg(), f)(), /contract at that address/);
});

test("end to end with mocked fetch: a deficit fails, a direct send passes", async () => {
  const run = (locked, supply) =>
    runCheck({
      read: makeRpcReader(cfg(), mockFetch((url, b) =>
        b.method === "eth_chainId" ? (url.includes("sepolia") ? "0xaa36a7" : "0x3e7") : word(url.includes("sepolia") ? locked : supply))),
      retries: 1,
      sleep: noSleep,
    });
  assert.equal((await run(5n, 6n)).status, "deficit");
  assert.equal((await run(7n, 6n)).status, "ok");
});

test("RPC error responses become read errors without leaking the URL", async () => {
  const f = mockFetch(() => new Error("execution reverted"));
  const out = await runCheck({ read: makeRpcReader(cfg(), f), retries: 0, sleep: noSleep });
  assert.equal(out.status, "error");
  assert.match(out.errors[0].message, /execution reverted/);
  assert.doesNotMatch(out.errors[0].message, /example/);
});
