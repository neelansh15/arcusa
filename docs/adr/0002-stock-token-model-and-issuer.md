# 0002. Stock token model: native CrossChainToken issued by arcusa, synthetic and USDC-backed on testnet

- Status: superseded by 0012
- Date: 2026-11-06
- Deciders: alle, user

## Context
We need a token that represents exposure to one US stock (start with AAPL, working symbol `tAAPL`). It must move crosschain with CCTP for non-USDC (ADR 0001) and be mintable and burnable by our market contract on Arc (ADR 0005). No real tokenized-stock issuer is registered on Arc. The wiki analysis of 2026-11-05 found no Ondo Global Markets or xStocks deployment on Arc, and this was not re-checked today. So on testnet arcusa itself is the issuer.

Sources (fetched 2026-11-06 IST):
- Ownerless vs custom: https://developers.circle.com/cctp/expanded-assets/concepts/ownerless-vs-custom-tokens
  - Ownerless is for "community assets without an active issuer". Circle can take control of it, and it cannot be paused or rate-limited by us.
  - Custom tokens keep full issuer control. Remote chains always use BURN_MINT, and LOCK_UNLOCK may be used on only one chain.
- Native token quickstart: https://developers.circle.com/cctp/expanded-assets/quickstarts/deploy-native-crosschain-token
  - `deployCrossChainToken(salt, name, symbol, decimals, params)` deploys the token and a `NATIVE_CROSSCHAIN_TOKEN` TokenManager in one transaction, using CREATE3.
  - The same deployer and salt on another chain give the same token id.
  - There is no fee on testnet.
  - Every TokenManager starts with a rate limit of zero.
- Custom token quickstart: https://developers.circle.com/cctp/expanded-assets/quickstarts/configure-custom-token
  - Flow: `registerCustomToken(salt, token, params)`, then grant the TokenManager the minter role, then set a non-zero rate limit.
- Contract reference: https://developers.circle.com/cctp/expanded-assets/references/contract-reference
  - `CrossChainToken` exposes `mint`, `burn`, `burnFrom`, `addMinter`, `removeMinter`, ERC-20 and ERC20Permit, plus a per-token denylist.
  - Address fields in `DeploymentParams` are `bytes` packed to 20 bytes.
  - "Some deployments omit `initialSupply` from the onchain ABI (for example current sandbox `registerCustomToken`) ... verify the live ABI."
- Rate limits: https://developers.circle.com/cctp/expanded-assets/howtos/configure-rate-limits-and-caps
  - The default window is six hours.
- Independent news on the Circle post of 2026-10-30, which described a native path and a custom path "starting on Arc testnet":
  - https://blockchain.news/news/circle-cctp-non-usdc-erc20-arc (2026-10-30)
  - https://crypto.news/circle-expands-cctp-support-to-custom-erc-20-tokens-on-arc/ (2026-11-02)

Discrepancies between sources (reported, not resolved):
- **`maxTransferAmount = 0`.** The quickstarts describe 0 as "no per-transfer cap". The rate-limits how-to says "Setting `maxTransferAmount` to `0` blocks all outbound transfers. Use `type(uint256).max`" to disable the cap. We will set an explicit value and test it.
- **`initialSupply`.** The field may or may not be in the live ABI, depending on deployment.
- **Lock-and-mint.** Circle's agent header on the docs says CCTP "supports permissionless wrapping of third-party assets via lock-and-mint". The CCTPx pages describe burn-and-mint for custom and native tokens. Our path is burn-and-mint.

## Options considered
1. **Native CrossChainToken (`deployCrossChainToken` on Arc and on Sepolia)**
   - Pros: no token contract to write or audit; the TokenManager is wired in the same transaction; the per-token denylist is available; `addMinter` lets the market contract mint.
   - Cons: the token logic is Circle's implementation, so features like pausing trading or oracle hooks live in our market contract, not the token; the demo shows less of our own Solidity.
2. **Custom BURN_MINT ERC-20 written by us (in Arc Studio) plus `registerCustomToken` on both chains**
   - Pros: we own the token code (roles, pause, metadata); it shows Studio's Smart Contract mode.
   - Cons: more steps (deploy, register and grant minter on each chain); the sandbox ABI difference on `initialSupply`; the Sepolia deployment has to happen outside Studio, because Studio deploys to Arc testnet only.
3. **Ownerless token**
   - Pros: none for us.
   - Cons: it is meant for tokens with no issuer; we lose rate limits and pause, and Circle could take control.
4. **Lock-and-mint wrapper of a third-party stock token**
   - Pros: real backing if a real issuer token existed.
   - Cons: no such token on these testnets; replaced on 2026-11-06 by own-issuer burn-and-mint (see PLAN.md Log).

## Decision
Proposed: option 1.
- Deploy `tAAPL` as a native CrossChainToken with the same deployer and salt on Arc testnet and on Ethereum Sepolia, with 18 decimals on both chains. Decimals must match on all chains.
- The token is a **synthetic, testnet-only** claim. Its only backing is the USDC held by the arcusa market contract on Arc (ADR 0005). It is not a share and not a claim on a share.
- On Arc, `addMinter(market)` lets the market contract mint on buy and burn on sell. The CCTS TokenManager handles bridge mint and burn.
- Set a non-zero rate limit and an explicit `maxTransferAmount` on both chains. Do not use 0.

Option 2 is the fallback if the spike (T-005) finds a blocker, for example if `addMinter` is not available to the token owner.

## Consequences
- Total supply across chains is conserved by burn-and-mint. The market contract's liability is (total supply on all chains) x (price).
- Holders on Sepolia must bridge back to Arc to sell.
- One token per stock. Adding a second stock means another `deployCrossChainToken` with a new salt.
- Keep the deployer key in `.env` only, never in the repo. The same deployer must be used on every chain.

## Not verified
- That `deployCrossChainToken` works on Arc testnet itself. The quickstart example uses Ethereum Sepolia and Base Sepolia.
- That the token owner can call `addMinter` for a non-TokenManager address on a native token.
- The real meaning of `maxTransferAmount = 0` on the live contracts.
- Whether `initialSupply` is in the live `deployCrossChainToken` ABI on each chain.
- Whether Ondo, xStocks or another issuer has registered on Arc since 2026-11-05. This was not re-checked today.
