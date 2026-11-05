# arcusa - Plan

Working name: arc + USA. Living doc; iterate here.

## Goal
A stock terminal settled on Arc: US-stock exposure for non-US users, funded with USDC, bridged in via Circle tools, settled on Arc. Built to be demoable at ETHGlobal Mumbai and useful afterwards.

## Facts (verified Nov 5, 2026)
- Bridge Kit / App Kit: `kit.bridge()`, Arc testnet = `Arc_Testnet` (CCTP domain 26).
- Forwarding Service: `to: { chain: "Arc_Testnet", useForwarder: true }`, fee ~$0.05-0.20 USDC, `feePayment: "source"`. One-click bridge-in, no Arc gas.
- Non-USDC bridging is live (Circle announcement ~Oct 30 - Nov 2): Arc's supported-tokens page lists USDC, EURC, WETH, cirBTC and third-party assets registered with CCTPx. Non-USDC goes via `CrossChainTokenService` + per-token manager (not TokenMessengerV2). Issuers deploy a new crosschain token or connect an existing ERC-20 via custom token config.
- Oracles on Arc: Chainlink, Pyth, Redstone, Stork. Stablecoin FX (USDC/EURC) available.
- No Ondo/xStocks tokens found registered on Arc yet.

## Doc discrepancy to remember
Some Arc pages (Bridge page, provider README, `llms.txt`) still say "USDC and EURC only" while the supported-tokens page and Circle news say WETH, cirBTC and CCTPx third-party assets. Docs lag the product. Always re-check fresh before relying on either.

## CCTP for non-USDC assets (Circle "expanded assets", found Nov 5 night)
Docs: https://developers.circle.com/cctp/expanded-assets (the page Arc linked for this prize). A permissionless contract layer, entry point `CrossChainTokenService` (not TokenMessengerV2), fees paid in native gas, same Iris attestation. Four paths:
1. Pre-configured tokens (EURC): no setup.
2. **Custom token**: issuer configures its own ERC-20, keeps rate limits and pause control (burn-mint manager).
3. **Ownerless token**: bridge an *existing* ERC-20 with protocol defaults. Home chain: `LOCK_UNLOCK` (token locked in a manager). Remote chains: protocol deploys a wrapped `CrossChainToken` (`NATIVE_CROSSCHAIN_TOKEN`, burn-mint). Steps: `registerOwnerlessToken(token)` on the home chain, read `tokenId`, fetch Iris quote (`msgType: "DeployTokenMessage"`), `deployRemoteOwnerlessToken` per destination, verify with `resolveTokenAddress`/`resolveTokenManager`, check remote rate limit > 0. Register on exactly ONE home chain, or supply locks with no release.
4. Deploy a native crosschain token (CREATE3 deterministic address).
- **This is lock-and-mint, built in by Circle.** The "lock the stock on the origin chain" premise is the ownerless model; we don't need to write our own vault. Backing = the original token locked at home; the wrapped token on Arc is a claim on it.
- Testnet: `CrossChainTokenService` at `0x63753E722bd2C2A5DF6EE19C5106662208B81077` on both Ethereum Sepolia (domain 0) and Arc Testnet (domain 26) (sandbox, CREATE3).
- Unverified: whether `registerOwnerlessToken` is truly permissionless (docs call the layer permissionless but state no access control on that call); compatibility with fee-on-transfer, rebasing and permissioned (compliance-gated) tokens, which tokenized stocks often are. Test it.
- **Plan impact:** Testnet MVP = deploy tAAPL ERC-20 on Sepolia (home), register ownerless, deploy remote on Arc Testnet, bridge via Bridge Kit/CCTP, settle against USDC on Arc. Real stocks (Ondo/xStocks on Ethereum) could in principle be registered ownerless with Ethereum as home, but their transfer restrictions may break it. Read the risks before any mainnet test.

## Key design question: where does backing live?
- **Real stocks**: someone must custody the real share (or hold the issuer's token) and the token must be redeemable. Burn-and-mint (CCTP) moves the token's *supply* across chains; the backing sits with the issuer, not in a bridge lock. Options: (a) issuer registers its token with CCTPx (Ondo/xStocks would do this), (b) lock-and-mint wrapper: lock the origin-chain stock token in a vault, mint a wrapper on Arc, (c) CCIP.
- **Hackathon testnet**: no real backing exists either way. We can deploy a test ERC-20 (tAAPL) as issuer and show real burn-and-mint movement; price comes from an oracle. Value is illustrative only.

## Arc prize requirements (read Nov 5, 2026, ETHGlobal Mumbai prizes page)
- Every Arc prize requires **Arc Studio as the starting point**: a shareable Studio project URL judges can open, Studio shown in the demo, video + presentation, architecture diagram, GitHub/Replit repo. Choose a specific bounty in the submission.
- Target bounty: **Best Use of Bridge Kit for Non-USDC Assets, Built in Arc Studio ($3,000)**: an app, protocol or dev tool using CCTP via Bridge Kit for non-USDC assets to make them meaningfully crosschain; single simple user flow; flows settling or pairing with USDC/EURC on Arc. Our stock-token bridge + USDC settlement fits this directly.
- Also possible: Best DeFi / Onchain Finance App Built End to End in Arc Studio ($3,000).

## Arc Studio and CLI
- Arc Studio: AI coding agent that writes, previews and deploys a full-stack app (contracts, UI, backend, tests) on Arc **testnet only**. Site: https://studio.arc.io, docs: https://docs.arc.io/ai/arc-studio-cli
- CLI: `arc-studio login` (browser device link; `--paste` or `ARC_STUDIO_TOKEN` for headless), `arc-studio run "<prompt>"`, `arc-studio open`, `arc-studio pull`, `arc-studio deployments`, `arc-studio usage`. Install guide: https://docs.arc.io/ai/arc-studio-cli-install.md
- Claude Code: `arc-studio skills install --tool claude-code` (also Circle skills via `/plugin marketplace add circlefin/skills`, skill `use-arc`). Each app gets a `webUrl` = the shareable project URL.
- Limits: prompts max 10,000 chars (`--file` for longer), 50 min default timeout, usage limits.
- Workflow idea: start the project in Arc Studio (satisfies the rule), then `pull` the code and keep iterating in Claude Code, keeping the Studio URL as the submission link.

## Open questions
1. CrossChainTokenService is live on Arc testnet (see above). Still open: is `registerOwnerlessToken` permissionless, and does it work with our test token on Sepolia?
2. Does Bridge Kit accept a custom/ownerless token address, or do we call CrossChainTokenService directly?
3. Which issuers (Ondo, xStocks, others) plan to register on Arc, and when? Ask the Arc team.
4. Arc prize rules: exact Arc Studio / Bridge Kit requirements.
5. Compliance angle for tokenized stocks (transfer restrictions, geo-limits).

## MVP
1. Fresh-wallet testnet bridge: Sepolia USDC -> Arc testnet with `useForwarder: true`.
2. Deploy test stock token(s) on Sepolia and Arc testnet.
3. Price feed on Arc (Pyth/Chainlink/Stork).
4. Terminal UI: balance, price, buy/sell against USDC on Arc.
5. Bridge a stock token across (path decided by open questions 1-2).

## Stretch
CCIP route (2.0 prize), Stablecoin FX for EUR users, ENS names, Definitive Flash.

## Log
- 2026-11-05: repo created. Wiki detail: https://wiki.superd.app/doc/arc-bridge-kit-stock-terminal-settlement-SuAj6Az1IB

- 2026-11-05 (night): added Arc prize rules and Arc Studio CLI.

- 2026-11-05 (late): added CCTP non-USDC (expanded assets) findings; this is the official lock-and-mint path.
