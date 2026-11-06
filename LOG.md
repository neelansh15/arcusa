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

## 2026-11-06 13:08 T-024 (see 13:12 correction): lock and mint works, timings
- Bridge Kit accepts the mNVDA tokenId as `token` (`kit.bridge({from, to:{useForwarder:true}, amount, token: tokenId, config:{feePayment:'source', transferSpeed:'SLOW'}})`).
- The default transfer speed is FAST. With FAST the approve step passed but the `transfer` step reverted in simulation on both chains (`ONCHAIN_SIMULATION_FAILED`, no revert reason). Likely cause, not proven: FAST needs a PRE_FINALITY quote item that is not configured for this token. `transferSpeed: 'SLOW'` works.
- Sepolia to Arc, 10 mNVDA (lock and mint): approve, transfer, fetchAttestation, forward all `success`. 965 s (about 16 min), dominated by Sepolia finality. After it, locked mNVDA 10 and wNVDA supply 10 (before the return leg).
- Arc to Sepolia, 5 mNVDA (burn and unlock): started 13:06 IST, burn done (wNVDA supply 5), unlock on Sepolia pending at time of writing.
- What took ~23 min in T-022 was the wrapper contract creation on Arc (DeployTokenMessage, Sepolia finality). It is a one-time cost per token. A transfer into Arc costs about 16 min in SLOW mode.
- Demo implication: pre-bridge the tokens and show the live bridge as a status view, not a wait.
- Script: contracts/scripts/spikes/t024.ts (to be pushed).

## 2026-11-06 13:12 T-024 done: correction, both directions work
- Correction to the 13:08 entry: Arc to Sepolia (5 mNVDA, burn and unlock) is complete. Approve, transfer, fetchAttestation and forward all `success`, in 28 s (the 13:08 entry wrongly called the unlock pending).
- Final state: wNVDA totalSupply 5 and locked mNVDA 5 on Sepolia, so locked equals wrapped (lock-and-mint accounting holds after a round trip).
- Timings: into Arc about 16 min (Sepolia finality), back to Sepolia 28 s (Arc finality is fast).
- Still unverified: Fast Transfer (FAST reverts in simulation; reason unknown), and Bridge Kit in a browser bundle.

## 2026-11-06 18:40 Arc market contracts deployed, first buy and sell done
- Contracts (sources in contracts/arc/src, compiled with solc-js, cancun, optimizer 200; ABIs in app/src/lib/abi/; addresses in deployments/arc-testnet.json):
  - PriceOracle 0xcd92cc2ff8d630a93090c203463843ffd685f83d (deploy tx 0x00af8953...ed489f). Relayer-updated price, 8 decimals, maxStaleness 300 s, confidence and deviation guards, demoMode true (serves stale prices off-hours).
  - InventoryMarket 0x8046c2bcb05c8750772bfcc2109659c85f3b10f4 (deploy tx 0xa01b539e...e699b07). USDC (6 dec) <-> wNVDA (18 dec) at oracle price with a spread; per-session spread and trade caps; offHoursTrading true; owner deposit/withdraw; pause; reentrancy guard.
- Deployed with viem from the throwaway wallet (the Arc Studio CLI route was not used: the container install of the Studio CLI never completed, and I have not tried the Studio deploy flow yet. If the prize needs a Studio-deployed contract, redeploy through Studio).
- Price set from the xStocks price-data endpoint: 188.738 (no timestamp, session recorded as Closed).
- Seeded inventory: 3 wNVDA and 8 USDC. Real trades on testnet: buy 5 USDC for 0.025972 wNVDA (tx 0xccbfdfa8...3c600c6), then sell it back for 4.803921 USDC (tx 0xf089a3b0...c54082ba). The round trip cost 0.196 USDC, which is the 2% spread each way in the Closed session. The quoted amounts match the hand calculation.
- Not tested: the contract test suite (only the on-chain buy and sell were exercised), pause, owner withdraw, caps and slippage reverts.
- Scripts: contracts/scripts/spikes/{compile-arc,deploy-arc,trade-arc}.mjs.
- Process note: background agents are killed when my turn ends, so earlier agent runs lost their work; work now runs in my own turn.

## 2026-11-06 19:20 UI redesign, price service, oracle relayer
- UI rebuilt as a trading terminal (stats strip, candlestick chart, buy/sell ticket, market panel, balances/trades/bridge tabs). Bid/ask, oracle, inventory and trades are live reads from the Arc contracts. The ticket does approve then buy/sell with 1% slippage and the 25 gwei fee. Not yet tested with a wallet in a browser.
- xStocks `price-data` returns only `{"quote": n}` (no timestamp). /price-history, /history, /chart, /candles return 404 (not an exhaustive search), so we ingest ourselves.
- services/price: Node + node:sqlite polls every 5s; /api/price, /api/candles, /api/ticks. Live at https://arcusa-api.superd.app (systemd arcusa-price, Caddy, port 4301).
- Oracle relayer: new throwaway key authorised via setRelayer (address 0xB4964152cD9A6f971446E40b23Ed7513da26faE0, funded 1 USDC; key only on the server and in the agent secrets dir). systemd arcusa-relayer pushes when the price moves >0.1% or every 60s. First update tx 0xfa4cadbd36d40f343d50f7ed68e775e0c2ae86a19e88038a3c8e68d611cffe7f. The oracle is no longer stale.

