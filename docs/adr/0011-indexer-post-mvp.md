# 0011. Indexer for holdings, trades and history (post-MVP)

- Status: proposed
- Date: 2026-11-06
- Deciders: alle, user

## Context
PLAN.md lists an indexer as the step that turns the MVP into a real terminal: holdings across chains, trade history and bridge history. It is post-MVP. The MVP reads balances and recent events directly over RPC.

Sources (fetched 2026-11-06 IST):
- Arc data indexers: https://docs.arc.io/arc/tools/data-indexers.md
  - Lists Alchemy (Data APIs, Webhooks), Envio (HyperIndex), Goldsky (Turbo Pipelines, Subgraphs) and The Graph (Subgraphs, Substreams).
  - It does not say which of them support Arc **testnet**.
- Arc indexing events: https://docs.arc.io/integrate/infrastructure/indexing-events.md
- Arc EVM differences: https://docs.arc.io/arc/references/evm-differences.md
  - Native USDC movements are logged by the system emitter `0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE` with 18 decimals, so ERC-20 and native views must not be double counted.

## Options considered
1. **Hosted indexer (Envio HyperIndex or a Goldsky subgraph) on Arc testnet plus Sepolia**
   - Pros: multi-chain; GraphQL out of the box.
   - Cons: testnet support not checked; may need an account and keys.
2. **Self-hosted small indexer (viem `getLogs` polling into SQLite, served by the relayer service)**
   - Pros: no third party; works on any RPC.
   - Cons: we maintain it.
3. **No indexer; RPC reads only**
   - Pros: nothing to build.
   - Cons: no history across reloads.

## Decision
Proposed and not decided. Spike T-020 (post-MVP) checks whether option 1 supports Arc testnet. Lean towards option 2 if it does not, because the relayer service already exists (ADR 0008).

Events to index:
- `Bought` and `Sold` (market contract).
- tAAPL `Transfer` on both chains.
- CCTS transfer events (sent and received) for bridge history.

## Consequences
- Contract events must carry enough data (user, amounts, price) for history. This is already required in ADR 0005.

## Not verified
- Arc testnet support of each listed indexer.
- CCTS event names and signatures. Read them from the contract reference or the ABI before building.
