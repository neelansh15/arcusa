# Build log

Newest entries at the bottom. Times are IST (UTC+5:30). Testnet only. Every address below is a throwaway.

## 2026-11-06 12:00 Throwaway testnet wallets
- Main spike wallet: 0x07621e39424914f633D478DdE751f3FF728CB351. Funded by the user with 20 USDC on Arc testnet, 0.05 ETH and 20 USDC on Ethereum Sepolia (12:09).
- Fresh wallet for T-004: 0x11612f047168C03403107e8f264E0Aa12Db048e8. Funded from the main wallet on Sepolia only (0.01 ETH, 5 USDC).
- Keys live in a root-only file on the agent's host-backed disk. They are not in this repo and not in chat.

## 2026-11-06 12:12 T-004 passed: USDC bridge-in with Forwarding
- Bridge Kit `@circle-fin/bridge-kit` 1.17.1, adapter `@circle-fin/adapter-viem-v2` 1.20.1, viem 2.57.16, Node 22.23.3.
- Call: `from: Ethereum_Sepolia`, `to: { chain: "Arc_Testnet", recipientAddress, useForwarder: true }`, `config: { feePayment: "source" }`, amount 1 USDC. Transfer speed came back as FAST.
- Result: the fresh wallet ended with 1.000000 USDC (ERC-20 view) on Arc and nonce 0 on Arc, so it sent no Arc transaction. Its native balance on Arc is 1 USDC at 18 decimals, as ADR 0003 expects.
- Time: 43 s from call to forwarded mint.
- Fee: about 0.017 USDC, paid on the source chain. The wallet went from 5.000000 to 3.982766 USDC on Sepolia for a 1.0 transfer. Bridge Kit's result did not itemise the fee (`fees` was null), so the split between the Forwarding fee and the Fast fee is not recorded.
- Burn on Sepolia: https://sepolia.etherscan.io/tx/0x0fe962146b1f35f881d462196b6c94c47e317d5437448ceb1cc8a7883f77a899
- Forwarded mint on Arc: https://testnet.arcscan.app/tx/0x4cf08cd4c4edffb3cc58706d3478b1f479ecc2fa0709f54373bf53d3dbab3500
- Docs note: Bridge Kit's chain table gives the Arc explorer as https://testnet.arcscan.app, while ADR 0003 cites https://explorer.testnet.arc.io.

## 2026-11-06 12:27 T-022 in progress: mNVDA registered, wrapper pending
- mNVDA (contracts/sepolia/src/MockProviderToken.sol, compiled with solc 0.8.30 and OpenZeppelin 5 from npm, cancun, optimizer 200) deployed on Sepolia at 0xecd2332b5e119c0a34dbd80043ec54cd1a9b7423. Deploy tx 0xb138a26cd1213dd6a8e7320fc87fd995e7b0d9f963c8de4d3f600d4d21342337.
- 1000 mNVDA minted to the main wallet.
- `registerOwnerlessToken(token)` on the CCTPx service 0x63753E722bd2C2A5DF6EE19C5106662208B81077 succeeded and a simulation passed first. The tx was sent by a plain EOA, which is the "anyone can register a token they do not control" question in T-022: yes, nothing blocked it.
  - tokenId: 0x9aba200723d57aa177e725ed5d5b230b9435824c339227e47b9ca552a16d218d
  - Sepolia TokenManager: 0x276faca17fa1c19a0d9b4f1b190c89c2d28c601b
- RPC quirk: right after registering, `resolveTokenManager(tokenId)` reverted with `TokenNotRegistered` (0x5d0028cf) for several minutes on publicnode's Sepolia RPC. It resolved correctly on a later call. It looks like a stale RPC backend, not a protocol behaviour. This is a `TokenNotRegistered` case that scripts must retry.
- Iris quote for the DeployTokenMessage (domain 0 to 26) cost 142720395729835 wei (0.00014272 ETH). `deployRemoteOwnerlessToken(token, 26, {signedQuote, refundAddress: 0x0})` succeeded on Sepolia: 0x4fd4052e56e5b9d38a178cc0d612715a4770db311195e1daaf71cec552b58cc0.
- Iris `GET /v2/messages/0?transactionHash=...` showed `pending_confirmations` about 10 minutes after the call (sent 12:16). `resolveTokenAddress` on Arc reverted during that time, so the Arc wrapper is waiting on Sepolia finality, not on the relayer. Next: wait for it and read the wrapper's name, symbol and decimals.

