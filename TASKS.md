# Tasks

Shared task list between **alle** (primary agent) and **laptop** (Claude Code on the user's laptop). See `CLAUDE.md` for the rules.

Statuses: `todo`, `doing`, `blocked`, `done`, `superseded`, `parked` (agreed to do later; do not start). Owners: `alle`, `laptop`.
One block per task, newest at the bottom. Do not reuse IDs.

## Template

```
### T-000: Short imperative title
- Owner: alle | laptop
- Status: todo | doing | blocked | done | superseded | parked
- ADR: docs/adr/NNNN-... (optional)
- Depends on: T-xxx (optional)
- Goal: one or two sentences.
- Acceptance criteria:
  - [ ] verifiable item
  - [ ] verifiable item
- Notes: questions, blockers, context.
- Result: (filled when done) what changed, links, how to reproduce, what was NOT verified.
```

## Priorities (decided 2026-11-06)

**Phase 1: the bridge layer, with tests.** Price parity and the oracle come later (the user's decision).

1. T-002 Repo skeleton
2. T-003 Arc Studio app (not needed by the bridge spikes; needed by the UI)
3. T-022 Mock provider token, lock-and-mint on Arc (spike; depends on T-002 only)
4. T-024 Bridge Kit for wNVDA, both directions, timings (spike)
5. T-033 Bridge layer module with unit tests
   - T-036 Persistence and resume (after T-033)
6. T-034 Contract tests for the mock token and the lock-and-mint accounting
7. T-035 Testnet integration tests for the bridge layer
8. T-032 ADR review for the bridge ADRs (0012, 0013, 0016, 0017, 0008)

Parallel in phase 1:
- T-001: user decisions; needed by T-019.
- T-004: USDC bridge-in spike; feeds T-033.
- T-023: real provider token research (alle); needed by T-032.

**Phase 2 (parked until phase 1 is done):** oracle and market, then the UI and the end-to-end run.
- Parked: T-025, T-026, T-027, T-028, T-029, T-030.
- Then: T-011 Terminal UI, T-012, T-013 (UI on top of the T-033 module), T-014 end-to-end, T-015, T-016, T-017, T-018, T-019.

Superseded on 2026-11-06: T-005, T-006, T-007, T-008, T-009, T-010 (replaced by T-022, T-024, T-025, T-032, T-026, T-027). Tasks T-001 and T-011 to T-019 now say `wNVDA` where they said `tAAPL`; read them with ADRs 0012 to 0017.

Post-MVP: T-020 and T-021. Do not start these before T-019 is done.

Spikes check items that are not verified in proposed ADRs. A spike may use a proposed ADR as its hypothesis. Build tasks wait for the ADR to be accepted (T-032).

## Index

One row per task; the ID links to the task block. Keep Status in sync with the task block when you change it. GitHub also shows an outline button at the top right of this file.

| ID | Status | Owner | Title |
|---|---|---|---|
| [T-001](#t-001-get-user-decisions-needed-for-submission-and-demo) | todo | alle | Get user decisions needed for submission and demo |
| [T-002](#t-002-create-repo-skeleton-per-adr-0010) | todo | laptop | Create repo skeleton per ADR 0010 |
| [T-003](#t-003-create-the-arc-studio-app-and-link-the-cli-adr-0006) | todo | laptop | Create the Arc Studio app and link the CLI (ADR 0006) |
| [T-004](#t-004-spike-usdc-bridge-in-from-sepolia-to-arc-with-forwarding-adr-0003) | todo | laptop | Spike: USDC bridge-in from Sepolia to Arc with Forwarding (ADR 0003) |
| [T-005](#t-005-spike-deploy-taapl-as-a-native-crosschaintoken-on-arc-and-sepolia-adr-0002) | superseded | laptop | Spike: deploy tAAPL as a native CrossChainToken on Arc and Sepolia (ADR 0002) |
| [T-006](#t-006-spike-bridge-kit-transfer-of-taapl-by-token-id-in-both-directions-adr-0001) | superseded | laptop | Spike: Bridge Kit transfer of tAAPL by token id, in both directions (ADR 0001) |
| [T-007](#t-007-spike-oracle-source-for-aaplusd-on-arc-testnet-adr-0004) | superseded | laptop | Spike: oracle source for AAPL/USD on Arc testnet (ADR 0004) |
| [T-008](#t-008-review-spike-results-and-accept-or-supersede-adrs-0001-0002-0004-0005-0008) | superseded | alle | Review spike results and accept or supersede ADRs 0001, 0002, 0004, 0005, 0008 |
| [T-009](#t-009-build-priceoracle-contract-and-oracle-relayer) | superseded | laptop | Build PriceOracle contract and oracle relayer |
| [T-010](#t-010-build-market-contract-oracle-priced-mint-and-redeem-in-arc-studio) | superseded | laptop | Build market contract (oracle-priced mint and redeem) in Arc Studio |
| [T-011](#t-011-build-terminal-ui-price-balances-buy-and-sell) | todo | laptop | Build terminal UI: price, balances, buy and sell |
| [T-012](#t-012-add-usdc-bridge-in-flow-to-the-ui) | todo | laptop | Add USDC bridge-in flow to the UI |
| [T-013](#t-013-add-wnvda-bridge-flow-to-the-ui) | todo | laptop | Add wNVDA bridge flow to the UI |
| [T-014](#t-014-run-the-full-demo-flow-end-to-end-on-a-fresh-wallet) | todo | laptop | Run the full demo flow end to end on a fresh wallet |
| [T-015](#t-015-draft-architecture-diagram-from-the-adrs) | todo | alle | Draft architecture diagram from the ADRs |
| [T-016](#t-016-write-readme-for-judges-and-finalize-the-diagram) | todo | laptop | Write README for judges and finalize the diagram |
| [T-017](#t-017-re-verify-fast-moving-facts-before-recording) | todo | alle | Re-verify fast-moving facts before recording |
| [T-018](#t-018-record-the-demo-video) | todo | laptop | Record the demo video |
| [T-019](#t-019-submit-to-ethglobal-mumbai) | todo | laptop | Submit to ETHGlobal Mumbai |
| [T-022](#t-022-spike-mock-provider-token-on-sepolia-lock-and-mint-to-arc-via-the-ownerless-path-adr-0012) | todo | laptop | Spike: mock provider token on Sepolia, lock-and-mint to Arc via the ownerless path (ADR 0012) |
| [T-023](#t-023-research-can-real-provider-tokens-be-locked-and-wrapped-adr-0012-adr-0016) | todo | alle | Research: can real provider tokens be locked and wrapped? (ADR 0012, ADR 0016) |
| [T-024](#t-024-spike-bridge-kit-transfer-of-wnvda-by-token-id-both-directions-with-measured-timing-adr-0013) | todo | laptop | Spike: Bridge Kit transfer of wNVDA by token id, both directions, with measured timing (ADR 0013) |
| [T-025](#t-025-spike-nvda-price-source-ondo-api-first-access-and-behaviour-by-market-session-adr-0015) | parked | alle | Spike: NVDA price source (Ondo API first), access and behaviour by market session (ADR 0015) |
| [T-026](#t-026-build-priceoracle-with-guards-and-the-relayer-adr-0015) | parked | laptop | Build PriceOracle with guards, and the relayer (ADR 0015) |
| [T-027](#t-027-build-inventorymarket-adr-0014) | parked | laptop | Build InventoryMarket (ADR 0014) |
| [T-028](#t-028-pre-position-wnvda-inventory-and-document-refills) | parked | laptop | Pre-position wNVDA inventory and document refills |
| [T-029](#t-029-parity-tests-and-scenarios-adr-0015) | parked | laptop | Parity tests and scenarios (ADR 0015) |
| [T-030](#t-030-parity-panel-in-the-ui-adr-0015) | parked | laptop | Parity panel in the UI (ADR 0015) |
| [T-032](#t-032-review-spikes-and-accept-or-supersede-adrs-0008-0012-to-0017) | todo | alle | Review spikes and accept or supersede ADRs 0008, 0012 to 0017 |
| [T-033](#t-033-build-the-bridge-layer-module-with-unit-tests) | todo | laptop | Build the bridge layer module with unit tests |
| [T-034](#t-034-contract-tests-for-the-mock-token-and-lock-and-mint-accounting) | todo | laptop | Contract tests for the mock token and lock-and-mint accounting |
| [T-035](#t-035-testnet-integration-tests-for-the-bridge-layer) | todo | laptop | Testnet integration tests for the bridge layer |
| [T-036](#t-036-bridge-layer-persistence-and-resume) | todo | laptop | Bridge layer persistence and resume |
| [T-020](#t-020-post-mvp-spike-indexer-options-on-arc-testnet-and-sepolia) | todo | alle | (post-MVP) Spike: indexer options on Arc testnet and Sepolia |
| [T-021](#t-021-post-mvp-build-indexer-and-holdingshistory-view) | todo | laptop | (post-MVP) Build indexer and holdings/history view |

## Tasks

### T-001: Get user decisions needed for submission and demo
- Owner: alle
- Status: todo
- ADR: docs/adr/0017-demo-scope-with-wrapped-token.md, docs/adr/0014-trading-against-pre-positioned-inventory.md
- Depends on: none
- Goal: Get the user's answers on the open choices that no agent can make alone, and record them in PLAN.md.
- Acceptance criteria:
  - [ ] Repo visibility for judging is decided: make public at submission, or grant judge access. The Arc tracks ask for a GitHub repo link and the repo is private.
  - [ ] The track or tracks are confirmed: primary "Best Use of Bridge Kit for Non-USDC Assets, Built in Arc Studio", and whether the DeFi track is also entered, if allowed.
  - [x] Off-hours trading decided 2026-11-06: demo mode on, demo stock NVDA.
  - [ ] It is confirmed who owns the Arc Studio account and who logs in on the laptop.
  - [ ] The submission deadline and judging time are recorded.
  - [ ] All answers are recorded in the PLAN.md Log with a date.
- Notes: US regular hours are 20:00-02:30 IST after the US DST change, so daytime judging will probably fall when the market is closed.
- Result:
- Decided 2026-11-06 by the user: demo mode is on (trade off-hours at the last price with a wide spread, labelled indicative), and the demo stock is NVDA (Ondo lists NVDAon for 24/7 mint and redeem). Still to ask: whether the real provider tokens claim stays in the pitch if T-023 says no.

### T-002: Create repo skeleton per ADR 0010
- Owner: laptop
- Status: todo
- ADR: docs/adr/0010-repo-structure.md
- Depends on: none
- Goal: Create the folder layout, `.gitignore` and `.env.example` so later tasks have fixed paths.
- Acceptance criteria:
  - [ ] Folders exist: `app/`, `contracts/arc/`, `contracts/sepolia/`, `contracts/scripts/`, `packages/bridge/`, `services/oracle-relayer/`, `docs/architecture/`, `docs/demo/`, `deployments/`. Use a `.gitkeep` where a folder is empty.
  - [ ] A package-manager workspace (pnpm) covers `packages/*` and `app/`, with one test runner configured (vitest for TypeScript) and one `test` command at the root.
  - [ ] A CI stub (GitHub Actions) runs install and `test` on push. It may be a no-op until tests exist, but it must run green.
  - [ ] `.gitignore` covers `.env*` except `.env.example`, `node_modules`, Foundry `out/` and `cache/`, and local Arc Studio CLI state.
  - [ ] `.env.example` lists variable names only, for example `DEPLOYER_PRIVATE_KEY`, `RELAYER_PRIVATE_KEY`, `ARC_TESTNET_RPC_URL`, `SEPOLIA_RPC_URL`, `IRIS_API_URL`. No values.
  - [ ] Arc Foundry is installed (`arc-forge --version` output pasted in Result). See https://docs.arc.io/arc/tutorials/install-arc-foundry.md.
  - [ ] `git grep -nE '0x[0-9a-fA-F]{64}'` shows no private keys.
- Notes: Extends ADR 0010 (accepted) with `packages/bridge/` (T-033) and `contracts/sepolia/` (mNVDA and the Sepolia scripts, T-022, T-034). `contracts/arc/` stays Studio-only. The raw CCTS fallback in ADR 0010 no longer applies (ADR 0013).
- Result:

### T-003: Create the Arc Studio app and link the CLI (ADR 0006)
- Owner: laptop
- Status: todo
- ADR: docs/adr/0006-arc-studio-workflow.md
- Depends on: T-002
- Goal: Start the project in Arc Studio, as all Arc tracks require, and make sure the laptop can drive it and pull code.
- Acceptance criteria:
  - [ ] `@circle-fin/arc-studio-cli` is installed. `arc-studio whoami` shows the user's account. The user approves the device-link login.
  - [ ] `arc-studio skills install --tool claude-code` is done.
  - [ ] A Studio app is created with a first prompt (Plan mode) that describes arcusa: a terminal UI on Arc testnet, USDC settlement, an oracle-priced market, and Bridge Kit for wNVDA. The app ID and the shareable project URL are recorded in Result.
  - [ ] `arc-studio pull --out app/` works, and the pulled scaffold is committed. The framework and folder layout are noted in Result for ADR 0008.
  - [ ] The Result notes what a judge sees when opening the shareable URL (code, preview, or both).
  - [ ] The Result notes how "Push to GitHub" behaves: does it target a new repo or an existing one? Do not push to a new public repo without the user's OK.
- Notes: Studio deploys to Arc testnet only. Studio cannot `clone` a private repo. Mind the usage limits (`arc-studio usage`).
- Result:

### T-004: Spike: USDC bridge-in from Sepolia to Arc with Forwarding (ADR 0003)
- Owner: laptop
- Status: todo
- ADR: docs/adr/0003-usdc-bridge-in-with-forwarding.md
- Depends on: T-002
- Goal: Prove that a fresh wallet can get USDC onto Arc testnet in one step with Bridge Kit and Forwarding.
- Acceptance criteria:
  - [ ] Script `contracts/scripts/bridge-usdc-in.ts` uses `@circle-fin/bridge-kit` with `to: { chain: "Arc_Testnet", useForwarder: true }` and `config: { feePayment: "source" }`, from `Ethereum_Sepolia`.
  - [ ] A fresh wallet funded only with Sepolia ETH and faucet USDC (https://faucet.circle.com) ends with USDC on Arc testnet, and has sent no Arc transaction itself.
  - [ ] The Result records: source tx hash, Arc mint tx hash (explorer links), the fee actually charged, wall-clock time, and the Bridge Kit version used.
- Notes: Use RPC `https://rpc.testnet.arc.io` (the old `rpc.testnet.arc.network` host is retired).
- Result:

### T-005: Spike: deploy tAAPL as a native CrossChainToken on Arc and Sepolia (ADR 0002)
- Owner: laptop
- Status: superseded
- ADR: docs/adr/0002-stock-token-model-and-issuer.md
- Depends on: T-002
- Goal: Deploy the stock token on both chains with the same deployer and salt, and settle the open questions in ADR 0002.
- Acceptance criteria:
  - [ ] Script `contracts/scripts/deploy-token.ts` (or Foundry) calls `deployCrossChainToken` on CCTS `0x63753E722bd2C2A5DF6EE19C5106662208B81077` on Arc testnet and on Ethereum Sepolia. It uses the same deployer, salt, name (`arcusa test AAPL`), symbol (`tAAPL`) and 18 decimals.
  - [ ] Before the call, the live ABI or selector is checked to see whether `DeploymentParams.initialSupply` exists. The answer is in Result.
  - [ ] `resolveTokenAddress(tokenId)` returns the token on both chains. The code handles the `TokenNotRegistered` revert (selector `0x5d0028cf`) before deployment.
  - [ ] A non-zero rate limit is set on both TokenManagers. `maxTransferAmount` is set to an explicit value, and the Result says what 0 does on the live contract, because the docs contradict each other.
  - [ ] `addMinter(<test address>)` by the token owner works on Arc. A test mint and burn by that address succeed. If not, record the blocker and mark the task `blocked`.
  - [ ] `deployments/arc-testnet.json` and `deployments/sepolia.json` hold the token id, token addresses and TokenManager addresses. No keys.
- Notes: Address fields are `bytes` packed to 20 bytes (`encodePacked`). Do not ABI-pad them to 32 bytes.
- Result:
- Superseded by T-022 on 2026-11-06 (asset model changed, ADR 0012). Do not start this task.

### T-006: Spike: Bridge Kit transfer of tAAPL by token id, in both directions (ADR 0001)
- Owner: laptop
- Status: superseded
- ADR: docs/adr/0001-stock-token-bridging-path.md
- Depends on: T-005
- Goal: Show that Bridge Kit can move our own token between Arc testnet and Sepolia. If it cannot, prove the raw CCTS fallback.
- Acceptance criteria:
  - [ ] The Iris sandbox registry `GET https://iris-api-sandbox.circle.com/v2/cctpx/tokens` lists our token id on domains 0 and 26. The Result records how long after deployment it appeared.
  - [ ] `supportsRoute(Arc_Testnet, Ethereum_Sepolia, <tokenId>)` returns true after `refreshTokenRegistry()`.
  - [ ] `kit.bridge({ token: <tokenId>, ... })` moves tAAPL from Arc to Sepolia, and then from Sepolia to Arc. The Result has the tx hashes, fee, time and forward state history for each direction.
  - [ ] The same flow is tried in a browser bundle with `@circle-fin/adapter-viem-v2`. The Result says whether it works (input for ADR 0008).
  - [ ] If Bridge Kit fails: `contracts/scripts/ccts-transfer.ts` does the raw flow (approve TokenManager, Iris quote, `crossChainTransfer`, poll, `receiveMessage`) and succeeds. The Result has the Bridge Kit error verbatim.
- Notes: Sepolia-source transfers are expected to run at SLOW (Ethereum finality), because our token has no FX symbol for fast burn.
- Result:
- Superseded by T-024 on 2026-11-06 (asset model changed, ADR 0012). Do not start this task.

### T-007: Spike: oracle source for AAPL/USD on Arc testnet (ADR 0004)
- Owner: laptop
- Status: superseded
- ADR: docs/adr/0004-price-oracle.md
- Depends on: T-002
- Goal: Confirm the relayer approach works, and check whether a verifiable oracle on Arc testnet is just as easy.
- Acceptance criteria:
  - [ ] `GET https://hermes.pyth.network/v2/updates/price/latest?ids[]=0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688&parsed=true` returns a price from the laptop. The Result records price, exponent, publish_time and market status.
  - [ ] Pyth Pro on Arc testnet (`0xACeA761c27A909d4D3895128EBe6370FDE2dF481`) is checked: is there an AAPL channel, and does it need an access token? Answer in Result.
  - [ ] Stork on Arc testnet (`0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62`) is checked: is there an AAPL feed, and does it need an API key? Answer in Result.
  - [ ] The Result recommends a source in one line, with reasons.
- Notes: Pyth's own table shows no Pyth Core contract on Arc testnet, only Pyth Pro (checked 2026-11-06).
- Result:
- Superseded by T-025 on 2026-11-06 (asset model changed, ADR 0012). Do not start this task.

### T-008: Review spike results and accept or supersede ADRs 0001, 0002, 0004, 0005, 0008
- Owner: alle
- Status: superseded
- ADR: docs/adr/0001-stock-token-bridging-path.md, docs/adr/0002-stock-token-model-and-issuer.md, docs/adr/0004-price-oracle.md, docs/adr/0005-trading-and-settlement.md, docs/adr/0008-frontend-stack-and-wallet.md
- Depends on: T-003, T-005, T-006, T-007
- Goal: Turn the proposed ADRs into accepted ones, or write superseding ADRs, so the build tasks have rules to follow.
- Acceptance criteria:
  - [ ] Each listed ADR has the status `accepted`, or `rejected` with a new ADR that replaces it. Each change links the spike Result it is based on.
  - [ ] The off-hours trading answer from T-001 is reflected in ADR 0005, or in a new ADR if 0005 is already accepted.
  - [ ] The ADR index in `docs/adr/README.md` is updated.
- Notes: Fast-moving facts in the ADRs must be re-fetched on the day of review.
- Result:
- Superseded by T-032 on 2026-11-06 (asset model changed, ADR 0012). Do not start this task.

### T-009: Build PriceOracle contract and oracle relayer
- Owner: laptop
- Status: superseded
- ADR: docs/adr/0004-price-oracle.md (must be accepted)
- Depends on: T-008
- Goal: Get a fresh AAPL/USD price onchain on Arc testnet, with publish time and market status.
- Acceptance criteria:
  - [ ] `PriceOracle` is generated in Arc Studio (Smart Contract mode) with tests. It is deployed on Arc testnet, and its address is in `deployments/arc-testnet.json`.
  - [ ] Only the relayer address can update. The contract stores price, exponent, publishTime and isMarketOpen. Tests cover the update and access control.
  - [ ] `services/oracle-relayer/` pushes updates at a configured interval. The relayer key comes from `.env`. The Result has the run command.
  - [ ] Reading the oracle from Arc testnet returns a price whose publish time is less than 2 minutes behind Hermes while the relayer runs.
- Notes: Gas is paid in USDC, with a 20 Gwei `maxFeePerGas` floor.
- Result:
- Superseded by T-026 on 2026-11-06 (asset model changed, ADR 0012). Do not start this task.

### T-010: Build market contract (oracle-priced mint and redeem) in Arc Studio
- Owner: laptop
- Status: superseded
- ADR: docs/adr/0005-trading-and-settlement.md (must be accepted), docs/adr/0002-stock-token-model-and-issuer.md (must be accepted)
- Depends on: T-008, T-009
- Goal: Users can buy and sell tAAPL against USDC on Arc at the oracle price, within the rules in ADR 0005.
- Acceptance criteria:
  - [ ] The contract is generated in Studio Smart Contract mode. Its tests cover:
    - buy and sell math with the spread;
    - rounding in favour of the contract;
    - a stale price reverting;
    - market-closed behaviour as decided in T-001 and T-008;
    - `maxTradeUsdc` and `maxExposureUsdc`;
    - pause;
    - USDC with 6 decimals and tAAPL with 18 decimals.
  - [ ] It is deployed on Arc testnet, and the address is in `deployments/arc-testnet.json`.
  - [ ] The market is added as a minter on Arc tAAPL. The treasury is seeded with testnet USDC, and the amount is in Result.
  - [ ] A scripted buy and sell on Arc testnet succeed. The tx hashes are in Result, and the `Bought` and `Sold` events are visible on the explorer.
- Notes:
- Result:
- Superseded by T-027 on 2026-11-06 (asset model changed, ADR 0012). Do not start this task.

### T-011: Build terminal UI: price, balances, buy and sell
- Owner: laptop
- Status: todo
- ADR: docs/adr/0008-frontend-stack-and-wallet.md (must be accepted), docs/adr/0016-compliance-provider-tokens.md
- Depends on: T-003, T-027
- Goal: A user connects a wallet and trades wNVDA against USDC on Arc from the terminal UI.
- Acceptance criteria:
  - [ ] Wallet connect works for Arc testnet (5042002) and Ethereum Sepolia.
  - [ ] The UI shows the NVDA price, the age of the price, and market open or closed.
  - [ ] The UI shows USDC and wNVDA balances on Arc and Sepolia.
  - [ ] Buy and sell work from the UI on Arc testnet, with a tx link shown.
  - [ ] Every screen shows the testnet disclaimer from ADR 0009.
  - [ ] The UI changes are made through Studio or synced back to it. The Result notes which.
- Notes:
- Result:

### T-012: Add USDC bridge-in flow to the UI
- Owner: laptop
- Status: todo
- ADR: docs/adr/0003-usdc-bridge-in-with-forwarding.md
- Depends on: T-004, T-011, T-033, T-036
- Goal: A user with USDC on Sepolia funds their Arc account from the terminal in one flow.
- Acceptance criteria:
  - [ ] The "Deposit USDC" flow runs Bridge Kit with Forwarding from Sepolia to Arc and shows progress until COMPLETE.
  - [ ] The fee is shown before the user confirms.
  - [ ] A page reload mid-transfer does not lose the transfer status.
- Notes:
- Result:

### T-013: Add wNVDA bridge flow to the UI
- Owner: laptop
- Status: todo
- ADR: docs/adr/0013-wrapped-token-bridging-path.md (must be accepted)
- Depends on: T-024, T-011, T-033, T-036
- Goal: A user moves wNVDA from Arc to Sepolia, and back, from the terminal with Bridge Kit (no raw-call fallback, ADR 0013).
- Acceptance criteria:
  - [ ] The "Send wNVDA to Sepolia" and "Bring wNVDA to Arc" flows work. The UI shows the states PENDING, SENT, CONFIRMED, COMPLETE and FAILED.
  - [ ] The expected wait is shown, with SLOW for the Sepolia-source direction.
  - [ ] Balances on both chains update after COMPLETE.
- Notes:
- Result:

### T-014: Run the full demo flow end to end on a fresh wallet
- Owner: laptop
- Status: todo
- ADR: docs/adr/0017-demo-scope-with-wrapped-token.md
- Depends on: T-012, T-013
- Goal: Prove the demo scope in ADR 0007 works from a clean state.
- Acceptance criteria:
  - [ ] Starting from a fresh wallet, complete ADR 0007 MVP steps 1-4: deposit USDC, view price, buy wNVDA, bridge wNVDA to Sepolia.
  - [ ] Step 5 (bridge back and sell) is either done or marked skipped with the reason.
  - [ ] The Result has every tx hash, the timings and any manual step.
  - [ ] `docs/demo/demo-script.md` exists, with the click-by-click order and fallback steps, including what to do if Sepolia finality is slow.
- Notes:
- Result:

### T-015: Draft architecture diagram from the ADRs
- Owner: alle
- Status: todo
- ADR: docs/adr/0006-arc-studio-workflow.md
- Depends on: T-032
- Goal: The Arc tracks require an architecture diagram. Draft it from the accepted ADRs so the laptop only needs to update addresses.
- Acceptance criteria:
  - [ ] `docs/architecture/architecture.md` has a Mermaid diagram showing:
    - the user wallet;
    - the Sepolia USDC and Forwarding path;
    - Arc USDC;
    - the market contract, PriceOracle and relayer (Ondo API, ADR 0015);
    - wNVDA and its TokenManagers on both chains;
    - CCTS and Iris;
    - Bridge Kit;
    - Arc Studio.
  - [ ] Each component links to its ADR.
- Notes:
- Result:

### T-016: Write README for judges and finalize the diagram
- Owner: laptop
- Status: todo
- ADR: docs/adr/0017-demo-scope-with-wrapped-token.md, docs/adr/0016-compliance-provider-tokens.md
- Depends on: T-014, T-015
- Goal: The README lets a judge understand, verify and run arcusa in five minutes.
- Acceptance criteria:
  - [ ] The README names the track and has the Arc Studio project URL, the live app URL if any, and the video link (added after T-018).
  - [ ] The README links the architecture diagram, which is updated to the deployed reality.
  - [ ] The README lists contract addresses and the token id, with explorer links.
  - [ ] The README says which parts were built in Arc Studio and which on the laptop, and where Circle tools are used: Bridge Kit, Forwarding, CCTPx and USDC.
  - [ ] The README has run instructions using `.env.example` names.
  - [ ] The README has a "Compliance and limits" section and a "Risks" section (ADR 0005 and ADR 0009).
  - [ ] The README follows the wording rule in `CLAUDE.md`: use "track" or "problem statement".
- Notes:
- Result:

### T-017: Re-verify fast-moving facts before recording
- Owner: alle
- Status: todo
- ADR: none
- Depends on: T-014
- Goal: Make sure nothing in the README or demo relies on stale docs.
- Acceptance criteria:
  - [ ] These are re-fetched on the day: the track text, Bridge Kit and App Kit versions, CCTS and Arc addresses, forwarding fees, and the Arc testnet RPC.
  - [ ] Changes are listed in the PLAN.md Log with the date. Any mismatch becomes a laptop task.
- Notes:
- Result:

### T-018: Record the demo video
- Owner: laptop
- Status: todo
- ADR: docs/adr/0017-demo-scope-with-wrapped-token.md
- Depends on: T-016, T-017
- Goal: A short video that shows the core functions, Arc Studio, and use of Circle tools.
- Acceptance criteria:
  - [ ] The video shows the ADR 0007 demo steps, the Arc Studio project, and the architecture diagram.
  - [ ] The video meets the event's length limit (check the submission form).
  - [ ] The video link is added to the README.
- Notes:
- Result:

### T-019: Submit to ETHGlobal Mumbai
- Owner: laptop
- Status: todo
- ADR: docs/adr/0017-demo-scope-with-wrapped-token.md
- Depends on: T-001, T-018
- Goal: Make a complete submission for the chosen Arc track or tracks.
- Acceptance criteria:
  - [ ] The submission states the track by name, and includes the Studio URL, repo link, video and diagram.
  - [ ] Repo access matches the T-001 decision.
  - [ ] The Result has the submission link and a screenshot path.
- Notes:
- Result:

### T-022: Spike: mock provider token on Sepolia, lock-and-mint to Arc via the ownerless path (ADR 0012)
- Owner: laptop
- Status: todo
- ADR: docs/adr/0012-provider-token-lock-and-wrap.md
- Depends on: T-002
- Goal: Prove that a mock provider token `mNVDA` on Sepolia can be registered as an ownerless LOCK_UNLOCK token and wrapped as `wNVDA` on Arc testnet.
- Acceptance criteria:
  - [ ] `mNVDA` is deployed on Sepolia (clearly named as a mock).
  - [ ] `registerOwnerlessToken` succeeds with LOCK_UNLOCK (raw contract calls are fine for setup; the transfer itself goes through Bridge Kit); the Iris quote is fetched; `deployRemoteOwnerlessToken` succeeds on Arc.
  - [ ] `mNVDA` uses the same decimals as Ondo's real tokens (18); `wNVDA` decimals are recorded.
  - [ ] The mock name and symbol are chosen knowing the Arc wrapper copies them from the home token. Record what the wrapper shows on Arc.
  - [ ] Wallets are funded (Sepolia ETH, Arc USDC for gas) and the faucet sources are recorded in the Result.
  - [ ] A lock-and-mint transfer works; locked amount on Sepolia equals `wNVDA` supply on Arc. `rateLimit`, `maxTransferAmount` and the operator are read on both managers and recorded (ownerless managers have no operator and, per Circle, no rate limit by default, so there is nothing to set; see the ADR 0012 amendment).
  - [ ] Result lists tx hashes, addresses, the token id, and any revert or doc discrepancy.
- Notes: Replaces T-005. Record whether anyone can register a token they do not control. Circle says ownerless is for tokens without an issuer and we control mNVDA; the README must explain that the mock stands in for a provider token we do not control.
- Result:

### T-023: Research: can real provider tokens be locked and wrapped? (ADR 0012, ADR 0016)
- Owner: alle
- Status: todo
- ADR: docs/adr/0012-provider-token-lock-and-wrap.md, docs/adr/0016-compliance-provider-tokens.md
- Depends on: none
- Goal: For Ondo and xStocks tokens, record what restricts holding or transferring them and whether a lock manager contract could hold them.
- Acceptance criteria:
  - [ ] For each provider: chain, token address, allowlist or transfer hooks, rebasing or fee-on-transfer behaviour, redemption terms. Read-only, from primary sources fetched that day.
  - [ ] A clear yes, no or unknown on "can a contract we do not control hold it".
  - [ ] Unverified items listed.
- Result:

### T-024: Spike: Bridge Kit transfer of wNVDA by token id, both directions, with measured timing (ADR 0013)
- Owner: laptop
- Status: todo
- ADR: docs/adr/0013-wrapped-token-bridging-path.md
- Depends on: T-022
- Goal: Prove the user bridge path and measure it.
- Acceptance criteria:
  - [ ] Bridge Kit (required, no raw-contract fallback) moves `wNVDA` Arc → Sepolia (unlock) and `mNVDA` Sepolia → Arc (mint). If it rejects the token, report the evidence as a blocker.
  - [ ] Elapsed time of each leg is recorded, and whether Fast Transfer exists for this token. Expect Standard speed (about 15 to 19 min) from Sepolia: Circle rejects Fast quotes for tokens without an FX symbol (`FX_SYMBOL_NOT_CONFIGURED`). Confirm or refute with a real quote.
  - [ ] The zero-address versus `TokenNotRegistered` discrepancy is confirmed or not.
  - [ ] Bridge Kit imports and runs in a browser bundle (Vite or Next), the check T-006 used to do. Result says which bundler.
  - [ ] Gas is in place on both chains first (Sepolia ETH, Arc USDC; see T-022).
- Notes: Replaces T-006. No fallback: the user decided on 2026-11-06 not to fall back to raw calls or a custom token. If Bridge Kit cannot complete an ownerless transfer, stop and report the evidence to the user as a blocker.
- Result:

### T-025: Spike: NVDA price source (Ondo API first), access and behaviour by market session (ADR 0015)
- Owner: alle
- Status: parked
- ADR: docs/adr/0015-price-parity-and-off-hours-policy.md
- Depends on: none
- Goal: Confirm the Ondo API as the demo's price source for NVDAon and learn what it publishes in each session.
- Acceptance criteria:
  - [ ] Ondo API key obtained (user emails onboarding@ondo.finance; the key is added through the gateway link, never in chat). Without it, mark the Ondo checks "not observed" and use demo mode with a labelled fallback price.
  - [ ] `GET /v1/assets/NVDAon/prices/latest`, `/v1/assets/NVDAon/market`, `/v1/status/market`, `/v1/status/assets` and `/v1/limits/sessions` (check exact path in the docs) read with real payloads: price fields, `marketStatus`, `tradableSessions`, `sharesMultiplier`, off-hours `isOpen` and limits for NVDAon.
  - [ ] Whether NVDAon is on the 24/7 mint and redeem list (the June 25, 2026 announcement lists NVDAon) and what the weekend and overnight prices look like.
  - [ ] The "display only" limit is read against the Soft Attestation Quote API docs, and the decision recorded: relay the display price with spread, or use quotes.
  - [ ] Cross-check source: Pyth Pro and Stork NVDA feeds (ids, key needs, testnet availability), and RedStone and Chronicle coverage.
  - [ ] Recommendation, or the fallback relayer if no key is available.
- Notes: Replaces T-007. Ondo's docs say prices are display only and that an official oracle is in development; Chainlink feeds exist on Ethereum for SPYon, QQQon, TSLAon (Feb 11, 2026), nothing found for Arc.
- Result:

### T-026: Build PriceOracle with guards, and the relayer (ADR 0015)
- Owner: laptop
- Status: parked
- ADR: docs/adr/0015-price-parity-and-off-hours-policy.md
- Depends on: T-025, T-032
- Goal: An oracle contract on Arc with the guards in ADR 0015, fed by the chosen source.
- Acceptance criteria:
  - [ ] Stores price, confidence, publish time and session. Rejects price ≤ 0, wide confidence, non-increasing publish time, and moves above the deviation cap unless `acceptGap` is used.
  - [ ] The relayer (or verified feed) updates it on a schedule; heartbeat visible.
  - [ ] Foundry tests cover each guard.
- Notes: Replaces T-009.
- Result:

### T-027: Build InventoryMarket (ADR 0014)
- Owner: laptop
- Status: parked
- ADR: docs/adr/0014-trading-against-pre-positioned-inventory.md
- Depends on: T-026
- Goal: Buy and sell `wNVDA` for USDC at oracle price ± spread from held inventory, with the caps and session rules from ADR 0015.
- Acceptance criteria:
  - [ ] Parameters: `maxAge`, per-session `spreadBps`, `maxTradeUsdc`, `maxExposureUsdc`, `minInventory`, `offHoursTrading`, pause.
  - [ ] Reverts cleanly on stale price, closed session, short inventory, failed USDC transfer.
  - [ ] Tests cover the 6 versus 18 decimal rounding.
  - [ ] Built in Arc Studio per ADR 0006.
- Notes: Replaces T-010.
- Result:

### T-028: Pre-position wNVDA inventory and document refills
- Owner: laptop
- Status: parked
- ADR: docs/adr/0014-trading-against-pre-positioned-inventory.md
- Depends on: T-024, T-027
- Goal: Seed the market with `wNVDA` and USDC before the demo, and write how to refill.
- Acceptance criteria:
  - [ ] A script bridges `mNVDA` Sepolia → Arc and funds the market.
  - [ ] Inventory and elapsed bridge time are logged in the Result.
  - [ ] A short refill note exists in the README draft.
- Result:

### T-029: Parity tests and scenarios (ADR 0015)
- Owner: laptop
- Status: parked
- ADR: docs/adr/0015-price-parity-and-off-hours-policy.md
- Depends on: T-027
- Goal: Show the controls work with tests, not claims.
- Acceptance criteria:
  - [ ] Foundry tests: stale price, session change, gap at the open, one-way flow draining inventory, stale-price arbitrage bounded by spread and caps.
  - [ ] A table in the Result lists each scenario and the worst-case loss per trade.
- Result:

### T-030: Parity panel in the UI (ADR 0015)
- Owner: laptop
- Status: parked
- ADR: docs/adr/0015-price-parity-and-off-hours-policy.md
- Depends on: T-011
- Goal: Show oracle price, session, age, spread, inventory, and locked versus wrapped supply.
- Acceptance criteria:
  - [ ] The off-hours banner shows when the market is closed.
  - [ ] A warning appears when locked < wrapped supply or the oracle is older than `maxAge`.
- Result:

### T-032: Review spikes and accept or supersede ADRs 0008, 0012 to 0017
- Owner: alle
- Status: todo
- ADR: docs/adr/0012-provider-token-lock-and-wrap.md, docs/adr/0013-wrapped-token-bridging-path.md, docs/adr/0014-trading-against-pre-positioned-inventory.md, docs/adr/0015-price-parity-and-off-hours-policy.md, docs/adr/0016-compliance-provider-tokens.md, docs/adr/0017-demo-scope-with-wrapped-token.md, docs/adr/0008-frontend-stack-and-wallet.md
- Depends on: T-003, T-022, T-023, T-024
- Goal: Turn the remaining proposed ADRs into accepted ones, or supersede them, so the build tasks have rules to follow.
- Acceptance criteria:
  - [ ] Phase 1 scope: ADRs 0008, 0016 and 0017 are `accepted` or replaced by a new ADR linking the spike Result it is based on. ADRs 0012 and 0013 were accepted on 2026-11-06; check them against the T-022 and T-024 Results and amend if needed.
  - [ ] Phase 2 (after the parked tasks start): the off-hours demo mode decision from T-001 is in ADR 0015, and ADRs 0014 and 0015 are accepted or replaced.
  - [ ] `docs/adr/README.md` is updated.
- Notes: Replaces T-008. ADRs 0014 and 0015 are reviewed after phase 2 starts (price parity and oracle are parked). Re-fetch fast-moving facts on the day.
- Result:

### T-033: Build the bridge layer module with unit tests
- Owner: laptop
- Status: todo
- ADR: docs/adr/0013-wrapped-token-bridging-path.md, docs/adr/0003-usdc-bridge-in-with-forwarding.md
- Depends on: T-022, T-024, T-004
- Goal: One typed TypeScript module (`packages/bridge`) that the UI and scripts call for every bridge action, with no UI code in it.
- Acceptance criteria:
  - [ ] API: `quote`, `send`, `status`, `resume` for (a) USDC Sepolia → Arc with Forwarding, (b) wNVDA Arc → Sepolia, (c) mNVDA Sepolia → Arc. Chain and token config in one place (token id, addresses, decimals).
  - [ ] Bridge Kit is the only transfer path (ADR 0013). Raw `CrossChainTokenService` calls are not part of the module.
  - [ ] A pure state machine with PENDING, SENT, CONFIRMED, COMPLETE, FAILED. Persistence and resume are T-036.
  - [ ] Typed errors for the known failures: `TokenNotRegistered` (`0x5d0028cf`), unsupported route, quote rejected (`FX_SYMBOL_NOT_CONFIGURED`; the module requests Standard explicitly), insufficient gas on the source chain, user rejection.
  - [ ] Unit tests with a mocked kit and mocked RPC (no network): each state transition, each error, amount and decimals handling. Tests run with one command and in CI.
- Notes: `resume` only has its signature here; the storage and behaviour are T-036. Keep it independent of the oracle and market. Do not hardcode secrets.
- Result:

### T-034: Contract tests for the mock token and lock-and-mint accounting
- Owner: laptop
- Status: todo
- ADR: docs/adr/0012-provider-token-lock-and-wrap.md
- Depends on: T-022
- Goal: Foundry tests that prove the fixture and the accounting rule: locked mNVDA on Sepolia is at least the wNVDA supply on Arc (equal when nothing is in flight).
- Acceptance criteria:
  - [ ] `MockProviderToken` (mNVDA) is clearly named as a mock and has a faucet or mint for testnet use only.
  - [ ] Tests for transfers, decimals and the lock-and-unlock round trip, using a local stand-in for the manager if the real service cannot run locally.
  - [ ] A script `check-supply` reads both chains and fails if locked mNVDA is less than the total wNVDA supply across every deployment. It tolerates in-flight transfers (retry or report pending) and does not fail when extra mNVDA was sent straight to the manager (that only raises locked).
  - [ ] Deploy and registration scripts are re-runnable and print addresses and the token id.
- Result:

### T-035: Testnet integration tests for the bridge layer
- Owner: laptop
- Status: todo
- ADR: docs/adr/0013-wrapped-token-bridging-path.md
- Depends on: T-033, T-034, T-036
- Goal: Prove the bridge layer on real testnets and record timings.
- Acceptance criteria:
  - [ ] Opt-in test command (`test:integration`) with funded testnet wallets from env, never committed. Skipped by default.
  - [ ] Round trip: USDC in; mNVDA Sepolia → Arc; wNVDA Arc → Sepolia. After each leg, balances match and `check-supply` passes.
  - [ ] Failure cases against the real contracts: unregistered token, unsupported route, too little gas.
  - [ ] Resume test: kill the process mid-transfer and complete it.
  - [ ] Timings per leg are in the Result, and whether Fast Transfer exists for this token.
- Result:

### T-036: Bridge layer persistence and resume
- Owner: laptop
- Status: todo
- ADR: docs/adr/0013-wrapped-token-bridging-path.md
- Depends on: T-033
- Goal: Persist transfer state so a page reload or process restart resumes an in-flight transfer.
- Acceptance criteria:
  - [ ] A storage interface in `packages/bridge` with a file or localStorage implementation; the state machine from T-033 writes every transition.
  - [ ] `resume` completes a transfer after a restart, using only the stored record.
  - [ ] Unit tests with a mocked kit: crash after SENT, crash after CONFIRMED, duplicate resume is safe.
- Notes: Split out of T-033 so each fits one session.
- Result:

### T-020: (post-MVP) Spike: indexer options on Arc testnet and Sepolia
- Owner: alle
- Status: todo
- ADR: docs/adr/0011-indexer-post-mvp.md
- Depends on: T-019
- Goal: POST-MVP. Find out which listed indexers (Alchemy, Envio, Goldsky, The Graph) support Arc testnet, and settle ADR 0011.
- Acceptance criteria:
  - [ ] Arc testnet support is confirmed or ruled out for each provider, with source URL and fetch date.
  - [ ] CCTS sent and received event signatures are taken from the contract reference or the ABI.
  - [ ] ADR 0011 is accepted, or superseded by a new ADR.
- Notes: Post-MVP. Do not start before T-019 is done.
- Result:

### T-021: (post-MVP) Build indexer and holdings/history view
- Owner: laptop
- Status: todo
- ADR: docs/adr/0011-indexer-post-mvp.md (must be accepted)
- Depends on: T-020
- Goal: POST-MVP. Users see holdings across chains, trade history and bridge history, and these survive page reloads.
- Acceptance criteria:
  - [ ] The indexer ingests `Bought`, `Sold`, wNVDA `Transfer` on both chains, and CCTS transfer events.
  - [ ] The UI has a holdings and history page that matches onchain state for a test wallet. The comparison is in Result.
  - [ ] Native USDC and ERC-20 USDC events are not double counted.
- Notes: Post-MVP.
- Result:
