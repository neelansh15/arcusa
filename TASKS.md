# Tasks

Shared task list between **alle** (primary agent) and **laptop** (Claude Code on the user's laptop). See `CLAUDE.md` for the rules.

Statuses: `todo`, `doing`, `blocked`, `done`, `superseded`. Owners: `alle`, `laptop`.
One block per task, newest at the bottom. Do not reuse IDs.

## Template

```
### T-000: Short imperative title
- Owner: alle | laptop
- Status: todo | doing | blocked | done | superseded
- ADR: docs/adr/NNNN-... (optional)
- Depends on: T-xxx (optional)
- Goal: one or two sentences.
- Acceptance criteria:
  - [ ] verifiable item
  - [ ] verifiable item
- Notes: questions, blockers, context.
- Result: (filled when done) what changed, links, how to reproduce, what was NOT verified.
```

## Critical path to the MVP (revised 2026-11-06)

1. T-002 Repo skeleton
2. T-003 Arc Studio app
3. T-022 Mock provider token, lock-and-mint on Arc (spike)
4. T-024 Bridge Kit for wAAPL, both directions, timings (spike)
5. T-032 ADR review
6. T-026 PriceOracle with guards, and relayer
7. T-027 InventoryMarket
8. T-028 Seed inventory
9. T-011 Terminal UI
10. T-013 Bridge wAAPL in the UI
11. T-014 End-to-end run
12. T-016 README and diagram
13. T-018 Demo video
14. T-019 Submission

These run in parallel and feed into the path:
- T-001: user decisions (now includes the off-hours demo mode); needed by T-019 and T-032.
- T-004: USDC bridge-in spike; needed by T-012.
- T-023: real provider token research (alle); needed by T-032.
- T-025: oracle and market-session spike (alle); needed by T-026.
- T-029: parity tests; needed by T-014.
- T-030: parity panel in the UI; needed by T-014.
- T-012: USDC bridge-in in the UI; needed by T-014.
- T-015: draft architecture diagram; needed by T-016.
- T-017: fact re-check; needed by T-018.

Superseded on 2026-11-06: T-005, T-006, T-007, T-008, T-009, T-010 (replaced by T-022, T-024, T-025, T-032, T-026, T-027). Tasks T-001 and T-011 to T-019 now say `wAAPL` where they said `tAAPL`; read them with ADRs 0012 to 0017.

Post-MVP: T-020 and T-021. Do not start these before T-019 is done.

Spikes check items that are not verified in proposed ADRs. A spike may use a proposed ADR as its hypothesis. Build tasks wait for the ADR to be accepted (T-032).

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
  - [ ] Off-hours trading for the demo is decided: `offHoursTrading` on with a wider spread, or trading paused while the US market is closed.
  - [ ] It is confirmed who owns the Arc Studio account and who logs in on the laptop.
  - [ ] The submission deadline and judging time are recorded.
  - [ ] All answers are recorded in the PLAN.md Log with a date.
- Notes: US regular hours are 20:00-02:30 IST after the US DST change, so daytime judging will probably fall when the market is closed.
- Result:
- Added 2026-11-06: ask the user whether demo mode (trade off-hours at the last price with a wide spread, ADR 0015) is allowed, and whether the real provider tokens claim stays in the pitch if T-023 says no.

### T-002: Create repo skeleton per ADR 0010
- Owner: laptop
- Status: todo
- ADR: docs/adr/0010-repo-structure.md
- Depends on: none
- Goal: Create the folder layout, `.gitignore` and `.env.example` so later tasks have fixed paths.
- Acceptance criteria:
  - [ ] Folders exist: `app/`, `contracts/arc/`, `contracts/scripts/`, `services/oracle-relayer/`, `docs/architecture/`, `docs/demo/`, `deployments/`. Use a `.gitkeep` where a folder is empty.
  - [ ] `.gitignore` covers `.env*` except `.env.example`, `node_modules`, Foundry `out/` and `cache/`, and local Arc Studio CLI state.
  - [ ] `.env.example` lists variable names only, for example `DEPLOYER_PRIVATE_KEY`, `RELAYER_PRIVATE_KEY`, `ARC_TESTNET_RPC_URL`, `SEPOLIA_RPC_URL`, `IRIS_API_URL`. No values.
  - [ ] Arc Foundry is installed (`arc-forge --version` output pasted in Result). See https://docs.arc.io/arc/tutorials/install-arc-foundry.md.
  - [ ] `git grep -nE '0x[0-9a-fA-F]{64}'` shows no private keys.
- Notes:
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
  - [ ] A Studio app is created with a first prompt (Plan mode) that describes arcusa: a terminal UI on Arc testnet, USDC settlement, an oracle-priced market, and Bridge Kit for tAAPL. The app ID and the shareable project URL are recorded in Result.
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
- Goal: A user connects a wallet and trades wAAPL against USDC on Arc from the terminal UI.
- Acceptance criteria:
  - [ ] Wallet connect works for Arc testnet (5042002) and Ethereum Sepolia.
  - [ ] The UI shows the AAPL price, the age of the price, and market open or closed.
  - [ ] The UI shows USDC and wAAPL balances on Arc and Sepolia.
  - [ ] Buy and sell work from the UI on Arc testnet, with a tx link shown.
  - [ ] Every screen shows the testnet disclaimer from ADR 0009.
  - [ ] The UI changes are made through Studio or synced back to it. The Result notes which.
- Notes:
- Result:

### T-012: Add USDC bridge-in flow to the UI
- Owner: laptop
- Status: todo
- ADR: docs/adr/0003-usdc-bridge-in-with-forwarding.md
- Depends on: T-004, T-011
- Goal: A user with USDC on Sepolia funds their Arc account from the terminal in one flow.
- Acceptance criteria:
  - [ ] The "Deposit USDC" flow runs Bridge Kit with Forwarding from Sepolia to Arc and shows progress until COMPLETE.
  - [ ] The fee is shown before the user confirms.
  - [ ] A page reload mid-transfer does not lose the transfer status.
- Notes:
- Result:

### T-013: Add wAAPL bridge flow to the UI
- Owner: laptop
- Status: todo
- ADR: docs/adr/0013-wrapped-token-bridging-path.md (must be accepted)
- Depends on: T-024, T-011
- Goal: A user moves wAAPL from Arc to Sepolia, and back, from the terminal with Bridge Kit, or the fallback from ADR 0001.
- Acceptance criteria:
  - [ ] The "Send wAAPL to Sepolia" and "Bring wAAPL to Arc" flows work. The UI shows the states PENDING, SENT, CONFIRMED, COMPLETE and FAILED.
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
  - [ ] Starting from a fresh wallet, complete ADR 0007 MVP steps 1-4: deposit USDC, view price, buy wAAPL, bridge wAAPL to Sepolia.
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
    - the market contract, PriceOracle and relayer with Pyth Hermes;
    - wAAPL and its TokenManagers on both chains;
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
- Depends on: T-003
- Goal: Prove that a mock provider token `mAAPL` on Sepolia can be registered as an ownerless LOCK_UNLOCK token and wrapped as `wAAPL` on Arc testnet.
- Acceptance criteria:
  - [ ] `mAAPL` is deployed on Sepolia (clearly named as a mock).
  - [ ] `registerOwnerlessToken` succeeds with LOCK_UNLOCK; the Iris quote is fetched; `deployRemoteOwnerlessToken` succeeds on Arc.
  - [ ] Remote rate limit is set above 0 and a transfer lock-and-mint works; locked amount on Sepolia equals `wAAPL` supply on Arc.
  - [ ] Result lists tx hashes, addresses, the token id, and any revert or doc discrepancy.
- Notes: Replaces T-005. Record whether anyone can register a token they do not control.
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

### T-024: Spike: Bridge Kit transfer of wAAPL by token id, both directions, with measured timing (ADR 0013)
- Owner: laptop
- Status: todo
- ADR: docs/adr/0013-wrapped-token-bridging-path.md
- Depends on: T-022
- Goal: Prove the user bridge path and measure it.
- Acceptance criteria:
  - [ ] Bridge Kit moves `wAAPL` Arc → Sepolia (unlock) and `mAAPL` Sepolia → Arc (mint), or the raw-contract fallback is proven.
  - [ ] Elapsed time of each leg is recorded, and whether Fast Transfer exists for this token.
  - [ ] The zero-address versus `TokenNotRegistered` discrepancy is confirmed or not.
- Notes: Replaces T-006.
- Result:

### T-025: Spike: AAPL oracle, access terms and behaviour by market session (ADR 0015)
- Owner: alle
- Status: todo
- ADR: docs/adr/0015-price-parity-and-off-hours-policy.md
- Depends on: none
- Goal: Pick the oracle source and learn what it publishes in each session.
- Acceptance criteria:
  - [ ] Pyth Pro (id 922) and Stork `AAPL_24_5`: key or token needs, testnet availability, whether session and confidence are readable onchain.
  - [ ] What each feed returns pre-market, post-market, overnight, weekend. Use real payloads if a key is available; otherwise say not observed.
  - [ ] RedStone and Chronicle equity coverage checked.
  - [ ] A recommendation, or the fallback relayer if no key is available.
- Notes: Replaces T-007. Needs a key from the user if the vendors require one.
- Result:

### T-026: Build PriceOracle with guards, and the relayer (ADR 0015)
- Owner: laptop
- Status: todo
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
- Status: todo
- ADR: docs/adr/0014-trading-against-pre-positioned-inventory.md
- Depends on: T-026
- Goal: Buy and sell `wAAPL` for USDC at oracle price ± spread from held inventory, with the caps and session rules from ADR 0015.
- Acceptance criteria:
  - [ ] Parameters: `maxAge`, per-session `spreadBps`, `maxTradeUsdc`, `maxExposureUsdc`, `minInventory`, `offHoursTrading`, pause.
  - [ ] Reverts cleanly on stale price, closed session, short inventory, failed USDC transfer.
  - [ ] Tests cover the 6 versus 18 decimal rounding.
  - [ ] Built in Arc Studio per ADR 0006.
- Notes: Replaces T-010.
- Result:

### T-028: Pre-position wAAPL inventory and document refills
- Owner: laptop
- Status: todo
- ADR: docs/adr/0014-trading-against-pre-positioned-inventory.md
- Depends on: T-024, T-027
- Goal: Seed the market with `wAAPL` and USDC before the demo, and write how to refill.
- Acceptance criteria:
  - [ ] A script bridges `mAAPL` Sepolia → Arc and funds the market.
  - [ ] Inventory and elapsed bridge time are logged in the Result.
  - [ ] A short refill note exists in the README draft.
- Result:

### T-029: Parity tests and scenarios (ADR 0015)
- Owner: laptop
- Status: todo
- ADR: docs/adr/0015-price-parity-and-off-hours-policy.md
- Depends on: T-027
- Goal: Show the controls work with tests, not claims.
- Acceptance criteria:
  - [ ] Foundry tests: stale price, session change, gap at the open, one-way flow draining inventory, stale-price arbitrage bounded by spread and caps.
  - [ ] A table in the Result lists each scenario and the worst-case loss per trade.
- Result:

### T-030: Parity panel in the UI (ADR 0015)
- Owner: laptop
- Status: todo
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
- Depends on: T-001, T-003, T-022, T-023, T-024, T-025
- Goal: Turn the proposed ADRs into accepted ones, or supersede them, so the build tasks have rules to follow.
- Acceptance criteria:
  - [ ] Each ADR is `accepted`, or replaced by a new ADR linking the spike Result it is based on.
  - [ ] The off-hours demo mode decision from T-001 is in ADR 0015.
  - [ ] `docs/adr/README.md` is updated.
- Notes: Replaces T-008. Re-fetch fast-moving facts on the day.
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
  - [ ] The indexer ingests `Bought`, `Sold`, tAAPL `Transfer` on both chains, and CCTS transfer events.
  - [ ] The UI has a holdings and history page that matches onchain state for a test wallet. The comparison is in Result.
  - [ ] Native USDC and ERC-20 USDC events are not double counted.
- Notes: Post-MVP.
- Result:
