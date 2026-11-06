// Logic for check-supply (T-034). No network access here unless a fetch
// function is passed in, so every part can be unit-tested with mocked reads.
//
// Rule (ADR 0012): mNVDA locked in the Sepolia LOCK_UNLOCK manager must be at
// least the total wNVDA supply across every wrapped deployment. It is equal when
// nothing is in flight. Extra mNVDA sent straight to the manager only raises
// "locked", so a surplus is never a failure.

import fs from "node:fs";
import path from "node:path";

export const EXIT = Object.freeze({ OK: 0, DEFICIT: 1, PENDING: 2, READ_ERROR: 3, CONFIG_ERROR: 78 });

export class ConfigError extends Error {
  constructor(problems) {
    super(`check-supply config is incomplete:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "ConfigError";
    this.problems = problems;
  }
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** Env var prefix for a network name: "arc-testnet" -> "ARC_TESTNET". */
export function envPrefix(network) {
  return network.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function readDeploymentFile(dir, network, readFile) {
  const file = path.join(dir, `${network}.json`);
  let text;
  try {
    text = readFile(file);
  } catch (e) {
    if (e && e.code === "ENOENT") return { file, json: null };
    throw e;
  }
  try {
    return { file, json: JSON.parse(text) };
  } catch (e) {
    throw new ConfigError([`${file} is not valid JSON: ${e.message}`]);
  }
}

function pick(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

function resolveAddress(problems, label, envName, env, dep, jsonKey) {
  const fromEnv = env[envName];
  const fromJson = dep.json ? pick(dep.json, jsonKey) : undefined;
  const value = fromEnv && fromEnv.trim() !== "" ? fromEnv.trim() : fromJson;
  const where = `set ${envName} or "${jsonKey}" in ${dep.file}`;
  if (value === undefined || value === null || value === "") {
    problems.push(`${label} is missing: ${where}${dep.json ? "" : " (file not found)"}`);
    return null;
  }
  if (typeof value !== "string" || !ADDRESS_RE.test(value)) {
    problems.push(`${label} is not a 20-byte hex address: ${JSON.stringify(value)} (${where})`);
    return null;
  }
  if (value.toLowerCase() === ZERO_ADDRESS) {
    problems.push(`${label} is the zero address (${where})`);
    return null;
  }
  return value;
}

function resolveRpc(problems, label, envName, env) {
  const v = env[envName];
  if (!v || v.trim() === "") {
    problems.push(`${label} is missing: set ${envName} (RPC URLs come from env only, never from deployments/*.json)`);
    return null;
  }
  if (!/^https?:\/\//.test(v.trim())) {
    problems.push(`${envName} must be an http(s) URL`);
    return null;
  }
  return v.trim();
}

function resolveChainId(dep) {
  const c = dep.json ? dep.json.chainId : undefined;
  return c === undefined || c === null ? null : Number(c);
}

/**
 * Builds the config from env and deployments/<network>.json. Env wins over JSON.
 * Throws ConfigError listing every missing or invalid item. Never invents values.
 *
 * Home chain (network "sepolia"):
 *   SEPOLIA_RPC_URL                      (env only)
 *   MNVDA_ADDRESS                        or sepolia.json "mNVDA.address"
 *   MNVDA_TOKEN_MANAGER_ADDRESS          or sepolia.json "mNVDA.tokenManager"
 * Wrapped deployments: CHECK_SUPPLY_WRAPPED_NETWORKS (comma list, default "arc-testnet"); for each <net>:
 *   <NET>_RPC_URL                        (env only, e.g. ARC_TESTNET_RPC_URL)
 *   <NET>_WNVDA_ADDRESS                  or <net>.json "wNVDA.address"
 * Optional "chainId" in each JSON file is checked against eth_chainId.
 */
export function loadConfig({ env = process.env, deploymentsDir, readFile = (f) => fs.readFileSync(f, "utf8") } = {}) {
  if (!deploymentsDir) throw new Error("deploymentsDir is required");
  const problems = [];
  const homeNetwork = env.CHECK_SUPPLY_HOME_NETWORK?.trim() || "sepolia";
  const homeDep = readDeploymentFile(deploymentsDir, homeNetwork, readFile);
  const hp = envPrefix(homeNetwork);
  const home = {
    network: homeNetwork,
    rpcUrl: resolveRpc(problems, `${homeNetwork} RPC URL`, `${hp}_RPC_URL`, env),
    token: resolveAddress(problems, "mNVDA token address", "MNVDA_ADDRESS", env, homeDep, "mNVDA.address"),
    manager: resolveAddress(
      problems,
      "mNVDA token manager address",
      "MNVDA_TOKEN_MANAGER_ADDRESS",
      env,
      homeDep,
      "mNVDA.tokenManager",
    ),
    expectedChainId: resolveChainId(homeDep),
  };

  const nets = (env.CHECK_SUPPLY_WRAPPED_NETWORKS ?? "arc-testnet")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (nets.length === 0) problems.push("CHECK_SUPPLY_WRAPPED_NETWORKS lists no networks");
  if (new Set(nets).size !== nets.length) problems.push("CHECK_SUPPLY_WRAPPED_NETWORKS lists a network twice");

  const wrapped = nets.map((network) => {
    const dep = readDeploymentFile(deploymentsDir, network, readFile);
    const p = envPrefix(network);
    return {
      network,
      rpcUrl: resolveRpc(problems, `${network} RPC URL`, `${p}_RPC_URL`, env),
      token: resolveAddress(problems, `${network} wNVDA address`, `${p}_WNVDA_ADDRESS`, env, dep, "wNVDA.address"),
      expectedChainId: resolveChainId(dep),
    };
  });

  const retries = parseNonNegInt(problems, env, "CHECK_SUPPLY_RETRIES", 5);
  const retryDelayMs = parseNonNegInt(problems, env, "CHECK_SUPPLY_RETRY_DELAY_MS", 15000);

  if (problems.length) throw new ConfigError(problems);
  return { home, wrapped, retries, retryDelayMs };
}

function parseNonNegInt(problems, env, name, dflt) {
  const v = env[name];
  if (v === undefined || v === "") return dflt;
  if (!/^\d+$/.test(v)) {
    problems.push(`${name} must be a non-negative integer, got ${JSON.stringify(v)}`);
    return dflt;
  }
  return Number(v);
}

// ------------------------------------------------------------------ comparison

/**
 * Pure comparison of one sample.
 * sample = { locked: bigint, wrapped: [{ network, supply: bigint }] }
 */
export function evaluate(sample) {
  if (typeof sample.locked !== "bigint") throw new TypeError("locked must be a bigint");
  let totalWrapped = 0n;
  for (const w of sample.wrapped) {
    if (typeof w.supply !== "bigint") throw new TypeError(`supply for ${w.network} must be a bigint`);
    totalWrapped += w.supply;
  }
  const ok = sample.locked >= totalWrapped;
  return {
    ok,
    locked: sample.locked,
    totalWrapped,
    surplus: ok ? sample.locked - totalWrapped : 0n,
    shortfall: ok ? 0n : totalWrapped - sample.locked,
  };
}

function sameSample(a, b) {
  if (a.locked !== b.locked || a.wrapped.length !== b.wrapped.length) return false;
  return a.wrapped.every((w, i) => w.network === b.wrapped[i].network && w.supply === b.wrapped[i].supply);
}

/**
 * Reads, and on a shortfall retries. The two chains cannot be read atomically,
 * so a transfer that completes between the reads can show a short-lived
 * shortfall. Outcomes:
 *   ok        some read had locked >= total wrapped (a surplus is fine).
 *   deficit   every read showed a shortfall and the numbers never changed:
 *             nothing is moving, so it is not an in-flight transfer. Fails.
 *   pending   every read showed a shortfall but the numbers kept changing:
 *             transfers are in flight. Rerun later; not counted as a failure.
 *   error     no read succeeded.
 */
export async function runCheck({ read, retries = 5, retryDelayMs = 15000, sleep = defaultSleep, log = () => {} }) {
  const samples = [];
  const errors = [];
  const attempts = retries + 1;
  for (let i = 1; i <= attempts; i++) {
    let sample;
    try {
      sample = await read();
    } catch (e) {
      errors.push(e);
      log(`read ${i}/${attempts} failed: ${e.message}`);
      if (i < attempts) await sleep(retryDelayMs);
      continue;
    }
    const result = evaluate(sample);
    samples.push(sample);
    if (result.ok) {
      return { status: "ok", exitCode: EXIT.OK, attempts: i, sample, result, shortfallsSeen: samples.length - 1, errors };
    }
    log(`read ${i}/${attempts}: locked ${sample.locked} < wrapped ${result.totalWrapped} (shortfall ${result.shortfall})`);
    if (i < attempts) await sleep(retryDelayMs);
  }
  if (samples.length === 0) {
    return { status: "error", exitCode: EXIT.READ_ERROR, attempts, errors };
  }
  const last = samples[samples.length - 1];
  const result = evaluate(last);
  const stable = samples.every((s) => sameSample(s, samples[0]));
  if (stable) {
    return { status: "deficit", exitCode: EXIT.DEFICIT, attempts, sample: last, result, samples: samples.length, errors };
  }
  return { status: "pending", exitCode: EXIT.PENDING, attempts, sample: last, result, samples: samples.length, errors };
}

const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ RPC reads

const SEL_BALANCE_OF = "0x70a08231"; // balanceOf(address)
const SEL_TOTAL_SUPPLY = "0x18160ddd"; // totalSupply()

export function encodeBalanceOf(address) {
  if (!ADDRESS_RE.test(address)) throw new Error(`bad address ${address}`);
  return SEL_BALANCE_OF + address.slice(2).toLowerCase().padStart(64, "0");
}

export function decodeUint256(hex, what) {
  if (typeof hex !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`${what}: expected a 32-byte uint256, got ${JSON.stringify(hex)} (is there a contract at that address?)`);
  }
  return BigInt(hex);
}

let rpcId = 0;
export async function rpc(fetchImpl, url, method, params, what) {
  let res;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    });
  } catch (e) {
    throw new Error(`${what}: request failed: ${e.message}`);
  }
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`${what}: RPC error ${body.error.code}: ${body.error.message}`);
  return body.result;
}

