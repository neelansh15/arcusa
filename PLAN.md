# arcusa - Plan

Working name: arc + USA. Living doc; iterate here.

## Goal
A stock terminal settled on Arc: US-stock exposure for non-US users, funded with USDC, bridged in via Circle tools, settled on Arc. Built to be demoable at ETHGlobal Mumbai and useful afterwards.

## Facts (verified Nov 5-6, 2026)
- Bridge Kit / App Kit: `kit.bridge()`, Arc testnet = `Arc_Testnet` (CCTP domain 26).
- Forwarding Service: `to: { chain: "Arc_Testnet", useForwarder: true }`, fee ~$0.05-0.20 USDC, `feePayment: "source"`. One-click bridge-in, no Arc gas.
- Non-USDC bridging is live (Circle announcement ~Oct 30 - Nov 2): Arc's supported-tokens page lists USDC, EURC, WETH, cirBTC and third-party assets registered with CCTPx. Non-USDC goes via `CrossChainTokenService` + per-token manager (not TokenMessengerV2). Issuers deploy a new crosschain token or connect an existing ERC-20 via custom token config.
- Oracles on Arc: Chainlink, Pyth, Redstone, Stork. Stablecoin FX (USDC/EURC) available.
- No Ondo/xStocks tokens found registered on Arc yet.
- (Nov 6, Circle docs fetched live) CCTP for non-USDC is **permissionless on testnet**: register your own ERC-20 with `registerCustomToken`, no config fee on testnet (check mainnet fees). Four paths: transfer pre-configured token (EURC, cirBTC, WETH), custom token, ownerless token, native crosschain token (CREATE3).
- Arc Testnet is supported (domain 26). `CrossChainTokenService`: testnets (incl. Arc) `0x63753E722bd2C2A5DF6EE19C5106662208B81077`, mainnet `0x431871229103b780868f8C6BB820cd16ECf942BC`. Per-token manager via `resolveTokenManager()`. Addresses are from the docs; not checked onchain.
- Non-USDC fees are paid in native gas (USDC on Arc), not deducted from the transfer. Forwarding fee is $0.05 for most destinations; $0.20-1.20 tiers are HyperCore routes.
- Gotchas: same deployer + salt on every chain or the link breaks silently; grant each TokenManager the minter role; rate limit defaults to 0 and blocks all transfers.

## Doc discrepancy to remember
Some Arc pages (Bridge page, provider README, `llms.txt`) still say "USDC and EURC only" while the supported-tokens page and Circle news say WETH, cirBTC and CCTPx third-party assets. Docs lag the product. Always re-check fresh before relying on either.

## Key design question: where does backing live?
- **Real stocks**: someone must custody the real share (or hold the issuer's token) and the token must be redeemable. Burn-and-mint (CCTP) moves the token's *supply* across chains; the backing sits with the issuer, not in a bridge lock. Options: (a) issuer registers its token with CCTPx (Ondo/xStocks would do this), (b) lock-and-mint wrapper: lock the origin-chain stock token in a vault, mint a wrapper on Arc, (c) CCIP.
- **Hackathon testnet**: no real backing exists either way. We can deploy a test ERC-20 (tAAPL) as issuer and show real burn-and-mint movement; price comes from an oracle. Value is illustrative only.

## Open questions
1. ~~CrossChainTokenService on Arc testnet? Permissionless?~~ Yes on both per docs (Nov 6). Still unproven end to end on Arc testnet: quickstarts use Sepolia + Base Sepolia.
2. Does Bridge Kit accept a custom token address? Unverified. Check the Bridge Kit repo.
3. Does the Forwarding Service work for non-USDC transfers? Docs cover USDC only.
4. Which issuers (Ondo, xStocks, others) plan to register on Arc, and when? Ask the Arc team.
5. Arc track requirements: exact Arc Studio / Bridge Kit requirements, and whether a self-issued token is accepted.
6. Compliance angle for tokenized stocks (transfer restrictions, geo-limits).

## MVP
1. Fresh-wallet testnet bridge: Sepolia USDC -> Arc testnet with `useForwarder: true`.
2. Deploy test stock token(s) (tAAPL) on Sepolia and Arc testnet; `registerCustomToken` on both with the same deployer + salt, grant minter role to each TokenManager, set non-zero rate limit.
3. Price feed on Arc (Pyth/Chainlink/Stork).
4. Terminal UI: balance, price, buy/sell against USDC on Arc.
5. Bridge a stock token across via CrossChainTokenService (burn-and-mint). Real mechanism, so no lock-and-mint wrapper needed. Fall back to raw contract calls if Bridge Kit rejects custom tokens (open question 2).

## Stretch
CCIP route (Chainlink CCIP track), Stablecoin FX for EUR users, ENS names, Definitive Flash.

## Later (after the functional MVP)
- Indexer: let users see their holdings, trades and history. This is what turns the MVP into a proper stock terminal.

## Log
- 2026-11-05: repo created. Wiki detail: https://wiki.superd.app/doc/arc-bridge-kit-stock-terminal-settlement-SuAj6Az1IB
- 2026-11-06: checked Circle expanded-assets docs live. Custom tokens permissionless on testnet, Arc testnet supported. Plan switched from lock-and-mint wrapper to own-issuer burn-and-mint. Wiki subdoc updated.
- 2026-11-06: noted indexer (holdings, trades, history) as a post-MVP item.
