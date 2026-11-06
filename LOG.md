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

## Not verified yet
- Whether Bridge Kit can move mNVDA by token id (T-024).
- Fast Transfer availability for mNVDA (T-024; the docs expect `FX_SYMBOL_NOT_CONFIGURED`).
- Itemised forwarding fee for USDC.
