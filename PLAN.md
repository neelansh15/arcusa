# arcusa - Plan

Working name: arc + USA. Living doc; iterate here.

## Goal
A stock terminal settled on Arc: US-stock exposure for non-US users, funded with USDC, bridged in via Circle tools, settled on Arc. Built to be demoable at ETHGlobal Mumbai and useful afterwards.

## Facts (verified Nov 5-6, 2026)
- Bridge Kit / App Kit: `kit.bridge()`, Arc testnet = `Arc_Testnet` (CCTP domain 26).
- Forwarding Service: `to: { chain: "Arc_Testnet", useForwarder: true }`, fee ~$0.05-0.20 USDC, `feePayment: "source"`. One-click bridge-in, no Arc gas. (Nov 6: the fee docs say $0.05 for non-HyperCore destinations such as Arc; see ADR 0003.)
- Non-USDC bridging is live (Circle announcement ~Oct 30 - Nov 2): Arc's supported-tokens page lists USDC, EURC, WETH, cirBTC and third-party assets registered with CCTPx. Non-USDC goes via `CrossChainTokenService` + per-token manager (not TokenMessengerV2). Issuers deploy a new crosschain token or connect an existing ERC-20 via custom token config.
- Oracles on Arc: Chainlink, Pyth, Redstone, Stork. Stablecoin FX (USDC/EURC) available.
- No Ondo/xStocks tokens found registered on Arc yet.
- (Nov 6, Circle docs fetched live) CCTP for non-USDC is **permissionless on testnet**: register your own ERC-20 with `registerCustomToken`, no config fee on testnet (check mainnet fees). Four paths: transfer pre-configured token (EURC, cirBTC, WETH), custom token, ownerless token, native crosschain token (CREATE3).
- Arc Testnet is supported (domain 26). `CrossChainTokenService`: testnets (incl. Arc) `0x63753E722bd2C2A5DF6EE19C5106662208B81077`, mainnet `0x431871229103b780868f8C6BB820cd16ECf942BC`. Per-token manager via `resolveTokenManager()`. Addresses are from the docs; not checked onchain.
- Non-USDC fees are paid in native gas (USDC on Arc), not deducted from the transfer. Forwarding fee is $0.05 for most destinations; $0.20-1.20 tiers are HyperCore routes.
- Gotchas: same deployer + salt on every chain or the link breaks silently; grant each TokenManager the minter role; rate limit defaults to 0 and blocks all transfers (custom tokens only; ownerless managers have no operator and no rate limit to set).

## Doc discrepancy to remember
Some Arc pages (Bridge page, provider README, `llms.txt`) still say "USDC and EURC only" while the supported-tokens page and Circle news say WETH, cirBTC and CCTPx third-party assets. Docs lag the product. Always re-check fresh before relying on either.

Nov 6 update: more doc discrepancies were found while writing the ADRs. Examples: `maxTransferAmount = 0` is described as "no cap" in the quickstarts but as "blocks all transfers" in the rate-limits how-to. `resolveTokenAddress` reverts for an unknown token onchain, while the quickstart polls it expecting a zero address. Arc's oracle page lists Pyth, but only Pyth Pro is deployed on Arc testnet. Each ADR has a "Not verified" section that lists them, and spikes in TASKS.md check them.

> Revised 2026-11-06: the "Hackathon testnet" bullet below (own test token) is superseded. See "Asset model" further down.