## 2026-11-06 12:40 T-022 done: wrapper live on Arc
- Iris message status `complete`. The Arc wrapper appeared about 1370s (~23 min) after the quote at 12:16 IST, so the wait was Sepolia finality, not the relayer.
- wNVDA on Arc testnet: 0x5ad2862787d5C7F42a09014CE4C973d162878a16. Arc TokenManager: 0x276fACA17FA1C19A0d9B4f1B190C89c2d28C601b (same address as the Sepolia manager).
- Wrapper metadata mirrors the source token: name "Mock NVIDIA (testnet)", symbol mNVDA, decimals 18. totalSupply 0 and locked mNVDA 0 so far, since nothing has been bridged yet.
- `registerOwnerlessToken` is permissionless: an EOA that does not control the token registered it. Cost of the remote deploy: 0.00014272 ETH.
- Next: T-024 (Bridge Kit transfer by token id, both directions, timing, Fast Transfer), then rate limit, max transfer and operator reads on both managers.

## 2026-11-06 12:55 T-022 manager checks
- Both managers (same address 0x276fACA17FA1C19A0d9B4f1B190C89c2d28C601b on Sepolia and Arc) have owner 0x173d00f7e8702d176628963FbD4E1Bcc18B29F94, which is not our wallet. It is likely Circle's ownerless-manager owner EOA; unconfirmed.
- operator and pendingOwner are the zero address. Not paused.
- rateLimit and maxTransferAmount are uint256 max (effectively unlimited). rateLimitWindow is 21600 s (6 h).
- `token()` on the Sepolia manager returns mNVDA (0xecd2...7423, LOCK_UNLOCK). On Arc it returns the wrapper 0x5ad2...a16.
- Locked mNVDA is 0 and wNVDA totalSupply is 0, so locked >= wrapped trivially holds. It must be re-checked after the first bridge in T-024.
- The getters were probed by name (`owner`, `operator`, `rateLimit` and so on) and answered; they are not in Circle's reference page, so they could change.

## 2026-11-06 13:08 T-024 in progress: lock and mint works, timings
- Bridge Kit accepts the mNVDA tokenId as `token` (`kit.bridge({from, to:{useForwarder:true}, amount, token: tokenId, config:{feePayment:'source', transferSpeed:'SLOW'}})`).
- The default transfer speed is FAST. With FAST the approve step passed but the `transfer` step reverted in simulation on both chains (`ONCHAIN_SIMULATION_FAILED`, no revert reason). Likely cause, not proven: FAST needs a PRE_FINALITY quote item that is not configured for this token. `transferSpeed: 'SLOW'` works.
- Sepolia to Arc, 10 mNVDA (lock and mint): approve, transfer, fetchAttestation, forward all `success`. 965 s (about 16 min), dominated by Sepolia finality. After it, locked mNVDA 10 and wNVDA supply 10 (before the return leg).
- Arc to Sepolia, 5 mNVDA (burn and unlock): started 13:06 IST, burn done (wNVDA supply 5), unlock on Sepolia pending at time of writing.
- What took ~23 min in T-022 was the wrapper contract creation on Arc (DeployTokenMessage, Sepolia finality). It is a one-time cost per token. A transfer into Arc costs about 16 min in SLOW mode.
- Demo implication: pre-bridge the tokens and show the live bridge as a status view, not a wait.
- Script: contracts/scripts/spikes/t024.ts (to be pushed).

## Not verified yet
- Whether Bridge Kit can move mNVDA by token id (T-024).
- Fast Transfer availability for mNVDA (T-024; the docs expect `FX_SYMBOL_NOT_CONFIGURED`).
- Itemised forwarding fee for USDC.