async function checkChainId(fetchImpl, chain) {
  if (chain.expectedChainId === null) return;
  const got = Number(BigInt(await rpc(fetchImpl, chain.rpcUrl, "eth_chainId", [], `${chain.network} eth_chainId`)));
  if (got !== chain.expectedChainId) {
    throw new Error(`${chain.network}: RPC is on chain ${got}, deployments file says ${chain.expectedChainId}`);
  }
}

/** Returns a read() for runCheck that queries every chain over JSON-RPC. */
export function makeRpcReader(config, fetchImpl = fetch) {
  let chainIdsChecked = false;
  return async function read() {
    if (!chainIdsChecked) {
      await Promise.all([config.home, ...config.wrapped].map((c) => checkChainId(fetchImpl, c)));
      chainIdsChecked = true;
    }
    const { home } = config;
    const [locked, ...supplies] = await Promise.all([
      rpc(fetchImpl, home.rpcUrl, "eth_call", [{ to: home.token, data: encodeBalanceOf(home.manager) }, "latest"],
        `${home.network} mNVDA.balanceOf(manager)`).then((r) => decodeUint256(r, `${home.network} mNVDA.balanceOf(manager)`)),
      ...config.wrapped.map((w) =>
        rpc(fetchImpl, w.rpcUrl, "eth_call", [{ to: w.token, data: SEL_TOTAL_SUPPLY }, "latest"], `${w.network} wNVDA.totalSupply()`)
          .then((r) => decodeUint256(r, `${w.network} wNVDA.totalSupply()`)),
      ),
    ]);
    return { locked, wrapped: config.wrapped.map((w, i) => ({ network: w.network, supply: supplies[i] })) };
  };
}

