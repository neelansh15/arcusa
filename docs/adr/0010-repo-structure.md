# 0010. Repo structure

- Status: accepted
- Date: 2026-11-06
- Deciders: alle, user

## Context
One repo holds research docs, Studio-generated code (ADR 0006), Sepolia-side scripts and a small backend. Two agents edit it, so paths must be predictable.

## Options considered
1. **Single repo, top-level folders by role** (below)
   - Pros: simple; one place for judges.
   - Cons: mixed toolchains.
2. **Separate repos for contracts, app and services**
   - Pros: clean boundaries.
   - Cons: more coordination; the track asks for one repo link.

## Decision
Use option 1:

```
app/                    Studio-generated frontend (pulled with arc-studio pull)
contracts/arc/          Studio-generated Arc contracts and tests (PriceOracle, market)
contracts/scripts/      Laptop Foundry/viem scripts: deploy tAAPL via CCTS on Arc and Sepolia,
                        set rate limits, addMinter, raw CCTS fallback transfer
services/oracle-relayer/ Node relayer: Pyth Hermes -> PriceOracle on Arc
docs/adr/               ADRs
docs/architecture/      architecture diagram (source + exported image)
docs/demo/              demo script and submission notes
deployments/            JSON of deployed addresses and token id per network (no secrets)
.env.example            variable names only; real .env is gitignored
```

- If Studio's output layout differs, keep Studio's layout inside `app/` and `contracts/arc/` rather than reshaping it, so `arc-studio pull` stays clean.
- Deployed addresses and the bytes32 token id are written to `deployments/<network>.json` and read by the app and the relayer.

## Consequences
- `.gitignore` must cover `.env`, `node_modules`, Foundry `out/` and `cache/`, and the `arc-studio` local state.
- No private keys, RPC keys or API tokens in any committed file.
