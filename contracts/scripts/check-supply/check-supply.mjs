#!/usr/bin/env node
// check-supply (T-034): fails if mNVDA locked on Sepolia < total wNVDA supply
// across all wrapped deployments. Read-only; sends no transactions; needs no key.
//
// Usage (from the repo root, with .env loaded into the environment):
//   node contracts/scripts/check-supply/check-supply.mjs [--json]
// Config: see loadConfig() in lib.mjs. Exit codes: 0 ok, 1 deficit,
// 2 pending (transfers in flight, rerun), 3 read error, 78 config error.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, EXIT, loadConfig, makeRpcReader, report, runCheck } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const deploymentsDir = process.env.DEPLOYMENTS_DIR || path.resolve(here, "../../../deployments");
const asJson = process.argv.includes("--json");

let config;
try {
  config = loadConfig({ env: process.env, deploymentsDir });
} catch (e) {
  if (e instanceof ConfigError) {
    console.error(e.message);
    process.exit(EXIT.CONFIG_ERROR);
  }
  throw e;
}

const outcome = await runCheck({
  read: makeRpcReader(config),
  retries: config.retries,
  retryDelayMs: config.retryDelayMs,
  log: (m) => console.error(m),
});

if (asJson) {
  console.log(
    JSON.stringify(
      { status: outcome.status, sample: outcome.sample, errors: outcome.errors?.map((e) => e.message) },
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    ),
  );
} else {
  console.log(report(outcome));
}
process.exit(outcome.exitCode);
