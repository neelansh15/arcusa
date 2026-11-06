# 0025. Arc contracts are rebuilt, tested and deployed in Arc Studio, and the app switches to those deployments

- Status: accepted
- Date: 2026-11-07
- Deciders: user (chose "switch to Studio" on 2026-11-07), laptop

## Context
ADR 0006 (accepted) says the Arc-side contracts are generated in Arc Studio and that a shareable Studio project URL goes in the README. In practice `PriceOracle`, `InventoryMarket` and the mock tokens were written in this repo and deployed with viem from a throwaway wallet (LOG.md, T-022 area). The linked Studio app ("Arc Terminal Stock Trading", app id `efb4a3b8-92a8-41d3-993a-5d254dc32258`) holds only a UI scaffold: its own plan says no market, no oracle, no deployments, and `arc-studio deployments` returned "No deployed contracts found" on 2026-11-07. The ETHGlobal Mumbai Arc prize page (read 2026-11-07, https://ethglobal.com/events/mumbai/prizes#arc, fetch truncated) says every Arc prize needs Studio "as the starting point"; tracks 1 to 4 require "Built in Arc Studio", a shareable Studio project URL and Studio shown in the demo; track 3 says write, test and deploy contracts in Studio.

## Options considered
1. Studio copy only: keep current deployments live, deploy a copy from Studio for the story. Cheap, weaker, two sets of contracts.
2. Switch: Studio builds, tests and deploys the contracts; the app, relayer and docs move to those addresses.

## Decision (option 2)
- **What Studio builds.** The two contracts `PriceOracle` and `InventoryMarket`, behaviour and ABI unchanged (the frontend and relayer depend on the ABI). We send our current sources into the Studio workspace with `arc-studio run --file src:dest`, and Studio compiles them, writes and runs Foundry tests, and deploys. Any source change Studio makes is reported and reviewed before we accept it.
- **What Studio deploys.** NVDA pair: `PriceOracle(owner, 300)` then `InventoryMarket(owner, USDC, wNVDA, oracle)`. TSLA pair: the same with `wTSLA`. Four deployments on Arc testnet. The wrapped tokens (`wNVDA`, `wTSLA`) and the Sepolia mock tokens stay as they are (created by the CCTPx ownerless path, not by Studio).
- **Ownership.** The constructor `owner` is the existing deployer address `0x07621e39424914f633D478DdE751f3FF728CB351`, whose key is held by the server agent (alle), not on the laptop and never in the repo. Studio does not call any owner-only function. Owner-only setup (first price, demo mode, off-hours trading, relayer, moving inventory to the new markets) is done by alle with that key (T-056).
- **Switch.** After setup, the laptop repoints `lib/market.ts`, `lib/assets.ts`, `deployments/arc-testnet.json`, the price relayer config and the docs to the Studio-deployed addresses (T-057). Old deployments are left in place and recorded as superseded.
- **Studio project.** The README gets the shareable Studio URL (from `arc-studio open` / the `webUrl` of the run). `arc-studio pull` brings Studio's contract output and tests back into `contracts/arc/` so the repo matches what Studio deployed.
- **Safety.** Studio's reported addresses and prose are untrusted: every address is verified on-chain (code present, `owner()` equals the deployer, constructor args match) before the app uses it.

## Consequences
- New contract addresses; liquidity must be moved or re-seeded, and the relayer must be re-pointed. Until T-056 and T-057 are done, the app keeps using the current deployments.
- Studio usage limits apply (4 percent of the daily limit used on 2026-11-07); contract deploys take 5 to 20 minutes each.
- Not verified: how Studio's deployer funds gas, whether Studio keeps the constructor arguments exactly, whether Studio's compiler settings match the original bytecode behaviour.
