# 0001. Bridging path for the stock token: Bridge Kit by token id, raw CrossChainTokenService as fallback

- Status: superseded by 0013
- Date: 2026-11-06
- Deciders: alle, user

## Context
The stock token (working name tAAPL, see ADR 0002) must move between Arc testnet and at least one other testnet with CCTP for non-USDC (CCTPx), using burn-and-mint. The Arc track "Best Use of Bridge Kit for Non-USDC Assets, Built in Arc Studio" asks for "CCTP via Bridge Kit for non-USDC assets" (see ADR 0007), so Bridge Kit must be on the main path if we can make it work.

Sources (all fetched 2026-11-06 IST):
- `@circle-fin/provider-cctpx` 1.0.7 README and CHANGELOG (npm tarball, published 2026-11-05), the CCTPx provider used by `@circle-fin/bridge-kit` 1.17.1:
  - `BridgeParams.token` accepts `'USDC'`, a known CCTPx symbol (`cirBTC`, `wETH`, `EURC`) or a **bytes32 CCTPx token id**. It does not take a token contract address.
  - A route is valid only if both chains are EVM chains on the same network with a CrossChainTokenService (CCTS) deployment and the Iris registry (`GET /v2/cctpx/tokens`) lists the token on both domains. `provider.refreshTokenRegistry()` forces a refresh and `supportsRoute(...)` checks a route.
  - The CCTPx provider always forwards: `useForwarder: false` is rejected. `feePayment: 'destination'` is rejected, so fees are paid on the source chain. A FAST request falls back to SLOW when the fast-burn allowance is missing or cannot be read.
  - The testnet CCTS address in the package (`chains.mjs`) is `0x63753E722bd2C2A5DF6EE19C5106662208B81077`.
- Arc App Kit SDK reference: https://docs.arc.io/app-kit/references/sdk-reference.md
- Arc supported blockchains: https://docs.arc.io/app-kit/references/supported-blockchains.md says Bridge supports "USDC, EURC, WETH, cirBTC, and third-party assets registered with CCTPx".
- Circle CCTPx transfer flow: https://developers.circle.com/cctp/expanded-assets/quickstarts/transfer-eurc-ethereum-to-arc and https://developers.circle.com/cctp/expanded-assets/concepts/architecture
  1. Approve the TokenManager, not the CCTS.
  2. Get a quote: `POST {IRIS}/v2/quote/cctpx/{tokenId}/{src}/{dst}` with an optional FORWARD request. The response gives `signedQuote` and `feeTotalAmount`.
  3. Call `crossChainTransfer(...)` with `value = feeTotalAmount`.
  4. If the transfer is not forwarded, poll `GET /v2/messages/{srcDomain}?transactionHash=` and call `receiveMessage` on the destination MessageTransmitterV2.
- Iris sandbox registry, `GET https://iris-api-sandbox.circle.com/v2/cctpx/tokens` (paged, fetched 2026-11-06):
  - 1021 tokens in total; 713 are listed on both domain 0 (Ethereum Sepolia) and domain 26 (Arc testnet).
  - Most are ad-hoc third-party test tokens ("Test Token", "Spike Mint", "Mock Tether USD" and others). This strongly suggests that self-deployed tokens get indexed automatically.
  - The entries do not expose the TokenManager type.
- Onchain reads on 2026-11-06 IST via https://rpc.testnet.arc.io (chain id 5042002) and a public Sepolia RPC:
  - CCTS `0x6375...1077` has code on both chains.
  - Arc `isTrustedDomain(0) = true`, `isTrustedDomain(6) = true`, `isTrustedDomain(26) = false` (self).
  - Sepolia `isTrustedDomain(26) = true`.
  - `resolveTokenAddress(sandbox WETH id)` returns the expected addresses on both chains.
  - For an unknown id it reverts with `TokenNotRegistered(bytes32)` (selector `0x5d0028cf`).

Discrepancies between sources (reported, not resolved):
- https://docs.arc.io/app-kit/bridge.md still says Bridge moves "USDC and EURC" only. The supported-blockchains page, the SDK reference and the provider README say any registered CCTPx token by id.
- In the native-token quickstart, step 6 polls `resolveTokenAddress` and expects a zero address. The architecture page and the onchain call show that it reverts with `TokenNotRegistered` instead. Code must handle the revert.

## Options considered
1. **Bridge Kit (`kit.bridge`) with the bytes32 token id**
   - Pros: matches the track wording; one call handles approve, quote, burn, attestation and forwarded mint; no destination gas; gives typed errors and events.
   - Cons: depends on Iris registry indexing of our token (not yet proven for our own deployment); forwarding fee is always charged; Sepolia-source transfers run at SLOW (Ethereum finality) unless a fast-burn allowance exists, and our token has no FX symbol.
2. **Raw CCTS calls (viem): quote, `crossChainTransfer`, then poll Iris and call `receiveMessage`**
   - Pros: no registry dependency; full control; forwarding is optional.
   - Cons: more code; does not show Bridge Kit, so it is weaker for the track; the user needs gas on the destination when not forwarded.
3. **Chainlink CCIP for the stock token**
   - Pros: there is a separate Chainlink CCIP track.
   - Cons: not Circle tooling; it would replace the Arc track story, and it is a stretch item in PLAN.md only.

## Decision
Proposed: use option 1 as the user-facing path, with option 2 kept in `scripts/` as a fallback and debugging tool. Option 3 stays a stretch item.

Demo direction: the main demo bridges tAAPL **from Arc to Ethereum Sepolia** (Arc has sub-second finality, so attestation should be quick). Sepolia to Arc is also supported but is expected to take Ethereum-finality time at SLOW. Base Sepolia (domain 6) is a second destination only if the spike shows it is equally simple.

This becomes `accepted` once T-006 shows a Bridge Kit transfer of our own token id in both directions between Arc testnet and Sepolia.

## Consequences
- The app has to store the token id (bytes32), not just the token addresses.
- The UI has to show long-running states (PENDING, SENT, CONFIRMED, COMPLETE, FAILED) and must survive a page reload mid-transfer.
- If registry indexing of our token fails or is slow, we fall back to option 2 and say so in the README. That weakens the track fit.

## Not verified
- That a token we deploy ourselves appears in the Iris sandbox registry on both domains, and how quickly.
- Actual end-to-end time and fee for Arc to Sepolia and Sepolia to Arc in Bridge Kit.
- Whether the Bridge Kit CCTPx flow works in the browser with `@circle-fin/adapter-viem-v2` (it is documented for viem; browser use is not tested).
