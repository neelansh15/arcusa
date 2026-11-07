# 0028. Chainlink CRE parity monitor (simulated)

- Status: proposed
- Date: 2026-11-07
- Deciders: alle, user

## Context
ADR 0015 asks for parity monitoring: oracle age, oracle versus source, and an alert if locked supply is below wrapped supply. We also enter the Chainlink track "Best workflow with CRE", which asks for a CRE workflow that integrates a blockchain with an external API and a successful CLI simulation (deploying is not required). Plan: `docs/research/extra-sponsor-tracks.md` section 5. Facts checked 2026-11-07: CLI v1.39.0, `cre workflow supported-chains` lists `ethereum-testnet-sepolia` and `arc-testnet`; the TypeScript workflow needs Bun to compile.

## Options considered
1. CRE workflow, read-only, simulated: meets the track, no new trust or keys, small.
2. CRE workflow that also writes the price to the oracle: would need a forwarder and a new oracle write path; contradicts the relayer design. Rejected.
3. Do nothing: no Chainlink track.

## Decision
Option 1. `chainlink/cre/parity-monitor` reads the Sepolia lock, the Arc wrapped supply and oracle round, and the xStocks price, then returns a `healthy` report using ADR 0015's thresholds (60 s age, 30 bps). It is simulated only. We do not claim a CRE deployment, a Chainlink price source, Data Feeds or Data Streams, or that CRE replaces the relayer.

## Consequences
- Easier: a repeatable parity check using the same price endpoint as the price service.
- Harder: one more toolchain (CRE CLI, Bun, a Chainlink account) for anyone re-running it.
- The 30 bps deviation limit is our reading of ADR 0015's base spread, not a stated alert threshold.
- Unverified: deployment on the CRE network, multi-node consensus, behaviour over many cron ticks, the free-tier cost. Task: T-060.
