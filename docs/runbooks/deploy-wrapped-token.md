# Runbook: deploy a new wrapped token on Arc

Goal: take a token on a source chain (testnet: Sepolia) and get its wrapped twin on Arc, bridgeable by Circle's ownerless CCTPx path (ADR 0012, 0013). Written from LOG.md T-022 and T-024 (2026-11-06). Everything below was done once, for mNVDA. Nothing here has been run for a second token.

## Fixed addresses (testnet)

| Item | Value |
| --- | --- |
| CCTPx service (CCTS), same call surface on Sepolia | `0x63753E722bd2C2A5DF6EE19C5106662208B81077` |
| Ownerless token manager (same address on both chains) | `0x276fACA17FA1C19A0d9B4f1B190C89c2d28C601b` |
| Iris sandbox API | `https://iris-api-sandbox.circle.com` |
| CCTP domains | Sepolia 0, Arc 26 |
| Arc | chainId 5042002, RPC `https://rpc.testnet.arc.io`, gas paid in USDC, use `maxFeePerGas` 25 gwei |
| Arc USDC (ERC-20 interface) | `0x3600000000000000000000000000000000000000` |

## Prerequisites

- A deployer wallet funded with Sepolia ETH (about 0.003 ETH covers register + remote deploy, see docs/gas-costs.md) and some Arc USDC.
- The private key lives outside the repo. Scripts read it from a path; never paste it into chat, commits or logs.
- Node with viem. Foundry or solc 0.8.30 (cancun, optimizer 200) plus OpenZeppelin 5 only if you deploy a mock token.
- A reliable Sepolia RPC. Right after registering, a stale backend may answer `TokenNotRegistered` (0x5d0028cf) for several minutes. Retry, do not re-register.

## Steps

1. **Source token.** Mock: deploy `contracts/sepolia/src/MockProviderToken.sol` (constructor arg: owner) and mint some. Real issuer token: it must already exist; you only need its address. Check compliance first (ADR 0016): allow/deny lists and pausing can break lock-and-mint.
2. **Register.** On the source chain call `registerOwnerlessToken(token)` on the CCTPx service. It is permissionless (any EOA can register a token it does not control). Simulate first. Then read `getOwnerlessTokenId(token)` (bytes32 tokenId) and `resolveTokenManager(tokenId)`. Save the tokenId.
3. **Quote.** `POST {IRIS}/v2/quote/cctpx/{tokenId}/0/26` with body
   `{"amount":"1","feeToken":"0x0000000000000000000000000000000000000000","requests":[{"type":"FORWARD","params":{"msgType":"DeployTokenMessage","autoExecuteHookData":false}}]}`.
   The response has `signedQuote` and `feeTotalAmount` (wei). Quoted fee for mNVDA: 0.00014272 ETH.
4. **Deploy the remote wrapper.** On the source chain call `deployRemoteOwnerlessToken(token, 26, {signedQuote, refundAddress: 0x000...0})` on the CCTPx service with `value = feeTotalAmount`. Simulate first. No transaction on Arc is needed from us.
5. **Wait.** The wrapper appears on Arc after Sepolia finality: about 23 min for mNVDA. Poll `resolveTokenAddress(tokenId)` on the Arc service (it reverts or returns zero until ready). Iris `GET /v2/messages/0?transactionHash=<tx>` shows `pending_confirmations` then `complete`.
6. **Verify the wrapper.** On Arc read `name`, `symbol`, `decimals` (they mirror the source token), `totalSupply` (0 before any bridge). On the source chain `token()` of the manager is the source token, on Arc it is the wrapper. Optionally read manager `paused`, `rateLimit`, `maxTransferAmount`, `rateLimitWindow` (probed by name, not in Circle's reference page, may change).
7. **First bridge.** Use Bridge Kit (`@circle-fin/bridge-kit`) with the tokenId as `token`:
   `kit.bridge({from:{adapter, chain:'Ethereum_Sepolia'}, to:{chain:'Arc_Testnet', recipientAddress, useForwarder:true}, amount, token: tokenId, config:{feePayment:'source', transferSpeed:'SLOW'}})`.
   Always `SLOW`. `FAST` reverted in simulation for mNVDA (reason unknown). Timing: Sepolia to Arc about 16 min, back about 28 s.
8. **Check accounting.** Locked on the source chain (source token `balanceOf(manager)`) must equal wrapper `totalSupply` on Arc. Verified for mNVDA after a round trip (5 and 5).

## Record the addresses

- `deployments/arc-testnet.json`: add the wrapper address, tokenId, source token and its deploy tx.
- `app/src/lib/config.ts` and `app/src/app/docs/docs-contracts.ts`: add the asset (and the Docs contract pages).
- `LOG.md`: dated entry with tx hashes and timings.

## Make it tradable

The market is per asset. For each new wrapped token deploy a new `PriceOracle` and `InventoryMarket` (see `contracts/scripts/spikes/deploy-arc.mjs`: `PriceOracle(owner, 300)`, then `InventoryMarket(owner, USDC, wrapper, oracle)`), push a first price, authorise the relayer (`setRelayer`, see `setup-relayer.mjs`), then have the owner deposit inventory (wrapped token and USDC). Add the symbol to the price service and relayer config. Check `demoMode` and `setOffHoursTrading` are what you want before going live.

## Expected cost (from docs/gas-costs.md)

Register about 2.5M gas, remote deploy about 305k gas plus the Iris fee (0.00014 ETH), both on Sepolia. Arc side: nothing for wrapper creation.

## Caveats and not verified

- Only done for one token (mNVDA). A second token has not been run.
- The spike scripts (`contracts/scripts/spikes/t022a` to `t022e`, `t024.ts`, `lib.mjs`) hard-code `/workspace/agent/...` paths, a state file and the mNVDA artifact; `deploy-arc.mjs` hard-codes the wNVDA address. Treat them as references and parametrise before reuse.
- Whether a real issuer token (with its own pause/deny-list) can be registered and bridged the same way is untested (ADR 0016).
- Mainnet: the Iris sandbox URL, domains and fees differ; not checked.
- The manager owner is an address we do not control (`0x173d...9F94`, probably Circle's); we cannot change rate limits.