## 2026-11-07 mTSLA: second wrapped token, Sepolia side done (runbook deploy-wrapped-token)
- Added contracts/sepolia/src/MockTSLAToken.sol (copy of the mock with name "Mock Tesla (testnet)", symbol mTSLA). Compiled with solc-js 0.8.38 (runbook says 0.8.30), cancun, optimizer 200.
- Sepolia, from the throwaway testnet wallet: mTSLA 0xbd0ae58afe2d6c42a3b31f8d97b31093fcbc8bdf (deploy tx 0x1e20e2a0...a8130), mint 1000 (0x11617f92...a216614), registerOwnerlessToken (0x88b72ca6...6c1f7), deployRemoteOwnerlessToken (0xd4d0e7ba...596f1, success).
- tokenId 0x7f1c9fb53db47fd1c05448f8551ce0db9d2a30cdd4836c55ab890597f278f930. Sepolia manager 0xc49A72ceF1c4cDA64A4a12aBA9859a0E3BFE877f, which equals the Arc manager but differs from the mNVDA manager 0x276f...601b. The runbook's fixed-address table lists the NVDA manager only; the manager is per token.
- Register worked first time, quote returned 200, no TokenNotRegistered retry was needed.
- Arc wrapper wTSLA 0xD6bB2FFfCc37845fe44767E40569b801c9F9afd5 appeared 1168 s (about 19.5 min) after the deploy tx. Verified on Arc: name "Mock Tesla (testnet)", symbol mTSLA, decimals 18, totalSupply 0. Manager token() is the wrapper on Arc and mTSLA on Sepolia; locked 0.
- Market: TSLA PriceOracle 0xf17f5449be304de315e48eee44cf889e8e47867d (tx 0xd8b694e1...fb59) and InventoryMarket 0x7872ad4bb1a18b63140d4df0fe31af451470f0f3 (tx 0xff278d02...908b4), same sources and compile settings as NVDA. First price 360.674 from xStocks TSLAx (tx 0xb59157a5...19934), demoMode and offHoursTrading on, relayer 0xB496...faE0 authorised (tx 0xbf9a66fc...577b3). No trade made yet.
- First bridge: 10 mTSLA Sepolia to Arc with Bridge Kit, tokenId as token, SLOW, completed in 1139 s (approve, transfer 0x7746bbbd...a22d, attestation, forward all success). Accounting: locked on Sepolia 10, wTSLA totalSupply 10 on Arc, equal.
- Inventory: deposited 5 wTSLA (0xb9a06452...0781) and 8 USDC (0xff1ba387...867e) into the TSLA market.
- Wrapper creation took 1168 s (about 19.5 min), the bridge about 19 min.
- Scripts (parametrised, read the key from ~/.arcusa): contracts/scripts/second-token/.
- NOT done: server price service and relayer are not configured for TSLA (oracle goes stale after 300 s); no TSLA trade, pause, withdraw or cap tests; the app UI is still NVDA only.

## 2026-11-07 TSLA in the app and the price service
- services/price/server.mjs: multi-symbol (`SYMBOLS`, default NVDA,TSLA), `?symbol=` on all `/api/` routes, NVDA keeps the `ticks` table. Tested locally: NVDA 187.1, TSLA 358.2, unknown symbol gives 400, candles and ticks per symbol. Relayer unchanged, one instance per asset (README). Not deployed: needs T-054 on the server.
- App: `lib/assets.ts` carries the per-asset market, oracle, token and deploy block. NVDA and TSLA are live in the picker and the trade page switches price, market quote, balances, trades and ticket (ADR 0024). `tsc` and `oxlint` pass. Checked in the in-app browser: picking TSLA shows wTSLA in the ticket, the TSLA price from the app's own fallback route (the production ingest still answers NVDA, so the UI rejects it by symbol), and "Oracle price is stale" because no relayer feeds the TSLA oracle yet.
- NOT verified: a real TSLA buy or sell with a wallet, mobile layout of the switch, chart history for TSLA (needs the server).

## Not verified yet
- Whether Bridge Kit can move mNVDA by token id (T-024).
- Fast Transfer availability for mNVDA (T-024; the docs expect `FX_SYMBOL_NOT_CONFIGURED`).
- Itemised forwarding fee for USDC.
