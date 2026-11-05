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
- Gotchas: same deployer + salt on every chain or the link breaks silently; grant each TokenManager the minter role; rate limit defaults to 0 and blocks all transfers.

## Doc discrepancy to remember
Some Arc pages (Bridge page, provider README, `llms.txt`) still say "USDC and EURC only" while the supported-tokens page and Circle news say WETH, cirBTC and CCTPx third-party assets. Docs lag the product. Always re-check fresh before relying on either.

Nov 6 update: more doc discrepancies were found while writing the ADRs. Examples: `maxTransferAmount = 0` is described as "no cap" in the quickstarts but as "blocks all transfers" in the rate-limits how-to. `resolveTokenAddress` reverts for an unknown token onchain, while the quickstart polls it expecting a zero address. Arc's oracle page lists Pyth, but only Pyth Pro is deployed on Arc testnet. Each ADR has a "Not verified" section that lists them, and spikes in TASKS.md check them.

## Key design question: where does backing live?
- **Real stocks**: someone must custody the real share (or hold the issuer's token) and the token must be redeemable. Burn-and-mint (CCTP) moves the token's *supply* across chains; the backing sits with the issuer, not in a bridge lock. Options: (a) issuer registers its token with CCTPx (Ondo/xStocks would do this), (b) lock-and-mint wrapper: lock the origin-chain stock token in a vault, mint a wrapper on Arc, (c) CCIP.
- **Hackathon testnet**: no real backing exists either way. We can deploy a test ERC-20 (tAAPL) as issuer and show real burn-and-mint movement; price comes from an oracle. Value is illustrative only.

## Open questions
1. ~~CrossChainTokenService on Arc testnet? Permissionless?~~ Yes on both per docs (Nov 6). Still unproven end to end on Arc testnet: quickstarts use Sepolia + Base Sepolia.
   - Nov 6: contract code checked onchain on Arc testnet and Sepolia. Arc trusts domain 0 (Sepolia), and Sepolia trusts domain 26 (Arc). A real transfer of our token is still to be proven in spike T-006. See [ADR 0001](docs/adr/0001-stock-token-bridging-path.md).
2. ~~Does Bridge Kit accept a custom token address?~~ Resolved Nov 6: Bridge Kit takes a bytes32 **token id**, not an address. The route exists only once the token is listed in Circle's Iris registry. Decision: [ADR 0001](docs/adr/0001-stock-token-bridging-path.md); proven by spike T-006.
3. ~~Does the Forwarding Service work for non-USDC transfers?~~ Resolved Nov 6: yes. The CCTPx path uses a forwarded request, and the Bridge Kit CCTPx provider always forwards. USDC bridge-in uses Forwarding as before. See [ADR 0001](docs/adr/0001-stock-token-bridging-path.md) and [ADR 0003](docs/adr/0003-usdc-bridge-in-with-forwarding.md).
4. Which issuers (Ondo, xStocks, others) plan to register on Arc, and when? Ask the Arc team. Still open. For the hackathon we issue our own synthetic token ([ADR 0002](docs/adr/0002-stock-token-model-and-issuer.md)).
5. ~~Arc track requirements~~ Resolved Nov 6 from the event page: every Arc track requires Arc Studio as the starting point, a shareable Studio URL, a working frontend and backend, an architecture diagram, a video and a repo link. Track choice and demo scope: [ADR 0007](docs/adr/0007-track-targeting-and-demo-scope.md); Studio workflow: [ADR 0006](docs/adr/0006-arc-studio-workflow.md). Still open: whether judges accept a self-issued test token (ask the Arc team).
6. ~~Compliance angle for tokenized stocks~~ Resolved for the testnet demo Nov 6: [ADR 0009](docs/adr/0009-compliance-stance-testnet-demo.md). Production compliance is post-MVP.

## MVP
1. Fresh-wallet testnet bridge: Sepolia USDC -> Arc testnet with `useForwarder: true`.
2. Deploy test stock token(s) (tAAPL) on Sepolia and Arc testnet; `registerCustomToken` on both with the same deployer + salt, grant minter role to each TokenManager, set non-zero rate limit.
3. Price feed on Arc (Pyth/Chainlink/Stork).
4. Terminal UI: balance, price, buy/sell against USDC on Arc.
5. Bridge a stock token across via CrossChainTokenService (burn-and-mint). Real mechanism, so no lock-and-mint wrapper needed. Fall back to raw contract calls if Bridge Kit rejects custom tokens (open question 2).

Nov 6: the MVP is broken into tasks in [TASKS.md](TASKS.md). ADR 0002 proposes a native crosschain token (`deployCrossChainToken`) instead of `registerCustomToken` for step 2. Spike T-005 confirms or overturns it.

## Stretch
CCIP route (Chainlink CCIP track), Stablecoin FX for EUR users, ENS names, Definitive Flash.

## Later (after the functional MVP)
- Indexer: let users see their holdings, trades and history. This is what turns the MVP into a proper stock terminal.

## Log
- 2026-11-05: repo created. Wiki detail: https://wiki.superd.app/doc/arc-bridge-kit-stock-terminal-settlement-SuAj6Az1IB
- 2026-11-06: checked Circle expanded-assets docs live. Custom tokens permissionless on testnet, Arc testnet supported. Plan switched from lock-and-mint wrapper to own-issuer burn-and-mint. Wiki subdoc updated.
- 2026-11-06: noted indexer (holdings, trades, history) as a post-MVP item.
- 2026-11-06: first ADRs 0001-0011 written ([docs/adr/README.md](docs/adr/README.md)), and task list T-001..T-021 added to [TASKS.md](TASKS.md). Open questions 2, 3, 5 and 6 resolved; Q4 and part of Q5 remain open.
