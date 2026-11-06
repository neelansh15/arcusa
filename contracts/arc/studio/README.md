# Arc Studio output

Pulled from the Arc Studio project on 2026-11-07 with `arc-studio pull` (ADR 0025):
https://studio.arc.io/app/efb4a3b8-92a8-41d3-993a-5d254dc32258

| Path | What |
| --- | --- |
| `contracts/PriceOracle.sol`, `contracts/InventoryMarket.sol` | The contracts as Studio holds and deployed them. Byte-identical to `../src/` (checked with `diff` on 2026-11-07). |
| `contracts/test/` | Foundry tests written by Studio. Studio reported 101 passed, 0 failed (PriceOracle 41, InventoryMarket 57 including fuzz and invariants, plus mocks). Not run by us locally: Foundry is not installed on the laptop. |
| `contracts/contract-metadata/` | ABIs (`PriceOracle.json`, `InventoryMarket.json`) and `arcusa-deployments.json` (four deployments, roles, tx hashes, constructor args). |
| `foundry.toml`, `remappings.txt` | Studio's Foundry config (solc 0.8.28, cancun). The tests expect `forge-std` and `@openzeppelin/contracts` to be installed (Studio uses `lib/` and `node_modules`). |

`../src/` stays as our working copy (ADR 0025: kept in case Studio's copy is ever needed to diverge). Deployed addresses are in `../../../deployments/arc-testnet.json` under `studio`.

To refresh: `arc-studio pull --out contracts/arc/studio --paths "contracts/*.sol" "contracts/test/**" "contracts/contract-metadata/**" foundry.toml remappings.txt`