// ------------------------------------------------------------------ output

export function formatUnits(value, decimals = 18) {
  const neg = value < 0n;
  const v = neg ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = (v % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}

export function report(outcome) {
  const lines = [];
  const { status } = outcome;
  if (status === "error") {
    lines.push(`ERROR: no successful read in ${outcome.attempts} attempts`);
    for (const e of outcome.errors) lines.push(`  ${e.message}`);
    return lines.join("\n");
  }
  const { sample, result } = outcome;
  lines.push(`locked mNVDA (home manager): ${formatUnits(result.locked)}`);
  for (const w of sample.wrapped) lines.push(`wNVDA supply on ${w.network}: ${formatUnits(w.supply)}`);
  lines.push(`total wrapped: ${formatUnits(result.totalWrapped)}`);
  if (status === "ok") {
    lines.push(
      result.surplus === 0n
        ? "OK: locked equals total wrapped supply"
        : `OK: locked exceeds wrapped by ${formatUnits(result.surplus)} (transfers in flight or mNVDA sent straight to the manager)`,
    );
    if (outcome.shortfallsSeen) lines.push(`note: ${outcome.shortfallsSeen} earlier read(s) showed a short-lived shortfall`);
  } else if (status === "pending") {
    lines.push(
      `PENDING: locked is ${formatUnits(result.shortfall)} below wrapped on all ${outcome.samples} reads, but the numbers were still changing (transfers in flight). Rerun later.`,
    );
  } else {
    lines.push(
      `FAIL: locked is ${formatUnits(result.shortfall)} below total wrapped supply on all ${outcome.samples} reads, with no change between reads`,
    );
  }
  return lines.join("\n");
}