## Key design question: where does backing live?
- **Real stocks**: someone must custody the real share (or hold the issuer's token) and the token must be redeemable. Burn-and-mint (CCTP) moves the token's *supply* across chains; the backing sits with the issuer, not in a bridge lock. Options: (a) issuer registers its token with CCTPx (Ondo/xStocks would do this), (b) lock-and-mint wrapper: lock the origin-chain stock token in a vault, mint a wrapper on Arc, (c) CCIP.
- **Hackathon testnet**: no real backing exists either way. We can deploy a test ERC-20 (tAAPL) as issuer and show real burn-and-mint movement; price comes from an oracle. Value is illustrative only.

## Open questions
1. ~~CrossChainTokenService on Arc testnet? Permissionless?~~ Yes on both per docs (Nov 6). Still unproven end to end on Arc testnet: quickstarts use Sepolia + Base Sepolia.
   - Nov 6: contract code checked onchain on Arc testnet and Sepolia. Arc trusts domain 0 (Sepolia), and Sepolia trusts domain 26 (Arc). A real transfer of our token is still to be proven in spike T-006. See [ADR 0001](docs/adr/0001-stock-token-bridging-path.md).
2. ~~Does Bridge Kit accept a custom token address?~~ Resolved Nov 6: Bridge Kit takes a bytes32 **token id**, not an address. The route exists only once the token is listed in Circle's Iris registry. Decision: [ADR 0001](docs/adr/0001-stock-token-bridging-path.md); proven by spike T-006.
3. ~~Does the Forwarding Service work for non-USDC transfers?~~ Resolved Nov 6: yes. The CCTPx path uses a forwarded request, and the Bridge Kit CCTPx provider always forwards. USDC bridge-in uses Forwarding as before. See [ADR 0001](docs/adr/0001-stock-token-bridging-path.md) and [ADR 0003](docs/adr/0003-usdc-bridge-in-with-forwarding.md).
4. Which issuers (Ondo, xStocks, others) plan to register on Arc, and when? Ask the Arc team. Still open. New open question: can a provider token be locked by a contract we do not control, given its allowlists? Spike T-023; see [ADR 0012](docs/adr/0012-provider-token-lock-and-wrap.md).
5. ~~Arc track requirements~~ Resolved Nov 6 from the event page: every Arc track requires Arc Studio as the starting point, a shareable Studio URL, a working frontend and backend, an architecture diagram, a video and a repo link. Track choice and demo scope: [ADR 0007](docs/adr/0007-track-targeting-and-demo-scope.md); Studio workflow: [ADR 0006](docs/adr/0006-arc-studio-workflow.md). Still open: whether judges accept a mock provider token (ask the Arc team). Demo scope is now [ADR 0017](docs/adr/0017-demo-scope-with-wrapped-token.md).
6. ~~Compliance angle for tokenized stocks~~ Resolved for the testnet demo Nov 6: [ADR 0016](docs/adr/0016-compliance-provider-tokens.md) (replaces ADR 0009). Production compliance is post-MVP.

## Asset model (revised 2026-11-06)
Demo stock: NVDA (Ondo NVDAon is on its 24/7 list); price from the Ondo API via our relayer once we have a key; off-hours demo mode approved 2026-11-06.

arcusa does not issue a token. Provider tokens (Ondo, xStocks and similar) are locked on their home chain through the CCTPx ownerless path and wrapped on Arc ([ADR 0012](docs/adr/0012-provider-token-lock-and-wrap.md)). The testnet demo uses a mock provider token `mNVDA` on Sepolia and its wrapped version `wNVDA` on Arc. Trades settle against pre-positioned `wNVDA` inventory at the oracle price ([ADR 0014](docs/adr/0014-trading-against-pre-positioned-inventory.md)). The bridge is shown as its own demo step ([ADR 0013](docs/adr/0013-wrapped-token-bridging-path.md), [ADR 0017](docs/adr/0017-demo-scope-with-wrapped-token.md)).

## Price parity
How the price is kept right, and what the demo does when the US market is closed (20:00-02:30 IST is the only regular session): [ADR 0015](docs/adr/0015-price-parity-and-off-hours-policy.md). Short version: oracle with staleness, deviation and confidence guards; session-based spreads and caps; trading paused when closed by default, with an off-hours demo mode (last price, wide spread, labelled indicative) if the user allows it (T-001); inventory caps; locked-versus-wrapped monitoring. Parity is bounded, not guaranteed.

## MVP
1. Fresh-wallet testnet bridge: Sepolia USDC -> Arc testnet with `useForwarder: true`.
2. Mock provider token `mNVDA` on Sepolia, registered ownerless (LOCK_UNLOCK); `wNVDA` deployed on Arc; rate limit and operator read and recorded (nothing to set).
3. Price oracle on Arc with guards and session awareness (Pyth Pro or Stork if access works, else a labelled relayer).
4. Terminal UI: balance, price, session status, buy and sell against USDC on Arc from inventory.
5. Bridge `wNVDA` Arc -> Sepolia with Bridge Kit as a visible step (required; no raw-call fallback, user decision 2026-11-06).

Nov 6: the MVP is broken into tasks in [TASKS.md](TASKS.md). The first plan (own token, ADR 0002) was superseded the same day by ADRs 0012 to 0017 after the user's decision not to issue a token.

## Stretch
CCIP route (Chainlink CCIP track), Stablecoin FX for EUR users, ENS names, Definitive Flash.

## Later (after the functional MVP)
- Indexer: let users see their holdings, trades and history. This is what turns the MVP into a proper stock terminal.

## Log
- 2026-11-05: repo created. Wiki detail: https://wiki.superd.app/doc/arc-bridge-kit-stock-terminal-settlement-SuAj6Az1IB
- 2026-11-06: checked Circle expanded-assets docs live. Custom tokens permissionless on testnet, Arc testnet supported. Plan switched from lock-and-mint wrapper to own-issuer burn-and-mint. Wiki subdoc updated.
- 2026-11-06: noted indexer (holdings, trades, history) as a post-MVP item.
- 2026-11-06: first ADRs 0001-0011 written ([docs/adr/README.md](docs/adr/README.md)), and task list T-001..T-021 added to [TASKS.md](TASKS.md). Open questions 2, 3, 5 and 6 resolved; Q4 and part of Q5 remain open.
- 2026-11-06: user decided arcusa issues no token: provider tokens are locked on their home chain and wrapped on Arc, with pre-positioned inventory and the bridge shown as a demo step. ADRs 0012 to 0017 supersede 0001, 0002, 0004, 0005, 0007 and 0009; new tasks T-022 to T-032; price parity policy in ADR 0015.
- 2026-11-06: demo stock set to NVDA; Ondo API is the first-choice price source ([ADR 0015](docs/adr/0015-price-parity-and-off-hours-policy.md), T-025); off-hours demo mode approved.
- 2026-11-06: priorities set by the user: build the bridge layer with tests first (T-033 to T-035); oracle, market and price parity are parked (T-025 to T-030) until phase 1 is done.
- 2026-11-06: ADRs 0012 and 0013 accepted. Review fixes applied (T-022 rate limit, no fallback in T-033/T-013, T-002 layout, T-036 split, T-032 scope). The user ruled out any fallback if Bridge Kit cannot complete an ownerless transfer; T-024 reports a blocker instead.
